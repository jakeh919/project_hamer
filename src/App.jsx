import { useGameState } from './hooks/useGameState';
import HomeScreen from './components/screens/HomeScreen';
import SetupScreen from './components/screens/SetupScreen';
import HoleScreen from './components/screens/HoleScreen';
import HoleSummaryScreen from './components/screens/HoleSummaryScreen';
import FinalSummaryScreen from './components/screens/FinalSummaryScreen';
import AuditLogScreen from './components/screens/AuditLogScreen';

export default function App() {
  const { state, ...actions } = useGameState();

  const hasResumable = state.phase !== 'home' && state.phase !== 'setup';

  if (state.phase === 'home') {
    return (
      <HomeScreen
        onNewGame={actions.startNewGame}
        onResume={actions.resumeGame}
        hasResumable={hasResumable}
      />
    );
  }

  if (state.phase === 'setup') {
    return <SetupScreen state={state} actions={actions} />;
  }

  if (state.phase === 'playing') {
    return <HoleScreen state={state} actions={actions} />;
  }

  if (state.phase === 'hole_summary') {
    return <HoleSummaryScreen state={state} actions={actions} />;
  }

  if (state.phase === 'audit_log') {
    return <AuditLogScreen state={state} actions={actions} />;
  }

  if (state.phase === 'complete') {
    return <FinalSummaryScreen state={state} actions={actions} />;
  }

  return null;
}
