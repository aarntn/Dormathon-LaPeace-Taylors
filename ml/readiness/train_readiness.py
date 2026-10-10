"""Train BUCKL's pre-drive readiness model.

Question the model answers: "Will this driver have a fatigue episode on this trip?"
Output: a probability, turned into Safe to drive / Caution / High risk.

Data: we have no labelled real-world drives yet, so we SIMULATE drivers with a
model built from published sleep research, then train on what the app can
actually observe (the four questions, tap test, 15-second face reading, time of
day and past trips). The research anchors:
  - Two-process model of sleepiness (Borbely 1982): time awake + body clock.
  - Body-clock low point in the early morning, smaller dip mid-afternoon; drowsy
    crashes cluster at those times (Horne & Reyner 1995).
  - Sleep restriction slows reaction time and adds lapses on the PVT
    (Dinges & Powell 1985; Van Dongen et al. 2003).
  - People under-rate their own impairment after short sleep (Van Dongen 2003).
  - People differ a lot in how badly sleep loss hits them (Van Dongen 2004).
  - PERCLOS / long blinks track drowsiness (Wierwille 1994; Dinges 1998).
  - Longer time on task raises risk.

Run from the repo root:  python3 ml/readiness/train_readiness.py
Outputs go to ml/readiness/out/ and the model is copied to backend/app/.
"""
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'backend'))
from app.readiness import FEATURES, features  # noqa: E402  (same code the API uses)

OUT = Path(__file__).with_name('out')
SEED, N = 2026, 30000
rng = np.random.default_rng(SEED)


def simulate(n):
    # Who is driving, and when
    shift = rng.random(n) < .15                                    # shift / night workers
    wake = np.where(shift, rng.normal(15, 2, n), rng.normal(7, 1.3, n)) % 24
    hour_p = np.array([2, 1.5, 1.5, 1.5, 2, 3, 6, 9, 8, 5, 4, 4, 5, 5, 4, 4, 5, 8, 9, 7, 5, 4, 3, 3], float)
    hour = rng.choice(24, n, p=hour_p/hour_p.sum())
    awake_true = np.clip((hour-wake) % 24, .5, 22)
    slept_true = np.clip(rng.normal(6.6, 1.3, n) - .6*shift, 2.5, 10)
    trip_cat = rng.choice(['under_30', '30_60', '1_2h', 'over_2h'], n, p=[.35, .3, .2, .15])
    trait = np.clip(rng.lognormal(0, .3, n), .4, 2.5)            # personal vulnerability

    # Hidden sleepiness (what we want to know but cannot see directly)
    debt = np.clip(7.5-slept_true, 0, None)
    clock = .5*(1+np.cos(2*np.pi*(hour-4)/24)) + .3*np.exp(-((hour-15)**2)/(2*1.5**2))
    hidden = (trait*(1.0*awake_true/16 + .8*debt/3) + .7*clock + .5*clock*awake_true/16
              + rng.normal(0, .25, n))

    # What the app observes (with realistic noise)
    baseline = rng.normal(260, 25, n)                              # each person's normal tap speed
    returning = rng.random(n) < .6
    personal = np.where(returning, baseline + rng.normal(0, 12, n), 270)
    taps_median = baseline*(1+.16*hidden) + rng.normal(0, 18, n)
    misses = np.clip(rng.poisson(.08*np.exp(.9*hidden)), 0, 3)
    perclos = np.clip(.03 + .05*hidden + rng.normal(0, .045, n), 0, 1)        # 15 s is a short, noisy read
    blink_ms = np.clip(140 + 70*hidden + rng.normal(0, 70, n), 40, 2000)
    yawns = np.clip(rng.poisson(.06*np.exp(.75*hidden)), 0, 5)
    # Self-report: driven by how long you've been up, misses most of the sleep debt and trait
    felt = .9*awake_true/16 + .25*debt/3 + .5*clock + rng.normal(0, .45, n)
    alert_self = pd.cut(felt, [-np.inf, *np.quantile(felt, [.3, .65, .9]), np.inf],
                        labels=['very_alert', 'ok', 'bit_tired', 'very_tired']).astype(str)
    history = np.where(returning, np.clip(.12*trait*(1+clock) - .08 + rng.normal(0, .08, n), 0, 1), 0)

    # The answers come from the app's buttons, so bucket them the same way
    slept = np.select([slept_true < 5, slept_true < 6, slept_true < 7], [4, 5.5, 6.5], 8)
    awake = np.select([awake_true < 8, awake_true < 12, awake_true < 16], [4, 10, 14], 18)

    # Outcome: fatigue episode on the trip (hazard rises with sleepiness and time on task)
    trip_h = pd.Series(trip_cat).map({'under_30': .4, '30_60': .75, '1_2h': 1.5, 'over_2h': 3}).to_numpy()
    p_event = 1-np.exp(-trip_h*.022*np.exp(1.25*(hidden + .2*trip_h)))
    episode = (rng.random(n) < p_event).astype(int)

    rows = []
    for i in range(n):
        check = {'slept': slept[i], 'awake': awake[i], 'hour': int(hour[i]), 'alert_self': alert_self[i],
                 'trip_length': trip_cat[i], 'taps_ms': [float(taps_median[i])], 'misses': int(misses[i]),
                 'face_perclos': float(perclos[i]), 'face_mean_blink_ms': float(blink_ms[i]), 'face_yawns': int(yawns[i])}
        rows.append(features(check, history[i], personal[i]) | {'episode': episode[i]})
    return pd.DataFrame(rows), pd.DataFrame({'alert_self': alert_self, 'trip_length': trip_cat, 'hour': hour,
                                             'taps_median': taps_median, 'personal': personal, 'history': history})


def old_rule(f, raw):
    """The hand-set weights BUCKL used before this model (for comparison)."""
    reaction = np.clip(f.reaction_slowing_ms/100, 0, 1)
    face = np.where((f.face_perclos > .15) | (f.face_mean_blink_ms > 400), 1,
                    np.where((f.face_perclos > .075) | (f.face_mean_blink_ms > 200), .5, 0))
    face = np.minimum(1, face + .5*(f.face_yawns > 0))
    sleep = np.select([f.slept < 5, f.slept < 6, f.slept < 7], [1, .6, .3], 0)
    awake = np.select([f.awake >= 16, f.awake >= 12, f.awake >= 8], [1, .6, .2], 0)
    alert = f.alert_self.map({0: 0, 1: .2, 2: .6, 3: 1})
    trip = raw.trip_length.map({'under_30': 0, '30_60': .3, '1_2h': .6, 'over_2h': 1}).to_numpy()
    return (reaction*.22 + face*.18 + sleep*.14 + alert*.1 + awake*.1 + f.night*.1 + trip*.08
            + f.history*.05 + np.minimum(1, f.misses/3)*.03)


def warned_share(score, y, flag_rate):
    """Give the same number of warnings; what share of real episodes got one?"""
    cut = np.quantile(score, 1-flag_rate)
    flagged = score >= cut
    return flagged[y == 1].mean(), cut


def main():
    OUT.mkdir(exist_ok=True)
    data, raw = simulate(N)
    data.to_csv(OUT/'simulated_drivers.csv', index=False)
    idx = np.arange(N)
    tr, te = train_test_split(idx, test_size=.3, random_state=SEED, stratify=data.episode)
    X, y = data[FEATURES], data.episode

    scaler = StandardScaler().fit(X.iloc[tr])
    model = LogisticRegression(max_iter=2000, C=1.0).fit(scaler.transform(X.iloc[tr]), y.iloc[tr])
    p = model.predict_proba(scaler.transform(X.iloc[te]))[:, 1]
    gbm = HistGradientBoostingClassifier(random_state=SEED).fit(X.iloc[tr], y.iloc[tr])
    p_gbm = gbm.predict_proba(X.iloc[te])[:, 1]
    selfrep = LogisticRegression().fit(X.iloc[tr][['alert_self']], y.iloc[tr])
    p_self = selfrep.predict_proba(X.iloc[te][['alert_self']])[:, 1]
    rule = old_rule(X.iloc[te], raw.iloc[te])
    yt = y.iloc[te].to_numpy()

    # Self-report "warns" anyone who says a bit tired or very tired; match that warning rate.
    self_flag_rate = float((X.iloc[te].alert_self >= 2).mean())
    self_warned = float((X.iloc[te].alert_self >= 2)[yt == 1].mean())
    model_warned, caution_cut = warned_share(p, yt, self_flag_rate)
    rule_warned, _ = warned_share(rule.to_numpy(), yt, self_flag_rate)
    high_cut = float(np.quantile(p, .9))                     # top 10% risk -> High risk
    band = np.where(p >= high_cut, 'high', np.where(p >= caution_cut, 'caution', 'safe'))
    episode_rate = {b: float(yt[band == b].mean()) for b in ['safe', 'caution', 'high']}
    share = {b: float((band == b).mean()) for b in ['safe', 'caution', 'high']}

    metrics = {
        'n_simulated_drivers': N, 'test_drivers': int(len(te)), 'episode_rate': float(y.mean()),
        'auc': {'self_report_only': roc_auc_score(yt, p_self), 'old_hand_set_rule': roc_auc_score(yt, rule),
                'buckl_model_logistic': roc_auc_score(yt, p), 'gradient_boosting_check': roc_auc_score(yt, p_gbm)},
        'brier': {'buckl_model_logistic': brier_score_loss(yt, p), 'self_report_only': brier_score_loss(yt, p_self)},
        'same_number_of_warnings': {'warning_rate': self_flag_rate, 'episodes_warned_self_report': self_warned,
                                    'episodes_warned_old_rule': rule_warned, 'episodes_warned_buckl_model': model_warned},
        'bands': {'share_of_drivers': share, 'episode_rate_in_band': episode_rate,
                  'thresholds': {'caution': float(caution_cut), 'high': high_cut}},
    }
    metrics = json.loads(json.dumps(metrics, default=float), parse_float=lambda v: round(float(v), 4))

    export = {'name': 'buckl-readiness-logistic', 'version': 1, 'trained_on': 'simulated drivers (see ml/readiness/README.md)',
              'features': FEATURES, 'intercept': float(model.intercept_[0]),
              'coef': dict(zip(FEATURES, map(float, model.coef_[0]))),
              'mean': dict(zip(FEATURES, map(float, scaler.mean_))), 'scale': dict(zip(FEATURES, map(float, scaler.scale_))),
              'thresholds': metrics['bands']['thresholds'], 'test_auc': metrics['auc']['buckl_model_logistic']}
    (OUT/'readiness_model.json').write_text(json.dumps(export, indent=2))
    (OUT/'metrics.json').write_text(json.dumps(metrics, indent=2))
    shutil.copy(OUT/'readiness_model.json', ROOT/'backend/app/readiness_model.json')
    try:
        import joblib
        joblib.dump({'scaler': scaler, 'model': model, 'features': FEATURES}, OUT/'readiness_model.joblib')
    except ImportError:
        pass
    charts(metrics, export, yt, p, p_self, rule)
    print(json.dumps(metrics, indent=2))


def charts(m, export, yt, p, p_self, rule):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    navy, grey, ink, muted = '#1B2A4E', '#B8BEC9', '#1B2A4E', '#6B7280'
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'axes.spines.top': False, 'axes.spines.right': False,
                         'axes.edgecolor': '#D0D4DA', 'axes.labelcolor': muted, 'xtick.color': muted, 'ytick.color': muted})

    # 1. Same number of warnings, who gets warned
    s = m['same_number_of_warnings']
    names = ['Just asking\n"how alert do you feel?"', 'Old hand-set rule', 'BUCKL model']
    vals = [s['episodes_warned_self_report'], s['episodes_warned_old_rule'], s['episodes_warned_buckl_model']]
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=200)
    bars = ax.bar(names, [v*100 for v in vals], color=[grey, grey, navy], width=.55)
    for b, v in zip(bars, vals):
        ax.text(b.get_x()+b.get_width()/2, v*100+1.5, f'{v*100:.0f}%', ha='center', color=ink, fontsize=13, fontweight='bold')
    ax.set_ylim(0, 100); ax.set_ylabel('Drivers who later had a fatigue episode\nthat were warned before the drive (%)', fontsize=9)
    ax.set_title(f'Same number of warnings ({s["warning_rate"]*100:.0f}% of drivers), more of the right people',
                 color=ink, fontsize=11, loc='left')
    ax.grid(axis='y', color='#EEF0F3'); ax.set_axisbelow(True)
    fig.tight_layout(); fig.savefig(OUT/'warned_comparison.png'); plt.close(fig)

    # 2. ROC curves
    fig, ax = plt.subplots(figsize=(5.2, 5), dpi=200)
    for score, label, color in [(p_self, 'Self-report only', grey), (rule, 'Old hand-set rule', '#7C8698'), (p, 'BUCKL model', navy)]:
        fpr, tpr, _ = roc_curve(yt, score)
        ax.plot(fpr, tpr, color=color, lw=2, label=f'{label} (AUC {roc_auc_score(yt, score):.2f})')
    ax.plot([0, 1], [0, 1], color='#D0D4DA', lw=1, ls='--')
    ax.set_xlabel('False alarm rate'); ax.set_ylabel('Episodes caught')
    ax.legend(frameon=False, fontsize=8, loc='lower right'); ax.set_title('Test set, 9,000 simulated drivers', color=ink, fontsize=10, loc='left')
    fig.tight_layout(); fig.savefig(OUT/'roc.png'); plt.close(fig)

    # 3. What the model learned (standardised weights)
    labels = {'slept': 'Hours slept', 'awake': 'Hours awake', 'hour_sin': 'Time of day (sin)', 'hour_cos': 'Time of day (cos)',
              'night': 'Late-night drive', 'alert_self': 'How tired you feel', 'trip_hours': 'Trip length',
              'reaction_slowing_ms': 'Slower taps than usual', 'misses': 'Missed taps', 'face_perclos': 'Eyes closed (PERCLOS)',
              'face_mean_blink_ms': 'Long blinks', 'face_yawns': 'Yawns', 'history': 'Tired on past trips'}
    coef = sorted(export['coef'].items(), key=lambda kv: abs(kv[1]))
    fig, ax = plt.subplots(figsize=(7, 5), dpi=200)
    ax.barh([labels[k] for k, _ in coef], [v for _, v in coef], color=[navy if v > 0 else grey for _, v in coef], height=.6)
    ax.axvline(0, color='#D0D4DA', lw=1)
    ax.set_xlabel('Effect on risk (standardised weight; right = more risk)', fontsize=9)
    ax.set_title('What the readiness model learned', color=ink, fontsize=11, loc='left')
    fig.tight_layout(); fig.savefig(OUT/'what_it_learned.png'); plt.close(fig)


if __name__ == '__main__':
    main()
