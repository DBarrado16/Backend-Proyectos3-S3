# Backend de Notificaciones con IA

Backend que recibe triggers desde un front-end React, genera texto con IA (OpenRouter) y despacha notificaciones por push, email o SMS.

## Stack

- **Node.js + Express** - Servidor HTTP
- **OpenRouter API** - Generacion de texto con Mistral 7B
- **Firebase Cloud Messaging** - Notificaciones push
- **Nodemailer / SendGrid** - Email
- **Twilio** - SMS

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
  "channels": ["email", "push"],
  "recipient": {
    "email": "ana@example.com",
    "pushToken": "fcm_token_aqui"
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
    { "channel": "push", "ok": true }
  ]
}
```

## Estructura del proyecto

```
src/
  index.js              - Punto de entrada, configura Express
  routes/trigger.js     - Recibe POST /trigger
  services/ai.js        - Llama a OpenRouter para generar texto
  services/dispatcher.js - Enruta la notificacion por canal
  channels/
    push.js             - Envio via Firebase Cloud Messaging
    email.js            - Envio via Nodemailer/SendGrid
    sms.js              - Envio via Twilio
```
