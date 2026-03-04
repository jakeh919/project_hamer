import Button from '../ui/Button';

export default function HomeScreen({ onNewGame, onResume, hasResumable }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-6 gap-8">
      <div className="text-center">
        <div className="text-7xl font-black tracking-widest text-green-400 mb-2">
          HAMMER
        </div>
        <p className="text-gray-400 text-lg">Golf Betting Tracker</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button onClick={onNewGame} variant="primary" size="xl" className="w-full">
          New Game
        </Button>
        {hasResumable && (
          <Button onClick={onResume} variant="secondary" size="xl" className="w-full">
            Resume Game
          </Button>
        )}
      </div>

      <p className="text-gray-600 text-xs">4–5 players · Hammer betting · Skins</p>
    </div>
  );
}
