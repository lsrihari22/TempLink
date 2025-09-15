import { Router, Request, Response } from 'express';
import path from 'path';
import { consumeDownload, get, markDeleted } from '../services/fileService';
import { storageService } from '../services/storageService';

const router = Router();

router.get('/file/:token/download', (req: Request, res: Response) => {
  const { token } = req.params;
  const result = consumeDownload(token);

  if (!result) {
    const rec = get(token);
    if (!rec) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
    }
    return res.status(410).json({ error: { code: 'GONE', message: 'File unavailable (expired, deleted, or download limit reached)' } });
  }

  const { record, shouldDelete } = result;
  const safeName = path.basename(record.originalName).replace(/"/g, '');

  res.setHeader('Content-Type', record.mimeType);
  if (record.size) res.setHeader('Content-Length', String(record.size));
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

  const stream = storageService.getStream(record.storageKey);
  stream.on('error', (err) => {
    console.error('Stream error:', err);
    return res.status(410).json({ error: { code: 'GONE', message: 'File not available' } });
  });

  stream.pipe(res);

  res.on('finish', () => {
    if (shouldDelete) {
      storageService.delete(record.storageKey).catch(() => {});
      markDeleted(token);
    }
  });
});

export default router;
