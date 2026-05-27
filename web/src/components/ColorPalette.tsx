import { useState } from "react";
import { DEFAULT_PALETTE, PALETTE_PRESETS } from "../lib/palettes";
import { hexToHsl, hslToHex } from "../lib/colors";
import { loadCustomPalettes, saveCustomPalettes, saveRecentColors } from "../lib/storage";

interface Props {
  color: string;
  onColorChange: (hex: string) => void;
  recentColors: string[];
  onRecentColorsChange: (colors: string[]) => void;
}

export default function ColorPalette({
  color,
  onColorChange,
  recentColors,
  onRecentColorsChange,
}: Props) {
  const [activePalette, setActivePalette] = useState<string>("Default");
  const [customPalettes, setCustomPalettes] = useState(() => loadCustomPalettes());
  const [showPicker, setShowPicker] = useState(false);
  const [hexInput, setHexInput] = useState(color);
  const hsl = hexToHsl(color);
  const [hue, setHue] = useState(hsl.h);
  const [sat, setSat] = useState(hsl.s);
  const [lit, setLit] = useState(hsl.l);

  const getPaletteColors = (): string[] => {
    if (activePalette === "Default") return DEFAULT_PALETTE;
    const preset = PALETTE_PRESETS.find((p) => p.name === activePalette);
    if (preset) return preset.colors;
    const custom = customPalettes.find((p) => p.name === activePalette);
    if (custom) return custom.colors;
    return DEFAULT_PALETTE;
  };

  const selectColor = (hex: string) => {
    onColorChange(hex);
    setHexInput(hex);
    const h = hexToHsl(hex);
    setHue(h.h);
    setSat(h.s);
    setLit(h.l);

    // Add to recent
    const updated = [hex, ...recentColors.filter((c) => c !== hex)].slice(0, 8);
    onRecentColorsChange(updated);
    saveRecentColors(updated);
  };

  const handleHslChange = (h: number, s: number, l: number) => {
    setHue(h);
    setSat(s);
    setLit(l);
    const hex = hslToHex(h, s, l);
    onColorChange(hex);
    setHexInput(hex);
  };

  const handleHexSubmit = () => {
    const clean = hexInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      selectColor(clean);
    }
  };

  const handleSaveCustomPalette = () => {
    const name = prompt("Palette name:");
    if (!name) return;
    const newPalette = { name, colors: getPaletteColors() };
    const updated = [...customPalettes, newPalette];
    setCustomPalettes(updated);
    saveCustomPalettes(updated);
    setActivePalette(name);
  };

  const paletteColors = getPaletteColors();
  const allPaletteNames = ["Default", ...PALETTE_PRESETS.map((p) => p.name), ...customPalettes.map((p) => p.name)];

  return (
    <div className="space-y-2">
      {/* Current color display */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md border"
          style={{ background: color, borderColor: "var(--line-strong)" }}
        />
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs font-medium px-2 py-1 rounded cursor-pointer"
          style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
        >
          {showPicker ? "Close" : "Custom"}
        </button>
      </div>

      {/* Custom color picker */}
      {showPicker && (
        <div className="space-y-2 p-2 rounded-lg" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Hue ({hue})</label>
            <input
              type="range"
              min={0}
              max={360}
              value={hue}
              onChange={(e) => handleHslChange(Number(e.target.value), sat, lit)}
              className="w-full h-2 rounded appearance-none cursor-pointer"
              style={{ accentColor: "var(--accent)" }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Saturation ({sat}%)</label>
            <input
              type="range"
              min={0}
              max={100}
              value={sat}
              onChange={(e) => handleHslChange(hue, Number(e.target.value), lit)}
              className="w-full h-2 rounded appearance-none cursor-pointer"
              style={{ accentColor: "var(--accent)" }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Lightness ({lit}%)</label>
            <input
              type="range"
              min={0}
              max={100}
              value={lit}
              onChange={(e) => handleHslChange(hue, sat, Number(e.target.value))}
              className="w-full h-2 rounded appearance-none cursor-pointer"
              style={{ accentColor: "var(--accent)" }}
            />
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={handleHexSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleHexSubmit()}
              className="flex-1 h-7 px-2 rounded text-xs font-mono"
              style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }}
              placeholder="#000000"
            />
          </div>
        </div>
      )}

      {/* Palette selector */}
      <div className="flex items-center gap-1 flex-wrap">
        {allPaletteNames.map((name) => (
          <button
            key={name}
            onClick={() => setActivePalette(name)}
            className="text-xs px-2 py-0.5 rounded cursor-pointer"
            style={{
              background: activePalette === name ? "var(--accent)" : "var(--panel)",
              color: activePalette === name ? "#fff" : "var(--muted)",
              border: "1px solid var(--line)",
            }}
          >
            {name}
          </button>
        ))}
        <button
          onClick={handleSaveCustomPalette}
          className="text-xs px-2 py-0.5 rounded cursor-pointer"
          style={{ background: "var(--panel)", color: "var(--muted)", border: "1px solid var(--line)" }}
          title="Save current palette as custom"
        >
          +
        </button>
      </div>

      {/* Palette grid */}
      <div className="grid grid-cols-8 gap-1">
        {paletteColors.map((c, i) => (
          <button
            key={`${c}-${i}`}
            onClick={() => selectColor(c)}
            className="w-6 h-6 rounded cursor-pointer"
            style={{
              background: c,
              border: c === color ? "2px solid var(--accent)" : "1px solid var(--line)",
              outline: c === color ? "1px solid var(--paper)" : "none",
            }}
            title={c}
          />
        ))}
      </div>

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Recent</p>
          <div className="flex gap-1">
            {recentColors.map((c, i) => (
              <button
                key={`recent-${c}-${i}`}
                onClick={() => selectColor(c)}
                className="w-5 h-5 rounded cursor-pointer"
                style={{
                  background: c,
                  border: c === color ? "2px solid var(--accent)" : "1px solid var(--line)",
                }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
