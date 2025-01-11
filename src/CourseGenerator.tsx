import React, { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GRID_SIZE, TerrainType, TerrainColors, CourseState } from "./types";
import {
  cubeToPixel,
  getHexCorners,
  bezierPoint,
  getHexNeighbors,
} from "./hexUtils";
import {
  generateStartAndEnd,
  generateControlPoints,
  generateFairwaySegments,
  generateGreen,
  generateHazards,
} from "./courseGeneration";
import { noise2D } from "./noiseUtils";

const CourseGenerator: React.FC = () => {
  const [course, setCourse] = useState<CourseState | null>(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000));

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
                  const [q, r] = key.split(",").map(Number);
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
