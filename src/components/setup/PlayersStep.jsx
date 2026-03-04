import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function PlayersStep({ players: initialPlayers, onNext }) {
  const [players, setPlayers] = useState(
    initialPlayers?.length ? initialPlayers : [
      { id: generateId(), name: '', handicap: 0 },
      { id: generateId(), name: '', handicap: 0 },
      { id: generateId(), name: '', handicap: 0 },
      { id: generateId(), name: '', handicap: 0 },
    ]
  );

  const canAdd = players.length < 5;
  const canRemove = players.length > 2;
  const allFilled = players.every(p => p.name.trim().length > 0);

  function addPlayer() {
    if (canAdd) setPlayers([...players, { id: generateId(), name: '', handicap: 0 }]);
  }

  function removePlayer(id) {
    if (canRemove) setPlayers(players.filter(p => p.id !== id));
  }

  function updateName(id, name) {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Players</h2>
        <p className="text-gray-400 text-sm mt-1">
          {players.length === 5 ? '5-player mode (Wolf)' : '4-player mode'} · {players.length}/5 players
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {players.map((player, i) => (
          <div key={player.id} className="flex gap-2 items-end">
            <Input
              label={`Player ${i + 1}`}
              value={player.name}
              onChange={e => updateName(player.id, e.target.value)}
              placeholder={`Player ${i + 1} name`}
              className="flex-1"
            />
            {canRemove && (
              <button
                onClick={() => removePlayer(player.id)}
                className="mb-0.5 p-2.5 rounded-lg bg-gray-700 hover:bg-red-800 text-gray-300 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {canAdd && (
          <Button onClick={addPlayer} variant="outline" className="flex-1">
            + Add Player
          </Button>
        )}
      </div>

      <Button
        onClick={() => onNext(players)}
        disabled={!allFilled}
        size="lg"
        className="w-full"
      >
        Next: Handicaps
      </Button>
    </div>
  );
}
