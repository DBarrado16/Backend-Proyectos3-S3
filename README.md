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

## Autenticación JWT

Todos los endpoints (excepto `/health` y `/auth/login`) requieren un token JWT.

### 1. Obtener token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
# → { "token": "eyJ...", "expiresIn": "8h" }
```

### 2. Usar el token

Añade el header `Authorization: Bearer <token>` a todas las peticiones:

```bash
curl http://localhost:3000/plantillas \
  -H "Authorization: Bearer eyJ..."
```

Las credenciales por defecto son `admin` / `admin`. Cámbialas en `.env` con `ADMIN_USERNAME` y `ADMIN_PASSWORD`. El secreto de firma del token se configura con `JWT_SECRET`.

---

## Testing

### Herramientas

| Capa | Herramienta |
|---|---|
| Unitario (servicios) | **Jest** |
| Integración (rutas HTTP) | **Jest + Supertest** |
| E2E (flujo completo FE↔BE) | **Playwright** |

### Estrategia

#### Tests unitarios — `src/services/`
Verificar la lógica de negocio de cada clase de servicio de forma aislada, mockeando `fs/promises` para no tocar disco:
- `PlantillasService`: CRUD correcto, IDs únicos, `null` en getById cuando no existe.
- `TriggersService`: creación de triggers, `evaluateAndDispatchAll` con condiciones `>` y `<`.
- `StatsService`: validación de rango de días, error `INVALID_DAY` / `DAY_NOT_FOUND`.

#### Tests de integración — `src/routes/`
Levantar la app en memoria con Supertest y ejercitar cada endpoint:
- `POST /auth/login` → 200 con token / 401 con credenciales malas.
- `GET /plantillas` sin token → 401.
- CRUD completo de `/plantillas` y `/triggers` con token válido.
- `PUT /stats/current` → verifica que se reevalúan los triggers.

#### Tests E2E — frontend
Con **Playwright** contra el stack completo (BE en local o staging):
- Flujo de login: usuario introduce credenciales → token almacenado.
- Crear un trigger desde la UI → aparece en la lista.
- Cambiar el día activo → triggers con condición cumplida se marcan en `warn`.

### Comandos previstos

```bash
# Instalar dependencias de test (pendiente)
npm install --save-dev jest supertest

# Ejecutar tests unitarios e integración
npm test

# Ejecutar tests E2E (requiere servidor arrancado)
npx playwright test
```

---

## Estructura

```
src/
  index.js
  middleware/    auth.js (verifyToken JWT)
  routes/        auth.js · trigger.js · plantillas.js · stats.js · triggers.js
  services/      ai.js · dispatcher.js · plantillasService.js · statsService.js · triggersService.js
  channels/      push.js · email.js · telegram.js
  schemas/       plantilla.js · trigger.js
  swagger/       config.js
data/
  current.json
  plantillas.json
  triggers.json
  1.json … 12.json
```
