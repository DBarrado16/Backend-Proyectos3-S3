require("dotenv").config();

// Captura errores no controlados para que sean visibles en los logs de Railway
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

const http = require("http");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger/config");
const { initWebSocket } = require("./channels/push");

const notificationsRouter = require("./routes/notifications");
const triggersRouter = require("./routes/triggers");
const plantillasRouter = require("./routes/plantillas");
const statsRouter = require("./routes/stats");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// CORS: permite los orígenes definidos en CORS_ORIGINS (separados por coma)
// Si no está definido, permite todo (útil en local)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : null;

app.use(cors({
  origin: allowedOrigins || true,
  credentials: true,
}));
app.use("https://evco-black.vercel.app");
app.use(express.json());

// Healthcheck para Railway
app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Rutas
app.use("/notifications", notificationsRouter);
app.use("/triggers", triggersRouter);
app.use("/plantillas", plantillasRouter);
app.use("/stats", statsRouter);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

// Inicializar WebSocket para push notifications
initWebSocket(server);

// Bind a 0.0.0.0 para que Railway/Docker pueda alcanzar el contenedor
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`WebSocket disponible en ws://localhost:${PORT}`);
});
