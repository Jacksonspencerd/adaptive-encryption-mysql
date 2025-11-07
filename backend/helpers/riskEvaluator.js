// calculates a threat score based on contextual factors

//backend/helpers/riskEvaluator.js
const threatConfig = require('./threatConfig');

// random demo IP
const knownIPs = ['127.0.0.1', '::1'];

function calculateRisk(req) {
    const weights = threatConfig.weights;
    let riskScore = 0;

    // IP Address Check
    const ip = req.ip || req.connection.remoteAddress;
    const ipUnknown = !knownIPs.includes(ip);
    if (ipUnknown) {
        riskScore += weights.ipUnknown;
    }

    // Time Anomaly Check
    const hour = new Date().getHours();
    const timeAnomaly = (hour < 6 || hour > 22); // Unusual access time between 10 PM and 6 AM
    if (timeAnomaly) {
        riskScore += weights.timeAnomaly;
    }

    // Failed Login Attempts Check
    const failedLogins = req.failedLogins || 0;
    if (failedLogins >= 3) {
        riskScore += weights.failedLogins;
    }

    // Privilege Level Check
    const privilegeLevel = req.user ? req.user.privilegeLevel : 'guest';
    if (privilegeLevel === 'admin' || privilegeLevel === 'superuser') {
        riskScore += weights.privelegeLevel;
    }

    return {
        riskScore: Number(riskScore.toFixed(2)),
        masked: riskScore >= threatConfig.threshold,
        details: { ip, ipUnknown, timeAnomaly, failedLogins, privilegeLevel }
    };
}

module.exports = calculateRisk;