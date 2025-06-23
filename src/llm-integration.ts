// Integración con LLMs reales
import type { MCPResponse } from './types';

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  tools?: Array<{
    name: string;
    description: string;
    parameters: any;
  }>;
}

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
  }>;
}

export abstract class LLMProvider {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  abstract chat(request: LLMRequest): Promise<LLMResponse>;
  abstract isAvailable(): Promise<boolean>;
}

// Implementación para OpenAI
export class OpenAIProvider extends LLMProvider {
  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.model || 'gpt-3.5-turbo',
            messages: request.messages,
            temperature: this.config.temperature || 0.7,
            max_tokens: this.config.maxTokens || 1000,
            tools: request.tools,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const choice = data.choices[0];

      return {
        content: choice.message.content || '',
        toolCalls: choice.message.tool_calls,
      };
    } catch (error) {
      throw new Error(`Error calling OpenAI: ${error}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }
}

// Implementación para Ollama
export class OllamaProvider extends LLMProvider {
  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(
        `${this.config.baseUrl || 'http://localhost:11434'}/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.model || 'llama2',
            messages: request.messages,
            stream: false,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      return {
        content: data.message.content || '',
      };
    } catch (error) {
      throw new Error(`Error calling Ollama: ${error}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl || 'http://localhost:11434'}/api/tags`,
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Factory para crear proveedores de LLM
export class LLMFactory {
  static createProvider(config: LLMConfig): LLMProvider {
    switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    default:
      throw new Error(`Proveedor no soportado: ${config.provider}`);
    }
  }
}

// Integración con el servidor MCP
export class MCPLLMIntegration {
  private llmProvider: LLMProvider | null = null;
  private availableTools: string[] = [];
  private availableResources: string[] = [];

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider || null;
  }

  setLLMProvider(provider: LLMProvider): void {
    this.llmProvider = provider;
  }

  setAvailableTools(tools: string[]): void {
    this.availableTools = tools;
  }

  setAvailableResources(resources: string[]): void {
    this.availableResources = resources;
  }

  async processUserQuery(
    query: string,
    _context?: unknown,
  ): Promise<MCPResponse> {
    if (!this.llmProvider) {
      // Fallback a respuestas simuladas si no hay LLM
      return this.fallbackResponse(query);
    }

    try {
      // Verificar si el LLM está disponible
      const isAvailable = await this.llmProvider.isAvailable();
      if (!isAvailable) {
        console.warn('LLM no disponible, usando respuestas simuladas');
        return this.fallbackResponse(query);
      }

      // Crear el prompt del sistema
      const systemPrompt = this.createSystemPrompt();

      // Llamar al LLM
      const llmResponse = await this.llmProvider.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        tools: this.createToolDefinitions(),
      });

      // Procesar la respuesta del LLM
      return this.processLLMResponse(llmResponse, query);
    } catch (error) {
      console.error('Error procesando query con LLM:', error);
      return this.fallbackResponse(query);
    }
  }

  private createSystemPrompt(): string {
    return `Eres un asistente MCP (Model Context Protocol) que puede acceder a recursos y herramientas.

Recursos disponibles: ${this.availableResources.join(', ')}
Herramientas disponibles: ${this.availableTools.join(', ')}

Responde de manera útil y amigable. Si el usuario pide usar una herramienta específica, indícale cómo hacerlo.
Si no entiendes algo, pide aclaración.`;
  }

  private createToolDefinitions() {
    return this.availableTools.map((tool) => ({
      name: tool,
      description: `Ejecuta la herramienta ${tool}`,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    }));
  }

  private processLLMResponse(
    llmResponse: LLMResponse,
    _originalQuery: string,
  ): MCPResponse {
    return {
      success: true,
      data: {
        content: [
          {
            type: 'text',
            text: llmResponse.content,
          },
        ],
      },
      timestamp: Date.now(),
    };
  }

  private fallbackResponse(query: string): MCPResponse {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('hola') || lowerQuery.includes('hello')) {
      return {
        success: true,
        data: {
          content: [
            {
              type: 'text',
              text: '¡Hola! Soy tu asistente MCP. ¿En qué puedo ayudarte?',
            },
          ],
        },
        timestamp: Date.now(),
      };
    }

    return {
      success: true,
      data: {
        content: [
          {
            type: 'text',
            text: 'No entiendo ese comando. Escribe "ayuda" para ver las opciones disponibles.',
          },
        ],
      },
      timestamp: Date.now(),
    };
  }
}
