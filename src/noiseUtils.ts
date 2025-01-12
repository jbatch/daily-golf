export const randomFromSeed = (x: number, y: number, seed: number): number => {
  const dot = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return dot - Math.floor(dot);
};

export const noise2D = (x: number, y: number, seed: number): number => {
  // Get fractional parts
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  // Get coordinates for corners
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  // Get random values for corners
  const v00 = randomFromSeed(x0, y0, seed);
  const v10 = randomFromSeed(x1, y0, seed);
  const v01 = randomFromSeed(x0, y1, seed);
  const v11 = randomFromSeed(x1, y1, seed);

  // Smoothing function
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);

  // Interpolate
  const vx0 = v00 * (1 - sx) + v10 * sx;
  const vx1 = v01 * (1 - sx) + v11 * sx;
  return vx0 * (1 - sy) + vx1 * sy;
};
