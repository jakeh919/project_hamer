export default function HammerTracker({ hole, holeIndex, onIncrement, onDecrement }) {
  const { hammerCount, hammerValue, hammerBaseValue } = hole;

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-medium">Hammers</span>
          {hammerCount > 0 && (
            <span className="text-gray-500 text-xs">
              {'🔨'.repeat(Math.min(hammerCount, 5))}
            </span>
          )}
        </div>
        <span className="text-yellow-400 font-black text-2xl">${hammerValue}</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onDecrement(holeIndex)}
          disabled={hammerCount === 0}
          className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold text-sm disabled:opacity-30 hover:border-gray-400 hover:text-white transition-colors"
        >
          Remove
        </button>
        <button
          onClick={() => onIncrement(holeIndex)}
          className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-bold text-sm transition-colors"
        >
          🔨 Hammer
        </button>
      </div>

      {hammerCount > 0 && (
        <div className="text-center text-gray-500 text-xs">
          ${hammerBaseValue} × 2<sup>{hammerCount}</sup> = ${hammerValue}
        </div>
      )}
    </div>
  );
}
