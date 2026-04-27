const { Router } = require("express");
const { z } = require("zod");
const { generateText } = require("../services/ai");
const { dispatch } = require("../services/dispatcher");
const { listSupportedMetrics } = require("../services/metrics");

const router = Router();

const notificationSchema = z.object({
  event: z.string().min(1),
  context: z.record(z.any()),
  channels: z.array(z.enum(["email", "telegram", "push"])).min(1),
  recipient: z.object({
    email: z.string().email().optional(),
    telegramChatId: z.union([z.string(), z.number()]).optional(),
    userId: z.string().optional(),
  }),
  conditionType: z.string().min(1, "conditionType es obligatorio"),
  conditionOperator: z.enum(["<", ">"], {
    errorMap: () => ({ message: "conditionOperator debe ser '<' o '>'" }),
  }),
  conditionValue: z.number({
    invalid_type_error: "conditionValue debe ser numérico",
  }),
  eventID: z.string().min(1).optional(),
});

function formatZodError(err) {
  return err.errors.map((e) => ({ path: e.path.join("."), message: e.message }));
}

/**
 * @openapi
 * /notifications:
 *   post:
 *     summary: Genera el texto con IA y lo despacha por los canales indicados (no evalúa la condición; el schema se mantiene por compatibilidad)
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationInput'
 *     responses:
 *       200:
 *         description: Notificación generada y despachada
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno
 */
router.post("/", async (req, res) => {
  const parsed = notificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      details: formatZodError(parsed.error),
    });
  }

  const { event, context, channels, recipient } = parsed.data;

  try {
    const text = await generateText(event, context);
    const results = await dispatch(text, channels, recipient);
    return res.json({ ok: true, text, results });
  } catch (err) {
    console.error("Error en /notifications:", err);
    // OpenRouter / proveedor de IA rate-limited -> propaga el 429 al front en
    // vez de un 500 opaco, para que pueda mostrar un mensaje claro al usuario.
    const status = Number(err.status) || Number(err.code);
    if (status === 429 || /rate.?limit|429/i.test(err.message || "")) {
      return res.status(429).json({
        error: "AI_RATE_LIMITED",
        message:
          "El proveedor de IA ha rechazado la petición por límite de uso. Inténtalo de nuevo en unos segundos o cambia de modelo.",
      });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

/**
 * @openapi
 * /notifications/metrics:
 *   get:
 *     summary: Lista las métricas soportadas para conditionType
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Catálogo de métricas
 */
router.get("/metrics", (_req, res) => {
  res.json(listSupportedMetrics());
});

module.exports = router;
