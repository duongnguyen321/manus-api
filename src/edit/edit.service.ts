import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { SessionService } from '../session/session.service';
import { AIService } from '../ai/ai.service';
import {
  EditRequestDto,
  CreateFileDto,
  UpdateFileDto,
  RefactorCodeDto,
  EditTaskResponseDto,
  EditHistoryResponseDto,
} from './dto/edit.dto';
import { EditOperation, TaskStatus, SessionStatus } from '@prisma/client';

@Injectable()
export class EditService {
  private readonly logger = new Logger(EditService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private sessionService: SessionService,
    private aiService: AIService,
  ) {}

  async editContent(editRequestDto: EditRequestDto): Promise<EditTaskResponseDto> {
    const { sessionId, operation, target, instruction, originalContent, processInBackground = true, priority = 0 } = editRequestDto;

    try {
      // Verify session exists and is active
      const session = await this.validateSession(sessionId);

      // Create edit task
      const editTask = await this.prisma.editTask.create({
        data: {
          sessionId: session.id,
          operation,
          target,
          instruction,
          originalContent,
          status: processInBackground ? TaskStatus.PENDING : TaskStatus.IN_PROGRESS,
        },
      });

      let queueJobId: string | undefined;

      if (processInBackground) {
        // Add task to processing queue
        const job = await this.queueService.addEditJob({
          sessionId: session.id,
          taskId: editTask.id,
          taskType: 'edit',
          payload: {
            operation,
            target,
            instruction,
            originalContent,
          },
          priority,
        });

        queueJobId = job.id.toString();

        // Update task with job ID
        await this.prisma.editTask.update({
          where: { id: editTask.id },
          data: { queueJobId },
        });

        this.logger.log(`Edit task queued for background processing: ${editTask.id}, Job: ${queueJobId}`);
      } else {
        // Process immediately (synchronous)
        await this.processEditSync(editTask);
      }

      // Update session last accessed
      await this.prisma.aISession.update({
        where: { id: session.id },
        data: { lastAccessedAt: new Date() },
      });

      return this.mapTaskToResponse(editTask, queueJobId);

    } catch (error) {
      this.logger.error(`Failed to create edit task for session ${sessionId}: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create edit task: ${error.message}`);
    }
  }

  async createFile(createFileDto: CreateFileDto): Promise<EditTaskResponseDto> {
    const { sessionId, filePath, content, processInBackground } = createFileDto;

    return this.editContent({
      sessionId,
      operation: EditOperation.CREATE,
      target: filePath,
      instruction: `Create file with content`,
      originalContent: content,
      processInBackground,
    });
  }

  async updateFile(updateFileDto: UpdateFileDto): Promise<EditTaskResponseDto> {
    const { sessionId, filePath, instruction, originalContent, processInBackground } = updateFileDto;

    return this.editContent({
      sessionId,
      operation: EditOperation.UPDATE,
      target: filePath,
      instruction,
      originalContent,
      processInBackground,
    });
  }

  async deleteFile(sessionId: string, filePath: string, processInBackground: boolean = true): Promise<EditTaskResponseDto> {
    return this.editContent({
      sessionId,
      operation: EditOperation.DELETE,
      target: filePath,
      instruction: `Delete file: ${filePath}`,
      processInBackground,
    });
  }

  async refactorCode(refactorCodeDto: RefactorCodeDto): Promise<EditTaskResponseDto> {
    const { sessionId, target, instruction, originalContent, refactoringType, processInBackground } = refactorCodeDto;

    return this.editContent({
      sessionId,
      operation: EditOperation.REFACTOR,
      target,
      instruction: `${instruction} (Type: ${refactoringType || 'general'})`,
      originalContent,
      processInBackground,
    });
  }

  async formatCode(sessionId: string, target: string, originalContent?: string, processInBackground: boolean = true): Promise<EditTaskResponseDto> {
    return this.editContent({
      sessionId,
      operation: EditOperation.FORMAT,
      target,
      instruction: 'Format and beautify code',
      originalContent,
      processInBackground,
    });
  }

  async getEditTask(taskId: string): Promise<EditTaskResponseDto> {
    const task = await this.prisma.editTask.findUnique({
      where: { id: taskId },
      include: {
        queueJob: {
          select: { id: true, status: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Edit task with ID ${taskId} not found`);
    }

    return this.mapTaskToResponse(task);
  }

  async getEditHistory(
    sessionId: string,
    page: number = 1,
    limit: number = 20,
    operation?: EditOperation
  ): Promise<EditHistoryResponseDto> {
    const session = await this.validateSession(sessionId);
    const skip = (page - 1) * limit;

    const whereClause: any = { sessionId: session.id };
    if (operation) {
      whereClause.operation = operation;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.editTask.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          queueJob: {
            select: { id: true, status: true },
          },
        },
      }),
      this.prisma.editTask.count({
        where: whereClause,
      }),
    ]);

    return {
      tasks: tasks.map(task => this.mapTaskToResponse(task)),
      total,
      page,
      limit,
      sessionId,
    };
  }

  async cancelEditTask(taskId: string): Promise<void> {
    const task = await this.prisma.editTask.findUnique({
      where: { id: taskId },
      include: { queueJob: true },
    });

    if (!task) {
      throw new NotFoundException(`Edit task with ID ${taskId} not found`);
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed task');
    }

    try {
      // If task has a queue job, try to cancel it
      if (task.queueJobId && task.queueJob?.jobId) {
        await this.queueService.removeJob(task.queueJob.jobId);
      }

      // Update task status
      await this.prisma.editTask.update({
        where: { id: taskId },
        data: { 
          status: TaskStatus.CANCELLED,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Edit task cancelled: ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel edit task ${taskId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to cancel edit task');
    }
  }

  async deleteEditTask(taskId: string): Promise<void> {
    const task = await this.prisma.editTask.findUnique({
      where: { id: taskId },
      include: { queueJob: true },
    });

    if (!task) {
      throw new NotFoundException(`Edit task with ID ${taskId} not found`);
    }

    try {
      // Cancel if still processing
      if (task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS) {
        await this.cancelEditTask(taskId);
      }

      // Delete the task
      await this.prisma.editTask.delete({
        where: { id: taskId },
      });

      this.logger.log(`Edit task deleted: ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to delete edit task ${taskId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete edit task');
    }
  }

  async retryEditTask(taskId: string): Promise<EditTaskResponseDto> {
    const task = await this.prisma.editTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Edit task with ID ${taskId} not found`);
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Cannot retry completed task');
    }

    if (task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.PENDING) {
      throw new BadRequestException('Task is already processing');
    }

    try {
      // Reset task status
      const updatedTask = await this.prisma.editTask.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.PENDING,
          modifiedContent: null,
          completedAt: null,
          queueJobId: null,
        },
      });

      // Add to queue again
      const job = await this.queueService.addEditJob({
        sessionId: task.sessionId,
        taskId: task.id,
        taskType: 'edit',
        payload: {
          operation: task.operation,
          target: task.target,
          instruction: task.instruction,
          originalContent: task.originalContent,
        },
        priority: 5, // Higher priority for retries
      });

      // Update with new job ID
      await this.prisma.editTask.update({
        where: { id: taskId },
        data: { queueJobId: job.id.toString() },
      });

      this.logger.log(`Edit task retried: ${taskId}, Job: ${job.id}`);

      return this.mapTaskToResponse(updatedTask, job.id.toString());
    } catch (error) {
      this.logger.error(`Failed to retry edit task ${taskId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retry edit task');
    }
  }

  private async validateSession(sessionId: string): Promise<any> {
    const session = await this.prisma.aISession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.status === SessionStatus.EXPIRED) {
      throw new BadRequestException('Session has expired');
    }

    if (session.expiresAt && session.expiresAt < new Date()) {
      throw new BadRequestException('Session has expired');
    }

    return session;
  }

  private async processEditSync(task: any): Promise<void> {
    const startTime = Date.now();

    try {
      let modifiedContent: string;

      switch (task.operation) {
        case EditOperation.CREATE:
          modifiedContent = await this.processCreateOperation(task);
          break;
        case EditOperation.UPDATE:
          modifiedContent = await this.processUpdateOperation(task);
          break;
        case EditOperation.DELETE:
          modifiedContent = '';
          break;
        case EditOperation.REFACTOR:
          modifiedContent = await this.processRefactorOperation(task);
          break;
        case EditOperation.FORMAT:
          modifiedContent = await this.processFormatOperation(task);
          break;
        default:
          modifiedContent = task.originalContent || 'Processed content';
      }

      const processingTime = Date.now() - startTime;

      await this.prisma.editTask.update({
        where: { id: task.id },
        data: {
          modifiedContent,
          status: TaskStatus.COMPLETED,
          completedAt: new Date(),
          metadata: {
            processingTime,
            operation: task.operation,
            aiProcessed: true,
          },
        },
      });

      this.logger.log(`Edit task completed in ${processingTime}ms: ${task.id}`);
    } catch (error) {
      this.logger.error(`Failed to process edit task ${task.id}: ${error.message}`);
      
      await this.prisma.editTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.FAILED,
          completedAt: new Date(),
          modifiedContent: task.originalContent,
          metadata: {
            error: error.message,
            processingTime: Date.now() - startTime,
          },
        },
      });
    }
  }

  private async processCreateOperation(task: any): Promise<string> {
    if (task.originalContent) {
      return task.originalContent;
    }

    const prompt = `Create a new file for "${task.target}" based on this instruction: ${task.instruction}

Please generate appropriate content based on the file extension and instruction. Return only the file content without any explanations.`;

    try {
      const content = await this.aiService.generateText(prompt, {
        maxTokens: 2000,
        temperature: 0.3,
      });
      return content.trim();
    } catch (error) {
      this.logger.error(`Failed to generate content for CREATE operation: ${error.message}`);
      return `// New file: ${task.target}\n// Generated from instruction: ${task.instruction}\n\n// TODO: Implement content`;
    }
  }

  private async processUpdateOperation(task: any): Promise<string> {
    const prompt = `Update the following code based on the instruction.

Original code:
\`\`\`
${task.originalContent || '// No original content provided'}
\`\`\`

Instruction: ${task.instruction}

Please return the updated code without any explanations. Maintain the original structure and add/modify only what's necessary.`;

    try {
      const updatedContent = await this.aiService.generateText(prompt, {
        maxTokens: 3000,
        temperature: 0.2,
      });
      return updatedContent.trim();
    } catch (error) {
      this.logger.error(`Failed to process UPDATE operation: ${error.message}`);
      return `// Updated: ${task.instruction}\n${task.originalContent || 'Original content'}\n// AI processing failed, manual review needed`;
    }
  }

  private async processRefactorOperation(task: any): Promise<string> {
    const prompt = `Refactor the following code according to the instruction. Focus on improving code quality, readability, and maintainability.

Original code:
\`\`\`
${task.originalContent || '// No original content provided'}
\`\`\`

Refactoring instruction: ${task.instruction}

Please return the refactored code without any explanations. Ensure the functionality remains the same but the code is improved.`;

    try {
      const refactoredContent = await this.aiService.generateText(prompt, {
        maxTokens: 4000,
        temperature: 0.1,
      });
      return refactoredContent.trim();
    } catch (error) {
      this.logger.error(`Failed to process REFACTOR operation: ${error.message}`);
      return `// Refactored: ${task.instruction}\n${task.originalContent || 'Original code'}\n// AI refactoring failed, manual review needed`;
    }
  }

  private async processFormatOperation(task: any): Promise<string> {
    const content = task.originalContent || 'function example() { return true; }';
    const fileExt = task.target ? task.target.split('.').pop()?.toLowerCase() : 'js';
    
    const prompt = `Format and beautify the following ${fileExt} code. Apply proper indentation, spacing, and code style conventions.

Code to format:
\`\`\`
${content}
\`\`\`

Please return only the formatted code without any explanations or markdown blocks.`;

    try {
      const formattedContent = await this.aiService.generateText(prompt, {
        maxTokens: 2000,
        temperature: 0.1,
      });
      return formattedContent.trim();
    } catch (error) {
      this.logger.error(`Failed to process FORMAT operation: ${error.message}`);
      // Fallback to basic formatting
      return this.basicFormatContent(content);
    }
  }

  private basicFormatContent(content: string): string {
    // Basic formatting fallback
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, index, arr) => {
        if (line.includes('{') && !line.includes('}')) {
          return line;
        }
        if (line.includes('}') && !line.includes('{')) {
          return line;
        }
        return line;
      })
      .join('\n');
  }

  private mapTaskToResponse(task: any, queueJobId?: string): EditTaskResponseDto {
    return {
      id: task.id,
      sessionId: task.sessionId,
      operation: task.operation,
      target: task.target,
      instruction: task.instruction,
      originalContent: task.originalContent,
      modifiedContent: task.modifiedContent,
      status: task.status,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      queueJobId: queueJobId || task.queueJobId,
    };
  }
}