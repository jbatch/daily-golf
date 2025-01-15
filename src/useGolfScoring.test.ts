// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { TerrainType, CourseState, BonusType } from "./types";
import { useGolfScoring } from "./useGolfScoring";

const createMockCourse = (): CourseState => ({
  grid: {
    // Basic course layout
    "0,0,0": TerrainType.TEE,
    "1,0,-1": TerrainType.FAIRWAY,
    "2,0,-2": TerrainType.FAIRWAY,
    "3,0,-3": TerrainType.FAIRWAY,
    "4,0,-4": TerrainType.HOLE,
    // Water hazard path
    "2,-1,-1": TerrainType.WATER,
    "2,1,-3": TerrainType.WATER,
  },
  bonuses: {
    "2,0,-2": {
      type: BonusType.MULTIPLIER_2X,
      value: 2,
      used: false,
    },
    "1,0,-1": {
      type: BonusType.POINTS_500,
      value: 500,
      used: false,
    },
  },
  start: { q: 0, r: 0, s: 0 },
  end: { q: 4, r: 0, s: -4 },
  seed: 12345,
});

describe("useGolfScoring Hook", () => {
  let mockCourse: CourseState;

  beforeEach(() => {
    mockCourse = createMockCourse();
  });

  it("initializes with correct starting state", () => {
    const { result } = renderHook(() => useGolfScoring(mockCourse));

    expect(result.current.scoreState).toEqual({
      totalScore: 0,
      currentMultiplier: 1,
      shotHistory: [],
      collectedBonuses: new Set(),
      skillShotStreak: 0,
      strokesOverPar: 0,
    });
  });

  it("calculates base points for a regular shot", () => {
    const { result } = renderHook(() => useGolfScoring(mockCourse));

    const shotScore = result.current.recordShot(
      { q: 0, r: 0, s: 0 },
      { q: 1, r: -1, s: 0 },
      false,
      1,
      0
    );

    expect(shotScore?.points).toBe(100); // Base points for a regular shot
    expect(shotScore?.multiplier).toBe(1);
    expect(shotScore?.isSkillShot).toBe(false);
  });

  it("awards points bonus for water carry", () => {
    const { result } = renderHook(() => useGolfScoring(mockCourse));

    const shotScore = result.current.recordShot(
      { q: 1, r: -1, s: 0 },
      { q: 3, r: 1, s: -4 },
      false,
      1,
      0
    );

    expect(shotScore?.points).toBe(350); // 100 base + 250 water carry
    expect(shotScore?.isSkillShot).toBe(true);
  });

  it("awards bonus for long putt", () => {
    const { result } = renderHook(() => useGolfScoring(mockCourse));

    const shotScore = result.current.recordShot(
      { q: 1, r: 0, s: -1 },
      { q: 4, r: 0, s: -4 },
      true, // Game over (sunk putt)
      1,
      0
    );

    expect(shotScore?.points).toBeGreaterThan(100); // Base + long putt bonus
    expect(shotScore?.isSkillShot).toBe(true);
  });

  it("applies and stacks multiplier bonuses correctly", async () => {
    const { result } = renderHook(() => useGolfScoring(mockCourse));

    // First shot collects 2x multiplier

    const firstShot = await act(() =>
      result.current.recordShot(
        { q: 1, r: 0, s: -1 },
        { q: 2, r: 0, s: -2 },
        false,
        1,
        0
      )
    );

    expect(firstShot?.multiplier).toBe(2);
    expect(result.current.scoreState.currentMultiplier).toBe(2);

    // Second shot should maintain multiplier
    const secondShot = await act(() =>
      result.current.recordShot(
        { q: 2, r: 0, s: -2 },
        { q: 3, r: 0, s: -3 },
        false,
        2,
        0
      )
    );

    expect(secondShot?.multiplier).toBe(2);
  });

  it("builds skill shot streak correctly", () => {
    const { result } = renderHook(() => useGolfScoring(mockCourse));

    // First skill shot (water carry)
    act(() => {
      result.current.recordShot(
        { q: 1, r: -1, s: 0 },
        { q: 3, r: 1, s: -4 },
        false,
        1,
        0
      );
    });

    expect(result.current.scoreState.skillShotStreak).toBe(1);

    // Second skill shot (back over water)
    act(() => {
      result.current.recordShot(
        { q: 3, r: 1, s: -4 },
        { q: 1, r: -1, s: 0 },
        false,
        2,
        0
      );
    });

    expect(result.current.scoreState.skillShotStreak).toBe(2);
    expect(result.current.scoreState.currentMultiplier).toBeGreaterThan(1);
  });

  it.skip("calculates final score correctly", () => {
    // const { result } = renderHook(() => useGolfScoring(mockCourse));
    // const finalScore = result.current.calculateFinalScore(
    //   result.current.par,
    //   4
    // );
    // Should include:
    // - Base score (0)
    // - Mulligan bonus (4 * 200)
    // - Par bonus (2000)
    // expect(finalScore).toBe(2800);
  });

  it("prevents shots after maximum limit", () => {
    const { result } = renderHook(() => useGolfScoring(mockCourse));

    const maxShots = result.current.maxShots;
    const shotScore = result.current.recordShot(
      { q: 0, r: 0, s: 0 },
      { q: 1, r: 0, s: -1 },
      false,
      maxShots + 1,
      0
    );

    expect(shotScore).toBeNull();
  });
});
