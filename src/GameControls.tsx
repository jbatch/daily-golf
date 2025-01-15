import React from "react";
import { Button } from "@/components/ui/button";
import { Dice6, MapPin } from "lucide-react";
import HowToPlayDialog from "./HowToPlayDialog";

interface GameControlsProps {
  onRoll: () => void;
  onPutt: () => void;
  onCancelPutt: () => void;
  onMulligan: () => void;
  onNewMap: () => void;
  gameOver: boolean;
  rolling: boolean;
  hasValidMoves: boolean;
  mulligansLeft: number;
  strokes: number;
  lastRoll: number | null;
  isNearHole: boolean;
  isPutting: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  onRoll,
  onPutt,
  onCancelPutt,
  onMulligan,
  onNewMap,
  gameOver,
  rolling,
  hasValidMoves,
  mulligansLeft,
  strokes,
  lastRoll,
  isNearHole,
  isPutting,
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex justify-between items-center w-full px-4">
        <h1 className="text-2xl font-bold">Daily Golf</h1>
        <div className="flex gap-2">
          <HowToPlayDialog />
          <Button onClick={onNewMap} className="w-40" variant="outline">
            <MapPin className="mr-2 h-4 w-4" />
            Random Map
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Button
          onClick={onRoll}
          disabled={gameOver || rolling || hasValidMoves}
          className="w-32"
        >
          <Dice6 className="mr-2" />
          Roll Dice
        </Button>
        <Button
          onClick={isPutting ? onCancelPutt : onPutt}
          disabled={gameOver || (hasValidMoves && !isPutting)}
          variant="secondary"
          className={`w-32 transition-all duration-300 relative ${
            isNearHole ? "ring-highlight" : ""
          }`}
        >
          {isNearHole && !isPutting && (
            <div className="absolute inset-0 ring-2 ring-blue-400 dark:ring-blue-500 rounded-md animate-[ring-pulse_2s_ease-in-out_infinite]" />
          )}
          {isPutting ? "Cancel" : "Take a Putt"}
        </Button>
        <Button
          onClick={onMulligan}
          disabled={mulligansLeft <= 0 || !lastRoll || gameOver}
          variant="outline"
          className="w-32"
        >
          Mulligan ({mulligansLeft})
        </Button>
      </div>

      <div className="text-lg">
        Strokes: {strokes}
        {lastRoll && <span className="ml-4">Roll: {lastRoll}</span>}
      </div>
    </div>
  );
};

export default GameControls;
