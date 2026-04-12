const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

async function sendPush(text, recipient) {
  if (!recipient.pushToken) {
    throw new Error("Falta pushToken en recipient");
  }

  await admin.messaging().send({
    token: recipient.pushToken,
    notification: {
      title: "Nueva notificación",
      body: text,
    },
  });
}

module.exports = { sendPush };
