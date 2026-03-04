import PlayersStep from '../setup/PlayersStep';
import HandicapsStep from '../setup/HandicapsStep';
import CourseStep from '../setup/CourseStep';
import BetStep from '../setup/BetStep';
import TeamsStep from '../setup/TeamsStep';

const STEPS = ['players', 'handicaps', 'course', 'bet', 'teams'];
const STEP_LABELS = ['Players', 'Handicaps', 'Course', 'Bet', 'Teams'];

export default function SetupScreen({ state, actions }) {
  const { setupStep, players, course, baseBet, teamMode, gameMode, fixedTeams } = state;

  const stepIndex = STEPS.indexOf(setupStep);

  function goStep(step) {
    actions.setSetupStep(step);
  }

  function handlePlayers(updatedPlayers) {
    actions.setPlayers(updatedPlayers);
    goStep('handicaps');
  }

  function handleHandicaps(updatedPlayers) {
    actions.setPlayers(updatedPlayers);
    goStep('course');
  }

  function handleCourse(selectedCourse) {
    actions.setCourse(selectedCourse);
    goStep('bet');
  }

  function handleBet(newBaseBet, newTeamMode) {
    actions.setBetAndMode(newBaseBet, newTeamMode);
    if (gameMode === '4player' && newTeamMode === 'fixed') {
      goStep('teams');
    } else {
      actions.startRound();
    }
  }

  function handleTeams(teams) {
    actions.setFixedTeams(teams);
    actions.startRound();
  }

  // Steps available in this game mode
  const visibleSteps = STEPS.filter(s => {
    if (s === 'teams') return gameMode === '4player'; // shown but only relevant for fixed
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Progress bar */}
      <div className="flex gap-1 p-4 pt-6">
        {visibleSteps.map((s, i) => {
          const idx = STEPS.indexOf(s);
          const isActive = s === setupStep;
          const isDone = STEPS.indexOf(s) < stepIndex;
          return (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${isDone ? 'bg-green-500' : isActive ? 'bg-green-400' : 'bg-gray-700'}`}
            />
          );
        })}
      </div>

      <div className="flex-1 px-4 pb-8 pt-2">
        {setupStep === 'players' && (
          <PlayersStep players={players} onNext={handlePlayers} />
        )}
        {setupStep === 'handicaps' && (
          <HandicapsStep
            players={players}
            onNext={handleHandicaps}
            onBack={() => goStep('players')}
          />
        )}
        {setupStep === 'course' && (
          <CourseStep
            selectedCourse={course}
            onNext={handleCourse}
            onBack={() => goStep('handicaps')}
          />
        )}
        {setupStep === 'bet' && (
          <BetStep
            baseBet={baseBet}
            teamMode={teamMode}
            gameMode={gameMode}
            onNext={handleBet}
            onBack={() => goStep('course')}
          />
        )}
        {setupStep === 'teams' && (
          <TeamsStep
            players={players}
            fixedTeams={fixedTeams}
            onNext={handleTeams}
            onBack={() => goStep('bet')}
          />
        )}
      </div>
    </div>
  );
}
