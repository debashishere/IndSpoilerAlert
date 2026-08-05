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
      const sessionActive = localStorage.getItem('ind_spoiler_auth_session_active');
      if (storedUser && storedToken && sessionActive === 'true') {
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
