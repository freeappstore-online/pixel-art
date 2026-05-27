import { useCallback, useEffect, useRef, useState } from "react";
import type { Frame, GridSize } from "../lib/types";
import { flattenFrame } from "../lib/project";

interface Props {
  frames: Frame[];
  gridSize: GridSize;
  onionSkin: boolean;
  onOnionSkinChange: (enabled: boolean) => void;
}

export default function AnimationPreview({
  frames,
  gridSize,
  onionSkin,
  onOnionSkinChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(8);
  const [currentFrame, setCurrentFrame] = useState(0);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 96;
    canvas.width = size;
    canvas.height = size;
    const pixelSize = size / gridSize;

    ctx.clearRect(0, 0, size, size);

    // Checkerboard
    ctx.fillStyle = "#cccccc";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#999999";
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if ((x + y) % 2 === 0) {
          const ps2 = pixelSize / 2;
          ctx.fillRect(x * pixelSize, y * pixelSize, ps2, ps2);
          ctx.fillRect(x * pixelSize + ps2, y * pixelSize + ps2, ps2, ps2);
        }
      }
    }

    const frame = frames[frameIndex];
    if (!frame) return;
    const flat = flattenFrame(frame, gridSize);
    for (let y = 0; y < gridSize; y++) {
      const row = flat[y];
      if (!row) continue;
      for (let x = 0; x < gridSize; x++) {
        const pixel = row[x];
        if (!pixel) continue;
        ctx.fillStyle = `rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.a})`;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }, [frames, gridSize]);

  useEffect(() => {
    if (!isPlaying) {
      renderFrame(currentFrame);
      return;
    }

    const interval = 1000 / fps;
    let localFrame = currentFrame;

    const animate = (time: number) => {
      if (time - lastTimeRef.current >= interval) {
        lastTimeRef.current = time;
        localFrame = (localFrame + 1) % frames.length;
        setCurrentFrame(localFrame);
        renderFrame(localFrame);
      }
      animRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, fps, frames.length, renderFrame, currentFrame]);

  // Re-render when frames change (while not playing)
  useEffect(() => {
    if (!isPlaying) {
      renderFrame(currentFrame);
    }
  }, [frames, isPlaying, currentFrame, renderFrame]);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
        Animation
      </h3>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          className="rounded-md"
          style={{
            width: 96,
            height: 96,
            border: "1px solid var(--line)",
            imageRendering: "pixelated",
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-7 px-3 rounded-md text-xs font-medium cursor-pointer"
          style={{
            background: isPlaying ? "var(--error)" : "var(--accent)",
            color: "#fff",
            border: "none",
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      <div>
        <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>
          FPS: {fps}
        </label>
        <input
          type="range"
          min={1}
          max={24}
          value={fps}
          onChange={(e) => setFps(Number(e.target.value))}
          className="w-full h-2 rounded appearance-none cursor-pointer"
          style={{ accentColor: "var(--accent)" }}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={onionSkin}
          onChange={(e) => onOnionSkinChange(e.target.checked)}
          className="rounded"
          style={{ accentColor: "var(--accent)" }}
        />
        <span className="text-xs" style={{ color: "var(--ink)" }}>Onion Skin</span>
      </label>
    </div>
  );
}
