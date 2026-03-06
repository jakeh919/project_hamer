import Card from '../ui/Card';
import Button from '../ui/Button';

function formatDelta(val) {
  if (val == null || val === 0) return '$0';
  return val > 0 ? `+$${val.toFixed(2).replace(/\.00$/, '')}` : `-$${Math.abs(val).toFixed(2).replace(/\.00$/, '')}`;
}

function ScoreCell({ gross, par }) {
  if (gross == null) return <span className="text-gray-600">—</span>;
  const diff = gross - par;
  let color = 'text-gray-300';
  if (diff <= -2) color = 'text-yellow-400 font-bold';
  else if (diff === -1) color = 'text-green-400 font-bold';
  else if (diff >= 2) color = 'text-red-400';
  return <span className={color}>{gross}</span>;
}

export default function AuditLogScreen({ state, actions }) {
  const { holes, players, runningTotals, course } = state;
  const completedHoles = holes.filter(h => h && Object.keys(h.moneyDeltas ?? {}).length > 0);
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 pb-6">
      <div className="bg-gray-900 px-4 py-5 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-white font-bold text-xl">Score History</h2>
        <button
          onClick={actions.closeAuditLog}
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded"
        >
          ← Back
        </button>
      </div>

      {completedHoles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No holes completed yet
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          {/* Running totals summary */}
          <Card>
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Running Totals</div>
            <div className="flex flex-col gap-2">
              {[...players]
                .sort((a, b) => (runningTotals[b.id] ?? 0) - (runningTotals[a.id] ?? 0))
                .map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm w-4">{i + 1}</span>
                    <span className="text-white flex-1">{p.name}</span>
                    <span className={`font-bold ${(runningTotals[p.id] ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatDelta(runningTotals[p.id] ?? 0)}
                    </span>
                  </div>
                ))}
            </div>
          </Card>

          {/* Per-hole breakdown */}
          {completedHoles.map((hole) => {
            const team0Names = (hole.teams[0] || []).map(id => playerMap[id]?.name).filter(Boolean).join(' & ');
            const team1Names = (hole.teams[1] || []).map(id => playerMap[id]?.name).filter(Boolean).join(' & ');
            const teamNames = [team0Names || 'Team A', team1Names || 'Team B'];

            return (
              <Card key={hole.number} className="flex flex-col gap-3">
                {/* Hole header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-black text-2xl">Hole {hole.number}</span>
                    <span className="text-gray-500 text-sm">Par {hole.par}</span>
                    {hole.hammerCount > 0 && (
                      <span className="text-yellow-400 text-sm">
                        {'🔨'.repeat(Math.min(hole.hammerCount, 4))} ${hole.finalHammerValue}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => actions.editHole(hole.number - 1)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium px-2 py-1 rounded border border-blue-800 hover:border-blue-600"
                  >
                    Edit
                  </button>
                </div>

                {/* Scores per player */}
                <div className="flex flex-col gap-1.5">
                  {players.map(p => {
                    const gross = hole.grossScores[p.id];
                    const net = hole.netScores[p.id];
                    const delta = hole.moneyDeltas[p.id] ?? 0;
                    return (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-300 flex-1">{p.name}</span>
                        <span className="text-gray-400 w-8 text-center">
                          <ScoreCell gross={gross} par={hole.par} />
                        </span>
                        {net !== gross && (
                          <span className="text-gray-600 text-xs w-12 text-center">net {net}</span>
                        )}
                        <span className={`font-semibold w-16 text-right ${delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                          {formatDelta(delta)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Result line */}
                <div className="border-t border-gray-700 pt-2 flex flex-wrap gap-3 text-xs">
                  <span className="text-gray-500">
                    Hammer:{' '}
                    {hole.hammerWinner == null
                      ? <span className="text-gray-400">Push</span>
                      : <span className="text-green-400">{teamNames[hole.hammerWinner]} +${hole.finalHammerValue}</span>}
                  </span>
                  <span className="text-gray-500">
                    Skin:{' '}
                    {hole.skinWinner
                      ? <span className="text-yellow-400">{playerMap[hole.skinWinner]?.name} +${hole.skinValue * (players.length - 1)}</span>
                      : <span className="text-gray-400">Carryover</span>}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
