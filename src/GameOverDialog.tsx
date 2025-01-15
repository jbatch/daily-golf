import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScoreState } from "./useGolfScoring";

interface GameOverDialogProps {
  onClose: () => void;
  dayNumber: number;
  isOpen: boolean;
  strokes: number;
  mulligansRemaining: number;
  score: ScoreState;
}

const GameOverDialog: React.FC<GameOverDialogProps> = ({
  onClose,
  isOpen,
  dayNumber,
  strokes,
  mulligansRemaining,
  score,
}) => {
  const skillShots = score.shotHistory.filter((shot) => shot.isSkillShot);
  const handleShare = () => {
    const parStatus =
      strokes === score.par
        ? "Par"
        : strokes < score.par
        ? `${score.par - strokes} Under Par`
        : `${strokes - score.par} Over Par`;

    const shareText =
      `🏌️ Daily Golf #${dayNumber}\n` +
      `Score: ${score.totalScore}\n` +
      `Strokes: ${strokes} (${parStatus})\n` +
      `Mulligans: ${mulligansRemaining}/6\n` +
      `Skill Shots: ${skillShots.length}\n` +
      `Bonuses: ${score.collectedBonuses.size}\n` +
      `https://golf.jbat.ch`;

    navigator.clipboard.writeText(shareText);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString().padStart(7, " ");
  };

  const getParStatus = () => {
    if (strokes === score.par) return "At Par";
    if (strokes < score.par) return `${score.par - strokes} Under Par`;
    return `${strokes - score.par} Over Par`;
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl mb-4">
            Course Complete! 🎉
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-6">
              {/* Receipt header */}
              <div className="text-center border-b pb-2">
                <div className="font-mono text-2xl">
                  Final Score: {score.totalScore}
                </div>
                <div className="text-sm text-gray-500">
                  Daily Golf #{dayNumber}
                </div>
              </div>

              {/* Main receipt content */}
              <div className="font-mono space-y-1 text-sm">
                {/* Shot scores */}
                <div className="mb-2">
                  {score.shotHistory.map((shot, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        Shot {i + 1}
                        {shot.isSkillShot && " 🎯"}
                        {shot.multiplier > 1 && ` (${shot.multiplier}x)`}
                      </span>
                      <span>{formatNumber(shot.points * shot.multiplier)}</span>
                    </div>
                  ))}
                </div>

                {/* Mulligan bonus */}
                <div className="flex justify-between border-t pt-1">
                  <span>Unused Mulligans ({mulligansRemaining}/6)</span>
                  <span>{formatNumber(score.mulliganBonus)}</span>
                </div>

                {/* Par bonus */}
                <div className="flex justify-between">
                  <span>{getParStatus()}</span>
                  <span>{formatNumber(score.parBonus)}</span>
                </div>

                {/* Total */}
                <div className="flex justify-between font-bold border-t border-double pt-1 mt-2">
                  <span>TOTAL</span>
                  <span>{formatNumber(score.totalScore)}</span>
                </div>
              </div>

              {/* Additional stats */}
              <div className="text-sm grid grid-cols-2 gap-2 border-t pt-2">
                <div>Skill Shots:</div>
                <div className="text-right">{skillShots.length}</div>
                <div>Bonuses Collected:</div>
                <div className="text-right">{score.collectedBonuses.size}</div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <Button onClick={handleShare} className="w-full">
            Share Score
          </Button>
          <AlertDialogAction onClick={onClose} className="w-full">
            Close
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GameOverDialog;
