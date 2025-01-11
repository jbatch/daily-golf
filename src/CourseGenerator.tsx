import React, { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Constants and Types
const GRID_SIZE = 8;

enum TerrainType {
  EMPTY = 0,
  FAIRWAY = 1,
  ROUGH = 2,
  SAND = 3,
  WATER = 4,
  TREES = 5,
  TEE = 6,
  HOLE = 7,
}

const TerrainColors: Record<TerrainType, string> = {
  [TerrainType.EMPTY]: "#f3f4f6", // gray-100
  [TerrainType.FAIRWAY]: "#86efac", // green-300
  [TerrainType.ROUGH]: "#16a34a", // green-600
  [TerrainType.SAND]: "#fef08a", // yellow-200
  [TerrainType.WATER]: "#60a5fa", // blue-400
  [TerrainType.TREES]: "#166534", // green-800
  [TerrainType.TEE]: "#f87171", // red-400
  [TerrainType.HOLE]: "#1f2937", // gray-800
};

interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

interface Point {
  x: number;
  y: number;
}

interface CourseState {
  grid: Record<string, TerrainType>;
  start: CubeCoord;
  end: CubeCoord;
  seed: number;
}

// Hex Grid Utilities
const cubeToPixel = (q: number, r: number, size: number): Point => {
  const x = size * ((3 / 2) * q);
  const y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
  return { x, y };
};

const getHexCorners = (center: Point, size: number): Point[] => {
  const corners: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((2 * Math.PI) / 6) * i;
    corners.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle),
    });
  }
  return corners;
};

const getHexNeighbors = (q: number, r: number, s: number): CubeCoord[] => {
  const directions: CubeCoord[] = [
    { q: 1, r: -1, s: 0 },
    { q: 1, r: 0, s: -1 },
    { q: 0, r: 1, s: -1 },
    { q: -1, r: 1, s: 0 },
    { q: -1, r: 0, s: 1 },
    { q: 0, r: -1, s: 1 },
  ];
  return directions.map((dir) => ({
    q: q + dir.q,
    r: r + dir.r,
    s: s + dir.s,
  }));
};

// Bezier curve calculation
const bezierPoint = (points: CubeCoord[], t: number): CubeCoord => {
  if (points.length === 1) return points[0];

  const newPoints: CubeCoord[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    newPoints.push({
      q: points[i].q * (1 - t) + points[i + 1].q * t,
      r: points[i].r * (1 - t) + points[i + 1].r * t,
      s: points[i].s * (1 - t) + points[i + 1].s * t,
    });
  }

  return bezierPoint(newPoints, t);
};

const CourseGenerator: React.FC = () => {
  const [course, setCourse] = useState<CourseState | null>(null);
  const [seed, setSeed] = useState<number>(() =>
    Math.floor(Math.random() * 1000000)
  );

  const generateCourse = useCallback((): CourseState => {
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

    // Define start and end points
    const start: CubeCoord = { q: 0, r: GRID_SIZE - 1, s: -GRID_SIZE + 1 };
    const end: CubeCoord = {
      q: Math.floor(Math.random() * 3) - 1,
      r: -GRID_SIZE + 1,
      s: GRID_SIZE - 1,
    };

    // Generate control points for a more interesting fairway path
    const numIntermediatePoints = 3 + Math.floor(Math.random() * 3); // 3-5 intermediate points
    const controlPoints: CubeCoord[] = [start];

    // Create a series of intermediate points with more variation
    for (let i = 1; i <= numIntermediatePoints; i++) {
      const progress = i / (numIntermediatePoints + 1);
      const baseR = start.r + (end.r - start.r) * progress;

      // Add more lateral variation as we get towards the middle
      const lateralVariation = Math.sin(progress * Math.PI) * 4;
      const pointQ = Math.floor(
        start.q +
          (end.q - start.q) * progress +
          (Math.random() * 2 - 1) * lateralVariation
      );
      const pointR = Math.floor(baseR + (Math.random() * 2 - 1) * 2);

      controlPoints.push({
        q: pointQ,
        r: pointR,
        s: -pointQ - pointR,
      });
    }

    controlPoints.push(end);

    // Create fairway along path with varying width
    for (let t = 0; t <= 1; t += 0.02) {
      // Smaller steps for smoother path
      const point = bezierPoint(controlPoints, t);
      const q = Math.round(point.q);
      const r = Math.round(point.r);
      const s = -q - r;

      // Vary fairway width based on position and some randomization
      const widthVariation = Math.sin(t * Math.PI * 2) * 0.5 + 1.5; // Oscillates between 1 and 2
      const fairwayWidth = Math.ceil(widthVariation + Math.random() * 0.5);

      // Create wider landing zones near control points
      const nearControlPoint = controlPoints.some(
        (cp) => Math.abs(cp.q - q) + Math.abs(cp.r - r) < 3
      );

      const width = nearControlPoint ? fairwayWidth + 1 : fairwayWidth;

      // Expand fairway in rings up to the calculated width
      let hexesToProcess = [{ q, r, s }];
      const processed = new Set<string>();

      for (let ring = 0; ring < width; ring++) {
        const nextRing: CubeCoord[] = [];

        hexesToProcess.forEach((hex) => {
          const key = `${hex.q},${hex.r},${hex.s}`;
          if (!processed.has(key) && grid[key] !== undefined) {
            grid[key] = TerrainType.FAIRWAY;
            processed.add(key);

            // Add neighbors to next ring
            getHexNeighbors(hex.q, hex.r, hex.s).forEach((neighbor) => {
              const neighborKey = `${neighbor.q},${neighbor.r},${neighbor.s}`;
              if (!processed.has(neighborKey)) {
                nextRing.push(neighbor);
              }
            });
          }
        });

        hexesToProcess = nextRing;
      }
    }

    // Add hazards
    Object.entries(grid).forEach(([key, value]) => {
      if (value === TerrainType.ROUGH) {
        const rand = Math.random();
        if (rand < 0.2) grid[key] = TerrainType.TREES;
        else if (rand < 0.3) grid[key] = TerrainType.SAND;
        else if (rand < 0.35) grid[key] = TerrainType.WATER;
      }
    });

    // Place tee and hole
    grid[`${start.q},${start.r},${start.s}`] = TerrainType.TEE;
    grid[`${end.q},${end.r},${end.s}`] = TerrainType.HOLE;

    return { grid, start, end, seed };
  }, [seed]);

  const handleGenerate = () => {
    setSeed(Math.floor(Math.random() * 1000000));
    setCourse(generateCourse());
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Daily Golf Course Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <Button onClick={handleGenerate} className="w-48">
            Generate New Course
          </Button>

          {course && (
            <div className="relative w-full aspect-square max-w-2xl">
              <svg viewBox="-150 -150 300 300" className="w-full h-full">
                {Object.entries(course.grid).map(([key, value]) => {
                  const [q, r, s] = key.split(",").map(Number);
                  const center = cubeToPixel(q, r, 10);
                  const corners = getHexCorners(center, 10);

                  return (
                    <g key={key}>
                      <polygon
                        points={corners.map((p) => `${p.x},${p.y}`).join(" ")}
                        fill={TerrainColors[value]}
                        stroke="#374151"
                        strokeWidth="0.5"
                      />
                      {value === TerrainType.TEE && (
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r="3"
                          fill="white"
                          stroke="black"
                        />
                      )}
                      {value === TerrainType.HOLE && (
                        <text
                          x={center.x}
                          y={center.y}
                          fontSize="8"
                          textAnchor="middle"
                          dy=".3em"
                        >
                          ⛳
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {course && (
            <div className="text-sm text-gray-500">Seed: {course.seed}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseGenerator;
