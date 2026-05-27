import { useEffect } from "react";
import type { Tool } from "../lib/types";

interface ShortcutHandlers {
  setTool: (tool: Tool) => void;
  setActiveLayer: (index: number) => void;
  prevFrame: () => void;
  nextFrame: () => void;
  undo: () => void;
  redo: () => void;
  saveToGallery: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handlers.redo();
        return;
      }
      if (ctrl && e.key === "z") {
        e.preventDefault();
        handlers.undo();
        return;
      }
      if (ctrl && e.key === "s") {
        e.preventDefault();
        handlers.saveToGallery();
        return;
      }

      switch (e.key.toLowerCase()) {
        case "p": handlers.setTool("pencil"); break;
        case "e": handlers.setTool("eraser"); break;
        case "f": handlers.setTool("fill"); break;
        case "l": handlers.setTool("line"); break;
        case "r": handlers.setTool("rectangle"); break;
        case "c": handlers.setTool("circle"); break;
        case "i": handlers.setTool("eyedropper"); break;
        case "1": handlers.setActiveLayer(0); break;
        case "2": handlers.setActiveLayer(1); break;
        case "3": handlers.setActiveLayer(2); break;
        case "4": handlers.setActiveLayer(3); break;
        case "[": handlers.prevFrame(); break;
        case "]": handlers.nextFrame(); break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
