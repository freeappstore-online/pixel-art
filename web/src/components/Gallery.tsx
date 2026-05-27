import type { GalleryItem, Project } from "../lib/types";
import { deleteFromGallery } from "../lib/storage";

interface Props {
  gallery: GalleryItem[];
  onGalleryChange: (gallery: GalleryItem[]) => void;
  onLoadProject: (project: Project, id: string, name: string) => void;
  onClose: () => void;
}

export default function Gallery({ gallery, onGalleryChange, onLoadProject, onClose }: Props) {
  const handleDelete = (id: string) => {
    if (!confirm("Delete this artwork?")) return;
    deleteFromGallery(id);
    onGalleryChange(gallery.filter((item) => item.id !== id));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>Gallery</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer"
            style={{ background: "var(--panel)", color: "var(--ink)", border: "none" }}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {gallery.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No saved artworks yet. Press Ctrl+S to save your work.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg overflow-hidden"
                  style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
                >
                  <div
                    className="aspect-square flex items-center justify-center p-2"
                    style={{
                      background: "repeating-conic-gradient(#ccc 0% 25%, #999 0% 50%) 0 0 / 16px 16px",
                    }}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--ink)" }}>
                      {item.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => onLoadProject(item.project, item.id, item.name)}
                        className="flex-1 text-xs px-2 py-1 rounded cursor-pointer font-medium"
                        style={{ background: "var(--accent)", color: "#fff", border: "none" }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs px-2 py-1 rounded cursor-pointer"
                        style={{ background: "transparent", color: "var(--error)", border: "1px solid var(--line)" }}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
