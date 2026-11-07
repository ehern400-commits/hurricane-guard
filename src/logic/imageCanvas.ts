import { differenceHash } from "./imageChecks";

function grayscaleAndContrast(context: CanvasRenderingContext2D, width: number, height: number) {
  const image = context.getImageData(0, 0, width, height);
  for (let i = 0; i < image.data.length; i += 4) {
    const gray = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
    const contrast = Math.max(0, Math.min(255, (gray - 128) * 1.5 + 128));
    image.data[i] = contrast;
    image.data[i + 1] = contrast;
    image.data[i + 2] = contrast;
  }
  context.putImageData(image, 0, 0);
}

export async function preprocessImage(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = 2000 / Math.max(bitmap.width, bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * Math.min(scale, 1)));
    const height = Math.max(1, Math.round(bitmap.height * Math.min(scale, 1)));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is unavailable.");
    context.drawImage(bitmap, 0, 0, width, height);
    grayscaleAndContrast(context, width, height);
    return canvas;
  } finally {
    bitmap.close();
  }
}

export async function hashImageFile(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is unavailable.");
    context.drawImage(bitmap, 0, 0, 9, 8);
    const image = context.getImageData(0, 0, 9, 8);
    for (let i = 0; i < image.data.length; i += 4) {
      const gray = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
      image.data[i] = gray;
      image.data[i + 1] = gray;
      image.data[i + 2] = gray;
    }
    return differenceHash(image.data);
  } finally {
    bitmap.close();
  }
}
