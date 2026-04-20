const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendTelegram(text, recipient) {
  if (!recipient.telegramChatId) {
    throw new Error("Falta telegramChatId en recipient");
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Falta TELEGRAM_BOT_TOKEN en variables de entorno");
  }

  const url = `${TELEGRAM_API}${token}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: recipient.telegramChatId,
      text,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Telegram error: ${error.description || res.statusText}`);
  }
}

module.exports = { sendTelegram };
