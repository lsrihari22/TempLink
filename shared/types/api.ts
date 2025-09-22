export type ErrorCode =
  | 'NOT_FOUND'
  | 'DELETED'
  | 'EXPIRED'
  | 'LIMIT_REACHED'
  | 'BAD_REQUEST'
  | 'INTERNAL'
  | 'RATE_LIMITED'
  | 'INVALID_FILE';

export type ApiError = { error: { code: ErrorCode; message: string } };
export type ApiSuccess<T> = { data: T };

// Upload success payload mirrors backend/src/routes/upload.ts
export type UploadLinks = {
  relative: { info: string; download: string };
  absolute?: { info: string; download: string } | undefined;
};

export type UploadData = {
  token: string;
  links: UploadLinks;
  file: { originalName: string; mimeType: string; size: number };
  expiresAt: string | Date;
  maxDownloads: number;
};

// Info success payload mirrors FileInfoDTO from backend service
export type FileStatus = 'active' | 'expired' | 'deleted';
export type FileInfoData = {
  token: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string | Date;
  expiresAt: string | Date;
  downloadCount: number;
  maxDownloads: number;
  remainingDownloads: number;
  status: FileStatus;
};

// Backwards-compatible exported response types for FE usage
export type FileUploadResponse = ApiSuccess<UploadData> | ApiError;
export type FileInfoResponse = ApiSuccess<FileInfoData> | ApiError;

