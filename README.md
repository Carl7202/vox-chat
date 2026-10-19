# GUITAR LAB — Practice with purpose

GUITAR LAB replaces the old VOX interface with an interactive guitar-training workspace. The GitHub repository and existing Supabase project are retained.

## Features

- Interactive 6-string, 12-fret fretboard with standard, Drop D, and half-step-down tuning options.
- Browser-generated note tones using Web Audio.
- Chord diagrams, chord tone playback, and transition practice.
- Original riff exercises with tablature-style patterns and reference-tone playback.
- Web Audio metronome with BPM slider, presets, meters, eighth-note subdivision, and tap tempo.
- Scale explorer for major, minor pentatonic, blues, and natural minor.
- Randomized note-identification ear-training quiz.
- Optional local microphone pitch estimator for one note at a time.
- Alternate-picking practice timer.
- Local guest progress history, JSON export, and Supabase account sync.
- Responsive dark UI for desktop and mobile.

## Publish on GitHub Pages

Open **Settings → Pages**, select the `main` branch and `/ (root)` folder, and save. Once deployment completes, the root `index.html` will be served by GitHub Pages. The app loads `guitar.js` and Supabase JavaScript from CDNs. GitHub Pages serves static files; it does not run Python.

## Local preview on Linux

From the cloned repository folder:

```bash
python3 -m http.server 8000
```

Then open http://127.0.0.1:8000.

## Supabase setup

The existing Supabase project is reused. The `guitar_lab_practice_tracking` migration creates `public.guitar_practice_logs` with row-level security. Authenticated users can read and insert only their own progress rows.

The frontend uses the project URL and a **publishable** key in `guitar.js`. Never put a Supabase `service_role` or secret key in frontend code.

Sign-up/sign-in uses Supabase Auth email + password. Depending on Auth settings, new users may need to confirm their email before signing in. Configure the project's Site URL and Redirect URLs to include your published GitHub Pages address.

### Existing VOX tables

The old `vox_rooms` and `vox_messages` tables are left untouched to avoid deleting data. GUITAR LAB does not use them. Remove them manually only if you later decide you no longer need them.

## Audio and microphone limitations

- Note tones, chord tones, riff references, and metronome clicks are synthesized by the browser; this is not a guitar amp or high-quality instrument sample library.
- Microphone pitch detection runs in the browser and does not upload audio. It works best for one clear note at a time. Chords, noisy rooms, and low notes may be detected incorrectly.
- Microphone permission requires HTTPS or localhost. GitHub Pages uses HTTPS.
- Ear-training scores and speed-round completion are self-guided practice tools, not an automated judgement of playing quality. The app does not listen to guitar practice except when you explicitly enable the microphone pitch detector.
- Supabase cloud progress requires a connection and signed-in user. Guest mode stores logs in that browser's local storage.

## Security notes

The browser contains only a publishable key. Row-level security is enabled on the progress table and binds records to `auth.uid()`. Do not loosen the RLS policies or expose secret/service-role keys.

## Files

- `index.html` — responsive UI and styles
- `guitar.js` — fretboard, audio, exercises, metronome, local history and Supabase Auth/sync
- `schema.sql` — reproducible SQL for the guitar practice table and RLS
- `app.py` — optional local preview server
