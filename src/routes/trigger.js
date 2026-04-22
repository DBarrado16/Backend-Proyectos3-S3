const { Router } = require("express");
const { z } = require("zod");
const { generateText } = require("../services/ai");
const { dispatch } = require("../services/dispatcher");

const router = Router();

const triggerSchema = z.object({
  event: z.string().min(1),
  context: z.record(z.any()),
  channels: z.array(z.enum(["email", "telegram", "push"])).min(1),
  recipient: z.object({
    email: z.string().email().optional(),
    telegramChatId: z.union([z.string(), z.number()]).optional(),
    userId: z.string().optional(),
  }),
});

/**
 * @openapi
 * /trigger:
 *   post:
 *     summary: Genera el texto con IA y lo envía por los canales indicados
 *     tags: [Trigger]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TriggerInput'
 *     responses:
 *       200:
 *         description: Notificación procesada
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno
 */
router.post("/", async (req, res) => {
  const parsed = triggerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      details: parsed.error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  try {
    const { event, context, channels, recipient } = parsed.data;
    const text = await generateText(event, context);
    const results = await dispatch(text, channels, recipient);
    return res.json({ ok: true, text, results });
  } catch (err) {
    console.error("Error en /trigger:", err.message);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

module.exports = router;
