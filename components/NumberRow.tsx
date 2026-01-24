import React, { useMemo } from 'react';
import { NumberRowProps } from '../types';

interface ExtendedNumberRowProps extends NumberRowProps {
  focusX: number;
  viewportWidth: number;
}

export const NumberRow: React.FC<ExtendedNumberRowProps> = ({
  label,
  movementValue,
  currentStep,
  itemSize,
  wrapWidth,
  shouldWrap,
  rowIndex,
  isTailEnabled,
  isFollowEnabled,
  colorPalette,
  tailType,
  focusX,
  viewportWidth,
}) => {
  const effectiveWrap = shouldWrap && !isFollowEnabled;

  const quantizedWrapWidth = useMemo(() => {
    const units = Math.floor(wrapWidth / itemSize);
    return Math.max(units, 1) * itemSize;
  }, [wrapWidth, itemSize]);

  const stepData = useMemo(() => {
    const N = currentStep;
    const v = movementValue;
    const unitSize = itemSize;

    const currentTriggerCount = Math.floor(N / v);
    const nextTriggerAt = (currentTriggerCount + 1) * v;
    const distToNext = nextTriggerAt - N;
    
    const transitionWidth = 0.5; 
    let animatedTriggerCount = currentTriggerCount;

    if (distToNext < transitionWidth) {
      const t = 1 - (distToNext / transitionWidth);
      const easedT = t * t * (3 - 2 * t);
      animatedTriggerCount = currentTriggerCount + easedT;
    }

    const unitStepInPixels = v * unitSize;
    
    const positions: { x: number; isHead: boolean; opacity: number; scale?: number }[] = [];
    
    const headAbsoluteDisplacement = animatedTriggerCount * unitStepInPixels;
    
    const getRelativeX = (absDisp: number) => {
      if (effectiveWrap) {
        return (absDisp % quantizedWrapWidth);
      }
      return (absDisp - focusX) + (viewportWidth / 2) - (itemSize / 2);
    };

    const headX = getRelativeX(headAbsoluteDisplacement);
    positions.push({ x: headX, isHead: true, opacity: 1 });

    if (isTailEnabled) {
      let limit = effectiveWrap ? 80 : 40;
      let stepSize = 1;
      let opacityBase = 0.4;
      
      // Customize parameters based on tail type
      switch (tailType) {
        case 'ghost':
          limit = 20;
          opacityBase = 0.2;
          break;
        case 'echo':
          limit = 60;
          opacityBase = 0.3;
          break;
        case 'stepped':
          stepSize = 3;
          limit = 100;
          break;
        case 'glitch':
          limit = 30;
          break;
      }

      const lapStartDisplacement = effectiveWrap 
        ? Math.floor(headAbsoluteDisplacement / quantizedWrapWidth) * quantizedWrapWidth 
        : -Infinity;

      for (let k = 1; k <= limit; k += stepSize) {
        const tailTriggerIndex = animatedTriggerCount - k;
        if (tailTriggerIndex < 0) break;

        const tailAbsoluteDisp = tailTriggerIndex * unitStepInPixels;
        if (effectiveWrap && tailAbsoluteDisp < lapStartDisplacement) break;

        let tx = getRelativeX(tailAbsoluteDisp);
        
        // Add specific visual behaviors
        let tailOpacity = Math.max(0, opacityBase * (1 - k / limit));
        let scale = 1;

        if (tailType === 'echo') {
          // Sharp drop off after a certain distance
          tailOpacity = k < 10 ? 0.25 : 0.05;
        } else if (tailType === 'glitch') {
          // Random jitter
          tx += (Math.sin(k * 1.5 + currentStep * 5) * 4);
        } else if (tailType === 'stepped') {
          // Shrink size as it goes back
          scale = Math.max(0.6, 1 - (k / limit));
        }
        
        if (tailOpacity > 0.01) {
          positions.push({ x: tx, isHead: false, opacity: tailOpacity, scale });
        }
      }
    }

    return positions;
  }, [currentStep, movementValue, itemSize, quantizedWrapWidth, effectiveWrap, isTailEnabled, tailType, focusX, viewportWidth]);

  const color = useMemo(() => {
    if (rowIndex === 0) return 'hsl(250, 70%, 60%)';
    const hueOffset = (movementValue * 137.5) % 360;
    
    switch (colorPalette) {
      case 'neon':
        return `hsl(${(hueOffset % 60) + 280}, 90%, 65%)`;
      case 'forest':
        return `hsl(${(hueOffset % 80) + 120}, 60%, 55%)`;
      case 'gold':
        return `hsl(${(hueOffset % 40) + 35}, 85%, 60%)`;
      case 'monochrome':
        return `hsl(0, 0%, ${70 + (hueOffset % 30)}%)`;
      case 'harmonic':
      default:
        return `hsl(${hueOffset}, 70%, 60%)`;
    }
  }, [rowIndex, movementValue, colorPalette]);

  const slotHeight = itemSize;
  const blockHeight = slotHeight * 0.85; 
  const verticalOffset = (slotHeight - blockHeight) / 2;

  const fontSize = Math.max(blockHeight * 0.45, 6);
  const horizontalPadding = blockHeight * 0.3;
  const minWidth = blockHeight * 1.05;
  const borderRadius = blockHeight * 0.1;

  return (
    <div
      className="absolute left-0 w-full pointer-events-none"
      style={{
        height: `${slotHeight}px`,
        top: `${rowIndex * slotHeight}px`,
      }}
    >
      {stepData.map((pos, index) => (
        <div
          key={`${rowIndex}-${index}`}
          className="absolute flex items-center px-1 font-bold will-change-transform"
          style={{
            height: `${blockHeight}px`,
            top: `${verticalOffset}px`,
            transform: `translateX(${pos.x}px) scale(${pos.scale ?? 1})`,
            color: color,
            width: 'max-content',
            fontSize: `${fontSize}px`,
            opacity: pos.opacity,
            zIndex: pos.isHead ? 10 : 0,
          }}
        >
          <div className="relative flex items-center justify-center">
            <span 
              className={`
                bg-zinc-900/95 backdrop-blur-md border shadow-2xl font-mono flex items-center justify-center
                ${rowIndex === 0 && pos.isHead
                  ? 'border-indigo-500/40 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                  : 'border-white/10 text-inherit'}
              `}
              style={{
                padding: `0 ${horizontalPadding}px`,
                height: `${blockHeight}px`,
                borderRadius: `${borderRadius}px`,
                minWidth: `${minWidth}px`,
                maxWidth: `${minWidth}px`,
                borderWidth: pos.isHead ? Math.max(1, blockHeight * 0.05) + 'px' : '0px',
              }}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};