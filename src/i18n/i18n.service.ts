import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../ai/ai.service';

export interface TranslationResource {
  [key: string]: string | TranslationResource;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  rtl?: boolean;
  enabled: boolean;
}

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);
  private translations: Map<string, TranslationResource> = new Map();
  private defaultLanguage: string;
  private supportedLanguages: SupportedLanguage[];

  constructor(
    private readonly configService: ConfigService,
    private readonly aiService: AIService,
  ) {
    this.defaultLanguage = this.configService.get<string>('DEFAULT_LANGUAGE', 'en');
    this.initializeSupportedLanguages();
    this.loadTranslations();
  }

  private initializeSupportedLanguages(): void {
    this.supportedLanguages = [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        enabled: true,
      },
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        enabled: true,
      },
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        enabled: true,
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        enabled: true,
      },
      {
        code: 'it',
        name: 'Italian',
        nativeName: 'Italiano',
        enabled: true,
      },
      {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        enabled: true,
      },
      {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        enabled: true,
      },
      {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        enabled: true,
      },
      {
        code: 'ko',
        name: 'Korean',
        nativeName: '한국어',
        enabled: true,
      },
      {
        code: 'zh',
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        enabled: true,
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        rtl: true,
        enabled: true,
      },
      {
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        enabled: true,
      },
    ];
  }

  private loadTranslations(): void {
    // Load default English translations
    this.translations.set('en', {
      common: {
        hello: 'Hello',
        goodbye: 'Goodbye',
        thank_you: 'Thank you',
        please: 'Please',
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        update: 'Update',
        search: 'Search',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information',
      },
      auth: {
        login: 'Login',
        logout: 'Logout',
        register: 'Register',
        forgot_password: 'Forgot Password',
        reset_password: 'Reset Password',
        email: 'Email',
        password: 'Password',
        confirm_password: 'Confirm Password',
        invalid_credentials: 'Invalid credentials',
        account_created: 'Account created successfully',
        password_reset_sent: 'Password reset email sent',
      },
      chat: {
        new_chat: 'New Chat',
        send_message: 'Send Message',
        type_message: 'Type your message...',
        chat_history: 'Chat History',
        clear_history: 'Clear History',
        ai_thinking: 'AI is thinking...',
        message_sent: 'Message sent',
        message_failed: 'Failed to send message',
      },
      agents: {
        available_tools: 'Available Tools',
        execute_tool: 'Execute Tool',
        tool_executed: 'Tool executed successfully',
        tool_failed: 'Tool execution failed',
        select_tool: 'Select a tool',
        tool_description: 'Tool Description',
      },
      files: {
        upload_file: 'Upload File',
        file_uploaded: 'File uploaded successfully',
        file_upload_failed: 'File upload failed',
        file_too_large: 'File is too large',
        unsupported_format: 'Unsupported file format',
        processing_file: 'Processing file...',
        download_file: 'Download File',
        delete_file: 'Delete File',
        file_deleted: 'File deleted successfully',
      },
      analytics: {
        system_analytics: 'System Analytics',
        user_analytics: 'User Analytics',
        total_users: 'Total Users',
        active_users: 'Active Users',
        total_chats: 'Total Chats',
        total_messages: 'Total Messages',
        response_time: 'Average Response Time',
        popular_tools: 'Popular Tools',
        user_engagement: 'User Engagement',
        system_health: 'System Health',
      },
      errors: {
        not_found: 'Not found',
        unauthorized: 'Unauthorized',
        forbidden: 'Forbidden',
        internal_error: 'Internal server error',
        bad_request: 'Bad request',
        validation_failed: 'Validation failed',
        rate_limit_exceeded: 'Rate limit exceeded',
        service_unavailable: 'Service unavailable',
      },
    });

    // Load Spanish translations
    this.translations.set('es', {
      common: {
        hello: 'Hola',
        goodbye: 'Adiós',
        thank_you: 'Gracias',
        please: 'Por favor',
        yes: 'Sí',
        no: 'No',
        ok: 'Aceptar',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Crear',
        update: 'Actualizar',
        search: 'Buscar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia',
        info: 'Información',
      },
      auth: {
        login: 'Iniciar Sesión',
        logout: 'Cerrar Sesión',
        register: 'Registrarse',
        forgot_password: 'Olvidé mi Contraseña',
        reset_password: 'Restablecer Contraseña',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        confirm_password: 'Confirmar Contraseña',
        invalid_credentials: 'Credenciales inválidas',
        account_created: 'Cuenta creada exitosamente',
        password_reset_sent: 'Correo de restablecimiento enviado',
      },
      chat: {
        new_chat: 'Nuevo Chat',
        send_message: 'Enviar Mensaje',
        type_message: 'Escribe tu mensaje...',
        chat_history: 'Historial de Chat',
        clear_history: 'Limpiar Historial',
        ai_thinking: 'IA está pensando...',
        message_sent: 'Mensaje enviado',
        message_failed: 'Error al enviar mensaje',
      },
      // Add more Spanish translations as needed
    });

    // Load French translations
    this.translations.set('fr', {
      common: {
        hello: 'Bonjour',
        goodbye: 'Au revoir',
        thank_you: 'Merci',
        please: 'S\'il vous plaît',
        yes: 'Oui',
        no: 'Non',
        ok: 'OK',
        cancel: 'Annuler',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        create: 'Créer',
        update: 'Mettre à jour',
        search: 'Rechercher',
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
        warning: 'Avertissement',
        info: 'Information',
      },
      // Add more French translations as needed
    });

    this.logger.log(`Loaded translations for ${this.translations.size} languages`);
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return this.supportedLanguages.filter(lang => lang.enabled);
  }

  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some(lang => lang.code === languageCode && lang.enabled);
  }

  getLanguageInfo(languageCode: string): SupportedLanguage | null {
    return this.supportedLanguages.find(lang => lang.code === languageCode) || null;
  }

  translate(key: string, language: string = this.defaultLanguage, params?: Record<string, string>): string {
    try {
      // Ensure language is supported, fallback to default
      const targetLanguage = this.isLanguageSupported(language) ? language : this.defaultLanguage;
      
      const translations = this.translations.get(targetLanguage);
      if (!translations) {
        this.logger.warn(`No translations found for language: ${targetLanguage}`);
        return key;
      }

      // Navigate through nested translation keys (e.g., "auth.login")
      const keyParts = key.split('.');
      let translation: any = translations;
      
      for (const part of keyParts) {
        if (typeof translation === 'object' && translation[part] !== undefined) {
          translation = translation[part];
        } else {
          // Key not found, try fallback to default language
          if (targetLanguage !== this.defaultLanguage) {
            return this.translate(key, this.defaultLanguage, params);
          }
          this.logger.warn(`Translation key not found: ${key} for language: ${targetLanguage}`);
          return key;
        }
      }

      if (typeof translation !== 'string') {
        this.logger.warn(`Translation value is not a string for key: ${key}`);
        return key;
      }

      // Replace parameters in translation
      if (params) {
        let result = translation;
        for (const [paramKey, paramValue] of Object.entries(params)) {
          result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue);
        }
        return result;
      }

      return translation;
    } catch (error) {
      this.logger.error(`Translation error for key "${key}": ${error.message}`);
      return key;
    }
  }

  translateMultiple(keys: string[], language: string = this.defaultLanguage): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key of keys) {
      result[key] = this.translate(key, language);
    }
    return result;
  }

  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      // First, try pattern-based detection for quick identification
      const patternResult = this.detectLanguageByPattern(text);
      if (patternResult.confidence > 0.8) {
        return patternResult;
      }

      // Use AI for more accurate language detection
      const supportedCodes = this.supportedLanguages.map(lang => lang.code).join(', ');
      const prompt = `Detect the language of the following text and return ONLY a JSON response with the format: {"language": "code", "confidence": 0.95}

Text to analyze: "${text.substring(0, 500)}"

Available language codes: ${supportedCodes}

If the text is too short or ambiguous, use your best judgment. Return confidence between 0.0 and 1.0.`;

      const aiResponse = await this.aiService.generateText(prompt, {
        maxTokens: 100,
        temperature: 0.1,
      });

      // Parse AI response
      try {
        const result = JSON.parse(aiResponse.trim());
        if (result.language && result.confidence) {
          // Validate that the detected language is supported
          if (this.isLanguageSupported(result.language)) {
            return {
              language: result.language,
              confidence: Math.min(Math.max(result.confidence, 0), 1), // Clamp between 0-1
            };
          }
        }
      } catch (parseError) {
        this.logger.warn(`Failed to parse AI language detection response: ${parseError.message}`);
      }

      // Fallback to pattern-based detection
      return patternResult;
    } catch (error) {
      this.logger.error(`Language detection error: ${error.message}`);
      return { language: this.defaultLanguage, confidence: 0.5 };
    }
  }

  private detectLanguageByPattern(text: string): { language: string; confidence: number } {
    // Quick pattern-based detection for common scripts
    if (/[\u4e00-\u9fff]/.test(text)) return { language: 'zh', confidence: 0.9 }; // Chinese
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return { language: 'ja', confidence: 0.9 }; // Japanese
    if (/[\uac00-\ud7af]/.test(text)) return { language: 'ko', confidence: 0.9 }; // Korean
    if (/[\u0600-\u06ff]/.test(text)) return { language: 'ar', confidence: 0.9 }; // Arabic
    if (/[\u0900-\u097f]/.test(text)) return { language: 'hi', confidence: 0.8 }; // Hindi
    if (/[\u0400-\u04ff]/.test(text)) return { language: 'ru', confidence: 0.8 }; // Russian
    
    // For European languages, use keyword detection with lower confidence
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    const patterns = {
      de: ['und', 'der', 'die', 'das', 'ist', 'nicht', 'mit', 'ein', 'eine'],
      fr: ['le', 'la', 'les', 'un', 'une', 'et', 'est', 'dans', 'pour'],
      es: ['el', 'la', 'los', 'las', 'un', 'una', 'es', 'en', 'para'],
      it: ['il', 'la', 'gli', 'le', 'un', 'una', 'è', 'in', 'per'],
      pt: ['o', 'a', 'os', 'as', 'um', 'uma', 'é', 'em', 'para'],
    };

    for (const [lang, keywords] of Object.entries(patterns)) {
      const matches = keywords.filter(keyword => words.includes(keyword)).length;
      if (matches >= 2) {
        return { language: lang, confidence: Math.min(0.7, matches * 0.15) };
      }
    }
    
    // Default to English with low confidence
    return { language: 'en', confidence: 0.3 };
  }

  getTranslationNamespace(namespace: string, language: string = this.defaultLanguage): Record<string, string> {
    try {
      const translations = this.translations.get(language);
      if (!translations || typeof translations[namespace] !== 'object') {
        return {};
      }

      const namespaceTranslations = translations[namespace] as Record<string, string>;
      const result: Record<string, string> = {};

      // Flatten the namespace translations
      for (const [key, value] of Object.entries(namespaceTranslations)) {
        if (typeof value === 'string') {
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Error getting namespace "${namespace}": ${error.message}`);
      return {};
    }
  }

  addTranslation(language: string, key: string, value: string): void {
    try {
      if (!this.translations.has(language)) {
        this.translations.set(language, {});
      }

      const translations = this.translations.get(language)!;
      const keyParts = key.split('.');
      let current: any = translations;

      // Navigate to the nested object, creating if necessary
      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i];
        if (typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }

      // Set the final value
      current[keyParts[keyParts.length - 1]] = value;
      
      this.logger.debug(`Added translation: ${language}.${key} = ${value}`);
    } catch (error) {
      this.logger.error(`Error adding translation: ${error.message}`);
    }
  }

  removeTranslation(language: string, key: string): void {
    try {
      const translations = this.translations.get(language);
      if (!translations) return;

      const keyParts = key.split('.');
      let current: any = translations;

      // Navigate to the parent object
      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i];
        if (typeof current[part] !== 'object') {
          return; // Key doesn't exist
        }
        current = current[part];
      }

      // Delete the final key
      delete current[keyParts[keyParts.length - 1]];
      
      this.logger.debug(`Removed translation: ${language}.${key}`);
    } catch (error) {
      this.logger.error(`Error removing translation: ${error.message}`);
    }
  }
}