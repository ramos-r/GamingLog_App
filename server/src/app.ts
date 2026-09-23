import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { libraryRouter } from "./routes/library.js";
import { uploadsRouter } from "./routes/uploads.js";
import { usersRouter } from "./routes/users.js";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
// 8mb: uploads ride as base64 JSON (~33% larger than the 5MB file cap in
// routes/uploads.ts), well under the ~100kb default body-parser limit.
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/library", libraryRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/users", usersRouter);

// Catches body-parser failures (e.g. a request over the JSON size limit)
// so they come back as a JSON error instead of Express's default HTML page —
// the client's error handling only ever expects JSON.
const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = err && typeof err === "object" && "status" in err ? Number(err.status) || 500 : 500;
  const message = status === 413 ? "File is too large" : "Invalid request";
  res.status(status).json({ error: message });
};
app.use(jsonErrorHandler);
