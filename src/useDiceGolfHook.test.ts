// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { TerrainType, CourseState, CubeCoord } from "./types";
import {
  useDiceGolf,
  calculateValidMoves,
  getHexDistance,
  checkGameOver,
} from "./useDiceGolfHook";

const createMockCourse = (): CourseState => ({
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
  end: { q: 2, r: -1, s: -1 },
  seed: 12345,
});

describe("Hex Distance Calculation", () => {
  it("calculates distance correctly", () => {
    const pos1: CubeCoord = { q: 0, r: 0, s: 0 };
    const pos2: CubeCoord = { q: 2, r: -1, s: -1 };
    expect(getHexDistance(pos1, pos2)).toBe(2);
  });

  it("handles negative coordinates", () => {
    const pos1: CubeCoord = { q: -1, r: 0, s: 1 };
    const pos2: CubeCoord = { q: 1, r: 0, s: -1 };
    expect(getHexDistance(pos1, pos2)).toBe(2);
  });
});

describe("Valid Move Calculation", () => {
  let mockCourse: CourseState;
  beforeEach(() => {
    mockCourse = createMockCourse();
  });

  it("always includes adjacent hexes (putting)", () => {
    const moves = calculateValidMoves(mockCourse.start, 4, mockCourse);
    const neighbors = moves.filter(
      (move) => getHexDistance(mockCourse.start, move) === 1
    );
    expect(neighbors.length).toBeGreaterThan(0);
  });

  it("excludes water hazards", () => {
    const moves = calculateValidMoves(mockCourse.start, 2, mockCourse);
    const containsWaterHex = containsPos(moves, { q: 1, r: 1, s: -2 });
    expect(containsWaterHex).toBe(false);
  });

  it("excludes out of bounds hexes", () => {
    const moves = calculateValidMoves(mockCourse.start, 3, mockCourse);
    const allInBounds = moves.every((move) => {
      const key = `${move.q},${move.r},${move.s}`;
      return mockCourse.grid[key] !== undefined;
    });
    expect(allInBounds).toBe(true);
  });

  it("only includes hexes at exact distance (except putting)", () => {
    const distance = 2;
    const moves = calculateValidMoves(mockCourse.start, distance, mockCourse);
    const validDistances = moves.every((move) => {
      const dist = getHexDistance(mockCourse.start, move);
      return dist === distance || dist === 1; // Either exact distance or putting
    });
    expect(validDistances).toBe(true);
  });

  it("Filters out hexes that are behind tree (if not on fairway)", () => {
    // Tree is 2 spots north-west. It should create two blocked spots
    /**
    *      / \ / \ / \ 
          | x |   |   |  
         / \ / \ / \ /  
        | x | T |   |      x is blocked by T  
       / \ / \ / \ / \ 
      |   |   |   |   |
     / \ / \ / \ / \ / 
    | + |   |   | B |  
     \ / \ / \ / \ /  
     */

    mockCourse.grid["0,0,0"] = TerrainType.ROUGH;
    const distance = 3;
    // Calc moves with tree blocking
    const moves = calculateValidMoves(mockCourse.start, distance, mockCourse);
    expect(moves.length).toBe(22);

    expect(containsPos(moves, { q: -2, r: -1, s: 3 })).toBe(false);
    expect(containsPos(moves, { q: -1, r: -2, s: 3 })).toBe(false);

    mockCourse.grid["-1,-1,2"] = TerrainType.ROUGH;
    // Calc moves with tree blocking
    const newMoves = calculateValidMoves(
      mockCourse.start,
      distance,
      mockCourse
    );
    expect(newMoves.length).toBe(24);

    expect(containsPos(newMoves, { q: -2, r: -1, s: 3 })).toBe(true);
    expect(containsPos(newMoves, { q: -1, r: -2, s: 3 })).toBe(true);
  });
});

describe("Game Over Conditions", () => {
  const mockCourse = createMockCourse();

  it("detects landing directly on hole", () => {
    const gameOver = checkGameOver(
      mockCourse.end,
      4,
      mockCourse.start,
      mockCourse.end
    );
    expect(gameOver).toBe(true);
  });

  it("detects valid overshoot sink on diagonal", () => {
    // Hole is 2 spots east. It should have two valid overshoot spots
    /**
     *       x
     *    x     *1   *1 (3,-2,-1)
     * B     H        H (2, -1, -1)
     *    x     *2   *2 (3,-1,-2)
     *       x
     */
    const overshot1: CubeCoord = { q: 3, r: -2, s: -1 }; // One beyond hole
    const overshot2: CubeCoord = { q: 3, r: -1, s: -2 }; // One beyond hole
    const startPos: CubeCoord = { q: 0, r: 0, s: 0 }; // 2 away from hole
    expect(checkGameOver(overshot1, 3, startPos, mockCourse.end)).toBe(true);
    expect(checkGameOver(overshot2, 3, startPos, mockCourse.end)).toBe(true);
    // Other shots that are one away from hole d=2 don't overshoot
    expect(
      checkGameOver({ q: 2, r: -2, s: 0 }, 2, startPos, mockCourse.end)
    ).toBe(false);
    expect(
      checkGameOver({ q: 2, r: 0, s: -2 }, 2, startPos, mockCourse.end)
    ).toBe(false);
    // Shots that are one away from hole but are d=1 don't overshoot
    expect(
      checkGameOver({ q: 1, r: -1, s: 0 }, 1, startPos, mockCourse.end)
    ).toBe(false);
    expect(
      checkGameOver({ q: 1, r: 0, s: -1 }, 1, startPos, mockCourse.end)
    ).toBe(false);
  });

  it("detects valid overshoot sink on straight", () => {
    // Hole is 2 spots north-east. It should have two valid overshoot spots
    /**
     *    x  *1  *2    *1 (2,-3,1) *2 (3,-3,0)
     *        H         H (2,-2,0)
     *    x   x  *3    *2 (3,-2,-1)
     * B
     */
    mockCourse.end = { q: 2, r: -2, s: 0 };
    const overshot1: CubeCoord = { q: 2, r: -3, s: 1 }; // One beyond hole
    const overshot2: CubeCoord = { q: 3, r: -3, s: 0 }; // One beyond hole
    const overshot3: CubeCoord = { q: 3, r: -2, s: -1 }; // One beyond hole
    const startPos: CubeCoord = { q: 0, r: 0, s: 0 }; // 2 away from hole
    expect(checkGameOver(overshot1, 3, startPos, mockCourse.end)).toBe(true);
    expect(checkGameOver(overshot2, 3, startPos, mockCourse.end)).toBe(true);
    expect(checkGameOver(overshot3, 3, startPos, mockCourse.end)).toBe(true);
    // Other shots that are one away from hole d=2 don't overshoot
    expect(
      checkGameOver({ q: 1, r: -2, s: 1 }, 2, startPos, mockCourse.end)
    ).toBe(false);
    expect(
      checkGameOver({ q: 2, r: -1, s: -1 }, 2, startPos, mockCourse.end)
    ).toBe(false);
    // Shots that are one away from hole but are d=1 don't overshoot
    expect(
      checkGameOver({ q: 1, r: -1, s: 0 }, 1, startPos, mockCourse.end)
    ).toBe(false);
  });

  it("rejects invalid overshoot", () => {
    const overshot: CubeCoord = { q: 3, r: -1, s: -2 };
    const startPos: CubeCoord = { q: 0, r: 0, s: 0 }; // Too far for valid overshoot
    const gameOver = checkGameOver(overshot, 4, startPos, mockCourse.end);
    expect(gameOver).toBe(false);
  });
});

describe("useDiceGolf Hook", () => {
  const mockCourse = createMockCourse();

  it("initializes with correct starting state", () => {
    const { result } = renderHook(() => useDiceGolf(mockCourse));
    expect(result.current.gameState.playerPosition).toEqual(mockCourse.start);
    expect(result.current.gameState.strokes).toBe(0);
    expect(result.current.gameState.mulligansLeft).toBe(6);
  });

  it("updates state on valid move", () => {
    const { result } = renderHook(() => useDiceGolf(mockCourse));

    // First set some valid moves
    act(() => {
      result.current.gameState.validMoves = [{ q: 1, r: 0, s: -1 }];
    });

    // Then make a move
    act(() => {
      result.current.actions.moveToHex({ q: 1, r: 0, s: -1 });
    });

    expect(result.current.gameState.strokes).toBe(1);
    expect(result.current.gameState.playerPosition).toEqual({
      q: 1,
      r: 0,
      s: -1,
    });
  });

  it("handles mulligan correctly", () => {
    const { result } = renderHook(() => useDiceGolf(mockCourse));

    // Set up state for mulligan
    act(() => {
      result.current.gameState.lastRoll = 3;
      result.current.actions.useMulligan();
    });

    expect(result.current.gameState.mulligansLeft).toBe(5);
    expect(result.current.gameState.lastRoll).toBeNull();
    expect(result.current.gameState.validMoves).toHaveLength(0);
  });
});

function containsPos(list: CubeCoord[], pos: CubeCoord) {
  return (
    list.find((p) => p.q === pos.q && p.r === pos.r && p.s === pos.s) !==
    undefined
  );
}
