export interface User {
  id?: number;
  email: string;
  fullname: string;
  studentid: string;
  program: string;
  passwordHash?: string; // Optional since it comes from backend
  createdAt?: string;
  role?: string; // "student" or "admin"
  is_primary_admin?: boolean;
  trusted_contacts?: string[];
  // Encrypted fields (optional, if we decide to encrypt profile data too)
  emergencyContacts?: EncryptedData; 
}

export interface Session {
  email: string | null;
  anon: boolean;
  createdAt: string;
  // The key used for this session's encryption (not stored in localStorage directly, but kept in memory)
  // In this demo, we might need to re-derive it or store it in sessionStorage (still risky but better than local)
  // Or we just ask for password on login to derive it.
}

export interface EncryptedData {
  encrypted: number[]; // Array from Uint8Array
  iv: number[]; // Array from Uint8Array
}

export interface MoodLog {
  id: string;
  date: string;
  mood: string; // 'Great' | 'Good' | 'Okay' | 'Down' | 'Crisis'
  value: number; // 1-5
  note?: string; // Encrypted content?
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  response: string;
  sentiment: string;
  action?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}
