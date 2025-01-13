import { useState, useCallback, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CubeCoord } from "./types";
import { checkGameOver, isValidMove, useDiceGolf } from "./useDiceGolfHook";
import { generateCourse } from "./courseGeneration";
import GameControls from "./GameControls";
import CourseRenderer from "./CourseRenderer";
import GameOverDialog from "./GameOverDialog";
import { ShotScore, useGolfScoring } from "./useGolfScoring";
import ScoreDisplay from "./ScoreDisplay";

const getDayNumber = () => {
  const start = new Date("2024-01-13").getTime();
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
  const [lastShot, setLastShot] = useState<ShotScore | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const {
    actions: { rollDice, moveToHex, useMulligan, takePutt },
    course,
    gameState,
    rolling,
    resetGame,
  } = useDiceGolf(generateCourse(getDateSeed()));

  const { scoreState, recordShot } = useGolfScoring(course);

  const handleMove = useCallback(
    (coord: CubeCoord) => {
      if (!isValidMove(coord, gameState.validMoves)) return;

      const shotScore = recordShot(
        gameState.playerPosition,
        coord,
        gameState.lastRoll,
        checkGameOver(
          coord,
          gameState.lastRoll,
          gameState.playerPosition,
          course.end
        ).gameOver
      );
      setLastShot(shotScore);

      // Mark any collected bonuses as used
      if (shotScore.bonusesCollected.length > 0) {
        shotScore.bonusesCollected.forEach((key) => {
          if (course.bonuses[key]) {
            course.bonuses[key].used = true;
          }
        });
      }

      moveToHex(coord);
    },
    [
      course.bonuses,
      course.end,
      gameState.lastRoll,
      gameState.playerPosition,
      gameState.validMoves,
      moveToHex,
      recordShot,
    ]
  );

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

            <ScoreDisplay scoreState={scoreState} lastShot={lastShot} />

            <CourseRenderer
              grid={course.grid}
              validMoves={gameState.validMoves}
              playerPosition={gameState.playerPosition}
              onHexClick={handleMove}
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
        strokes={gameState.strokes}
        skillShots={0}
        bonusesCollected={0}
      />
    </div>
  );
};

export default DiceGolfGame;
