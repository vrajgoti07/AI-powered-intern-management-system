import { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { errorResponse } from '../utils/response';

// Ensure local uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Filename Sanitizer: renames every uploaded file to {uuid}.{original_extension}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

// 2. Multer limits and allowed MIME types check (image/jpeg, image/png, application/pdf)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Rejects with a custom MulterError to return 400 later
    cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
  }
};

const uploadInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // file count limit 1
  }
});

/**
 * Reads the first 4 bytes of the uploaded file to verify that magic bytes match the MIME type.
 * Rejects if there is a mismatch.
 */
export const validateFileContent = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    next();
    return;
  }

  try {
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(req.file.path, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    const mime = req.file.mimetype;
    const hex = buffer.toString('hex').toLowerCase();

    let isMatch = false;
    if (mime === 'image/jpeg') {
      isMatch = hex.startsWith('ffd8ff');
    } else if (mime === 'image/png') {
      isMatch = hex.startsWith('89504e47');
    } else if (mime === 'application/pdf') {
      isMatch = hex.startsWith('25504446');
    }

    if (!isMatch) {
      // Clean up the invalid file from local disk storage
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      errorResponse(
        res,
        'Content mismatch. The uploaded file content does not match its declared type.',
        422,
        'Content Mismatch'
      );
      return;
    }

    next();
  } catch (error) {
    // Clean up if validation fails or errors out
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    errorResponse(res, 'Failed to validate file content.', 500);
  }
};

/**
 * Combined upload validation middleware.
 * Orchestrates Multer upload, handles potential errors (size limit, file type limit), 
 * and performs deep magic bytes content verification.
 */
export const uploadValidation = (req: Request, res: Response, next: NextFunction): void => {
  uploadInstance.single('file')(req, res, (err: any) => {
    if (err) {
      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          errorResponse(
            res,
            'File too large. Maximum size allowed is 5MB.',
            413,
            'File Too Large'
          );
          return;
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          errorResponse(
            res,
            'Invalid file type. Only JPEG, PNG, and PDF files are allowed.',
            400,
            'Wrong File Type'
          );
          return;
        }
      }
      errorResponse(res, err.message || 'File upload failed.', 400);
      return;
    }

    // Perform deep content verification using magic bytes
    validateFileContent(req, res, next);
  });
};

export default uploadValidation;
