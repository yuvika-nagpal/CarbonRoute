import multer from 'multer';
import path from 'path';

// Store files in memory buffer so our Storage Provider can process checksums and stream to S3/Disk
const storage = multer.memoryStorage();

const allowedExtensions = [
  '.pdf', '.ppt', '.pptx', '.key', '.zip', '.tar', '.gz',
  '.md', '.txt', '.doc', '.docx', '.json', '.csv', '.png', '.jpg', '.jpeg', '.svg'
];

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 Megabytes max limit
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${ext}". Allowed types: ${allowedExtensions.join(', ')}`));
    }
  },
});
