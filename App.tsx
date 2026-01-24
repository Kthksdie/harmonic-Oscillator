import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWindowSize } from './hooks/useWindowSize';
import { NumberRow } from './components/NumberRow';
import { ControlBar } from './components/ControlBar';
import { TailType } from './types';
import { 
  Gauge, 
  Hash, 
  Target, 
  Brush, 
  Settings2, 
  Palette, 
  Clock, 
  MousePointer2, 
  Maximize, 
  Minimize,
  Wind
} from 'lucide-react';

const PALETTES = [
  { id: 'harmonic', name: 'Harmonic', color: '#6366f1' },
  { id: 'neon', name: 'Neon', color: '#f472b6' },
  { id: 'forest', name: 'Forest', color: '#2dd4bf' },
  { id: 'gold', name: 'Gold', color: '#fbbf24' },
  { id: 'monochrome', name: 'Mono', color: '#9ca3af' },
];

const TAIL_TYPES: { id: TailType; name: string }[] = [
  { id: 'classic', name: 'Classic' },
  { id: 'ghost', name: 'Ghost' },
  { id: 'echo', name: 'Echo' },
  { id: 'stepped', name: 'Stepped' },
  { id: 'glitch', name: 'Glitch' },
];

type SyncMode = 'manual' | 'seconds' | 'ms';

const App: React.FC = () => {
  const { height, width } = useWindowSize();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [shouldWrap, setShouldWrap] = useState<boolean>(true);
  const [isTailEnabled, setIsTailEnabled] = useState<boolean>(true);
  const [tailType, setTailType] = useState<TailType>('classic');
  const [isFollowEnabled, setIsFollowEnabled] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.01);
  const [rowCount, setRowCount] = useState<number>(15);
  const [colorPalette, setColorPalette] = useState<string>('harmonic');
  const [syncMode, setSyncMode] = useState<SyncMode>('manual');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const totalSlots = useMemo(() => rowCount + 1, [rowCount]);
  const actualItemSize = useMemo(() => height / totalSlots, [height, totalSlots]);
  
  const animate = useCallback((time: number) => {
    if (syncMode !== 'manual') {
      const now = Date.now();
      if (syncMode === 'seconds') {
        setCurrentStep(now / 1000);
      } else {
        setCurrentStep(now);
      }
    } else if (isPlaying && lastTimeRef.current !== null) {
      const deltaTime = time - lastTimeRef.current;
      setCurrentStep((prev) => prev + (deltaTime * speedMultiplier)); 
    }
    lastTimeRef.current = time;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, speedMultiplier, syncMode]);

  useEffect(() => {
    const shouldBeRunning = (syncMode !== 'manual') || isPlaying;
    
    if (shouldBeRunning) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate, syncMode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlayPause = () => {
    if (syncMode !== 'manual') {
      setSyncMode('manual');
      setIsPlaying(false);
    } else {
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleStep = () => {
    if (syncMode !== 'manual') setSyncMode('manual');
    setIsPlaying(false);
    setCurrentStep((prev) => Math.floor(prev) + 1);
  };

  const handleReset = () => {
    setSyncMode('manual');
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const activeTurnIndex = useMemo(() => {
    const N = Math.floor(currentStep);
    if (N === 0) return -1;
    for (let i = rowCount; i >= 1; i--) {
       if (N % i === 0) return i;
    }
    return 0;
  }, [currentStep, rowCount]);

  const followerRows = useMemo(() => {
    return Array.from({ length: rowCount }, (_, i) => i + 1);
  }, [rowCount]);

  const leaderXOffset = useMemo(() => {
    const N = currentStep;
    const v = 1; 
    const curCount = Math.floor(N / v);
    const nextTrig = (curCount + 1) * v;
    const dist = nextTrig - N;
    const transitionWidth = 0.5;
    
    let animatedCount = curCount;
    if (dist < transitionWidth) {
      const t = 1 - (dist / transitionWidth);
      const easedT = t * t * (3 - 2 * t);
      animatedCount = curCount + easedT;
    }

    return animatedCount * actualItemSize;
  }, [currentStep, actualItemSize]);

  const focusX = useMemo(() => {
    return isFollowEnabled ? leaderXOffset : 0;
  }, [isFollowEnabled, leaderXOffset]);

  const backgroundX = useMemo(() => {
    if (!isFollowEnabled) return 0;
    const rawOffset = (width / 2) - focusX - (actualItemSize / 2);
    return ((rawOffset % actualItemSize) + actualItemSize) % actualItemSize;
  }, [width, focusX, actualItemSize, isFollowEnabled]);

  const floatingNHorizontalPos = useMemo(() => {
    if (isFollowEnabled) return width / 2;
    return leaderXOffset + (actualItemSize / 2); 
  }, [isFollowEnabled, width, leaderXOffset, actualItemSize]);

  return (
    <div className="relative w-full h-screen bg-[#070709] overflow-hidden select-none">
      
      <div 
        className="absolute top-0 bottom-0 opacity-[0.03] pointer-events-none will-change-transform"
        style={{
          left: `-${actualItemSize}px`,
          right: `-${actualItemSize}px`,
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: `${actualItemSize}px ${actualItemSize}px`,
          transform: `translateX(${backgroundX}px)`,
        }}
      />
      
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div 
        className="absolute z-50 transition-transform duration-75 ease-out will-change-transform flex flex-col items-center pointer-events-none"
        style={{
          left: 0,
          top: 9,
          height: `${actualItemSize}px`,
          width: '1px', 
          transform: `translateX(${floatingNHorizontalPos}px)`,
          justifyContent: 'center'
        }}
      >
        <div className="flex flex-col items-center gap-0">
          <div className="bg-zinc-950/80 backdrop-blur-xl border border-indigo-500/40 px-4 py-1.5 rounded shadow-[0_0_30px_rgba(99,102,241,0.2)] flex items-center justify-center">
            <span className="text-xl font-black text-indigo-400 font-mono tabular-nums leading-none">
              {Math.floor(currentStep).toString()}
            </span>
          </div>
          <div className="w-[1px] h-3 bg-gradient-to-b from-indigo-500/50 to-transparent" />
        </div>
      </div>

      <div className="relative w-full h-full overflow-hidden">
        <div 
          className="relative w-full h-full"
          style={{ transform: `translateY(${actualItemSize}px)` }}
        >
          <NumberRow
            label="1"
            movementValue={1}
            rowIndex={0}
            currentStep={currentStep}
            itemSize={actualItemSize}
            wrapWidth={width}
            shouldWrap={shouldWrap}
            totalRows={totalSlots}
            isTailEnabled={isTailEnabled} 
            tailType={tailType}
            isFollowEnabled={isFollowEnabled}
            colorPalette={colorPalette}
            focusX={focusX}
            viewportWidth={width}
          />
          
          {followerRows.map((val) => (
            <NumberRow
              key={`follower-${val}`}
              label={val + 1}
              movementValue={val + 1}
              rowIndex={val}
              currentStep={currentStep}
              itemSize={actualItemSize}
              wrapWidth={width}
              shouldWrap={shouldWrap}
              totalRows={totalSlots}
              isTailEnabled={isTailEnabled}
              tailType={tailType}
              isFollowEnabled={isFollowEnabled}
              colorPalette={colorPalette}
              focusX={focusX}
              viewportWidth={width}
            />
          ))}
        </div>
      </div>

      {!isFullscreen && (
        <div className="absolute top-6 right-6 z-40 bg-zinc-950/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl w-80 flex flex-col gap-4 animate-in fade-in slide-in-from-right duration-300 max-h-[90vh] overflow-y-auto">
          <div>
            <h1 className="text-zinc-400 text-[10px] font-mono tracking-[0.3em] uppercase mb-4 opacity-80 border-b border-white/5 pb-4 text-center">
              Harmonic Oscillator v12
            </h1>
            
            <div className="space-y-4 font-mono">
              <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 uppercase tracking-widest">Active MOD</span>
                    <span className="text-indigo-400 font-bold">
                      {activeTurnIndex === 0 ? 'Leader' : (activeTurnIndex > 0 ? `MOD ${activeTurnIndex + 1}` : 'Idle')}
                    </span>
                  </div>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                      <Clock size={12} className="text-sky-400" />
                      <span>N-Sync Mode</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['manual', 'seconds', 'ms'] as SyncMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => {
                            setSyncMode(mode);
                            if (mode !== 'manual') setIsPlaying(false);
                          }}
                          className={`py-1.5 px-1 rounded-lg border text-[8px] uppercase font-bold transition-all flex items-center justify-center gap-1 ${
                            syncMode === mode 
                              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.1)]' 
                              : 'bg-zinc-800/40 border-white/5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                          }`}
                        >
                          {mode === 'manual' && <MousePointer2 size={10} />}
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`space-y-2 transition-opacity ${syncMode !== 'manual' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Gauge size={12} className="text-indigo-400" />
                        <span>Velocity</span>
                      </div>
                      <span className="text-zinc-300">{(speedMultiplier * 1000).toFixed(0)}x</span>
                    </div>
                    <input
                      type="range" min="0.001" max="0.05" step="0.001"
                      value={speedMultiplier}
                      onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                      <Hash size={12} className="text-emerald-400" />
                      <span>Count</span>
                    </div>
                    <input
                      type="number" min="1" max="100"
                      value={rowCount}
                      onChange={(e) => setRowCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-zinc-800/50 text-zinc-100 text-xs font-mono w-12 py-1 rounded-lg border border-white/5 outline-none text-center focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                      <Palette size={12} className="text-pink-400" />
                      <span>Follower Palette</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PALETTES.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setColorPalette(p.id)}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-[8px] uppercase font-bold transition-all ${
                            colorPalette === p.id 
                              ? 'bg-zinc-100 text-zinc-950 border-white' 
                              : 'bg-zinc-800/40 border-white/5 text-zinc-400 hover:bg-zinc-800'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                      <Wind size={12} className="text-amber-400" />
                      <span>Tail Animation</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TAIL_TYPES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTailType(t.id)}
                          disabled={!isTailEnabled}
                          className={`flex-1 py-1.5 px-1 rounded-lg border text-[7px] uppercase font-bold transition-all ${
                            tailType === t.id 
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                              : 'bg-zinc-800/40 border-white/5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                          } disabled:opacity-20`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      onClick={() => setIsFollowEnabled(!isFollowEnabled)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                        isFollowEnabled ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-zinc-800/30 border-white/5 text-zinc-600'
                      }`}
                      title="Toggle Follow"
                    >
                      <Target size={14} />
                      <span className="text-[8px] uppercase font-bold">Follow</span>
                    </button>

                    <button
                      onClick={() => setIsTailEnabled(!isTailEnabled)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                        isTailEnabled ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-800/30 border-white/5 text-zinc-600'
                      }`}
                      title="Toggle Tail"
                    >
                      <Brush size={14} />
                      <span className="text-[8px] uppercase font-bold">Tail</span>
                    </button>

                    <button
                      onClick={() => setShouldWrap(!shouldWrap)}
                      disabled={isFollowEnabled}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                        shouldWrap ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-zinc-800/30 border-white/5 text-zinc-600'
                      } disabled:opacity-20 disabled:cursor-not-allowed`}
                      title="Toggle Wrap"
                    >
                      <Settings2 size={14} />
                      <span className="text-[8px] uppercase font-bold">Wrap</span>
                    </button>
                  </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <ControlBar
              isPlaying={isPlaying && syncMode === 'manual'}
              onPlayPause={handlePlayPause}
              onStep={handleStep}
              onReset={handleReset}
              currentStep={Math.floor(currentStep)}
              speedMultiplier={speedMultiplier}
              onSpeedChange={setSpeedMultiplier}
            />
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-50">
        <button
          onClick={toggleFullscreen}
          className={`p-4 rounded-full bg-zinc-950/50 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-xl active:scale-90 ${isFullscreen ? 'text-indigo-400' : ''}`}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>
    </div>
  );
};

export default App;