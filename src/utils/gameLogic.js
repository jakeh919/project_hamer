// Pure game logic functions for Hammer Golf

/**
 * Returns the number of strokes a player gets on a given hole.
 * holeRating is typically 1–18 (difficulty rank).
 */
export function getStrokesOnHole(player, holeRating) {
  return holeRating <= player.handicap ? 1 : 0;
}

/**
 * Calculate net scores for all players on a hole.
 * hole.number is 1-based. hole.rating is the handicap difficulty rank (1–18).
 */
export function calculateNetScores(grossScores, players, hole) {
  const netScores = {};
  for (const player of players) {
    const strokes = getStrokesOnHole(player, hole.rating);
    const gross = grossScores[player.id];
    netScores[player.id] = gross != null ? gross - strokes : null;
  }
  return netScores;
}

/**
 * 5-player only: returns the bet multiplier for a given hole number.
 */
export function getHoleMultiplier(holeNumber) {
  if (holeNumber === 18) return null; // special: $40 fixed override
  if ([6, 12, 13, 14, 15, 16, 17].includes(holeNumber)) return 2;
  return 1;
}

/**
 * 5-player only: is this a "money hole"?
 */
export function isMoneyHole(holeNumber) {
  return [6, 12, 13, 14, 15, 16, 17, 18].includes(holeNumber);
}

/**
 * 5-player only: determine who the wolf is this hole.
 * On money holes, the wolf is the player with the lowest (most negative) running total.
 * On normal holes, wolf rotates in order.
 */
export function getWolfForHole(holeNumber, players, runningTotals) {
  if (isMoneyHole(holeNumber) && runningTotals) {
    const sorted = [...players].sort(
      (a, b) => (runningTotals[a.id] ?? 0) - (runningTotals[b.id] ?? 0)
    );
    return sorted[0];
  }
  return players[(holeNumber - 1) % 5];
}

/**
 * Get the initial hammer value for a hole.
 * 4-player: always baseBet.
 * 5-player: baseBet * multiplier (or $40 for hole 18); doubled if wolfAlone.
 */
export function getHammerStartValue(baseBet, holeNumber, gameMode, wolfAlone = false) {
  if (gameMode === '5player') {
    let value;
    if (holeNumber === 18) {
      value = 40;
    } else {
      value = baseBet * getHoleMultiplier(holeNumber);
    }
    return wolfAlone ? value * 2 : value;
  }
  return baseBet;
}

/**
 * Get the best (lowest) net score for a team.
 */
function bestNetScore(teamIds, netScores) {
  let best = Infinity;
  for (const id of teamIds) {
    const score = netScores[id];
    if (score != null && score < best) best = score;
  }
  return best === Infinity ? null : best;
}

/**
 * Get the two best (lowest) net scores for a team (for 5-player comparison).
 */
function twobestNetScores(teamIds, netScores) {
  const scores = teamIds
    .map(id => netScores[id])
    .filter(s => s != null)
    .sort((a, b) => a - b);
  return [scores[0] ?? Infinity, scores[1] ?? Infinity];
}

/**
 * Resolve hammer winner.
 * Returns: { hammerWinner: 0 | 1 | null, finalHammerValue: number }
 * hammerWinner is index into teams array (0 or 1), or null for push.
 */
export function resolveHammer(hole, teams, netScores) {
  const { hammerConceded, hammerConcedeTeam, hammerValue, wolfAlone } = hole;

  if (hammerConceded && hammerConcedeTeam != null) {
    const winner = hammerConcedeTeam === 0 ? 1 : 0;
    return { hammerWinner: winner, finalHammerValue: hammerValue };
  }

  const team0 = teams[0];
  const team1 = teams[1];

  let score0, score1;

  // 5-player: compare 2 best net scores if team size > 2
  if (wolfAlone) {
    // wolf alone vs 3: wolf's single best vs team's best 2
    score0 = bestNetScore(team0, netScores);
    const [b1, b2] = twobestNetScores(team1, netScores);
    score1 = b1; // wolf alone: compare best of 3 vs wolf
    // Actually for wolf alone: wolf's score vs best of the other 3
    score0 = bestNetScore(team0, netScores);
    score1 = bestNetScore(team1, netScores);
  } else if (team0.length > 2 || team1.length > 2) {
    // 5-player normal: compare best 2 net scores from each side
    const [t0a, t0b] = twobestNetScores(team0, netScores);
    const [t1a, t1b] = twobestNetScores(team1, netScores);
    score0 = t0a + t0b;
    score1 = t1a + t1b;
  } else {
    // 4-player: best net score per team
    score0 = bestNetScore(team0, netScores);
    score1 = bestNetScore(team1, netScores);
  }

  if (score0 == null || score1 == null) return { hammerWinner: null, finalHammerValue: hammerValue };
  if (score0 < score1) return { hammerWinner: 0, finalHammerValue: hammerValue };
  if (score1 < score0) return { hammerWinner: 1, finalHammerValue: hammerValue };
  return { hammerWinner: null, finalHammerValue: hammerValue }; // push
}

/**
 * Apply birdie/eagle multipliers to the hammer and skin values.
 * Checks winning team players' gross scores vs par.
 * Returns { finalHammerValue, finalSkinValue }
 */
export function applyBirdieEagleMultipliers(
  grossScores,
  hole,
  teams,
  hammerWinner,
  hammerValue,
  skinValue,
  gameMode
) {
  let finalHammerValue = hammerValue;
  let finalSkinValue = skinValue;

  if (hammerWinner == null) return { finalHammerValue, finalSkinValue };

  const winningTeam = teams[hammerWinner];
  const par = hole.par;
  let birdieCount = 0;
  let hasEagle = false;

  for (const playerId of winningTeam) {
    const gross = grossScores[playerId];
    if (gross == null) continue;
    if (gross <= par - 2) hasEagle = true;
    else if (gross === par - 1) birdieCount++;
  }

  if (hasEagle) {
    finalHammerValue = hammerValue * 3;
  } else if (birdieCount > 0) {
    finalHammerValue = hammerValue * 2;
  }

  // 5-player skin: two birdies doubles skin value
  if (gameMode === '5player' && birdieCount >= 2) {
    finalSkinValue = skinValue * 2;
  }

  return { finalHammerValue, finalSkinValue };
}

/**
 * Calculate money deltas for a hole.
 * Returns { [playerId]: number } — positive = won money, negative = lost.
 *
 * 4-player: each winner +finalHammerValue, each loser -finalHammerValue; skin separately.
 * 5-player payment scaling:
 *   2 beats 3: each loser pays finalHammerValue; winners each get (3 * value / 2)
 *   3 beats 2: each winner gets finalHammerValue; losers each pay (3 * value / 2) ... wait:
 *   Actually: total must balance. Let's use:
 *   Each loser pays X; each winner gets (losers * X / winners)
 */
export function calculateMoneyDeltas(
  teams,
  hammerWinner,
  finalHammerValue,
  skinWinner,
  finalSkinValue,
  players
) {
  const deltas = {};
  for (const p of players) deltas[p.id] = 0;

  // Hammer payout
  if (hammerWinner != null) {
    const winTeam = teams[hammerWinner];
    const loseTeam = teams[hammerWinner === 0 ? 1 : 0];
    const totalPaid = loseTeam.length * finalHammerValue;
    const perWinner = totalPaid / winTeam.length;

    for (const id of loseTeam) deltas[id] = (deltas[id] ?? 0) - finalHammerValue;
    for (const id of winTeam) deltas[id] = (deltas[id] ?? 0) + perWinner;
  }

  // Skin payout
  if (skinWinner != null && finalSkinValue > 0) {
    const playersMap = Object.fromEntries(players.map(p => [p.id, p]));
    // Skin winner gets paid by all other players evenly? No — skin is a separate pot.
    // Skin: winner gets finalSkinValue from the pot; others each contributed baseBet per hole (tracked separately)
    // For simplicity: winner gets (players.length - 1) * skinValue; others each lose skinValue
    for (const p of players) {
      if (p.id === skinWinner) {
        deltas[p.id] = (deltas[p.id] ?? 0) + finalSkinValue * (players.length - 1);
      } else {
        deltas[p.id] = (deltas[p.id] ?? 0) - finalSkinValue;
      }
    }
  }

  return deltas;
}

/**
 * Calculate skin winner for a hole.
 * Skin goes to the player with the lowest net score (outright — no tie).
 * Returns { skinWinner: playerId | null, carryover: boolean }
 */
export function resolveSkin(netScores, players, skinCarryoverIn) {
  const scored = players
    .map(p => ({ id: p.id, net: netScores[p.id] }))
    .filter(p => p.net != null)
    .sort((a, b) => a.net - b.net);

  if (scored.length < 2) return { skinWinner: null, skinValue: skinCarryoverIn };

  if (scored[0].net < scored[1].net) {
    return {
      skinWinner: scored[0].id,
      skinValue: skinCarryoverIn,
      carryover: 0,
    };
  }

  // Tie — skin carries over
  return { skinWinner: null, skinValue: 0, carryover: skinCarryoverIn };
}

/**
 * Build payout matrix from running totals.
 * Returns array of { from: playerId, to: playerId, amount: number }
 */
export function buildPayoutMatrix(players, runningTotals) {
  const payouts = [];
  const sorted = [...players].sort(
    (a, b) => (runningTotals[b.id] ?? 0) - (runningTotals[a.id] ?? 0)
  );

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const winner = sorted[i];
      const loser = sorted[j];
      const wTotal = runningTotals[winner.id] ?? 0;
      const lTotal = runningTotals[loser.id] ?? 0;
      const diff = wTotal - lTotal;
      if (diff > 0) {
        payouts.push({ from: loser.id, to: winner.id, amount: diff });
      }
    }
  }
  return payouts;
}
