import { isValidRealEmail } from '../utils/emailValidation';

describe('isValidRealEmail', () => {
  it('should return true for valid real emails', () => {
    expect(isValidRealEmail('user@gmail.com')).toBe(true);
    expect(isValidRealEmail('john.doe@company.co.uk')).toBe(true);
    expect(isValidRealEmail('dev@indspoileralert.com')).toBe(true);
  });

  it('should return false for invalid RFC email syntax', () => {
    expect(isValidRealEmail('')).toBe(false);
    expect(isValidRealEmail('notanemail')).toBe(false);
    expect(isValidRealEmail('@domain.com')).toBe(false);
    expect(isValidRealEmail('user@')).toBe(false);
    expect(isValidRealEmail('user@.com')).toBe(false);
    expect(isValidRealEmail('user@domain..com')).toBe(false);
  });

  it('should return false for disallowed mock domain emails', () => {
    expect(isValidRealEmail('test@example.com')).toBe(false);
    expect(isValidRealEmail('user@mock.com')).toBe(false);
    expect(isValidRealEmail('admin@test.com')).toBe(false);
    expect(isValidRealEmail('user@invalid')).toBe(false);
    expect(isValidRealEmail('root@localhost')).toBe(false);
    expect(isValidRealEmail('tester@sub.mock.org')).toBe(false);
    expect(isValidRealEmail('foo@my-mock-site.net')).toBe(false);
  });
});
