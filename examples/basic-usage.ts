#!/usr/bin/env tsx

import { createMCPServer, exampleConfigs } from "../src";

// Ejemplo básico sin LLM
async function basicExample() {
  console.log("🚀 Iniciando servidor MCP básico...");

  const server = createMCPServer({
    port: 3001,
    cors: true,
    logLevel: "info",
  });

  try {
    await server.start();
    console.log("✅ Servidor iniciado correctamente");

    // Mantener el servidor corriendo
    process.on("SIGINT", async () => {
      console.log("\n🛑 Deteniendo servidor...");
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    process.exit(1);
  }
}

// Ejemplo con OpenAI
async function openaiExample() {
  console.log("🤖 Iniciando servidor MCP con OpenAI...");

  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      "⚠️ OPENAI_API_KEY no configurada, usando respuestas simuladas"
    );
  }

  const server = createMCPServer({
    ...exampleConfigs.openai,
    llm: {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY || "",
      model: "gpt-3.5-turbo",
      temperature: 0.7,
    },
  });

  try {
    await server.start();
    console.log("✅ Servidor con OpenAI iniciado");

    process.on("SIGINT", async () => {
      console.log("\n🛑 Deteniendo servidor...");
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    process.exit(1);
  }
}

// Ejemplo con Ollama
async function ollamaExample() {
  console.log("🦙 Iniciando servidor MCP con Ollama...");

  const server = createMCPServer({
    ...exampleConfigs.ollama,
    llm: {
      provider: "ollama",
      baseUrl: "http://localhost:11434",
      model: "llama2",
      temperature: 0.7,
    },
  });

  try {
    await server.start();
    console.log("✅ Servidor con Ollama iniciado");

    process.on("SIGINT", async () => {
      console.log("\n🛑 Deteniendo servidor...");
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    process.exit(1);
  }
}

// Función principal
async function main() {
  const mode = process.argv[2] || "basic";

  switch (mode) {
    case "openai":
      await openaiExample();
      break;
    case "ollama":
      await ollamaExample();
      break;
    case "basic":
    default:
      await basicExample();
      break;
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(console.error);
}

export { basicExample, openaiExample, ollamaExample };
