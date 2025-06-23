import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMCPServer, exampleConfigs } from "../src/factory";
import type { MCPWithLLMConfig } from "../src/factory";

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
};

describe("Factory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMCPServer", () => {
    it("should create server without LLM config", () => {
      const server = createMCPServer();

      expect(server).toBeDefined();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "📝 Usando respuestas simuladas (sin LLM configurado)"
      );
    });

    it("should create server with OpenAI config", () => {
      const config: MCPWithLLMConfig = {
        port: 3001,
        llm: {
          provider: "openai",
          apiKey: "test-key",
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          maxTokens: 1000,
        },
      };

      const server = createMCPServer(config);

      expect(server).toBeDefined();
    });

    it("should create server with Ollama config", () => {
      const config: MCPWithLLMConfig = {
        port: 3001,
        llm: {
          provider: "ollama",
          baseUrl: "http://localhost:11434",
          model: "llama2",
          temperature: 0.7,
        },
      };

      const server = createMCPServer(config);

      expect(server).toBeDefined();
    });

    it("should handle LLM integration errors gracefully", () => {
      const config: MCPWithLLMConfig = {
        port: 3001,
        llm: {
          provider: "invalid-provider" as any,
          apiKey: "test-key",
        },
      };

      const server = createMCPServer(config);

      expect(server).toBeDefined();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining("Error integrando LLM")
      );
    });
  });

  describe("exampleConfigs", () => {
    it("should have OpenAI config", () => {
      expect(exampleConfigs.openai).toBeDefined();
      expect(exampleConfigs.openai.llm?.provider).toBe("openai");
      expect(exampleConfigs.openai.llm?.model).toBe("gpt-3.5-turbo");
    });

    it("should have Ollama config", () => {
      expect(exampleConfigs.ollama).toBeDefined();
      expect(exampleConfigs.ollama.llm?.provider).toBe("ollama");
      expect(exampleConfigs.ollama.llm?.model).toBe(
        process.env.OLLAMA_MODEL || "llama2"
      );
    });

    it("should have simulated config", () => {
      expect(exampleConfigs.simulated).toBeDefined();
      expect(exampleConfigs.simulated.llm).toBeUndefined();
    });
  });
});
