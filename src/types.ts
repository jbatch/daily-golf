export const GRID_SIZE = 8;

export enum TerrainType {
  EMPTY = 0,
  FAIRWAY = 1,
  ROUGH = 2,
  SAND = 3,
  WATER = 4,
  TREES = 5,
  TEE = 6,
  HOLE = 7,
  GREEN = 8,
}

export const TerrainColors: Record<TerrainType, string> = {
  [TerrainType.EMPTY]: "#f3f4f6",
  [TerrainType.FAIRWAY]: "#86efac",
  [TerrainType.ROUGH]: "#16a34a",
  [TerrainType.SAND]: "#fef08a",
  [TerrainType.WATER]: "#60a5fa",
  [TerrainType.TREES]: "#166534",
  [TerrainType.TEE]: "#f87171",
  [TerrainType.HOLE]: "#1f2937",
  [TerrainType.GREEN]: "#4ade80",
};

export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface CourseState {
  grid: Record<string, TerrainType>;
  start: CubeCoord;
  end: CubeCoord;
  seed: number;
}
