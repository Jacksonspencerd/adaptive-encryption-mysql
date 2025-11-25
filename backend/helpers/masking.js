// helpers/masking.js

// === Basic column-type detection by name =======================

function looksLikeSSNKey(key) {
  return /ssn|social/i.test(key);
}

function looksLikeSalaryKey(key) {
  return /salary|wage|income|comp/i.test(key);
}

function looksLikeEmailKey(key) {
  return /email/i.test(key);
}

function looksLikePhoneKey(key) {
  return /phone|mobile|cell/i.test(key);
}

function looksLikeRaceKey(key) {
  return /race|ethnicity/i.test(key);
}

function looksLikeGenderKey(key) {
  return /gender|sex/i.test(key);
}

// === Field-level masking helpers ===============================

function maskSSN(ssn) {
  if (!ssn) return ssn;
  // Strong SSN masking: always hide full value
  return "REDACTED";
}

function maskSalary(salary) {
  if (salary == null) return salary;
  // Strong salary masking: hide exact amount, replace with generic token
  return "REDACTED";
}

function maskEmail(email) {
  if (!email) return email;
  // For high risk we will override this with "REDACTED" anyway.
  const [user, domain] = String(email).split("@");
  if (!domain) return "********";
  const maskedUser = user[0] + "****";
  return `${maskedUser}@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return phone;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 4) return "********";
  const last4 = digits.slice(-4);
  return `(***) ***-${last4}`;
}

// === Role + risk → maskLevel ===================================
//
// Levels:
//   - "none"   : no masking at all
//   - "low"    : only SSN masked
//   - "medium" : SSN, salary, race fully redacted, gender bucketed
//   - "high"   : very aggressive – redact almost everything
//
// Policy change (Option C):
//   - Admin is ONLY unmasked at riskLevel === "none".
//   - Admin at "medium" or "high" risk is heavily masked ("high").
//   - High risk always wins, regardless of role.
//

function getMaskLevel(role, risk) {
  // High risk → maximal masking regardless of role
  if (risk === "high") return "high";

  // Medium risk:
  if (risk === "medium") {
    // Admin at medium risk gets *high* masking (very defensive)
    if (role === "admin") return "high";
    // Analysts at medium risk get medium masking (can still see some quasi-IDs)
    if (role === "analyst") return "medium";
    // Normal users / guests / threat at medium → high masking
    return "high";
  }

  // Low / none risk: role-based defaults
  // (Only here can admin see fully unmasked data.)
  switch (role) {
    case "admin":
      return "none";      // Fully trusted, low/no risk
    case "analyst":
      return "low";       // Can see structure, SSN masked
    case "user":
      return "medium";    // See basic info, sensitive fully masked
    case "guest":
    case "threat":
    default:
      return "high";      // Very restricted view
  }
}

// === Row-level masking =========================================

function applyMasking(row, maskLevel) {
  if (!row || maskLevel === "none") return row;

  const masked = { ...row };

  // LOW: only most sensitive like SSN are fully masked
  if (maskLevel === "low") {
    for (const [key, value] of Object.entries(masked)) {
      if (looksLikeSSNKey(key)) {
        masked[key] = maskSSN(value);
      }
    }
    return masked;
  }

  // MEDIUM: SSN + salary + some demographic redaction
  if (maskLevel === "medium") {
    for (const [key, value] of Object.entries(masked)) {
      if (value == null) continue;

      if (looksLikeSSNKey(key)) {
        masked[key] = maskSSN(value);
      } else if (looksLikeSalaryKey(key)) {
        masked[key] = maskSalary(value);
      } else if (looksLikeRaceKey(key)) {
        masked[key] = "REDACTED";
      } else if (looksLikeGenderKey(key)) {
        // Bucket gender to first letter, not full value
        masked[key] = value ? String(value)[0] + "." : value;
      }
      // Non-sensitive fields (e.g., id, first_name, last_name, department)
      // remain visible at medium level.
    }
    return masked;
  }

  // HIGH: very aggressive – redact almost everything
  for (const [key, value] of Object.entries(masked)) {
    if (value == null) continue;

    if (looksLikeSSNKey(key)) {
      masked[key] = "REDACTED";
    } else if (looksLikeSalaryKey(key)) {
      masked[key] = "REDACTED";
    } else if (looksLikeEmailKey(key)) {
      masked[key] = "REDACTED";
    } else if (looksLikePhoneKey(key)) {
      masked[key] = "REDACTED";
    } else if (looksLikeRaceKey(key) || looksLikeGenderKey(key)) {
      masked[key] = "REDACTED";
    } else if (typeof value === "string") {
      // Names, job_title, department, etc.
      masked[key] = "REDACTED";
    }
    // Numeric ids can remain if you want; you could also redact them if desired.
  }

  return masked;
}

module.exports = {
  getMaskLevel,
  applyMasking,
};
