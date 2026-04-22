const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backend Notificaciones IA",
      version: "2.1.0",
      description: "API del backend de notificaciones con IA (LangChain + OpenRouter). Incluye triggers, plantillas y stats simulados de venta de entradas.",
    },
    servers: [
      { url: "http://localhost:3000", description: "Desarrollo local" },
    ],
    components: {
      schemas: {
        Plantilla: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", maxLength: 100 },
            text: { type: "string", maxLength: 2250 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        PlantillaInput: {
          type: "object",
          required: ["name", "text"],
          properties: {
            name: { type: "string", maxLength: 100 },
            text: { type: "string", maxLength: 2250 },
          },
        },
        PlantillaUpdate: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 100 },
            text: { type: "string", maxLength: 2250 },
          },
        },
        TriggerInput: {
          type: "object",
          required: ["event", "context", "channels", "recipient"],
          properties: {
            event: { type: "string" },
            context: { type: "object" },
            channels: {
              type: "array",
              items: { type: "string", enum: ["email", "telegram", "push"] },
            },
            recipient: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                telegramChatId: { type: "string" },
                userId: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "..", "routes", "*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
