import { describe, it, expect, beforeEach, vi } from "vitest";
import { MCPServer } from "../src/server";
import type {
  MCPServerConfig,
  MCPResourceResponse,
  MCPToolResponse,
} from "../src/types";

// Mock implementation for testing
class TestMCPServer extends MCPServer {
  async start(): Promise<void> {
    this.setRunning(true);
  }

  async stop(): Promise<void> {
    this.setRunning(false);
  }
}

describe("MCPServer", () => {
  let server: TestMCPServer;

  beforeEach(() => {
    server = new TestMCPServer();
  });

  describe("Constructor", () => {
    it("should initialize with default config", () => {
      expect(server.getConfig()).toEqual({
        port: 3001,
        host: "localhost",
        enableHttp: true,
        enableWebSocket: false,
        cors: true,
        corsOrigin: "*",
        logLevel: "info",
      });
    });

    it("should initialize with custom config", () => {
      const customConfig: MCPServerConfig = {
        port: 8080,
        host: "0.0.0.0",
        logLevel: "debug",
      };
      const customServer = new TestMCPServer(customConfig);

      expect(customServer.getConfig().port).toBe(8080);
      expect(customServer.getConfig().host).toBe("0.0.0.0");
      expect(customServer.getConfig().logLevel).toBe("debug");
    });
  });

  describe("Resource Management", () => {
    it("should register a resource successfully", () => {
      const mockHandler = vi.fn().mockResolvedValue({
        success: true,
        data: { content: "test content" },
        timestamp: Date.now(),
      });

      server.registerResource(
        "test-resource",
        "file://test.txt",
        {},
        mockHandler
      );

      expect(server.getAvailableResources()).toContain("test-resource");
    });

    it("should read a registered resource", async () => {
      const expectedResponse: MCPResourceResponse = {
        success: true,
        data: { content: "test content", mimeType: "text/plain" },
        timestamp: Date.now(),
      };

      const mockHandler = vi.fn().mockResolvedValue(expectedResponse);
      server.registerResource(
        "test-resource",
        "file://test.txt",
        {},
        mockHandler
      );

      const result = await server.readResource("file://test.txt");

      expect(result).toEqual(expectedResponse);
      expect(mockHandler).toHaveBeenCalledOnce();
    });

    it("should throw error when reading non-existent resource", async () => {
      await expect(
        server.readResource("file://nonexistent.txt")
      ).rejects.toThrow("Recurso no encontrado: file://nonexistent.txt");
    });
  });

  describe("Tool Management", () => {
    it("should register a tool successfully", () => {
      const mockHandler = vi.fn().mockResolvedValue({
        success: true,
        data: { result: "test result" },
        timestamp: Date.now(),
      });

      server.registerTool("test-tool", {}, mockHandler);

      expect(server.getAvailableTools()).toContain("test-tool");
    });

    it("should call a registered tool", async () => {
      const expectedResponse: MCPToolResponse = {
        success: true,
        data: { result: "test result" },
        timestamp: Date.now(),
      };

      const mockHandler = vi.fn().mockResolvedValue(expectedResponse);
      server.registerTool("test-tool", {}, mockHandler);

      const result = await server.callTool("test-tool", { param: "value" });

      expect(result).toEqual(expectedResponse);
      expect(mockHandler).toHaveBeenCalledWith({ param: "value" });
    });

    it("should throw error when calling non-existent tool", async () => {
      await expect(server.callTool("nonexistent-tool")).rejects.toThrow(
        "Herramienta no encontrada: nonexistent-tool"
      );
    });
  });

  describe("Query Processing", () => {
    it("should handle hello query", async () => {
      const result = await server.processUserQuery("hola");

      expect(result.success).toBe(true);
      expect(result.data?.content[0].text).toContain("¡Hola!");
    });

    it("should handle help query", async () => {
      server.registerTool("test-tool", {}, vi.fn());
      server.registerResource("test-resource", "file://test.txt", {}, vi.fn());

      const result = await server.processUserQuery("ayuda");

      expect(result.success).toBe(true);
      expect(result.data?.content[0].text).toContain("test-tool");
      expect(result.data?.content[0].text).toContain("test-resource");
    });

    it("should handle time query", async () => {
      const result = await server.processUserQuery("hora");

      expect(result.success).toBe(true);
      expect(result.data?.content[0].text).toContain("🕐");
    });

    it("should handle weather query", async () => {
      const result = await server.processUserQuery("clima");

      expect(result.success).toBe(true);
      expect(result.data?.content[0].text).toContain("🌤️");
    });

    it("should handle calculation query", async () => {
      const result = await server.processUserQuery("calcula 2 + 2");

      expect(result.success).toBe(true);
      expect(result.data?.content[0].text).toContain("4");
    });

    it("should handle invalid calculation", async () => {
      const result = await server.processUserQuery("calcula invalid");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Server State", () => {
    it("should track running state", async () => {
      expect(server.isServerRunning()).toBe(false);

      await server.start();
      expect(server.isServerRunning()).toBe(true);

      await server.stop();
      expect(server.isServerRunning()).toBe(false);
    });
  });
});
