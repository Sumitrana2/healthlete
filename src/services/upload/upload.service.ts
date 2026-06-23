// upload logic
import fs from "fs/promises";
import path from "path";
import { env } from "../../config/env";
import logger from "../../config/logger";
import type { UploadedFileResult, UploadFolder } from "./upload.types";

export function buildFileResult(
  file: Express.Multer.File,
  folder: UploadFolder
): UploadedFileResult {
  return {
    filename: file.filename,
    originalName: file.originalname,
    folder,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    url: `${env.API_BASE_URL}/uploads/${folder}/${file.filename}`,
  };
}
export async function deleteFileByUrl(
  oldUrl: string | null | undefined
): Promise<void> {
  if (!oldUrl) return;
  try {
    const uploadsIndex = oldUrl.indexOf("/uploads/");
    if (uploadsIndex === -1) return;
    const relativePath = oldUrl.slice(uploadsIndex + "/uploads/".length);
    const fullPath = path.join(process.cwd(), "src/uploads", relativePath);

    await fs.unlink(fullPath);
    logger.info({ path: relativePath }, "Old upload file deleted");
  } catch (err) {
    logger.warn({ err, oldUrl }, "Failed to delete old upload file");
  }
}
