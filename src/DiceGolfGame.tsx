import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TerrainType, TerrainColors, CubeCoord, CourseState } from "./types";
import { cubeToPixel, getHexCorners, getHexNeighbors } from "./hexUtils";
import { Dice6 } from "lucide-react";
import testCourse from "./testCourse";

interface GameState {
  playerPosition: CubeCoord;
  strokes: number;
  mulligansLeft: number;
  lastRoll: number | null;
  validMoves: CubeCoord[];
  gameOver: boolean;
}

const DiceGolfGame = () => {
  const [course, setCourse] = useState<CourseState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    setCourse(testCourse);
    initializeGame(testCourse);
  }, []);

  const initializeGame = (courseData: CourseState) => {
    setGameState({
      playerPosition: courseData.start,
      strokes: 0,
      mulligansLeft: 6,
      lastRoll: null,
      validMoves: [],
      gameOver: false,
    });
  };

  const getHexDistance = (a: CubeCoord, b: CubeCoord): number => {
    return Math.max(
      Math.abs(a.q - b.q),
      Math.abs(a.r - b.r),
      Math.abs(a.s - b.s)
    );
  };

  const rollDice = () => {
    if (!course || !gameState || rolling) return;

    setRolling(true);
    // Roll animation
    Array.from({ length: 10 }, (_, i) =>
      setTimeout(
        () =>
          setGameState((prev) => ({
            ...prev!,
            lastRoll: Math.floor(Math.random() * 6) + 1,
          })),
        i * 50
      )
    );

    // Final roll
    setTimeout(() => {
      setRolling(false);
      const baseRoll = Math.floor(Math.random() * 6) + 1;
      const currentHex = `${gameState.playerPosition.q},${gameState.playerPosition.r},${gameState.playerPosition.s}`;
      const terrainType = course.grid[currentHex];

      // Apply terrain modifiers
      let finalRoll = baseRoll;
      if (terrainType === TerrainType.FAIRWAY) finalRoll += 1;
      if (terrainType === TerrainType.SAND) finalRoll -= 1;
      finalRoll = Math.max(1, Math.min(6, finalRoll));

      // Calculate valid moves
      const validMoves = calculateValidMoves(
        gameState.playerPosition,
        finalRoll,
        course
      );

      setGameState((prev) => ({
        ...prev!,
        lastRoll: finalRoll,
        validMoves,
      }));
    }, 500);
  };

  const calculateValidMoves = (
    position: CubeCoord,
    distance: number,
    courseData: CourseState
  ): CubeCoord[] => {
    const validMoves: CubeCoord[] = [];

    // Always add adjacent hexes (putting)
    const neighbors = getHexNeighbors(position);
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.q},${neighbor.r},${neighbor.s}`;
      const terrainType = courseData.grid[neighborKey];
      if (terrainType !== undefined && terrainType !== TerrainType.WATER) {
        validMoves.push(neighbor);
      }
    }

    // Find all hexes exactly 'distance' away
    for (let dq = -distance; dq <= distance; dq++) {
      for (let dr = -distance; dr <= distance; dr++) {
        const ds = -(dq + dr);
        if (Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds)) === distance) {
          const q = position.q + dq;
          const r = position.r + dr;
          const s = position.s + ds;

          // Check if this is a valid hex at exactly 'distance' away
          const coord = { q: q, r: r, s: s };
          const key = `${q},${r},${s}`;
          const terrainType = courseData.grid[key];

          // Skip if out of bounds or water
          if (terrainType === undefined || terrainType === TerrainType.WATER)
            continue;

          // Skip if trying to go through trees from non-fairway
          const currentTerrainType =
            courseData.grid[`${position.q},${position.r},${position.s}`];
          if (
            terrainType === TerrainType.TREES &&
            currentTerrainType !== TerrainType.FAIRWAY
          )
            continue;

          validMoves.push(coord);
        }
      }
    }

    return validMoves;
  };

  const moveToHex = (coord: CubeCoord) => {
    if (!gameState || !course) return;

    if (
      gameState.validMoves.some(
        (move) => move.q === coord.q && move.r === coord.r && move.s === coord.s
      )
    ) {
      const newPosition = coord;
      const distToHole = getHexDistance(newPosition, course.end);
      const isOvershootSink =
        distToHole === 1 && // Landed next to hole
        getHexDistance(gameState.playerPosition, course.end) ===
          gameState.lastRoll! - 1;
      const isAtHole = distToHole === 0 || isOvershootSink;

      setGameState((prev) => ({
        ...prev!,
        playerPosition: newPosition,
        strokes: prev!.strokes + 1,
        validMoves: [],
        lastRoll: null,
        gameOver: isAtHole,
      }));
    }
  };

  const useMulligan = () => {
    if (!gameState || gameState.mulligansLeft <= 0) return;

    setGameState((prev) => ({
      ...prev!,
      mulligansLeft: prev!.mulligansLeft - 1,
      validMoves: [],
      lastRoll: null,
    }));
  };

  if (!course || !gameState) return <div>Loading...</div>;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Dice Golf - Daily Challenge</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4 items-center">
            <Button
              onClick={rollDice}
              disabled={
                gameState.gameOver || rolling || gameState.validMoves.length > 0
              }
              className="w-32"
            >
              <Dice6 className="mr-2" />
              Roll Dice
            </Button>
            <Button
              onClick={useMulligan}
              disabled={
                gameState.mulligansLeft <= 0 ||
                !gameState.lastRoll ||
                gameState.gameOver
              }
              variant="outline"
              className="w-32"
            >
              Mulligan ({gameState.mulligansLeft})
            </Button>
          </div>

          <div className="text-lg">
            Strokes: {gameState.strokes}
            {gameState.lastRoll && (
              <span className="ml-4">Roll: {gameState.lastRoll}</span>
            )}
          </div>

          <div className="relative w-full aspect-square max-w-2xl">
            <svg viewBox="-150 -150 300 300" className="w-full h-full">
              {Object.entries(course.grid).map(([key, value]) => {
                const [q, r] = key.split(",").map(Number);
                const center = cubeToPixel(q, r, 10);
                const corners = getHexCorners(center, 10);
                const isValidMove = gameState.validMoves.some(
                  (move) => move.q === q && move.r === r && move.s === -q - r
                );

                return (
                  <g key={key} onClick={() => moveToHex({ q, r, s: -q - r })}>
                    <polygon
                      points={corners.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill={TerrainColors[value]}
                      stroke={isValidMove ? "#ef4444" : "#374151"}
                      strokeWidth={isValidMove ? "2" : "0.5"}
                      className={
                        isValidMove ? "cursor-pointer hover:opacity-80" : ""
                      }
                    />
                    {/* Current position marker */}
                    {q === gameState.playerPosition.q &&
                      r === gameState.playerPosition.r && (
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r="4"
                          fill="white"
                          stroke="black"
                        />
                      )}
                  </g>
                );
              })}
            </svg>
          </div>

          {gameState.gameOver && (
            <div className="text-2xl font-bold text-green-600">
              Course Complete! Final Score: {gameState.strokes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DiceGolfGame;
