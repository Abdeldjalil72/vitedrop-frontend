/**
 * Algerian Postal & Banking Validation and Formatting Helpers
 *
 * Supported Rails:
 * - Algérie Poste BaridiMob (20-digit RIP starting with 00799999)
 * - Algérie Poste CCP (Account number 5-12 digits + 2-digit key)
 * - Algerian Commercial Banks (20-digit RIB)
 */

export interface RipValidationResult {
  isValid: boolean;
  cleaned: string;
  formatted: string;
  isPosteRip: boolean;
  error?: string;
}

export interface CcpValidationResult {
  isValid: boolean;
  accountNumber: string;
  key: string;
  formatted: string;
  error?: string;
}

/**
 * Sanitizes and validates a 20-digit BaridiMob / Algerian Postal RIP
 */
export function validateBaridiMobRip(input: string): RipValidationResult {
  if (!input || typeof input !== "string") {
    return {
      isValid: false,
      cleaned: "",
      formatted: "",
      isPosteRip: false,
      error: "Le numéro RIP est obligatoire.",
    };
  }

  // Remove spaces, hyphens, dots
  const cleaned = input.replace(/[\s\-_.]/g, "");

  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      cleaned,
      formatted: input,
      isPosteRip: false,
      error: "Le numéro RIP ne doit contenir que des chiffres.",
    };
  }

  if (cleaned.length !== 20) {
    return {
      isValid: false,
      cleaned,
      formatted: cleaned,
      isPosteRip: false,
      error: `Le RIP doit comporter exactement 20 chiffres (actuellement ${cleaned.length}).`,
    };
  }

  const isPosteRip = cleaned.startsWith("00799999");
  // Format: 007 99999 0012345678 90
  const formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 8)} ${cleaned.slice(8, 18)} ${cleaned.slice(18, 20)}`;

  return {
    isValid: true,
    cleaned,
    formatted,
    isPosteRip,
  };
}

/**
 * Sanitizes and validates an Algérie Poste CCP account and key
 */
export function validateCcpAccount(input: string): CcpValidationResult {
  if (!input || typeof input !== "string") {
    return {
      isValid: false,
      accountNumber: "",
      key: "",
      formatted: "",
      error: "Le numéro de compte CCP et la clé sont obligatoires.",
    };
  }

  // Remove words like "clé", "cle", slashes, dashes
  const sanitized = input.replace(/(clé|cle|key|n°|no)/gi, " ").trim();
  const parts = sanitized.split(/[\s\-_/]+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      isValid: false,
      accountNumber: "",
      key: "",
      formatted: "",
      error: "Veuillez renseigner le compte CCP et la clé.",
    };
  }

  if (parts.length === 1) {
    const single = parts[0];
    if (single.length >= 7 && /^\d+$/.test(single)) {
      // Last 2 digits as key
      const key = single.slice(-2);
      const accountNumber = single.slice(0, -2);
      return {
        isValid: true,
        accountNumber,
        key,
        formatted: `${accountNumber} Clé ${key}`,
      };
    }
    return {
      isValid: false,
      accountNumber: single,
      key: "",
      formatted: single,
      error: "Veuillez préciser la clé CCP (ex: 12345678 Clé 99).",
    };
  }

  const accountNumber = parts[0];
  const key = parts[1];

  if (!/^\d{5,12}$/.test(accountNumber)) {
    return {
      isValid: false,
      accountNumber,
      key,
      formatted: `${accountNumber} ${key}`,
      error: "Le numéro de compte CCP doit comporter entre 5 et 12 chiffres.",
    };
  }

  if (!/^\d{1,2}$/.test(key)) {
    return {
      isValid: false,
      accountNumber,
      key,
      formatted: `${accountNumber} ${key}`,
      error: "La clé CCP doit être composée de 2 chiffres (ex: 99).",
    };
  }

  const paddedKey = key.padStart(2, "0");
  return {
    isValid: true,
    accountNumber,
    key: paddedKey,
    formatted: `${accountNumber} Clé ${paddedKey}`,
  };
}

/**
 * Validates a standard 20-digit Algerian bank RIB
 */
export function validateBankRib(input: string): RipValidationResult {
  const res = validateBaridiMobRip(input);
  if (!res.isValid) {
    return res;
  }
  return {
    ...res,
    error: undefined,
  };
}

