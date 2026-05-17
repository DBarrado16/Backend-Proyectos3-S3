const { Router } = require("express");
const plantillasService = require("../services/plantillasService");
const {
  plantillaCreateSchema,
  plantillaUpdateSchema,
  idParamSchema,
} = require("../schemas/plantilla");

const router = Router();

function formatZodError(err) {
  return err.errors.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));
}

/**
 * @openapi
 * /plantillas:
 *   get:
 *     summary: Lista todas las plantillas
 *     tags: [Plantillas]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de plantillas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Plantilla'
 *       401:
 *         description: No autenticado
 */
router.get("/", async (_req, res) => {
  try {
    const plantillas = await plantillasService.listPlantillas();
    res.json(plantillas);
  } catch (err) {
    console.error("Error al listar plantillas:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * @openapi
 * /plantillas/{id}:
 *   get:
 *     summary: Obtiene una plantilla por su id
 *     tags: [Plantillas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Plantilla encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plantilla'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Plantilla no encontrada
 */
router.get("/:id", async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_ID", details: formatZodError(parsed.error) });
  }
  try {
    const plantilla = await plantillasService.getPlantillaById(parsed.data.id);
    if (!plantilla) {
      return res.status(404).json({ error: "TEMPLATE_NOT_FOUND" });
    }
    res.json(plantilla);
  } catch (err) {
    console.error("Error al obtener plantilla:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * @openapi
 * /plantillas:
 *   post:
 *     summary: Crea una nueva plantilla
 *     tags: [Plantillas]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlantillaInput'
 *     responses:
 *       201:
 *         description: Plantilla creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plantilla'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post("/", async (req, res) => {
  const parsed = plantillaCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_INPUT", details: formatZodError(parsed.error) });
  }
  try {
    const plantilla = await plantillasService.createPlantilla(parsed.data);
    res.status(201).json(plantilla);
  } catch (err) {
    console.error("Error al crear plantilla:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * @openapi
 * /plantillas/{id}:
 *   put:
 *     summary: Actualiza una plantilla existente
 *     tags: [Plantillas]
 *     security:
 *       - BearerAuth: []
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
 *             $ref: '#/components/schemas/PlantillaUpdate'
 *     responses:
 *       200:
 *         description: Plantilla actualizada
 *       400:
 *         description: ID o datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Plantilla no encontrada
 */
router.put("/:id", async (req, res) => {
  const idCheck = idParamSchema.safeParse(req.params);
  if (!idCheck.success) {
    return res.status(400).json({ error: "INVALID_ID", details: formatZodError(idCheck.error) });
  }
  const bodyCheck = plantillaUpdateSchema.safeParse(req.body);
  if (!bodyCheck.success) {
    return res.status(400).json({ error: "INVALID_INPUT", details: formatZodError(bodyCheck.error) });
  }
  try {
    const plantilla = await plantillasService.updatePlantilla(idCheck.data.id, bodyCheck.data);
    if (!plantilla) {
      return res.status(404).json({ error: "TEMPLATE_NOT_FOUND" });
    }
    res.json(plantilla);
  } catch (err) {
    console.error("Error al actualizar plantilla:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * @openapi
 * /plantillas/{id}:
 *   delete:
 *     summary: Elimina una plantilla
 *     tags: [Plantillas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Plantilla eliminada
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Plantilla no encontrada
 */
router.delete("/:id", async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_ID", details: formatZodError(parsed.error) });
  }
  try {
    const ok = await plantillasService.deletePlantilla(parsed.data.id);
    if (!ok) {
      return res.status(404).json({ error: "TEMPLATE_NOT_FOUND" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error al eliminar plantilla:", err.message);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

module.exports = router;
