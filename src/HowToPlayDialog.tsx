import React, { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CircleHelp } from "lucide-react";

const TerrainExample = ({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-6 h-6 rounded" style={{ backgroundColor: color }} />
    <span>{children}</span>
  </div>
);

const HowToPlayDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if this is the first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenGolfTutorial");
    if (!hasSeenTutorial) {
      setIsOpen(true);
      localStorage.setItem("hasSeenGolfTutorial", "true");
    }
  }, []);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon">
          <CircleHelp className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>How to Play Daily Golf</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Basics:</h3>
                <p>
                  Get your golf ball from the tee to the hole in as few strokes
                  as possible. Each day features a new course that's the same
                  for everyone.
                </p>
              </div>

              <div>
                <h3 className="font-bold mb-2">Controls:</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong>Roll Dice:</strong> Roll a d6 to determine how far
                    you can hit
                  </li>
                  <li>
                    <strong>Take a Putt:</strong> Move exactly one space instead
                    of rolling
                  </li>
                  <li>
                    <strong>Mulligan:</strong> Re-roll your dice (maximum 6 per
                    round)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">Terrain Types:</h3>
                <div className="grid grid-cols-2 gap-x-4">
                  <TerrainExample color="#86efac">
                    Fairway (+1 to roll)
                  </TerrainExample>
                  <TerrainExample color="#16a34a">
                    Rough (normal)
                  </TerrainExample>
                  <TerrainExample color="#fef08a">
                    Sand (-1 to roll)
                  </TerrainExample>
                  <TerrainExample color="#60a5fa">
                    Water (can't land)
                  </TerrainExample>
                  <TerrainExample color="#166534">
                    Trees (blocks shots)
                  </TerrainExample>
                  <TerrainExample color="#4ade80">
                    Green (near hole)
                  </TerrainExample>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">Scoring:</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li>100 points per shot</li>
                  <li>Bonus for shooting over water</li>
                  <li>Extra points for long putts</li>
                  <li>Collect purple bonuses for multipliers and points</li>
                  <li>Build combos with consecutive skill shots</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">Special Rules:</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Trees block shots unless hitting from fairway</li>
                  <li>Can't land on water hazards</li>
                  <li>
                    Overshooting the hole by one space counts as sinking it
                  </li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction onClick={() => setIsOpen(false)}>
            Got it!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default HowToPlayDialog;
