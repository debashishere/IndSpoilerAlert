import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseAuthService } from '../services/firebaseAuthService';
import type { AuthUser, UserProfiles } from '../services/firebaseAuthService';

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<AuthUser>;
  loginWithGoogle: (profiles?: UserProfiles) => Promise<AuthUser>;
  signup: (email: string, password?: string, profiles?: UserProfiles) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfiles: (profiles: Partial<UserProfiles>) => Promise<AuthUser>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => firebaseAuthService.getCurrentUser());
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = firebaseAuthService.onAuthChange(async (currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      if (currentUser) {
        const currentToken = await firebaseAuthService.getCurrentIdToken();
        if (isMounted) setToken(currentToken);
      } else {
        if (isMounted) setToken(null);
      }
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const loggedInUser = await firebaseAuthService.loginWithEmail(email, password);
      const currentToken = await firebaseAuthService.getCurrentIdToken();
      setUser(loggedInUser);
      setToken(currentToken);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (profiles?: UserProfiles): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const loggedInUser = await firebaseAuthService.signInWithGoogle(profiles);
      const currentToken = await firebaseAuthService.getCurrentIdToken();
      setUser(loggedInUser);
      setToken(currentToken);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password?: string,
    profiles?: UserProfiles
  ): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const newUser = await firebaseAuthService.signupWithEmail(email, password, profiles);
      const currentToken = await firebaseAuthService.getCurrentIdToken();
      setUser(newUser);
      setToken(currentToken);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await firebaseAuthService.logoutUser();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfiles = async (profiles: Partial<UserProfiles>): Promise<AuthUser> => {
    const updatedUser = await firebaseAuthService.updateUserProfiles(profiles);
    setUser(updatedUser);
    return updatedUser;
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    loginWithGoogle,
    signup,
    logout,
    updateProfiles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
