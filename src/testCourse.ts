import { TerrainType } from "./types";

export default {
  grid: {
    // Distance 0
    "0,0,0": TerrainType.FAIRWAY,
    // Distance 1
    "-1,0,1": TerrainType.ROUGH,
    "-1,1,0": TerrainType.ROUGH,
    "0,-1,1": TerrainType.ROUGH,
    "0,1,-1": TerrainType.ROUGH,
    "1,-1,0": TerrainType.GREEN,
    "1,0,-1": TerrainType.ROUGH,
    // Distance 2
    "-2,0,2": TerrainType.ROUGH,
    "-2,1,1": TerrainType.ROUGH,
    "-2,2,0": TerrainType.ROUGH,
    "-1,-1,2": TerrainType.TREES, // Trees
    "-1,2,-1": TerrainType.ROUGH,
    "0,-2,2": TerrainType.ROUGH,
    "0,2,-2": TerrainType.ROUGH,
    "1,-2,1": TerrainType.GREEN,
    "1,1,-2": TerrainType.WATER, // Water hazard
    "2,-2,0": TerrainType.HOLE,
    "2,-1,-1": TerrainType.GREEN,
    "2,0,-2": TerrainType.ROUGH,
    // Distance 3
    "-3,0,3": TerrainType.ROUGH,
    "-3,1,2": TerrainType.ROUGH,
    "-3,2,1": TerrainType.ROUGH,
    "-3,3,0": TerrainType.ROUGH,
    "-2,-1,3": TerrainType.ROUGH,
    "-2,3,-1": TerrainType.ROUGH,
    "-1,-2,3": TerrainType.ROUGH,
    "-1,3,-2": TerrainType.ROUGH,
    "0,-3,3": TerrainType.ROUGH,
    "0,3,-3": TerrainType.ROUGH,
    "1,-3,2": TerrainType.ROUGH,
    "1,2,-3": TerrainType.ROUGH,
    "2,-3,1": TerrainType.GREEN,
    "2,1,-3": TerrainType.ROUGH,
    "3,-3,0": TerrainType.GREEN,
    "3,-2,-1": TerrainType.GREEN,
    "3,-1,-2": TerrainType.ROUGH,
    "3,0,-3": TerrainType.ROUGH,
  },
  start: { q: 0, r: 0, s: 0 },
  end: { q: 2, r: -2, s: 0 },
  seed: 12345,
};
