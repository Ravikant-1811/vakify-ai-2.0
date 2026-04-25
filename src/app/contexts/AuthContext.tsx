import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch, setAuthToken, getAuthToken } from '../lib/api';

export type UserRole = 'learner' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  xp: number;
  level: number;
  streak: number;
  accuracy: number;
  learningLevel?: string;
  preferredLanguage?: string;
  visualWeight?: number;
  auditoryWeight?: number;
  kinestheticWeight?: number;
  weakTopics?: string[];
  onboarded: boolean;
}

interface AuthContextType {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setReady(true);
        return;
      }

      try {
        const response = await apiFetch<Record<string, any>>('/api/auth/me');
        setUser(mapUser(response));
      } catch {
        setAuthToken(null);
        setUser(null);
      } finally {
        setReady(true);
      }
    };

    void restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiFetch<Record<string, any>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    setAuthToken(response.access_token ? String(response.access_token) : null);
    setUser(mapUser(response.user));
  };

  const loginWithGoogle = async () => {
    const response = await apiFetch<Record<string, any>>('/api/auth/clerk-login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@vakify.local',
        name: 'Learner',
      }),
      skipAuth: true,
    });
    setAuthToken(response.access_token ? String(response.access_token) : null);
    setUser(mapUser(response.user));
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const response = await apiFetch<Record<string, any>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
      skipAuth: true,
    });
    setAuthToken(response.access_token ? String(response.access_token) : null);
    setUser(mapUser(response.user));
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Logout should still clear local state if the token is already expired.
    }
    setAuthToken(null);
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      const payload: Record<string, unknown> = {};
      if (updates.displayName !== undefined) payload.name = updates.displayName;
      if (updates.learningLevel !== undefined) payload.learning_level = updates.learningLevel;
      if (updates.preferredLanguage !== undefined) payload.preferred_language = updates.preferredLanguage;
      if (updates.weakTopics !== undefined) payload.weak_topics = updates.weakTopics;
      if (updates.visualWeight !== undefined) payload.visual_weight = updates.visualWeight;
      if (updates.auditoryWeight !== undefined) payload.auditory_weight = updates.auditoryWeight;
      if (updates.kinestheticWeight !== undefined) payload.kinesthetic_weight = updates.kinestheticWeight;
      if (updates.xp !== undefined) payload.xp = updates.xp;
      if (updates.level !== undefined) payload.level = updates.level;
      if (updates.streak !== undefined) payload.streak = updates.streak;
      if (updates.accuracy !== undefined) payload.accuracy = updates.accuracy;

      let nextUser: User = { ...user, ...updates };
      if (Object.keys(payload).length > 0) {
        const response = await apiFetch<Record<string, any>>('/api/auth/me', {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        nextUser = {
          ...mapUser(response.user || response),
          ...updates,
        };
      }
      setUser(nextUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, loginWithGoogle, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function mapUser(data: Record<string, any>): User {
  return {
    id: String(data.id ?? data.user_id ?? ''),
    email: String(data.email ?? ''),
    displayName: String(data.displayName ?? data.name ?? data.email ?? 'Learner'),
    avatar: data.avatar ?? undefined,
    role: (data.role === 'admin' || data.role === 'moderator' ? data.role : 'learner') as User['role'],
    xp: Number(data.xp ?? 0),
    level: Number(data.level ?? 1),
    streak: Number(data.streak ?? 0),
    accuracy: Number(data.accuracy ?? 0),
    learningLevel: data.learningLevel ?? data.learning_level ?? undefined,
    preferredLanguage: data.preferredLanguage ?? data.preferred_language ?? undefined,
    visualWeight: data.visualWeight ?? data.visual_weight ?? undefined,
    auditoryWeight: data.auditoryWeight ?? data.auditory_weight ?? undefined,
    kinestheticWeight: data.kinestheticWeight ?? data.kinesthetic_weight ?? undefined,
    weakTopics: data.weakTopics ?? data.weak_topics ?? undefined,
    onboarded: Boolean(data.onboarded),
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
