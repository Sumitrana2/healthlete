import { randomUUID } from "crypto";
import fs from "fs";
import multer from "multer";
import path from "path";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "../../../shared/storage/upload.types";

const athletesUploadDir = path.join(process.cwd(), "src/uploads/athletes");

function ensureAthletesUploadDir() {
  if (!fs.existsSync(athletesUploadDir)) {
    fs.mkdirSync(athletesUploadDir, { recursive: true });
  }
}

export const athleteAvatarUploadOptions = {
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureAthletesUploadDir();
      cb(null, athletesUploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
      cb(new Error("INVALID_FILE_TYPE"));
      return;
    }
    cb(null, true);
  },
};
