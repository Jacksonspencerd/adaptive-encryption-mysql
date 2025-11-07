// defines weights for contextual risk factors

module.exports = {
    weights: {
        ipUnknown: 0.4,       // Unknown IP address
        timeAnomaly: 0.3,     // Unusual access time
        failedLogins: 0.2,    // Multiple failed login attempts
        privelegeLevel: 0.5,  // Privilege of user
    },
    threshold: 0.6          // Risk score threshold for action
};