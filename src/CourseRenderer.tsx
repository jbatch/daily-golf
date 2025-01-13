import React from "react";
import { TerrainColors, TerrainType, CubeCoord } from "./types";
import { cubeToPixel, getHexCorners } from "./hexUtils";

// Helper function to scale polygon points around their center
const scalePolygon = (points: { x: number; y: number }[], scale: number) => {
  const center = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x / points.length,
      y: acc.y + point.y / points.length,
    }),
    { x: 0, y: 0 }
  );

  return points.map((point) => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale,
  }));
};

interface CourseRendererProps {
  grid: Record<string, TerrainType>;
  validMoves: CubeCoord[];
  playerPosition: CubeCoord;
  onHexClick: (coord: CubeCoord) => void;
  onHexHover: (coord: CubeCoord | null) => void;
  showCoordinates?: boolean;
}

const CourseRenderer: React.FC<CourseRendererProps> = ({
  grid,
  validMoves,
  playerPosition,
  onHexClick,
  onHexHover,
  showCoordinates = false,
}) => {
  return (
    <div className="relative w-full aspect-square max-w-2xl">
      <svg viewBox="-150 -150 300 300" className="w-full h-full">
        {showCoordinates && (
          <g stroke="black" strokeWidth="1" opacity="0.5">
            <line
              x1="-120"
              y1="70"
              x2="120"
              y2="-70"
              stroke="red"
              strokeDasharray="4"
            />
            <text x="-130" y="75" fill="red" fontSize="12">
              S
            </text>

            <line
              x1="0"
              y1="-120"
              x2="0"
              y2="120"
              stroke="green"
              strokeDasharray="4"
            />
            <text x="5" y="-125" fill="green" fontSize="12">
              Q
            </text>

            <line
              x1="120"
              y1="70"
              x2="-120"
              y2="-70"
              stroke="blue"
              strokeDasharray="4"
            />
            <text x="125" y="75" fill="blue" fontSize="12">
              R
            </text>

            <circle cx="0" cy="0" r="2" fill="black" />
            <text x="8" y="8" fontSize="10">
              (0,0,0)
            </text>
          </g>
        )}

        {Object.entries(grid).map(([key, value]) => {
          const [q, r, s] = key.split(",").map(Number);
          const center = cubeToPixel(q, r, 10);
          const corners = getHexCorners(center, 10);
          const isValidMove = validMoves.some(
            (move) => move.q === q && move.r === r && move.s === -q - r
          );

          return (
            <g
              key={key}
              onClick={() => onHexClick({ q, r, s: -q - r })}
              onMouseEnter={() => onHexHover({ q, r, s })}
              onMouseLeave={() => onHexHover(null)}
            >
              <polygon
                points={corners.map((p) => `${p.x},${p.y}`).join(" ")}
                fill={TerrainColors[value]}
                stroke="#374151"
                strokeWidth="0.5"
                className={isValidMove ? "cursor-pointer hover:opacity-80" : ""}
              />
              {isValidMove && (
                <polygon
                  points={scalePolygon(corners, 0.85)
                    .map((p) => `${p.x},${p.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  className="pointer-events-none"
                />
              )}
              {q === playerPosition.q && r === playerPosition.r && (
                <circle
                  cx={center.x}
                  cy={center.y}
                  r="4"
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
  );
};

export default CourseRenderer;
