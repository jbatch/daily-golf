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

interface GameOverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  strokes: number;
  mulligansUsed: number;
  dayNumber: number;
  score: number;
  skillShots: number;
  bonusesCollected: number;
}

const GameOverDialog: React.FC<GameOverDialogProps> = ({
  isOpen,
  onClose,
  score,
  strokes,
  skillShots,
  bonusesCollected,
  mulligansUsed,
  dayNumber,
}) => {
  const handleShare = () => {
    const shareText =
      `🏌️ Daily Golf #${dayNumber}\n` +
      `Score: ${score}\n` +
      `Strokes: ${strokes}\n` +
      `Mulligans: ${6 - mulligansUsed}/6\n` +
      `Skill Shots: ${skillShots}\n` +
      `Bonuses: ${bonusesCollected}\n` +
      `https://dailygolf.game`;

    navigator.clipboard.writeText(shareText);
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Course Complete! 🎉</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="mt-4 space-y-2">
              <div className="text-xl font-bold">Final Score: {score}</div>
              <div className="space-y-1 text-sm grid grid-cols-2 gap-1">
                <div>Strokes:</div>
                <div className="text-right">{strokes}</div>

                <div>Mulligans Remaining:</div>
                <div className="text-right">{6 - mulligansUsed}/6</div>

                <div>Skill Shots:</div>
                <div className="text-right">{skillShots}</div>

                <div>Bonuses Collected:</div>
                <div className="text-right">{bonusesCollected}</div>
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
