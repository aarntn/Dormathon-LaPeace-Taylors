# BUCKL demo script and checklist

A 4 to 5 minute run-of-show for the four moments, the setup it needs, and a backup for every step that depends on a camera, a microphone or a signal. For what is real and what is scripted, see [What is real](#7-what-is-real-and-what-is-scripted).

## 1. Set up once, the day before

**Pick one path.**

| Path | Needs | Good for |
|---|---|---|
| **A. Standalone (recommended for a stage demo)** | Nothing: no Supabase, no Twilio, no email confirmation | A full, repeatable user flow on one laptop or one Render service. Data is in memory and resets when the server restarts. |
| **B. Real accounts** | Supabase project and a confirmed account | Showing that accounts and saved data are real. |

### 1.0 Path A: standalone

```powershell
# terminal 1, from the repository root (Python 3.11 or newer, requirements installed)
python -m uvicorn backend.app.standalone:app --port 8000
# terminal 2
cd apps/web; npm ci; npm run build; npm run preview
```

Open the printed `https://...:4173` address. **Sign in as `demo@buckl.test` with password `buckl-demo`**: the account is already filled with a car, a contact and six weeks of trips. Or sign up as anyone to show the full onboarding from empty.

What standalone does and does not do:

- Accounts, sign-in and sign-out work inside the server. No email is sent or needed.
- Car checks always use the scripted, labelled demo results chosen in the hidden panel.
- **Emergency and test texts are simulated.** They print in the server terminal as `[simulated SMS to ...]` and the app reports them as submitted. Nothing leaves the machine.
- Workshops, rest stops and routes still use the real OpenStreetMap services when you are online.
- Everything resets when the server restarts, and the demo account is rebuilt.
- It is for demonstrations only. Do not use it for real drivers: the normal server still refuses to run without Supabase.

**On Render:** set the environment variable `BUCKL_ASGI_APP=backend.app.standalone:app` and you can leave the Supabase and Twilio variables empty. A free service sleeps, so open it once a few minutes before you present.

Then skip to [1.3](#13-rehearse-on-the-demo-phone). The rest of this section is path B.

### 1.1 Path B: turn demo mode on

On the deployed service, set the environment variable **`DEMO_MODE=1`** (it is already in `render.yaml`). Open `<service url>/health` and check it says `"demo_mode": true`.

Demo mode lets the hidden panel choose what the next dashboard scan and start-up check return. Every such result is labelled a demo in the app. With demo mode **off**, a dashboard photo finds nothing and shows "Couldn't read that light", because no dashboard model is connected. Turn demo mode off for anything that is not a presentation.

### 1.2 Path B: create and fill the demo account

1. In the app, sign up with a real email address you control, confirm it, and finish onboarding (any car, any contact). Do not add a real emergency number you do not want texted.
2. Fill the account with believable history. From the repository root:

   ```powershell
   python -m backend.scripts.seed_demo --email you@example.com --password "your password" --name Aaron
   ```

   It needs `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `backend/.env`. Add `--dry-run` first to see what it would create without touching anything. If the account already has trips it refuses, unless you pass `--force`.

   It adds: a Perodua Myvi (WXY 4821), a contact called Mum, 12 finished trips over six weeks, a slow start-up check three days ago, and a dashboard scan with no lights.

3. Open the app signed in as that account and check that every screen in [section 3](#3-what-each-screen-should-show) looks right.

The seeded numbers are **chosen to tell the story**, not measured. Say so if asked. See [what the seed creates](#what-the-seed-creates).

### 1.3 Rehearse on the demo phone

Use the phone you will present on, over the venue's network.

## 2. Pre-flight checklist (10 minutes before)

- [ ] Open the app's HTTPS link in the browser you will use (Chrome on Android, Safari on iPhone). Accept any certificate prompt now.
- [ ] Sign in as the demo account. Pull to refresh Home. You should see "Your car needs attention".
- [ ] **Camera, microphone and location are allowed** for the site. Workshops need location.
- [ ] Load the app **once with a good connection** so the face model is cached. Then switch to aeroplane mode and reopen it to confirm the eye watch still starts.
- [ ] Phone volume up. Tap once in the app so the browser lets it play sound.
- [ ] Do Not Disturb on, auto-lock off, brightness high, charger connected.
- [ ] Phone on a mount or propped up, facing you, with light **in front** of your face, not a window behind. Take off sunglasses.
- [ ] Triple-tap the logo on Home to open the hidden panel and confirm the **Car check results** section says "Server demo mode is on".
- [ ] **Twilio is not configured**, or points at a number you control. Do not text a real contact. Use "What Mum receives" to show the message.
- [ ] A screen recording of the full run is saved on the phone as the last-resort backup.

## 3. What each screen should show

With the seeded account:

| Screen | You should see |
|---|---|
| Home | Perodua Myvi, "Your car needs attention" (battery and brakes), recent trips with safety scores |
| Trips | A drive count and hours for this month, "You get tired faster at night", a chart with the night bars in amber, groups "This week", "Last week", "Earlier", and badges such as "1 alarm", "2 tired", "All alert" |
| When you get tired | 11 alerts, late-night "7 of 11" |
| Car check, Last report | "2 things to check: Weak battery, brakes due for a check" |
| Car report | Possible weak battery (RM 200 to 350), Brakes due for a check (RM 120 to 250), Dashboard lights: Monitor |
| Brake check | Six bars climbing from 2 to 6 hard stops a week, "Get your brakes checked at your next service" |
| Profile | This month stats, "My cars" with the Myvi, emergency contact Mum |

## 4. Run of show

About 4 to 5 minutes. **Say** is what to say, **Do** is what to tap, **Backup** is what to do if it fails.

### 0. The hook (20 s)

**Say:** "A tired driver is the worst judge of how tired they are. BUCKL checks you before you drive, watches your eyes while you drive, tells someone if you stop responding, and explains car warning signs in plain words. All in the phone's browser, nothing to install."

### 1. Before the drive (60 s)

**Do:** Home, then **Start drive watch**. On the quick check tap four answers, for example 6 to 7 h slept, 12 to 16 h awake, "A bit tired", "1 to 2 h". Tap **Next**, then do the face reading and tap test. Show the result.

**Say:** "Four questions, a 15-second face reading and a 30-second tap test. We combine them because people under-rate their own sleepiness. On our simulated test that beats just asking, 0.84 against 0.66."

**Backup:** triple-tap the logo and use **Face reading**, **Tap test** and **Caution** / **High risk** shortcuts to jump straight to a state. Say "this is the state you would see".

**Show:** on **High risk**, point at "Get a ride instead". "We do not lock you out, but we make the safe choice the big button."

### 2. During the drive (60 s)

**Do:** Continue through route, mount and line-up to **Driving** (or use panel **Demo: Back to alert**). Show the ring and "Alert". Then trigger states from the hidden panel: **Demo: getting tired**, then **Demo: eyes close for 1.8 s**.

**Say:** "Everything here runs on the phone, with no signal needed. Controls lock above 10 km/h. When your eyes close for 1.5 seconds, the alarm sounds and will not stop until you answer."

**Backup:** if the live eye watch will not see your face, use the panel only. Tap **Pretend we're moving** in the panel so the alarm arms without driving.

**Optional:** **Demo: Waze open** to show it keeps watching while a maps app is open.

### 3. If you stop responding (45 s)

**Do:** From the alarm, leave it unanswered, or use the panel's **No response countdown**. Show the 10-second ring and the **I'm OK, cancel** button. Then **Contact alerted**, then **What Mum receives**.

**Say:** "Ten seconds, always cancellable. If nothing, Mum gets a text with my name, the time and a live location. The server makes sure it is never sent twice."

**Do not** configure real texts on stage. The receipt screen sends nothing.

### 4. After the drive (30 s)

**Do:** **Trip summary** from the panel, then the **Trips** tab, then **Demo: start a drive at 11:20 pm**.

**Say:** "BUCKL turns drives into one insight: you get tired faster at night. When you go to drive late, it warns you before you start."

### 5. The car (75 s)

**Do:** **Car** tab. 

1. Open the panel and under **Next dashboard scan** pick **Engine overheating**. Tap **Scan a warning light**, point at the dashboard, tap the shutter. Show **Reading the light**, then the result with "Stop safely now" and the numbered steps.
2. Tap **Find a workshop nearby**, then the **Cooling** tab, then show **Call**, **Directions** and **Send report on WhatsApp**. Do not send.
3. Back to Car check. Pick **Slow start** under **Next start-up check**, open **Start-up battery check**, tap **Record start-up**, make a sound for a few seconds. Show "Slow start".
4. Show **Brake check**: the bars climbing.

**Say:** "The dashboard reading and the start-up result in this demo are scripted placeholders, and the app labels them as demo indications. The brake trend is real: it counts hard stops from the driver's own drives."

**Backup for the camera:** choose **Couldn't read the light** and show the recovery screen. "Every failure has its own page."

### 6. Close (20 s)

**Do:** Profile tab, **Privacy and legal**.

**Say:** "Face video never leaves the phone. Audio is recorded only for the start-up check. Location goes to your contact only after the countdown. And every result says 'possible', never a diagnosis."

## 5. Likely questions

| Question | Honest answer |
|---|---|
| Is the readiness model real? | It is a real logistic regression, trained on 30,000 **simulated** drivers built from published sleep research. AUC 0.84 against 0.66 for self-report alone. These show the method works, not real-world accuracy. We would retrain on real checks the app already saves. |
| Is the dashboard reader real? | Not yet. The result in the demo is scripted and labelled a demo. A trained model is the next step. |
| Is the start-up check real? | The timing is real signal processing on the phone: it finds when the engine starts and when the starter's pulsing settles. The 2-second threshold is a rule of thumb, not tested on real cars. |
| How does it know I'm tired? | MediaPipe face landmarks on the phone, then PERCLOS (the share of the last minute with eyes closed), blink length and yawns. It also needs the car moving before the alarm arms. |
| What if there is no signal? | Eye watch, alarm and the countdown run in the phone. The text retries until it is sent. |
| What happens to the video? | It never leaves the phone. |
| Can it text the wrong person or twice? | Only your chosen contact, only after the countdown, and an idempotency key plus a delivery ledger stop duplicates. |
| iPhone? | It is a web app. Safari can pause the camera in the background, so BUCKL asks you to stay in the app. |

## 6. If something goes wrong

| Problem | Do this |
|---|---|
| "Couldn't load account settings" | The API is down or waking up (free hosting sleeps). Open `<url>/health`, wait, reload. |
| Camera black or "Can't see your eyes" | Check light and angle, remove sunglasses, then use the hidden panel states instead. |
| No sound | Tap anywhere in the app, then **Enable sound** if shown. Check the phone is not silent. |
| Dashboard scan says "Couldn't read that light" | Demo mode is off or no scenario matched. Check `/health` shows demo mode on, and re-pick the scenario. |
| Workshops list is empty | Allow location. The list comes from OpenStreetMap and may be slow, so wait a few seconds. |
| Everything is empty | You are signed out or on a fresh account. Sign in as the seeded account. |
| Total failure | Play the screen recording and walk through it. |

## 7. What is real and what is scripted

| | Real | Scripted or simplified |
|---|---|---|
| Readiness check | Real model, real form and tap test, real face measurements | The model learned from simulated drivers |
| Eye watch and alarm | Real, on the phone | Thresholds are research-informed defaults |
| Emergency countdown | Real, with real retry and cancel logic | The receipt is a demo screen. No text is sent unless Twilio is configured |
| Hard braking | Real, from GPS and the motion sensor | |
| Brake check, Trips, Profile stats | Real calculations | The **history** is seeded data |
| Start-up battery check | Real timing on the phone | Result can be forced with a scenario. The threshold is untested |
| Dashboard scan | Real camera and upload flow | The **result** is scripted |
| Workshops | Real, from OpenStreetMap | Opening hours and phone numbers depend on the map data |

### What the seed creates

| Item | Detail |
|---|---|
| Car | Perodua Myvi 2021, WXY 4821, Granite Grey, battery changed 1 to 2 years ago |
| Contact | Mum, +60 12-345 6789, shares live location, texts when OK |
| Trips | 12 finished trips over six weeks: six late-night drives (22:30 to 03:20) and six daytime commutes |
| Hard stops | 2, 3, 3, 4, 5, 6 a week, oldest to newest, so the brake chart climbs |
| Tired alerts | 11 in total, 7 of them late at night, plus one microsleep on the latest night drive |
| Car checks | Slow start 3 days ago (2.8 s, marked demo), dashboard scan with no lights yesterday |

Everything is written with the account's own sign-in, so row-level security applies, and it needs no service-role key.
