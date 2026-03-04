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
};

function buildInitialHole(holeIndex, gameState) {
  const { course, players, baseBet, gameMode, teamMode, fixedTeams, runningTotals, skinCarryover } = gameState;
  const holeData = course.holes[holeIndex];
  const holeNumber = holeData.number;

  let teams;
  if (gameMode === '4player' && teamMode === 'fixed') {
    teams = fixedTeams;
  } else if (gameMode === '4player' && teamMode === 'rotating') {
    teams = [[], []]; // to be set manually
  } else {
    // 5-player: wolf picks
    teams = [[], []];
  }

  let wolfId = null;
  if (gameMode === '5player') {
    const wolf = getWolfForHole(holeNumber, players, runningTotals);
    wolfId = wolf?.id ?? null;
  }

  const hammerValue = getHammerStartValue(baseBet, holeNumber, gameMode, false);

  return {
    number: holeNumber,
    par: holeData.par,
    yardage: holeData.yardage,
    rating: holeData.rating,
    teams,
    wolfId,
    wolfAlone: false,
    skinCarryoverIn: skinCarryover,
    hammerValue,
    hammerHolder: 0,
    hammerConceded: false,
    hammerConcedeTeam: null,
    hammerHistory: [],
    grossScores: {},
    netScores: {},
    hammerWinner: null,
    finalHammerValue: hammerValue,
    skinWinner: null,
    skinValue: skinCarryover,
    moneyDeltas: {},
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...action.payload };

    case 'START_NEW_GAME':
      return { ...DEFAULT_STATE, phase: 'setup', setupStep: 'players' };

    case 'RESUME_GAME':
      return { ...state, phase: state.phase === 'home' ? 'playing' : state.phase };

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
      const initialHoles = state.course.holes.map((_, i) =>
        i === 0 ? buildInitialHole(0, state) : null
      );
      // Only build first hole initially
      const firstHole = buildInitialHole(0, state);
      return {
        ...state,
        phase: 'playing',
        currentHoleIndex: 0,
        holes: [firstHole],
        skinCarryover: 0,
      };
    }

    case 'SET_HOLE_TEAMS': {
      const { holeIndex, teams } = action;
      const holes = [...state.holes];
      const hole = { ...holes[holeIndex], teams };
      holes[holeIndex] = hole;
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
      const hammerValue = getHammerStartValue(state.baseBet, hole.number, state.gameMode, hole.wolfAlone);
      hole.hammerValue = hammerValue;
      hole.finalHammerValue = hammerValue;
      holes[holeIndex] = hole;
      return { ...state, holes };
    }

    case 'THROW_HAMMER': {
      const { holeIndex } = action;
      const holes = [...state.holes];
      const hole = { ...holes[holeIndex] };
      const newValue = hole.hammerValue * 2;
      const thrower = hole.hammerHolder;
      const receiver = thrower === 0 ? 1 : 0;
      hole.hammerHistory = [
        ...hole.hammerHistory,
        { team: thrower, action: 'throw', value: newValue },
      ];
      // Hammer is now pending — receiver must accept or concede
      hole.pendingHammer = true;
      hole.pendingHammerValue = newValue;
      holes[holeIndex] = hole;
      return { ...state, holes };
    }

    case 'ACCEPT_HAMMER': {
      const { holeIndex } = action;
      const holes = [...state.holes];
      const hole = { ...holes[holeIndex] };
      const receiver = hole.hammerHolder === 0 ? 1 : 0;
      hole.hammerValue = hole.pendingHammerValue;
      hole.hammerHolder = receiver;
      hole.pendingHammer = false;
      hole.hammerHistory = [
        ...hole.hammerHistory,
        { team: receiver, action: 'accept', value: hole.hammerValue },
      ];
      holes[holeIndex] = hole;
      return { ...state, holes };
    }

    case 'CONCEDE_HAMMER': {
      const { holeIndex } = action;
      const holes = [...state.holes];
      const hole = { ...holes[holeIndex] };
      // The team that concedes loses at current pending value
      const concedeTeam = hole.hammerHolder === 0 ? 1 : 0; // receiver concedes
      hole.hammerConceded = true;
      hole.hammerConcedeTeam = concedeTeam;
      hole.hammerValue = hole.pendingHammerValue;
      hole.pendingHammer = false;
      hole.hammerHistory = [
        ...hole.hammerHistory,
        { team: concedeTeam, action: 'concede', value: hole.hammerValue },
      ];
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
      const { players, baseBet, gameMode, skinCarryover } = state;

      // Calculate net scores
      const netScores = calculateNetScores(hole.grossScores, players, hole);
      hole.netScores = netScores;

      // Resolve hammer
      const { hammerWinner, finalHammerValue: rawHammerValue } = resolveHammer(
        hole, hole.teams, netScores
      );

      // Resolve skin
      const { skinWinner, skinValue, carryover } = resolveSkin(
        netScores, players, hole.skinCarryoverIn
      );

      // Apply birdie/eagle multipliers
      const { finalHammerValue, finalSkinValue } = applyBirdieEagleMultipliers(
        hole.grossScores, hole, hole.teams, hammerWinner,
        rawHammerValue, skinValue, gameMode
      );

      // Calculate money deltas
      const moneyDeltas = calculateMoneyDeltas(
        hole.teams, hammerWinner, finalHammerValue,
        skinWinner, finalSkinValue, players
      );

      hole.hammerWinner = hammerWinner;
      hole.finalHammerValue = finalHammerValue;
      hole.skinWinner = skinWinner;
      hole.skinValue = finalSkinValue;
      hole.moneyDeltas = moneyDeltas;

      holes[holeIndex] = hole;

      // Update running totals
      const runningTotals = { ...state.runningTotals };
      for (const player of players) {
        runningTotals[player.id] = (runningTotals[player.id] ?? 0) + (moneyDeltas[player.id] ?? 0);
      }

      // New skin carryover
      const newSkinCarryover = skinWinner ? 0 : hole.skinCarryoverIn + baseBet;

      return {
        ...state,
        holes,
        runningTotals,
        skinCarryover: newSkinCarryover,
        phase: holeIndex === (state.course.holes.length - 1) ? 'complete' : 'hole_summary',
      };
    }

    case 'NEXT_HOLE': {
      const nextIndex = state.currentHoleIndex + 1;
      if (nextIndex >= state.course.holes.length) {
        return { ...state, phase: 'complete' };
      }
      const newHole = buildInitialHole(nextIndex, state);
      const holes = [...state.holes];
      holes[nextIndex] = newHole;
      return {
        ...state,
        currentHoleIndex: nextIndex,
        holes,
        phase: 'playing',
      };
    }

    case 'UNDO_HOLE': {
      const { holeIndex } = action;
      if (holeIndex <= 0) return state;
      const holes = [...state.holes];
      // Remove delta from running totals
      const runningTotals = { ...state.runningTotals };
      const hole = holes[holeIndex];
      if (hole?.moneyDeltas) {
        for (const [pid, delta] of Object.entries(hole.moneyDeltas)) {
          runningTotals[pid] = (runningTotals[pid] ?? 0) - delta;
        }
      }
      // Restore skin carryover
      const skinCarryover = hole?.skinCarryoverIn ?? state.skinCarryover;
      // Reset current hole to its initial state
      const resetHole = buildInitialHole(holeIndex, { ...state, runningTotals, skinCarryover });
      holes[holeIndex] = resetHole;
      return {
        ...state,
        holes,
        runningTotals,
        skinCarryover,
        currentHoleIndex: holeIndex,
        phase: 'playing',
      };
    }

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
    throwHammer: useCallback((holeIndex) => dispatch({ type: 'THROW_HAMMER', holeIndex }), []),
    acceptHammer: useCallback((holeIndex) => dispatch({ type: 'ACCEPT_HAMMER', holeIndex }), []),
    concedeHammer: useCallback((holeIndex) => dispatch({ type: 'CONCEDE_HAMMER', holeIndex }), []),
    setGrossScore: useCallback((holeIndex, playerId, score) =>
      dispatch({ type: 'SET_GROSS_SCORE', holeIndex, playerId, score }), []),
    lockHoleScores: useCallback((holeIndex) => dispatch({ type: 'LOCK_HOLE_SCORES', holeIndex }), []),
    nextHole: useCallback(() => dispatch({ type: 'NEXT_HOLE' }), []),
    undoHole: useCallback((holeIndex) => dispatch({ type: 'UNDO_HOLE', holeIndex }), []),
    finishRound: useCallback(() => dispatch({ type: 'FINISH_ROUND' }), []),
    newGame: useCallback(() => dispatch({ type: 'NEW_GAME' }), []),
  };

  return { state, ...actions };
}
