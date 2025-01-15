import React from "react";
import { ShotScore, ScoreState } from "./useGolfScoring";

interface ScoreDisplayProps {
  scoreState: ScoreState;
  lastShot: ShotScore | null;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  scoreState,
  lastShot,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-2xl font-bold text-center">
        Score: {Math.round(scoreState.totalScore)}
      </div>
      {scoreState.currentMultiplier > 1 && (
        <div className="text-sm text-purple-600 text-center">
          Current Multiplier: {scoreState.currentMultiplier.toFixed(1)}x
        </div>
      )}

      {scoreState.skillShotStreak > 0 && (
        <div className="text-sm text-green-600 text-center">
          Skill Shot Streak: {scoreState.skillShotStreak}
        </div>
      )}

      {lastShot && (
        <div className="flex flex-col gap-1 text-sm border-t border-gray-200 mt-2 pt-2">
          <div className="font-semibold">Last Shot:</div>
          <div className="flex justify-between">
            <span>Base Points:</span>
            <span>{Math.round(lastShot.points)}</span>
          </div>
          {lastShot.multiplier > 1 && (
            <div className="flex justify-between text-purple-600">
              <span>Multiplier:</span>
              <span>{lastShot.multiplier.toFixed(1)}x</span>
            </div>
          )}
          {lastShot.isSkillShot && (
            <div className="text-green-600">Skill Shot!</div>
          )}
          <div className="font-semibold flex justify-between">
            <span>Shot Total:</span>
            <span>{Math.round(lastShot.points * lastShot.multiplier)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;
