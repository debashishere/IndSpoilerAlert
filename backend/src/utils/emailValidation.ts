/**
 * Core Email Validation Engine
 * Checks RFC email syntax and rejects disallowed mock/test domain patterns.
 */

const DISALLOWED_EXACT_DOMAINS = new Set([
  'example.com',
  'mock.com',
  'test.com',
  'invalid',
  'localhost',
]);

/**
 * Validates whether an email string meets RFC syntax standards and is NOT from a mock/test domain.
 */
export function isValidRealEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const trimmed = email.trim();
  if (!trimmed) return false;

  // RFC basic syntax validation
  const rfcEmailRegex = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  if (!rfcEmailRegex.test(trimmed)) {
    return false;
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const domain = parts[1].toLowerCase();

  // Rejects explicit disallowed exact domains or subdomains
  if (DISALLOWED_EXACT_DOMAINS.has(domain)) {
    return false;
  }

  for (const disallowed of DISALLOWED_EXACT_DOMAINS) {
    if (domain.endsWith('.' + disallowed)) {
      return false;
    }
  }

  // Rejects any domain containing 'mock'
  if (domain.includes('mock')) {
    return false;
  }

  return true;
}
