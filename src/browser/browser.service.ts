import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as puppeteer from 'puppeteer';

export interface BrowserContext {
  id: string;
  browser: puppeteer.Browser;
  page?: puppeteer.Page;
  sessionId: string;
  createdAt: Date;
  lastUsed: Date;
}

export interface BrowserExecutionResult {
  success: boolean;
  data?: any;
  screenshot?: string;
  error?: string;
  executionTime: number;
}

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browserContexts: Map<string, BrowserContext> = new Map();
  private defaultBrowser?: puppeteer.Browser;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      // Launch default browser instance
      this.defaultBrowser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
        timeout: 30000,
      });
      
      this.logger.log('Default browser instance launched successfully');
    } catch (error) {
      this.logger.error(`Failed to launch browser: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      // Close all browser contexts
      for (const context of this.browserContexts.values()) {
        await context.browser.close();
      }
      this.browserContexts.clear();

      // Close default browser
      if (this.defaultBrowser) {
        await this.defaultBrowser.close();
      }

      this.logger.log('All browser instances closed');
    } catch (error) {
      this.logger.error(`Error closing browsers: ${error.message}`);
    }
  }

  async createBrowserContext(sessionId: string): Promise<string> {
    try {
      const contextId = `ctx_${sessionId}_${Date.now()}`;
      
      // Use default browser or create new one
      const browser = this.defaultBrowser || await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context: BrowserContext = {
        id: contextId,
        browser,
        sessionId,
        createdAt: new Date(),
        lastUsed: new Date(),
      };

      this.browserContexts.set(contextId, context);
      
      this.logger.log(`Browser context created: ${contextId} for session: ${sessionId}`);
      return contextId;
    } catch (error) {
      this.logger.error(`Failed to create browser context: ${error.message}`);
      throw error;
    }
  }

  async closeBrowserContext(contextId: string): Promise<void> {
    try {
      const context = this.browserContexts.get(contextId);
      if (!context) {
        this.logger.warn(`Browser context not found: ${contextId}`);
        return;
      }

      if (context.page) {
        await context.page.close();
      }

      // Don't close the browser if it's the default one
      if (context.browser !== this.defaultBrowser) {
        await context.browser.close();
      }

      this.browserContexts.delete(contextId);
      this.logger.log(`Browser context closed: ${contextId}`);
    } catch (error) {
      this.logger.error(`Error closing browser context: ${error.message}`);
    }
  }

  async navigateToUrl(contextId: string, url: string): Promise<BrowserExecutionResult> {
    const startTime = Date.now();
    
    try {
      const context = this.browserContexts.get(contextId);
      if (!context) {
        throw new Error(`Browser context not found: ${contextId}`);
      }

      if (!context.page) {
        context.page = await context.browser.newPage();
        await context.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      }

      await context.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      context.lastUsed = new Date();

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: { url: context.page.url(), title: await context.page.title() },
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async executeScript(contextId: string, script: string): Promise<BrowserExecutionResult> {
    const startTime = Date.now();
    
    try {
      const context = this.browserContexts.get(contextId);
      if (!context || !context.page) {
        throw new Error(`Browser context or page not found: ${contextId}`);
      }

      const result = await context.page.evaluate(script);
      context.lastUsed = new Date();

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async takeScreenshot(contextId: string): Promise<BrowserExecutionResult> {
    const startTime = Date.now();
    
    try {
      const context = this.browserContexts.get(contextId);
      if (!context || !context.page) {
        throw new Error(`Browser context or page not found: ${contextId}`);
      }

      const screenshot = await context.page.screenshot({ 
        type: 'png',
        encoding: 'base64',
        fullPage: true,
      });
      
      context.lastUsed = new Date();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        screenshot: screenshot as string,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async extractContent(contextId: string, selector?: string): Promise<BrowserExecutionResult> {
    const startTime = Date.now();
    
    try {
      const context = this.browserContexts.get(contextId);
      if (!context || !context.page) {
        throw new Error(`Browser context or page not found: ${contextId}`);
      }

      let content: any;
      
      if (selector) {
        content = await context.page.$eval(selector, el => el.textContent?.trim());
      } else {
        content = {
          title: await context.page.title(),
          url: context.page.url(),
          text: await context.page.$eval('body', el => el.textContent?.trim()),
        };
      }

      context.lastUsed = new Date();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: content,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async fillForm(contextId: string, formData: Record<string, string>): Promise<BrowserExecutionResult> {
    const startTime = Date.now();
    
    try {
      const context = this.browserContexts.get(contextId);
      if (!context || !context.page) {
        throw new Error(`Browser context or page not found: ${contextId}`);
      }

      for (const [selector, value] of Object.entries(formData)) {
        await context.page.type(selector, value);
      }

      context.lastUsed = new Date();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: { fieldsFilledCount: Object.keys(formData).length },
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async clickElement(contextId: string, selector: string): Promise<BrowserExecutionResult> {
    const startTime = Date.now();
    
    try {
      const context = this.browserContexts.get(contextId);
      if (!context || !context.page) {
        throw new Error(`Browser context or page not found: ${contextId}`);
      }

      await context.page.click(selector);
      // Wait for potential navigation
      await new Promise(resolve => setTimeout(resolve, 1000));

      context.lastUsed = new Date();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: { clicked: selector },
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async getActiveBrowserContexts(): Promise<BrowserContext[]> {
    return Array.from(this.browserContexts.values());
  }

  async cleanupInactiveContexts(maxIdleTimeMs: number = 30 * 60 * 1000): Promise<void> {
    const now = new Date();
    const contextsToCleanup: string[] = [];

    for (const [contextId, context] of this.browserContexts.entries()) {
      const idleTime = now.getTime() - context.lastUsed.getTime();
      if (idleTime > maxIdleTimeMs) {
        contextsToCleanup.push(contextId);
      }
    }

    for (const contextId of contextsToCleanup) {
      await this.closeBrowserContext(contextId);
      this.logger.log(`Cleaned up inactive browser context: ${contextId}`);
    }
  }
}