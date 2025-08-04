import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import * as multer from 'multer';

export const multerConfig: MulterOptions = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    // Allow common file types
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/rtf',
      
      // Code files
      'text/javascript',
      'application/json',
      'text/html',
      'text/css',
      'application/xml',
      'text/xml',
      'application/x-python-code',
      'text/x-python',
      
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/webm',
      'audio/flac',
      
      // Video
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/quicktime',
      
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-tar',
      'application/gzip',
      'application/x-7z-compressed',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          `File type '${file.mimetype}' is not supported. Allowed types: ${allowedMimeTypes.join(', ')}`
        ),
        false
      );
    }
  },
};