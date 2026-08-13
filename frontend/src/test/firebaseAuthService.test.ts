import { describe, it, expect, beforeEach } from 'vitest';
import { firebaseAuthService } from '../services/firebaseAuthService';

describe('firebaseAuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should reject signup with a mock email domain', async () => {
    await expect(
      firebaseAuthService.signupWithEmail('user@example.com', 'password123', {
        buyer: true,
        supplier: false,
      })
    ).rejects.toThrow(/disallowed mock email domain/i);
  });

  it('should reject login with a mock email domain', async () => {
    await expect(
      firebaseAuthService.loginWithEmail('user@mock.com', 'password123')
    ).rejects.toThrow(/disallowed mock email domain/i);
  });

  it('should sign up a user with a valid real email and return token', async () => {
    const user = await firebaseAuthService.signupWithEmail('test@indspoileralert.com', 'password123', {
      buyer: true,
      supplier: false,
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('test@indspoileralert.com');
    expect(user.profiles).toEqual({ buyer: true, supplier: false });

    const token = await firebaseAuthService.getCurrentIdToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token!.length).toBeGreaterThan(0);
  });

  it('should log in an existing mock user with valid real email', async () => {
    await firebaseAuthService.signupWithEmail('seller@indspoileralert.com', 'password123', {
      buyer: false,
      supplier: true,
    });

    await firebaseAuthService.logoutUser();
    const currentUser = firebaseAuthService.getCurrentUser();
    expect(currentUser).toBeNull();

    const loggedInUser = await firebaseAuthService.loginWithEmail('seller@indspoileralert.com', 'password123');
    expect(loggedInUser.email).toBe('seller@indspoileralert.com');
    expect(loggedInUser.profiles).toEqual({ buyer: false, supplier: true });
  });

  it('should clear session state on logout', async () => {
    await firebaseAuthService.signupWithEmail('dual@indspoileralert.com', 'password123', {
      buyer: true,
      supplier: true,
    });

    expect(firebaseAuthService.getCurrentUser()).not.toBeNull();
    await firebaseAuthService.logoutUser();
    expect(firebaseAuthService.getCurrentUser()).toBeNull();
    expect(await firebaseAuthService.getCurrentIdToken()).toBeNull();
  });

  it('should sign in with Google with a valid non-mock email', async () => {
    const user = await firebaseAuthService.signInWithGoogle({
      buyer: true,
      supplier: true,
    });

    expect(user).toBeDefined();
    expect(user.email).not.toContain('example.com');
    expect(user.displayName).toBeDefined();
    expect(user.photoURL).toBeDefined();
    expect(user.profiles).toEqual({ buyer: true, supplier: true });

    const token = await firebaseAuthService.getCurrentIdToken();
    expect(token).toBeDefined();
    expect(token?.length).toBeGreaterThan(0);
    expect(localStorage.getItem('ind_spoiler_auth_session_active')).toBe('true');
  });

  it('should handle popup-closed-by-user error gracefully during Google sign-in', async () => {
    const popupError = new Error('User closed the popup window');
    (popupError as any).code = 'auth/popup-closed-by-user';
    await expect(firebaseAuthService.handleGoogleAuthError(popupError)).rejects.toThrow('User closed the login popup');
  });
});
