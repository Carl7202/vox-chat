# VOX — Talk. Play. Hang out.

A dark, gaming-style voice chat web app. The repository contains exactly the seven requested project files: `app.py`, `index.html`, `vox.js`, `README.md`, `schema.sql`, `vox.log`, and `.gitignore`.

## Features
- Flask server for local hosting and a health endpoint.
- WebRTC peer-to-peer audio with microphone mute, deafen, room IDs, device listing, and invite links.
- Supabase Realtime Broadcast used for signaling and room text messages.
- Responsive VOX interface and keyboard-friendly controls.

## Setup

1. Create a Supabase project.
2. In Supabase **SQL Editor**, run the contents of `schema.sql`. The SQL sets up optional persistent room/message tables and basic row-level security. Realtime broadcast signaling itself uses private room channels and does not require storing microphone audio.
3. Copy your project's **Project URL** and **anon/publishable key** into `SUPABASE_URL` and `SUPABASE_ANON_KEY` at the top of `vox.js`. Never put a `service_role` key in browser code.
4. Install Python and Flask:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
   `requirements.txt` is intentionally not part of the requested seven-file layout, so install Flask with `pip install Flask` instead.
5. Run `python app.py` and open http://127.0.0.1:5000.
6. For real calls with friends, deploy behind HTTPS. Microphone access is generally blocked on non-secure remote origins. Share the same room ID or use **Invite**.

## Important notes
- Use a modern browser with microphone permission.
- Supabase Realtime must be enabled for your project. The browser client uses the anon key and Realtime Broadcast.
- WebRTC can require TURN servers on restrictive networks. This starter uses Google's public STUN server; production deployments should configure a trusted TURN provider.
- This is a starter, not a hardened public chat service: signaling channels are not authenticated and room IDs are guessable. Do not use it for private or sensitive conversations without adding Supabase Auth, private-channel authorization, abuse controls, and a TURN configuration.
- `schema.sql` creates persistent chat tables for future use, while this current client sends room chat via Realtime Broadcast. Messages are not persisted by the current UI.
- `vox.log` is a starter log file; runtime logs are printed by Flask to the terminal.

## Files
- `app.py` — Flask server
- `index.html` — interface structure
- `vox.js` — room chat, WebRTC, signaling, audio controls
- `schema.sql` — optional Supabase database schema
- `vox.log` — project log
- `.gitignore` — local secrets and generated files

## Troubleshooting
- **Setup required:** add the Supabase URL and anon key in `vox.js`.
- **Microphone denied:** use HTTPS or localhost and allow microphone access in browser settings.
- **No connection:** confirm Realtime is enabled, the room ID matches, and your network permits WebRTC. For strict NATs, add TURN.
- **Flask missing:** activate your virtual environment and run `pip install Flask`.
