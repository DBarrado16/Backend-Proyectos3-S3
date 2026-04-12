const { Router } = require("express");
const { generateText } = require("../services/ai");
const { dispatch } = require("../services/dispatcher");

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { event, context, channels, recipient } = req.body;

    if (!event || !context || !channels || !recipient) {
      return res.status(400).json({ error: "Faltan campos requeridos: event, context, channels, recipient" });
    }

    const text = await generateText(event, context);

    const results = await dispatch(text, channels, recipient);

    return res.json({ ok: true, text, results });
  } catch (err) {
    console.error("Error en /trigger:", err.message);
    return res.status(500).json({ error: "Error interno al procesar la notificación" });
  }
});

module.exports = router;
