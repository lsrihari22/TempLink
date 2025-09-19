import type { File as FileModel } from '@prisma/client';
import { prisma } from '../database/client';
import { storageService } from '../services/storageService';

type CleanupOptions = {
  intervalMs: number;
  batchSize: number;
  softDeleteOnly: boolean;
  purgeAfterHours: number;
};

type CleanupStats = {
  scannedExpired: number;
  scannedExhausted: number;
  scannedPurge: number;
  blobDeleted: number;
  markedDeleted: number;
  purged: number;
  errors: number;
};

const defaultOptions: CleanupOptions = {
  intervalMs: Number(process.env.CLEANUP_INTERVAL_MS ?? 5 * 60 * 1000),
  batchSize: Number(process.env.CLEANUP_BATCH_SIZE ?? 200),
  softDeleteOnly: String(process.env.CLEANUP_SOFT_DELETE_ONLY ?? 'true').toLowerCase() !== 'false',
  purgeAfterHours: Number(process.env.CLEANUP_PURGE_AFTER_HOURS ?? 24),
};

let timer: NodeJS.Timeout | null = null;
let isRunning = false;
let currentRun: Promise<void> | null = null;
let opts: CleanupOptions = { ...defaultOptions };

export function startCleanup(overrides?: Partial<CleanupOptions>) {
  if (timer) return; // already started
  opts = { ...defaultOptions, ...(overrides || {}) };
  currentRun = runOnce().catch(() => {});
  timer = setInterval(() => {
    if (isRunning) return;
    currentRun = runOnce().catch(() => {});
  }, Math.max(30_000, opts.intervalMs));
  if (typeof (timer as any).unref === 'function') {
    (timer as any).unref();
  }
}

export async function stopCleanup() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (currentRun) {
    try { await currentRun; } catch { /* ignore */ }
    currentRun = null;
  }
}

export async function runOnce(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  const started = Date.now();
  const stats: CleanupStats = {
    scannedExpired: 0,
    scannedExhausted: 0,
    scannedPurge: 0,
    blobDeleted: 0,
    markedDeleted: 0,
    purged: 0,
    errors: 0,
  };
  try {
    const now = new Date();
    const purgeBefore = new Date(Date.now() - opts.purgeAfterHours * 60 * 60 * 1000);

    while (true) {
      const expired = await prisma.file.findMany({
        where: { isDeleted: false, expiresAt: { lte: now } },
        take: opts.batchSize,
        orderBy: { expiresAt: 'asc' },
      });
      if (!expired.length) break;
      stats.scannedExpired += expired.length;
      await processBatch(expired, stats, { markOnly: true });
      if (expired.length < opts.batchSize) break;
    }

    while (true) {
      const exhausted = await prisma.$queryRaw<FileModel[]>`
        SELECT * FROM "files"
        WHERE NOT "isDeleted"
          AND "downloadCount" >= "maxDownloads"
        ORDER BY "createdAt" ASC
        LIMIT ${opts.batchSize}
      `;
      if (!exhausted.length) break;
      stats.scannedExhausted += exhausted.length;
      await processBatch(exhausted, stats, { markOnly: true });
      if (exhausted.length < opts.batchSize) break;
    }

    if (!opts.softDeleteOnly) {
      while (true) {
        const oldDeleted = await prisma.file.findMany({
          where: { isDeleted: true, expiresAt: { lte: purgeBefore } },
          take: opts.batchSize,
          orderBy: { expiresAt: 'asc' },
        });
        if (!oldDeleted.length) break;
        stats.scannedPurge += oldDeleted.length;
        await processBatch(oldDeleted, stats, { purge: true });
        if (oldDeleted.length < opts.batchSize) break;
      }
    }
  } catch (err) {
    stats.errors += 1;
    console.error('cleanup run error:', err);
  } finally {
    const elapsed = Date.now() - started;
    isRunning = false;
    console.log(
      `cleanup: expired=${stats.scannedExpired} exhausted=${stats.scannedExhausted} purge=${stats.scannedPurge} ` +
      `blobDeleted=${stats.blobDeleted} marked=${stats.markedDeleted} purged=${stats.purged} errors=${stats.errors} ` +
      `elapsedMs=${elapsed}`
    );
  }
}

async function processBatch(rows: FileModel[], stats: CleanupStats, action: { markOnly?: boolean; purge?: boolean }) {
  for (const row of rows) {
    try {
      try {
        await storageService.delete(row.storagePath);
        stats.blobDeleted += 1;
      } catch (err: any) {
        if (!(err && err.code === 'ENOENT')) throw err;
      }

      if (action.purge) {
        await prisma.file.delete({ where: { token: row.token } });
        stats.purged += 1;
      } else if (action.markOnly) {
        if (!row.isDeleted) {
          await prisma.file.update({ where: { token: row.token }, data: { isDeleted: true } });
          stats.markedDeleted += 1;
        }
      }
    } catch (err) {
      stats.errors += 1;
      console.error('cleanup item error:', { token: row.token, err });
    }
  }
}
