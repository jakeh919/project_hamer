export default function HammerTracker({ hole, holeIndex, onIncrement, onDecrement }) {
  const { hammerCount, hammerValue, hammerBaseValue } = hole;

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm font-medium">Hammers</span>
        <span className="text-yellow-400 font-black text-2xl">${hammerValue}</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => onDecrement(holeIndex)}
          disabled={hammerCount === 0}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white font-bold text-2xl flex items-center justify-center"
        >
          −
        </button>

        <div className="flex-1 flex items-center justify-center gap-2">
          {hammerCount === 0 ? (
            <span className="text-gray-500 text-sm">No hammers yet</span>
          ) : (
            Array.from({ length: hammerCount }).map((_, i) => (
              <span key={i} className="text-2xl">🔨</span>
            ))
          )}
        </div>

        <button
          onClick={() => onIncrement(holeIndex)}
          className="w-12 h-12 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-2xl flex items-center justify-center"
        >
          +
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
