import { Router, Request, Response } from 'express';
import upload from '../middleware/upload';
import { validateUploadOptions } from '../middleware/validation';
import { generateToken } from '../utils/token';
import * as fileService from '../services/fileService';
import { storageService } from '../services/storageService';
import { env } from '../env';
const router = Router();

router.post('/upload', upload.single('file'), validateUploadOptions, async (req: Request, res: Response) => {
  const f = (req as any).file as Express.Multer.File | undefined;
  if (!f) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'No file uploaded' } });
  }
  const token = generateToken();
  const validated = (res as any).locals?.validatedUpload as { expiresAt?: Date; maxDownloads?: number } | undefined;
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
    expiresAt: validated?.expiresAt,
    maxDownloads: validated?.maxDownloads,
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
        size: record.size,
      },
      expiresAt: record.expiresAt,
      maxDownloads: record.maxDownloads,
    },
  });
});

export default router;