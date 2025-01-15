import { useState, useCallback } from "react";
import { TerrainType, CubeCoord, CourseState } from "./types";

export interface GameState {
  playerPosition: CubeCoord;
  strokes: number;
  mulligansLeft: number;
  lastRoll: number | null;
  blockedRolls: number[];
  validMoves: CubeCoord[];
  gameOver: boolean;
  isPutting: boolean;
}

// Pure functions for game logic
export const getHexDistance = (a: CubeCoord, b: CubeCoord): number => {
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs(a.s - b.s)
  );
};

// Get the hex coordinates along a line between two points
export const getHexesInLine = (
  start: CubeCoord,
  end: CubeCoord
): CubeCoord[] => {
  const N = getHexDistance(start, end);
  const results: CubeCoord[] = [];

  for (let i = 0; i <= N; i++) {
    const t = N === 0 ? 0.0 : i / N;
    const q = Math.round(start.q + (end.q - start.q) * t);
    const r = Math.round(start.r + (end.r - start.r) * t);
    const s = Math.round(start.s + (end.s - start.s) * t);

    // Fix rounding errors
    const q_diff = Math.abs(q - (start.q + (end.q - start.q) * t));
    const r_diff = Math.abs(r - (start.r + (end.r - start.r) * t));
    const s_diff = Math.abs(s - (start.s + (end.s - start.s) * t));

    if (q_diff > r_diff && q_diff > s_diff) {
      results.push({ q: -r - s, r, s });
    } else if (r_diff > s_diff) {
      results.push({ q, r: -q - s, s });
    } else {
      results.push({ q, r, s: -q - r });
    }
  }

  return results;
};

// Check if a shot path is blocked by trees
const isPathBlockedByTrees = (
  start: CubeCoord,
  end: CubeCoord,
  course: CourseState,
  isOnFairway: boolean
): boolean => {
  if (isOnFairway) return false; // Can shoot over trees from fairway

  // Get all hexes along the path except start and end
  const pathHexes = getHexesInLine(start, end).slice(1, -1);

  // Check if any hex in the path is a tree
  return pathHexes.some((hex) => {
    const key = `${hex.q},${hex.r},${hex.s}`;
    return course.grid[key] === TerrainType.TREES;
  });
};

export const calculateValidMoves = (
  position: CubeCoord,
  distance: number,
  course: CourseState
): CubeCoord[] => {
  const validMoves: CubeCoord[] = [];
  const currentTerrainType =
    course.grid[`${position.q},${position.r},${position.s}`];
  const isOnFairway = currentTerrainType === TerrainType.FAIRWAY;

  // Find all hexes exactly 'distance' away
  for (let dq = -distance; dq <= distance; dq++) {
    for (let dr = -distance; dr <= distance; dr++) {
      const ds = -(dq + dr);
      if (Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds)) === distance) {
        const q = position.q + dq;
        const r = position.r + dr;
        const s = position.s + ds;

        const coord = { q, r, s };
        const key = `${q},${r},${s}`;
        const terrainType = course.grid[key];

        // Skip if out of bounds, water, or trees
        if (
          terrainType === undefined ||
          terrainType === TerrainType.WATER ||
          terrainType === TerrainType.TREES
        )
          continue;

        // Check if path is blocked by trees
        if (isPathBlockedByTrees(position, coord, course, isOnFairway))
          continue;
        validMoves.push(coord);
      }
    }
  }

  return validMoves;
};

export const isValidMove = (
  coord: CubeCoord,
  validMoves: CubeCoord[]
): boolean => {
  return validMoves.some(
    (move) => move.q === coord.q && move.r === coord.r && move.s === coord.s
  );
};

export const checkGameOver = (
  newPosition: CubeCoord,
  distance: number | null,
  playerPosition: CubeCoord,
  end: CubeCoord
): { gameOver: boolean; isOvershootSink: boolean } => {
  const distToHole = getHexDistance(newPosition, end);
  if (distToHole === 0) return { gameOver: true, isOvershootSink: false };

  const isOvershootSink =
    distance !== null &&
    distToHole === 1 &&
    getHexDistance(playerPosition, end) === distance - 1;

  return { gameOver: isOvershootSink, isOvershootSink };
};

// Custom hook for game logic
export const useDiceGolf = (initialCourse: CourseState) => {
  const [course, setCourse] = useState<CourseState>(initialCourse);
  const [gameState, setGameState] = useState<GameState>(() => ({
    playerPosition: initialCourse.start,
    strokes: 0,
    mulligansLeft: 6,
    lastRoll: null,
    blockedRolls: [],
    validMoves: [],
    gameOver: false,
    isPutting: false,
  }));
  const [rolling, setRolling] = useState(false);

  const getCurrentTerrain = useCallback(() => {
    const currentHex = `${gameState.playerPosition.q},${gameState.playerPosition.r},${gameState.playerPosition.s}`;
    return course.grid[currentHex];
  }, [
    course.grid,
    gameState.playerPosition.q,
    gameState.playerPosition.r,
    gameState.playerPosition.s,
  ]);

  const rollDice = useCallback(() => {
    if (rolling || gameState.gameOver || gameState.validMoves.length > 0)
      return;

    setRolling(true);
    Array.from({ length: 10 }, (_, i) =>
      setTimeout(
        () =>
          setGameState((prev) => ({
            ...prev,
            lastRoll: Math.floor(Math.random() * 6) + 1,
          })),
        i * 50
      )
    );

    const getRoll = (bonus: number) => {
      let roll = 0;
      do {
        roll = Math.max(1, Math.floor(Math.random() * 6) + 1 + bonus);
      } while (gameState.blockedRolls.includes(roll));
      return roll;
    };

    const getBonus = (terrain: TerrainType) => {
      if ([TerrainType.TEE].includes(terrain)) {
        return 1;
      }
      if (terrain === TerrainType.SAND) {
        return -1;
      }
      return 0;
    };

    // Final roll
    setTimeout(() => {
      setRolling(false);

      const terrainType = getCurrentTerrain();
      const bonus = getBonus(terrainType);
      const roll = getRoll(bonus);

      // Calculate valid moves
      const validMoves = calculateValidMoves(
        gameState.playerPosition,
        roll,
        course
      );

      setGameState((prev) => ({
        ...prev,
        lastRoll: roll,
        validMoves,
      }));
    }, 500);
  }, [
    course,
    gameState.blockedRolls,
    gameState.gameOver,
    gameState.playerPosition,
    gameState.validMoves.length,
    getCurrentTerrain,
    rolling,
  ]);

  const takePutt = useCallback(() => {
    if (gameState.gameOver || gameState.validMoves.length > 0) return;

    // Calculate valid moves for a distance of 1
    const validMoves = calculateValidMoves(gameState.playerPosition, 1, course);

    setGameState((prev) => ({
      ...prev,
      isPutting: true,
      validMoves,
    }));
  }, [
    course,
    gameState.gameOver,
    gameState.validMoves.length,
    gameState.playerPosition,
  ]);

  const cancelPutt = useCallback(() => {
    if (gameState.gameOver) return;

    const validMoves: CubeCoord[] = [];

    setGameState((prev) => ({
      ...prev,
      isPutting: false,
      validMoves,
    }));
  }, [gameState.gameOver]);

  const moveToHex = useCallback(
    (coord: CubeCoord) => {
      if (!isValidMove(coord, gameState.validMoves)) return;

      const newPosition = coord;
      const { gameOver, isOvershootSink } = checkGameOver(
        newPosition,
        gameState.lastRoll,
        gameState.playerPosition,
        course.end
      );

      setGameState((prev) => ({
        ...prev,
        playerPosition: isOvershootSink ? course.end : newPosition,
        strokes: prev.strokes + 1,
        validMoves: [],
        lastRoll: null,
        blockedRolls: [],
        gameOver,
      }));
    },
    [
      course.end,
      gameState.lastRoll,
      gameState.playerPosition,
      gameState.validMoves,
    ]
  );

  const useMulligan = useCallback(() => {
    if (
      gameState.mulligansLeft <= 0 ||
      gameState.gameOver ||
      !gameState.lastRoll
    )
      return;

    setGameState((prev) => ({
      ...prev,
      mulligansLeft: prev.mulligansLeft - 1,
      validMoves: [],
      lastRoll: null,
      blockedRolls: [...prev.blockedRolls, prev.lastRoll!],
    }));
  }, [gameState.gameOver, gameState.lastRoll, gameState.mulligansLeft]);

  const resetGame = useCallback((newCourse: CourseState) => {
    setGameState({
      playerPosition: newCourse.start,
      strokes: 0,
      mulligansLeft: 6,
      lastRoll: null,
      blockedRolls: [],
      validMoves: [],
      gameOver: false,
      isPutting: false,
    });
    setCourse(newCourse);
  }, []);

  return {
    course,
    gameState,
    rolling,
    resetGame,
    actions: {
      rollDice,
      moveToHex,
      useMulligan,
      takePutt,
      cancelPutt,
    },
  };
};
