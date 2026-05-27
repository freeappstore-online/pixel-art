import { useCallback, useEffect, useRef, useState } from "react";
import type { Color, FillMode, Frame, GridSize, Layer, MirrorMode, Tool } from "../lib/types";
import { hexToColor, colorToHex } from "../lib/colors";
import { flattenFrame } from "../lib/project";
import {
  applyMirror,
  bresenhamLine,
  circleOutline,
  circleFilled,
  floodFill,
  rectangleOutline,
  rectangleFilled,
} from "../lib/drawing";

interface Props {
  frame: Frame;
  prevFrame: Frame | null;
  activeLayerIndex: number;
  gridSize: GridSize;
  tool: Tool;
  color: string;
  showGrid: boolean;
  mirror: MirrorMode;
  fillMode: FillMode;
  onionSkin: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onPixelsChanged: (layerIndex: number, pixels: (Color)[][]) => void;
  onColorPicked: (hex: string) => void;
}

export default function PixelCanvas({
  frame,
  prevFrame,
  activeLayerIndex,
  gridSize,
  tool,
  color,
  showGrid,
  mirror,
  fillMode,
  onionSkin,
  zoom,
  onZoomChange,
  onPixelsChanged,
  onColorPicked,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const [previewPoints, setPreviewPoints] = useState<[number, number][] | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  const pixelSize = zoom;
  const canvasPixelSize = gridSize * pixelSize;

  // Track space key for pan
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpaceHeld(false);
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Center offset
    const baseOffX = (rect.width - canvasPixelSize) / 2 + pan.x;
    const baseOffY = (rect.height - canvasPixelSize) / 2 + pan.y;

    // Checkerboard background for transparency
    const checkSize = Math.max(pixelSize / 2, 4);
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const px = baseOffX + x * pixelSize;
        const py = baseOffY + y * pixelSize;
        // Light check
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(px, py, pixelSize, pixelSize);
        // Dark check
        ctx.fillStyle = "#999999";
        const halfW = pixelSize / 2;
        if (halfW >= 2) {
          ctx.fillRect(px, py, checkSize, checkSize);
          ctx.fillRect(px + halfW, py + halfW, checkSize, checkSize);
        } else {
          // Too small for check pattern, show uniform gray
          ctx.fillStyle = "#bbbbbb";
          ctx.fillRect(px, py, pixelSize, pixelSize);
        }
      }
    }

    // Onion skin (previous frame ghost)
    if (onionSkin && prevFrame) {
      const prevFlat = flattenFrame(prevFrame, gridSize);
      ctx.globalAlpha = 0.25;
      for (let y = 0; y < gridSize; y++) {
        const row = prevFlat[y];
        if (!row) continue;
        for (let x = 0; x < gridSize; x++) {
          const pixel = row[x];
          if (!pixel) continue;
          ctx.fillStyle = `rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.a})`;
          ctx.fillRect(baseOffX + x * pixelSize, baseOffY + y * pixelSize, pixelSize, pixelSize);
        }
      }
      ctx.globalAlpha = 1;
    }

    // Render all visible layers
    const flat = flattenFrame(frame, gridSize);
    for (let y = 0; y < gridSize; y++) {
      const row = flat[y];
      if (!row) continue;
      for (let x = 0; x < gridSize; x++) {
        const pixel = row[x];
        if (!pixel) continue;
        ctx.fillStyle = `rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.a})`;
        ctx.fillRect(baseOffX + x * pixelSize, baseOffY + y * pixelSize, pixelSize, pixelSize);
      }
    }

    // Preview points (for line/rect/circle tools while dragging)
    if (previewPoints) {
      const previewColor = hexToColor(color);
      if (previewColor) {
        ctx.globalAlpha = 0.6;
        for (const [x, y] of previewPoints) {
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            ctx.fillStyle = `rgba(${previewColor.r},${previewColor.g},${previewColor.b},${previewColor.a})`;
            ctx.fillRect(baseOffX + x * pixelSize, baseOffY + y * pixelSize, pixelSize, pixelSize);
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    // Grid lines
    if (showGrid && pixelSize >= 4) {
      ctx.strokeStyle = "rgba(128,128,128,0.3)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        const x = baseOffX + i * pixelSize;
        ctx.beginPath();
        ctx.moveTo(x, baseOffY);
        ctx.lineTo(x, baseOffY + canvasPixelSize);
        ctx.stroke();

        const y = baseOffY + i * pixelSize;
        ctx.beginPath();
        ctx.moveTo(baseOffX, y);
        ctx.lineTo(baseOffX + canvasPixelSize, y);
        ctx.stroke();
      }
    }

    // Canvas border
    ctx.strokeStyle = "var(--line-strong)";
    ctx.lineWidth = 1;
    ctx.strokeRect(baseOffX - 0.5, baseOffY - 0.5, canvasPixelSize + 1, canvasPixelSize + 1);
  }, [frame, prevFrame, gridSize, pixelSize, canvasPixelSize, pan, showGrid, previewPoints, color, onionSkin]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  const screenToGrid = useCallback(
    (clientX: number, clientY: number): [number, number] | null => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const baseOffX = (rect.width - canvasPixelSize) / 2 + pan.x;
      const baseOffY = (rect.height - canvasPixelSize) / 2 + pan.y;
      const gx = Math.floor((clientX - rect.left - baseOffX) / pixelSize);
      const gy = Math.floor((clientY - rect.top - baseOffY) / pixelSize);
      if (gx < 0 || gx >= gridSize || gy < 0 || gy >= gridSize) return null;
      return [gx, gy];
    },
    [canvasPixelSize, gridSize, pan, pixelSize],
  );

  const setPixels = useCallback(
    (layer: Layer, points: [number, number][], c: Color): (Color)[][] => {
      const newPixels = layer.pixels.map((row) => [...row]);
      for (const [x, y] of points) {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
          const row = newPixels[y];
          if (row) row[x] = c;
        }
      }
      return newPixels;
    },
    [gridSize],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Middle mouse or space+click = pan
      if (e.button === 1 || (spaceHeld && e.button === 0)) {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      if (e.button !== 0) return;

      const pos = screenToGrid(e.clientX, e.clientY);
      if (!pos) return;

      const layer = frame.layers[activeLayerIndex];
      if (!layer || !layer.visible) return;

      const [gx, gy] = pos;
      setIsDrawing(true);
      drawStart.current = { x: gx, y: gy };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const drawColor = tool === "eraser" ? null : hexToColor(color);

      if (tool === "pencil" || tool === "eraser") {
        const points = applyMirror([[gx, gy]], gridSize, mirror.horizontal, mirror.vertical);
        const newPixels = setPixels(layer, points, drawColor);
        onPixelsChanged(activeLayerIndex, newPixels);
      } else if (tool === "fill") {
        const fillPoints = floodFill(layer.pixels, gx, gy, drawColor, gridSize);
        const mirroredPoints = applyMirror(fillPoints, gridSize, mirror.horizontal, mirror.vertical);
        const newPixels = setPixels(layer, mirroredPoints, drawColor);
        onPixelsChanged(activeLayerIndex, newPixels);
      } else if (tool === "eyedropper") {
        const flat = flattenFrame(frame, gridSize);
        const pixel = flat[gy]?.[gx];
        if (pixel) {
          onColorPicked(colorToHex(pixel));
        }
      }
      // line/rect/circle: just record start, draw on release
    },
    [
      tool, color, frame, activeLayerIndex, gridSize, mirror,
      pan, spaceHeld, screenToGrid, setPixels, onPixelsChanged, onColorPicked,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning) {
        setPan({
          x: panStart.current.panX + (e.clientX - panStart.current.x),
          y: panStart.current.panY + (e.clientY - panStart.current.y),
        });
        return;
      }

      if (!isDrawing || !drawStart.current) return;

      const pos = screenToGrid(e.clientX, e.clientY);
      if (!pos) return;

      const layer = frame.layers[activeLayerIndex];
      if (!layer || !layer.visible) return;

      const [gx, gy] = pos;
      const drawColor = tool === "eraser" ? null : hexToColor(color);

      if (tool === "pencil" || tool === "eraser") {
        // Draw line from last point to current for smooth strokes
        const lastX = drawStart.current.x;
        const lastY = drawStart.current.y;
        const linePoints = bresenhamLine(lastX, lastY, gx, gy);
        const mirroredPoints = applyMirror(linePoints, gridSize, mirror.horizontal, mirror.vertical);
        const newPixels = setPixels(layer, mirroredPoints, drawColor);
        onPixelsChanged(activeLayerIndex, newPixels);
        drawStart.current = { x: gx, y: gy };
      } else if (tool === "line") {
        const points = bresenhamLine(drawStart.current.x, drawStart.current.y, gx, gy);
        setPreviewPoints(applyMirror(points, gridSize, mirror.horizontal, mirror.vertical));
      } else if (tool === "rectangle") {
        const points = fillMode === "filled"
          ? rectangleFilled(drawStart.current.x, drawStart.current.y, gx, gy)
          : rectangleOutline(drawStart.current.x, drawStart.current.y, gx, gy);
        setPreviewPoints(applyMirror(points, gridSize, mirror.horizontal, mirror.vertical));
      } else if (tool === "circle") {
        const cx = Math.round((drawStart.current.x + gx) / 2);
        const cy = Math.round((drawStart.current.y + gy) / 2);
        const rx = Math.abs(gx - drawStart.current.x) >> 1;
        const ry = Math.abs(gy - drawStart.current.y) >> 1;
        const points = fillMode === "filled"
          ? circleFilled(cx, cy, rx, ry)
          : circleOutline(cx, cy, rx, ry);
        setPreviewPoints(applyMirror(points, gridSize, mirror.horizontal, mirror.vertical));
      }
    },
    [
      isPanning, isDrawing, tool, color, frame, activeLayerIndex,
      gridSize, mirror, fillMode, screenToGrid, setPixels, onPixelsChanged,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning) {
        setIsPanning(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        return;
      }

      if (!isDrawing || !drawStart.current) {
        setIsDrawing(false);
        return;
      }

      const pos = screenToGrid(e.clientX, e.clientY);
      if (pos && (tool === "line" || tool === "rectangle" || tool === "circle")) {
        const [gx, gy] = pos;
        const layer = frame.layers[activeLayerIndex];
        if (layer && layer.visible) {
          const drawColor = hexToColor(color);
          let points: [number, number][] = [];

          if (tool === "line") {
            points = bresenhamLine(drawStart.current.x, drawStart.current.y, gx, gy);
          } else if (tool === "rectangle") {
            points = fillMode === "filled"
              ? rectangleFilled(drawStart.current.x, drawStart.current.y, gx, gy)
              : rectangleOutline(drawStart.current.x, drawStart.current.y, gx, gy);
          } else if (tool === "circle") {
            const cx = Math.round((drawStart.current.x + gx) / 2);
            const cy = Math.round((drawStart.current.y + gy) / 2);
            const rx = Math.abs(gx - drawStart.current.x) >> 1;
            const ry = Math.abs(gy - drawStart.current.y) >> 1;
            points = fillMode === "filled"
              ? circleFilled(cx, cy, rx, ry)
              : circleOutline(cx, cy, rx, ry);
          }

          const mirroredPoints = applyMirror(points, gridSize, mirror.horizontal, mirror.vertical);
          const newPixels = setPixels(layer, mirroredPoints, drawColor);
          onPixelsChanged(activeLayerIndex, newPixels);
        }
      }

      setIsDrawing(false);
      setPreviewPoints(null);
      drawStart.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [
      isPanning, isDrawing, tool, color, frame, activeLayerIndex,
      gridSize, mirror, fillMode, screenToGrid, setPixels, onPixelsChanged,
    ],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -2 : 2;
      const newZoom = Math.max(2, Math.min(64, zoom + delta));
      onZoomChange(newZoom);
    },
    [zoom, onZoomChange],
  );

  const cursorStyle = spaceHeld || isPanning
    ? "grab"
    : tool === "eyedropper"
      ? "crosshair"
      : "default";

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden no-select"
      style={{ cursor: cursorStyle, background: "var(--panel)" }}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
