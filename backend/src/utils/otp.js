const twilio = require('twilio');

const client = process.env.NODE_ENV === 'production'
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // code à 6 chiffres
}

async function sendOtpSms(phone, code) {
  // En développement, on log simplement le code au lieu d'envoyer un vrai SMS
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Code OTP pour ${phone} : ${code}`);
    return { success: true, dev: true };
  }

  const message = await client.messages.create({
    body: `Votre code de vérification est : ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  return { success: true, sid: message.sid };
}

module.exports = { generateOtpCode, sendOtpSms };
