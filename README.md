# Backend de Notificaciones con IA

Backend para una plataforma de venta de entradas. Recibe triggers desde el front,
genera el texto con IA (LangChain + OpenRouter / Gemma 4) y lo manda por
**email**, **Telegram** o **push (WebSocket)**.

Incluye:
- CRUD de **plantillas** de notificación.
- API falsa de **estadísticas** de venta (12 "días" simulados).
- **Swagger** en `/api-docs`.
- Listo para **Railway**.

---

## Stack

- Node.js + Express
- LangChain + OpenRouter (`google/gemma-4-26b-a4b-it:free`)
- Zod (validación)
- Swagger (swagger-jsdoc + swagger-ui-express)
- Nodemailer (email), Telegram Bot API (HTTP), `ws` (push)

## Instalación

```bash
npm install
cp .env.example .env   # rellena tus claves
npm run dev
```

Servidor: `http://localhost:3000` · Swagger: `http://localhost:3000/api-docs`

---

## Endpoints

### `POST /trigger`
Genera el texto con IA y lo despacha.
```json
{
  "event": "low_stock_tickets",
  "context": { "eventName": "Concierto Duki", "remaining": "40%" },
  "channels": ["email", "telegram", "push"],
  "recipient": {
    "email": "ana@example.com",
    "telegramChatId": "123456789",
    "userId": "user123"
  }
}
```

### Plantillas
- `GET /plantillas` — lista
- `GET /plantillas/:id` — obtener una
- `POST /plantillas` — crear `{ name (≤100), text (≤2250) }`
- `PUT /plantillas/:id` — actualizar (name y/o text)
- `DELETE /plantillas/:id` — borrar

### Stats simuladas
- `GET /stats/current` — lee `data/current.json` y devuelve el snapshot del día
- `PUT /stats/current` — cambia el día activo: `{ "day": 5 }`
- `GET /stats/days` — lista de días disponibles (1..12)

Los datos viven en `data/1.json` … `data/12.json`. `current.json` apunta al activo.

### Códigos de error
| Código | Significado |
|---|---|
| 400 `INVALID_INPUT` / `INVALID_ID` / `INVALID_DAY` | Validación Zod fallida |
| 404 `TEMPLATE_NOT_FOUND` / `DAY_NOT_FOUND` | Recurso no existe |
| 500 `INTERNAL_ERROR` | Error inesperado |

---

## Push por WebSocket

El front se conecta a `ws://localhost:3000` y se registra:
```js
const ws = new WebSocket("ws://localhost:3000");
ws.onopen = () => ws.send(JSON.stringify({ type: "register", userId: "user123" }));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

## Despliegue en Railway

1. Sube el repo a GitHub.
2. En Railway → *New project* → *Deploy from GitHub*.
3. Añade las variables del `.env` en *Variables*.
4. Railway detecta `package.json` y `railway.json`. Healthcheck en `/health`.

---

## Estructura

```
src/
  index.js
  routes/        trigger.js · plantillas.js · stats.js
  services/      ai.js · dispatcher.js · plantillasService.js · statsService.js
  channels/      push.js · email.js · telegram.js
  schemas/       plantilla.js
  swagger/       config.js
data/
  current.json
  plantillas.json
  1.json … 12.json
```
