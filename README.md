<div align="center">

# @sotto/learning-model

**Bayesian learner-state and practice-priority helpers for Sotto.**

[![License: MIT](https://img.shields.io/badge/License-MIT-1F8A5B.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)](package.json)
[![Runtime deps](https://img.shields.io/badge/runtime%20deps-0-1F8A5B)](package.json)
[![Research grounded](https://img.shields.io/badge/design-research--grounded-3F4FB0)](#evidence-base)

_Practice should target what is weak, uncertain, overdue, or repeatedly missed — not what is already easy._

[**Why this exists**](#why-this-exists) · [**Quick start**](#quick-start) · [**How it works**](#how-it-works) · [**API**](#api-reference) · [**Evidence base**](#evidence-base)

</div>

---

## Why This Exists

Sotto already has [`groundcheck`](https://github.com/affromero/groundcheck) for Bayesian
source verification. Learner modeling needs a different evidence model.

`groundcheck` asks: _"How likely is this source/reference to be real and appropriate?"_

`@sotto/learning-model` asks: _"How likely is this learner to have mastered this
item, and how useful would it be to practice it now?"_

Those are both Bayesian-shaped problems, but they are not the same domain. Keeping this
package separate makes the assumptions explicit, testable, and reusable without mixing
reference-verification logic into pedagogy.

## Quick Start

```ts
import { rankLearningTargets, updateMasteryPosterior } from '@sotto/learning-model';

const mastery = updateMasteryPosterior(0.4, { quality: 0.9, weight: 0.75 });
const next = rankLearningTargets(targets, new Date());
```

## How It Works

The module has two jobs:

1. Update a mastery estimate after new learner evidence.
2. Rank candidate learning targets by expected learning value.

### Mastery Update

`updateMasteryPosterior()` stores mastery as a probability in `[0, 1]`. Each practice
attempt is evidence with:

| Field         | Meaning                                                                         |
| ------------- | ------------------------------------------------------------------------------- |
| `quality`     | Attempt quality in `[0, 1]`; `0.5` is neutral under symmetric diagnostics       |
| `sensitivity` | How often this evidence source looks positive when the learner knows the item   |
| `specificity` | How often this evidence source looks negative when the learner does not know it |
| `weight`      | How much to trust this signal; useful for noisy aggregate section scores        |

Internally the update uses log-odds so independent evidence can be accumulated without
ad hoc additive mastery bumps. The default diagnostic values are deliberately moderate;
callers can down-weight weaker evidence such as mixed-section averages.

### Practice Priority

`learningPriority()` scores a target from:

| Signal         | Why it matters                                      |
| -------------- | --------------------------------------------------- |
| Weakness       | Low mastery should surface before already-easy work |
| Uncertainty    | Sparse or stale evidence should be sampled again    |
| Due pressure   | Spaced-repetition due dates still matter            |
| Lapse pressure | Repeated failures should increase review priority   |
| Easy penalty   | Mastered, not-due targets are suppressed            |

The score is a recommendation heuristic, not a psychometric certificate. Its purpose is
to choose better next practice items, keep hard-but-useful work visible, and avoid
rewarding learners with excessive easy repetition.

## API Reference

### `updateMasteryPosterior(priorMastery, evidence)`

Returns a posterior mastery probability after one evidence item or an array of evidence.

```ts
const posterior = updateMasteryPosterior(0.62, [
  { quality: 1, weight: 1 },
  { quality: 0.4, weight: 0.25 }, // noisier aggregate signal
]);
```

### `learningPriority(target, now)`

Returns the score and its interpretable components.

```ts
const priority = learningPriority(
  {
    mastery: 0.35,
    reps: 2,
    lapses: 1,
    dueAt: new Date('2026-06-10T00:00:00Z'),
    lastReviewed: new Date('2026-05-30T00:00:00Z'),
  },
  new Date('2026-06-15T00:00:00Z')
);
```

### `rankLearningTargets(targets, now)`

Returns a new array sorted by priority. The input array is not mutated.

```ts
const nextTargets = rankLearningTargets(courseTargets, new Date()).slice(0, 10);
```

## Evidence Base

This package is intentionally modest: it translates durable findings from cognitive
psychology and intelligent tutoring into software signals Sotto can use. The README is
not claiming that these exact weights are universal; the weights are documented so they
can be measured and tuned against real learner outcomes.

| Research thread               | What Sotto uses                                                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Bayesian knowledge tracing    | Treat mastery as a latent probability updated by learner evidence, not a fixed point score. See Corbett & Anderson's knowledge-tracing model. |
| Retrieval practice            | Practice should require recall, because testing is itself a learning event.                                                                   |
| Distributed practice          | Due dates and review spacing should affect what comes next.                                                                                   |
| Interleaving                  | Full catch-up practice should mix skills so learners choose strategies instead of repeating one blocked pattern.                              |
| Desirable difficulties        | Productive challenge is preferred over frictionless easy work, as long as the task remains achievable.                                        |
| Effective learning techniques | Practice testing and distributed practice are among the strongest broadly supported study techniques.                                         |
| Cognitive load                | Recommendation should not blindly maximize difficulty; noisy evidence and overload need down-weighting.                                       |
| Mastery learning              | Progress should be guided by demonstrated mastery and corrective practice, not only time spent.                                               |

Primary sources and reviews:

- Corbett, A. T., & Anderson, J. R. (1994). _Knowledge tracing: Modeling the acquisition of procedural knowledge._ User Modeling and User-Adapted Interaction, 4, 253-278. https://doi.org/10.1007/BF01099821
- Karpicke, J. D., & Roediger, H. L. (2008). _The critical importance of retrieval for learning._ Science, 319(5865), 966-968. https://doi.org/10.1126/science.1152408
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). _Distributed practice in verbal recall tasks: A review and quantitative synthesis._ Psychological Bulletin, 132(3), 354-380. https://doi.org/10.1037/0033-2909.132.3.354
- Rohrer, D., & Taylor, K. (2007). _The shuffling of mathematics problems improves learning._ Instructional Science, 35, 481-498. https://doi.org/10.1007/s11251-007-9015-8
- Bjork, E. L., & Bjork, R. A. (2011). _Creating desirable difficulties to enhance learning._ In M. A. Gernsbacher et al. (Eds.), Psychology and the Real World.
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). _Improving students' learning with effective learning techniques._ Psychological Science in the Public Interest, 14(1), 4-58. https://doi.org/10.1177/1529100612453266
- Sweller, J. (1988). _Cognitive load during problem solving: Effects on learning._ Cognitive Science, 12(2), 257-285. https://doi.org/10.1207/s15516709cog1202_4
- Bloom, B. S. (1968). _Learning for mastery._ Evaluation Comment, 1(2), 1-12.

## Design Guardrails

- Keep the package pure: no Prisma, no Next.js, no network calls.
- Keep runtime dependencies at zero.
- Return interpretable components, not only a final score.
- Prefer calibrated inputs from the host app over hidden global constants.
- Do not conflate learner mastery with source verification.

## Development

```bash
npm test --workspace @sotto/learning-model
npm run typecheck --workspace @sotto/learning-model
```
