# Water Bingo

A bingo caller screen and printable bingo cards that teach how Onondaga County cleans its wastewater — from what gets flushed, through pump stations, to the treatment plants. Built in partnership with **Onondaga County Department of Water Environment Protection (WEP)**.

## Running an event

1. **Print cards:** open the app, choose **Print bingo cards**, pick a card range (e.g. 1–30) and **1, 2 or 4 cards per page**, then **Download PDF** (clean pages with no browser header, footer or URL, good for a print shop) or **Print**. Print at 100% / "Actual size". Card #N always has the same layout, so you can print 31–60 later with no duplicates.
2. **Call:** choose **Start calling**. Press <kbd>Space</kbd>/<kbd>→</kbd> (or a presentation clicker) for the next tile, <kbd>←</kbd> to go back, <kbd>F</kbd> for full screen. The right-hand board shows everything called so far.
3. **Check a winner:** choose **Check a card** and type their card number. The app marks the called squares and confirms any winning line (the centre is FREE).

The game saves in the browser, so a refresh or accidental tab close keeps your place. **New game** clears it.

## Development

Needs Node 20+.

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest, once
npm run lint
npm run build      # typecheck + production build to dist/
npm run deploy     # build + firebase deploy (needs `firebase login`)
```

Live at **https://apps.most.org/waterbingo/**. Every push to `main` deploys to GitHub Pages ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) after lint and tests pass. The repo name is the URL path.

The older Firebase Hosting site (project `app-water-bingo`) still works via `npm run deploy` until it is retired.

## Changing the tiles

Tiles live in [`src/data/tiles.ts`](src/data/tiles.ts) with images in `src/assets/tiles/`. **Changing the list changes every card layout**, so reprint all cards after adding, removing, or reordering tiles.
