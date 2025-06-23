# @fixtergeek/mcp-server

Servidor MCP (Model Context Protocol) modular y extensible con integración de LLMs para React y otras aplicaciones.

## 🚀 Características

- ✅ **Servidor HTTP completo** con endpoints REST
- ✅ **Integración con LLMs** (OpenAI, Ollama, Anthropic)
- ✅ **Sistema de recursos y herramientas** extensible
- ✅ **CORS configurable** para aplicaciones web
- ✅ **Logging configurable** con diferentes niveles
- ✅ **TypeScript** con tipos completos
- ✅ **Fallback a respuestas simuladas** cuando no hay LLM

## 📦 Instalación

```bash
npm install @fixtergeek/mcp-server
```

## 🔧 Uso Básico

### Servidor Simple (Sin LLM)

```typescript
import { createMCPServer } from "@fixtergeek/mcp-server";

const server = createMCPServer({
  port: 3001,
  cors: true,
});

server.start().then(() => {
  console.log("🚀 Servidor MCP iniciado");
});
```

### Con Integración de LLM

```typescript
import { createMCPServer, exampleConfigs } from "@fixtergeek/mcp-server";

// Con OpenAI
const server = createMCPServer({
  ...exampleConfigs.openai,
  llm: {
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY || "",
    model: "gpt-3.5-turbo",
  },
});

server.start();
```

## 🔌 Endpoints Disponibles

### GET `/`

Endpoint de prueba

```bash
curl http://localhost:3001/
```

### GET `/resource?uri=<uri>`

Lee un recurso por URI

```bash
curl "http://localhost:3001/resource?uri=file:///hello.txt"
```

### POST `/tool`

Ejecuta una herramienta

```bash
curl -X POST http://localhost:3001/tool \
  -H "Content-Type: application/json" \
  -d '{"tool": "tool-info"}'
```

### POST `/query`

Procesa una consulta del usuario

```bash
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"query": "¿Cuál es la hora actual?"}'
```

## 🤖 Integración con LLMs

### OpenAI (GPT)

```typescript
import { createMCPServer } from "@fixtergeek/mcp-server";

const server = createMCPServer({
  port: 3001,
  llm: {
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY || "",
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    maxTokens: 1000,
  },
});
```

### Ollama (Local)

```typescript
const server = createMCPServer({
  port: 3001,
  llm: {
    provider: "ollama",
    baseUrl: "http://localhost:11434",
    model: "llama2",
    temperature: 0.7,
  },
});
```

## 🛠️ Configuración Avanzada

### Registrando Recursos Personalizados

```typescript
import { MCPHttpServer } from "@fixtergeek/mcp-server";

const server = new MCPHttpServer({ port: 3001 });

// Registrar un recurso personalizado
server.registerResource(
  "mi-archivo",
  "file:///mi-archivo.txt",
  { description: "Mi archivo personalizado" },
  async () => ({
    success: true,
    data: {
      content: "Contenido de mi archivo",
      mimeType: "text/plain",
    },
    timestamp: Date.now(),
  })
);
```

### Registrando Herramientas Personalizadas

```typescript
// Registrar una herramienta personalizada
server.registerTool(
  "mi-herramienta",
  { description: "Mi herramienta personalizada" },
  async (params) => ({
    success: true,
    data: {
      result: {
        message: "Herramienta ejecutada",
        params,
        timestamp: new Date().toISOString(),
      },
    },
    timestamp: Date.now(),
  })
);
```

## 📋 Configuraciones de Ejemplo

```typescript
import { exampleConfigs } from "@fixtergeek/mcp-server";

// OpenAI
const openaiConfig = exampleConfigs.openai;

// Ollama
const ollamaConfig = exampleConfigs.ollama;

// Solo simulado
const simulatedConfig = exampleConfigs.simulated;
```

## 🔍 Logs y Diagnóstico

### Niveles de Log

```typescript
const server = createMCPServer({
  port: 3001,
  logLevel: "debug", // 'debug' | 'info' | 'warn' | 'error'
});
```

### Verificar Estado

```typescript
console.log("Servidor corriendo:", server.isServerRunning());
console.log("Recursos disponibles:", server.getAvailableResources());
console.log("Herramientas disponibles:", server.getAvailableTools());
```

## 🧪 Pruebas

### Verificar Servidor

```bash
# Verificar que el servidor esté funcionando
curl http://localhost:3001/

# Probar una consulta
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"query": "hola"}'
```

### Verificar LLM

```bash
# Para OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Para Ollama
curl http://localhost:11434/api/tags
```

## 🔧 Variables de Entorno

```bash
# Para OpenAI
export OPENAI_API_KEY="tu-api-key-aqui"

# Para Ollama (instalar primero)
curl -fsSL https://ollama.ai/install.sh | sh
ollama run llama2
```

## 📚 API Completa

### MCPServer

Clase base abstracta para servidores MCP.

```typescript
abstract class MCPServer {
  registerResource(
    name: string,
    uri: string,
    metadata: Record<string, any>,
    handler: () => Promise<MCPResourceResponse>
  ): void;
  registerTool(
    name: string,
    metadata: Record<string, any>,
    handler: (params?: any) => Promise<MCPToolResponse>
  ): void;
  readResource(uri: string): Promise<MCPResourceResponse>;
  callTool(name: string, params?: any): Promise<MCPToolResponse>;
  processUserQuery(query: string, context?: any): Promise<MCPResponse>;
  getAvailableResources(): string[];
  getAvailableTools(): string[];
  getConfig(): MCPServerConfig;
  isServerRunning(): boolean;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}
```

### MCPHttpServer

Implementación HTTP del servidor MCP.

```typescript
class MCPHttpServer extends MCPServer {
  constructor(config: MCPServerConfig = {});
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

### LLMFactory

Factory para crear proveedores de LLM.

```typescript
class LLMFactory {
  static createProvider(config: LLMConfig): LLMProvider;
}
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🔗 Enlaces

- [Repositorio](https://github.com/blissito/MCP_Typescript_SDK_Server)
- [Documentación completa](https://github.com/blissito/MCP_Typescript_SDK_Server#readme)
- [Issues](https://github.com/blissito/MCP_Typescript_SDK_Server/issues)
