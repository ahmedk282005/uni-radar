# CLAUDE.md — Uni Radar

Instructions for Claude when working in this repository. Read this first in every session.

## What this project is

A mobile app (iOS + Android) for a private friend group at TUHH (Technische Universität Hamburg). It automatically detects when a friend is on campus using geofencing and shows the group who is at uni right now and approximately which building they're near. Full spec: `docs/SPEC.md`.

## About me and how to work with me

- I'm a 37th-semester Informatik-Ingenieurwesen student. **This is my first JavaScript/TypeScript and first mobile project.** I know some C/C++/Python concepts.
- **Explain as you go.** After each change, briefly explain what you did and why, in plain language. When you introduce a new concept (hooks, Promises, async/await, RLS, background tasks…), explain it in 2–4 sentences, ideally comparing it to Java or Python.
- **Plan before coding.** For anything bigger than a small fix, show me a short plan first and wait for my OK.
- **Small steps.** One feature or fix per task. Each step should leave the app in a working state.
- **Don't add dependencies without asking.** Tell me what the package does and why we need it.
- **Prefer simple over clever.** Readable code I can understand beats a shorter or more "advanced" solution.
- **Sometimes let me write it.** When a task is a good learning exercise, offer to let me write it first and then review my code.
- If something is unclear or the spec doesn't cover it, ask me instead of guessing.

## Tech stack

- **Expo (React Native) + TypeScript** (strict mode)
- **Expo Router** for navigation (file-based, in `app/`)
- **expo-location + expo-task-manager** for geofencing in the background
- **Supabase** (Auth, Postgres, Realtime) — EU region
- **EAS Build** for development builds (background location does NOT work in Expo Go)

## Commands

> Keep this section in sync with reality. Expo SDK 58.

```bash
npm install                          # install dependencies
npx expo install <package>           # add a package (picks SDK-compatible versions; use instead of npm install <pkg>)
npx expo start                       # start the dev server (scan QR code with Expo Go)
npx expo run:android                 # build & run a dev build on Android (device/emulator)
npx expo run:ios                     # build & run a dev build on iOS (macOS only)
npx eas-cli@latest build --profile development   # cloud development build
npx tsc --noEmit                     # type-check
npx expo lint                        # lint (not set up yet — first run installs ESLint, ask first)
npm test                             # run unit tests once (Jest + jest-expo; files named *.test.ts)
npm test -- --watch                  # re-run tests on every save
```

## Project structure (planned)

```
src/
  app/                  # screens only (Expo Router) — every file here is a route
    _layout.tsx         # root navigator: SessionProvider + Stack.Protected (signed in vs. signed out)
    index.tsx           # "Who's at uni" main screen (signed in only)
    sign-in.tsx         # sign in / create account (signed out only)
    settings.tsx
  lib/supabase.ts       # Supabase client (one place only)
  features/
    auth/               # sign-up/in/out, session context, input validation
    presence/           # status types, fetching, realtime subscription
    geofence/           # geofence setup, background task, building matching
    groups/             # create/join group, invite codes
  constants/campus.ts   # geofence regions + building coordinates
  components/           # shared UI components
supabase/migrations/    # SQL migrations incl. RLS policies
docs/SPEC.md
```

## Conventions

- TypeScript strict; avoid `any`. Define shared types (e.g. `PresenceStatus`) once in the relevant feature folder.
- Function components and hooks only.
- File names: `kebab-case.ts`; components: `PascalCase.tsx`.
- Keep Supabase calls inside `src/features/*` — not directly in screens.
- Handle loading and error states on every screen that fetches data.
- Comments explain *why*, not *what*.

## Privacy rules — never break these

1. **Never send or store raw coordinates on the server.** Coordinates are used only on the device to decide "on campus?" and "nearest building". The server only gets `status`, `building`, `updated_at`.
2. **No location history.** `presence` has one row per user, overwritten on update. Don't add history tables or logs of positions.
3. **Never log coordinates** (no `console.log` of locations, not even in debug code that gets committed).
4. **Ghost mode wins.** If ghost mode is on, no presence updates are sent, from any code path, including background tasks.
5. Location is only evaluated for campus geofences — nothing else.

## Security rules

- **Every Supabase table has row-level security (RLS) enabled.** Users read presence only of people who share a group; users write only their own row. When adding a table, add its RLS policies in the same migration.
- Only the Supabase **publishable key** (`sb_publishable_…`, successor of the anon key) goes in the app (via `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env`; see `.env.example`). The **secret key** (`sb_secret_…`, formerly service role key) and the database password **never** go in the app or in Git.
- `.env` is in `.gitignore`. Never commit secrets.

## Location / geofencing notes

- iOS: max 20 monitored regions per app; Android: max 100 geofences.
- Background location requires: iOS "Always" permission + `UIBackgroundModes: location`; Android `ACCESS_BACKGROUND_LOCATION` requested separately after foreground permission.
- Use hysteresis for exits (~10 min) to avoid flicker at the campus edge.
- Status older than 12 h is shown as "Unknown".
- Test with simulated locations first, then always confirm on **real devices on campus with the app closed**.

## Testing

- Unit-test pure logic (building matching, hysteresis, status display rules) — these must not depend on real GPS.
- Before saying a feature is done: type-check passes, tests pass, and tell me exactly how to test it manually on my phone.

## Git

- Small commits, one feature/fix each, clear messages (e.g. `feat: add ghost mode toggle`).
- Work on a branch for anything bigger than a small fix.

## Decisions log

Add a line whenever we decide something important.

- 2026-10 — Expo + TypeScript + Supabase chosen (cross-platform, beginner-friendly, EU hosting).
- 2026-10 — Privacy model: status + building only, no coordinates on server, no history.
- 2026-10 — Manual at-uni toggle built before geofencing (milestone 4) to prove the backend first.
- 2026-10 — Follow Expo SDK 58's default layout: screens in `src/app/`, all other code in `src/`.
- 2026-10 — ESLint not installed yet; `npx expo lint` installs it on first run, so decide before using it.
- 2026-10 — Supabase project in Central EU (Frankfurt, `eu-central-1`); app uses the publishable key, not the legacy anon key.
- 2026-10 — Sign-in with email + password (magic links need deep links, fiddly in Expo Go).
- 2026-10 — "Confirm email" off during development (built-in mailer's low rate limit); turn on + custom SMTP before the beta (milestone 7).
- 2026-10 — Auth session stored via `expo-sqlite` localStorage (Expo's guide), not encrypted; revisit encrypted storage later if needed.
- 2026-10 — Data model allows several groups per user; the app shows only the first group for now.
