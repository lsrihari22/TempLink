// TODO: Multer setup and file validation middleware
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../env';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.resolve(__dirname, '../../../uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

const limits = { fileSize: env.MAX_FILE_SIZE_BYTES };
const fileFilter: import('multer').Options['fileFilter'] = (_req, file, cb) => {
  const mime = String(file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();

  const mimeAllowed = env.ALLOWED_MIME_SET ? env.ALLOWED_MIME_SET.has(mime) : true;
  const extAllowed = env.ALLOWED_EXT_SET ? env.ALLOWED_EXT_SET.has(ext) : true;

  if (!mimeAllowed || !extAllowed) {
    const err: any = new Error('Invalid file type');
    err.name = 'MulterError';
    err.code = 'INVALID_FILE_TYPE';
    return cb(err);
  }
  return cb(null, true);
};

const upload = multer({ storage, limits, fileFilter });

export default upload ; 
