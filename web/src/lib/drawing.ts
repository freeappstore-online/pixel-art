import type { Color, GridSize } from "./types";
import { colorsEqual } from "./colors";

/** Get all points on a Bresenham line from (x0,y0) to (x1,y1) */
export function bresenhamLine(
  x0: number, y0: number,
  x1: number, y1: number,
): [number, number][] {
  const points: [number, number][] = [];
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let cx = x0;
  let cy = y0;
  for (;;) {
    points.push([cx, cy]);
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; cx += sx; }
    if (e2 <= dx) { err += dx; cy += sy; }
  }
  return points;
}

/** Get outline points for a rectangle */
export function rectangleOutline(
  x0: number, y0: number,
  x1: number, y1: number,
): [number, number][] {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  const points: [number, number][] = [];
  for (let x = minX; x <= maxX; x++) {
    points.push([x, minY]);
    points.push([x, maxY]);
  }
  for (let y = minY + 1; y < maxY; y++) {
    points.push([minX, y]);
    points.push([maxX, y]);
  }
  return points;
}

/** Get filled rectangle points */
export function rectangleFilled(
  x0: number, y0: number,
  x1: number, y1: number,
): [number, number][] {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  const points: [number, number][] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      points.push([x, y]);
    }
  }
  return points;
}

/** Get outline points for a midpoint circle */
export function circleOutline(
  cx: number, cy: number,
  rx: number, ry: number,
): [number, number][] {
  const points = new Set<string>();
  const add = (x: number, y: number) => points.add(`${x},${y}`);
  // Bresenham ellipse
  let x = 0;
  let y = ry;
  let rx2 = rx * rx;
  let ry2 = ry * ry;
  let px = 0;
  let py = 2 * rx2 * y;
  add(cx + x, cy + y); add(cx - x, cy + y);
  add(cx + x, cy - y); add(cx - x, cy - y);
  // Region 1
  let p = ry2 - rx2 * ry + 0.25 * rx2;
  while (px < py) {
    x++;
    px += 2 * ry2;
    if (p < 0) {
      p += ry2 + px;
    } else {
      y--;
      py -= 2 * rx2;
      p += ry2 + px - py;
    }
    add(cx + x, cy + y); add(cx - x, cy + y);
    add(cx + x, cy - y); add(cx - x, cy - y);
  }
  // Region 2
  p = ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2;
  while (y > 0) {
    y--;
    py -= 2 * rx2;
    if (p > 0) {
      p += rx2 - py;
    } else {
      x++;
      px += 2 * ry2;
      p += rx2 - py + px;
    }
    add(cx + x, cy + y); add(cx - x, cy + y);
    add(cx + x, cy - y); add(cx - x, cy - y);
  }
  return [...points].map((s) => {
    const parts = s.split(",");
    return [Number(parts[0]), Number(parts[1])] as [number, number];
  });
}

/** Get filled circle/ellipse points */
export function circleFilled(
  cx: number, cy: number,
  rx: number, ry: number,
): [number, number][] {
  const points: [number, number][] = [];
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if (rx > 0 && ry > 0) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
          points.push([cx + x, cy + y]);
        }
      } else if (rx === 0 && ry === 0) {
        points.push([cx, cy]);
      }
    }
  }
  return points;
}

/** Flood fill algorithm */
export function floodFill(
  pixels: (Color)[][],
  startX: number,
  startY: number,
  fillColor: Color,
  gridSize: GridSize,
): [number, number][] {
  const targetColor = pixels[startY]?.[startX] ?? null;
  if (colorsEqual(targetColor, fillColor)) return [];
  const filled: [number, number][] = [];
  const visited = new Set<string>();
  const stack: [number, number][] = [[startX, startY]];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const [x, y] = current;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
    const currentColor = pixels[y]?.[x] ?? null;
    if (!colorsEqual(currentColor, targetColor)) continue;
    visited.add(key);
    filled.push([x, y]);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return filled;
}

/** Apply mirror to a set of points */
export function applyMirror(
  points: [number, number][],
  gridSize: GridSize,
  horizontal: boolean,
  vertical: boolean,
): [number, number][] {
  const allPoints = new Set<string>();
  const result: [number, number][] = [];
  const addPoint = (x: number, y: number) => {
    const key = `${x},${y}`;
    if (!allPoints.has(key) && x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      allPoints.add(key);
      result.push([x, y]);
    }
  };
  for (const [x, y] of points) {
    addPoint(x, y);
    if (horizontal) addPoint(gridSize - 1 - x, y);
    if (vertical) addPoint(x, gridSize - 1 - y);
    if (horizontal && vertical) addPoint(gridSize - 1 - x, gridSize - 1 - y);
  }
  return result;
}
