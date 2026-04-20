# Backend de Notificaciones con IA

Backend que recibe triggers desde un front-end React, genera texto con IA (LangChain + OpenRouter) y despacha notificaciones por Telegram, email o push (WebSocket).

## Stack

- **Node.js + Express** - Servidor HTTP
- **LangChain + OpenRouter** - Generacion de texto con Gemma 3 27B (gratuito)
- **WebSocket (ws)** - Notificaciones push en tiempo real
- **Nodemailer / SendGrid** - Email
- **Telegram Bot API** - Mensajes por Telegram

## Instalacion

```bash
npm install
```

## Configuracion

Copia `.env.example` a `.env` y completa las variables:

```bash
cp .env.example .env
```

## Ejecucion

```bash
# Desarrollo
npm run dev

# Produccion
npm start
```

## Uso

Endpoint: `POST /trigger`

```json
{
  "event": "order_placed",
  "context": { "userName": "Ana", "orderId": "1234" },
  "channels": ["email", "push", "telegram"],
  "recipient": {
    "email": "ana@example.com",
    "userId": "user123",
    "telegramChatId": "123456789"
  }
}
```

### Respuesta

```json
{
  "ok": true,
  "text": "Hola Ana, tu pedido #1234 ha sido confirmado.",
  "results": [
    { "channel": "email", "ok": true },
    { "channel": "push", "ok": true },
    { "channel": "telegram", "ok": true }
  ]
}
```

## Push por WebSocket

El cliente se conecta a `ws://localhost:3000` y se registra enviando:

```json
{ "type": "register", "userId": "user123" }
```

Las notificaciones llegan como:

```json
{ "type": "notification", "text": "...", "timestamp": "..." }
```

## Estructura del proyecto

```
src/
  index.js              - Punto de entrada, Express + WebSocket
  routes/trigger.js     - Recibe POST /trigger
  services/ai.js        - LangChain llama a OpenRouter (Gemma 3 27B)
  services/dispatcher.js - Enruta la notificacion por canal
  channels/
    push.js             - Push via WebSocket
    email.js            - Envio via Nodemailer/SendGrid
    telegram.js         - Envio via Telegram Bot API
```
