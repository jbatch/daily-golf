import { useState, useCallback, useMemo } from "react";
import { CubeCoord, CourseState, TerrainType, BonusType } from "./types";
import { GameState, getHexDistance, getHexesInLine } from "./useDiceGolfHook";

export interface ShotScore {
  points: number;
  bonusesCollected: string[];
  multiplier: number;
  isSkillShot: boolean;
}

export interface ScoreState {
  totalScore: number;
  currentMultiplier: number;
  shotHistory: ShotScore[];
  collectedBonuses: Set<string>;
  skillShotStreak: number;
  strokesOverPar: number;
}

const calculatePar = (course: CourseState): number => {
  // Calculate minimum distance from tee to hole
  const baseDistance = getHexDistance(course.start, course.end);

  // Par calculation:
  // Base par is the minimum distance in hexes
  // Add 1 stroke per 3 hazards in the play area
  // Add 1 for putting
  // Add 1 for general course difficulty
  return Math.floor(baseDistance / 4) + 2;
};

const MAX_SHOTS = (par: number) => par + 6; // Maximum shots allowed is par + 6

export const useGolfScoring = (course: CourseState) => {
  const par = useMemo(() => calculatePar(course), [course]);

  const [scoreState, setScoreState] = useState<ScoreState>({
    totalScore: 0,
    currentMultiplier: 1,
    shotHistory: [],
    collectedBonuses: new Set(),
    skillShotStreak: 0,
    strokesOverPar: 0,
  });

  const calculateShotScore = useCallback(
    (
      from: CubeCoord,
      to: CubeCoord,
      isGameOver: boolean,
      currentStrokes: number
    ): ShotScore => {
      const shotScore: ShotScore = {
        points: 0,
        bonusesCollected: [],
        multiplier: scoreState.currentMultiplier,
        isSkillShot: false,
      };

      // Base points for the shot (decreases as you go over par)
      const strokesOverPar = Math.max(0, currentStrokes - par);
      const basePoints = Math.max(25, 100 - strokesOverPar * 25);
      shotScore.points += basePoints;

      // Check for water carry (skill shot)
      const pathHexes = getHexesInLine(from, to);
      let hasWater = false;
      for (const hex of pathHexes) {
        const key = `${hex.q},${hex.r},${hex.s}`;
        if (course.grid[key] === TerrainType.WATER) {
          hasWater = true;
          break;
        }
      }
      if (hasWater) {
        shotScore.points += 250;
        shotScore.isSkillShot = true;
      }

      // Check for long putt
      if (isGameOver) {
        const distance = getHexDistance(from, to);
        if (distance >= 3) {
          shotScore.points += distance * 100;
          shotScore.isSkillShot = true;
        }
      }

      // Check for collecting bonuses
      const toKey = `${to.q},${to.r},${to.s}`;
      const bonus = course.bonuses[toKey];
      if (bonus && !bonus.used && !scoreState.collectedBonuses.has(toKey)) {
        switch (bonus.type) {
          case BonusType.MULTIPLIER_2X:
            shotScore.multiplier = 2;
            break;
          case BonusType.MULTIPLIER_3X:
            shotScore.multiplier = 3;
            break;
          case BonusType.POINTS_500:
            shotScore.points += 500;
            break;
          // Extra mulligan is handled by the game state
        }
        shotScore.bonusesCollected.push(toKey);
      }

      return shotScore;
    },
    [
      course.bonuses,
      course.grid,
      par,
      scoreState.collectedBonuses,
      scoreState.currentMultiplier,
    ]
  );

  const recordShot = useCallback(
    (
      from: CubeCoord,
      to: CubeCoord,
      isGameOver: boolean,
      currentStrokes: number
    ) => {
      // Check if we've exceeded maximum shots
      if (currentStrokes >= MAX_SHOTS(par)) {
        return null; // Indicate shot limit reached
      }

      const shotScore = calculateShotScore(
        from,
        to,
        isGameOver,
        currentStrokes
      );

      // Update streak
      const newStreak = shotScore.isSkillShot
        ? scoreState.skillShotStreak + 1
        : 0;

      // Calculate new multiplier (base + streak bonus) for shot and future shots
      const streakBonus = Math.min(newStreak * 0.1, 0.5); // Max 50% bonus from streak
      const newMultiplier = Math.max(1, shotScore.multiplier + streakBonus);
      shotScore.multiplier = newMultiplier;

      // Add collected bonuses to the set
      const newCollectedBonuses = new Set(scoreState.collectedBonuses);
      shotScore.bonusesCollected.forEach((b) => newCollectedBonuses.add(b));
      const newScore = {
        totalScore:
          scoreState.totalScore + shotScore.points * shotScore.multiplier,
        currentMultiplier: newMultiplier,
        shotHistory: [...scoreState.shotHistory, shotScore],
        collectedBonuses: newCollectedBonuses,
        skillShotStreak: newStreak,
        strokesOverPar: Math.max(0, currentStrokes - par),
      };
      setScoreState(newScore);

      return shotScore;
    },
    [
      calculateShotScore,
      par,
      scoreState.collectedBonuses,
      scoreState.shotHistory,
      scoreState.skillShotStreak,
      scoreState.totalScore,
    ]
  );

  const calculateFinalScore = useCallback(
    (gameState: GameState) => {
      if (!gameState.gameOver) {
        return 0;
      }
      const { mulligansLeft, strokes } = gameState;
      const mulliganBonus = mulligansLeft * 200;

      // Par bonus calculation
      let parBonus = 0;
      if (strokes <= par) {
        // Significant bonus for being under or at par
        const strokesUnderPar = par - strokes;
        parBonus = 2000 + strokesUnderPar * 1000; // 2000 for par, +1000 per stroke under
      } else {
        // Penalty for being over par
        const strokesOverPar = strokes - par;
        parBonus = -500 * strokesOverPar; // -500 points per stroke over par
      }

      return scoreState.totalScore + mulliganBonus + parBonus;
    },
    [par, scoreState.totalScore]
  );

  return {
    scoreState,
    recordShot,
    calculateFinalScore,
    par,
    maxShots: MAX_SHOTS(par),
  };
};
