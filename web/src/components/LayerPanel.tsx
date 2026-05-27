import type { Layer } from "../lib/types";

interface Props {
  layers: Layer[];
  activeIndex: number;
  onSelectLayer: (index: number) => void;
  onToggleVisibility: (index: number) => void;
  onOpacityChange: (index: number, opacity: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onAddLayer: () => void;
  onDeleteLayer: (index: number) => void;
  onMergeLayers: (index: number) => void;
}

export default function LayerPanel({
  layers,
  activeIndex,
  onSelectLayer,
  onToggleVisibility,
  onOpacityChange,
  onMoveUp,
  onMoveDown,
  onAddLayer,
  onDeleteLayer,
  onMergeLayers,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          Layers
        </h3>
        <button
          onClick={onAddLayer}
          disabled={layers.length >= 4}
          className="text-xs px-2 py-0.5 rounded cursor-pointer"
          style={{
            background: layers.length >= 4 ? "var(--panel)" : "var(--accent)",
            color: layers.length >= 4 ? "var(--muted)" : "#fff",
            border: "none",
            opacity: layers.length >= 4 ? 0.5 : 1,
          }}
        >
          + Add
        </button>
      </div>

      <div className="space-y-1">
        {layers.map((layer, i) => (
          <div
            key={layer.id}
            onClick={() => onSelectLayer(i)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer"
            style={{
              background: i === activeIndex ? "var(--accent)" : "var(--panel)",
              color: i === activeIndex ? "#fff" : "var(--ink)",
              border: "1px solid",
              borderColor: i === activeIndex ? "var(--accent)" : "var(--line)",
            }}
          >
            {/* Visibility toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(i); }}
              className="w-5 h-5 flex items-center justify-center rounded text-xs cursor-pointer"
              style={{ background: "transparent", border: "none", color: "inherit" }}
              title={layer.visible ? "Hide" : "Show"}
            >
              {layer.visible ? "👁" : "—"}
            </button>

            <span className="flex-1 text-xs font-medium truncate">
              {layer.name}
            </span>

            {/* Layer controls */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); onMoveUp(i); }}
                disabled={i === 0}
                className="w-4 h-4 flex items-center justify-center text-xs cursor-pointer"
                style={{ background: "transparent", border: "none", color: "inherit", opacity: i === 0 ? 0.3 : 1 }}
                title="Move up"
              >
                ▲
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onMoveDown(i); }}
                disabled={i === layers.length - 1}
                className="w-4 h-4 flex items-center justify-center text-xs cursor-pointer"
                style={{ background: "transparent", border: "none", color: "inherit", opacity: i === layers.length - 1 ? 0.3 : 1 }}
                title="Move down"
              >
                ▼
              </button>
              {layers.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteLayer(i); }}
                  className="w-4 h-4 flex items-center justify-center text-xs cursor-pointer"
                  style={{ background: "transparent", border: "none", color: "inherit" }}
                  title="Delete layer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Opacity slider for active layer */}
      {layers[activeIndex] && (
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>
            Opacity: {Math.round((layers[activeIndex]?.opacity ?? 1) * 100)}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((layers[activeIndex]?.opacity ?? 1) * 100)}
            onChange={(e) => onOpacityChange(activeIndex, Number(e.target.value) / 100)}
            className="w-full h-2 rounded appearance-none cursor-pointer"
            style={{ accentColor: "var(--accent)" }}
          />
        </div>
      )}

      {/* Merge down */}
      {activeIndex < layers.length - 1 && layers.length > 1 && (
        <button
          onClick={() => onMergeLayers(activeIndex)}
          className="w-full text-xs px-2 py-1 rounded cursor-pointer"
          style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
        >
          Merge Down
        </button>
      )}
    </div>
  );
}
