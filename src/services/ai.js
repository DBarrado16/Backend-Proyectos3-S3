const { ChatOpenAI } = require("@langchain/openai");

const model = new ChatOpenAI({
  modelName: process.env.OPENROUTER_MODEL || "google/gemma-4-26b-a4b-it:free",
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
  temperature: 0.7,
  maxTokens: 150,
});

async function generateText(event, context) {
  const prompt = `Genera un mensaje de notificación breve (máximo 2 frases) para el evento "${event}". Contexto: ${JSON.stringify(context)}. Responde solo con el texto del mensaje, sin explicaciones.`;

  const response = await model.invoke(prompt);

  return response.content.trim();
}

module.exports = { generateText };
