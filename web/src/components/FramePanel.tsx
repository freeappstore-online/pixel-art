import { useEffect, useRef } from "react";
import type { Frame, GridSize } from "../lib/types";
import { flattenFrame } from "../lib/project";

interface Props {
  frames: Frame[];
  activeIndex: number;
  gridSize: GridSize;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
}

function FrameThumbnail({ frame, gridSize, isActive, onClick }: {
  frame: Frame;
  gridSize: GridSize;
  isActive: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 48;
    canvas.width = size;
    canvas.height = size;
    const pixelSize = size / gridSize;

    ctx.clearRect(0, 0, size, size);

    // Checkerboard
    ctx.fillStyle = "#cccccc";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#999999";
    const checkSize = Math.max(pixelSize / 2, 2);
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * pixelSize, y * pixelSize, checkSize, checkSize);
          ctx.fillRect(x * pixelSize + pixelSize / 2, y * pixelSize + pixelSize / 2, checkSize, checkSize);
        }
      }
    }

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
  }, [frame, gridSize]);

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 rounded-md overflow-hidden cursor-pointer"
      style={{
        border: isActive ? "2px solid var(--accent)" : "2px solid var(--line)",
        width: 52,
        height: 52,
        padding: 0,
        background: "transparent",
      }}
    >
      <canvas ref={canvasRef} className="block" style={{ width: 48, height: 48 }} />
    </button>
  );
}

export default function FramePanel({
  frames,
  activeIndex,
  gridSize,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          Frames ({frames.length}/16)
        </h3>
        <button
          onClick={onAddFrame}
          disabled={frames.length >= 16}
          className="text-xs px-2 py-0.5 rounded cursor-pointer"
          style={{
            background: frames.length >= 16 ? "var(--panel)" : "var(--accent)",
            color: frames.length >= 16 ? "var(--muted)" : "#fff",
            border: "none",
            opacity: frames.length >= 16 ? 0.5 : 1,
          }}
        >
          + Frame
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {frames.map((frame, i) => (
          <div key={frame.id} className="flex flex-col items-center gap-0.5">
            <FrameThumbnail
              frame={frame}
              gridSize={gridSize}
              isActive={i === activeIndex}
              onClick={() => onSelectFrame(i)}
            />
            <div className="flex gap-0.5">
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {i + 1}
              </span>
              <button
                onClick={() => onDuplicateFrame(i)}
                className="text-xs cursor-pointer"
                style={{ background: "transparent", border: "none", color: "var(--muted)" }}
                title="Duplicate"
              >
                ⧉
              </button>
              {frames.length > 1 && (
                <button
                  onClick={() => onDeleteFrame(i)}
                  className="text-xs cursor-pointer"
                  style={{ background: "transparent", border: "none", color: "var(--muted)" }}
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
