type EnvConfig = {
  MAX_FILE_SIZE_BYTES: number;
  ALLOWED_MIME_SET: Set<string> | null;
  ALLOWED_EXT_SET: Set<string> | null;
  PUBLIC_BASE_URL: string | null;
  STORAGE_TYPE: 'local' | 's3';
  STORAGE_LOCAL_DIR: string;
  DEFAULT_EXPIRY_HOURS: number;
  DEFAULT_MAX_DOWNLOADS: number;
  MAX_DOWNLOADS_CAP: number;
  CORS_ORIGINS?: Set<string> | null;
  CLEANUP_INTERVAL_MS?: number;
  CLEANUP_BATCH_SIZE?: number;
  CLEANUP_SOFT_DELETE_ONLY?: boolean;
  CLEANUP_PURGE_AFTER_HOURS?: number;
};


function toInt(value: string | undefined, def: number): number {
  if (!value) return def;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function toListSet(value: string | undefined): Set<string> | null {
  if (!value) return null;
  const items = value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return items.length ? new Set(items) : null;
}

const MAX_FILE_SIZE_MB = toInt(process.env.MAX_FILE_SIZE_MB, 50);
const ALLOWED_MIME_SET = toListSet(process.env.ALLOWED_MIME);
const ALLOWED_EXT_SET = toListSet(process.env.ALLOWED_EXTS);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL?.trim() || null;
const DEFAULT_EXPIRY_HOURS = toInt(process.env.DEFAULT_EXPIRY_HOURS, 24);
const DEFAULT_MAX_DOWNLOADS = toInt(process.env.DEFAULT_MAX_DOWNLOADS, 1);
const MAX_DOWNLOADS_CAP = toInt(process.env.MAX_DOWNLOADS_CAP, 10);
const STORAGE_TYPE = (process.env.STORAGE_TYPE?.trim().toLowerCase() === 's3' ? 's3' : 'local') as 'local' | 's3';
const STORAGE_LOCAL_DIR = "../uploads"; //pathResolveUploads(); //process.env.STORAGE_LOCAL_DIR?.trim() || pathResolveUploads();
const CORS_ORIGINS = toListSet(process.env.CORS_ORIGINS);
const CLEANUP_INTERVAL_MS = toInt(process.env.CLEANUP_INTERVAL_MS,  10 * 1000); // 1min for testin; default: Change later to 5/10 minutes
const CLEANUP_BATCH_SIZE = toInt(process.env.CLEANUP_BATCH_SIZE, 100);
const CLEANUP_SOFT_DELETE_ONLY = process.env.CLEANUP_SOFT_DELETE_ONLY === 'true';
const CLEANUP_PURGE_AFTER_HOURS = toInt(process.env.CLEANUP_PURGE_AFTER_HOURS, 24);

function pathResolveUploads() {
  // Default to project uploads directory
  return '..uploads';
}

export const env: EnvConfig = {
  MAX_FILE_SIZE_BYTES: MAX_FILE_SIZE_MB * 1024 * 1024,
  ALLOWED_MIME_SET,
  ALLOWED_EXT_SET,
  PUBLIC_BASE_URL,
  STORAGE_TYPE,
  STORAGE_LOCAL_DIR,
  DEFAULT_EXPIRY_HOURS,
  DEFAULT_MAX_DOWNLOADS,
  MAX_DOWNLOADS_CAP,
  CORS_ORIGINS,
  CLEANUP_INTERVAL_MS,
  CLEANUP_BATCH_SIZE,
  CLEANUP_SOFT_DELETE_ONLY,
  CLEANUP_PURGE_AFTER_HOURS,
};
