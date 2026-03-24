import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ twoFactorRequired?: boolean; twoFactorToken?: string }>;
  verify2FA: (code: string, twoFactorToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isOwner: boolean;
  isCashier: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restore session on app start
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        const response = await authAPI.me();
        const userData = response.data?.data?.user;
        if (userData) {
          setState({
            user: userData,
            token,
            isLoading: false,
            isAuthenticated: true,
          });
          return;
        }
      }
    } catch (error) {
      await SecureStore.deleteItemAsync('auth_token').catch(() => {});
    }
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const data = response.data?.data;

    if (data?.twoFactorRequired) {
      return {
        twoFactorRequired: true,
        twoFactorToken: data.twoFactorToken,
      };
    }

    const token = data?.token;
    const user = data?.user;

    if (token && user) {
      await SecureStore.setItemAsync('auth_token', token);
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    }
    return {};
  };

  const verify2FA = async (code: string, twoFactorToken: string) => {
    const response = await authAPI.verify2FA(code, twoFactorToken);
    const data = response.data?.data;
    const token = data?.token;
    const user = data?.user;

    if (token && user) {
      await SecureStore.setItemAsync('auth_token', token);
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    await SecureStore.deleteItemAsync('auth_token').catch(() => {});
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  };

  const isOwner = state.user?.role === 'OWNER';
  const isCashier = state.user?.role === 'CASHIER';

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        verify2FA,
        logout,
        isOwner,
        isCashier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
