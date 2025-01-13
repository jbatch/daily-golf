import { useState, useCallback } from "react";
import { CubeCoord, CourseState, TerrainType, BonusType } from "./types";
import { getHexDistance, getHexesInLine } from "./useDiceGolfHook";

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
}

export const useGolfScoring = (course: CourseState) => {
  const [scoreState, setScoreState] = useState<ScoreState>({
    totalScore: 0,
    currentMultiplier: 1,
    shotHistory: [],
    collectedBonuses: new Set(),
    skillShotStreak: 0,
  });

  const calculateShotScore = useCallback(
    (from: CubeCoord, to: CubeCoord, isGameOver: boolean): ShotScore => {
      const shotScore: ShotScore = {
        points: 0,
        bonusesCollected: [],
        multiplier: scoreState.currentMultiplier,
        isSkillShot: false,
      };

      // Base points for the shot
      shotScore.points += 100;

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
      scoreState.collectedBonuses,
      scoreState.currentMultiplier,
    ]
  );

  const recordShot = useCallback(
    (from: CubeCoord, to: CubeCoord, isGameOver: boolean) => {
      const shotScore = calculateShotScore(from, to, isGameOver);

      setScoreState((prev) => {
        // Update streak
        const newStreak = shotScore.isSkillShot ? prev.skillShotStreak + 1 : 0;

        // Calculate new multiplier (base + streak bonus)
        const streakBonus = Math.min(newStreak * 0.1, 0.5); // Max 50% bonus from streak
        const newMultiplier = Math.max(1, shotScore.multiplier + streakBonus);

        // Add collected bonuses to the set
        const newCollectedBonuses = new Set(prev.collectedBonuses);
        shotScore.bonusesCollected.forEach((b) => newCollectedBonuses.add(b));

        return {
          totalScore: prev.totalScore + shotScore.points * shotScore.multiplier,
          currentMultiplier: newMultiplier,
          shotHistory: [...prev.shotHistory, shotScore],
          collectedBonuses: newCollectedBonuses,
          skillShotStreak: newStreak,
        };
      });

      return shotScore;
    },
    [calculateShotScore]
  );

  const calculateFinalScore = useCallback(
    (mulligansLeft: number) => {
      const mulliganBonus = mulligansLeft * 200;
      return scoreState.totalScore + mulliganBonus;
    },
    [scoreState.totalScore]
  );

  return {
    scoreState,
    recordShot,
    calculateFinalScore,
  };
};
