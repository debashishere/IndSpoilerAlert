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

/**
 * Normalizes an email address to its base canonical form by stripping plus-addressing (sub-emails)
 * e.g., "debashishere007+wholefoodsmarketregional@gmail.com" -> "debashishere007@gmail.com"
 */
export function getBaseEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return trimmed;
  const localPart = trimmed.substring(0, atIndex);
  const domainPart = trimmed.substring(atIndex + 1);
  const baseLocalPart = localPart.split('+')[0];
  return `${baseLocalPart}@${domainPart}`;
}

/**
 * Checks if two email addresses are equivalent, supporting exact matches as well as
 * sub-email / plus-address aliases (e.g. main email bidding on sub-email offer or vice-versa).
 */
export function areBuyerEmailsMatching(email1?: string | null, email2?: string | null): boolean {
  if (!email1 || !email2) return false;
  const e1 = email1.trim().toLowerCase();
  const e2 = email2.trim().toLowerCase();
  if (e1 === e2) return true;
  const base1 = getBaseEmail(e1);
  const base2 = getBaseEmail(e2);
  return Boolean(base1 && base2 && base1 === base2);
}

