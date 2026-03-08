import type { EncryptedData } from '../types';

const SALT = 'mindguard-salt-v1'; // In production, this should be unique per user and stored with the user record.
const ITERATIONS = 100000;
const ALGO_KEY = 'AES-GCM';
const ALGO_HASH = 'SHA-256';

export const EncryptionService = {
  async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(SALT),
        iterations: ITERATIONS,
        hash: ALGO_HASH,
      },
      keyMaterial,
      { name: ALGO_KEY, length: 256 },
      true, // Key MUST be extractable so AuthContext can save it to sessionStorage
      ['encrypt', 'decrypt']
    );
  },

  async encrypt(data: any, key: CryptoKey): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = encoder.encode(JSON.stringify(data));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: ALGO_KEY, iv },
      key,
      encodedData
    );

    return {
      encrypted: Array.from(new Uint8Array(encryptedBuffer)),
      iv: Array.from(iv),
    };
  },

  async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<any> {
    try {
      const iv = new Uint8Array(encryptedData.iv);
      const data = new Uint8Array(encryptedData.encrypted);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: ALGO_KEY, iv },
        key,
        data
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedBuffer));
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  },

  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest(ALGO_HASH, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  },
};
