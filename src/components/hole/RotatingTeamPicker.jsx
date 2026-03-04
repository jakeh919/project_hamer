import { useState } from 'react';
import Button from '../ui/Button';

export default function RotatingTeamPicker({ hole, players, holeIndex, onTeamsSet }) {
  const existing = hole.teams;
  const hasTeams = existing[0]?.length === 2 && existing[1]?.length === 2;

  const [teams, setTeams] = useState(() => {
    if (hasTeams) return existing;
    return [
      [players[0].id, players[1].id],
      [players[2].id, players[3].id],
    ];
  });

  if (hasTeams && !isEditing()) {
    const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
    return (
      <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
        <div className="text-sm text-gray-400 font-medium">Teams this hole</div>
        <div className="grid grid-cols-2 gap-3">
          {teams.map((team, i) => (
            <div key={i} className={`rounded-lg p-3 ${i === 0 ? 'bg-blue-900/50' : 'bg-orange-900/50'}`}>
              <div className={`text-xs font-bold uppercase mb-1 ${i === 0 ? 'text-blue-400' : 'text-orange-400'}`}>Team {i === 0 ? 'A' : 'B'}</div>
              {team.map(pid => (
                <div key={pid} className="text-white text-sm">{playerMap[pid]?.name}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function isEditing() { return false; } // simplification — always use state

  function getTeamIdx(playerId) {
    if (teams[0].includes(playerId)) return 0;
    if (teams[1].includes(playerId)) return 1;
    return -1;
  }

  function moveToOther(playerId) {
    const from = getTeamIdx(playerId);
    const to = from === 0 ? 1 : 0;
    if (teams[to].length >= 2) return;
    setTeams([
      to === 0 ? [...teams[0].filter(id => id !== playerId), ...(!teams[0].includes(playerId) ? [playerId] : [])]
              : teams[0].filter(id => id !== playerId),
      to === 1 ? [...teams[1].filter(id => id !== playerId), ...(!teams[1].includes(playerId) ? [playerId] : [])]
              : teams[1].filter(id => id !== playerId),
    ].map((t, i) =>
      i === to ? [...teams[to], playerId] : teams[i].filter(id => id !== playerId)
    ));
  }

  function swap(playerId) {
    const fromIdx = getTeamIdx(playerId);
    if (fromIdx === -1) return;
    const toIdx = fromIdx === 0 ? 1 : 0;
    if (teams[toIdx].length >= 2) return; // can't move
    const newTeams = [
      fromIdx === 0 ? teams[0].filter(id => id !== playerId) : [...teams[0], playerId],
      fromIdx === 1 ? teams[1].filter(id => id !== playerId) : [...teams[1], playerId],
    ];
    setTeams(newTeams);
  }

  const balanced = teams[0].length === 2 && teams[1].length === 2;
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="text-sm text-gray-400 font-medium">Set teams for this hole</div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map(teamIdx => (
          <div key={teamIdx} className={`rounded-xl p-3 flex flex-col gap-2 min-h-24 border ${teamIdx === 0 ? 'border-blue-700 bg-blue-900/20' : 'border-orange-700 bg-orange-900/20'}`}>
            <div className={`text-xs font-bold uppercase ${teamIdx === 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              Team {teamIdx === 0 ? 'A' : 'B'}
            </div>
            {teams[teamIdx].map(pid => (
              <button
                key={pid}
                onClick={() => swap(pid)}
                className={`py-2 px-3 rounded-lg text-white text-sm font-medium ${teamIdx === 0 ? 'bg-blue-700 hover:bg-blue-600' : 'bg-orange-700 hover:bg-orange-600'}`}
              >
                {playerMap[pid]?.name}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-xs">Tap a player to swap teams</p>
      <Button
        onClick={() => onTeamsSet(teams)}
        disabled={!balanced}
        className="w-full"
      >
        Confirm Teams
      </Button>
    </div>
  );
}
