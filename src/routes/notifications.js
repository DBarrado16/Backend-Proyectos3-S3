const { Router } = require("express");
const { z } = require("zod");
const { generateText } = require("../services/ai");
const { dispatch } = require("../services/dispatcher");
const { getCurrentStats } = require("../services/statsService");
const {
  resolveMetric,
  evaluateCondition,
  listSupportedMetrics,
} = require("../services/metrics");

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
 *     summary: Evalúa una condición contra el snapshot actual y, si se cumple, genera el texto con IA y lo despacha
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationInput'
 *     responses:
 *       200:
 *         description: Condición evaluada (conditionMet indica si se envió o no)
 *       400:
 *         description: Datos inválidos o métrica no soportada
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

  const {
    event,
    context,
    channels,
    recipient,
    conditionType,
    conditionOperator,
    conditionValue,
    eventID,
  } = parsed.data;

  try {
    const snapshot = await getCurrentStats();
    const metric = resolveMetric(snapshot, conditionType, eventID);
    if (!metric.ok) {
      return res.status(400).json({ error: "INVALID_METRIC", message: metric.error });
    }

    const conditionMet = evaluateCondition(metric.value, conditionOperator, conditionValue);
    const evaluation = {
      conditionType,
      conditionOperator,
      conditionValue,
      actualValue: metric.value,
      scope: metric.scope,
      eventID: metric.eventID ?? eventID ?? null,
      snapshotDay: snapshot.day,
    };

    if (!conditionMet) {
      return res.json({ ok: true, conditionMet: false, ...evaluation });
    }

    const text = await generateText(event, context);
    const results = await dispatch(text, channels, recipient);
    return res.json({ ok: true, conditionMet: true, ...evaluation, text, results });
  } catch (err) {
    console.error("Error en /notifications:", err.message);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
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
