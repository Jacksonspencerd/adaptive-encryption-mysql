// backend/helpers/threatConfig.js
module.exports = {
  weights: {
    ipReputation: 0.25,
    timeAnomaly: 0.15,
    failedLogins: 0.20,
    privilegeLevel: 0.10,
    sessionAge: 0.10,
    deviceChange: 0.10,
    dataSensitivity: 0.10,
  },
  threshold: 0.6,
};
