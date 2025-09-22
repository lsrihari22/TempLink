import { Router, Request, Response } from 'express';
import path from 'path';
import { consumeDownload, get, markDeleted } from '../services/fileService';
import { storageService } from '../services/storageService';
import { validateTokenParam } from '../middleware/validation';

const router = Router();

router.get('/file/:token/download', validateTokenParam, async (req: Request, res: Response) => {
  const { token } = req.params;
  const result = await consumeDownload(token);

  if (!result) {
    const row = await get(token);
    if (!row) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
    }else if (row.isDeleted) {
      return res.status(410).json({ error: { code: 'DELETED', message: 'File has been deleted' } });
    }else if (row.expiresAt <= new Date()) {
      return res.status(410).json({ error: { code: 'EXPIRED', message: 'File has expired' } });
    }
    return res.status(410).json({ error: { code: 'LIMIT_REACHED', message: 'File download limit reached' } });
  }

  const { record, shouldDelete } = result;
  const safeName = path.basename(record.originalName).replace(/[\r\n\t\0"<>:|?*]+/g, '');

  res.setHeader('Content-Type', record.mimeType);
  if (record.size) res.setHeader('Content-Length', String(record.size));
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

  const stream = storageService.getStream(record.storageKey);
  stream.on('error', (err) => {
    console.error('Stream error:', err);
    return res.status(410).json({ error: { code: 'DELETED', message: 'File not available' } });
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
