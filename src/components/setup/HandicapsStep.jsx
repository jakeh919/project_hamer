import { useState } from 'react';
import Button from '../ui/Button';

export default function HandicapsStep({ players: initialPlayers, onNext, onBack }) {
  const [players, setPlayers] = useState(initialPlayers);

  function updateHandicap(id, value) {
    const hcp = Math.min(36, Math.max(0, parseInt(value) || 0));
    setPlayers(players.map(p => p.id === id ? { ...p, handicap: hcp } : p));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Handicaps</h2>
        <p className="text-gray-400 text-sm mt-1">Enter each player's course handicap (0–36)</p>
      </div>

      <div className="flex flex-col gap-4">
        {players.map((player) => (
          <div key={player.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <span className="text-white font-semibold text-lg">{player.name}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateHandicap(player.id, player.handicap - 1)}
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl flex items-center justify-center"
              >
                −
              </button>
              <span className="text-white font-bold text-2xl w-10 text-center">
                {player.handicap}
              </span>
              <button
                onClick={() => updateHandicap(player.id, player.handicap + 1)}
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="ghost" size="lg" className="flex-1">
          Back
        </Button>
        <Button onClick={() => onNext(players)} size="lg" className="flex-1">
          Next: Course
        </Button>
      </div>
    </div>
  );
}
