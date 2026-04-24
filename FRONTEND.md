# Guía de integración — Frontend ↔ Backend

Documentación para el equipo de frontend (React) sobre cómo consumir la API de **Event Copilot**.

---

## 1. URL base

**Producción (Railway):**
```
https://api-eventcopilot.up.railway.app
```

**Local (desarrollo):**
```
http://localhost:3000
```

Configura la URL como variable de entorno en tu proyecto:

**`.env` (Vite):**
```env
VITE_API_URL=https://api-eventcopilot.up.railway.app
```

**En Vercel:** Settings → Environment Variables → añade `VITE_API_URL` con la URL de producción y redesplega.

**Uso en el código:**
```js
const API = import.meta.env.VITE_API_URL;
```

---

## 2. Swagger (docs interactivas)

Abre en el navegador:
```
https://api-eventcopilot.up.railway.app/api-docs
```
Desde ahí puedes probar todos los endpoints sin tocar código.

---

## 3. Endpoints

Todos devuelven/esperan **JSON**. Cabecera: `Content-Type: application/json`.

### 3.1 `POST /trigger` — Generar notificación con IA y enviarla

Recibe un evento + contexto, genera el texto con IA y lo envía por los canales indicados.

**Body:**
```json
{
  "event": "low_stock_tickets",
  "context": {
    "eventName": "Concierto Duki",
    "remaining": "40%",
    "userName": "Ana"
  },
  "channels": ["email", "telegram", "push"],
  "recipient": {
    "email": "ana@example.com",
    "telegramChatId": "123456789",
    "userId": "user-123"
  }
}
```

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `event` | string | ✅ | Nombre del evento (ej: `"low_stock_tickets"`, `"sold_out"`, `"new_event"`) |
| `context` | object | ✅ | Datos variables que la IA usará para personalizar el mensaje |
| `channels` | array | ✅ | Uno o varios de: `"email"`, `"telegram"`, `"push"` |
| `recipient.email` | string | Solo si `"email"` | Email destinatario |
| `recipient.telegramChatId` | string/number | Solo si `"telegram"` | Chat ID de Telegram del usuario |
| `recipient.userId` | string | Solo si `"push"` | ID del usuario conectado al WebSocket |

**Respuesta (200):**
```json
{
  "ok": true,
  "text": "¡Solo queda el 40% de las entradas para el Concierto Duki, Ana! No te quedes sin la tuya.",
  "results": [
    { "channel": "email", "ok": true },
    { "channel": "telegram", "ok": true },
    { "channel": "push", "ok": false, "error": "Cliente \"user-123\" no conectado" }
  ]
}
```

> Cada canal se despacha independientemente. Si uno falla, los demás siguen funcionando.

⏱ **Tiempos de respuesta:** El modelo gratuito de IA puede tardar entre 2 y 120 segundos. Sube el timeout del `fetch` a al menos **180 segundos** y muestra un loader en la UI.

**Ejemplo React:**
```js
async function enviarNotificacion() {
  const res = await fetch(`${API}/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "low_stock_tickets",
      context: { eventName: "Concierto Duki", remaining: "40%" },
      channels: ["email"],
      recipient: { email: "ana@example.com" },
    }),
  });
  const data = await res.json();
  console.log(data.text, data.results);
}
```

---

### 3.2 Plantillas — CRUD

#### `GET /plantillas` — listar todas
```js
const plantillas = await fetch(`${API}/plantillas`).then(r => r.json());
```

Respuesta:
```json
[
  {
    "id": "802e5bb8-8b27-45aa-a544-103e25c5edf7",
    "name": "Aviso stock bajo",
    "text": "Hola {nombre}, quedan pocas entradas para {evento}!",
    "createdAt": "2026-04-22T11:47:09.036Z",
    "updatedAt": "2026-04-22T11:47:09.036Z"
  }
]
```

#### `GET /plantillas/:id` — obtener una
```js
const plantilla = await fetch(`${API}/plantillas/${id}`).then(r => r.json());
```
- **404** `TEMPLATE_NOT_FOUND` si no existe.
- **400** `INVALID_ID` si el `id` no es un UUID válido.

#### `POST /plantillas` — crear

**Body:**
```json
{ "name": "Aviso stock bajo", "text": "Hola {nombre}, quedan pocas entradas..." }
```

| Campo | Tipo | Max |
|---|---|---|
| `name` | string | 100 chars |
| `text` | string | 2250 chars |

**Respuesta 201:** la plantilla creada con su `id`, `createdAt`, `updatedAt`.

```js
const nueva = await fetch(`${API}/plantillas`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, text }),
}).then(r => r.json());
```

#### `PUT /plantillas/:id` — actualizar
```js
await fetch(`${API}/plantillas/${id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Nuevo nombre" }), // puedes enviar solo name, solo text, o ambos
});
```

#### `DELETE /plantillas/:id` — borrar
```js
await fetch(`${API}/plantillas/${id}`, { method: "DELETE" });
```
**Respuesta 204** (sin body) si se borró correctamente.

---

### 3.3 Stats (datos simulados para la demo)

Hay 12 "días" precargados con datos progresivos (de entradas casi sin vender a sold-out). `current.json` apunta al día activo.

#### `GET /stats/current` — datos del día activo
```js
const stats = await fetch(`${API}/stats/current`).then(r => r.json());
```

Respuesta:
```json
{
  "day": 6,
  "date": "2026-04-25",
  "globalStats": { "totalEvents": 3, "totalSold": 4500, "totalRevenue": 220500 },
  "events": [
    {
      "id": "evt-duki",
      "name": "Concierto Duki",
      "venue": "WiZink Center",
      "date": "2026-06-15",
      "totalTickets": 5000,
      "soldTickets": 3000,
      "remainingTickets": 2000,
      "remainingPercent": 40,
      "price": 45
    }
  ]
}
```

#### `PUT /stats/current` — cambiar el día activo
```js
await fetch(`${API}/stats/current`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ day: 6 }),
});
```
- `day` debe ser un entero del 1 al 12.
- **400** `INVALID_DAY` si está fuera de rango.
- **404** `DAY_NOT_FOUND` si no existe el archivo.

#### `GET /stats/days` — listar días disponibles
```js
const { days, total } = await fetch(`${API}/stats/days`).then(r => r.json());
// { "days": [1,2,...,12], "total": 12 }
```

---

## 4. WebSocket para push en tiempo real

Cuando el front lanza un trigger con `"push"` en `channels`, el backend envía una notificación por WebSocket al usuario conectado. Aparece **al instante en la web**, sin recargar.

### 4.1 Conexión

**Producción:** `wss://api-eventcopilot.up.railway.app`
**Local:** `ws://localhost:3000`

### 4.2 Registro del cliente

Al conectar, el front debe enviar un mensaje `register` con el `userId`. El backend usa ese `userId` para dirigir las notificaciones correctas.

### 4.3 Ejemplo completo en React

```jsx
import { useEffect } from "react";

function useWebSocketPush(userId) {
  useEffect(() => {
    if (!userId) return;

    const wsUrl = import.meta.env.VITE_API_URL.replace(/^http/, "ws");
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register", userId }));
      console.log("WebSocket conectado");
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "notification") {
        // Muestra la notificación como prefieras (toast, popup, badge...)
        console.log("🔔 Notificación:", data.text);
        // Ejemplo con react-toastify:
        // toast.info(data.text);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket cerrado");

    return () => ws.close();
  }, [userId]);
}

// Uso:
export default function App() {
  useWebSocketPush("user-123");
  return <div>App</div>;
}
```

### 4.4 Formato de las notificaciones recibidas

```json
{
  "type": "notification",
  "text": "¡Solo queda el 10% de las entradas para el Concierto Duki!",
  "timestamp": "2026-04-22T11:47:09.036Z"
}
```

---

## 5. Errores estandarizados

Todos los endpoints devuelven errores en un formato consistente:

```json
{ "error": "CODIGO_DEL_ERROR", "details": [...] }
```

| Status | Código | Significado |
|---|---|---|
| 400 | `INVALID_INPUT` | Body no cumple el schema (Zod) |
| 400 | `INVALID_ID` | El `id` de la URL no es un UUID válido |
| 400 | `INVALID_DAY` | El `day` está fuera del rango 1–12 |
| 404 | `TEMPLATE_NOT_FOUND` | La plantilla con ese `id` no existe |
| 404 | `DAY_NOT_FOUND` | No existe el archivo del día solicitado |
| 500 | `INTERNAL_ERROR` | Error inesperado en el backend |

**Ejemplo de manejo:**
```js
async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

try {
  await fetchJSON(`${API}/plantillas/${id}`, { method: "DELETE" });
} catch (err) {
  if (err.message === "TEMPLATE_NOT_FOUND") {
    alert("La plantilla no existe");
  } else {
    alert("Error inesperado");
  }
}
```

---

## 6. Helper recomendado (api.js)

Crea un archivo `src/lib/api.js` para centralizar todas las llamadas:

```js
const API = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

// Trigger
export const enviarTrigger = (payload) =>
  request("/trigger", { method: "POST", body: JSON.stringify(payload) });

// Plantillas
export const listarPlantillas = () => request("/plantillas");
export const obtenerPlantilla = (id) => request(`/plantillas/${id}`);
export const crearPlantilla = (data) =>
  request("/plantillas", { method: "POST", body: JSON.stringify(data) });
export const actualizarPlantilla = (id, data) =>
  request(`/plantillas/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const borrarPlantilla = (id) =>
  request(`/plantillas/${id}`, { method: "DELETE" });

// Stats
export const getStatsCurrent = () => request("/stats/current");
export const setStatsDay = (day) =>
  request("/stats/current", { method: "PUT", body: JSON.stringify({ day }) });
export const listarDias = () => request("/stats/days");
```

**Uso:**
```js
import { enviarTrigger, crearPlantilla, getStatsCurrent } from "./lib/api";

const stats = await getStatsCurrent();
const plantilla = await crearPlantilla({ name: "Test", text: "Hola!" });
```

---

## 7. Eventos sugeridos para el `trigger`

El backend deja libertad total al nombre del `event` — la IA se adapta al contexto que envíes. Algunos ejemplos recomendados para ticketing:

| `event` | `context` sugerido |
|---|---|
| `low_stock_tickets` | `{ eventName, remaining, userName }` |
| `sold_out` | `{ eventName, userName }` |
| `new_event` | `{ eventName, date, venue, price }` |
| `event_cancelled` | `{ eventName, reason }` |
| `event_postponed` | `{ eventName, newDate }` |
| `ticket_purchased` | `{ eventName, quantity, orderId, userName }` |
| `reminder_event` | `{ eventName, date, userName }` |
| `price_drop` | `{ eventName, oldPrice, newPrice }` |

---

## 8. Checklist final de integración

- [ ] `VITE_API_URL` configurada en `.env` local y en Vercel
- [ ] Helper `api.js` creado y en uso
- [ ] Manejo de errores consistente (try/catch + mostrar mensaje usuario)
- [ ] Loader visible en `/trigger` (puede tardar hasta 2 minutos con IA gratuita)
- [ ] WebSocket conectado al iniciar la app (si se usa push)
- [ ] Validación en front de name ≤100 y text ≤2250 antes del POST de plantilla
- [ ] Probado un trigger end-to-end y llegado el email
- [ ] CORS confirmado (no aparecen errores `CORS policy` en consola)

---

## 9. Contacto backend

Si algo falla o necesitáis un endpoint nuevo:
- Logs en tiempo real: Railway → API_EventCopilot → Deployments → View logs
- Swagger: https://api-eventcopilot.up.railway.app/api-docs
- Repo: https://github.com/DBarrado16/Backend-Proyectos3-S3
