const { Router } = require("express");
const {
  listByEvent,
  getTriggerById,
  createTrigger,
  updateTrigger,
  deleteTrigger,
} = require("../services/triggersService");
const {
  triggerCreateSchema,
  triggerUpdateSchema,
  idParamSchema,
  listQuerySchema,
} = require("../schemas/trigger");

const router = Router();

function formatZodError(err) {
  return err.errors.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));
}

/**
 * @openapi
 * /triggers:
 *   get:
 *     summary: Lista todos los triggers asociados a un evento
 *     tags: [Triggers]
 *     parameters:
 *       - in: query
 *         name: eventID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de triggers del evento
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trigger'
 *       400:
 *         description: Falta eventID
 */
router.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "INVALID_QUERY",
      details: formatZodError(parsed.error),
    });
  }
  try {
    const triggers = await listByEvent(parsed.data.eventID);
    res.json(triggers);
  } catch (err) {
    console.error("Error al listar triggers:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * @openapi
 * /triggers/{id}:
 *   get:
 *     summary: Obtiene un trigger por su id único global
 *     tags: [Triggers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Trigger encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trigger'
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Trigger no encontrado
 */
router.get("/:id", async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_ID", details: formatZodError(parsed.error) });
  }
  try {
    const trigger = await getTriggerById(parsed.data.id);
    if (!trigger) {
      return res.status(404).json({ error: "TRIGGER_NOT_FOUND" });
    }
    res.json(trigger);
  } catch (err) {
    console.error("Error al obtener trigger:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * @openapi
 * /triggers:
 *   post:
 *     summary: Crea un nuevo trigger asociado a un evento
 *     tags: [Triggers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TriggerInput'
 *     responses:
 *       201:
 *         description: Trigger creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trigger'
 *       400:
 *         description: Datos inválidos
 */
router.post("/", async (req, res) => {
  const parsed = triggerCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_INPUT", details: formatZodError(parsed.error) });
  }
  try {
    const trigger = await createTrigger(parsed.data);
    res.status(201).json(trigger);
  } catch (err) {
    console.error("Error al crear trigger:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * @openapi
 * /triggers/{id}:
 *   put:
 *     summary: Actualiza un trigger existente (no se permite cambiar eventID)
 *     tags: [Triggers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TriggerUpdate'
 *     responses:
 *       200:
 *         description: Trigger actualizado
 *       400:
 *         description: ID o body inválidos, o body vacío
 *       404:
 *         description: Trigger no encontrado
 */
router.put("/:id", async (req, res) => {
  const idCheck = idParamSchema.safeParse(req.params);
  if (!idCheck.success) {
    return res.status(400).json({ error: "INVALID_ID", details: formatZodError(idCheck.error) });
  }

  if (!req.body || typeof req.body !== "object" || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: "EMPTY_BODY",
      message: "Debes enviar al menos un campo para actualizar",
    });
  }

  const bodyCheck = triggerUpdateSchema.safeParse(req.body);
  if (!bodyCheck.success) {
    return res.status(400).json({ error: "INVALID_INPUT", details: formatZodError(bodyCheck.error) });
  }

  try {
    const trigger = await updateTrigger(idCheck.data.id, bodyCheck.data);
    if (!trigger) {
      return res.status(404).json({ error: "TRIGGER_NOT_FOUND" });
    }
    res.json(trigger);
  } catch (err) {
    console.error("Error al actualizar trigger:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * @openapi
 * /triggers/{id}:
 *   delete:
 *     summary: Elimina un trigger
 *     tags: [Triggers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Trigger eliminado
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Trigger no encontrado
 */
router.delete("/:id", async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_ID", details: formatZodError(parsed.error) });
  }
  try {
    const ok = await deleteTrigger(parsed.data.id);
    if (!ok) {
      return res.status(404).json({ error: "TRIGGER_NOT_FOUND" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error al eliminar trigger:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

module.exports = router;
