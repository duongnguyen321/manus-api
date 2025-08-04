import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';
import sharp from 'sharp';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  CODE = 'code',
  ARCHIVE = 'archive',
  OTHER = 'other',
}

export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: FileType;
  mimeType: string;
  url: string;
  path: string;
  thumbnailUrl?: string;
  metadata: {
    dimensions?: { width: number; height: number };
    duration?: number;
    pageCount?: number;
    extractedText?: string;
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  };
  uploadedAt: Date;
  uploadedBy: string;
}

export interface FileProcessingOptions {
  generateThumbnail?: boolean;
  extractText?: boolean;
  aiAnalysis?: boolean;
  compress?: boolean;
  compressImages?: boolean;
  analyzeContent?: boolean;
  maxImageSize?: number;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedTypes: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly aiService: AIService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB
    this.allowedTypes = this.configService.get<string>('ALLOWED_FILE_TYPES', 
      'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/json,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ).split(',');

    this.initializeUploadDirectory();
  }

  private async initializeUploadDirectory(): Promise<void> {
    try {
      await mkdir(this.uploadDir, { recursive: true });
      await mkdir(path.join(this.uploadDir, 'thumbnails'), { recursive: true });
      await mkdir(path.join(this.uploadDir, 'processed'), { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to initialize upload directory: ${error.message}`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadedBy: string,
    options: FileProcessingOptions = {},
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileId = crypto.randomUUID();
      const fileExtension = path.extname(file.originalname);
      const filename = `${fileId}${fileExtension}`;
      const filePath = path.join(this.uploadDir, filename);

      // Save file to disk
      await writeFile(filePath, file.buffer);

      // Determine file type and metadata
      const fileType = this.determineFileType(file.mimetype);
      const metadata = await this.extractMetadata(filePath, file.mimetype, options);

      // Save file record to database
      const fileRecord = await this.prismaService.file.create({
        data: {
          id: fileId,
          filename,
          originalName: file.originalname,
          size: file.size,
          type: fileType,
          mimeType: file.mimetype,
          path: filePath,
          uploadedBy,
          metadata,
        },
      });

      // Process file asynchronously
      this.processFileAsync(fileId, filePath, file.mimetype, options).catch(error => {
        this.logger.error(`Async file processing failed: ${error.message}`);
      });

      const result: FileUploadResult = {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        size: fileRecord.size,
        type: fileType,
        mimeType: fileRecord.mimeType,
        url: `/files/${fileRecord.filename}`,
        path: fileRecord.path,
        thumbnailUrl: metadata.thumbnailUrl,
        metadata,
        uploadedAt: fileRecord.createdAt,
        uploadedBy: fileRecord.uploadedBy,
      };

      this.logger.log(`File uploaded successfully: ${file.originalname} (${fileId})`);
      return result;

    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`);
      throw error;
    }
  }

  async getFile(fileId: string, userId?: string): Promise<FileUploadResult | null> {
    try {
      const file = await this.prismaService.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        return null;
      }

      // Check access permissions (if needed)
      if (userId && file.uploadedBy !== userId && !await this.hasFileAccess(fileId, userId)) {
        throw new NotFoundException('File not found or access denied');
      }

      return {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        type: file.type as FileType,
        mimeType: file.mimeType,
        url: `/files/${file.filename}`,
        path: file.path,
        thumbnailUrl: (file.metadata as any)?.thumbnailUrl,
        metadata: file.metadata as any,
        uploadedAt: file.createdAt,
        uploadedBy: file.uploadedBy,
      };
    } catch (error) {
      this.logger.error(`Failed to get file: ${error.message}`);
      throw error;
    }
  }

  async getFileStream(filename: string): Promise<fs.ReadStream> {
    const filePath = path.join(this.uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return fs.createReadStream(filePath);
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const file = await this.prismaService.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      // Check permissions
      if (file.uploadedBy !== userId && !await this.hasFileAccess(fileId, userId)) {
        throw new BadRequestException('Access denied');
      }

      // Delete physical file
      try {
        await unlink(file.path);
        
        // Delete thumbnail if exists
        const thumbnailPath = path.join(this.uploadDir, 'thumbnails', `thumb_${file.filename}`);
        if (fs.existsSync(thumbnailPath)) {
          await unlink(thumbnailPath);
        }
      } catch (error) {
        this.logger.warn(`Failed to delete physical file: ${error.message}`);
      }

      // Delete database record
      await this.prismaService.file.delete({
        where: { id: fileId },
      });

      this.logger.log(`File deleted: ${file.originalName} (${fileId})`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  async listUserFiles(
    userId: string,
    options: {
      type?: FileType;
      limit?: number;
      offset?: number;
      search?: string;
    } = {},
  ): Promise<{
    files: FileUploadResult[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const { type, limit = 20, offset = 0, search } = options;

      const whereClause: any = { uploadedBy: userId };
      
      if (type) {
        whereClause.type = type;
      }
      
      if (search) {
        whereClause.originalName = {
          contains: search,
          mode: 'insensitive',
        };
      }

      const [files, total] = await Promise.all([
        this.prismaService.file.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prismaService.file.count({ where: whereClause }),
      ]);

      const result = files.map(file => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        type: file.type as FileType,
        mimeType: file.mimeType,
        url: `/files/${file.filename}`,
        path: file.path,
        thumbnailUrl: (file.metadata as any)?.thumbnailUrl,
        metadata: file.metadata as any,
        uploadedAt: file.createdAt,
        uploadedBy: file.uploadedBy,
      }));

      return {
        files: result,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      this.logger.error(`Failed to list user files: ${error.message}`);
      throw error;
    }
  }

  async analyzeFileContent(fileId: string, userId: string): Promise<{
    summary: string;
    insights: string[];
    tags: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
  }> {
    try {
      const file = await this.getFile(fileId, userId);
      if (!file) {
        throw new NotFoundException('File not found');
      }

      if (file.metadata.processingStatus !== 'completed') {
        throw new BadRequestException('File processing not completed');
      }

      const extractedText = file.metadata.extractedText;
      if (!extractedText) {
        throw new BadRequestException('No text content available for analysis');
      }

      // Use AI to analyze content
      const analysisPrompt = `
        Please analyze the following document content and provide:
        1. A brief summary (2-3 sentences)
        2. Key insights or important points (3-5 bullet points)
        3. Relevant tags/keywords (5-8 tags)
        4. Overall sentiment (positive, negative, or neutral)

        Document content:
        ${extractedText.substring(0, 8000)} ${extractedText.length > 8000 ? '...' : ''}

        Please format your response as JSON with the structure:
        {
          "summary": "...",
          "insights": ["...", "..."],
          "tags": ["...", "..."],
          "sentiment": "..."
        }
      `;

      const response = await this.aiService.generateText(analysisPrompt);
      
      try {
        const analysis = JSON.parse(response);
        
        // Update file metadata with analysis
        await this.prismaService.file.update({
          where: { id: fileId },
          data: {
            metadata: {
              ...file.metadata,
              analysis,
            },
          },
        });

        return analysis;
      } catch (parseError) {
        // Fallback if AI doesn't return valid JSON
        return {
          summary: 'AI analysis completed but could not parse structured response.',
          insights: [response.substring(0, 200) + '...'],
          tags: ['document', 'analyzed'],
          sentiment: 'neutral' as const,
        };
      }
    } catch (error) {
      this.logger.error(`File analysis failed: ${error.message}`);
      throw error;
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }
  }

  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text')) return FileType.DOCUMENT;
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return FileType.ARCHIVE;
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('xml')) return FileType.CODE;
    return FileType.OTHER;
  }

  private async extractMetadata(
    filePath: string,
    mimeType: string,
    options: FileProcessingOptions,
  ): Promise<any> {
    const metadata: any = {
      processingStatus: 'pending',
    };

    try {
      if (mimeType.startsWith('image/')) {
        const imageMetadata = await sharp(filePath).metadata();
        metadata.dimensions = {
          width: imageMetadata.width,
          height: imageMetadata.height,
        };

        if (options.generateThumbnail) {
          const thumbnailPath = await this.generateThumbnail(filePath);
          metadata.thumbnailUrl = `/files/thumbnails/${path.basename(thumbnailPath)}`;
        }
      }

      if (options.extractText) {
        metadata.extractedText = await this.extractTextFromFile(filePath, mimeType);
      }

      metadata.processingStatus = 'completed';
    } catch (error) {
      this.logger.error(`Metadata extraction failed: ${error.message}`);
      metadata.processingStatus = 'failed';
      metadata.error = error.message;
    }

    return metadata;
  }

  private async generateThumbnail(imagePath: string): Promise<string> {
    const filename = path.basename(imagePath);
    const thumbnailPath = path.join(this.uploadDir, 'thumbnails', `thumb_${filename}`);

    await sharp(imagePath)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  private async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        const pdfBuffer = await readFile(filePath);
        const data = await pdf(pdfBuffer);
        return data.text;
      }

      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const docBuffer = await readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: docBuffer });
        return result.value;
      }

      if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const workbook = XLSX.readFile(filePath);
        let text = '';
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          text += XLSX.utils.sheet_to_csv(worksheet) + '\n';
        });
        return text;
      }

      if (mimeType.startsWith('text/')) {
        return await readFile(filePath, 'utf-8');
      }

      return '';
    } catch (error) {
      this.logger.error(`Text extraction failed: ${error.message}`);
      return '';
    }
  }

  private async processFileAsync(
    fileId: string,
    filePath: string,
    mimeType: string,
    options: FileProcessingOptions,
  ): Promise<void> {
    try {
      const updates: any = {};

      // Generate thumbnail for images
      if (mimeType.startsWith('image/') && options.generateThumbnail) {
        const thumbnailPath = await this.generateThumbnail(filePath);
        updates['metadata.thumbnailUrl'] = `/files/thumbnails/${path.basename(thumbnailPath)}`;
      }

      // Compress images if requested
      if (mimeType.startsWith('image/') && options.compressImages) {
        await this.compressImage(filePath, options.maxImageSize || 1920);
      }

      // Extract text content
      if (options.extractText) {
        const extractedText = await this.extractTextFromFile(filePath, mimeType);
        updates['metadata.extractedText'] = extractedText;
      }

      // Analyze content with AI
      if (options.analyzeContent && updates['metadata.extractedText']) {
        const analysis = await this.generateContentAnalysis(updates['metadata.extractedText']);
        updates['metadata.analysis'] = analysis;
      }

      // Update file record
      await this.prismaService.file.update({
        where: { id: fileId },
        data: {
          metadata: {
            ...updates,
            processingStatus: 'completed',
          },
        },
      });

      this.logger.log(`File processing completed: ${fileId}`);
    } catch (error) {
      this.logger.error(`File processing failed: ${error.message}`);
      
      // Mark as failed
      await this.prismaService.file.update({
        where: { id: fileId },
        data: {
          metadata: {
            processingStatus: 'failed',
            error: error.message,
          },
        },
      });
    }
  }

  private async compressImage(imagePath: string, maxSize: number): Promise<void> {
    const tempPath = `${imagePath}.temp`;
    
    await sharp(imagePath)
      .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(tempPath);

    // Replace original with compressed version
    await fs.promises.rename(tempPath, imagePath);
  }

  private async generateContentAnalysis(text: string): Promise<any> {
    try {
      const prompt = `Analyze this document and provide a brief summary, key topics, and sentiment: ${text.substring(0, 2000)}`;
      const response = await this.aiService.generateText(prompt, { maxTokens: 500 });
      
      return {
        aiSummary: response,
        wordCount: text.split(/\s+/).length,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Content analysis failed: ${error.message}`);
      return null;
    }
  }

  private async hasFileAccess(fileId: string, userId: string): Promise<boolean> {
    // Implement file access control logic here
    // For now, allow access to all files
    return true;
  }

  // Utility methods for file management
  async getUserFiles(
    userId: string,
    options: {
      page: number;
      limit: number;
      mimeType?: string;
      search?: string;
    },
  ) {
    const skip = (options.page - 1) * options.limit;
    const where: any = { uploadedBy: userId };

    if (options.mimeType) {
      where.mimeType = options.mimeType;
    }

    if (options.search) {
      where.OR = [
        { originalName: { contains: options.search, mode: 'insensitive' } },
        { 'metadata.extractedText': { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [files, total] = await Promise.all([
      this.prismaService.file.findMany({
        where,
        skip,
        take: options.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          url: true,
          createdAt: true,
        },
      }),
      this.prismaService.file.count({ where }),
    ]);

    return {
      files,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }


  async analyzeFile(fileId: string, userId: string, customPrompt?: string) {
    const file = await this.getFile(fileId, userId);
    
    let textContent = file.metadata?.extractedText;
    if (!textContent) {
      // Try to extract text if not already done
      textContent = await this.extractTextFromFile(file.path, file.mimeType);
    }

    if (!textContent) {
      throw new BadRequestException('No text content available for analysis');
    }

    const prompt = customPrompt || 
      `Analyze this document and provide insights, summary, key topics, and sentiment analysis: ${textContent.substring(0, 3000)}`;

    try {
      const response = await this.aiService.generateText(prompt, { maxTokens: 1000 });
      
      const analysis = {
        response,
        customPrompt: customPrompt || null,
        analyzedAt: new Date().toISOString(),
        textLength: textContent.length,
      };

      // Update file with analysis
      await this.prismaService.file.update({
        where: { id: fileId },
        data: {
          metadata: {
            ...file.metadata,
            aiAnalysis: analysis,
          },
        },
      });

      return {
        analysis,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`File analysis failed: ${error.message}`);
      throw error;
    }
  }


  async getStorageStats(userId: string) {
    const [userFiles, userTotalSize, filesByType] = await Promise.all([
      this.prismaService.file.count({
        where: { uploadedBy: userId },
      }),
      this.prismaService.file.aggregate({
        where: { uploadedBy: userId },
        _sum: { size: true },
      }),
      this.prismaService.file.groupBy({
        where: { uploadedBy: userId },
        by: ['type'],
        _count: { type: true },
        _sum: { size: true },
      }),
    ]);

    const sizeByType = filesByType.reduce((acc, item) => {
      acc[item.type] = item._sum.size || 0;
      return acc;
    }, {} as Record<string, number>);

    const totalSize = userTotalSize._sum.size || 0;
    const quotaLimit = 1024 * 1024 * 1024; // 1GB per user
    const quotaPercentage = (totalSize / quotaLimit) * 100;

    return {
      totalFiles: userFiles,
      totalSize,
      sizeByType,
      quotaUsed: totalSize,
      quotaLimit,
      quotaPercentage: Math.min(quotaPercentage, 100),
    };
  }

  async getStorageStatistics(): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<FileType, { count: number; size: number }>;
    recentUploads: number;
  }> {
    try {
      const [totalFiles, totalSize, filesByType, recentUploads] = await Promise.all([
        this.prismaService.file.count(),
        this.prismaService.file.aggregate({
          _sum: { size: true },
        }),
        this.prismaService.file.groupBy({
          by: ['type'],
          _count: { type: true },
          _sum: { size: true },
        }),
        this.prismaService.file.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      const byType = filesByType.reduce((acc, item) => {
        acc[item.type as FileType] = {
          count: item._count.type,
          size: item._sum.size || 0,
        };
        return acc;
      }, {} as Record<FileType, { count: number; size: number }>);

      return {
        totalFiles,
        totalSize: totalSize._sum.size || 0,
        byType,
        recentUploads,
      };
    } catch (error) {
      this.logger.error(`Failed to get storage statistics: ${error.message}`);
      throw error;
    }
  }

  async cleanupExpiredFiles(): Promise<void> {
    try {
      const retentionDays = this.configService.get<number>('FILE_RETENTION_DAYS', 30);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const expiredFiles = await this.prismaService.file.findMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      for (const file of expiredFiles) {
        try {
          await unlink(file.path);
          await this.prismaService.file.delete({ where: { id: file.id } });
          this.logger.log(`Deleted expired file: ${file.originalName}`);
        } catch (error) {
          this.logger.error(`Failed to delete expired file ${file.id}: ${error.message}`);
        }
      }

      this.logger.log(`Cleanup completed: ${expiredFiles.length} files processed`);
    } catch (error) {
      this.logger.error(`File cleanup failed: ${error.message}`);
    }
  }
}