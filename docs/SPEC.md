# Uni Radar — MVP Spec

> Working title. Version 0.1 · October 2026 · Owner: Ahmed

## 1. Problem

My friends and I ask each other every day whether we're at uni. It's repetitive, and people often forget to answer. We want to see at a glance who is on the TUHH campus, and roughly where, without anyone having to type anything.

## 2. Goal

A mobile app (iOS + Android) that **automatically** detects when a friend arrives at or leaves the TUHH campus and shows the friend group who is at uni right now and approximately where.

**Success for the MVP:** my friend group (mixed iPhone/Android) uses it for two weeks and stops asking "bist du an der Uni?" in the group chat.

## 3. Non-goals (for the MVP)

- Live map with exact positions
- Location history or statistics
- Public profiles or finding strangers
- Chat (we already have WhatsApp)
- Support for universities other than TUHH

## 4. Users

- A small private friend group (5–20 people), TUHH students
- Mix of iPhone and Android
- Everyone joins voluntarily via an invite code

## 5. MVP features

### F1 — Sign up and join a group
- Sign up with email (magic link or email + password via Supabase Auth)
- Set display name (and optional avatar later)
- Create a group → get a short invite code; or join with a code
- **Done when:** two test accounts are in the same group and see each other

### F2 — Automatic campus detection (core feature)
- On entering the campus geofence → status becomes **"At uni"** with timestamp
- On leaving → status becomes **"Not at uni"**
- Works with the app closed / in the background
- **Done when:** walking onto campus with the app closed updates my status on a friend's phone within ~2 minutes, on both an iPhone and an Android phone

### F3 — Who's at uni (main screen)
- List of group members: "At uni since 09:12 · near building H" / "Not at uni"
- People at uni sorted to the top
- Updates live (Supabase Realtime), pull-to-refresh as fallback
- **Done when:** a status change appears on another device without restarting the app

### F4 — Approximate building
- When a geofence event fires (or the app is opened on campus), take **one** location reading and match it to the nearest TUHH building from a fixed list
- Shown as "near building X"; if accuracy is poor, show only "At uni"
- **Done when:** in a test walk across campus the estimated building is correct most of the time

### F5 — Privacy controls and onboarding
- Onboarding screen that explains *why* the app needs "Always" location permission, before the system dialog appears
- **Ghost mode** toggle: stops sharing immediately and shows me as "Hidden"
- Delete account → removes all my data
- **Done when:** with ghost mode on, friends see "Hidden" and no updates are sent

## 6. Detection design

### Campus geofence
- One or a few circular geofences covering the TUHH buildings in Harburg (main campus around Am Schwarzenberg-Campus, plus outlying buildings if needed)
- **TODO:** pick exact centre coordinates and radii from a map; start with one circle of ~300–400 m and adjust after test walks
- Platform limits: iOS allows max **20** monitored regions per app, Android max **100** geofences — plenty for this

### Avoiding flicker
- GPS near the campus edge can trigger enter/exit repeatedly. Use **hysteresis**: only treat an exit as real after it has lasted ~10 minutes (or no re-entry event arrives)
- **Stale status rule:** if a user's status hasn't been refreshed for 12 hours, show "Unknown" instead of "At uni" (e.g. phone died on campus)
- Optional: reset everyone to "Not at uni" at 3:00 at night

### Building estimate
- Store a list of buildings with a centre coordinate each (in the app, not the database)
- Nearest building wins if the reading's accuracy is better than ~50 m; otherwise no building shown
- Coordinates are used **only on the device** to compute the building; only the building name is sent

### Later options (not MVP)
- One-tap manual location ("Library", "Mensa") that clears on leaving campus
- Wi-Fi/eduroam access-point matching (Android only — iOS restricts background Wi-Fi info)

## 7. Privacy principles

1. **Status, not coordinates.** The server only ever stores `at_uni / not_at_uni / hidden`, a building name, and a timestamp
2. **No history.** One row per user with the current state, overwritten on update
3. **Campus-only.** Outside the geofence, the app knows nothing about where you are
4. **Opt-in and visible.** Joining is voluntary; ghost mode is one tap away
5. **Group-only visibility.** Database row-level security ensures only members of your groups can read your status
6. Use Supabase's **EU region** (Frankfurt) — DSGVO-friendly

## 8. Data model (Supabase / Postgres)

| Table | Columns | Notes |
|---|---|---|
| `profiles` | `id` (= auth user id), `display_name`, `avatar_url`, `created_at` | One per user |
| `groups` | `id`, `name`, `invite_code` (unique), `created_by`, `created_at` | |
| `group_members` | `group_id`, `user_id`, `joined_at` | Primary key (group_id, user_id) |
| `presence` | `user_id` (PK), `status` (`at_uni` \| `not_at_uni` \| `hidden`), `building` (nullable), `updated_at` | Current state only, no history |

**Row-level security (required on every table):**
- A user can read `presence` rows only of users who share a group with them
- A user can write only their own `presence` row
- Group invite codes can be looked up only to join

## 9. Tech stack

| Part | Choice | Why |
|---|---|---|
| App | **Expo (React Native) + TypeScript** | One codebase for iOS and Android, big ecosystem, beginner-friendly |
| Navigation | Expo Router | File-based routing, Expo default |
| Location | `expo-location` + `expo-task-manager` | Geofencing with background tasks |
| Backend | **Supabase** (Auth, Postgres, Realtime), EU region | Login, database and live updates without writing a server |
| Builds | EAS Build (development builds) | Background location does **not** work in Expo Go |
| Distribution | iOS: TestFlight (Apple Developer account, 99 USD/yr) · Android: internal testing track or APK | Getting the app onto friends' phones |

## 10. Screens

1. **Welcome / sign in**
2. **Location permission explainer** → system permission dialogs
3. **Join or create group** (invite code)
4. **Who's at uni** — main list (default screen)
5. **Settings** — ghost mode, display name, leave group, delete account

## 11. Platform notes

- **iOS:** needs "Always" location permission and `UIBackgroundModes: location`; Apple reviews the reason text carefully, so the explanation must be clear and honest
- **Android:** needs `ACCESS_FINE_LOCATION` and `ACCESS_BACKGROUND_LOCATION` (requested in a separate step on Android 10+); some manufacturers (Samsung, Xiaomi, Huawei) aggressively kill background apps — onboarding may need a hint to disable battery optimisation for the app
- **Testing:** simulators can fake locations, but real behaviour must be tested on real phones, on campus, with the app closed

## 12. Milestones

| # | Milestone | Learning focus |
|---|---|---|
| 0 | TypeScript basics (a few evenings) | Types, functions, objects, `async/await` |
| 1 | Expo app running on my phone with a "Hello" screen | Project setup, running on device |
| 2 | "Who's at uni" list with **fake** data | React components, lists, state |
| 3 | Supabase login + groups + invite codes | Auth, database, RLS |
| 4 | **Manual** at-uni toggle that updates friends live | Realtime — proves the backend before location work |
| 5 | Automatic geofencing (replaces manual toggle) | Permissions, background tasks, development builds |
| 6 | Building estimate + ghost mode | Geometry, privacy features |
| 7 | Beta with friends (TestFlight + Android) | Distribution, real-world bugs |

## 13. Open questions

- Exact geofence centres and radii for TUHH (and do outlying buildings matter?)
- Should "arrived at uni" trigger a push notification to friends? (v2 — could be annoying; maybe per-friend opt-in)
- Should someone be able to be in several groups? (Data model already allows it)
- "At uni since 09:12" currently uses `updated_at`. If a later update (e.g. new building) refreshes `updated_at`, the "since" time jumps forward. Do we need a separate `since` / `arrived_at` column in `presence`? (Decide by milestone 4–6)
- App name

## 14. Ideas for v2

- Push notifications ("Lena just arrived")
- One-tap manual location (Library / Mensa / Lernraum)
- "Heading to Mensa at 12:30 — who's in?" quick plans
- Home-screen widget showing who's at uni
- Timetable-based hints ("usually at uni on Tuesdays")
