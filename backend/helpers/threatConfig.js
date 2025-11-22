// backend/helpers/threatConfig.js

module.exports = {
  // Weights for each signal, should sum to ~1 but doesn't have to.
  weights: {
    ipUnknown: 0.20,       // anomaly if IP not in recent successful logins
    timeAnomaly: 0.15,     // outside business hours
    failedLogins: 0.25,    // recent failed logins
    privilege: 0.20,       // admin/analyst/user/guest sensitivity
    deviceChange: 0.20,    // new / unknown device
  },

  // Thresholds for mapping numeric score to risk level
  thresholds: {
    low: 0.25,
    medium: 0.5,
    high: 0.75,
  },

  // Business hours for "normal" activity (local server time)
  businessHours: {
    start: 8,   // 8 AM
    end: 18,    // 6 PM
  },

  // How many failed logins per hour is considered "safe" before maxing the signal
  maxFailedLoginsSafe: 5,
};
