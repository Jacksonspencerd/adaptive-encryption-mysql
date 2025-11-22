// bakend/helpers/threatConfig.js

module.exports = {
  // Risk scoring weights expected by riskEvaluator.js
  weights: {
    ipUnknown: 0.25,
    timeAnomaly: 0.15,
    failedLogins: 0.20,
    privilege: 0.10,
  },

  // Risk level thresholds
  thresholds: {
    low: 0.25,
    medium: 0.5,
    high: 0.75,
  },

  // Business hours for time anomaly detection
  businessHours: {
    start: 8,  // 8 AM
    end: 18,   // 6 PM
  },

  // Max failed logins considered "safe" for normalization
  maxFailedLoginsSafe: 3,
};
