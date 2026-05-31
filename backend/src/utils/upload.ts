import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { config } from '../config/env';
import { Request } from 'express';
import fs from 'fs';
import path from 'path';

// Ensure local uploads directory exists
const localUploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, localUploadsDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const isCloudinaryConfigured = !!config.cloudinary.cloudName && !!config.cloudinary.apiKey;

// Cloudinary storage for task files
const taskStorage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req: Request, file: Express.Multer.File) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'intern-management/tasks',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'zip'],
      resource_type: isImage ? 'image' : 'raw',
      public_id: `task-${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
}) : localStorage;

// Cloudinary storage for resumes
const resumeStorage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req: Request, file: Express.Multer.File) => {
    return {
      folder: 'intern-management/resumes',
      allowed_formats: ['pdf', 'doc', 'docx'],
      resource_type: 'raw',
      public_id: `resume-${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
}) : localStorage;

// Cloudinary storage for certificates/onboarding documents
const certificateStorage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req: Request, file: Express.Multer.File) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'intern-management/certificates',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'zip'],
      resource_type: isImage ? 'image' : 'raw',
      public_id: `certificate-${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
}) : localStorage;

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, PDF, DOC, DOCX, and ZIP files are allowed.'));
  }
};

// Multer upload instances
export const uploadTaskFile = multer({
  storage: taskStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export const uploadChatFile = multer({
  storage: taskStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (allows all mime-types, e.g. audio/webm, for chat)
  },
});

export const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const uploadCertificate = multer({
  storage: certificateStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  if (!isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};
