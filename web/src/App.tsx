import { useCallback, useMemo, useState } from "react";
import type { Color, FillMode, GridSize, MirrorMode, Project, Tool } from "./lib/types";
import { createProject, createLayer, createFrame, cloneFrame, deepCloneProject, flattenFrame } from "./lib/project";
import { loadGallery, loadRecentColors, saveToGallery } from "./lib/storage";
import { generateThumbnail } from "./lib/export";
import { useHistory } from "./hooks/useHistory";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import PixelCanvas from "./components/PixelCanvas";
import Toolbar from "./components/Toolbar";
import ColorPalette from "./components/ColorPalette";
import LayerPanel from "./components/LayerPanel";
import FramePanel from "./components/FramePanel";
import AnimationPreview from "./components/AnimationPreview";
import ExportPanel from "./components/ExportPanel";
import Gallery from "./components/Gallery";

export default function App() {
  const { project, pushState, undo, redo, canUndo, canRedo, replaceProject } = useHistory(createProject(16));
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#000000");
  const [showGrid, setShowGrid] = useState(true);
  const [mirror, setMirror] = useState<MirrorMode>({ horizontal: false, vertical: false });
  const [fillMode, setFillMode] = useState<FillMode>("outline");
  const [onionSkin, setOnionSkin] = useState(false);
  const [zoom, setZoom] = useState(16);
  const [recentColors, setRecentColors] = useState<string[]>(() => loadRecentColors());
  const [showGallery, setShowGallery] = useState(false);
  const [gallery, setGallery] = useState(() => loadGallery());
  const [projectName, setProjectName] = useState("Untitled");
  const [galleryId, setGalleryId] = useState<string | undefined>(undefined);
  const [sidebarTab, setSidebarTab] = useState<"tools" | "frames">("tools");
  const [animFps] = useState(8);

  const activeFrame = project.frames[project.activeFrameIndex];
  const prevFrame = project.activeFrameIndex > 0
    ? project.frames[project.activeFrameIndex - 1] ?? null
    : null;
  const handlePixelsChanged = useCallback(
    (layerIndex: number, pixels: (Color)[][]) => {
      const newProject = deepCloneProject(project);
      const frame = newProject.frames[newProject.activeFrameIndex];
      if (!frame) return;
      const layer = frame.layers[layerIndex];
      if (!layer) return;
      layer.pixels = pixels;
      pushState(newProject);
    },
    [project, pushState],
  );

  const handleColorPicked = useCallback((hex: string) => {
    setColor(hex);
    setTool("pencil");
  }, []);

  // Layer operations
  const handleAddLayer = useCallback(() => {
    const frame = project.frames[project.activeFrameIndex];
    if (!frame || frame.layers.length >= 4) return;
    const newProject = deepCloneProject(project);
    const newFrame = newProject.frames[newProject.activeFrameIndex];
    if (!newFrame) return;
    const name = `Layer ${newFrame.layers.length + 1}`;
    newFrame.layers.unshift(createLayer(project.gridSize, name));
    newProject.activeLayerIndex = 0;
    pushState(newProject);
  }, [project, pushState]);

  const handleDeleteLayer = useCallback(
    (index: number) => {
      const frame = project.frames[project.activeFrameIndex];
      if (!frame || frame.layers.length <= 1) return;
      const newProject = deepCloneProject(project);
      const newFrame = newProject.frames[newProject.activeFrameIndex];
      if (!newFrame) return;
      newFrame.layers.splice(index, 1);
      if (newProject.activeLayerIndex >= newFrame.layers.length) {
        newProject.activeLayerIndex = newFrame.layers.length - 1;
      }
      pushState(newProject);
    },
    [project, pushState],
  );

  const handleToggleLayerVisibility = useCallback(
    (index: number) => {
      const newProject = deepCloneProject(project);
      const frame = newProject.frames[newProject.activeFrameIndex];
      const layer = frame?.layers[index];
      if (!layer) return;
      layer.visible = !layer.visible;
      pushState(newProject);
    },
    [project, pushState],
  );

  const handleLayerOpacityChange = useCallback(
    (index: number, opacity: number) => {
      const newProject = deepCloneProject(project);
      const frame = newProject.frames[newProject.activeFrameIndex];
      const layer = frame?.layers[index];
      if (!layer) return;
      layer.opacity = opacity;
      pushState(newProject);
    },
    [project, pushState],
  );

  const handleMoveLayerUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newProject = deepCloneProject(project);
      const frame = newProject.frames[newProject.activeFrameIndex];
      if (!frame) return;
      const temp = frame.layers[index - 1];
      const current = frame.layers[index];
      if (!temp || !current) return;
      frame.layers[index - 1] = current;
      frame.layers[index] = temp;
      newProject.activeLayerIndex = index - 1;
      pushState(newProject);
    },
    [project, pushState],
  );

  const handleMoveLayerDown = useCallback(
    (index: number) => {
      const frame = project.frames[project.activeFrameIndex];
      if (!frame || index >= frame.layers.length - 1) return;
      const newProject = deepCloneProject(project);
      const newFrame = newProject.frames[newProject.activeFrameIndex];
      if (!newFrame) return;
      const temp = newFrame.layers[index + 1];
      const current = newFrame.layers[index];
      if (!temp || !current) return;
      newFrame.layers[index + 1] = current;
      newFrame.layers[index] = temp;
      newProject.activeLayerIndex = index + 1;
      pushState(newProject);
    },
    [project, pushState],
  );

  const handleMergeLayers = useCallback(
    (index: number) => {
      const frame = project.frames[project.activeFrameIndex];
      if (!frame || index >= frame.layers.length - 1) return;
      const newProject = deepCloneProject(project);
      const newFrame = newProject.frames[newProject.activeFrameIndex];
      if (!newFrame) return;
      const upper = newFrame.layers[index];
      const lower = newFrame.layers[index + 1];
      if (!upper || !lower) return;
      // Merge upper onto lower
      const flat = flattenFrame({ id: "merge", layers: [lower, upper] }, project.gridSize);
      lower.pixels = flat;
      newFrame.layers.splice(index, 1);
      if (newProject.activeLayerIndex >= newFrame.layers.length) {
        newProject.activeLayerIndex = newFrame.layers.length - 1;
      }
      pushState(newProject);
    },
    [project, pushState],
  );

  const handleSelectLayer = useCallback(
    (index: number) => {
      const frame = project.frames[project.activeFrameIndex];
      if (!frame || index < 0 || index >= frame.layers.length) return;
      const newProject = deepCloneProject(project);
      newProject.activeLayerIndex = index;
      pushState(newProject);
    },
    [project, pushState],
  );

  // Frame operations
  const handleAddFrame = useCallback(() => {
    if (project.frames.length >= 16) return;
    const newProject = deepCloneProject(project);
    newProject.frames.push(createFrame(project.gridSize));
    newProject.activeFrameIndex = newProject.frames.length - 1;
    newProject.activeLayerIndex = 0;
    pushState(newProject);
  }, [project, pushState]);

  const handleDuplicateFrame = useCallback(
    (index: number) => {
      if (project.frames.length >= 16) return;
      const frame = project.frames[index];
      if (!frame) return;
      const newProject = deepCloneProject(project);
      const dup = cloneFrame(frame);
      newProject.frames.splice(index + 1, 0, dup);
      newProject.activeFrameIndex = index + 1;
      pushState(newProject);
    },
    [project, pushState],
  );

  const handleDeleteFrame = useCallback(
    (index: number) => {
      if (project.frames.length <= 1) return;
      const newProject = deepCloneProject(project);
      newProject.frames.splice(index, 1);
      if (newProject.activeFrameIndex >= newProject.frames.length) {
        newProject.activeFrameIndex = newProject.frames.length - 1;
      }
      newProject.activeLayerIndex = 0;
      pushState(newProject);
    },
    [project, pushState],
  );

  const handleSelectFrame = useCallback(
    (index: number) => {
      if (index < 0 || index >= project.frames.length) return;
      const newProject = deepCloneProject(project);
      newProject.activeFrameIndex = index;
      newProject.activeLayerIndex = Math.min(
        newProject.activeLayerIndex,
        (newProject.frames[index]?.layers.length ?? 1) - 1,
      );
      pushState(newProject);
    },
    [project, pushState],
  );

  const handlePrevFrame = useCallback(() => {
    if (project.activeFrameIndex > 0) {
      handleSelectFrame(project.activeFrameIndex - 1);
    }
  }, [project.activeFrameIndex, handleSelectFrame]);

  const handleNextFrame = useCallback(() => {
    if (project.activeFrameIndex < project.frames.length - 1) {
      handleSelectFrame(project.activeFrameIndex + 1);
    }
  }, [project.activeFrameIndex, project.frames.length, handleSelectFrame]);

  // Grid size change
  const handleGridSizeChange = useCallback(
    (size: GridSize) => {
      if (size === project.gridSize) return;
      if (!confirm(`Change canvas to ${size}x${size}? Current artwork will be cleared.`)) return;
      const newProject = createProject(size);
      replaceProject(newProject);
    },
    [project.gridSize, replaceProject],
  );

  // Save to gallery
  const handleSaveToGallery = useCallback(() => {
    const frame = project.frames[0];
    if (!frame) return;
    const thumbnail = generateThumbnail(frame, project.gridSize);
    const name = prompt("Save as:", projectName) ?? projectName;
    setProjectName(name);
    const item = saveToGallery(name, project, thumbnail, galleryId);
    setGalleryId(item.id);
    setGallery(loadGallery());
  }, [project, projectName, galleryId]);

  // Load from gallery
  const handleLoadProject = useCallback(
    (proj: Project, id: string, name: string) => {
      replaceProject(proj);
      setGalleryId(id);
      setProjectName(name);
      setShowGallery(false);
    },
    [replaceProject],
  );

  // Keyboard shortcuts
  const shortcutHandlers = useMemo(
    () => ({
      setTool,
      setActiveLayer: (index: number) => {
        const frame = project.frames[project.activeFrameIndex];
        if (frame && index < frame.layers.length) {
          handleSelectLayer(index);
        }
      },
      prevFrame: handlePrevFrame,
      nextFrame: handleNextFrame,
      undo,
      redo,
      saveToGallery: handleSaveToGallery,
    }),
    [project, handleSelectLayer, handlePrevFrame, handleNextFrame, undo, redo, handleSaveToGallery],
  );

  useKeyboardShortcuts(shortcutHandlers);

  return (
    <div className="flex flex-col h-screen no-select" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 py-2"
        style={{ borderBottom: "1px solid var(--line)", background: "var(--glass)" }}
      >
        <h1 className="text-base font-bold" style={{ color: "var(--ink)" }}>
          Pixel Art
        </h1>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {projectName} - {project.gridSize}x{project.gridSize}
        </span>
        <div className="flex-1" />
        <button
          onClick={handleSaveToGallery}
          className="h-7 px-3 rounded-md text-xs font-medium cursor-pointer"
          style={{ background: "var(--accent)", color: "#fff", border: "none" }}
        >
          Save
        </button>
        <button
          onClick={() => { setGallery(loadGallery()); setShowGallery(true); }}
          className="h-7 px-3 rounded-md text-xs font-medium cursor-pointer"
          style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
        >
          Gallery
        </button>
      </header>

      {/* Toolbar */}
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        showGrid={showGrid}
        onShowGridChange={setShowGrid}
        mirror={mirror}
        onMirrorChange={setMirror}
        fillMode={fillMode}
        onFillModeChange={setFillMode}
        gridSize={project.gridSize}
        onGridSizeChange={handleGridSizeChange}
        zoom={zoom}
        onZoomChange={setZoom}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeFrame && (
            <PixelCanvas
              frame={activeFrame}
              prevFrame={onionSkin ? prevFrame : null}
              activeLayerIndex={project.activeLayerIndex}
              gridSize={project.gridSize}
              tool={tool}
              color={color}
              showGrid={showGrid}
              mirror={mirror}
              fillMode={fillMode}
              onionSkin={onionSkin}
              zoom={zoom}
              onZoomChange={setZoom}
              onPixelsChanged={handlePixelsChanged}
              onColorPicked={handleColorPicked}
            />
          )}

          {/* Frame strip at bottom */}
          <div className="shrink-0 px-3 py-2" style={{ borderTop: "1px solid var(--line)", background: "var(--glass)" }}>
            <FramePanel
              frames={project.frames}
              activeIndex={project.activeFrameIndex}
              gridSize={project.gridSize}
              onSelectFrame={handleSelectFrame}
              onAddFrame={handleAddFrame}
              onDuplicateFrame={handleDuplicateFrame}
              onDeleteFrame={handleDeleteFrame}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <aside
          className="w-56 shrink-0 overflow-y-auto hidden md:flex flex-col"
          style={{ borderLeft: "1px solid var(--line)", background: "var(--glass)" }}
        >
          {/* Sidebar tabs */}
          <div className="flex" style={{ borderBottom: "1px solid var(--line)" }}>
            <button
              onClick={() => setSidebarTab("tools")}
              className="flex-1 text-xs font-medium py-2 cursor-pointer"
              style={{
                background: sidebarTab === "tools" ? "var(--panel)" : "transparent",
                color: sidebarTab === "tools" ? "var(--ink)" : "var(--muted)",
                border: "none",
                borderBottom: sidebarTab === "tools" ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              Tools
            </button>
            <button
              onClick={() => setSidebarTab("frames")}
              className="flex-1 text-xs font-medium py-2 cursor-pointer"
              style={{
                background: sidebarTab === "frames" ? "var(--panel)" : "transparent",
                color: sidebarTab === "frames" ? "var(--ink)" : "var(--muted)",
                border: "none",
                borderBottom: sidebarTab === "frames" ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              Animation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {sidebarTab === "tools" && (
              <>
                {/* Color palette */}
                <ColorPalette
                  color={color}
                  onColorChange={setColor}
                  recentColors={recentColors}
                  onRecentColorsChange={setRecentColors}
                />

                {/* Layers */}
                {activeFrame && (
                  <LayerPanel
                    layers={activeFrame.layers}
                    activeIndex={project.activeLayerIndex}
                    onSelectLayer={handleSelectLayer}
                    onToggleVisibility={handleToggleLayerVisibility}
                    onOpacityChange={handleLayerOpacityChange}
                    onMoveUp={handleMoveLayerUp}
                    onMoveDown={handleMoveLayerDown}
                    onAddLayer={handleAddLayer}
                    onDeleteLayer={handleDeleteLayer}
                    onMergeLayers={handleMergeLayers}
                  />
                )}

                {/* Export */}
                <ExportPanel
                  frames={project.frames}
                  activeFrameIndex={project.activeFrameIndex}
                  gridSize={project.gridSize}
                  fps={animFps}
                />
              </>
            )}

            {sidebarTab === "frames" && (
              <AnimationPreview
                frames={project.frames}
                gridSize={project.gridSize}
                onionSkin={onionSkin}
                onOnionSkinChange={setOnionSkin}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer
        className="shrink-0 flex items-center justify-center px-4 py-1.5 text-xs"
        style={{ borderTop: "1px solid var(--line)", color: "var(--muted)" }}
      >
        Pixel Art — Free on FreeAppStore
      </footer>

      {/* Gallery modal */}
      {showGallery && (
        <Gallery
          gallery={gallery}
          onGalleryChange={setGallery}
          onLoadProject={handleLoadProject}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}
