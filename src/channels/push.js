const { WebSocketServer } = require("ws");

// Mapa de clientes conectados: userId -> ws
const clients = new Map();

function initWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    // El cliente envía su userId al conectarse
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === "register" && msg.userId) {
          clients.set(msg.userId, ws);
          console.log(`Cliente registrado: ${msg.userId}`);
        }
      } catch (err) {
        // Ignorar mensajes no JSON
      }
    });

    ws.on("close", () => {
      // Eliminar cliente desconectado
      for (const [userId, client] of clients) {
        if (client === ws) {
          clients.delete(userId);
          console.log(`Cliente desconectado: ${userId}`);
          break;
        }
      }
    });
  });

  console.log("WebSocket Server inicializado");
}

async function sendPush(text, recipient) {
  if (!recipient.userId) {
    throw new Error("Falta userId en recipient para push");
  }

  const ws = clients.get(recipient.userId);
  if (!ws || ws.readyState !== 1) {
    throw new Error(`Cliente "${recipient.userId}" no conectado`);
  }

  ws.send(JSON.stringify({
    type: "notification",
    text,
    timestamp: new Date().toISOString(),
  }));
}

module.exports = { initWebSocket, sendPush };
