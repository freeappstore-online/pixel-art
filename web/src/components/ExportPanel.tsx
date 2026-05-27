import { useState } from "react";
import type { Frame, GridSize } from "../lib/types";
import { exportFrameAsPng, exportSpritesheet, exportAnimatedGif, copyToClipboard } from "../lib/export";

interface Props {
  frames: Frame[];
  activeFrameIndex: number;
  gridSize: GridSize;
  fps: number;
}

export default function ExportPanel({ frames, activeFrameIndex, gridSize, fps }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = async () => {
    try {
      const frame = frames[activeFrameIndex];
      if (!frame) return;
      const blob = await exportFrameAsPng(frame, gridSize, 512);
      downloadBlob(blob, `pixel-art-${gridSize}x${gridSize}.png`);
      setStatus("PNG exported!");
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus("Export failed");
      console.error(err);
    }
  };

  const handleExportSpritesheet = async () => {
    try {
      const blob = await exportSpritesheet(frames, gridSize, 4);
      downloadBlob(blob, `pixel-art-spritesheet.png`);
      setStatus("Spritesheet exported!");
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus("Export failed");
      console.error(err);
    }
  };

  const handleExportGif = async () => {
    try {
      const blob = await exportAnimatedGif(frames, gridSize, fps, 4);
      downloadBlob(blob, `pixel-art-animation.gif`);
      setStatus("GIF exported!");
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus("Export failed");
      console.error(err);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      const frame = frames[activeFrameIndex];
      if (!frame) return;
      await copyToClipboard(frame, gridSize, 8);
      setStatus("Copied to clipboard!");
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus("Copy failed (requires HTTPS)");
      console.error(err);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
        Export
      </h3>

      <div className="space-y-1">
        <button
          onClick={handleExportPng}
          className="w-full text-xs px-2 py-1.5 rounded-md cursor-pointer text-left font-medium"
          style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
        >
          Save as PNG (512px)
        </button>

        {frames.length > 1 && (
          <>
            <button
              onClick={handleExportSpritesheet}
              className="w-full text-xs px-2 py-1.5 rounded-md cursor-pointer text-left font-medium"
              style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
            >
              Export Spritesheet (PNG)
            </button>
            <button
              onClick={handleExportGif}
              className="w-full text-xs px-2 py-1.5 rounded-md cursor-pointer text-left font-medium"
              style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
            >
              Export Animated GIF
            </button>
          </>
        )}

        <button
          onClick={handleCopyClipboard}
          className="w-full text-xs px-2 py-1.5 rounded-md cursor-pointer text-left font-medium"
          style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
        >
          Copy to Clipboard
        </button>
      </div>

      {status && (
        <p className="text-xs font-medium" style={{ color: "var(--success)" }}>
          {status}
        </p>
      )}
    </div>
  );
}
