import { env } from "../env";

export type FileRecord = {
  token: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  expiresAt: Date;
  maxDownloads: number;
  downloadCount: number;
  isDeleted: boolean;
};

export type FileInfoDTO = {
  token: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
  remainingDownloads: number;
  status: 'active' | 'expired' | 'deleted';
};

const store = new Map<string, FileRecord>();

function isExpired(r: FileRecord): boolean {
  return r.expiresAt.getTime() <= Date.now();
}

export function create(input: {
  token: string;
  storageKey?: string;
  storagePath?: string; // legacy support
  originalName: string;
  mimeType: string;
  size: number;
  expiresAt?: Date;
  expiresInMs?: number;
  maxDownloads?: number;
}): FileRecord {
  const token = input.token;
  const createdAt = new Date();
  const expiresAt = input.expiresAt ?? new Date(Date.now() + (input.expiresInMs ?? env.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000));
  const record: FileRecord = {
    token,
    storageKey: (input as any).storageKey ?? (input as any).storagePath,
    originalName: input.originalName,
    mimeType: input.mimeType,
    size: input.size,
    createdAt,
    expiresAt,
    maxDownloads: input.maxDownloads ?? env.DEFAULT_MAX_DOWNLOADS,
    downloadCount: 0,
    isDeleted: false,
  };
  store.set(token, record);
  return record;
}

export function get(token: string): FileRecord | null {
  return store.get(token) ?? null;
}

export function getInfo(token: string): FileInfoDTO | null {
  const r = store.get(token);
  if (!r) return null;
  const status: FileInfoDTO['status'] = r.isDeleted ? 'deleted' : isExpired(r) ? 'expired' : 'active';
  return {
    token: r.token,
    originalName: r.originalName,
    mimeType: r.mimeType,
    size: r.size,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    downloadCount: r.downloadCount,
    maxDownloads: r.maxDownloads,
    remainingDownloads: Math.max(r.maxDownloads - r.downloadCount, 0),
    status,
  };
}

export function consumeDownload(token: string): { record: FileRecord; shouldDelete: boolean } | null {
  const r = store.get(token);
  if (!r) return null;
  if (r.isDeleted) return null;
  if (isExpired(r)) return null;
  if (r.downloadCount >= r.maxDownloads) return null;
  r.downloadCount += 1;
  const shouldDelete = r.downloadCount >= r.maxDownloads;
  return { record: r, shouldDelete };
}

export function markDeleted(token: string): void {
  const r = store.get(token);
  if (r) r.isDeleted = true;
}
