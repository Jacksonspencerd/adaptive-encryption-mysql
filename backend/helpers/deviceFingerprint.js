// helpers/deviceFingerprint.js
// Simple hashing-based device fingerprint helper.

const crypto = require("crypto");

/**
 * Normalize device info into a stable subset so harmless changes
 * (like window size) don't constantly create "new" devices.
 */
function normalizeDevice(device) {
  if (!device || typeof device !== "object") return {};

  return {
    userAgent: device.userAgent || "",
    platform: device.platform || "",
    language: device.language || "",
    timezone: device.timezone || "",
    screenWidth: device.screenWidth || 0,
    screenHeight: device.screenHeight || 0,
  };
}

/**
 * Create a deterministic SHA-256 hash of the normalized device info.
 */
function hashDevice(device) {
  const norm = normalizeDevice(device);
  return crypto.createHash("sha256").update(JSON.stringify(norm)).digest("hex");
}

module.exports = {
  normalizeDevice,
  hashDevice,
};
