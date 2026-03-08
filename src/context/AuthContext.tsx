import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '../types';
import { StorageService } from '../services/storage';
import { EncryptionService } from '../services/encryption';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  encryptionKey: CryptoKey | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (user: Omit<User, 'passwordHash' | 'createdAt'>, password: string) => Promise<User>;
  logout: () => void;
  startAnonymous: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key for storing the exported key in sessionStorage (for refresh persistence)
const SESSION_KEY_STORAGE = 'mindguard_key_temp';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    setIsLoading(true);
    try {
      // Try to restore session from localStorage (set during login)
      const session = StorageService.get<Session | null>(StorageService.KEYS.SESSION, null);
      if (session && session.email && !session.anon) {
        const cachedUsers = StorageService.get<User[]>(StorageService.KEYS.USERS, []);
        const foundUser = cachedUsers.find((u) => u.email === session.email);
        if (foundUser) {
          setUser(foundUser);
          const savedKeyJson = sessionStorage.getItem(SESSION_KEY_STORAGE);
          if (savedKeyJson) {
            const keyData = JSON.parse(savedKeyJson);
            const key = await window.crypto.subtle.importKey(
              'jwk',
              keyData,
              { name: 'AES-GCM', length: 256 },
              false,
              ['encrypt', 'decrypt']
            );
            setEncryptionKey(key);
          }
        }
      } else if (session && session.anon) {
        setUser({
          email: 'anonymous',
          fullname: 'Anonymous',
          studentid: '',
          program: '',
          passwordHash: '',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Auth init error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveKeyToSession = async (key: CryptoKey) => {
    const exported = await window.crypto.subtle.exportKey('jwk', key);
    sessionStorage.setItem(SESSION_KEY_STORAGE, JSON.stringify(exported));
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Invalid email or password');
    }
    
    const data = await res.json();
    const raw = data.user;

    // Map backend snake_case fields → frontend camelCase User type
    const foundUser: User = {
      id: raw.id,
      email: raw.email,
      fullname: raw.fullname || '',
      studentid: raw.student_id || '',
      program: raw.program || '',
      passwordHash: '',  // Never stored in frontend
      createdAt: new Date().toISOString(),
      role: raw.role || 'student',
      is_primary_admin: raw.is_primary_admin || false,
      trusted_contacts: raw.trusted_contacts || [],
    };

    // Derive encryption key
    const key = await EncryptionService.deriveKey(password);
    setEncryptionKey(key);
    await saveKeyToSession(key);

    setUser(foundUser);
    
    // Cache for refresh persistence
    const users = StorageService.get<User[]>(StorageService.KEYS.USERS, []);
    const existingIdx = users.findIndex(u => u.email === foundUser.email);
    if (existingIdx >= 0) users[existingIdx] = foundUser;
    else users.push(foundUser);
    StorageService.set(StorageService.KEYS.USERS, users);

    StorageService.set(StorageService.KEYS.SESSION, {
      email: foundUser.email,
      anon: false,
      createdAt: new Date().toISOString(),
    });

    return foundUser;
  };

  const signup = async (userData: Omit<User, 'passwordHash' | 'createdAt'>, password: string): Promise<User> => {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fullname: userData.fullname, 
        email: userData.email, 
        student_id: userData.studentid, 
        program: userData.program, 
        password 
      })
    });
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Email already exists or signup failed');
    }
    
    const data = await res.json();
    const newUser: User = data.user;

    // Cache to local storage
    const users = StorageService.get<User[]>(StorageService.KEYS.USERS, []);
    users.push(newUser);
    StorageService.set(StorageService.KEYS.USERS, users);

    // Auto login
    const key = await EncryptionService.deriveKey(password);
    setEncryptionKey(key);
    await saveKeyToSession(key);

    setUser(newUser);
    StorageService.set(StorageService.KEYS.SESSION, {
      email: newUser.email,
      anon: false,
      createdAt: new Date().toISOString(),
    });

    return newUser;
  };

  const logout = () => {
    setUser(null);
    setEncryptionKey(null);
    StorageService.remove(StorageService.KEYS.SESSION);
    sessionStorage.removeItem(SESSION_KEY_STORAGE);
  };

  const startAnonymous = () => {
    setUser({
      email: 'guest',
      fullname: 'Guest',
      studentid: '',
      program: '',
      passwordHash: '',
      createdAt: new Date().toISOString(),
    });
    StorageService.set(StorageService.KEYS.SESSION, {
      email: null,
      anon: true,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        encryptionKey,
        login,
        signup,
        logout,
        startAnonymous,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
