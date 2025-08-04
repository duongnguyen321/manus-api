import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { I18nService } from './i18n.service';

@ApiTags('Internationalization')
@Controller('i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Get('languages')
  @ApiOperation({
    summary: 'Get supported languages',
    description: 'Retrieve list of all supported languages',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supported languages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          nativeName: { type: 'string' },
          rtl: { type: 'boolean' },
          enabled: { type: 'boolean' },
        },
      },
    },
  })
  getSupportedLanguages() {
    return this.i18nService.getSupportedLanguages();
  }

  @Get('languages/:code')
  @ApiOperation({
    summary: 'Get language information',
    description: 'Retrieve information about a specific language',
  })
  @ApiParam({
    name: 'code',
    type: 'string',
    description: 'Language code (e.g., en, es, fr)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Language information retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Language not found',
  })
  getLanguageInfo(@Param('code') code: string) {
    const languageInfo = this.i18nService.getLanguageInfo(code);
    if (!languageInfo) {
      return { error: 'Language not found' };
    }
    return languageInfo;
  }

  @Get('translate')
  @ApiOperation({
    summary: 'Translate a key',
    description: 'Translate a specific key to the target language',
  })
  @ApiQuery({
    name: 'key',
    type: 'string',
    description: 'Translation key (e.g., auth.login)',
  })
  @ApiQuery({
    name: 'language',
    type: 'string',
    required: false,
    description: 'Target language code (defaults to en)',
  })
  @ApiQuery({
    name: 'params',
    type: 'string',
    required: false,
    description: 'JSON string of parameters for interpolation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Translation retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        language: { type: 'string' },
        translation: { type: 'string' },
      },
    },
  })
  translateKey(
    @Query('key') key: string,
    @Query('language') language: string = 'en',
    @Query('params') params?: string,
  ) {
    let parsedParams: Record<string, string> | undefined;
    
    if (params) {
      try {
        parsedParams = JSON.parse(params);
      } catch (error) {
        return { error: 'Invalid params JSON' };
      }
    }

    const translation = this.i18nService.translate(key, language, parsedParams);
    
    return {
      key,
      language,
      translation,
    };
  }

  @Post('translate/batch')
  @ApiOperation({
    summary: 'Batch translate keys',
    description: 'Translate multiple keys at once',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of translation keys',
        },
        language: {
          type: 'string',
          description: 'Target language code',
          default: 'en',
        },
      },
      required: ['keys'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch translation completed successfully',
    schema: {
      type: 'object',
      properties: {
        language: { type: 'string' },
        translations: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  })
  batchTranslate(
    @Body('keys') keys: string[],
    @Body('language') language: string = 'en',
  ) {
    const translations = this.i18nService.translateMultiple(keys, language);
    
    return {
      language,
      translations,
    };
  }

  @Get('namespace/:namespace')
  @ApiOperation({
    summary: 'Get translation namespace',
    description: 'Retrieve all translations for a specific namespace',
  })
  @ApiParam({
    name: 'namespace',
    type: 'string',
    description: 'Translation namespace (e.g., auth, chat, common)',
  })
  @ApiQuery({
    name: 'language',
    type: 'string',
    required: false,
    description: 'Target language code (defaults to en)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Namespace translations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        namespace: { type: 'string' },
        language: { type: 'string' },
        translations: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  })
  getNamespaceTranslations(
    @Param('namespace') namespace: string,
    @Query('language') language: string = 'en',
  ) {
    const translations = this.i18nService.getTranslationNamespace(namespace, language);
    
    return {
      namespace,
      language,
      translations,
    };
  }

  @Post('detect-language')
  @ApiOperation({
    summary: 'Detect language',
    description: 'Automatically detect the language of a given text',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to analyze for language detection',
        },
      },
      required: ['text'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Language detected successfully',
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        detectedLanguage: { type: 'string' },
        confidence: { type: 'number' },
        supportedLanguages: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async detectLanguage(@Body('text') text: string) {
    const result = await this.i18nService.detectLanguage(text);
    const supportedLanguages = this.i18nService.getSupportedLanguages().map(lang => lang.code);
    
    return {
      text,
      detectedLanguage: result.language,
      confidence: result.confidence,
      supportedLanguages,
    };
  }

  @Post('translations')
  @ApiOperation({
    summary: 'Add translation',
    description: 'Add a new translation for a specific key and language',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        language: { type: 'string', description: 'Language code' },
        key: { type: 'string', description: 'Translation key' },
        value: { type: 'string', description: 'Translation value' },
      },
      required: ['language', 'key', 'value'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Translation added successfully',
  })
  addTranslation(
    @Body('language') language: string,
    @Body('key') key: string,
    @Body('value') value: string,
  ) {
    this.i18nService.addTranslation(language, key, value);
    
    return {
      message: 'Translation added successfully',
      language,
      key,
      value,
    };
  }

  @Delete('translations/:language/:key')
  @ApiOperation({
    summary: 'Remove translation',
    description: 'Remove a translation for a specific key and language',
  })
  @ApiParam({
    name: 'language',
    type: 'string',
    description: 'Language code',
  })
  @ApiParam({
    name: 'key',
    type: 'string',
    description: 'Translation key (use dots for nested keys)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Translation removed successfully',
  })
  removeTranslation(
    @Param('language') language: string,
    @Param('key') key: string,
  ) {
    this.i18nService.removeTranslation(language, key);
    
    return {
      message: 'Translation removed successfully',
      language,
      key,
    };
  }
}