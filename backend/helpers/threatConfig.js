// backend/helpers/threatConfig.js

module.exports = {
  // Weights for each signal, should sum to ~1 but doesn't have to.
  weights: {
    ipUnknown: 0.20,
    timeAnomaly: 0.10,
    failedLogins: 0.20,
    privilege: 0.40,
    deviceChange: 0.10
  },

  // Thresholds for mapping numeric score to risk level
  thresholds: {
    low: 0.25,
    medium: 0.50,
    high: 0.75
  },

  // Business hours for "normal" activity (local server time)
  businessHours: {
    start: 8,   // 8 AM
    end: 18,    // 6 PM
  },

  // How many failed logins per hour is considered "safe" before maxing the signal
  maxFailedLoginsSafe: 5,
};
