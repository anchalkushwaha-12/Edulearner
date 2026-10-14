import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: { email: string; password: string; full_name: string; role?: string; language?: string; grade?: number; school_name?: string }) => Promise<void>;
  demoLogin: (role: 'student' | 'teacher') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: Partial<User & StudentProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  demoLogin: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  updateProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setProfile(res.profile);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setUser(res.user);
    await refreshUser();
  };

  const register = async (payload: { email: string; password: string; full_name: string; role?: string; language?: string; grade?: number; school_name?: string }) => {
    const res = await api.register(payload);
    setUser(res.user);
    await refreshUser();
  };

  const demoLogin = async (role: 'student' | 'teacher') => {
    const res = await api.demoLogin(role);
    setUser(res.user);
    await refreshUser();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (payload: Partial<User & StudentProfile>) => {
    const res = await api.updateProfile(payload);
    setUser(res.user);
    if (res.profile) setProfile(res.profile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, login, register, demoLogin, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
