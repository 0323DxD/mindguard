import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '../types';
import { StorageService } from '../services/storage';
import { EncryptionService } from '../services/encryption';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  encryptionKey: CryptoKey | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (user: Omit<User, 'passwordHash' | 'createdAt'>, password: string) => Promise<void>;
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
      const session = StorageService.get<Session | null>(StorageService.KEYS.SESSION, null);
      if (session && session.email) {
        const users = StorageService.get<User[]>(StorageService.KEYS.USERS, []);
        const foundUser = users.find((u) => u.email === session.email);
        if (foundUser) {
          setUser(foundUser);
          // Try to restore key from sessionStorage
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
        // Anonymous session
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

  const login = async (email: string, password: string) => {
    const users = StorageService.get<User[]>(StorageService.KEYS.USERS, []);
    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) throw new Error('User not found');

    const hash = await EncryptionService.hashPassword(password);
    if (hash !== foundUser.passwordHash) throw new Error('Invalid credentials');

    // Derive key
    const key = await EncryptionService.deriveKey(password);
    setEncryptionKey(key);
    await saveKeyToSession(key);

    setUser(foundUser);
    StorageService.set(StorageService.KEYS.SESSION, {
      email: foundUser.email,
      anon: false,
      createdAt: new Date().toISOString(),
    });
  };

  const signup = async (userData: Omit<User, 'passwordHash' | 'createdAt'>, password: string) => {
    const users = StorageService.get<User[]>(StorageService.KEYS.USERS, []);
    if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Email already exists');
    }

    const passwordHash = await EncryptionService.hashPassword(password);
    const newUser: User = {
      ...userData,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

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
