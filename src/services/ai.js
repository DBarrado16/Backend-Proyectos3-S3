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
  const prompt = `Eres un asistente de notificaciones para una plataforma de venta de entradas. Genera un mensaje breve y natural (máximo 2 frases, en español) para notificar al usuario sobre: "${event}". Datos: ${JSON.stringify(context)}. Responde ÚNICAMENTE con el texto del mensaje, sin explicaciones ni prefijos.`;

  const response = await model.invoke(prompt);

  return response.content.trim();
}

module.exports = { generateText };
