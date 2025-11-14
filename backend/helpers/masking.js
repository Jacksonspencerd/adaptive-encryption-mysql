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
  const digits = String(ssn).replace(/\D/g, "");
  if (digits.length < 4) return "XXX-XX-XXXX";
  return `XXX-XX-${digits.slice(-4)}`;
}

function maskSalary(salary) {
  if (salary == null) return salary;
  const num = Number(salary);
  if (Number.isNaN(num)) return "REDACTED";
  const lower = Math.floor(num / 10000) * 10000;
  const upper = lower + 9999;
  return `$${lower.toLocaleString()}–$${upper.toLocaleString()}`;
}

function maskEmail(email) {
  if (!email) return email;
  const [user, domain] = String(email).split("@");
  if (!domain) return "***@***";
  const maskedUser = user[0] + "***";
  return `${maskedUser}@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return phone;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 4) return "****";
  const last4 = digits.slice(-4);
  return `(***) ***-${last4}`;
}

// === Role + risk → maskLevel ===================================

function getMaskLevel(role, risk) {
  // Risk dominates: high risk => high masking no matter what
  if (risk === "high") return "high";

  // Medium risk escalates masking for non-admins
  if (risk === "medium") {
    if (role === "admin" || role === "analyst") return "medium";
    return "high";
  }

  // Low / none risk: role-based defaults
  switch (role) {
    case "admin":
      return "none";
    case "analyst":
      return "low";
    case "user":
      return "medium";
    case "guest":
    case "threat":
    default:
      return "high";
  }
}

// === Row-level masking =========================================

function applyMasking(row, maskLevel) {
  if (!row || maskLevel === "none") return row;

  const masked = { ...row };

  // LOW: only most sensitive like SSN
  if (maskLevel === "low") {
    for (const [key, value] of Object.entries(masked)) {
      if (looksLikeSSNKey(key)) masked[key] = maskSSN(value);
    }
    return masked;
  }

  // MEDIUM: SSN + salary + some demographic redaction
  if (maskLevel === "medium") {
    for (const [key, value] of Object.entries(masked)) {
      if (looksLikeSSNKey(key)) masked[key] = maskSSN(value);
      else if (looksLikeSalaryKey(key)) masked[key] = maskSalary(value);
      else if (looksLikeRaceKey(key)) masked[key] = "REDACTED";
      else if (looksLikeGenderKey(key)) {
        masked[key] = value ? String(value)[0] + "." : value;
      }
    }
    return masked;
  }

  // HIGH: very aggressive – redact strings, heavily obfuscate contact info
  for (const [key, value] of Object.entries(masked)) {
    if (value == null) continue;

    if (looksLikeSSNKey(key)) masked[key] = "REDACTED";
    else if (looksLikeSalaryKey(key)) masked[key] = "REDACTED";
    else if (looksLikeEmailKey(key)) masked[key] = maskEmail(value);
    else if (looksLikePhoneKey(key)) masked[key] = maskPhone(value);
    else if (looksLikeRaceKey(key) || looksLikeGenderKey(key)) masked[key] = "REDACTED";
    else if (typeof value === "string") masked[key] = "REDACTED";
  }

  return masked;
}

module.exports = {
  getMaskLevel,
  applyMasking,
};
