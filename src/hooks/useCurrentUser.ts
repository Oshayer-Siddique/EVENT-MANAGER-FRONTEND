'use client';

import { useEffect, useState } from 'react';

import { getCurrentUser } from '@/services/authService';
import type { UserProfile } from '@/types/user';

export const useCurrentUser = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (typeof window === 'undefined') {
      return () => {
        cancelled = true;
      };
    }

    const token = window.localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const fetchProfile = async () => {
      try {
        const profile = await getCurrentUser();
        if (!cancelled) {
          setUser(profile);
        }
      } catch (error) {
        console.warn('Unable to load current user profile', error);
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
};
