import { describe, expect, it } from 'vitest';
import { learningPriority, rankLearningTargets, updateMasteryPosterior } from '../src/index';

const NOW = new Date('2026-06-15T12:00:00.000Z');

describe('updateMasteryPosterior', () => {
  it('raises mastery after strong evidence', () => {
    const posterior = updateMasteryPosterior(0.4, { quality: 1 });
    expect(posterior).toBeGreaterThan(0.4);
  });

  it('lowers mastery after weak evidence', () => {
    const posterior = updateMasteryPosterior(0.7, { quality: 0 });
    expect(posterior).toBeLessThan(0.7);
  });

  it('keeps neutral evidence neutral with symmetric diagnostics', () => {
    const posterior = updateMasteryPosterior(0.35, { quality: 0.5 });
    expect(posterior).toBeCloseTo(0.35, 5);
  });

  it('weights noisy evidence less than direct evidence', () => {
    const direct = updateMasteryPosterior(0.4, { quality: 1 });
    const noisy = updateMasteryPosterior(0.4, { quality: 1, weight: 0.25 });
    expect(direct).toBeGreaterThan(noisy);
    expect(noisy).toBeGreaterThan(0.4);
  });
});

describe('learningPriority', () => {
  it('prioritizes weak uncertain overdue work over mastered not-due work', () => {
    const weak = learningPriority(
      { mastery: 0.25, reps: 1, lapses: 1, dueAt: new Date('2026-06-10T00:00:00.000Z') },
      NOW,
    );
    const easy = learningPriority(
      { mastery: 0.95, reps: 6, lapses: 0, dueAt: new Date('2026-07-01T00:00:00.000Z') },
      NOW,
    );
    expect(weak.score).toBeGreaterThan(easy.score);
  });

  it('ranks by expected learning gain', () => {
    const ranked = rankLearningTargets(
      [
        { id: 'easy', mastery: 0.95, reps: 5, lapses: 0, dueAt: new Date('2026-07-01T00:00:00.000Z') },
        { id: 'gap', mastery: 0.2, reps: 0, lapses: 1, dueAt: new Date('2026-06-01T00:00:00.000Z') },
      ],
      NOW,
    );
    expect(ranked.map((item) => item.id)).toEqual(['gap', 'easy']);
  });
});
