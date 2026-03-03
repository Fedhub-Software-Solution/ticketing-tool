import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config } from '../config';

const UPLOAD_BASE = config.uploadDir;

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const ticketId = req.params.id;
    if (!ticketId) {
      cb(new Error('Missing ticket id'));
      return;
    }
    const dir = path.join(UPLOAD_BASE, 'tickets', ticketId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_') || 'file';
    const unique = crypto.randomBytes(8).toString('hex');
    cb(null, `${unique}-${base}${ext}`);
  },
});

export const uploadAttachment = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single('file');
