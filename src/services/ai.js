const axios = require("axios");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function generateText(event, context) {
  const prompt = `Genera un mensaje de notificación breve (máximo 2 frases) para el evento "${event}". Contexto: ${JSON.stringify(context)}. Responde solo con el texto del mensaje, sin explicaciones.`;

  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct",
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content.trim();
}

module.exports = { generateText };
