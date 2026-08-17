/**
 * Shrinks a photographed slip in the browser before upload.
 *
 * Phone photos of these slips run ~5700px and ~4MB. Sending that raw costs
 * upload time on a shop-floor connection and buys no accuracy — 2048px on the
 * long edge is what the extraction was tuned and measured against. It also
 * keeps the request under the serverless body limit with room to spare.
 *
 * Uses only browser primitives, so this adds no dependency and no bundle weight.
 */

export interface DownscaledImage {
  /** Base64 payload without the `data:` prefix, ready for a JSON body. */
  base64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
  /** Approximate encoded size, for logging and for warning about huge uploads. */
  sizeKb: number;
}

export const DEFAULT_MAX_DIMENSION = 2048;

export async function downscaleImage(
  file: File,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
  quality = 0.85
): Promise<DownscaledImage> {
  const bitmap = await decode(file);

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the image for upload.");

  // White backdrop: these are photos of paper, and any transparency should
  // flatten to white rather than black when encoding to JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  // Release the decoded bitmap promptly; the <img> fallback has nothing to free.
  if ("close" in bitmap) bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);

  return {
    base64,
    mimeType: "image/jpeg",
    width,
    height,
    sizeKb: Math.round((base64.length * 3) / 4 / 1024),
  };
}

/**
 * `createImageBitmap` is the fast path but does not decode every format a phone
 * can produce, so fall back to an <img> element, which follows the browser's own
 * decoder set.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(
          new Error(
            "That image format could not be read. Try a JPEG or PNG — some iPhone HEIC files need converting first."
          )
        );
      };
      img.src = url;
    });
  }
}
