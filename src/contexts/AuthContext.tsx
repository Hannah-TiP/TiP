'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { getDeviceId, clearDeviceId } from '@/lib/device';
import type { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setUser(null);
      // Don't automatically redirect - let middleware handle protected routes
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshUser, router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const deviceId = await getDeviceId();
      await apiClient.login(email, password, deviceId);
      await refreshUser();
      router.push('/my-page');
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, code: string) => {
    setIsLoading(true);
    try {
      const deviceId = await getDeviceId();
      await apiClient.register(email, password, deviceId, code);
      await refreshUser();
      router.push('/my-page');
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const sendVerificationCode = async (email: string, type: 'register' | 'forgot-password') => {
    await apiClient.sendVerificationCode(email, type);
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const deviceId = await getDeviceId();
    await apiClient.resetPassword(email, code, newPassword, deviceId);
    await refreshUser();
    router.push('/my-page');
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      clearDeviceId();
      router.push('/');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    sendVerificationCode,
    resetPassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
