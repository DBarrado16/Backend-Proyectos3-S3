const { sendPush } = require("../channels/push");
const { sendEmail } = require("../channels/email");
const { sendSms } = require("../channels/sms");

const channelHandlers = {
  push: sendPush,
  email: sendEmail,
  sms: sendSms,
};

async function dispatch(text, channels, recipient) {
  const results = [];

  for (const channel of channels) {
    const handler = channelHandlers[channel];
    if (!handler) {
      results.push({ channel, ok: false, error: `Canal "${channel}" no soportado` });
      continue;
    }
    try {
      await handler(text, recipient);
      results.push({ channel, ok: true });
    } catch (err) {
      results.push({ channel, ok: false, error: err.message });
    }
  }

  return results;
}

module.exports = { dispatch };
