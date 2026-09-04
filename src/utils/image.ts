/**
 * Image compression pipeline.
 * Downscales camera / gallery photos to max 720px width, encodes as WebP and
 * iteratively lowers quality to land near a ~50KB budget — prevents storage
 * bloat and keeps memory usage low.
 */
const MAX_WIDTH = 720;
const TARGET_BYTES = 50 * 1024;

function loadBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), type, quality),
  );
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  originalBytes: number;
  bytes: number;
  quality: number;
  format: string;
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const img = await loadBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / img.naturalWidth);
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // Detect WebP support (Safari < 14 falls back to JPEG).
  const probe = await canvasToBlob(canvas, "image/webp", 0.8);
  const format = probe.type === "image/webp" ? "image/webp" : "image/jpeg";

  let quality = 0.82;
  let blob = format === "image/webp" ? probe : await canvasToBlob(canvas, format, quality);
  while (blob.size > TARGET_BYTES && quality > 0.3) {
    quality = Math.max(0.3, quality - 0.12);
    blob = await canvasToBlob(canvas, format, quality);
  }

  return { blob, width, height, originalBytes: file.size, bytes: blob.size, quality, format };
}

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
