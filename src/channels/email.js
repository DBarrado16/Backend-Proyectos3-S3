const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(text, recipient) {
  if (!recipient.email) {
    throw new Error("Falta email en recipient");
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "notificaciones@app.com",
    to: recipient.email,
    subject: "Nueva notificación",
    text,
  });
}

module.exports = { sendEmail };
