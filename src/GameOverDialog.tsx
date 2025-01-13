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
  score: number;
  mulligansUsed: number;
  dayNumber: number;
}

const GameOverDialog: React.FC<GameOverDialogProps> = ({
  isOpen,
  onClose,
  score,
  mulligansUsed,
  dayNumber,
}) => {
  const handleShare = () => {
    const shareText =
      `🏌️ Daily Golf #${dayNumber}\n` +
      `Strokes: ${score}\n` +
      `Mulligans: ${6 - mulligansUsed}/6\n` +
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
              <p>Final Score: {score}</p>
              <p>Mulligans Used: {6 - mulligansUsed}/6</p>
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
