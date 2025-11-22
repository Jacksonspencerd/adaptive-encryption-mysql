// src/utils/deviceFingerprint.js

export function getDeviceFingerprint() {
  // Guard for non-browser environments just in case
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {};
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
}
