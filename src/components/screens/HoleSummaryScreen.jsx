import Button from '../ui/Button';
import Card from '../ui/Card';

export default function HoleSummaryScreen({ state, actions }) {
  const { currentHoleIndex, holes, players, runningTotals, course } = state;
  const hole = holes[currentHoleIndex];

  if (!hole) return null;

  const isLastHole = currentHoleIndex === course.holes.length - 1;

  const sorted = [...players].sort(
    (a, b) => (runningTotals[b.id] ?? 0) - (runningTotals[a.id] ?? 0)
  );

  const team0Names = (hole.teams[0] || []).map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(' & ');
  const team1Names = (hole.teams[1] || []).map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(' & ');
  const teamNames = [team0Names || 'Team A', team1Names || 'Team B'];

  function formatDelta(val) {
    if (val == null || val === 0) return '$0';
    return val > 0 ? `+$${val.toFixed(2).replace(/\.00$/, '')}` : `-$${Math.abs(val).toFixed(2).replace(/\.00$/, '')}`;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 pb-24">
      <div className="bg-gray-900 px-4 py-5 border-b border-gray-800">
        <div className="text-gray-400 text-sm">Hole {hole.number} Summary</div>
        <div className="text-white font-bold text-xl">Par {hole.par} · {hole.yardage} yds</div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Hammer result */}
        <Card>
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Hammer</div>
          {hole.hammerWinner == null ? (
            <div className="text-gray-300 font-semibold">Push — no action</div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">{teamNames[hole.hammerWinner]} wins</span>
              <span className="text-green-400 font-black text-xl">${hole.finalHammerValue}</span>
            </div>
          )}
        </Card>

        {/* Skin result */}
        <Card>
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Skin</div>
          {hole.skinWinner ? (
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">
                {players.find(p => p.id === hole.skinWinner)?.name} wins
              </span>
              <span className="text-yellow-400 font-black text-xl">${hole.skinValue}</span>
            </div>
          ) : (
            <div className="text-gray-300 font-semibold">
              Carryover → ${hole.skinCarryoverIn + (state.baseBet ?? 0)} pot
            </div>
          )}
        </Card>

        {/* Per-player deltas */}
        <Card>
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">This Hole</div>
          <div className="flex flex-col gap-2">
            {players.map(p => {
              const delta = hole.moneyDeltas[p.id] ?? 0;
              const gross = hole.grossScores[p.id];
              const net = hole.netScores[p.id];
              return (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium">{p.name}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {gross ?? '?'} gross · {net ?? '?'} net
                    </span>
                  </div>
                  <span className={`font-bold ${delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {formatDelta(delta)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Leaderboard */}
        <Card>
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Leaderboard</div>
          <div className="flex flex-col gap-2">
            {sorted.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-gray-500 text-sm w-4">{i + 1}</span>
                <span className="text-white flex-1">{p.name}</span>
                <span className={`font-bold ${(runningTotals[p.id] ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatDelta(runningTotals[p.id] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 p-4 flex gap-3">
        <Button
          onClick={() => actions.undoHole(currentHoleIndex)}
          variant="ghost"
          size="lg"
          className="flex-1"
        >
          Undo Hole
        </Button>
        <Button
          onClick={isLastHole ? actions.finishRound : actions.nextHole}
          size="lg"
          className="flex-1"
        >
          {isLastHole ? 'Finish Round' : 'Next Hole'}
        </Button>
      </div>
    </div>
  );
}
