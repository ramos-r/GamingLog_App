import type { UploadResponse } from "shared";
import { apiFetch, ApiError } from "./api";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function uploadFile(file: File): Promise<string> {
  // Validate before ever reading/sending the file — instant feedback instead
  // of a round trip, and it keeps oversized payloads away from the server's
  // JSON body-size limit entirely (see server/src/routes/uploads.ts).
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ApiError("File must be a PNG, JPEG, WebP, or GIF image", 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ApiError("File is too large (max 5MB)", 400);
  }

  const dataUrl = await fileToDataUrl(file);
  const { url } = await apiFetch<UploadResponse>("/uploads", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, dataUrl }),
  });
  return url;
}
