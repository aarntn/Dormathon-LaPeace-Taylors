# Readiness model

Predicts, before a drive, whether the driver will have a fatigue episode on this trip. The app shows the result as **Safe to drive**, **Caution** or **High risk**.

- **Model:** logistic regression, 13 features, trained with scikit-learn.
- **Code:** `train_readiness.py`. The notebook `readiness_model.ipynb` runs it and shows the results.
- **Shipped as:** `backend/app/readiness_model.json` (weights only). The API scores with plain Python in `backend/app/readiness.py`. Training uses that same file to build features, so training and the live app can't drift apart.
- **Retrain:** `python3 ml/readiness/train_readiness.py` (takes about 6 seconds).

## Inputs (everything the pre-drive check collects)

| Source | Features |
|---|---|
| 4 questions | hours slept, hours awake, how tired you feel, trip length |
| 30-second tap test | how much slower than your usual pace, missed taps |
| 15-second face reading | PERCLOS (share of time eyes are closed), mean blink length, yawns |
| Context | time of day (as a 24-hour cycle), late-night flag, how often you were tired on past trips at this hour |

## Data

No labelled real-world drives exist yet, so we **simulated 30,000 drivers** from published sleep research:

- **Hidden sleepiness** builds with time awake and sleep debt (two-process model, Borbély 1982). It peaks at the body-clock low point in the early morning, with a smaller dip mid-afternoon (Horne & Reyner 1995).
- **Personal vulnerability:** people differ widely in how much sleep loss affects them (Van Dongen 2004).
- **Reaction time:** sleepiness slows taps and causes missed taps (PVT lapses; Dinges & Powell 1985, Van Dongen 2003).
- **Face reading:** PERCLOS and long blinks rise with sleepiness (Wierwille 1994, Dinges 1998). A 15-second reading is deliberately noisy.
- **Self-report:** people under-rate their own sleepiness after short sleep (Van Dongen 2003). So "how tired do you feel" mostly reflects time awake and misses most of the sleep debt.
- **Outcome:** the chance of a fatigue episode rises with sleepiness and with time on the road.

The answers are bucketed exactly like the app's buttons (for example, sleep becomes 4 / 5.5 / 6.5 / 8 h).

## Results (test set: 9,000 drivers not used in training)

| Approach | AUC |
|---|---|
| Just asking "how alert do you feel?" | 0.66 |
| Old hand-set rule | 0.78 |
| **BUCKL model** | **0.84** |
| Gradient boosting (check) | 0.84 |

Gradient boosting scored the same, so the simpler model that can be explained loses nothing.

**Same number of warnings, better targeted.** Suppose each approach warns 35% of drivers, the same share that self-report flags. Of the drivers who later had a fatigue episode, these were warned before the drive:
- self-report: 56%
- old rule: 66%
- **model: 75%**

| Band | Share of drivers | Had a fatigue episode |
|---|---|---|
| Safe to drive | 65% | 10% |
| Caution | 25% | 41% |
| High risk | 10% | 85% |

Charts are in `out/`: `warned_comparison.png`, `roc.png` and `what_it_learned.png`.

## Limits

- These numbers come from **simulated** drivers. They show that the method works and that combining the signals beats asking alone; they are not real-world accuracy.
- Next step: retrain on the real checks and in-drive fatigue events the app already saves to Supabase. The script's `simulate()` is the only part that changes.
- A safety indication, not a medical diagnosis.
