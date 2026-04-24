import { createContext, useContext, useState, ReactNode } from 'react';

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
  onboarded: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: '1',
      email,
      displayName: email.split('@')[0],
      role: 'learner',
      xp: 1250,
      level: 5,
      streak: 7,
      accuracy: 85,
      onboarded: true
    });
  };

  const loginWithGoogle = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: '1',
      email: 'user@example.com',
      displayName: 'Demo User',
      role: 'learner',
      xp: 1250,
      level: 5,
      streak: 7,
      accuracy: 85,
      onboarded: true
    });
  };

  const signup = async (email: string, password: string, displayName: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: '1',
      email,
      displayName,
      role: 'learner',
      xp: 0,
      level: 1,
      streak: 0,
      accuracy: 0,
      onboarded: false
    });
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
