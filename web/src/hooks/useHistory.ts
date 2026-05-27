import { useCallback, useRef, useState } from "react";
import type { Project } from "../lib/types";
import { deepCloneProject } from "../lib/project";

const MAX_HISTORY = 50;

export function useHistory(initial: Project) {
  const [project, setProjectState] = useState<Project>(initial);
  const pastRef = useRef<Project[]>([]);
  const futureRef = useRef<Project[]>([]);

  const pushState = useCallback((next: Project) => {
    setProjectState((prev) => {
      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), deepCloneProject(prev)];
      futureRef.current = [];
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setProjectState((prev) => {
      if (pastRef.current.length === 0) return prev;
      const last = pastRef.current.pop()!;
      futureRef.current = [...futureRef.current, deepCloneProject(prev)];
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setProjectState((prev) => {
      if (futureRef.current.length === 0) return prev;
      const next = futureRef.current.pop()!;
      pastRef.current = [...pastRef.current, deepCloneProject(prev)];
      return next;
    });
  }, []);

  const replaceProject = useCallback((next: Project) => {
    pastRef.current = [];
    futureRef.current = [];
    setProjectState(next);
  }, []);

  return {
    project,
    pushState,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    replaceProject,
  };
}
