export interface BanquetChair {
  id: string;
  label?: string;
  angle: number;
  offsetX: number;
  offsetY: number;
}

export interface BanquetTable {
  id: string;
  label: string;
  tierCode?: string;
  x: number;
  y: number;
  rotation: number;
  radius: number;
  chairCount: number;
  chairs: BanquetChair[];
}

export interface BanquetLayout {
  tables: BanquetTable[];
}
