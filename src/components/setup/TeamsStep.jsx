import { useState } from 'react';
import Button from '../ui/Button';

export default function TeamsStep({ players, fixedTeams: initialTeams, onNext, onBack }) {
  // teams[0] = Team A ids, teams[1] = Team B ids
  const [teams, setTeams] = useState(() => {
    if (initialTeams?.[0]?.length && initialTeams?.[1]?.length) return initialTeams;
    // Default: first two vs last two
    return [
      [players[0].id, players[1].id],
      [players[2].id, players[3].id],
    ];
  });

  function getTeam(playerId) {
    if (teams[0].includes(playerId)) return 0;
    if (teams[1].includes(playerId)) return 1;
    return -1;
  }

  function toggleTeam(playerId) {
    const current = getTeam(playerId);
    const newTeam = current === 0 ? 1 : 0;
    // Must keep 2 per team
    const from = teams[current];
    const to = teams[newTeam];
    if (to.length >= 2) return; // can't move
    setTeams([
      newTeam === 0 ? [...to, playerId] : from.filter(id => id !== playerId),
      newTeam === 1 ? [...to, playerId] : from.filter(id => id !== playerId),
    ]);
  }

  const balanced = teams[0].length === 2 && teams[1].length === 2;

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Fixed Teams</h2>
        <p className="text-gray-400 text-sm mt-1">Tap a player to move them between teams</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map(teamIdx => (
          <div key={teamIdx} className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3 min-h-32">
            <div className={`text-sm font-bold uppercase tracking-wider ${teamIdx === 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              Team {teamIdx === 0 ? 'A' : 'B'}
            </div>
            {teams[teamIdx].map(pid => (
              <button
                key={pid}
                onClick={() => toggleTeam(pid)}
                className={`py-2.5 px-3 rounded-lg text-white font-medium text-sm ${teamIdx === 0 ? 'bg-blue-700 hover:bg-blue-600' : 'bg-orange-700 hover:bg-orange-600'}`}
              >
                {playerMap[pid]?.name}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="ghost" size="lg" className="flex-1">
          Back
        </Button>
        <Button onClick={() => onNext(teams)} disabled={!balanced} size="lg" className="flex-1">
          Start Round
        </Button>
      </div>
    </div>
  );
}
