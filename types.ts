export type TailType = 'classic' | 'ghost' | 'echo' | 'stepped' | 'glitch';

export interface NumberRowProps {
  label: string | number;
  movementValue: number;
  currentStep: number;
  itemSize: number;
  wrapWidth: number;
  shouldWrap: boolean;
  totalRows: number;
  rowIndex: number;
  isTailEnabled: boolean;
  isFollowEnabled: boolean;
  colorPalette: string;
  tailType: TailType;
}

export interface ControlBarProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStep: () => void;
  onReset: () => void;
  currentStep: number;
  speedMultiplier: number;
  onSpeedChange: (value: number) => void;
}