import React from 'react';
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import { ControlBarProps } from '../types';

export const ControlBar: React.FC<ControlBarProps> = ({
  isPlaying,
  onPlayPause,
  onStep,
  onReset,
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center justify-between w-full gap-3 p-2 bg-zinc-800/40 backdrop-blur-md border border-white/5 rounded-[2rem] shadow-inner">
        <button
          onClick={onReset}
          className="p-3 rounded-full hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all active:scale-90"
          title="Reset Simulation"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={onPlayPause}
          className={`p-4 rounded-full transition-all active:scale-95 flex items-center justify-center ${
            isPlaying
              ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
          }`}
          title={isPlaying ? 'Pause' : 'Start'}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>

        <button
          onClick={onStep}
          disabled={isPlaying}
          className="p-3 rounded-full hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          title="Next Step"
        >
          <StepForward size={18} />
        </button>
      </div>
    </div>
  );
};