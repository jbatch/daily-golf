import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CubeCoord } from "./types";
import {
  checkGameOver,
  getHexDistance,
  isValidMove,
  useDiceGolf,
} from "./useDiceGolfHook";
import { generateCourse } from "./courseGeneration";
import GameControls from "./GameControls";
import CourseRenderer from "./CourseRenderer";
import GameOverDialog from "./GameOverDialog";
import { ShotScore, useGolfScoring } from "./useGolfScoring";
import ScoreDisplay from "./ScoreDisplay";

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
  const [lastShot, setLastShot] = useState<ShotScore | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);

  const initialCourse = useMemo(() => generateCourse(getDateSeed()), []);
  const {
    actions: { rollDice, moveToHex, useMulligan, takePutt, cancelPutt },
    course,
    gameState,
    rolling,
    resetGame,
  } = useDiceGolf(initialCourse);

  const { scoreState, recordShot } = useGolfScoring(course);

  const handleMove = useCallback(
    (coord: CubeCoord) => {
      if (!isValidMove(coord, gameState.validMoves)) return;

      // Check if this shot finishes the hole before calculating score
      const gameOverShot = checkGameOver(
        coord,
        gameState.lastRoll,
        gameState.playerPosition,
        course.end
      ).gameOver;

      const shotScore = recordShot(
        gameState.playerPosition,
        coord,
        gameOverShot,
        gameState.strokes,
        gameState.mulligansLeft
      );

      if (!shotScore) {
        // Out of shots
        return;
      }
      setLastShot(shotScore);

      moveToHex(coord);
    },
    [course.end, gameState, moveToHex, recordShot]
  );

  // Show game over dialog when game is complete
  useEffect(() => {
    if (gameState.gameOver) {
      setTimeout(() => {
        setShowGameOver(true);
      }, 1000);
    }
  }, [gameState.gameOver, scoreState]);

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
              onCancelPutt={cancelPutt}
              onMulligan={useMulligan}
              onNewMap={handleNewMap}
              onViewResults={() => setShowGameOver(true)}
              gameOver={gameState.gameOver}
              rolling={rolling}
              hasValidMoves={gameState.validMoves.length > 0}
              mulligansLeft={gameState.mulligansLeft}
              strokes={gameState.strokes}
              par={scoreState.par}
              lastRoll={gameState.lastRoll}
              isNearHole={
                getHexDistance(gameState.playerPosition, course.end) === 1
              }
              isPutting={gameState.isPutting}
            />

            <ScoreDisplay scoreState={scoreState} lastShot={lastShot} />

            <CourseRenderer
              grid={course.grid}
              bonuses={course.bonuses}
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
        onClose={() => setShowGameOver(false)}
        isOpen={showGameOver}
        dayNumber={getDayNumber()}
        mulligansRemaining={gameState.mulligansLeft}
        strokes={gameState.strokes}
        score={scoreState}
      />
    </div>
  );
};

export default DiceGolfGame;
