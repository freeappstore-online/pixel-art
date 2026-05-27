/** RGBA color — null means transparent */
export type Color = { r: number; g: number; b: number; a: number } | null;

export type Tool =
  | "pencil"
  | "eraser"
  | "fill"
  | "line"
  | "rectangle"
  | "circle"
  | "eyedropper";

export type GridSize = 8 | 16 | 32 | 64;

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  pixels: (Color)[][];
}

export interface Frame {
  id: string;
  layers: Layer[];
}

export interface Project {
  gridSize: GridSize;
  frames: Frame[];
  activeFrameIndex: number;
  activeLayerIndex: number;
}

export interface GalleryItem {
  id: string;
  name: string;
  thumbnail: string; // data URL
  project: Project;
  createdAt: number;
  updatedAt: number;
}

export interface MirrorMode {
  horizontal: boolean;
  vertical: boolean;
}

export interface PalettePreset {
  name: string;
  colors: string[];
}

export type FillMode = "outline" | "filled";
