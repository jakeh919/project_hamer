import WolfPicker from '../hole/WolfPicker';
import RotatingTeamPicker from '../hole/RotatingTeamPicker';
import HammerTracker from '../hole/HammerTracker';
import ScoreEntry from '../hole/ScoreEntry';
import Button from '../ui/Button';

export default function HoleScreen({ state, actions }) {
  const { currentHoleIndex, holes, players, gameMode, teamMode, baseBet, course } = state;
  const hole = holes[currentHoleIndex];

  if (!hole) return null;

  const teamsReady = (() => {
    if (gameMode === '4player') {
      if (teamMode === 'fixed') return true;
      // rotating: need 2+2
      return hole.teams[0]?.length === 2 && hole.teams[1]?.length === 2;
    }
    // 5-player: need wolf partner picked
    return hole.teams[0]?.length > 0 && (hole.teams[0].length + hole.teams[1].length) === players.length;
  })();

  const allScoresEntered = players.every(p => hole.grossScores[p.id] != null);

  const holeData = course.holes[currentHoleIndex];

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400 text-sm">Hole</span>
          <span className="text-gray-400 text-sm">${hole.hammerValue} {hole.pendingHammer ? `→ $${hole.pendingHammerValue}` : ''}</span>
        </div>
        <div className="flex items-end gap-4">
          <span className="text-white font-black text-5xl">{hole.number}</span>
          <div className="flex gap-4 text-sm pb-1">
            <span className="text-gray-300">Par <strong className="text-white">{hole.par}</strong></span>
            <span className="text-gray-300">{hole.yardage} yds</span>
            <span className="text-gray-500">Hdcp {hole.rating}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 p-4 pb-24">
        {/* 5-player: Wolf partner picking */}
        {gameMode === '5player' && (
          <WolfPicker
            hole={hole}
            players={players}
            onPartnerSet={(wolfId, partnerId, wolfAlone) =>
              actions.setWolfPartner(currentHoleIndex, wolfId, partnerId, wolfAlone)
            }
          />
        )}

        {/* 4-player rotating: team assignment */}
        {gameMode === '4player' && teamMode === 'rotating' && (
          <RotatingTeamPicker
            hole={hole}
            players={players}
            holeIndex={currentHoleIndex}
            onTeamsSet={(teams) => actions.setHoleTeams(currentHoleIndex, teams)}
          />
        )}

        {/* Hammer tracker (shown once teams are set) */}
        {teamsReady && (
          <HammerTracker
            hole={hole}
            players={players}
            holeIndex={currentHoleIndex}
            onThrow={actions.throwHammer}
            onAccept={actions.acceptHammer}
            onConcede={actions.concedeHammer}
          />
        )}

        {/* Score entry */}
        <ScoreEntry
          hole={hole}
          players={players}
          holeIndex={currentHoleIndex}
          onScoreChange={actions.setGrossScore}
        />
      </div>

      {/* Lock scores button */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 p-4">
        <Button
          onClick={() => actions.lockHoleScores(currentHoleIndex)}
          disabled={!allScoresEntered || !teamsReady}
          size="lg"
          className="w-full"
        >
          {!allScoresEntered
            ? 'Enter all scores'
            : !teamsReady
            ? 'Set teams first'
            : 'Lock Scores & Finish Hole'}
        </Button>
      </div>
    </div>
  );
}
