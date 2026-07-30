import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import logger from "../../shared/logger/logger";
import { AppError } from "../../common/exceptions/app.error";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type UploadedFileResult,
  type UploadFolder,
} from "./upload.types";

@Injectable()
export class UploadService {
  buildFileResult(file: Express.Multer.File, folder: UploadFolder): UploadedFileResult {
    return {
      filename: file.filename,
      originalName: file.originalname,
      folder,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      url: `/uploads/${folder}/${file.filename}`,
    };
  }

  async saveDataUrlImage(
    dataUrl: string,
    folder: UploadFolder,
  ): Promise<string> {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(
      dataUrl.trim(),
    );

    if (!match) {
      throw new AppError(400, "Invalid image data", "VALIDATION_ERROR");
    }

    const mimeType = match[1].toLowerCase() as (typeof ALLOWED_MIME_TYPES)[number];
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new AppError(400, "Unsupported image type", "VALIDATION_ERROR");
    }

    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new AppError(400, "Image exceeds 5MB limit", "VALIDATION_ERROR");
    }

    const extension =
      mimeType === "image/jpeg"
        ? ".jpg"
        : mimeType === "image/png"
          ? ".png"
          : ".webp";
    const filename = `${randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "src/uploads", folder);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    return `/uploads/${folder}/${filename}`;
  }

  async resolveAvatarUrl(
    avatarUrl: string | undefined,
    folder: UploadFolder,
  ): Promise<string | undefined> {
    if (!avatarUrl?.trim()) {
      return undefined;
    }

    if (avatarUrl.startsWith("data:image/")) {
      return this.saveDataUrlImage(avatarUrl, folder);
    }

    return avatarUrl.trim();
  }

  async deleteFileByUrl(oldUrl: string | null | undefined): Promise<void> {
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
}
