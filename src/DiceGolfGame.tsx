import React, { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CubeCoord, TerrainColors, TerrainType } from "./types";
import { cubeToPixel, getHexCorners } from "./hexUtils";
import { Dice6, MapPin } from "lucide-react";
import { useDiceGolf } from "./useDiceGolfHook";
import testCourse from "./testCourse";
import { generateCourse } from "./courseGeneration";

// Helper function to scale polygon points around their center
const scalePolygon = (points: { x: number; y: number }[], scale: number) => {
  // Calculate center point
  const center = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x / points.length,
      y: acc.y + point.y / points.length,
    }),
    { x: 0, y: 0 }
  );

  // Scale points around center
  return points.map((point) => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale,
  }));
};

const DiceGolfGame = () => {
  const [hoveredHex, setHoveredHex] = useState<CubeCoord | null>(null);
  //   const [currentCourse, setCurrentCourse] = useState<CourseState>(testCourse);
  const {
    actions: { rollDice, moveToHex, useMulligan, takePutt },
    course,
    gameState,
    rolling,
    resetGame,
  } = useDiceGolf(testCourse);

  const handleNewMap = useCallback(() => {
    const seed = Math.floor(Math.random() * 1000000);
    const newCourse = generateCourse(seed);
    // setCurrentCourse(newCourse);
    resetGame(newCourse);
  }, [resetGame]);

  if (!course || !gameState) return <div>Loading...</div>;

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto gap-4">
      <div className="flex justify-between items-center px-4">
        <h1 className="text-2xl font-bold">Dice Golf</h1>
        <Button onClick={handleNewMap} className="w-40" variant="outline">
          <MapPin className="mr-2 h-4 w-4" />
          Random Map
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Dice Golf - Daily Challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4 items-center">
              <Button
                onClick={rollDice}
                disabled={
                  gameState.gameOver ||
                  rolling ||
                  gameState.validMoves.length > 0
                }
                className="w-32"
              >
                <Dice6 className="mr-2" />
                Roll Dice
              </Button>
              <Button
                onClick={takePutt}
                disabled={gameState.gameOver || gameState.validMoves.length > 0}
                variant="secondary"
                className="w-32"
              >
                Take a Putt
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
                {/* Coordinate axis */}
                <g stroke="black" strokeWidth="1" opacity="0.5">
                  <line
                    x1="-120"
                    y1="70"
                    x2="120"
                    y2="-70"
                    stroke="red"
                    strokeDasharray="4"
                  />
                  <text x="-130" y="75" fill="red" fontSize="12">
                    S
                  </text>

                  <line
                    x1="0"
                    y1="-120"
                    x2="0"
                    y2="120"
                    stroke="green"
                    strokeDasharray="4"
                  />
                  <text x="5" y="-125" fill="green" fontSize="12">
                    Q
                  </text>

                  <line
                    x1="120"
                    y1="70"
                    x2="-120"
                    y2="-70"
                    stroke="blue"
                    strokeDasharray="4"
                  />
                  <text x="125" y="75" fill="blue" fontSize="12">
                    R
                  </text>

                  <circle cx="0" cy="0" r="2" fill="black" />
                  <text x="8" y="8" fontSize="10">
                    (0,0,0)
                  </text>
                </g>
                {/* Grid */}
                {Object.entries(course.grid).map(([key, value]) => {
                  const [q, r, s] = key.split(",").map(Number);
                  const center = cubeToPixel(q, r, 10);
                  const corners = getHexCorners(center, 10);
                  const isValidMove = gameState.validMoves.some(
                    (move) => move.q === q && move.r === r && move.s === -q - r
                  );

                  return (
                    <g
                      key={key}
                      onClick={() => moveToHex({ q, r, s: -q - r })}
                      onMouseEnter={() => setHoveredHex({ q, r, s })}
                      onMouseLeave={() => setHoveredHex(null)}
                    >
                      <polygon
                        points={corners.map((p) => `${p.x},${p.y}`).join(" ")}
                        fill={TerrainColors[value]}
                        stroke="#374151"
                        strokeWidth="0.5"
                        className={
                          isValidMove ? "cursor-pointer hover:opacity-80" : ""
                        }
                      />
                      {isValidMove && (
                        <polygon
                          points={scalePolygon(corners, 0.85)
                            .map((p) => `${p.x},${p.y}`)
                            .join(" ")}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          className="pointer-events-none"
                        />
                      )}
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
                      {/* Hole marker */}
                      {value === TerrainType.HOLE && (
                        <text
                          x={center.x}
                          y={center.y}
                          fontSize="8"
                          textAnchor="middle"
                          dy=".3em"
                        >
                          ⛳
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {hoveredHex && (
              <div className="text-sm text-gray-500">
                Coordinates: ({hoveredHex.q}, {hoveredHex.r}, {hoveredHex.s})
              </div>
            )}

            {gameState.gameOver && (
              <div className="text-2xl font-bold text-green-600">
                Course Complete! Final Score: {gameState.strokes}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiceGolfGame;
