import type {
  MCPServerConfig,
  MCPResource,
  MCPTool,
  MCPResourceResponse,
  MCPToolResponse,
  MCPResponse,
} from './types';

export abstract class MCPServer {
  protected config: MCPServerConfig;
  protected resources: Map<string, MCPResource> = new Map();
  protected tools: Map<string, MCPTool> = new Map();
  protected isRunning: boolean = false;

  constructor(config: MCPServerConfig = {}) {
    this.config = {
      port: 3001,
      host: 'localhost',
      enableHttp: true,
      enableWebSocket: false,
      cors: true,
      corsOrigin: '*',
      logLevel: 'info',
      ...config,
    };
  }

  /**
   * Registra un recurso en el servidor MCP
   */
  registerResource(
    name: string,
    uri: string,
    metadata: Record<string, any> = {},
    handler: () => Promise<MCPResourceResponse>,
  ): void {
    this.resources.set(name, {
      name,
      uri,
      metadata,
      handler,
    });
    this.log('info', `📁 Recurso registrado: ${name} -> ${uri}`);
  }

  /**
   * Registra una herramienta en el servidor MCP
   */
  registerTool(
    name: string,
    metadata: Record<string, any> = {},
    handler: (params?: any) => Promise<MCPToolResponse>,
  ): void {
    this.tools.set(name, {
      name,
      metadata,
      handler,
    });
    this.log('info', `🛠️ Herramienta registrada: ${name}`);
  }

  /**
   * Lee un recurso por URI
   */
  async readResource(uri: string): Promise<MCPResourceResponse> {
    for (const [name, resource] of this.resources) {
      if (resource.uri === uri) {
        try {
          return await resource.handler();
        } catch (error) {
          this.log('error', `Error leyendo recurso ${name}: ${error}`);
          throw error;
        }
      }
    }
    throw new Error(`Recurso no encontrado: ${uri}`);
  }

  /**
   * Ejecuta una herramienta por nombre
   */
  async callTool(name: string, params?: any): Promise<MCPToolResponse> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Herramienta no encontrada: ${name}`);
    }

    try {
      return await tool.handler(params);
    } catch (error) {
      this.log('error', `Error ejecutando herramienta ${name}: ${error}`);
      throw error;
    }
  }

  /**
   * Procesa una consulta del usuario
   */
  async processUserQuery(
    query: string,
    _context?: unknown,
  ): Promise<MCPResponse> {
    const lowerQuery = query.toLowerCase();

    // Comandos básicos
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

    if (lowerQuery.includes('ayuda') || lowerQuery.includes('help')) {
      const availableTools = Array.from(this.tools.keys()).join(', ');
      const availableResources = Array.from(this.resources.keys()).join(', ');

      return {
        success: true,
        data: {
          content: [
            {
              type: 'text',
              text: `Comandos disponibles:\n• Herramientas: ${availableTools}\n• Recursos: ${availableResources}\n• "hola" - Saludos\n• "hora" - Ver hora actual\n• "clima" - Simular clima\n• "calcula X + Y" - Calculadora simple`,
            },
          ],
        },
        timestamp: Date.now(),
      };
    }

    if (lowerQuery.includes('hora') || lowerQuery.includes('time')) {
      const now = new Date();
      return {
        success: true,
        data: {
          content: [
            {
              type: 'text',
              text: `🕐 La hora actual es: ${now.toLocaleString()}`,
            },
          ],
        },
        timestamp: Date.now(),
      };
    }

    if (lowerQuery.includes('clima') || lowerQuery.includes('weather')) {
      const weatherConditions = [
        '☀️ Soleado',
        '🌤️ Parcialmente nublado',
        '☁️ Nublado',
        '🌧️ Lluvioso',
        '⛈️ Tormenta',
      ];
      const randomWeather =
        weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

      return {
        success: true,
        data: {
          content: [
            {
              type: 'text',
              text: `🌤️ Clima simulado: ${randomWeather} - 22°C`,
            },
          ],
        },
        timestamp: Date.now(),
      };
    }

    if (lowerQuery.includes('calcula') || lowerQuery.includes('calculate')) {
      try {
        const expression = query.replace(/calcula|calculate/gi, '').trim();
        const result = eval(expression);
        return {
          success: true,
          data: {
            content: [
              {
                type: 'text',
                text: `🧮 Resultado: ${expression} = ${result}`,
              },
            ],
          },
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          error: 'No pude procesar esa expresión matemática',
          timestamp: Date.now(),
        };
      }
    }

    // Respuesta por defecto
    return {
      success: true,
      data: {
        content: [
          {
            type: 'text',
            text: 'No entiendo ese comando. Escribe \'ayuda\' para ver las opciones disponibles.',
          },
        ],
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Obtiene la lista de recursos disponibles
   */
  getAvailableResources(): string[] {
    return Array.from(this.resources.keys());
  }

  /**
   * Obtiene la lista de herramientas disponibles
   */
  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Obtiene la configuración del servidor
   */
  getConfig(): MCPServerConfig {
    return { ...this.config };
  }

  /**
   * Verifica si el servidor está corriendo
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Métodos abstractos que deben ser implementados por las subclases
   */
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  /**
   * Sistema de logging
   */
  protected log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
  ): void {
    const timestamp = new Date().toISOString();
    const logLevel = this.config.logLevel || 'info';

    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] < levels[logLevel as keyof typeof levels]) {
      return;
    }

    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
  }

  /**
   * Establece el estado de ejecución del servidor
   */
  protected setRunning(running: boolean): void {
    this.isRunning = running;
  }
}
