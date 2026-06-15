# @sotto/learning-model

Bayesian learner-state helpers for Sotto.

This package estimates what a learner should practice next by combining mastery,
uncertainty, lapse history, and due status into an expected-learning-gain score.
It is intentionally separate from `groundcheck`: source verification and learner
mastery use different evidence models.

```ts
import { rankLearningTargets, updateMasteryPosterior } from '@sotto/learning-model';

const mastery = updateMasteryPosterior(0.4, { quality: 0.9, weight: 0.75 });
const next = rankLearningTargets(targets, new Date());
```
