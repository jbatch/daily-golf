import { CubeCoord, Point } from "./types";

export const cubeToPixel = (q: number, r: number, size: number): Point => {
  const x = size * ((3 / 2) * q);
  const y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
  return { x, y };
};

export const getHexCorners = (center: Point, size: number): Point[] => {
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

export const getHexNeighbors = (coord: CubeCoord): CubeCoord[] => {
  const directions: CubeCoord[] = [
    { q: 1, r: -1, s: 0 },
    { q: 1, r: 0, s: -1 },
    { q: 0, r: 1, s: -1 },
    { q: -1, r: 1, s: 0 },
    { q: -1, r: 0, s: 1 },
    { q: 0, r: -1, s: 1 },
  ];
  return directions.map((dir) => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r,
    s: coord.s + dir.s,
  }));
};

export const bezierPoint = (points: CubeCoord[], t: number): CubeCoord => {
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
