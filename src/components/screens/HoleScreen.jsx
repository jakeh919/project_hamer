import { useState } from 'react';
import WolfPicker from '../hole/WolfPicker';
import RotatingTeamPicker from '../hole/RotatingTeamPicker';
import HammerTracker from '../hole/HammerTracker';
import ScoreEntry from '../hole/ScoreEntry';
import Button from '../ui/Button';

export default function HoleScreen({ state, actions }) {
  const { currentHoleIndex, holes, players, gameMode, teamMode, editingFromAudit } = state;
  const hole = holes[currentHoleIndex];
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (!hole) return null;

  const teamsReady = (() => {
    if (gameMode === '4player') {
      if (teamMode === 'fixed') return true;
      return hole.teams[0]?.length === 2 && hole.teams[1]?.length === 2;
    }
    return hole.teams[0]?.length > 0 && (hole.teams[0].length + hole.teams[1].length) === players.length;
  })();

  // Scores are always set (default to par), so always ready
  const allScoresEntered = players.every(p => hole.grossScores[p.id] != null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="text-gray-500 hover:text-gray-300 text-sm px-2 py-1 rounded"
          >
            ✕ Exit
          </button>
          <button
            onClick={actions.openAuditLog}
            className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded"
          >
            History
          </button>
        </div>
        <div className="flex items-end gap-4">
          <span className="text-white font-black text-5xl">{hole.number}</span>
          <div className="flex gap-4 text-sm pb-1">
            <span className="text-gray-300">Par <strong className="text-white">{hole.par}</strong></span>
            <span className="text-gray-300">{hole.yardage} yds</span>
            <span className="text-gray-500">Hdcp {hole.rating}</span>
          </div>
          {editingFromAudit && (
            <span className="ml-auto text-yellow-400 text-xs font-medium pb-1">Editing</span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 p-4 pb-24">
        {gameMode === '5player' && (
          <WolfPicker
            hole={hole}
            players={players}
            onPartnerSet={(wolfId, partnerId, wolfAlone) =>
              actions.setWolfPartner(currentHoleIndex, wolfId, partnerId, wolfAlone)
            }
          />
        )}

        {gameMode === '4player' && teamMode === 'rotating' && (
          <RotatingTeamPicker
            hole={hole}
            players={players}
            holeIndex={currentHoleIndex}
            onTeamsSet={(teams) => actions.setHoleTeams(currentHoleIndex, teams)}
          />
        )}

        <HammerTracker
          hole={hole}
          holeIndex={currentHoleIndex}
          onIncrement={actions.incrementHammer}
          onDecrement={actions.decrementHammer}
        />

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
          disabled={!teamsReady}
          size="lg"
          className="w-full"
        >
          {!teamsReady ? 'Set teams first' : editingFromAudit ? 'Save Changes' : 'Lock Scores & Finish Hole'}
        </Button>
      </div>

      {/* Exit confirmation overlay */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <h3 className="text-white font-bold text-lg">Exit Round?</h3>
            <p className="text-gray-400 text-sm">Your progress is saved. You can resume from the home screen.</p>
            <div className="flex gap-3">
              <Button onClick={() => setShowExitConfirm(false)} variant="ghost" className="flex-1">
                Cancel
              </Button>
              <Button onClick={actions.exitRound} variant="danger" className="flex-1">
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
