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

## Tuning

Shop items, prices, and rebirth rules live in `src/game.js`.
