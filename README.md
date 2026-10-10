# Neggy Clicker

A Halloween-themed clicker game. Click Neggy to earn Neggys, buy upgrades in the shop, and use the Rebirth Machine to trade your progress for a permanent click multiplier. Progress saves to the browser's localStorage.

Built with Vite, React and Tailwind CSS.

## Run locally

```sh
npm install
npm run dev
```

## Neggy image

Put the Neggy portrait at `public/neggy.png`. Until it's there, a placeholder drawing is shown.

## Deploy to Vercel

Import this repository in Vercel. It detects Vite automatically: build command `npm run build`, output directory `dist`.

## Accounts, cloud saves and leaderboard (optional)

Players can sign in with a username and password to keep their progress across devices and appear on the leaderboard. This uses [Supabase](https://supabase.com) (free tier). Without it, the game still works with browser-only saves.

1. Create a free project at supabase.com.
2. In the project, open **SQL Editor**, paste all of `supabase/schema.sql`, and click **Run**.
3. Open **Authentication → Sign In / Providers → Email** and turn **off** "Confirm email". Players sign in with usernames, so there's no real email to confirm.
4. Open **Project Settings → API** and copy the **Project URL** and the **anon / publishable key**.
5. In Vercel, open the project's **Settings → Environment Variables** and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with those values, then redeploy.

For local development, copy `.env.example` to `.env.local` and fill in the same two values.

Scores are saved by each player's browser, so a determined player could fake theirs. That's fine for playing with friends, but the leaderboard isn't cheat-proof.

## Tuning

Shop items, prices, and rebirth rules live in `src/game.js`.
