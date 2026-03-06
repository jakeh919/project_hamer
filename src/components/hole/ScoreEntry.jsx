import { getStrokesOnHole } from '../../utils/gameLogic';

export default function ScoreEntry({ hole, players, holeIndex, onScoreChange }) {
  const par = hole.par;

  function getScoreLabel(gross, par) {
    const diff = gross - par;
    if (diff <= -2) return 'Eagle';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double';
    return `+${diff}`;
  }

  function getScoreColor(gross, par) {
    const diff = gross - par;
    if (diff <= -2) return 'text-yellow-400';
    if (diff === -1) return 'text-green-400';
    if (diff === 0) return 'text-blue-400';
    if (diff === 1) return 'text-gray-300';
    return 'text-red-400';
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-gray-400 text-sm font-medium">Scores (Par {par})</span>
      {players.map(player => {
        const gross = hole.grossScores[player.id] ?? par;
        const getsStroke = getStrokesOnHole(player, hole.rating) === 1;
        return (
          <div key={player.id} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-white font-medium">{player.name}</span>
              {getsStroke && (
                <span
                  title="Gets a stroke on this hole"
                  className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold leading-none"
                >
                  +
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onScoreChange(holeIndex, player.id, Math.max(1, gross - 1))}
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl flex items-center justify-center"
              >
                −
              </button>
              <div className="flex flex-col items-center w-14">
                <span className={`font-black text-2xl ${getScoreColor(gross, par)}`}>
                  {gross}
                </span>
                <span className={`text-xs ${getScoreColor(gross, par)}`}>
                  {getScoreLabel(gross, par)}
                </span>
              </div>
              <button
                onClick={() => onScoreChange(holeIndex, player.id, gross + 1)}
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
