import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';
import { Readable } from 'stream';

export interface DockerExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  containerId?: string;
  executionTime: number;
}

export interface DockerContainer {
  id: string;
  image: string;
  status: string;
  created: Date;
  sessionId?: string;
}

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);
  private docker: Docker;

  constructor(private readonly configService: ConfigService) {
    this.docker = new Docker();
  }

  async executeCode(
    language: 'python' | 'nodejs' | 'bash',
    code: string,
    sessionId?: string,
  ): Promise<DockerExecutionResult> {
    const startTime = Date.now();

    // Check if Docker is available
    try {
      await this.docker.ping();
    } catch (dockerError) {
      this.logger.warn(`Docker not available: ${dockerError.message}. Using fallback execution.`);
      return this.executeFallback(language, code, startTime);
    }

    let container: Docker.Container | null = null;

    try {
      const imageMap = {
        python: 'python:3.10-slim',
        nodejs: 'node:18-alpine',
        bash: 'ubuntu:22.04',
      };

      const image = imageMap[language];
      this.logger.log(`Executing ${language} code in container`);

      // Create container
      container = await this.docker.createContainer({
        Image: image,
        Cmd: this.getExecutionCommand(language, code),
        WorkingDir: '/workspace',
        Tty: false,
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: {
          Memory: 512 * 1024 * 1024, // 512MB
          CpuQuota: 50000, // 50% CPU
          NetworkMode: 'none', // No network access for security
          AutoRemove: true,
        },
        Labels: {
          'manus.session': sessionId || 'anonymous',
          'manus.language': language,
          'manus.created': new Date().toISOString(),
        },
      });

      // Start container and capture output
      await container.start();
      
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      let output = '';
      let error = '';

      // Create a promise to handle stream data
      const streamPromise = new Promise<void>((resolve) => {
        stream.on('data', (chunk: Buffer) => {
          // Check if this is a Docker multiplexed stream
          if (chunk.length >= 8) {
            const header = chunk.readUInt8(0);
            const size = chunk.readUInt32BE(4);
            
            if (header === 1) { // stdout
              output += chunk.slice(8, 8 + size).toString();
            } else if (header === 2) { // stderr  
              error += chunk.slice(8, 8 + size).toString();
            }
          } else {
            // Non-multiplexed stream - treat as stdout
            output += chunk.toString();
          }
        });

        stream.on('end', () => {
          resolve();
        });

        stream.on('error', (err) => {
          this.logger.error(`Stream error: ${err.message}`);
          resolve();
        });
      });

      // Wait for container to finish with timeout
      const [waitResult] = await Promise.all([
        Promise.race([
          container.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Execution timeout')), 30000)
          ),
        ]),
        streamPromise
      ]);

      const executionTime = Date.now() - startTime;

      // If there's an error and no output, return the error
      if (error && !output) {
        return {
          success: false,
          error: error.trim(),
          containerId: container.id,
          executionTime,
        };
      }

      return {
        success: true,
        output: output.trim() || error.trim(),
        containerId: container.id,
        executionTime,
      };

    } catch (error) {
      this.logger.error(`Docker execution failed: ${error.message}`);
      
      // Cleanup container on error
      if (container) {
        try {
          await container.remove({ force: true });
        } catch (cleanupError) {
          this.logger.warn(`Failed to cleanup container: ${cleanupError.message}`);
        }
      }

      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private async executeFallback(
    language: 'python' | 'nodejs' | 'bash',
    code: string,
    startTime: number,
  ): Promise<DockerExecutionResult> {
    this.logger.log(`Executing ${language} code using fallback (host execution)`);
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      let command: string;
      
      switch (language) {
        case 'python':
          // Execute Python code directly
          command = `python3 -c "${code.replace(/"/g, '\\"')}"`;
          break;
        case 'nodejs':
          // Execute Node.js code directly
          command = `node -e "${code.replace(/"/g, '\\"')}"`;
          break;
        case 'bash':
          // Execute bash commands directly
          command = code;
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
      });

      const executionTime = Date.now() - startTime;

      if (stderr && !stdout) {
        return {
          success: false,
          error: stderr.trim(),
          containerId: 'fallback-execution',
          executionTime,
        };
      }

      return {
        success: true,
        output: stdout.trim() || stderr.trim(),
        containerId: 'fallback-execution',
        executionTime,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Fallback execution failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        containerId: 'fallback-execution',
        executionTime,
      };
    }
  }

  async createPersistentContainer(
    language: 'python' | 'nodejs' | 'bash',
    sessionId: string,
  ): Promise<string> {
    try {
      const imageMap = {
        python: 'python:3.10-slim',
        nodejs: 'node:18-alpine',
        bash: 'ubuntu:22.04',
      };

      const image = imageMap[language];
      
      const container = await this.docker.createContainer({
        Image: image,
        Cmd: ['/bin/sh', '-c', 'while true; do sleep 30; done'], // Keep alive
        WorkingDir: '/workspace',
        Tty: true,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        OpenStdin: true,
        HostConfig: {
          Memory: 512 * 1024 * 1024, // 512MB
          CpuQuota: 50000, // 50% CPU
          NetworkMode: 'bridge', // Allow limited network
        },
        Labels: {
          'manus.session': sessionId,
          'manus.language': language,
          'manus.type': 'persistent',
          'manus.created': new Date().toISOString(),
        },
      });

      await container.start();
      this.logger.log(`Created persistent container ${container.id} for session ${sessionId}`);
      
      return container.id;
    } catch (error) {
      this.logger.error(`Failed to create persistent container: ${error.message}`);
      throw error;
    }
  }

  async executeInContainer(
    containerId: string,
    command: string,
  ): Promise<DockerExecutionResult> {
    const startTime = Date.now();

    try {
      const container = this.docker.getContainer(containerId);
      
      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', command],
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({});
      
      let output = '';
      let error = '';

      // Create a promise to handle stream data properly
      const streamPromise = new Promise<void>((resolve) => {
        stream.on('data', (chunk: Buffer) => {
          // Check if this is a Docker multiplexed stream
          if (chunk.length >= 8) {
            const header = chunk.readUInt8(0);
            const size = chunk.readUInt32BE(4);
            
            if (header === 1) { // stdout
              output += chunk.slice(8, 8 + size).toString();
            } else if (header === 2) { // stderr
              error += chunk.slice(8, 8 + size).toString();
            }
          } else {
            // Non-multiplexed stream - treat as stdout
            output += chunk.toString();
          }
        });

        stream.on('end', () => {
          resolve();
        });

        stream.on('error', (err) => {
          this.logger.error(`Exec stream error: ${err.message}`);
          resolve();
        });
      });

      // Wait for execution to complete with timeout
      await Promise.race([
        streamPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Execution timeout')), 30000)
        ),
      ]);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: output.trim() || error.trim(),
        containerId,
        executionTime,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        containerId,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async listContainers(sessionId?: string): Promise<DockerContainer[]> {
    try {
      const containers = await this.docker.listContainers({ all: true });
      
      return containers
        .filter(container => {
          if (!sessionId) return container.Labels?.['manus.session'];
          return container.Labels?.['manus.session'] === sessionId;
        })
        .map(container => ({
          id: container.Id,
          image: container.Image,
          status: container.State,
          created: new Date(container.Created * 1000),
          sessionId: container.Labels?.['manus.session'],
        }));
    } catch (error) {
      this.logger.error(`Failed to list containers: ${error.message}`);
      return [];
    }
  }

  async stopContainer(containerId: string): Promise<boolean> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      await container.remove();
      
      this.logger.log(`Stopped and removed container ${containerId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to stop container ${containerId}: ${error.message}`);
      return false;
    }
  }

  async cleanupSessionContainers(sessionId: string): Promise<number> {
    try {
      const containers = await this.listContainers(sessionId);
      let cleaned = 0;

      for (const container of containers) {
        if (await this.stopContainer(container.id)) {
          cleaned++;
        }
      }

      this.logger.log(`Cleaned up ${cleaned} containers for session ${sessionId}`);
      return cleaned;
    } catch (error) {
      this.logger.error(`Failed to cleanup session containers: ${error.message}`);
      return 0;
    }
  }

  async getContainerLogs(containerId: string): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 100,
      });

      return logs.toString();
    } catch (error) {
      this.logger.error(`Failed to get container logs: ${error.message}`);
      return `Error getting logs: ${error.message}`;
    }
  }

  private getExecutionCommand(language: string, code: string): string[] {
    switch (language) {
      case 'python':
        return ['python3', '-c', code];
      case 'nodejs':
        return ['node', '-e', code];
      case 'bash':
        return ['/bin/bash', '-c', code];
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }
}