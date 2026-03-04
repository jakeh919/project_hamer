# Hammer Golf

A mobile-first golf scoring and betting tracker for 4–5 players. Tracks hammer bets, skins, and running money totals. All data saved locally in the browser (no backend).

## Features

- **4-player mode** — Fixed or rotating teams, hammer betting
- **5-player mode** — Wolf game with partner picking, money holes, wolf-alone doubling
- **Hammer betting** — Throw, accept, or concede; birdie/eagle multipliers apply
- **Skins** — Carries over on ties; won outright by lowest net score
- **Handicap strokes** — Net scoring based on hole difficulty rating
- **Course library** — Create and save courses with per-hole par/yardage/handicap
- **Full scorecard** — Color-coded birdies/eagles, 18-hole history
- **Payout matrix** — Who owes whom at the end
- **localStorage** — Persists mid-round; resume after refresh

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173/project_hamer/](http://localhost:5173/project_hamer/)

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deploy to GitHub Pages

1. Create a GitHub repo named `project_hamer`
2. Push this code to the `main` branch
3. Go to **Settings → Pages** → Source: `gh-pages` branch (auto-created by the workflow)
4. Your app will be live at `https://<your-username>.github.io/project_hamer/`

The GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys automatically on every push to `main`.

## Game Rules

### Hammer
- Starts each hole at the base bet
- Holding team can "throw" the hammer to double the current value
- Receiving team must accept (takes the hammer) or concede (loses at current value)
- Winning team determined by best net score (or best 2 net scores in 5-player)
- **Birdie** by winning team: value ×2; **Eagle**: value ×3
- Tie = push (no action)

### Skins
- Each hole: player with outright lowest net score wins the skin pot
- Tie = carryover to next hole
- Separate from hammer money

### 5-Player Wolf
- Wolf rotates each hole (lowest money total on "money holes")
- After each player tees off, wolf can pick them as partner
- Wolf can go alone (hammer value doubled)
- Money holes (6, 12–17): bet ×2; Hole 18: fixed $40
