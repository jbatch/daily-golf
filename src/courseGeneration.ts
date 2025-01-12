import { GRID_SIZE, TerrainType, CubeCoord, CourseState } from "./types";
import { bezierPoint, getHexNeighbors } from "./hexUtils";
import { noise2D, randomFromSeed } from "./noiseUtils";

const generateStartAndEnd = (): { start: CubeCoord; end: CubeCoord } => {
  // Define start point
  const start: CubeCoord = { q: 0, r: GRID_SIZE - 1, s: -GRID_SIZE + 1 };

  // Define end point in top third of map
  const topThirdHeight = Math.floor(GRID_SIZE * 0.33);
  const edgeBuffer = 2;

  // Try to place hole until valid position is found
  let end: CubeCoord;
  do {
    const minQ = -Math.floor(GRID_SIZE / 2) + edgeBuffer;
    const maxQ = Math.floor(GRID_SIZE / 2) - edgeBuffer;
    const minR = -GRID_SIZE + edgeBuffer;
    const maxR = -GRID_SIZE + topThirdHeight;

    const q = minQ + Math.floor(Math.random() * (maxQ - minQ + 1));
    const r = minR + Math.floor(Math.random() * (maxR - minR + 1));
    const s = -q - r;

    if (
      Math.abs(q) <= GRID_SIZE &&
      Math.abs(r) <= GRID_SIZE &&
      Math.abs(s) <= GRID_SIZE
    ) {
      end = { q, r, s };
      break;
    }
    // eslint-disable-next-line no-constant-condition
  } while (true);

  return { start, end };
};

const generateControlPoints = (
  start: CubeCoord,
  end: CubeCoord
): CubeCoord[] => {
  const numPoints = 6 + Math.floor(Math.random() * 3);
  const controlPoints = [start];

  for (let i = 1; i < numPoints - 1; i++) {
    const progress = i / (numPoints - 1);
    const baseR = start.r + (end.r - start.r) * progress;

    const lateralVariation = Math.sin(progress * Math.PI) * 2.5;
    const pointQ = Math.floor(
      start.q +
        (end.q - start.q) * progress +
        (Math.random() - 0.5) * lateralVariation
    );
    const pointR = Math.floor(baseR + (Math.random() - 0.5));

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
  end: CubeCoord
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
      grid[key] = TerrainType.GREEN;
      processedGreen.add(key);

      if (distToHole < greenRadius) {
        queue.push(...getHexNeighbors(current));
      }
    }
  }
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
    const randomHex =
      roughHexes[Math.floor(randomFromSeed(i, 0, seed) * roughHexes.length)];
    if (!randomHex) continue;

    const [q, r] = randomHex[0].split(",").map(Number);
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
  const { start, end } = generateStartAndEnd();

  // Generate control points for the fairway
  const controlPoints = generateControlPoints(start, end);

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

      // Add some randomness to fairway width
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
  generateGreen(grid, end);

  // Generate hazards
  generateHazards(grid, seed);

  // Place tee and hole
  grid[`${start.q},${start.r},${start.s}`] = TerrainType.TEE;
  grid[`${end.q},${end.r},${end.s}`] = TerrainType.HOLE;

  return { grid, start, end, seed };
};
