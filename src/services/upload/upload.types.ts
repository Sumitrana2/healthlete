// validations
export type UploadFolder = 'brands' | 'campaigns'| '';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface UploadedFileResult {
  filename: string;
  originalName: string;
  folder: UploadFolder;
  mimeType: string;
  sizeBytes: number;
  url: string;
}