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
        NotificationInput: {
          type: "object",
          required: [
            "event",
            "context",
            "channels",
            "recipient",
            "conditionType",
            "conditionOperator",
            "conditionValue",
          ],
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
            conditionType: {
              type: "string",
              description:
                "Métrica a evaluar: global (total_events, attendee_count, gross_value, gross) o por evento (capacity, quantity_sold, quantity_total, quantity_remaining, percent_sold, percent_remaining, gross_value, price)",
            },
            conditionOperator: { type: "string", enum: ["<", ">"] },
            conditionValue: { type: "number" },
            eventID: {
              type: "string",
              description:
                "Opcional. Si se proporciona, la métrica se evalúa sobre ese evento dentro del snapshot actual. Si no, se usa global_stats.",
            },
          },
        },
        Trigger: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            eventID: { type: "string" },
            triggerName: { type: "string", maxLength: 50 },
            conditionType: { type: "string" },
            conditionOperator: { type: "string", enum: ["<", ">"] },
            conditionValue: { type: "number" },
            message: { type: "string", maxLength: 2250 },
            channel: { type: "string", enum: ["email", "telegram", "push"] },
            audience: { type: "string" },
            active: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        TriggerInput: {
          type: "object",
          required: [
            "eventID",
            "triggerName",
            "conditionType",
            "conditionOperator",
            "conditionValue",
            "message",
            "channel",
            "audience",
            "active",
          ],
          properties: {
            eventID: { type: "string" },
            triggerName: { type: "string", maxLength: 50 },
            conditionType: { type: "string" },
            conditionOperator: { type: "string", enum: ["<", ">"] },
            conditionValue: { type: "number" },
            message: { type: "string", maxLength: 2250 },
            channel: { type: "string", enum: ["email", "telegram", "push"] },
            audience: { type: "string" },
            active: { type: "boolean" },
          },
        },
        TriggerUpdate: {
          type: "object",
          description: "Todos los campos son opcionales. No se permite eventID.",
          properties: {
            triggerName: { type: "string", maxLength: 50 },
            conditionType: { type: "string" },
            conditionOperator: { type: "string", enum: ["<", ">"] },
            conditionValue: { type: "number" },
            message: { type: "string", maxLength: 2250 },
            channel: { type: "string", enum: ["email", "telegram", "push"] },
            audience: { type: "string" },
            active: { type: "boolean" },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "..", "routes", "*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
