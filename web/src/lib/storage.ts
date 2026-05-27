import type { GalleryItem, Project } from "./types";

const GALLERY_KEY = "pixel-art-gallery";
const CUSTOM_PALETTES_KEY = "pixel-art-custom-palettes";
const RECENT_COLORS_KEY = "pixel-art-recent-colors";

export function loadGallery(): GalleryItem[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GalleryItem[];
  } catch {
    return [];
  }
}

export function saveGallery(gallery: GalleryItem[]): void {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
}

export function saveToGallery(
  name: string,
  project: Project,
  thumbnail: string,
  existingId?: string,
): GalleryItem {
  const gallery = loadGallery();
  const now = Date.now();
  if (existingId) {
    const idx = gallery.findIndex((item) => item.id === existingId);
    if (idx !== -1) {
      const existing = gallery[idx];
      if (existing) {
        existing.name = name;
        existing.project = project;
        existing.thumbnail = thumbnail;
        existing.updatedAt = now;
        saveGallery(gallery);
        return existing;
      }
    }
  }
  const item: GalleryItem = {
    id: `gallery_${now}_${Math.random().toString(36).slice(2)}`,
    name,
    thumbnail,
    project,
    createdAt: now,
    updatedAt: now,
  };
  gallery.unshift(item);
  saveGallery(gallery);
  return item;
}

export function deleteFromGallery(id: string): void {
  const gallery = loadGallery();
  saveGallery(gallery.filter((item) => item.id !== id));
}

export function loadCustomPalettes(): { name: string; colors: string[] }[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PALETTES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as { name: string; colors: string[] }[];
  } catch {
    return [];
  }
}

export function saveCustomPalettes(palettes: { name: string; colors: string[] }[]): void {
  localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(palettes));
}

export function loadRecentColors(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_COLORS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveRecentColors(colors: string[]): void {
  localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors));
}
