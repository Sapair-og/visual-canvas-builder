'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, LocalUser } from '../lib/db';

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check initial active session
    const activeSession = db.getActiveSession();
    setUser(activeSession);
    setLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    setError(null);
    try {
      const existingUser = db.getUserByEmail(email);
      if (!existingUser) {
        throw new Error('User not found. Please sign up first.');
      }
      
      // Basic mock check: if password matches
      if (password && existingUser.password && existingUser.password !== password) {
        throw new Error('Incorrect password.');
      }

      db.setActiveSession(existingUser);
      setUser(existingUser);
      router.push('/');
      return existingUser;
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!email.includes('@')) {
        throw new Error('Invalid email address');
      }

      const existingUser = db.getUserByEmail(email);
      if (existingUser) {
        throw new Error('Email is already registered. Please login instead.');
      }

      const newUser: LocalUser = {
        id: Math.random().toString(36).substring(2, 9),
        email,
        password,
        createdAt: new Date().toISOString()
      };

      db.saveUser(newUser);
      db.setActiveSession(newUser);
      setUser(newUser);
      router.push('/');
      return newUser;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    db.setActiveSession(null);
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    loading,
    error,
    login,
    signUp,
    logout
  };
}
