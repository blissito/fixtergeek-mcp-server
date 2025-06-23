// Exportaciones principales del servidor MCP
export { MCPServer } from "./server";
export { MCPHttpServer } from "./http-server";
export { MCPResource, MCPTool, MCPQuery } from "./types";
export { createMCPServer } from "./factory";

// Integración con LLMs
export {
  LLMFactory,
  MCPLLMIntegration,
  OpenAIProvider,
  OllamaProvider,
} from "./llm-integration";

// Tipos y utilidades
export type {
  MCPServerConfig,
  MCPResourceConfig,
  MCPToolConfig,
  MCPResponse,
  MCPRequest,
} from "./types";

export type { LLMConfig, LLMRequest, LLMResponse } from "./llm-integration";

// Configuraciones de ejemplo
export { exampleConfigs } from "./factory";
