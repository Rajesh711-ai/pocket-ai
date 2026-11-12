import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  User, 
  BiometricTemplate, 
  LoginHistory, 
  AuditLog, 
  SecurityEvent, 
  UserSettings, 
  SecureNote, 
  PasswordRecord, 
  SecureFile,
  AuthMethod
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  biometrics: BiometricTemplate[];
  loginHistory: LoginHistory[];
  auditLogs: AuditLog[];
  securityEvents: SecurityEvent[];
  userSettings: UserSettings[];
  notes: SecureNote[];
  passwords: PasswordRecord[];
  files: SecureFile[];
}

// Ensure database file and directory exist
export function hashWithPbkdf2(text: string, salt: string): string {
  return crypto.pbkdf2Sync(text, salt, 15000, 32, 'sha256').toString('hex');
}

function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    // Generate initial empty database
    const initialData: DatabaseSchema = {
      users: [],
      biometrics: [],
      loginHistory: [],
      auditLogs: [],
      securityEvents: [],
      userSettings: [],
      notes: [],
      passwords: [],
      files: []
    };
    
    // Seed an admin and user for demo convenience
    const adminId = crypto.randomUUID();
    const demoUserId = crypto.randomUUID();
    
    const adminPassSalt = crypto.randomBytes(16).toString('hex');
    const userPassSalt = crypto.randomBytes(16).toString('hex');
    const adminPinSalt = crypto.randomBytes(16).toString('hex');
    const userPinSalt = crypto.randomBytes(16).toString('hex');

    const adminPasswordHash = hashWithPbkdf2('admin123', adminPassSalt);
    const userPasswordHash = hashWithPbkdf2('user123', userPassSalt);
    
    const adminPinHash = hashWithPbkdf2('1234', adminPinSalt);
    const userPinHash = hashWithPbkdf2('4321', userPinSalt);

    const adminUser: User = {
      id: adminId,
      username: 'admin',
      passwordHash: adminPasswordHash,
      passwordSalt: adminPassSalt,
      pinHash: adminPinHash,
      pinSalt: adminPinSalt,
      role: 'Administrator',
      authMethod: 'Password',
      createdAt: new Date().toISOString()
    };

    const demoUser: User = {
      id: demoUserId,
      username: 'demo_user',
      passwordHash: userPasswordHash,
      passwordSalt: userPassSalt,
      pinHash: userPinHash,
      pinSalt: userPinSalt,
      role: 'User',
      authMethod: 'Face_Password',
      createdAt: new Date().toISOString()
    };

    initialData.users.push(adminUser, demoUser);
    
    // Seed default settings
    initialData.userSettings.push(
      {
        userId: adminId,
        theme: 'dark',
        language: 'en',
        securityLevel: 'HIGH',
        autoLogoutMinutes: 10
      },
      {
        userId: demoUserId,
        theme: 'dark',
        language: 'en',
        securityLevel: 'STANDARD',
        autoLogoutMinutes: 15
      }
    );

    // Seed default notes
    initialData.notes.push({
      id: crypto.randomUUID(),
      userId: demoUserId,
      title: 'Pocket AI Project Specs',
      content: 'This Secure Offline Login System is running locally. It uses SHA-256 for passwords/PINs, AES representation for file vault, and Web Audio/Canvas for real-time biometric feed mapping. Model: Phi-3 local edge inference.',
      category: 'College Presentation',
      tags: ['demo', 'defense', 'v1.0'],
      updatedAt: new Date().toISOString()
    });

    // Seed default audit logs
    initialData.auditLogs.push(
      {
        id: crypto.randomUUID(),
        userId: 'system',
        username: 'SYSTEM',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'SYSTEM_BOOT',
        details: 'Secure Offline Authentication Module initialised successfully. SQLite structure loaded.',
        severity: 'INFO'
      },
      {
        id: crypto.randomUUID(),
        userId: adminId,
        username: 'admin',
        timestamp: new Date().toISOString(),
        action: 'USER_REGISTERED',
        details: 'Administrator pre-seeded in internal SQLite ledger.',
        severity: 'INFO'
      }
    );

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

// Read database
export function readDb(): DatabaseSchema {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file, returning empty schema:', err);
    return {
      users: [],
      biometrics: [],
      loginHistory: [],
      auditLogs: [],
      securityEvents: [],
      userSettings: [],
      notes: [],
      passwords: [],
      files: []
    };
  }
}

// Write database
export function writeDb(data: DatabaseSchema): void {
  initDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// Helper to log audit events
export function logAuditEvent(userId: string, username: string, action: string, details: string, severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO') {
  const db = readDb();
  const newLog: AuditLog = {
    id: crypto.randomUUID(),
    userId,
    username,
    timestamp: new Date().toISOString(),
    action,
    details,
    severity
  };
  db.auditLogs.unshift(newLog);
  writeDb(db);
  console.log(`[AUDIT LOG - ${severity}] ${action}: ${details}`);
}

// Helper to log security alert events
export function logSecurityEvent(eventType: 'BRUTE_FORCE' | 'TAMPER_DETECTED' | 'BIOMETRIC_RETRY_EXCEEDED' | 'UNAUTHORIZED_ACCESS', description: string, userId?: string) {
  const db = readDb();
  const newEvent: SecurityEvent = {
    id: crypto.randomUUID(),
    userId,
    timestamp: new Date().toISOString(),
    eventType,
    description,
    severity: 'CRITICAL'
  };
  db.securityEvents.unshift(newEvent);
  
  // Also push to general audit logs for unified view
  const username = userId ? (db.users.find(u => u.id === userId)?.username || 'UNKNOWN') : 'SYSTEM';
  logAuditEvent(userId || 'system', username, `SECURITY_ALERT_${eventType}`, description, 'CRITICAL');
  
  db.securityEvents = db.securityEvents.slice(0, 100); // keep last 100
  writeDb(db);
}
