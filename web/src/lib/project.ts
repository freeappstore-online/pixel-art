import type { Color, Frame, GridSize, Layer, Project } from "./types";

let idCounter = 0;
function nextId(): string {
  return `id_${Date.now()}_${idCounter++}`;
}

export function createEmptyGrid(size: GridSize): (Color)[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
}

export function createLayer(size: GridSize, name: string): Layer {
  return {
    id: nextId(),
    name,
    visible: true,
    opacity: 1,
    pixels: createEmptyGrid(size),
  };
}

export function createFrame(size: GridSize): Frame {
  return {
    id: nextId(),
    layers: [createLayer(size, "Layer 1")],
  };
}

export function createProject(size: GridSize): Project {
  return {
    gridSize: size,
    frames: [createFrame(size)],
    activeFrameIndex: 0,
    activeLayerIndex: 0,
  };
}

export function cloneLayer(layer: Layer): Layer {
  return {
    ...layer,
    id: nextId(),
    pixels: layer.pixels.map((row) => [...row]),
  };
}

export function cloneFrame(frame: Frame): Frame {
  return {
    id: nextId(),
    layers: frame.layers.map(cloneLayer),
  };
}

export function deepCloneProject(project: Project): Project {
  return {
    ...project,
    frames: project.frames.map(cloneFrame),
  };
}

export function getActiveFrame(project: Project): Frame | undefined {
  return project.frames[project.activeFrameIndex];
}

export function getActiveLayer(project: Project): Layer | undefined {
  const frame = getActiveFrame(project);
  if (!frame) return undefined;
  return frame.layers[project.activeLayerIndex];
}

/** Flatten all visible layers of a frame into one pixel grid */
export function flattenFrame(frame: Frame, gridSize: GridSize): (Color)[][] {
  const result: (Color)[][] = createEmptyGrid(gridSize);
  for (const layer of frame.layers) {
    if (!layer.visible) continue;
    for (let y = 0; y < gridSize; y++) {
      const row = layer.pixels[y];
      if (!row) continue;
      for (let x = 0; x < gridSize; x++) {
        const pixel = row[x];
        if (!pixel) continue;
        const existing = result[y]?.[x];
        const resultRow = result[y];
        if (!resultRow) continue;
        if (!existing) {
          resultRow[x] = { ...pixel, a: pixel.a * layer.opacity };
        } else {
          const srcA = pixel.a * layer.opacity;
          const outA = srcA + existing.a * (1 - srcA);
          if (outA === 0) {
            resultRow[x] = null;
          } else {
            resultRow[x] = {
              r: Math.round((pixel.r * srcA + existing.r * existing.a * (1 - srcA)) / outA),
              g: Math.round((pixel.g * srcA + existing.g * existing.a * (1 - srcA)) / outA),
              b: Math.round((pixel.b * srcA + existing.b * existing.a * (1 - srcA)) / outA),
              a: outA,
            };
          }
        }
      }
    }
  }
  return result;
}
