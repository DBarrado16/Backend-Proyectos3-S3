require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { initWebSocket } = require("./channels/push");
const triggerRouter = require("./routes/trigger");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/trigger", triggerRouter);

// Inicializar WebSocket para push notifications
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`WebSocket disponible en ws://localhost:${PORT}`);
});
