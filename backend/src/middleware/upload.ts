// TODO: Multer setup and file validation middleware
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'

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

const limits = { fileSize: 50 * 1024 * 1024 }; // 50MB limit
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/', 'application/pdf']; //Add more types as needed
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .png, and .pdf files allowed!'), false);
    }
}

const upload = multer({ storage, limits, fileFilter });

export default upload ; 