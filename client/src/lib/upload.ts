import type { UploadResponse } from "shared";
import { apiFetch } from "./api";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function uploadFile(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const { url } = await apiFetch<UploadResponse>("/uploads", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, dataUrl }),
  });
  return url;
}
