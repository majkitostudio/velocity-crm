const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  const trimmed = input.trim().toLowerCase();

  return trimmed.length > 0 ? trimmed : null;
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}
