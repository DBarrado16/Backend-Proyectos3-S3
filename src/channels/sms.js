const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSms(text, recipient) {
  if (!recipient.phone) {
    throw new Error("Falta phone en recipient");
  }

  await client.messages.create({
    body: text,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: recipient.phone,
  });
}

module.exports = { sendSms };
