import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { SessionService } from '../session/session.service';
import {
  GenerateRequestDto,
  GenerateTextDto,
  GenerateCodeDto,
  GenerateImageDto,
  GenerationTaskResponseDto,
  GenerationHistoryResponseDto,
} from './dto/generate.dto';
import { GenerationType, TaskStatus, SessionStatus } from '@prisma/client';

@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private sessionService: SessionService,
  ) {}

  async generateContent(generateRequestDto: GenerateRequestDto): Promise<GenerationTaskResponseDto> {
    const { sessionId, type, prompt, parameters, processInBackground = true, priority = 0 } = generateRequestDto;

    try {
      // Verify session exists and is active
      const session = await this.validateSession(sessionId);

      // Create generation task
      const generationTask = await this.prisma.generationTask.create({
        data: {
          sessionId: session.id,
          taskType: type,
          prompt,
          parameters: parameters || {},
          status: processInBackground ? TaskStatus.PENDING : TaskStatus.IN_PROGRESS,
        },
      });

      let queueJobId: string | undefined;

      if (processInBackground) {
        // Add task to processing queue
        const job = await this.queueService.addGenerationJob(
          type === GenerationType.TEXT ? 'text' : 
          type === GenerationType.CODE ? 'code' : 'image',
          {
            sessionId: session.id,
            taskId: generationTask.id,
            taskType: 'generation',
            payload: {
              prompt,
              parameters,
            },
            priority,
          }
        );

        queueJobId = job.id.toString();

        // Update task with job ID
        await this.prisma.generationTask.update({
          where: { id: generationTask.id },
          data: { queueJobId },
        });

        this.logger.log(`Generation task queued for background processing: ${generationTask.id}, Job: ${queueJobId}`);
      } else {
        // Process immediately (synchronous)
        await this.processGenerationSync(generationTask);
      }

      // Update session last accessed
      await this.prisma.aISession.update({
        where: { id: session.id },
        data: { lastAccessedAt: new Date() },
      });

      return this.mapTaskToResponse(generationTask, queueJobId);

    } catch (error) {
      this.logger.error(`Failed to create generation task for session ${sessionId}: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create generation task: ${error.message}`);
    }
  }

  async generateText(generateTextDto: GenerateTextDto): Promise<GenerationTaskResponseDto> {
    const { sessionId, prompt, maxTokens, temperature, model, processInBackground } = generateTextDto;

    const parameters = {
      maxTokens: maxTokens || 1000,
      temperature: temperature || 0.7,
      model: model || 'gpt-4',
    };

    return this.generateContent({
      sessionId,
      type: GenerationType.TEXT,
      prompt,
      parameters,
      processInBackground,
    });
  }

  async generateCode(generateCodeDto: GenerateCodeDto): Promise<GenerationTaskResponseDto> {
    const { sessionId, prompt, language, style, includeComments, processInBackground } = generateCodeDto;

    const parameters = {
      language: language || 'javascript',
      style: style || 'clean',
      includeComments: includeComments !== false,
    };

    return this.generateContent({
      sessionId,
      type: GenerationType.CODE,
      prompt,
      parameters,
      processInBackground,
    });
  }

  async generateImage(generateImageDto: GenerateImageDto): Promise<GenerationTaskResponseDto> {
    const { sessionId, prompt, size, style, count, processInBackground } = generateImageDto;

    const parameters = {
      size: size || '1024x1024',
      style: style || 'natural',
      count: count || 1,
    };

    return this.generateContent({
      sessionId,
      type: GenerationType.IMAGE,
      prompt,
      parameters,
      processInBackground,
    });
  }

  async getGenerationTask(taskId: string): Promise<GenerationTaskResponseDto> {
    const task = await this.prisma.generationTask.findUnique({
      where: { id: taskId },
      include: {
        queueJob: {
          select: { id: true, status: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Generation task with ID ${taskId} not found`);
    }

    return this.mapTaskToResponse(task);
  }

  async getGenerationHistory(
    sessionId: string,
    page: number = 1,
    limit: number = 20,
    type?: GenerationType
  ): Promise<GenerationHistoryResponseDto> {
    const session = await this.validateSession(sessionId);
    const skip = (page - 1) * limit;

    const whereClause: any = { sessionId: session.id };
    if (type) {
      whereClause.taskType = type;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.generationTask.findMany({
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
      this.prisma.generationTask.count({
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

  async cancelGenerationTask(taskId: string): Promise<void> {
    const task = await this.prisma.generationTask.findUnique({
      where: { id: taskId },
      include: { queueJob: true },
    });

    if (!task) {
      throw new NotFoundException(`Generation task with ID ${taskId} not found`);
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
      await this.prisma.generationTask.update({
        where: { id: taskId },
        data: { 
          status: TaskStatus.CANCELLED,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Generation task cancelled: ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel generation task ${taskId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to cancel generation task');
    }
  }

  async deleteGenerationTask(taskId: string): Promise<void> {
    const task = await this.prisma.generationTask.findUnique({
      where: { id: taskId },
      include: { queueJob: true },
    });

    if (!task) {
      throw new NotFoundException(`Generation task with ID ${taskId} not found`);
    }

    try {
      // Cancel if still processing
      if (task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS) {
        await this.cancelGenerationTask(taskId);
      }

      // Delete the task
      await this.prisma.generationTask.delete({
        where: { id: taskId },
      });

      this.logger.log(`Generation task deleted: ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to delete generation task ${taskId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete generation task');
    }
  }

  async retryGenerationTask(taskId: string): Promise<GenerationTaskResponseDto> {
    const task = await this.prisma.generationTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Generation task with ID ${taskId} not found`);
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Cannot retry completed task');
    }

    if (task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.PENDING) {
      throw new BadRequestException('Task is already processing');
    }

    try {
      // Reset task status
      const updatedTask = await this.prisma.generationTask.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.PENDING,
          result: null,
          completedAt: null,
          queueJobId: null,
        },
      });

      // Add to queue again
      const job = await this.queueService.addGenerationJob(
        task.taskType === GenerationType.TEXT ? 'text' : 
        task.taskType === GenerationType.CODE ? 'code' : 'image',
        {
          sessionId: task.sessionId,
          taskId: task.id,
          taskType: 'generation',
          payload: {
            prompt: task.prompt,
            parameters: task.parameters,
          },
          priority: 5, // Higher priority for retries
        }
      );

      // Update with new job ID
      await this.prisma.generationTask.update({
        where: { id: taskId },
        data: { queueJobId: job.id.toString() },
      });

      this.logger.log(`Generation task retried: ${taskId}, Job: ${job.id}`);

      return this.mapTaskToResponse(updatedTask, job.id.toString());
    } catch (error) {
      this.logger.error(`Failed to retry generation task ${taskId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retry generation task');
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

  private async processGenerationSync(task: any): Promise<void> {
    // Simulate synchronous processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    let result: string;

    switch (task.taskType) {
      case GenerationType.TEXT:
        result = `Generated text for prompt: "${task.prompt}". This is a synchronous response with sample content.`;
        break;
      case GenerationType.CODE:
        result = `// Generated code for: ${task.prompt}\nfunction example() {\n  return "Hello World";\n}`;
        break;
      case GenerationType.IMAGE:
        result = `https://picsum.photos/1024/1024?random=${Math.floor(Math.random() * 1000)}`;
        break;
      default:
        result = 'Generated content';
    }

    await this.prisma.generationTask.update({
      where: { id: task.id },
      data: {
        result,
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  private mapTaskToResponse(task: any, queueJobId?: string): GenerationTaskResponseDto {
    return {
      id: task.id,
      sessionId: task.sessionId,
      taskType: task.taskType,
      prompt: task.prompt,
      parameters: task.parameters,
      result: task.result,
      status: task.status,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      queueJobId: queueJobId || task.queueJobId,
    };
  }
}