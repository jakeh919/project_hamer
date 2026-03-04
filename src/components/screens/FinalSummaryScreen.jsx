import Button from '../ui/Button';
import Card from '../ui/Card';
import { buildPayoutMatrix } from '../../utils/gameLogic';

export default function FinalSummaryScreen({ state, actions }) {
  const { players, holes, runningTotals, course } = state;

  const completedHoles = holes.filter(Boolean);

  const payouts = buildPayoutMatrix(players, runningTotals);

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  function formatDelta(val) {
    if (val == null || val === 0) return '$0';
    return val > 0 ? `+$${val.toFixed(2).replace(/\.00$/, '')}` : `-$${Math.abs(val).toFixed(2).replace(/\.00$/, '')}`;
  }

  function getScoreBg(gross, par) {
    if (gross == null) return '';
    const diff = gross - par;
    if (diff <= -2) return 'bg-yellow-500 text-black';
    if (diff === -1) return 'bg-green-600 text-white';
    if (diff === 0) return '';
    if (diff === 1) return '';
    return 'bg-red-900 text-red-200';
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 pb-24">
      <div className="bg-gray-900 px-4 py-5 border-b border-gray-800">
        <div className="text-gray-400 text-sm">{course?.name}</div>
        <div className="text-white font-black text-2xl">Final Results</div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Final totals */}
        <Card>
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Final Totals</div>
          <div className="flex flex-col gap-2">
            {[...players]
              .sort((a, b) => (runningTotals[b.id] ?? 0) - (runningTotals[a.id] ?? 0))
              .map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-0">
                  <span className="text-gray-500 w-4">{i + 1}</span>
                  <span className="text-white font-semibold flex-1">{p.name}</span>
                  <span className={`font-black text-xl ${(runningTotals[p.id] ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatDelta(runningTotals[p.id] ?? 0)}
                  </span>
                </div>
              ))}
          </div>
        </Card>

        {/* Payout matrix */}
        {payouts.length > 0 && (
          <Card>
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Payouts</div>
            <div className="flex flex-col gap-2">
              {payouts.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-red-400 font-medium">{playerMap[p.from]?.name}</span>
                  <span className="text-gray-500">owes</span>
                  <span className="text-green-400 font-medium">{playerMap[p.to]?.name}</span>
                  <span className="text-white font-bold ml-auto">${p.amount.toFixed(2).replace(/\.00$/, '')}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Scorecard */}
        <Card className="overflow-x-auto">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Scorecard</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left py-1 pr-2 font-medium">Hole</th>
                <th className="text-center py-1 px-1 font-medium">Par</th>
                {players.map(p => (
                  <th key={p.id} className="text-center py-1 px-1 font-medium text-gray-300">{p.name.slice(0, 4)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completedHoles.map((hole) => (
                <tr key={hole.number} className="border-t border-gray-700">
                  <td className="py-1.5 pr-2 text-gray-400">{hole.number}</td>
                  <td className="py-1.5 px-1 text-center text-gray-400">{hole.par}</td>
                  {players.map(p => {
                    const gross = hole.grossScores[p.id];
                    const bg = getScoreBg(gross, hole.par);
                    return (
                      <td key={p.id} className="py-1.5 px-1 text-center">
                        <span className={`inline-block w-6 h-6 leading-6 rounded-sm text-center ${bg || 'text-gray-300'}`}>
                          {gross ?? '—'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-gray-500 font-bold">
                <td className="py-1.5 pr-2 text-gray-300">Total</td>
                <td className="py-1.5 px-1 text-center text-gray-300">
                  {completedHoles.reduce((s, h) => s + (h.par ?? 0), 0)}
                </td>
                {players.map(p => {
                  const total = completedHoles.reduce((s, h) => s + (h.grossScores[p.id] ?? 0), 0);
                  return (
                    <td key={p.id} className="py-1.5 px-1 text-center text-white">{total || '—'}</td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 p-4">
        <Button onClick={actions.newGame} variant="primary" size="lg" className="w-full">
          New Game
        </Button>
      </div>
    </div>
  );
}
