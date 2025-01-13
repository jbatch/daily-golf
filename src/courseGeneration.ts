import {
  GRID_SIZE,
  TerrainType,
  CubeCoord,
  CourseState,
  Bonus,
  BonusType,
} from "./types";
import { bezierPoint, getHexNeighbors } from "./hexUtils";
import { noise2D, randomFromSeed } from "./noiseUtils";

const generateStartAndEnd = (
  seed: number
): { start: CubeCoord; end: CubeCoord } => {
  // Define start point near bottom center
  const start: CubeCoord = { q: 0, r: GRID_SIZE - 1, s: -GRID_SIZE + 1 };

  // Define end point in top third of map with controlled randomness
  const topThirdHeight = Math.floor(GRID_SIZE * 0.33);
  const edgeBuffer = 2;

  const minQ = -Math.floor(GRID_SIZE / 2) + edgeBuffer;
  const maxQ = Math.floor(GRID_SIZE / 2) - edgeBuffer;
  const minR = -GRID_SIZE + edgeBuffer;
  const maxR = -GRID_SIZE + topThirdHeight;

  // Use seeded random for end point position
  const q = minQ + Math.floor(randomFromSeed(0, 1, seed) * (maxQ - minQ + 1));
  const r = minR + Math.floor(randomFromSeed(1, 1, seed) * (maxR - minR + 1));
  const s = -q - r;

  const end = { q, r, s };
  return { start, end };
};

const generateControlPoints = (
  start: CubeCoord,
  end: CubeCoord,
  seed: number
): CubeCoord[] => {
  // Use seed to determine number of control points
  const numPoints = 6 + Math.floor(randomFromSeed(0, 2, seed) * 3);
  const controlPoints = [start];

  for (let i = 1; i < numPoints - 1; i++) {
    const progress = i / (numPoints - 1);
    const baseR = start.r + (end.r - start.r) * progress;

    // Use seeded noise for lateral variation
    const lateralVariation = Math.sin(progress * Math.PI) * 2.5;
    const lateralRandom = randomFromSeed(i, 2, seed) - 0.5;

    const pointQ = Math.floor(
      start.q + (end.q - start.q) * progress + lateralRandom * lateralVariation
    );
    const pointR = Math.floor(baseR + (randomFromSeed(i, 3, seed) - 0.5));

    controlPoints.push({
      q: pointQ,
      r: pointR,
      s: -pointQ - pointR,
    });
  }
  controlPoints.push(end);
  return controlPoints;
};

const generateFairwaySegments = (
  seed: number
): { start: number; end: number }[] => {
  const segments: { start: number; end: number }[] = [];
  const currentSegment = { start: 0, end: 0 };
  let inGap = false;

  for (let t = 0; t <= 1; t += 0.01) {
    const shouldHaveGap =
      noise2D(t * 10, 0, seed) > 0.85 && t > 0.15 && t < 0.85;

    if (shouldHaveGap && !inGap) {
      currentSegment.end = t;
      segments.push({ ...currentSegment });
      inGap = true;
    } else if (!shouldHaveGap && inGap) {
      currentSegment.start = t;
      inGap = false;
    }
  }

  if (!inGap) {
    currentSegment.end = 1;
    segments.push({ ...currentSegment });
  }

  return segments;
};

const generateGreen = (
  grid: Record<string, TerrainType>,
  end: CubeCoord,
  seed: number
): void => {
  const greenRadius = 2;
  const queue = [end];
  const processedGreen = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.q},${current.r},${current.s}`;

    if (processedGreen.has(key)) continue;

    const distToHole =
      Math.abs(current.q - end.q) +
      Math.abs(current.r - end.r) +
      Math.abs(current.s - end.s);

    if (distToHole <= greenRadius && grid[key] !== undefined) {
      // Use noise to create slightly irregular green shape
      const greenNoise = noise2D(current.q, current.r, seed + 1000);
      if (greenNoise > 0.3 || distToHole <= 1) {
        grid[key] = TerrainType.GREEN;
        processedGreen.add(key);

        if (distToHole < greenRadius) {
          queue.push(...getHexNeighbors(current));
        }
      }
    }
  }
};

const generateBonusCells = (
  grid: Record<string, TerrainType>,
  seed: number
): Record<string, Bonus> => {
  const bonuses: Record<string, Bonus> = {};

  // Place bonus cells along fairway and rough
  const validHexes = Object.entries(grid).filter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, value]) => value === TerrainType.FAIRWAY || value === TerrainType.ROUGH
  );

  // Generate a fixed number of each bonus type
  const bonusTypes = [
    { type: BonusType.MULTIPLIER_2X, value: 2, count: 2 },
    { type: BonusType.MULTIPLIER_3X, value: 3, count: 1 },
    { type: BonusType.POINTS_500, value: 500, count: 3 },
    { type: BonusType.EXTRA_MULLIGAN, value: 1, count: 1 },
  ];

  bonusTypes.forEach(({ type, value, count }, typeIndex) => {
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(
        randomFromSeed(i, typeIndex + 10, seed) * validHexes.length
      );
      const [key] = validHexes[randomIndex];
      bonuses[key] = {
        type,
        value,
        used: false,
      };
      // Remove used hex from available positions
      validHexes.splice(randomIndex, 1);
    }
  });

  return bonuses;
};

const generateHazards = (
  grid: Record<string, TerrainType>,
  seed: number
): void => {
  const roughHexes = Object.entries(grid).filter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, value]) => value === TerrainType.ROUGH
  );

  const features: { center: CubeCoord; type: TerrainType; size: number }[] = [];
  const numFeatures = 3 + Math.floor(randomFromSeed(0, 0, seed) * 4);

  // Generate feature centers
  for (let i = 0; i < numFeatures; i++) {
    const randomIndex = Math.floor(
      randomFromSeed(i, 0, seed) * roughHexes.length
    );
    const [key] = roughHexes[randomIndex];
    if (!key) continue;

    const [q, r] = key.split(",").map(Number);
    const s = -q - r;
    const positionNoise = noise2D(q / 3, r / 3, seed + i);

    const type =
      positionNoise < 0.4
        ? TerrainType.TREES
        : positionNoise < 0.7
        ? TerrainType.SAND
        : TerrainType.WATER;

    features.push({
      center: { q, r, s },
      type,
      size: 2 + Math.floor(randomFromSeed(i, 1, seed) * 3),
    });
  }

  // Apply features
  Object.entries(grid).forEach(([key, value]) => {
    if (value === TerrainType.ROUGH) {
      const [q, r] = key.split(",").map(Number);
      const s = -q - r;

      let maxInfluence = 0;
      let selectedType = TerrainType.ROUGH;

      features.forEach((feature) => {
        const dist =
          Math.abs(q - feature.center.q) +
          Math.abs(r - feature.center.r) +
          Math.abs(s - feature.center.s);

        const influence = Math.max(0, 1 - dist / (feature.size * 2));
        const noiseInfluence =
          influence *
          (0.7 +
            0.3 *
              noise2D(
                q / 2 + feature.center.q,
                r / 2 + feature.center.r,
                seed
              ));

        if (noiseInfluence > maxInfluence) {
          maxInfluence = noiseInfluence;
          selectedType = feature.type;
        }
      });

      if (maxInfluence > 0.3) {
        grid[key] = selectedType;
      }
    }
  });
};

export const generateCourse = (seed: number): CourseState => {
  // Initialize empty grid
  const grid: Record<string, TerrainType> = {};
  for (let q = -GRID_SIZE; q <= GRID_SIZE; q++) {
    for (let r = -GRID_SIZE; r <= GRID_SIZE; r++) {
      const s = -q - r;
      if (Math.abs(s) <= GRID_SIZE) {
        grid[`${q},${r},${s}`] = TerrainType.ROUGH;
      }
    }
  }

  // Generate start and end points
  const { start, end } = generateStartAndEnd(seed);

  // Generate control points for the fairway
  const controlPoints = generateControlPoints(start, end, seed);

  // Create fairway with strategic gaps
  const processedHexes = new Set<string>();
  const fairwaySegments = generateFairwaySegments(seed);

  // Generate fairway along segments
  fairwaySegments.forEach((segment) => {
    for (let t = segment.start; t <= segment.end; t += 0.01) {
      const point = bezierPoint(controlPoints, t);
      const q = Math.round(point.q);
      const r = Math.round(point.r);
      const s = -q - r;
      const key = `${q},${r},${s}`;

      if (grid[key] === undefined) continue;

      // Check if we're near a control point for landing zones
      const isLandingZone = controlPoints.some(
        (cp) => Math.abs(cp.q - q) + Math.abs(cp.r - r) < 2
      );

      // Add some randomness to fairway width using seeded noise
      const fairwayVariation = noise2D(t * 5, 0, seed) > 0.7;

      // Basic fairway hex
      grid[key] = TerrainType.FAIRWAY;
      processedHexes.add(key);

      // Add wider areas for landing zones and random variations
      if (isLandingZone || fairwayVariation) {
        getHexNeighbors({ q, r, s }).forEach((neighbor) => {
          const nKey = `${neighbor.q},${neighbor.r},${neighbor.s}`;
          if (grid[nKey] !== undefined && !processedHexes.has(nKey)) {
            if (noise2D(neighbor.q / 2, neighbor.r / 2, seed) > 0.3) {
              grid[nKey] = TerrainType.FAIRWAY;
              processedHexes.add(nKey);
            }
          }
        });
      }
    }
  });

  // Generate green area
  generateGreen(grid, end, seed);

  // Generate hazards
  generateHazards(grid, seed);

  // Generate bonus cells
  const bonuses = generateBonusCells(grid, seed);

  // Place tee and hole
  grid[`${start.q},${start.r},${start.s}`] = TerrainType.TEE;
  grid[`${end.q},${end.r},${end.s}`] = TerrainType.HOLE;
  console.log({ bonuses });

  return { grid, bonuses, start, end, seed };
};
