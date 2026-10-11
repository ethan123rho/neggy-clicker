# Keycap Hunt (Roblox)

A grid of giant keyboard keycaps covers the floor. One of them is secretly golden. Walk over the keycaps to press them down, and find the golden one to score a point.

- Pressed keycaps change colour to hint where the golden one is: **orange = close, blue = far**.
- Finding the golden keycap adds a point to the **Golden Keys** leaderboard and starts a new round after a few seconds.

## Setup

1. Open Roblox Studio and create a new **Baseplate** place.
2. In the Explorer, right-click **ServerScriptService** and choose **Insert Object → Script**.
3. Replace the script's contents with `KeycapHunt.server.lua`.
4. Press **Play**.

The script builds the floor, keycaps, spawn point and scoreboard sign itself.

## Tweaking

Edit the `CONFIG` table at the top of the script:

| Setting        | What it does                                      |
| -------------- | ------------------------------------------------- |
| `Rows`/`Columns` | Grid size (default 6 × 6 = 36 keycaps)          |
| `CapSize`/`Gap`  | Keycap size and spacing in studs                |
| `HotColdHints`   | `false` makes it pure luck: you may have to step on every keycap |
| `ResetDelay`     | Seconds between rounds                          |
| `Origin`         | Where the level is built                        |
