import HmacSHA256 from "crypto-js/hmac-sha256";
import Base64 from "crypto-js/enc-base64";

// Matches the payload/secret scheme used by the mobile app's CertificateGenerator
// and the cert_veri verification portal, so all three agree on the same hash.
const SECRET_KEY = "DGMS_MINING_SAFETY_SECRET_KEY_2026";

export function buildPayload(cert) {
  return [cert.id, cert.workerId, cert.moduleId, cert.score, cert.issuedDate].join("|");
}

export function computeSignature(cert) {
  return Base64.stringify(HmacSHA256(buildPayload(cert), SECRET_KEY));
}

/**
 * @returns {{ verdict: "VALID" | "EXPIRED" | "TAMPERED", payload: string, computedHash: string }}
 */
export function verifyCertificate(cert) {
  const payload = buildPayload(cert);
  const computedHash = computeSignature(cert);
  const signatureMatches = computedHash === cert.signatureHash;

  if (!signatureMatches) {
    return { verdict: "TAMPERED", payload, computedHash };
  }
  if (cert.expiryDate && new Date(cert.expiryDate).getTime() < Date.now()) {
    return { verdict: "EXPIRED", payload, computedHash };
  }
  return { verdict: "VALID", payload, computedHash };
}
