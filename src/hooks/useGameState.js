import { useReducer, useEffect, useCallback } from 'react';
import { saveGameState, loadGameState, clearGameState } from '../utils/storage';
import {
  calculateNetScores,
  resolveHammer,
  resolveSkin,
  applyBirdieEagleMultipliers,
  calculateMoneyDeltas,
  getHammerStartValue,
  getWolfForHole,
} from '../utils/gameLogic';

const DEFAULT_STATE = {
  phase: 'home',
  setupStep: 'players',
  gameMode: '4player',
  players: [],
  baseBet: 5,
  course: null,
  teamMode: 'fixed',
  fixedTeams: [[], []],
  currentHoleIndex: 0,
  holes: [],
  runningTotals: {},
  skinCarryover: 0,
  auditLogReturnPhase: null,
  editingFromAudit: false,
};

function buildInitialHole(holeIndex, gameState) {
  const { course, players, baseBet, gameMode, teamMode, fixedTeams, runningTotals, skinCarryover } = gameState;
  const holeData = course.holes[holeIndex];
  const holeNumber = holeData.number;

  let teams;
  if (gameMode === '4player' && teamMode === 'fixed') {
    teams = fixedTeams;
  } else {
    teams = [[], []];
  }

  let wolfId = null;
  if (gameMode === '5player') {
    const wolf = getWolfForHole(holeNumber, players, runningTotals);
    wolfId = wolf?.id ?? null;
  }

  const hammerBaseValue = getHammerStartValue(baseBet, holeNumber, gameMode, false);

  // Default all scores to par
  const grossScores = Object.fromEntries(players.map(p => [p.id, holeData.par]));

  return {
    number: holeNumber,
    par: holeData.par,
    yardage: holeData.yardage,
    rating: holeData.rating,
    teams,
    wolfId,
    wolfAlone: false,
    skinCarryoverIn: skinCarryover,
    hammerBaseValue,
    hammerCount: 0,
    hammerValue: hammerBaseValue,
    grossScores,
    netScores: {},
    hammerWinner: null,
    finalHammerValue: hammerBaseValue,
    skinWinner: null,
    skinValue: skinCarryover,
    moneyDeltas: {},
  };
}

// Recompute all running totals from completed holes (used after any edit)
function recomputeTotals(holes, players) {
  const totals = Object.fromEntries(players.map(p => [p.id, 0]));
  for (const hole of holes) {
    if (!hole?.moneyDeltas) continue;
    for (const [pid, delta] of Object.entries(hole.moneyDeltas)) {
      totals[pid] = (totals[pid] ?? 0) + delta;
    }
  }
  return totals;
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...action.payload };

    case 'START_NEW_GAME':
      return { ...DEFAULT_STATE, phase: 'setup', setupStep: 'players' };

    case 'RESUME_GAME':
      return { ...state };

    case 'SET_SETUP_STEP':
      return { ...state, setupStep: action.step };

    case 'SET_PLAYERS': {
      const gameMode = action.players.length === 5 ? '5player' : '4player';
      const runningTotals = Object.fromEntries(action.players.map(p => [p.id, 0]));
      return { ...state, players: action.players, gameMode, runningTotals };
    }

    case 'SET_COURSE':
      return { ...state, course: action.course };

    case 'SET_BET_AND_MODE':
      return { ...state, baseBet: action.baseBet, teamMode: action.teamMode ?? state.teamMode };

    case 'SET_FIXED_TEAMS':
      return { ...state, fixedTeams: action.teams };

    case 'START_ROUND': {
      const firstHole = buildInitialHole(0, state);
      return {
        ...state,
        phase: 'playing',
        currentHoleIndex: 0,
        holes: [firstHole],
        skinCarryover: 0,
        editingFromAudit: false,
      };
    }

    case 'SET_HOLE_TEAMS': {
      const { holeIndex, teams } = action;
      const holes = [...state.holes];
      holes[holeIndex] = { ...holes[holeIndex], teams };
      return { ...state, holes };
    }

    case 'SET_WOLF_PARTNER': {
      const { holeIndex, wolfId, partnerId, wolfAlone } = action;
      const holes = [...state.holes];
      const hole = { ...holes[holeIndex] };
      if (wolfAlone) {
        hole.wolfAlone = true;
        hole.teams = [[wolfId], state.players.filter(p => p.id !== wolfId).map(p => p.id)];
      } else {
        hole.wolfAlone = false;
        const others = state.players.filter(p => p.id !== wolfId && p.id !== partnerId).map(p => p.id);
        hole.teams = [[wolfId, partnerId], others];
      }
      const hammerBaseValue = getHammerStartValue(state.baseBet, hole.number, state.gameMode, hole.wolfAlone);
      hole.hammerBaseValue = hammerBaseValue;
      hole.hammerValue = hammerBaseValue * Math.pow(2, hole.hammerCount ?? 0);
      hole.finalHammerValue = hole.hammerValue;
      holes[holeIndex] = hole;
      return { ...state, holes };
    }

    case 'INCREMENT_HAMMER': {
      const { holeIndex } = action;
      const holes = [...state.holes];
      const hole = { ...holes[holeIndex] };
      hole.hammerCount = (hole.hammerCount ?? 0) + 1;
      hole.hammerValue = hole.hammerBaseValue * Math.pow(2, hole.hammerCount);
      holes[holeIndex] = hole;
      return { ...state, holes };
    }

    case 'DECREMENT_HAMMER': {
      const { holeIndex } = action;
      const holes = [...state.holes];
      const hole = { ...holes[holeIndex] };
      hole.hammerCount = Math.max(0, (hole.hammerCount ?? 0) - 1);
      hole.hammerValue = hole.hammerBaseValue * Math.pow(2, hole.hammerCount);
      holes[holeIndex] = hole;
      return { ...state, holes };
    }

    case 'SET_GROSS_SCORE': {
      const { holeIndex, playerId, score } = action;
      const holes = [...state.holes];
      const hole = { ...holes[holeIndex] };
      hole.grossScores = { ...hole.grossScores, [playerId]: score };
      holes[holeIndex] = hole;
      return { ...state, holes };
    }

    case 'LOCK_HOLE_SCORES': {
      const { holeIndex } = action;
      const holes = [...state.holes];
      const hole = { ...holes[holeIndex] };
      const { players, baseBet, gameMode } = state;

      const netScores = calculateNetScores(hole.grossScores, players, hole);
      hole.netScores = netScores;

      const { hammerWinner, finalHammerValue: rawHammerValue } = resolveHammer(hole, hole.teams, netScores);
      const { skinWinner, skinValue } = resolveSkin(netScores, players, hole.skinCarryoverIn);

      const { finalHammerValue, finalSkinValue } = applyBirdieEagleMultipliers(
        hole.grossScores, hole, hole.teams, hammerWinner, rawHammerValue, skinValue, gameMode
      );

      const moneyDeltas = calculateMoneyDeltas(
        hole.teams, hammerWinner, finalHammerValue, skinWinner, finalSkinValue, players
      );

      hole.hammerWinner = hammerWinner;
      hole.finalHammerValue = finalHammerValue;
      hole.skinWinner = skinWinner;
      hole.skinValue = finalSkinValue;
      hole.moneyDeltas = moneyDeltas;
      holes[holeIndex] = hole;

      // Always recompute all totals from scratch (handles edits correctly)
      const runningTotals = recomputeTotals(holes, players);

      const newSkinCarryover = skinWinner ? 0 : hole.skinCarryoverIn + baseBet;

      const isLastHole = holeIndex === (state.course.holes.length - 1);
      let nextPhase;
      if (state.editingFromAudit) {
        nextPhase = 'audit_log';
      } else if (isLastHole) {
        nextPhase = 'complete';
      } else {
        nextPhase = 'hole_summary';
      }

      return {
        ...state,
        holes,
        runningTotals,
        skinCarryover: newSkinCarryover,
        phase: nextPhase,
        editingFromAudit: false,
      };
    }

    case 'NEXT_HOLE': {
      const nextIndex = state.currentHoleIndex + 1;
      if (nextIndex >= state.course.holes.length) {
        return { ...state, phase: 'complete' };
      }
      const holes = [...state.holes];
      if (!holes[nextIndex]) {
        holes[nextIndex] = buildInitialHole(nextIndex, state);
      }
      return {
        ...state,
        currentHoleIndex: nextIndex,
        holes,
        phase: 'playing',
      };
    }

    case 'UNDO_HOLE': {
      const { holeIndex } = action;
      const holes = [...state.holes];
      const hole = holes[holeIndex];
      const skinCarryover = hole?.skinCarryoverIn ?? state.skinCarryover;
      const resetHole = buildInitialHole(holeIndex, { ...state, skinCarryover });
      holes[holeIndex] = resetHole;
      const runningTotals = recomputeTotals(
        holes.map((h, i) => i === holeIndex ? null : h),
        state.players
      );
      return {
        ...state,
        holes,
        runningTotals,
        skinCarryover,
        currentHoleIndex: holeIndex,
        phase: 'playing',
        editingFromAudit: false,
      };
    }

    case 'OPEN_AUDIT_LOG':
      return {
        ...state,
        auditLogReturnPhase: state.phase,
        phase: 'audit_log',
      };

    case 'CLOSE_AUDIT_LOG':
      return {
        ...state,
        phase: state.auditLogReturnPhase ?? 'playing',
        auditLogReturnPhase: null,
      };

    case 'EDIT_HOLE': {
      const { holeIndex } = action;
      return {
        ...state,
        currentHoleIndex: holeIndex,
        phase: 'playing',
        editingFromAudit: true,
        auditLogReturnPhase: null,
      };
    }

    case 'EXIT_ROUND':
      return { ...state, phase: 'home' };

    case 'FINISH_ROUND':
      return { ...state, phase: 'complete' };

    case 'NEW_GAME':
      clearGameState();
      return { ...DEFAULT_STATE };

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE, () => {
    const saved = loadGameState();
    return saved ?? DEFAULT_STATE;
  });

  useEffect(() => {
    if (state.phase !== 'home') {
      saveGameState(state);
    }
  }, [state]);

  const actions = {
    startNewGame: useCallback(() => dispatch({ type: 'START_NEW_GAME' }), []),
    resumeGame: useCallback(() => dispatch({ type: 'RESUME_GAME' }), []),
    setSetupStep: useCallback((step) => dispatch({ type: 'SET_SETUP_STEP', step }), []),
    setPlayers: useCallback((players) => dispatch({ type: 'SET_PLAYERS', players }), []),
    setCourse: useCallback((course) => dispatch({ type: 'SET_COURSE', course }), []),
    setBetAndMode: useCallback((baseBet, teamMode) => dispatch({ type: 'SET_BET_AND_MODE', baseBet, teamMode }), []),
    setFixedTeams: useCallback((teams) => dispatch({ type: 'SET_FIXED_TEAMS', teams }), []),
    startRound: useCallback(() => dispatch({ type: 'START_ROUND' }), []),
    setHoleTeams: useCallback((holeIndex, teams) => dispatch({ type: 'SET_HOLE_TEAMS', holeIndex, teams }), []),
    setWolfPartner: useCallback((holeIndex, wolfId, partnerId, wolfAlone) =>
      dispatch({ type: 'SET_WOLF_PARTNER', holeIndex, wolfId, partnerId, wolfAlone }), []),
    incrementHammer: useCallback((holeIndex) => dispatch({ type: 'INCREMENT_HAMMER', holeIndex }), []),
    decrementHammer: useCallback((holeIndex) => dispatch({ type: 'DECREMENT_HAMMER', holeIndex }), []),
    setGrossScore: useCallback((holeIndex, playerId, score) =>
      dispatch({ type: 'SET_GROSS_SCORE', holeIndex, playerId, score }), []),
    lockHoleScores: useCallback((holeIndex) => dispatch({ type: 'LOCK_HOLE_SCORES', holeIndex }), []),
    nextHole: useCallback(() => dispatch({ type: 'NEXT_HOLE' }), []),
    undoHole: useCallback((holeIndex) => dispatch({ type: 'UNDO_HOLE', holeIndex }), []),
    openAuditLog: useCallback(() => dispatch({ type: 'OPEN_AUDIT_LOG' }), []),
    closeAuditLog: useCallback(() => dispatch({ type: 'CLOSE_AUDIT_LOG' }), []),
    editHole: useCallback((holeIndex) => dispatch({ type: 'EDIT_HOLE', holeIndex }), []),
    exitRound: useCallback(() => dispatch({ type: 'EXIT_ROUND' }), []),
    finishRound: useCallback(() => dispatch({ type: 'FINISH_ROUND' }), []),
    newGame: useCallback(() => dispatch({ type: 'NEW_GAME' }), []),
  };

  return { state, ...actions };
}
