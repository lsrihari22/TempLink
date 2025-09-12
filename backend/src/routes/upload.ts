import { Router, Request, Response } from 'express';
import upload from '../middleware/upload';
import { generateToken } from '../utils/token';
import * as fileService from '../services/fileService';

const router = Router();

router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  const f = (req as any).file as Express.Multer.File | undefined;
  const expiresAtRaw = (req as any).body?.expiresAt as string | undefined;
  const maxDownloadsRaw = (req as any).body?.maxDownloads as string | number | undefined;

  if (!f) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const token = generateToken();
  const parsedExpiresAt = expiresAtRaw ? new Date(expiresAtRaw) : undefined;
  const expiresAtValid = parsedExpiresAt && !isNaN(parsedExpiresAt.getTime()) ? parsedExpiresAt : undefined;
  const parsedMaxDownloads = typeof maxDownloadsRaw === 'string' ? parseInt(maxDownloadsRaw, 10) : (typeof maxDownloadsRaw === 'number' ? maxDownloadsRaw : undefined);

  fileService.create({
    token,
    storagePath: (f as any).path,
    originalName: f.originalname,
    mimeType: f.mimetype,
    size: f.size,
    expiresAt: expiresAtValid,
    maxDownloads: parsedMaxDownloads,
  });

  const base = `${req.protocol}://${req.get('host')}`;
  const relativeInfoUrl = `/api/file/${token}/info`;
  const relativeDownloadUrl = `/api/file/${token}/download`;
  const infoUrl = `${base}${relativeInfoUrl}`;
  const downloadUrl= `${base}${relativeDownloadUrl}`;

  res.status(200).json({
    token,
    infoUrl,
    downloadUrl,
    relativeInfoUrl,
    relativeDownloadUrl,
    message: 'File uploaded successfully',
    file: {
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
    },
  });
});

export default router;
