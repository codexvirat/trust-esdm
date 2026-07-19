import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

export const UPLOADS_ROOT = path.resolve(__dirname, "..", "..", "uploads");
export const BATCH_PHOTOS_DIR = path.join(UPLOADS_ROOT, "batch-photos");
export const CERTIFICATE_TEMPLATES_DIR = path.join(UPLOADS_ROOT, "certificate-templates");
export const CERTIFICATES_DIR = path.join(UPLOADS_ROOT, "certificates");

fs.mkdirSync(BATCH_PHOTOS_DIR, { recursive: true });
fs.mkdirSync(CERTIFICATE_TEMPLATES_DIR, { recursive: true });
fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, BATCH_PHOTOS_DIR),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

export const uploadBatchPhoto = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

const templateStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CERTIFICATE_TEMPLATES_DIR),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

export const uploadCertificateTemplateBackground = multer({
  storage: templateStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

/** Maps a served /uploads/<subdir>/<file> URL back to its on-disk path — used to re-read an uploaded template for PDF rendering. */
export function resolveUploadsPath(url: string): string {
  const marker = "/uploads/";
  const idx = url.indexOf(marker);
  const relative = idx === -1 ? url : url.slice(idx + marker.length);
  return path.resolve(UPLOADS_ROOT, relative);
}
