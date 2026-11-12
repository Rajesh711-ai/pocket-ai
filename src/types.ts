export interface User {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt?: string;
  pinHash: string;
  pinSalt?: string;
  role: 'Guest' | 'User' | 'Administrator';
  authMethod: AuthMethod;
  createdAt: string;
}

export type AuthMethod = 
  | 'Password' 
  | 'PIN' 
  | 'Face' 
  | 'Voice' 
  | 'Face_Password' 
  | 'Face_Voice' 
  | 'Voice_Password' 
  | 'Face_Voice_PIN';

export interface BiometricTemplate {
  id: string;
  userId: string;
  templateType: 'face' | 'voice';
  encryptedTemplate: string; // Base64 of facial embeddings/voiceprint spectrogram arrays
  createdAt: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  username: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  authMethodUsed: string;
  ipAddress: string;
  deviceInfo: string;
  failureReason?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  timestamp: string;
  action: string; // e.g. "USER_REGISTERED", "PASSWORD_CHANGED", "FILE_ENCRYPTED"
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  timestamp: string;
  eventType: 'BRUTE_FORCE' | 'TAMPER_DETECTED' | 'BIOMETRIC_RETRY_EXCEEDED' | 'UNAUTHORIZED_ACCESS';
  description: string;
  severity: 'WARNING' | 'CRITICAL';
}

export interface UserSettings {
  userId: string;
  theme: 'dark' | 'light' | 'system';
  language: 'en' | 'es' | 'de' | 'fr';
  securityLevel: 'STANDARD' | 'HIGH' | 'PARANOID';
  autoLogoutMinutes: number;
}

export interface SecureNote {
  id: string;
  userId: string;
  title: string;
  content: string; // Encrypted text
  category: string;
  tags: string[];
  updatedAt: string;
}

export interface PasswordRecord {
  id: string;
  userId: string;
  siteName: string;
  siteUrl: string;
  loginUsername: string;
  encryptedPassword: string;
  category: 'Work' | 'Personal' | 'Financial' | 'Social' | 'Other';
  updatedAt: string;
}

export interface SecureFile {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  encryptedData: string; // Base64 encrypted string
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
