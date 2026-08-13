import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { isValidRealEmail } from '../utils/emailValidation';

export interface UserProfiles {
  buyer: boolean;
  supplier: boolean;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  profiles: UserProfiles;
  photoURL?: string;
}

const MOCK_USER_STORAGE_KEY = 'ind_spoiler_auth_mock_user';
const MOCK_TOKEN_STORAGE_KEY = 'ind_spoiler_auth_mock_token';
const MOCK_PROFILES_STORAGE_KEY = 'ind_spoiler_auth_mock_profiles';

const isFirebaseConfigured = (): boolean => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const forceMock = import.meta.env.VITE_USE_DEV_MOCK_AUTH === 'true';
  return Boolean(apiKey && !forceMock);
};

const getFirebaseAuth = () => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
};

type AuthStateCallback = (user: AuthUser | null) => void;

class FirebaseAuthService {
  private authStateListeners: Set<AuthStateCallback> = new Set();
  private mockUser: AuthUser | null = null;
  private mockToken: string | null = null;

  constructor() {
    this.loadMockSession();
  }

  private loadMockSession() {
    try {
      const storedUser = localStorage.getItem(MOCK_USER_STORAGE_KEY);
      const storedToken = localStorage.getItem(MOCK_TOKEN_STORAGE_KEY);
      if (storedUser && storedToken) {
        this.mockUser = JSON.parse(storedUser);
        this.mockToken = storedToken;
      } else {
        this.mockUser = null;
        this.mockToken = null;
      }
    } catch {
      this.mockUser = null;
      this.mockToken = null;
    }
  }

  private notifyListeners() {
    const user = this.getCurrentUser();
    this.authStateListeners.forEach((callback) => callback(user));
  }

  public getCurrentUser(): AuthUser | null {
    if (!isFirebaseConfigured()) {
      this.loadMockSession();
      return this.mockUser;
    }
    // Firebase Web SDK fallback/placeholder if initialized
    return this.mockUser;
  }

  public async getCurrentIdToken(): Promise<string | null> {
    if (!isFirebaseConfigured()) {
      this.loadMockSession();
      return this.mockToken;
    }
    return this.mockToken;
  }

  public async handleGoogleAuthError(error: any): Promise<never> {
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('User closed the login popup');
    }
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error('Unauthorized Domain: Please add your current domain (e.g. localhost) in Firebase Console > Authentication > Settings > Authorized domains.');
    }
    if (error?.code === 'auth/operation-not-allowed') {
      throw new Error('Google Sign-In Disabled: Please enable Google as a Sign-in provider in Firebase Console > Authentication > Sign-in method.');
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Popup Blocked: Your browser blocked the sign-in popup. Please allow popups for this site.');
    }
    if (error?.code === 'auth/invalid-api-key') {
      throw new Error('Invalid Firebase API Key: Please verify VITE_FIREBASE_API_KEY in frontend/.env.');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }

  public async signInWithGoogle(
    profiles: UserProfiles = { buyer: true, supplier: true }
  ): Promise<AuthUser> {
    if (!isFirebaseConfigured()) {
      const email = 'google.user@indspoileralert.com';
      if (!isValidRealEmail(email)) {
        throw new Error('Disallowed mock email domain. Please use a valid real email address.');
      }

      let userProfiles: UserProfiles = profiles;
      try {
        const storedProfiles = localStorage.getItem(`${MOCK_PROFILES_STORAGE_KEY}_${email}`);
        if (storedProfiles) {
          userProfiles = JSON.parse(storedProfiles);
        }
      } catch {
        // default dual profiles
      }

      const uid = 'mock-google-uid-12345';
      const user: AuthUser = {
        uid,
        email,
        displayName: 'Google Test User',
        photoURL: 'https://lh3.googleusercontent.com/a/default-user-photo',
        profiles: userProfiles,
      };

      const token = `mock-firebase-id-token-${uid}`;
      this.mockUser = user;
      this.mockToken = token;

      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(MOCK_TOKEN_STORAGE_KEY, token);
      localStorage.setItem(`${MOCK_PROFILES_STORAGE_KEY}_${email}`, JSON.stringify(userProfiles));
      localStorage.setItem('ind_spoiler_auth_session_active', 'true');

      this.notifyListeners();
      return user;
    }

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const credential = await signInWithPopup(auth, provider);
      const firebaseUser = credential.user;
      const userEmail = firebaseUser.email || '';

      if (!isValidRealEmail(userEmail)) {
        throw new Error('Disallowed mock email domain. Please use a valid real email address.');
      }

      const idToken = await firebaseUser.getIdToken();

      let userProfiles: UserProfiles = profiles;
      try {
        const storedProfiles = localStorage.getItem(`${MOCK_PROFILES_STORAGE_KEY}_${userEmail}`);
        if (storedProfiles) {
          userProfiles = JSON.parse(storedProfiles);
        }
      } catch {
        // default dual profiles
      }

      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: userEmail,
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        profiles: userProfiles,
      };

      this.mockUser = authUser;
      this.mockToken = idToken;

      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(authUser));
      localStorage.setItem(MOCK_TOKEN_STORAGE_KEY, idToken);
      localStorage.setItem(`${MOCK_PROFILES_STORAGE_KEY}_${userEmail}`, JSON.stringify(userProfiles));
      localStorage.setItem('ind_spoiler_auth_session_active', 'true');

      this.notifyListeners();
      return authUser;
    } catch (error: any) {
      return this.handleGoogleAuthError(error);
    }
  }

  public async updateUserProfiles(profiles: Partial<UserProfiles>): Promise<AuthUser> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user to update profiles for');
    }

    const updatedUser: AuthUser = {
      ...currentUser,
      profiles: {
        ...currentUser.profiles,
        ...profiles,
      },
    };

    this.mockUser = updatedUser;
    localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(updatedUser));
    localStorage.setItem(
      `${MOCK_PROFILES_STORAGE_KEY}_${updatedUser.email}`,
      JSON.stringify(updatedUser.profiles)
    );

    this.notifyListeners();
    return updatedUser;
  }

  public async loginWithEmail(email: string, _password?: string): Promise<AuthUser> {
    if (!isValidRealEmail(email)) {
      throw new Error('Disallowed mock email domain. Please use a valid real email address.');
    }

    if (!isFirebaseConfigured()) {
      let profiles: UserProfiles = { buyer: true, supplier: true };
      try {
        const storedProfiles = localStorage.getItem(`${MOCK_PROFILES_STORAGE_KEY}_${email}`);
        if (storedProfiles) {
          profiles = JSON.parse(storedProfiles);
        }
      } catch {
        // default dual profiles
      }

      const uid = `mock-uid-${btoa(email).replace(/=/g, '')}`;
      const user: AuthUser = {
        uid,
        email,
        displayName: email.split('@')[0],
        profiles,
      };

      const token = `mock-firebase-id-token-${uid}`;
      this.mockUser = user;
      this.mockToken = token;

      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(MOCK_TOKEN_STORAGE_KEY, token);
      localStorage.setItem('ind_spoiler_auth_session_active', 'true');

      this.notifyListeners();
      return user;
    }

    throw new Error('Firebase Web SDK Auth login not configured');
  }

  public async signupWithEmail(
    email: string,
    _password?: string,
    profiles: UserProfiles = { buyer: true, supplier: false }
  ): Promise<AuthUser> {
    if (!isValidRealEmail(email)) {
      throw new Error('Disallowed mock email domain. Please use a valid real email address.');
    }

    if (!isFirebaseConfigured()) {
      const uid = `mock-uid-${btoa(email).replace(/=/g, '')}`;
      const user: AuthUser = {
        uid,
        email,
        displayName: email.split('@')[0],
        profiles,
      };

      const token = `mock-firebase-id-token-${uid}`;
      this.mockUser = user;
      this.mockToken = token;

      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(MOCK_TOKEN_STORAGE_KEY, token);
      localStorage.setItem(`${MOCK_PROFILES_STORAGE_KEY}_${email}`, JSON.stringify(profiles));
      localStorage.setItem('ind_spoiler_auth_session_active', 'true');

      this.notifyListeners();
      return user;
    }

    throw new Error('Firebase Web SDK Auth signup not configured');
  }

  public async logoutUser(): Promise<void> {
    this.mockUser = null;
    this.mockToken = null;
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    localStorage.removeItem(MOCK_TOKEN_STORAGE_KEY);
    localStorage.removeItem('ind_spoiler_auth_session_active');
    this.notifyListeners();
  }

  public onAuthChange(callback: AuthStateCallback): () => void {
    this.authStateListeners.add(callback);
    callback(this.getCurrentUser());
    return () => {
      this.authStateListeners.delete(callback);
    };
  }
}

export const firebaseAuthService = new FirebaseAuthService();

