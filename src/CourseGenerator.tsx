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

    // Generate control points for the fairway path
    const controlPoints: CubeCoord[] = [
      start,
      {
        q: start.q + Math.floor(Math.random() * 3) - 1,
        r: Math.floor(start.r * 0.3),
        s: -start.q - Math.floor(start.r * 0.3),
      },
      {
        q: end.q + Math.floor(Math.random() * 3) - 1,
        r: Math.floor(end.r * 0.7),
        s: -end.q - Math.floor(end.r * 0.7),
      },
      end,
    ];

    // Create fairway along path
    for (let t = 0; t <= 1; t += 0.05) {
      const point = bezierPoint(controlPoints, t);
      const q = Math.round(point.q);
      const r = Math.round(point.r);
      const s = -q - r;

      // Create wider fairway
      const neighbors = getHexNeighbors(q, r, s);
      neighbors.forEach(({ q: nq, r: nr, s: ns }) => {
        const key = `${nq},${nr},${ns}`;
        if (grid[key] !== undefined) {
          grid[key] = TerrainType.FAIRWAY;
        }
      });

      const key = `${q},${r},${s}`;
      if (grid[key] !== undefined) {
        grid[key] = TerrainType.FAIRWAY;
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
