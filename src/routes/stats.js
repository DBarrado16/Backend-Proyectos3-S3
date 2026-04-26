const { Router } = require("express");
const { z } = require("zod");
const {
  getCurrentStats,
  setCurrentDay,
  listDays,
  TOTAL_DAYS,
} = require("../services/statsService");
const { evaluateAndDispatchAll } = require("../services/triggersService");

const router = Router();

const setDaySchema = z.object({
  day: z.number().int().min(1).max(TOTAL_DAYS),
});

/**
 * @openapi
 * /stats/current:
 *   get:
 *     summary: Obtiene las estadísticas del día actual (apuntado por current.json)
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Estadísticas actuales
 */
router.get("/current", async (_req, res) => {
  try {
    const stats = await getCurrentStats();
    res.json(stats);
  } catch (err) {
    console.error("Error al leer stats:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * @openapi
 * /stats/current:
 *   put:
 *     summary: Cambia el día actual al que apunta current.json y reevalúa todos los triggers
 *     description: |
 *       Tras actualizar el día activo, evalúa la condición de cada trigger
 *       guardado en triggers.json contra el nuevo snapshot. Si la condición se
 *       cumple, se pone `warn = true` en el trigger; si no, `warn = false`.
 *       Posteriormente, todos los triggers con `warn = true` envían su mensaje
 *       por su canal y a su audiencia.
 *     tags: [Stats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [day]
 *             properties:
 *               day:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *     responses:
 *       200:
 *         description: Día actualizado y triggers reevaluados/despachados
 *       400:
 *         description: Día inválido
 *       404:
 *         description: No existe el día solicitado
 */
router.put("/current", async (req, res) => {
  const parsed = setDaySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "INVALID_DAY",
      details: parsed.error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }
  try {
    const result = await setCurrentDay(parsed.data.day);

    // Tras cambiar el día activo, evaluar la condición de cada trigger contra
    // el nuevo snapshot, actualizar su campo `warn` y despachar el mensaje de
    // los que han quedado en warn=true.
    let triggersSummary = null;
    try {
      const snapshot = await getCurrentStats();
      triggersSummary = await evaluateAndDispatchAll(snapshot);
    } catch (err) {
      console.error("Error evaluando/disparando triggers tras PUT /stats/current:", err.message);
      triggersSummary = { error: "TRIGGER_EVALUATION_FAILED", message: err.message };
    }

    res.json({ ...result, triggers: triggersSummary });
  } catch (err) {
    if (err.code === "DAY_NOT_FOUND") {
      return res.status(404).json({ error: "DAY_NOT_FOUND" });
    }
    if (err.code === "INVALID_DAY") {
      return res.status(400).json({ error: "INVALID_DAY", message: err.message });
    }
    console.error("Error al cambiar día:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * @openapi
 * /stats/days:
 *   get:
 *     summary: Lista los días disponibles para simular
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Lista de números de día disponibles
 */
router.get("/days", async (_req, res) => {
  const days = await listDays();
  res.json({ days, total: TOTAL_DAYS });
});

module.exports = router;
