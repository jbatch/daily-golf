import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TerrainType, TerrainColors, CourseState } from "./types";
import { cubeToPixel, getHexCorners } from "./hexUtils";
import { generateCourse } from "./courseGeneration";

const CourseGenerator: React.FC = () => {
  const [course, setCourse] = useState<CourseState | null>(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000));

  const handleGenerate = () => {
    setSeed(Math.floor(Math.random() * 1000000));
    setCourse(generateCourse(seed));
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
            <div className="flex flex-col gap-2 items-center">
              <div className="text-sm text-gray-500">Seed: {course.seed}</div>
              <Button
                onClick={() => {
                  const courseJson = JSON.stringify(course, null, 2);
                  navigator.clipboard.writeText(courseJson);
                }}
                variant="outline"
                className="w-48"
              >
                Copy Course Data
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseGenerator;
