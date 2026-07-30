import { describe, it, expect, beforeEach } from 'vitest';
import { firebaseAuthService } from '../services/firebaseAuthService';

describe('firebaseAuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should sign up a user in Dev Mock Auth mode with dual profiles and return a mock token', async () => {
    const user = await firebaseAuthService.signupWithEmail('test@example.com', 'password123', {
      buyer: true,
      supplier: false,
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.profiles).toEqual({ buyer: true, supplier: false });

    const token = await firebaseAuthService.getCurrentIdToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token!.length).toBeGreaterThan(0);
  });

  it('should log in an existing mock user and retrieve state', async () => {
    await firebaseAuthService.signupWithEmail('seller@example.com', 'password123', {
      buyer: false,
      supplier: true,
    });

    await firebaseAuthService.logoutUser();
    const currentUser = firebaseAuthService.getCurrentUser();
    expect(currentUser).toBeNull();

    const loggedInUser = await firebaseAuthService.loginWithEmail('seller@example.com', 'password123');
    expect(loggedInUser.email).toBe('seller@example.com');
    expect(loggedInUser.profiles).toEqual({ buyer: false, supplier: true });
  });

  it('should clear session state on logout', async () => {
    await firebaseAuthService.signupWithEmail('dual@example.com', 'password123', {
      buyer: true,
      supplier: true,
    });

    expect(firebaseAuthService.getCurrentUser()).not.toBeNull();
    await firebaseAuthService.logoutUser();
    expect(firebaseAuthService.getCurrentUser()).toBeNull();
    expect(await firebaseAuthService.getCurrentIdToken()).toBeNull();
  });
});
