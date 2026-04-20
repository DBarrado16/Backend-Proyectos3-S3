const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

async function sendTelegram(text, recipient) {
  if (!recipient.telegramChatId) {
    throw new Error("Falta telegramChatId en recipient");
  }

  await bot.sendMessage(recipient.telegramChatId, text);
}

module.exports = { sendTelegram };
