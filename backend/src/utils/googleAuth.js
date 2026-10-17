const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client();

async function verifyGoogleCredential(credential) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const error = new Error("Google authentication is not configured on the server.");
    error.statusCode = 503;
    throw error;
  }
  if (typeof credential !== "string" || !credential.trim()) {
    const error = new Error("Google credential is required.");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) {
    const error = new Error("Google account email is not verified.");
    error.statusCode = 401;
    throw error;
  }
  return payload;
}

module.exports = { verifyGoogleCredential };
