import { describe, it, expect } from "vitest";
import type {
  MCPServerConfig,
  MCPResponse,
  MCPResourceResponse,
  MCPToolResponse,
  MCPRequest,
  MCPResource,
  MCPTool,
} from "../src/types";

describe("Types", () => {
  describe("MCPServerConfig", () => {
    it("should allow partial configuration", () => {
      const config: MCPServerConfig = {
        port: 3001,
        logLevel: "debug",
      };

      expect(config.port).toBe(3001);
      expect(config.logLevel).toBe("debug");
    });
  });

  describe("MCPResponse", () => {
    it("should create successful response", () => {
      const response: MCPResponse = {
        success: true,
        data: {
          content: [
            {
              type: "text",
              text: "Hello world",
            },
          ],
        },
        timestamp: Date.now(),
      };

      expect(response.success).toBe(true);
      expect(response.data?.content[0].text).toBe("Hello world");
    });

    it("should create error response", () => {
      const response: MCPResponse = {
        success: false,
        error: "Something went wrong",
        timestamp: Date.now(),
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe("Something went wrong");
    });
  });

  describe("MCPResourceResponse", () => {
    it("should create resource response", () => {
      const response: MCPResourceResponse = {
        success: true,
        data: {
          content: "file content",
          mimeType: "text/plain",
          metadata: { size: 1024 },
        },
        timestamp: Date.now(),
      };

      expect(response.data?.content).toBe("file content");
      expect(response.data?.mimeType).toBe("text/plain");
    });
  });

  describe("MCPToolResponse", () => {
    it("should create tool response", () => {
      const response: MCPToolResponse = {
        success: true,
        data: {
          result: { calculated: true, value: 42 },
          metadata: { executionTime: 100 },
        },
        timestamp: Date.now(),
      };

      expect(response.data?.result.value).toBe(42);
      expect(response.data?.metadata?.executionTime).toBe(100);
    });
  });

  describe("MCPRequest", () => {
    it("should create query request", () => {
      const request: MCPRequest = {
        query: "What is the weather?",
        context: { location: "Madrid" },
      };

      expect(request.query).toBe("What is the weather?");
      expect(request.context?.location).toBe("Madrid");
    });

    it("should create tool request", () => {
      const request: MCPRequest = {
        tool: "calculator",
        params: { operation: "add", a: 5, b: 3 },
      };

      expect(request.tool).toBe("calculator");
      expect(request.params?.operation).toBe("add");
    });
  });

  describe("MCPResource", () => {
    it("should define resource structure", () => {
      const resource: MCPResource = {
        name: "test-file",
        uri: "file://test.txt",
        metadata: { size: 1024 },
        handler: async () => ({
          success: true,
          data: { content: "test content" },
          timestamp: Date.now(),
        }),
      };

      expect(resource.name).toBe("test-file");
      expect(resource.uri).toBe("file://test.txt");
      expect(typeof resource.handler).toBe("function");
    });
  });

  describe("MCPTool", () => {
    it("should define tool structure", () => {
      const tool: MCPTool = {
        name: "calculator",
        metadata: { description: "Simple calculator" },
        handler: async (params) => ({
          success: true,
          data: { result: 42 },
          timestamp: Date.now(),
        }),
      };

      expect(tool.name).toBe("calculator");
      expect(tool.metadata.description).toBe("Simple calculator");
      expect(typeof tool.handler).toBe("function");
    });
  });
});
