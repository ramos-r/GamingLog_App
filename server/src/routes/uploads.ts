import { Router } from "express";
import { z } from "zod";
import { put } from "@vercel/blob";
import { requireAuth } from "../middleware/requireAuth.js";

export const uploadsRouter = Router();

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/;

const uploadSchema = z.object({
  filename: z.string().min(1).max(200),
  dataUrl: z.string().min(1),
});

uploadsRouter.use(requireAuth);

uploadsRouter.post("/", async (req, res) => {
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const match = DATA_URL_PATTERN.exec(parsed.data.dataUrl);
  if (!match) {
    res.status(400).json({ error: "File must be a PNG, JPEG, WebP, or GIF image" });
    return;
  }

  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength > MAX_FILE_BYTES) {
    res.status(400).json({ error: "File is too large (max 5MB)" });
    return;
  }

  const blob = await put(parsed.data.filename, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });

  res.status(201).json({ url: blob.url });
});
