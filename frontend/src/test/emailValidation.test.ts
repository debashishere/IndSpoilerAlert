import { describe, it, expect } from 'vitest';
import { isValidRealEmail } from '../utils/emailValidation';

describe('frontend isValidRealEmail', () => {
  it('should return true for valid real emails', () => {
    expect(isValidRealEmail('user@gmail.com')).toBe(true);
    expect(isValidRealEmail('jane.doe@company.org')).toBe(true);
    expect(isValidRealEmail('buyer@indspoileralert.com')).toBe(true);
  });

  it('should return false for invalid RFC email syntax', () => {
    expect(isValidRealEmail('')).toBe(false);
    expect(isValidRealEmail('plainaddress')).toBe(false);
    expect(isValidRealEmail('@no-user.com')).toBe(false);
    expect(isValidRealEmail('user@')).toBe(false);
  });

  it('should return false for disallowed mock domain emails', () => {
    expect(isValidRealEmail('user@example.com')).toBe(false);
    expect(isValidRealEmail('admin@mock.com')).toBe(false);
    expect(isValidRealEmail('test@test.com')).toBe(false);
    expect(isValidRealEmail('dev@invalid')).toBe(false);
    expect(isValidRealEmail('root@localhost')).toBe(false);
    expect(isValidRealEmail('user@my-mock-site.com')).toBe(false);
  });
});
