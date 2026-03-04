import { useState } from 'react';
import Button from '../ui/Button';

/**
 * 5-player Wolf partner picking.
 * Wolf sees each player "hit" in sequence; after each non-wolf player hits,
 * wolf can pick them as partner (or wait). After all 4 hit, wolf can go alone.
 */
export default function WolfPicker({ hole, players, onPartnerSet }) {
  const wolfId = hole.wolfId;
  const wolfPlayer = players.find(p => p.id === wolfId);
  const nonWolfPlayers = players.filter(p => p.id !== wolfId);

  const [revealedIndex, setRevealedIndex] = useState(0);
  const [picked, setPicked] = useState(null);

  // If partner already set, show current state
  if (hole.teams[0]?.length > 0 && (hole.teams[0]?.length + hole.teams[1]?.length) === players.length) {
    const wolfTeam = hole.teams[0].includes(wolfId) ? hole.teams[0] : hole.teams[1];
    const otherTeam = hole.teams[0].includes(wolfId) ? hole.teams[1] : hole.teams[0];
    const isAlone = wolfTeam.length === 1;
    return (
      <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="text-sm text-gray-400">Wolf: <span className="text-yellow-400 font-bold">{wolfPlayer?.name}</span></div>
        <div className="text-sm text-gray-300">
          {isAlone
            ? `${wolfPlayer?.name} is going alone!`
            : `Team: ${wolfTeam.map(id => players.find(p => p.id === id)?.name).join(' & ')}`}
        </div>
        <div className="text-sm text-gray-500">vs {otherTeam.map(id => players.find(p => p.id === id)?.name).join(', ')}</div>
      </div>
    );
  }

  function pickPartner(partnerId) {
    setPicked(partnerId);
    onPartnerSet(wolfId, partnerId, false);
  }

  function goAlone() {
    onPartnerSet(wolfId, null, true);
  }

  const allRevealed = revealedIndex >= nonWolfPlayers.length;

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Wolf</span>
        <span className="text-yellow-400 font-bold">{wolfPlayer?.name}</span>
      </div>

      <p className="text-gray-400 text-sm">Tap "Hit" as each player tees off. Wolf can pick partner after each shot.</p>

      <div className="flex flex-col gap-2">
        {nonWolfPlayers.map((player, i) => {
          const revealed = i < revealedIndex;
          const justRevealed = i === revealedIndex - 1;
          return (
            <div key={player.id} className={`flex items-center gap-3 p-3 rounded-lg ${revealed ? 'bg-gray-700' : 'bg-gray-900'}`}>
              <span className={`flex-1 font-medium ${revealed ? 'text-white' : 'text-gray-500'}`}>
                {player.name}
              </span>
              {!revealed && i === revealedIndex && (
                <button
                  onClick={() => setRevealedIndex(i + 1)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-semibold"
                >
                  Hit
                </button>
              )}
              {revealed && !picked && (
                <button
                  onClick={() => pickPartner(player.id)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg font-semibold"
                >
                  Pick
                </button>
              )}
            </div>
          );
        })}
      </div>

      {allRevealed && !picked && (
        <Button onClick={goAlone} variant="yellow" className="w-full">
          Go Alone!
        </Button>
      )}
    </div>
  );
}
