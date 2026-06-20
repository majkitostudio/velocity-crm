const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  let value = input.trim();

  if (value.length === 0) {
    return null;
  }

  value = value.replace(/[\s().-]/g, "");

  if (value.startsWith("00")) {
    value = `+${value.slice(2)}`;
  }

  if (!value.startsWith("+")) {
    if (value.startsWith("0") && value.length === 10) {
      value = `+420${value.slice(1)}`;
    } else if (/^[67]\d{8}$/.test(value)) {
      value = `+420${value}`;
    } else if (/^\d+$/.test(value)) {
      value = `+${value}`;
    }
  }

  return value;
}

export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(phone);
}

export function formatPhoneValidationMessage(): string {
  return "Neplatný formát telefonního čísla. Použijte např. +420601123456.";
}
