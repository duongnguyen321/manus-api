import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue.service';
import { AIService } from '../../ai/ai.service';
import { JobStatus, GenerationType, TaskStatus } from '@prisma/client';

@Processor('text-generation')
@Processor('code-generation')
@Processor('image-generation')
export class GenerationProcessor {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private aiService: AIService,
  ) {}

  @Process('generate-text')
  async generateText(job: Job): Promise<any> {
    return this.processGeneration(job, GenerationType.TEXT);
  }

  @Process('generate-code')
  async generateCode(job: Job): Promise<any> {
    return this.processGeneration(job, GenerationType.CODE);
  }

  @Process('generate-image')
  async generateImage(job: Job): Promise<any> {
    return this.processGeneration(job, GenerationType.IMAGE);
  }

  private async processGeneration(job: Job, type: GenerationType): Promise<any> {
    const { sessionId, taskId, payload } = job.data;
    
    try {
      await this.queueService.updateJobStatus(job.id.toString(), JobStatus.ACTIVE);
      
      this.logger.log(`Processing ${type} generation for session: ${sessionId}`);

      // Get or create generation task
      let generationTask;
      if (taskId) {
        generationTask = await this.prisma.generationTask.findUnique({
          where: { id: taskId },
        });
      }

      if (!generationTask) {
        generationTask = await this.prisma.generationTask.create({
          data: {
            sessionId,
            taskType: type,
            prompt: payload.prompt,
            parameters: payload.parameters || {},
            status: TaskStatus.IN_PROGRESS,
            queueJobId: await this.getQueueJobId(job.id.toString()),
          },
        });
      } else {
        await this.prisma.generationTask.update({
          where: { id: taskId },
          data: { 
            status: TaskStatus.IN_PROGRESS,
            queueJobId: await this.getQueueJobId(job.id.toString()),
          },
        });
      }

      // Generate content based on type using real AI
      const result = await this.generateContent(type, payload, generationTask);

      // Update task with result
      await this.prisma.generationTask.update({
        where: { id: generationTask.id },
        data: {
          result: result.content,
          status: TaskStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await this.queueService.updateJobStatus(job.id.toString(), JobStatus.COMPLETED, result);
      
      this.logger.log(`${type} generation completed for session: ${sessionId}`);
      return result;

    } catch (error) {
      this.logger.error(`${type} generation failed for session ${sessionId}: ${error.message}`, error.stack);
      
      if (taskId) {
        await this.prisma.generationTask.update({
          where: { id: taskId },
          data: { status: TaskStatus.FAILED },
        });
      }
      
      await this.queueService.updateJobStatus(job.id.toString(), JobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  private async generateContent(type: GenerationType, payload: any, task: any): Promise<any> {
    const startTime = Date.now();
    let content: string;
    let metadata: any = {};

    try {
      switch (type) {
        case GenerationType.TEXT:
          content = await this.aiService.generateText(payload.prompt, {
            temperature: payload.parameters?.temperature || 0.7,
            maxTokens: payload.parameters?.maxTokens || 1000,
            model: payload.parameters?.model,
          });
          metadata = {
            model: payload.parameters?.model || 'default',
            temperature: payload.parameters?.temperature || 0.7,
            maxTokens: payload.parameters?.maxTokens || 1000,
          };
          break;

        case GenerationType.CODE:
          content = await this.aiService.generateCode(
            payload.prompt,
            payload.parameters?.language,
            payload.parameters?.style
          );
          metadata = {
            language: payload.parameters?.language || 'javascript',
            style: payload.parameters?.style || 'clean',
            includeComments: payload.parameters?.includeComments !== false,
          };
          break;

        case GenerationType.IMAGE:
          // Use AI to enhance and optimize the image prompt
          const enhancedPrompt = await this.enhanceImagePrompt(payload.prompt, payload.parameters);
          
          // For now, generate a structured response with optimized prompt
          // In production, integrate with DALL-E, Midjourney, or Stable Diffusion
          content = await this.generateImagePlaceholder(enhancedPrompt, payload.parameters);
          
          metadata = {
            model: 'ai-enhanced-prompt',
            originalPrompt: payload.prompt,
            enhancedPrompt,
            size: payload.parameters?.size || '1024x1024',
            style: payload.parameters?.style || 'natural',
            count: payload.parameters?.count || 1,
            qualityLevel: payload.parameters?.quality || 'standard',
            note: 'AI-enhanced prompt ready for image generation service integration',
          };
          break;

        default:
          throw new Error(`Unsupported generation type: ${type}`);
      }

      const processingTime = Date.now() - startTime;
      metadata.processingTime = processingTime;
      metadata.taskId = task.id;

      return { content, metadata };
    } catch (error) {
      this.logger.error(`Content generation failed for type ${type}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async enhanceImagePrompt(originalPrompt: string, parameters: any): Promise<string> {
    try {
      const style = parameters?.style || 'natural';
      const quality = parameters?.quality || 'standard';
      const size = parameters?.size || '1024x1024';
      
      const enhancementPrompt = `Enhance and optimize this image generation prompt for better results:

Original prompt: "${originalPrompt}"

Style preference: ${style}
Quality level: ${quality}
Image size: ${size}

Please enhance the prompt by:
1. Adding specific visual details
2. Improving composition descriptions
3. Including appropriate art style keywords
4. Specifying lighting and atmosphere
5. Adding quality modifiers

Return only the enhanced prompt without explanations.`;

      const enhancedPrompt = await this.aiService.generateText(enhancementPrompt, {
        maxTokens: 200,
        temperature: 0.3,
      });

      return enhancedPrompt.trim();
    } catch (error) {
      this.logger.error(`Failed to enhance image prompt: ${error.message}`);
      return originalPrompt; // Fallback to original prompt
    }
  }

  private async generateImagePlaceholder(prompt: string, parameters: any): Promise<string> {
    try {
      // Generate a descriptive JSON response that could be used with real image generation APIs
      const imageSpec = {
        prompt,
        specifications: {
          size: parameters?.size || '1024x1024',
          style: parameters?.style || 'natural',
          quality: parameters?.quality || 'standard',
          count: parameters?.count || 1,
        },
        suggestedParameters: {
          guidance_scale: parameters?.style === 'artistic' ? 12 : 7,
          num_inference_steps: parameters?.quality === 'high' ? 50 : 20,
          seed: Math.floor(Math.random() * 1000000),
        },
        placeholderUrl: `https://picsum.photos/${parameters?.size?.replace('x', '/') || '1024/1024'}?random=${Date.now()}`,
        readyForProduction: 'Replace placeholderUrl with actual image generation service call',
      };

      // Return a structured JSON string that contains all the information needed
      return JSON.stringify(imageSpec, null, 2);
    } catch (error) {
      this.logger.error(`Failed to generate image placeholder: ${error.message}`);
      return `Enhanced prompt: ${prompt}\nPlaceholder: https://picsum.photos/1024/1024?random=${Date.now()}`;
    }
  }

  private async getQueueJobId(jobId: string): Promise<string> {
    const queueJob = await this.prisma.queueJob.findUnique({
      where: { jobId },
      select: { id: true },
    });
    return queueJob?.id;
  }
}