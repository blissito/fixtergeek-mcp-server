// Tipos base para el servidor MCP
export interface MCPServerConfig {
  port?: number;
  host?: string;
  enableHttp?: boolean;
  enableWebSocket?: boolean;
  cors?: boolean;
  corsOrigin?: string;
  logLevel?: "debug" | "info" | "warn" | "error";
}

export interface MCPResourceConfig {
  name: string;
  uri: string;
  metadata?: Record<string, any>;
}

export interface MCPToolConfig {
  name: string;
  metadata?: Record<string, any>;
}

// Respuestas del servidor
export interface MCPResponse {
  success: boolean;
  data?: {
    content: Array<{
      type: "text" | "image" | "file";
      text?: string;
      url?: string;
      metadata?: Record<string, any>;
    }>;
  };
  error?: string;
  timestamp: number;
}

export interface MCPResourceResponse {
  success: boolean;
  data?: {
    content: string;
    mimeType?: string;
    metadata?: Record<string, any>;
  };
  error?: string;
  timestamp: number;
}

export interface MCPToolResponse {
  success: boolean;
  data?: {
    result: any;
    metadata?: Record<string, any>;
  };
  error?: string;
  timestamp: number;
}

// Requests del cliente
export interface MCPRequest {
  query?: string;
  tool?: string;
  resource?: string;
  params?: Record<string, any>;
  context?: Record<string, any>;
}

// Recursos y herramientas internos
export interface MCPResource {
  name: string;
  uri: string;
  metadata: Record<string, any>;
  handler: () => Promise<MCPResourceResponse>;
}

export interface MCPTool {
  name: string;
  metadata: Record<string, any>;
  handler: (params?: any) => Promise<MCPToolResponse>;
}

export interface MCPQuery {
  query: string;
  context?: Record<string, any>;
}
