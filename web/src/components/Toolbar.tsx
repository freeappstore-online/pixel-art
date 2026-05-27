import type { FillMode, GridSize, MirrorMode, Tool } from "../lib/types";

interface Props {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  mirror: MirrorMode;
  onMirrorChange: (mirror: MirrorMode) => void;
  fillMode: FillMode;
  onFillModeChange: (mode: FillMode) => void;
  gridSize: GridSize;
  onGridSizeChange: (size: GridSize) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const TOOLS: { id: Tool; label: string; icon: string; shortcut: string }[] = [
  { id: "pencil", label: "Pencil", icon: "✏", shortcut: "P" },
  { id: "eraser", label: "Eraser", icon: "🧹", shortcut: "E" },
  { id: "fill", label: "Fill", icon: "🪣", shortcut: "F" },
  { id: "line", label: "Line", icon: "╱", shortcut: "L" },
  { id: "rectangle", label: "Rectangle", icon: "▭", shortcut: "R" },
  { id: "circle", label: "Circle", icon: "◯", shortcut: "C" },
  { id: "eyedropper", label: "Eyedropper", icon: "💧", shortcut: "I" },
];

const GRID_SIZES: GridSize[] = [8, 16, 32, 64];

export default function Toolbar({
  tool,
  onToolChange,
  showGrid,
  onShowGridChange,
  mirror,
  onMirrorChange,
  fillMode,
  onFillModeChange,
  gridSize,
  onGridSizeChange,
  zoom,
  onZoomChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: Props) {
  return (
    <div
      className="flex flex-wrap items-center gap-1 px-3 py-2"
      style={{ borderBottom: "1px solid var(--line)", background: "var(--glass)" }}
    >
      {/* Tools */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => onToolChange(t.id)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-sm cursor-pointer transition-colors"
            style={{
              background: tool === t.id ? "var(--accent)" : "transparent",
              color: tool === t.id ? "#fff" : "var(--ink)",
              border: "none",
            }}
            title={`${t.label} (${t.shortcut})`}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="w-px h-6 mx-1" style={{ background: "var(--line)" }} />

      {/* Fill mode for rect/circle */}
      {(tool === "rectangle" || tool === "circle") && (
        <>
          <button
            onClick={() => onFillModeChange(fillMode === "outline" ? "filled" : "outline")}
            className="h-7 px-2 rounded-md text-xs font-medium cursor-pointer"
            style={{
              background: fillMode === "filled" ? "var(--accent)" : "var(--panel)",
              color: fillMode === "filled" ? "#fff" : "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            {fillMode === "filled" ? "Filled" : "Outline"}
          </button>
          <div className="w-px h-6 mx-1" style={{ background: "var(--line)" }} />
        </>
      )}

      {/* Undo/Redo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="w-8 h-8 flex items-center justify-center rounded-md text-sm cursor-pointer"
        style={{
          background: "transparent",
          color: canUndo ? "var(--ink)" : "var(--muted)",
          border: "none",
          opacity: canUndo ? 1 : 0.4,
        }}
        title="Undo (Ctrl+Z)"
      >
        ↩
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="w-8 h-8 flex items-center justify-center rounded-md text-sm cursor-pointer"
        style={{
          background: "transparent",
          color: canRedo ? "var(--ink)" : "var(--muted)",
          border: "none",
          opacity: canRedo ? 1 : 0.4,
        }}
        title="Redo (Ctrl+Shift+Z)"
      >
        ↪
      </button>

      <div className="w-px h-6 mx-1" style={{ background: "var(--line)" }} />

      {/* Mirror */}
      <button
        onClick={() => onMirrorChange({ ...mirror, horizontal: !mirror.horizontal })}
        className="h-7 px-2 rounded-md text-xs font-medium cursor-pointer"
        style={{
          background: mirror.horizontal ? "var(--accent)" : "var(--panel)",
          color: mirror.horizontal ? "#fff" : "var(--ink)",
          border: "1px solid var(--line)",
        }}
        title="Mirror Horizontal"
      >
        ↔
      </button>
      <button
        onClick={() => onMirrorChange({ ...mirror, vertical: !mirror.vertical })}
        className="h-7 px-2 rounded-md text-xs font-medium cursor-pointer"
        style={{
          background: mirror.vertical ? "var(--accent)" : "var(--panel)",
          color: mirror.vertical ? "#fff" : "var(--ink)",
          border: "1px solid var(--line)",
        }}
        title="Mirror Vertical"
      >
        ↕
      </button>

      <div className="w-px h-6 mx-1" style={{ background: "var(--line)" }} />

      {/* Grid toggle */}
      <button
        onClick={() => onShowGridChange(!showGrid)}
        className="h-7 px-2 rounded-md text-xs font-medium cursor-pointer"
        style={{
          background: showGrid ? "var(--accent)" : "var(--panel)",
          color: showGrid ? "#fff" : "var(--ink)",
          border: "1px solid var(--line)",
        }}
        title="Toggle Grid"
      >
        Grid
      </button>

      <div className="w-px h-6 mx-1" style={{ background: "var(--line)" }} />

      {/* Grid size */}
      <select
        value={gridSize}
        onChange={(e) => onGridSizeChange(Number(e.target.value) as GridSize)}
        className="h-7 px-2 rounded-md text-xs font-medium cursor-pointer"
        style={{
          background: "var(--panel)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
        }}
      >
        {GRID_SIZES.map((s) => (
          <option key={s} value={s}>{s}x{s}</option>
        ))}
      </select>

      <div className="w-px h-6 mx-1" style={{ background: "var(--line)" }} />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onZoomChange(Math.max(2, zoom - 2))}
          className="w-6 h-6 flex items-center justify-center rounded text-xs cursor-pointer"
          style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
        >
          -
        </button>
        <span className="text-xs w-10 text-center" style={{ color: "var(--muted)" }}>
          {zoom}px
        </span>
        <button
          onClick={() => onZoomChange(Math.min(64, zoom + 2))}
          className="w-6 h-6 flex items-center justify-center rounded text-xs cursor-pointer"
          style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
        >
          +
        </button>
      </div>
    </div>
  );
}
