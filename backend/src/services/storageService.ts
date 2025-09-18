import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { env } from '../env';

export type SaveOptions = {
  token: string;
  originalName: string;
  mimeType?: string;
};

export type SaveResult = {
  storageKey: string;
  size?: number;
};

export type StatResult = {
  exists: boolean;
  size?: number;
};

export type StorageAdapter = {
  saveFromDisk: (tmpPath: string, opts: SaveOptions) => Promise<SaveResult>;
  getStream: (storageKey: string) => fs.ReadStream;
  stat: (storageKey: string) => Promise<StatResult>;
  delete: (storageKey: string) => Promise<void>;
  getPublicUrl?: (storageKey: string) => string | null;
};

function ensureDirSync(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeJoin(baseDir: string, key: string): string {
  const absBase = path.resolve(baseDir);
  const absTarget = path.resolve(absBase, key);
  const rel = path.relative(absBase, absTarget);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Invalid storageKey');
  }
  return absTarget;
}

function toPosixKey(...parts: string[]): string {
  return parts.join('/').replace(/\\+/g, '/');
}

function sanitizeExt(ext: string): string {
  const lowered = (ext || '').toLowerCase();
  // Allow only simple dot + alnum extensions
  return /^\.[a-z0-9]{1,8}$/.test(lowered) ? lowered : '';
}

function buildStorageKey(token: string, originalName: string): string {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const ext = sanitizeExt(path.extname(originalName || ''));
  return toPosixKey(yyyy, mm, dd, `${token}${ext}`);
}

// Local adapter implementation
function makeLocalAdapter(baseDir: string): StorageAdapter {
  const absBase = path.resolve(baseDir);
  ensureDirSync(absBase);

  return {
    async saveFromDisk(tmpPath: string, opts: SaveOptions): Promise<SaveResult> {
      const key = buildStorageKey(opts.token, opts.originalName);
      const absDest = safeJoin(absBase, key);
      ensureDirSync(path.dirname(absDest));
      await fsp.rename(tmpPath, absDest);
      const st = await fsp.stat(absDest);
      return { storageKey: key, size: st.size };
    },
    getStream(storageKey: string): fs.ReadStream {
      const abs = safeJoin(absBase, storageKey);
      return fs.createReadStream(abs);
    },
    async stat(storageKey: string): Promise<StatResult> {
      try {
        const abs = safeJoin(absBase, storageKey);
        const st = await fsp.stat(abs);
        return { exists: true, size: st.size };
      } catch (err: any) {
        if (err && err.code === 'ENOENT') return { exists: false };
        throw err;
      }
    },
    async delete(storageKey: string): Promise<void> {
      try {
        const abs = safeJoin(absBase, storageKey);
        await fsp.unlink(abs);
      } catch (err: any) {
        if (err && err.code === 'ENOENT') return;
        throw err;
      }
    },
    getPublicUrl: () => null,
  };
}

// Adapter selection (only local for now)
const storageService: StorageAdapter = makeLocalAdapter(env.STORAGE_LOCAL_DIR);

export { storageService };

