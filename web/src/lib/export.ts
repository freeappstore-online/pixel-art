import type { Color, Frame, GridSize } from "./types";
import { flattenFrame } from "./project";

/** Render a flattened frame onto an offscreen canvas and return it */
function renderFrameToCanvas(
  frame: Frame,
  gridSize: GridSize,
  scale: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = gridSize * scale;
  canvas.height = gridSize * scale;
  const ctx = canvas.getContext("2d")!;
  const flat = flattenFrame(frame, gridSize);
  for (let y = 0; y < gridSize; y++) {
    const row = flat[y];
    if (!row) continue;
    for (let x = 0; x < gridSize; x++) {
      const pixel = row[x];
      if (!pixel) continue;
      ctx.fillStyle = `rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.a})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas;
}

/** Export a single frame as a scaled PNG blob */
export async function exportFrameAsPng(
  frame: Frame,
  gridSize: GridSize,
  targetSize: number = 512,
): Promise<Blob> {
  const scale = Math.max(1, Math.floor(targetSize / gridSize));
  const canvas = renderFrameToCanvas(frame, gridSize, scale);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export PNG"));
    }, "image/png");
  });
}

/** Export frames as a horizontal spritesheet PNG */
export async function exportSpritesheet(
  frames: Frame[],
  gridSize: GridSize,
  scale: number = 4,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = gridSize * scale * frames.length;
  canvas.height = gridSize * scale;
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (!frame) continue;
    const frameCanvas = renderFrameToCanvas(frame, gridSize, scale);
    ctx.drawImage(frameCanvas, i * gridSize * scale, 0);
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export spritesheet"));
    }, "image/png");
  });
}

/** Generate a simple animated GIF from frames.
 * This is a minimal GIF89a encoder (no compression - uses uncompressed LZW).
 * For better quality/size, a library would be used in production.
 * Falls back to exporting individual frame PNGs as a zip-like download. */
export async function exportAnimatedGif(
  frames: Frame[],
  gridSize: GridSize,
  fps: number,
  scale: number = 4,
): Promise<Blob> {
  // Use canvas to render each frame, then encode as GIF
  const width = gridSize * scale;
  const height = gridSize * scale;
  const delay = Math.round(100 / fps); // GIF delay is in centiseconds

  // Simple GIF encoder
  const encoder = new GifEncoder(width, height);
  encoder.setRepeat(0); // loop forever
  encoder.setDelay(delay);

  for (const frame of frames) {
    if (!frame) continue;
    const canvas = renderFrameToCanvas(frame, gridSize, scale);
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, width, height);
    encoder.addFrame(imageData.data, width, height);
  }

  return encoder.finish();
}

/** Copy current frame to clipboard as PNG */
export async function copyToClipboard(
  frame: Frame,
  gridSize: GridSize,
  scale: number = 8,
): Promise<void> {
  const blob = await exportFrameAsPng(frame, gridSize, gridSize * scale);
  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob }),
  ]);
}

/** Generate a thumbnail data URL */
export function generateThumbnail(
  frame: Frame,
  gridSize: GridSize,
): string {
  const canvas = renderFrameToCanvas(frame, gridSize, 4);
  return canvas.toDataURL("image/png");
}

/** Render flattened pixels to a canvas for display */
export function renderPixelsToCanvas(
  ctx: CanvasRenderingContext2D,
  pixels: (Color)[][],
  gridSize: GridSize,
  pixelSize: number,
  offsetX: number,
  offsetY: number,
): void {
  for (let y = 0; y < gridSize; y++) {
    const row = pixels[y];
    if (!row) continue;
    for (let x = 0; x < gridSize; x++) {
      const pixel = row[x];
      if (!pixel) continue;
      ctx.fillStyle = `rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.a})`;
      ctx.fillRect(
        offsetX + x * pixelSize,
        offsetY + y * pixelSize,
        pixelSize,
        pixelSize,
      );
    }
  }
}

// ---- Minimal GIF89a encoder ----

class GifEncoder {
  private width: number;
  private height: number;
  private repeat = 0;
  private delay = 10;
  private frames: { data: Uint8ClampedArray; width: number; height: number }[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  setRepeat(repeat: number) { this.repeat = repeat; }
  setDelay(delay: number) { this.delay = delay; }

  addFrame(data: Uint8ClampedArray, _width: number, _height: number) {
    this.frames.push({ data, width: _width, height: _height });
  }

  finish(): Blob {
    const parts: Uint8Array[] = [];

    // Header
    parts.push(this.encode("GIF89a"));

    // Logical Screen Descriptor
    parts.push(this.writeShort(this.width));
    parts.push(this.writeShort(this.height));
    // GCT flag=1, color resolution=7, sort=0, GCT size=7 (256 colors)
    parts.push(new Uint8Array([0xf7, 0x00, 0x00]));

    // Global Color Table (256 entries)
    const gct = new Uint8Array(256 * 3);
    // Build a simple palette from first frame or default
    const palette = this.buildPalette();
    gct.set(palette);
    parts.push(gct);

    // Netscape extension for looping
    if (this.repeat >= 0) {
      parts.push(new Uint8Array([0x21, 0xff, 0x0b]));
      parts.push(this.encode("NETSCAPE2.0"));
      parts.push(new Uint8Array([0x03, 0x01]));
      parts.push(this.writeShort(this.repeat));
      parts.push(new Uint8Array([0x00]));
    }

    // Each frame
    for (const frame of this.frames) {
      // Graphic Control Extension
      parts.push(new Uint8Array([
        0x21, 0xf9, 0x04,
        0x09, // disposal: restore to bg, transparent flag
        this.delay & 0xff, (this.delay >> 8) & 0xff,
        0x00, // transparent color index (index 0 = transparent)
        0x00,
      ]));

      // Image Descriptor
      parts.push(new Uint8Array([0x2c]));
      parts.push(this.writeShort(0)); // left
      parts.push(this.writeShort(0)); // top
      parts.push(this.writeShort(this.width));
      parts.push(this.writeShort(this.height));
      parts.push(new Uint8Array([0x00])); // no local color table

      // LZW Minimum Code Size
      const minCodeSize = 8;
      parts.push(new Uint8Array([minCodeSize]));

      // Index the pixels
      const indexed = this.indexPixels(frame.data, palette);
      // LZW compress
      const compressed = this.lzwCompress(indexed, minCodeSize);
      // Write sub-blocks
      let offset = 0;
      while (offset < compressed.length) {
        const chunkSize = Math.min(255, compressed.length - offset);
        parts.push(new Uint8Array([chunkSize]));
        parts.push(compressed.slice(offset, offset + chunkSize));
        offset += chunkSize;
      }
      parts.push(new Uint8Array([0x00])); // block terminator
    }

    // Trailer
    parts.push(new Uint8Array([0x3b]));

    return new Blob(parts as BlobPart[], { type: "image/gif" });
  }

  private buildPalette(): Uint8Array {
    const palette = new Uint8Array(256 * 3);
    // Index 0 = transparent (black with alpha=0, handled by GCE)
    // Build palette from unique colors in all frames
    const colorMap = new Map<string, number>();
    colorMap.set("0,0,0,0", 0); // transparent
    let idx = 1;

    for (const frame of this.frames) {
      for (let i = 0; i < frame.data.length && idx < 256; i += 4) {
        const r = frame.data[i] ?? 0;
        const g = frame.data[i + 1] ?? 0;
        const b = frame.data[i + 2] ?? 0;
        const a = frame.data[i + 3] ?? 0;
        if (a < 128) continue; // treat as transparent
        const key = `${r},${g},${b}`;
        if (!colorMap.has(key)) {
          colorMap.set(key, idx);
          palette[idx * 3] = r;
          palette[idx * 3 + 1] = g;
          palette[idx * 3 + 2] = b;
          idx++;
        }
      }
    }

    return palette;
  }

  private indexPixels(data: Uint8ClampedArray, palette: Uint8Array): Uint8Array {
    const numPixels = data.length / 4;
    const indexed = new Uint8Array(numPixels);
    // Build lookup from palette
    const lookup = new Map<string, number>();
    for (let i = 0; i < 256; i++) {
      const r = palette[i * 3] ?? 0;
      const g = palette[i * 3 + 1] ?? 0;
      const b = palette[i * 3 + 2] ?? 0;
      if (i === 0) {
        lookup.set("transparent", 0);
      } else {
        lookup.set(`${r},${g},${b}`, i);
      }
    }

    for (let i = 0; i < numPixels; i++) {
      const r = data[i * 4] ?? 0;
      const g = data[i * 4 + 1] ?? 0;
      const b = data[i * 4 + 2] ?? 0;
      const a = data[i * 4 + 3] ?? 0;
      if (a < 128) {
        indexed[i] = 0; // transparent
      } else {
        const key = `${r},${g},${b}`;
        const val = lookup.get(key);
        indexed[i] = val !== undefined ? val : this.findClosest(r, g, b, palette);
      }
    }
    return indexed;
  }

  private findClosest(r: number, g: number, b: number, palette: Uint8Array): number {
    let minDist = Infinity;
    let best = 1;
    for (let i = 1; i < 256; i++) {
      const pr = palette[i * 3] ?? 0;
      const pg = palette[i * 3 + 1] ?? 0;
      const pb = palette[i * 3 + 2] ?? 0;
      const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (dist < minDist) {
        minDist = dist;
        best = i;
      }
    }
    return best;
  }

  private lzwCompress(indexed: Uint8Array, minCodeSize: number): Uint8Array {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;

    // Initialize code table
    let codeTable = new Map<string, number>();
    for (let i = 0; i < clearCode; i++) {
      codeTable.set(String(i), i);
    }

    const output: number[] = [];
    let buffer = 0;
    let bufferBits = 0;

    const emit = (code: number) => {
      buffer |= code << bufferBits;
      bufferBits += codeSize;
      while (bufferBits >= 8) {
        output.push(buffer & 0xff);
        buffer >>= 8;
        bufferBits -= 8;
      }
    };

    emit(clearCode);

    if (indexed.length === 0) {
      emit(eoiCode);
      if (bufferBits > 0) output.push(buffer & 0xff);
      return new Uint8Array(output);
    }

    let current = String(indexed[0] ?? 0);

    for (let i = 1; i < indexed.length; i++) {
      const next = String(indexed[i] ?? 0);
      const combined = current + "," + next;
      if (codeTable.has(combined)) {
        current = combined;
      } else {
        const code = codeTable.get(current);
        if (code !== undefined) emit(code);

        if (nextCode < 4096) {
          codeTable.set(combined, nextCode);
          nextCode++;
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        } else {
          // Reset
          emit(clearCode);
          codeTable = new Map<string, number>();
          for (let j = 0; j < clearCode; j++) {
            codeTable.set(String(j), j);
          }
          codeSize = minCodeSize + 1;
          nextCode = eoiCode + 1;
        }
        current = next;
      }
    }

    const lastCode = codeTable.get(current);
    if (lastCode !== undefined) emit(lastCode);
    emit(eoiCode);
    if (bufferBits > 0) output.push(buffer & 0xff);

    return new Uint8Array(output);
  }

  private encode(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  private writeShort(val: number): Uint8Array {
    return new Uint8Array([val & 0xff, (val >> 8) & 0xff]);
  }
}
