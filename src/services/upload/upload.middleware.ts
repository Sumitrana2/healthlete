// multer config
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, UploadFolder } from './upload.types';

function resolveFolder(req: Request): UploadFolder {
  if (req.baseUrl.includes('brands'))    return 'brands';
  if (req.baseUrl.includes('campaigns')) return 'campaigns';
  return ''
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = resolveFolder(req);
    const uploadPath = path.join(process.cwd(), 'src/uploads', folder);
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    return cb(new Error('INVALID_FILE_TYPE'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

export const uploadSingleImage = upload.single('image'); 
export { resolveFolder };