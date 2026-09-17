# Circuit Check — Applications of Digital Electronics Quiz & Live Leaderboard

A full-stack, mobile-first quiz application designed for **Applications of Digital Electronics**, connected to **Supabase** with **Google OAuth**, realtime live leaderboards, sound effects, and responsive cyber PCB aesthetics.

---

## Key Features

1. **25 High-Yield Questions on Applications of Digital Electronics**:
   - Automotive ECUs, CAN & ABS modules
   - Avionics bus architectures (ARINC 429 & MIL-STD-1553)
   - Industrial PLCs & Robotics closed-loop optical encoders
   - Digital Signal Processing (DSP) in Medical ECGs & Infusion pumps
   - ADC / DAC voice processing in smart audio
   - IoT edge microcontrollers & PWM servo drives
   - OFDM in 5G cellular systems, PMU power grids, Rad-Hard aerospace logic, and VLSI CMOS.

2. **Supabase Cloud Database**:
   - `quiz_scores` table with Row-Level Security (RLS) enabled.
   - Real-time replication publication to push instant leaderboard rankings as soon as an engineer completes the test.

3. **Google Sign-In & Callsign Support**:
   - Sign in using Google to automatically bind marks and avatars.
   - Fallback guest callsign input so users can play and record scores anytime.

4. **Live Global Leaderboard**:
   - Real-time synchronization via Supabase Realtime WebSocket channel.
   - Displays rank, player avatar, engineer callsign, time taken, score out of 25, and accuracy percentage.
   - Top 3 podium styling (Gold, Silver, Bronze badges).

5. **Mobile-First Cyber PCB Design**:
   - Built for touch screens (min 48px tap targets, notch safe area paddings).
   - Trace progression bar with active node lighting.
   - Live elapsed timer and active scoring HUD.
   - Circular progress ring with particle confetti on high scores.
   - Synthesizer audio feedback via Web Audio API (toggleable).

---

## Running Locally

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open `http://localhost:3000` on your desktop or mobile browser.

---

## Configuring Google OAuth in Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** -> **Providers** -> **Google**.
3. Toggle Google to **Enabled**.
4. Paste your **Client ID** and **Client Secret** obtained from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
5. In Google Cloud Console, set the Authorized Redirect URI to:
   `https://mbnwtelvfzjofeeviutg.supabase.co/auth/v1/callback`
