import { Router, Request, Response } from 'express';
import upload from '../middleware/upload';
import { generateToken } from '../utils/token';
import * as fileService from '../services/fileService';
import { env } from '../env';
import { storageService } from '../services/storageService';

const router = Router();

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  const f = (req as any).file as Express.Multer.File | undefined;
  const expiresAtRaw = (req as any).body?.expiresAt as string | undefined;
  const maxDownloadsRaw = (req as any).body?.maxDownloads as string | number | undefined;
  
  if (!f) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'No file uploaded' } });
  }
  // console.log(f);
  const currentTime = Date.now();

  const token = generateToken();
  const parsedExpiresAt = expiresAtRaw ? new Date(expiresAtRaw) : undefined;
  const expiresAtValid = parsedExpiresAt && !isNaN(parsedExpiresAt.getTime()) ? (parsedExpiresAt.getTime() > currentTime)? parsedExpiresAt : undefined : undefined;
  const parsedMaxDownloads = typeof maxDownloadsRaw === 'string' ? parseInt(maxDownloadsRaw, 10) : (typeof maxDownloadsRaw === 'number' ? maxDownloadsRaw : undefined);
  if (parsedMaxDownloads && parsedMaxDownloads > 10) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'maxDownloads cannot exceed 10' } });
  }

  // Move file into managed storage and get a stable storageKey
  // Note: Multer used disk storage; (f as any).path is the temp path
  const saved = await storageService.saveFromDisk((f as any).path, {
    token,
    originalName: f.originalname,
    mimeType: f.mimetype,
  });

  const record = fileService.create({
    token,
    storageKey: saved.storageKey,
    originalName: f.originalname,
    mimeType: f.mimetype,
    size: saved.size ?? f.size,
    expiresAt: expiresAtValid,
    maxDownloads: parsedMaxDownloads,
  });

  const relativeInfoUrl = `/api/file/${token}/info`;
  const relativeDownloadUrl = `/api/file/${token}/download`;
  let absoluteLinks: { info: string; download: string } | undefined;
  if (env.PUBLIC_BASE_URL) {
    absoluteLinks = {
      info: `${env.PUBLIC_BASE_URL}${relativeInfoUrl}`,
      download: `${env.PUBLIC_BASE_URL}${relativeDownloadUrl}`,
    };
  }

  res.status(200).json({
    data: {
      token,
      links: {
        relative: { info: relativeInfoUrl, download: relativeDownloadUrl },
        absolute: absoluteLinks,
      },
      file: {
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
      },
      expiresAt: record.expiresAt,
      maxDownloads: record.maxDownloads,
    },
  });
});

export default router;
