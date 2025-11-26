export interface HybridLayoutCanvas {
  width: number;
  height: number;
  gridSize?: number;
  zoom?: number;
}

export interface HybridSection {
  id: string;
  label: string;
  shape: 'rectangle' | 'circle' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  color?: string;
}

export type HybridElementType =
  | 'stage'
  | 'screen'
  | 'walkway'
  | 'entry-door'
  | 'exit-door'
  | 'custom';

export interface HybridElement {
  id: string;
  type: HybridElementType;
  label?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  color?: string;
}

export interface HybridSeat {
  id: string;
  sectionId?: string;
  label?: string;
  rowLabel?: string;
  number?: number;
  tierCode?: string;
  type?: string;
  x: number;
  y: number;
  rotation?: number;
  radius?: number;
}

export interface HybridLayoutConfiguration {
  kind: 'hybrid';
  canvas: HybridLayoutCanvas;
  sections: HybridSection[];
  elements: HybridElement[];
  seats: HybridSeat[];
}

export const createDefaultHybridConfiguration = (): HybridLayoutConfiguration => ({
  kind: 'hybrid',
  canvas: {
    width: 1200,
    height: 700,
    gridSize: 20,
    zoom: 1,
  },
  sections: [],
  elements: [],
  seats: [],
});
