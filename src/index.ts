const DAY_MS = 24 * 60 * 60 * 1000;
const EPSILON = 0.001;

export interface BayesianEvidence {
  /** Review quality in [0, 1]. 0.5 is neutral, >0.5 positive, <0.5 negative. */
  quality: number;
  /** P(evidence looks positive | learner knows the item). */
  sensitivity?: number;
  /** P(evidence looks negative | learner does not know the item). */
  specificity?: number;
  /** Down/up-weight noisy evidence sources such as aggregate section scores. */
  weight?: number;
}

export interface LearningTargetState {
  mastery: number;
  reps: number;
  lapses: number;
  dueAt?: Date | null;
  lastReviewed?: Date | null;
}

export interface LearningPriority {
  score: number;
  weakness: number;
  uncertainty: number;
  duePressure: number;
  lapsePressure: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function boundedProbability(value: number): number {
  return Math.max(EPSILON, Math.min(1 - EPSILON, value));
}

function logit(probability: number): number {
  const p = boundedProbability(probability);
  return Math.log(p / (1 - p));
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

/**
 * Update the estimated probability that the learner has mastered an item.
 *
 * The evidence here is learner performance, not source verification. Equal
 * sensitivity/specificity makes quality=0.5 exactly neutral; high-quality
 * attempts move log-odds up, weak attempts move it down.
 */
export function updateMasteryPosterior(
  priorMastery: number,
  evidence: BayesianEvidence | BayesianEvidence[],
): number {
  const signals = Array.isArray(evidence) ? evidence : [evidence];
  let runningLogOdds = logit(clamp01(priorMastery));

  for (const signal of signals) {
    const quality = clamp01(signal.quality);
    const sensitivity = boundedProbability(signal.sensitivity ?? 0.82);
    const specificity = boundedProbability(signal.specificity ?? 0.82);
    const weight = Math.max(0, signal.weight ?? 1);
    const lrPositive = sensitivity / (1 - specificity);
    const lrNegative = (1 - sensitivity) / specificity;
    runningLogOdds += weight * (quality * Math.log(lrPositive) + (1 - quality) * Math.log(lrNegative));
  }

  return clamp01(sigmoid(runningLogOdds));
}

/**
 * Score a learning target for recommendation. Higher scores are better next
 * practice targets: weak, uncertain, lapsed, and overdue items rise; mastered
 * not-due items sink so practice does not reward easy repetition.
 */
export function learningPriority(target: LearningTargetState, now: Date): LearningPriority {
  const mastery = clamp01(target.mastery);
  const reps = Number.isFinite(target.reps) ? target.reps : 0;
  const lapses = Number.isFinite(target.lapses) ? target.lapses : 0;
  const attempts = Math.max(0, reps + lapses);
  const weakness = 1 - mastery;

  const baseUncertainty = 1 / Math.sqrt(attempts + 1);
  const staleBoost =
    target.lastReviewed == null
      ? 0.25
      : Math.min(0.25, Math.max(0, now.getTime() - target.lastReviewed.getTime()) / (30 * DAY_MS) * 0.25);
  const uncertainty = clamp01(baseUncertainty + staleBoost);

  const daysOverdue = target.dueAt == null ? 0 : Math.max(0, (now.getTime() - target.dueAt.getTime()) / DAY_MS);
  const duePressure =
    target.dueAt != null && target.dueAt.getTime() <= now.getTime() ? clamp01(0.35 + daysOverdue / 14) : 0;

  const lapsePressure = clamp01(lapses / Math.max(1, attempts));
  const easyPenalty = mastery >= 0.85 && duePressure === 0 ? 0.35 : 0;

  const score = clamp01(
    weakness * 0.45 + uncertainty * 0.25 + duePressure * 0.2 + lapsePressure * 0.1 - easyPenalty,
  );

  return { score, weakness, uncertainty, duePressure, lapsePressure };
}

export function rankLearningTargets<T extends LearningTargetState>(targets: T[], now: Date): T[] {
  return [...targets].sort((a, b) => {
    const priorityDelta = learningPriority(b, now).score - learningPriority(a, now).score;
    if (priorityDelta !== 0) return priorityDelta;
    return clamp01(a.mastery) - clamp01(b.mastery);
  });
}
