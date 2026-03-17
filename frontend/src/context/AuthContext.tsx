import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

type User = {
  id: string;
  email: string;
  name: string;
  language: string;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const stored = await AsyncStorage.getItem('auth_token');
      if (stored) {
        setToken(stored);
        const me = await api.getMe();
        setUser(me);
      }
    } catch {
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.login({ email, password });
    await AsyncStorage.setItem('auth_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.register({ email, password, name });
    await AsyncStorage.setItem('auth_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  }

  async function logout() {
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
