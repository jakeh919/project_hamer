import Button from '../ui/Button';

export default function HammerTracker({ hole, players, holeIndex, onThrow, onAccept, onConcede }) {
  const { hammerValue, hammerHolder, pendingHammer, pendingHammerValue, hammerConceded, hammerHistory, teams } = hole;

  const team0Names = (teams[0] || []).map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(' & ');
  const team1Names = (teams[1] || []).map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(' & ');
  const teamNames = [team0Names || 'Team A', team1Names || 'Team B'];

  const holderName = teamNames[hammerHolder];
  const receiverIdx = hammerHolder === 0 ? 1 : 0;
  const receiverName = teamNames[receiverIdx];

  if (hammerConceded) {
    const winTeam = hole.hammerConcedeTeam === 0 ? 1 : 0;
    return (
      <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm font-medium">Hammer</span>
          <span className="text-red-400 font-bold">Conceded</span>
        </div>
        <p className="text-white text-sm">{teamNames[hole.hammerConcedeTeam]} conceded — {teamNames[winTeam]} wins ${hammerValue}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm font-medium">Hammer</span>
        <span className="text-yellow-400 font-black text-2xl">${pendingHammer ? pendingHammerValue : hammerValue}</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">Held by:</span>
        <span className="text-white font-semibold">{holderName}</span>
      </div>

      {pendingHammer ? (
        <div className="flex flex-col gap-2">
          <p className="text-yellow-300 text-sm font-medium">
            {holderName} threw the hammer → ${pendingHammerValue}
          </p>
          <p className="text-gray-400 text-sm">{receiverName}: accept or concede?</p>
          <div className="flex gap-2">
            <Button onClick={() => onAccept(holeIndex)} variant="primary" className="flex-1">
              Accept ${pendingHammerValue}
            </Button>
            <Button onClick={() => onConcede(holeIndex)} variant="danger" className="flex-1">
              Concede
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => onThrow(holeIndex)}
          variant="yellow"
          className="w-full"
          size="lg"
        >
          Throw Hammer → ${hammerValue * 2}
        </Button>
      )}

      {hammerHistory.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">History</span>
          {hammerHistory.map((entry, i) => (
            <div key={i} className="text-xs text-gray-400 flex items-center gap-2">
              <span className={entry.action === 'throw' ? 'text-yellow-400' : entry.action === 'accept' ? 'text-green-400' : 'text-red-400'}>
                {entry.action === 'throw' ? '→' : entry.action === 'accept' ? '✓' : '✗'}
              </span>
              <span>{teamNames[entry.team]} {entry.action} ${entry.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
