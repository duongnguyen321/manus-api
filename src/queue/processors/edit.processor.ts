import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue.service';
import { AIService } from '../../ai/ai.service';
import { JobStatus, EditOperation, TaskStatus } from '@prisma/client';

@Processor('file-editing')
export class EditProcessor {
  private readonly logger = new Logger(EditProcessor.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private aiService: AIService,
  ) {}

  @Process('edit-file')
  async processEditTask(job: Job): Promise<any> {
    const { sessionId, taskId, payload } = job.data;
    
    try {
      await this.queueService.updateJobStatus(job.id.toString(), JobStatus.ACTIVE);
      
      this.logger.log(`Processing edit task for session: ${sessionId}`);

      // Get or create edit task
      let editTask;
      if (taskId) {
        editTask = await this.prisma.editTask.findUnique({
          where: { id: taskId },
        });
      }

      if (!editTask) {
        editTask = await this.prisma.editTask.create({
          data: {
            sessionId,
            operation: payload.operation as EditOperation,
            target: payload.target,
            instruction: payload.instruction,
            originalContent: payload.originalContent,
            status: TaskStatus.IN_PROGRESS,
            queueJobId: await this.getQueueJobId(job.id.toString()),
          },
        });
      } else {
        await this.prisma.editTask.update({
          where: { id: taskId },
          data: { 
            status: TaskStatus.IN_PROGRESS,
            queueJobId: await this.getQueueJobId(job.id.toString()),
          },
        });
      }

      // Execute edit operation
      const result = await this.executeEditOperation(editTask, payload);

      // Update task with result
      await this.prisma.editTask.update({
        where: { id: editTask.id },
        data: {
          modifiedContent: result.modifiedContent,
          status: TaskStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await this.queueService.updateJobStatus(job.id.toString(), JobStatus.COMPLETED, result);
      
      this.logger.log(`Edit task completed for session: ${sessionId}`);
      return result;

    } catch (error) {
      this.logger.error(`Edit task failed for session ${sessionId}: ${error.message}`, error.stack);
      
      if (taskId) {
        await this.prisma.editTask.update({
          where: { id: taskId },
          data: { status: TaskStatus.FAILED },
        });
      }
      
      await this.queueService.updateJobStatus(job.id.toString(), JobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  private async executeEditOperation(task: any, payload: any): Promise<any> {
    const startTime = Date.now();
    const operation = task.operation as EditOperation;
    let modifiedContent: string;
    let metadata: any = {};

    try {
      switch (operation) {
        case EditOperation.CREATE:
          modifiedContent = await this.aiService.createFile(task.instruction, task.target);
          metadata = { operation: 'create', target: task.target };
          break;

        case EditOperation.UPDATE:
          modifiedContent = await this.aiService.editFile(
            task.originalContent || '',
            task.instruction,
            task.target
          );
          metadata = { operation: 'update', target: task.target };
          break;

        case EditOperation.DELETE:
          modifiedContent = '';
          metadata = { operation: 'delete', target: task.target };
          break;

        case EditOperation.REFACTOR:
          modifiedContent = await this.aiService.refactorCode(
            task.originalContent || '',
            task.instruction,
            this.getLanguageFromTarget(task.target)
          );
          metadata = { operation: 'refactor', target: task.target, language: this.getLanguageFromTarget(task.target) };
          break;

        case EditOperation.FORMAT:
          modifiedContent = await this.aiService.formatCode(
            task.originalContent || '',
            this.getLanguageFromTarget(task.target)
          );
          metadata = { operation: 'format', target: task.target, language: this.getLanguageFromTarget(task.target) };
          break;

        default:
          throw new Error(`Unsupported edit operation: ${operation}`);
      }

      const processingTime = Date.now() - startTime;
      metadata.processingTime = processingTime;
      metadata.taskId = task.id;

      return {
        success: true,
        operation,
        target: task.target,
        originalContent: task.originalContent,
        modifiedContent,
        metadata,
      };
    } catch (error) {
      this.logger.error(`Edit operation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getLanguageFromTarget(target: string): string {
    const extension = target.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
    };

    return languageMap[extension || ''] || 'text';
  }

  private async getQueueJobId(jobId: string): Promise<string> {
    const queueJob = await this.prisma.queueJob.findUnique({
      where: { jobId },
      select: { id: true },
    });
    return queueJob?.id;
  }
}