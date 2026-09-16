const qrcode = require("qrcode");
const crypto = require("crypto");

/**
 * Generates a QR code data URL for a ticket.
 *
 * THREAT MODEL & SIGNATURE EXPLANATION
 * ------------------------------------
 * Unsigned (Raw Hash):
 * If we just embed the hash, anyone who physically photographs a valid
 * ticket can copy the hash and generate a new lookalike QR code. A naive
 * scanner checking "does this hash exist?" would pass it.
 *
 * Signed (HMAC):
 * When SIGN_QR=true, the server generates an HMAC-SHA256 signature over
 * the `{hash, ticketId}` payload using the server's JWT_SECRET.
 * A scanner can instantly verify the signature cryptographically before
 * even querying the database. An attacker without the server secret cannot
 * forge a valid signature for a fake or duplicated QR code.
 */
async function generateQR({ hash, ticketId }) {
  const payloadObj = { hash, ticketId };

  if (process.env.SIGN_QR === "true") {
    const secret = process.env.JWT_SECRET || "fallback_dev_secret";
    const hmac = crypto.createHmac("sha256", secret);
    
    // Explicit separator to prevent injection
    hmac.update(`${hash}|${ticketId}`);
    
    payloadObj.sig = hmac.digest("hex");
  }

  const payloadStr = JSON.stringify(payloadObj);
  return await qrcode.toDataURL(payloadStr);
}

module.exports = { generateQR };
