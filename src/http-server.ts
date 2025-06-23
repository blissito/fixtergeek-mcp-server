import { createServer, IncomingMessage, ServerResponse } from "http";
import { MCPServer } from "./server";
import type { MCPServerConfig, MCPResponse, MCPRequest } from "./types";

export class MCPHttpServer extends MCPServer {
  private server: ReturnType<typeof createServer> | null = null;

  constructor(config: MCPServerConfig = {}) {
    super(config);
    this.setupDefaultResources();
    this.setupDefaultTools();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.log("warn", "Servidor ya está corriendo");
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = createServer(this.handleRequest.bind(this));

      this.server.on("error", (error) => {
        this.log("error", `Error del servidor: ${error}`);
        reject(error);
      });

      this.server.listen(this.config.port, this.config.host, () => {
        this.setRunning(true);
        this.log(
          "info",
          `🚀 Servidor MCP HTTP iniciado en puerto ${this.config.port}`
        );
        this.log(
          "info",
          `📁 Recursos disponibles: ${this.getAvailableResources().join(", ")}`
        );
        this.log(
          "info",
          `🛠️ Herramientas disponibles: ${this.getAvailableTools().join(", ")}`
        );
        this.log("info", `✅ Listo para conectar con react-hook-mcp`);
        this.log(
          "info",
          `🌐 HTTP disponible en http://${this.config.host}:${this.config.port}`
        );
        this.log("info", `📡 Endpoints: /resource, /tool, /query`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      return;
    }

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.setRunning(false);
        this.server = null;
        this.log("info", "Servidor MCP detenido");
        resolve();
      });
    });
  }

  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    // Configurar CORS
    if (this.config.cors) {
      res.setHeader(
        "Access-Control-Allow-Origin",
        this.config.corsOrigin || "*"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }
    }

    // Configurar headers de respuesta
    res.setHeader("Content-Type", "application/json");

    try {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      const path = url.pathname;

      this.log(
        "debug",
        `📨 ${path} - Datos recibidos: ${JSON.stringify(url.searchParams)}`
      );

      // Endpoint de prueba
      if (path === "/" && req.method === "GET") {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            message: "Servidor MCP funcionando",
            timestamp: Date.now(),
            test: true,
          })
        );
        return;
      }

      // Endpoint para leer recursos
      if (path === "/resource" && req.method === "GET") {
        const uri = url.searchParams.get("uri");
        if (!uri) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "URI requerida" }));
          return;
        }

        try {
          const response = await this.readResource(uri);
          res.writeHead(200);
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: `Recurso no encontrado: ${uri}` }));
        }
        return;
      }

      // Endpoint para ejecutar herramientas
      if (path === "/tool" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const request: MCPRequest = JSON.parse(body);
            const toolName = request.tool || url.searchParams.get("name");

            if (!toolName) {
              res.writeHead(400);
              res.end(
                JSON.stringify({ error: "Nombre de herramienta requerido" })
              );
              return;
            }

            const response = await this.callTool(toolName, request.params);
            res.writeHead(200);
            res.end(JSON.stringify(response));
          } catch (error) {
            res.writeHead(500);
            res.end(
              JSON.stringify({
                error: `Error ejecutando herramienta: ${error}`,
              })
            );
          }
        });
        return;
      }

      // Endpoint para consultas del usuario
      if (path === "/query" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const request: MCPRequest = JSON.parse(body);
            const query = request.query || url.searchParams.get("query");

            if (!query) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: "Query requerida" }));
              return;
            }

            const response = await this.processUserQuery(
              query,
              request.context
            );
            res.writeHead(200);
            res.end(JSON.stringify(response));
          } catch (error) {
            res.writeHead(500);
            res.end(
              JSON.stringify({ error: `Error procesando query: ${error}` })
            );
          }
        });
        return;
      }

      // Endpoint no encontrado
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Endpoint no encontrado" }));
    } catch (error) {
      this.log("error", `Error manejando request: ${error}`);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Error interno del servidor" }));
    }
  }

  private setupDefaultResources(): void {
    // Recurso de ejemplo
    this.registerResource(
      "hello",
      "file:///hello.txt",
      { description: "Archivo de saludo de ejemplo" },
      async () => ({
        success: true,
        data: {
          content:
            "¡Hola desde el servidor MCP! Este es un recurso de ejemplo.",
          mimeType: "text/plain",
        },
        timestamp: Date.now(),
      })
    );
  }

  private setupDefaultTools(): void {
    // Herramienta de ejemplo para "pelusear"
    this.registerTool(
      "tool-pelusear",
      { description: "Herramienta de ejemplo para explorar" },
      async (params) => ({
        success: true,
        data: {
          result: {
            message: "🔍 Peluseando... Encontré información interesante!",
            timestamp: new Date().toISOString(),
            params,
          },
        },
        timestamp: Date.now(),
      })
    );

    // Herramienta de información
    this.registerTool(
      "tool-info",
      { description: "Obtiene información del sistema" },
      async () => ({
        success: true,
        data: {
          result: {
            server: "MCP HTTP Server",
            version: "1.0.0",
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
          },
        },
        timestamp: Date.now(),
      })
    );
  }
}
