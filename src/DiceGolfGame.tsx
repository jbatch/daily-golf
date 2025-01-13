import { useState, useCallback, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CubeCoord } from "./types";
import { useDiceGolf } from "./useDiceGolfHook";
import { generateCourse } from "./courseGeneration";
import GameControls from "./GameControls";
import CourseRenderer from "./CourseRenderer";
import GameOverDialog from "./GameOverDialog";

const getDayNumber = () => {
  const start = new Date("2025-01-13").getTime();
  const now = new Date().getTime();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
};

const getDateSeed = () => {
  const today = new Date();
  return (
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  );
};

const DiceGolfGame = () => {
  const [hoveredHex, setHoveredHex] = useState<CubeCoord | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);

  const {
    actions: { rollDice, moveToHex, useMulligan, takePutt },
    course,
    gameState,
    rolling,
    resetGame,
  } = useDiceGolf(generateCourse(getDateSeed()));

  // Show game over dialog when game is complete
  useEffect(() => {
    if (gameState.gameOver) {
      setShowGameOver(true);
    }
  }, [gameState.gameOver]);

  const handleNewMap = useCallback(() => {
    const seed = Math.floor(Math.random() * 1000000);
    resetGame(generateCourse(seed));
  }, [resetGame]);

  if (!course || !gameState) return <div>Loading...</div>;

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto gap-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daily Golf - Day #{getDayNumber()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <GameControls
              onRoll={rollDice}
              onPutt={takePutt}
              onMulligan={useMulligan}
              onNewMap={handleNewMap}
              gameOver={gameState.gameOver}
              rolling={rolling}
              hasValidMoves={gameState.validMoves.length > 0}
              mulligansLeft={gameState.mulligansLeft}
              strokes={gameState.strokes}
              lastRoll={gameState.lastRoll}
            />

            <CourseRenderer
              grid={course.grid}
              validMoves={gameState.validMoves}
              playerPosition={gameState.playerPosition}
              onHexClick={moveToHex}
              onHexHover={setHoveredHex}
            />

            {hoveredHex && (
              <div className="text-sm text-gray-500">
                Coordinates: ({hoveredHex.q}, {hoveredHex.r}, {hoveredHex.s})
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <GameOverDialog
        isOpen={showGameOver}
        onClose={() => setShowGameOver(false)}
        score={gameState.strokes}
        mulligansUsed={6 - gameState.mulligansLeft}
        dayNumber={getDayNumber()}
      />
    </div>
  );
};

export default DiceGolfGame;
