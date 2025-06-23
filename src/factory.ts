import { MCPHttpServer } from "./http-server";
import {
  MCPLLMIntegration,
  LLMFactory,
  type LLMConfig,
} from "./llm-integration";
import type { MCPServerConfig } from "./types";

export interface MCPWithLLMConfig extends MCPServerConfig {
  llm?: LLMConfig;
}

export function createMCPServer(config: MCPWithLLMConfig = {}) {
  const server = new MCPHttpServer(config);

  // Si se proporciona configuración de LLM, integrar
  if (config.llm) {
    try {
      const llmProvider = LLMFactory.createProvider(config.llm);
      const llmIntegration = new MCPLLMIntegration(llmProvider);

      // Configurar las herramientas y recursos disponibles
      llmIntegration.setAvailableTools(server.getAvailableTools());
      llmIntegration.setAvailableResources(server.getAvailableResources());

      // Sobrescribir el método processUserQuery para usar el LLM
      const originalProcessUserQuery = server.processUserQuery.bind(server);
      server.processUserQuery = async (query: string, context?: any) => {
        return await llmIntegration.processUserQuery(query, context);
      };

      console.log(
        `🤖 LLM integrado: ${config.llm.provider} (${
          config.llm.model || "default"
        })`
      );
    } catch (error) {
      console.warn(
        `⚠️ Error integrando LLM: ${error}. Usando respuestas simuladas.`
      );
    }
  } else {
    console.log("📝 Usando respuestas simuladas (sin LLM configurado)");
  }

  return server;
}

// Ejemplos de configuración
export const exampleConfigs: {
  openai: MCPWithLLMConfig;
  ollama: MCPWithLLMConfig;
  simulated: MCPWithLLMConfig;
} = {
  // Con OpenAI
  openai: {
    port: 3001,
    llm: {
      provider: "openai" as const,
      apiKey: process.env.OPENAI_API_KEY || "",
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 1000,
    },
  },

  // Con Ollama
  ollama: {
    port: 3001,
    llm: {
      provider: "ollama" as const,
      baseUrl: "http://localhost:11434",
      // El modelo puede ser cualquier modelo disponible en tu instancia de Ollama
      model: process.env.OLLAMA_MODEL || "llama2",
      temperature: 0.7,
    },
  },

  // Solo simulado (sin LLM)
  simulated: {
    port: 3001,
  },
};
