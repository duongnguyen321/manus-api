import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { JobType, JobStatus, TaskStatus } from '@prisma/client';

export interface QueueJobData {
  sessionId?: string;
  taskId?: string;
  taskType: string;
  payload: any;
  priority?: number;
  delay?: number;
  attempts?: number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('chat-processing') private chatQueue: Queue,
    @InjectQueue('text-generation') private textGenerationQueue: Queue,
    @InjectQueue('code-generation') private codeGenerationQueue: Queue,
    @InjectQueue('image-generation') private imageGenerationQueue: Queue,
    @InjectQueue('browser-automation') private browserQueue: Queue,
    @InjectQueue('file-editing') private editQueue: Queue,
    @InjectQueue('system-tasks') private systemQueue: Queue,
  ) {}

  async addChatProcessingJob(data: QueueJobData): Promise<Job> {
    const job = await this.chatQueue.add('process-chat', data, {
      priority: data.priority || 0,
      delay: data.delay || 0,
      attempts: data.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    await this.createQueueJobRecord(job, JobType.CHAT_PROCESSING, data);
    this.logger.log(`Added chat processing job: ${job.id}`);
    return job;
  }

  async addGenerationJob(type: 'text' | 'code' | 'image', data: QueueJobData): Promise<Job> {
    let queue: Queue;
    let jobType: JobType;

    switch (type) {
      case 'text':
        queue = this.textGenerationQueue;
        jobType = JobType.TEXT_GENERATION;
        break;
      case 'code':
        queue = this.codeGenerationQueue;
        jobType = JobType.CODE_GENERATION;
        break;
      case 'image':
        queue = this.imageGenerationQueue;
        jobType = JobType.IMAGE_GENERATION;
        break;
    }

    const job = await queue.add(`generate-${type}`, data, {
      priority: data.priority || 0,
      delay: data.delay || 0,
      attempts: data.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    await this.createQueueJobRecord(job, jobType, data);
    this.logger.log(`Added ${type} generation job: ${job.id}`);
    return job;
  }

  async addBrowserAutomationJob(data: QueueJobData): Promise<Job> {
    const job = await this.browserQueue.add('browser-task', data, {
      priority: data.priority || 0,
      delay: data.delay || 0,
      attempts: data.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    await this.createQueueJobRecord(job, JobType.BROWSER_AUTOMATION, data);
    this.logger.log(`Added browser automation job: ${job.id}`);
    return job;
  }

  async addEditJob(data: QueueJobData): Promise<Job> {
    const job = await this.editQueue.add('edit-file', data, {
      priority: data.priority || 0,
      delay: data.delay || 0,
      attempts: data.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    await this.createQueueJobRecord(job, JobType.FILE_EDITING, data);
    this.logger.log(`Added file editing job: ${job.id}`);
    return job;
  }

  async addSystemJob(data: QueueJobData): Promise<Job> {
    const job = await this.systemQueue.add('system-task', data, {
      priority: data.priority || 0,
      delay: data.delay || 0,
      attempts: data.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    await this.createQueueJobRecord(job, JobType.SYSTEM_TASK, data);
    this.logger.log(`Added system job: ${job.id}`);
    return job;
  }

  async getJobStatus(jobId: string): Promise<any> {
    const queueJob = await this.prisma.queueJob.findUnique({
      where: { jobId },
      include: {
        session: true,
      },
    });

    if (!queueJob) {
      return null;
    }

    // Get job from Bull queue
    let bullJob: Job | null = null;
    const queues = [
      this.chatQueue,
      this.textGenerationQueue,
      this.codeGenerationQueue,
      this.imageGenerationQueue,
      this.browserQueue,
      this.editQueue,
      this.systemQueue,
    ];

    for (const queue of queues) {
      bullJob = await queue.getJob(jobId);
      if (bullJob) break;
    }

    return {
      ...queueJob,
      bullJobStatus: bullJob?.opts || null,
      progress: bullJob?.progress() || 0,
    };
  }

  async getSessionJobs(sessionId: string): Promise<any[]> {
    const jobs = await this.prisma.queueJob.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    return jobs;
  }

  async pauseJob(jobId: string): Promise<void> {
    const queueJob = await this.prisma.queueJob.findUnique({
      where: { jobId },
    });

    if (!queueJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Find and pause the Bull job
    const queues = [
      this.chatQueue,
      this.textGenerationQueue,
      this.codeGenerationQueue,
      this.imageGenerationQueue,
      this.browserQueue,
      this.editQueue,
      this.systemQueue,
    ];

    for (const queue of queues) {
      const bullJob = await queue.getJob(jobId);
      if (bullJob) {
        await queue.pause();
        await this.prisma.queueJob.update({
          where: { jobId },
          data: { status: JobStatus.PAUSED },
        });
        this.logger.log(`Paused job: ${jobId}`);
        break;
      }
    }
  }

  async resumeJob(jobId: string): Promise<void> {
    const queueJob = await this.prisma.queueJob.findUnique({
      where: { jobId },
    });

    if (!queueJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Find and resume the Bull job
    const queues = [
      this.chatQueue,
      this.textGenerationQueue,
      this.codeGenerationQueue,
      this.imageGenerationQueue,
      this.browserQueue,
      this.editQueue,
      this.systemQueue,
    ];

    for (const queue of queues) {
      const bullJob = await queue.getJob(jobId);
      if (bullJob) {
        await queue.resume();
        await this.prisma.queueJob.update({
          where: { jobId },
          data: { status: JobStatus.WAITING },
        });
        this.logger.log(`Resumed job: ${jobId}`);
        break;
      }
    }
  }

  async removeJob(jobId: string): Promise<void> {
    const queueJob = await this.prisma.queueJob.findUnique({
      where: { jobId },
    });

    if (!queueJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Find and remove the Bull job
    const queues = [
      this.chatQueue,
      this.textGenerationQueue,
      this.codeGenerationQueue,
      this.imageGenerationQueue,
      this.browserQueue,
      this.editQueue,
      this.systemQueue,
    ];

    for (const queue of queues) {
      const bullJob = await queue.getJob(jobId);
      if (bullJob) {
        await bullJob.remove();
        await this.prisma.queueJob.delete({
          where: { jobId },
        });
        this.logger.log(`Removed job: ${jobId}`);
        break;
      }
    }
  }

  async getQueueStats(): Promise<any> {
    const queues = [
      { name: 'chat-processing', queue: this.chatQueue },
      { name: 'text-generation', queue: this.textGenerationQueue },
      { name: 'code-generation', queue: this.codeGenerationQueue },
      { name: 'image-generation', queue: this.imageGenerationQueue },
      { name: 'browser-automation', queue: this.browserQueue },
      { name: 'file-editing', queue: this.editQueue },
      { name: 'system-tasks', queue: this.systemQueue },
    ];

    const stats = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed(),
        ]);

        return {
          name,
          counts: {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            delayed: delayed.length,
          },
        };
      }),
    );

    return stats;
  }

  async updateJobStatus(jobId: string, status: JobStatus, result?: any, error?: string): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === JobStatus.ACTIVE) {
      updateData.startedAt = new Date();
    } else if (status === JobStatus.COMPLETED) {
      updateData.completedAt = new Date();
      updateData.result = result;
    } else if (status === JobStatus.FAILED) {
      updateData.failedAt = new Date();
      updateData.error = error;
    }

    await this.prisma.queueJob.update({
      where: { jobId },
      data: updateData,
    });
  }

  private async createQueueJobRecord(job: Job, jobType: JobType, data: QueueJobData): Promise<void> {
    await this.prisma.queueJob.create({
      data: {
        jobId: job.id.toString(),
        queueName: job.queue.name,
        jobType,
        data: data.payload,
        status: JobStatus.WAITING,
        priority: job.opts.priority || 0,
        maxAttempts: job.opts.attempts || 3,
        delay: job.opts.delay || null,
        sessionId: data.sessionId,
      },
    });
  }
}