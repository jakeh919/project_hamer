import { useState } from 'react';
import Button from '../ui/Button';

export default function BetStep({ baseBet: initBet, teamMode: initMode, gameMode, onNext, onBack }) {
  const [baseBet, setBaseBet] = useState(initBet ?? 5);
  const [teamMode, setTeamMode] = useState(initMode ?? 'fixed');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Bet Setup</h2>
        <p className="text-gray-400 text-sm mt-1">Set the base bet amount</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
        <span className="text-gray-300 font-medium">Base Bet</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setBaseBet(b => Math.max(1, b - 1))}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl flex items-center justify-center"
          >
            −
          </button>
          <span className="text-white font-black text-4xl w-20 text-center">${baseBet}</span>
          <button
            onClick={() => setBaseBet(b => b + 1)}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {gameMode === '4player' && (
        <div className="flex flex-col gap-2">
          <span className="text-gray-300 font-medium">Team Mode</span>
          <div className="flex gap-2">
            <button
              onClick={() => setTeamMode('fixed')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${teamMode === 'fixed' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              Fixed Teams
            </button>
            <button
              onClick={() => setTeamMode('rotating')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${teamMode === 'rotating' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            >
              Rotating Teams
            </button>
          </div>
          <p className="text-gray-500 text-xs">
            {teamMode === 'fixed'
              ? 'Same teams all round. Assign next.'
              : 'Manually set teams each hole.'}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="ghost" size="lg" className="flex-1">
          Back
        </Button>
        <Button onClick={() => onNext(baseBet, teamMode)} size="lg" className="flex-1">
          {gameMode === '4player' && teamMode === 'fixed' ? 'Next: Teams' : 'Start Round'}
        </Button>
      </div>
    </div>
  );
}
