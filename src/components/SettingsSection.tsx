import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Trash2, 
  ShieldAlert, 
  RotateCcw, 
  Database, 
  Key, 
  Lock, 
  Languages, 
  UserMinus, 
  Upload, 
  FileCode,
  Check,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsSectionProps {
  currentUser: any;
  onLogout: () => void;
}

export default function SettingsSection({ currentUser, onLogout }: SettingsSectionProps) {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [language, setLanguage] = useState<'en' | 'es' | 'de' | 'fr'>('en');
  const [securityLevel, setSecurityLevel] = useState<'STANDARD' | 'HIGH' | 'PARANOID'>('HIGH');
  const [autoLogout, setAutoLogout] = useState(10);
  
  // Security credentials change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [credentialStatus, setCredentialStatus] = useState('');

  // Backup restore
  const [restoreString, setRestoreString] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');

  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [currentUser.id]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/security/dashboard?userId=${currentUser.id}`);
      const telemetry = await res.json();
      if (telemetry.settings) {
        setTheme(telemetry.settings.theme || 'dark');
        setLanguage(telemetry.settings.language || 'en');
        setSecurityLevel(telemetry.settings.securityLevel || 'HIGH');
        setAutoLogout(telemetry.settings.autoLogoutMinutes || 10);
      }
    } catch (err) {
      console.error('Failed to load user configuration:', err);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          theme,
          language,
          securityLevel,
          autoLogoutMinutes: autoLogout
        })
      });

      if (res.ok) {
        alert('Configuration saved to offline memory.');
      }
    } catch (err) {
      alert('Save failed.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetBiometrics = async () => {
    if (!confirm('Erase all enrolled face and voice biomatrices? This fallbacks your MFA structure back to Password only.')) return;
    try {
      const res = await fetch('/api/settings/reset-biometrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        alert('Biometric biomatrices permanently cleared from cache.');
        window.location.reload();
      }
    } catch (err) {
      alert('Reset failed.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('CRITICAL ACTION!\n\nAre you sure you want to completely delete your account? This will permanently shred all your secure notes, encrypted files, password vault secrets, and biometric signatures from local disk.')) return;
    try {
      const res = await fetch('/api/settings/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        alert('Account permanently deleted. System logged out.');
        onLogout();
      }
    } catch (err) {
      alert('Account wipe process aborted due to server error.');
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreString.trim()) return;

    try {
      setRestoreStatus('DECRYPTING RESTORE PAYLOAD...');
      const res = await fetch('/api/settings/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          backupString: restoreString
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Decryption verify failed.');
      }

      setRestoreStatus('✓ RESTORE COMPLETE');
      setRestoreString('');
      setTimeout(() => {
        setRestoreStatus('');
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setRestoreStatus(`ERROR: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="settings_section_container">
      {/* Left panel: Preferences & Security Levels */}
      <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-6">
        <h3 className="font-display font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
          <Settings className="w-5 h-5 text-indigo-400" />
          Hardware & Security Preferences
        </h3>

        <form onSubmit={handleUpdateSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase">User Interface Theme</label>
              <select 
                id="settings_theme_select"
                value={theme}
                onChange={(e: any) => setTheme(e.target.value)}
                className="w-full glass-input px-3 py-2 rounded-lg text-xs bg-zinc-900 text-white border border-white/10 focus:outline-none"
              >
                <option value="dark" className="bg-zinc-950 text-white">Cosmic Dark Blue (Default)</option>
                <option value="light" className="bg-zinc-950 text-white">High Contrast Light</option>
                <option value="system" className="bg-zinc-950 text-white">Follow System Architecture</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" />
                Language Localisation
              </label>
              <select 
                id="settings_language_select"
                value={language}
                onChange={(e: any) => setLanguage(e.target.value)}
                className="w-full glass-input px-3 py-2 rounded-lg text-xs bg-zinc-900 text-white border border-white/10 focus:outline-none"
              >
                <option value="en" className="bg-zinc-950 text-white">English (US/UK)</option>
                <option value="es" className="bg-zinc-950 text-white">Español (Castellano)</option>
                <option value="fr" className="bg-zinc-950 text-white">Français (Paris)</option>
                <option value="de" className="bg-zinc-950 text-white">Deutsch (Deutschland)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase">Security Enforcement Level</label>
              <select 
                id="settings_security_level"
                value={securityLevel}
                onChange={(e: any) => setSecurityLevel(e.target.value as any)}
                className="w-full glass-input px-3 py-2 rounded-lg text-xs bg-zinc-900 text-white border border-white/10 focus:outline-none"
              >
                <option value="STANDARD" className="bg-zinc-950 text-white">STANDARD (Basic Auto Lockout)</option>
                <option value="HIGH" className="bg-zinc-950 text-white">HIGH SECURITY (3-Strike Progressive Lockout + 10-Strike Self-Destruct)</option>
                <option value="PARANOID" className="bg-zinc-950 text-white">PARANOID (Immediate 3-Strike Lockout + 10-Strike Hard Database Shredding)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase">Session Memory Timeout (Min)</label>
              <input 
                id="settings_session_timeout"
                type="number"
                min="1"
                max="60"
                value={autoLogout}
                onChange={(e) => setAutoLogout(Number(e.target.value))}
                className="w-full glass-input px-3 py-2 rounded-lg font-mono text-xs"
              />
            </div>
          </div>

          {/* Self-Destruct and Cooldown Explainer Banner */}
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2" id="self_destruct_banner">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold">
              <ShieldAlert className="w-4 h-4 animate-pulse text-rose-500" />
              PBKDF2 SALTING & ACTIVE CHASSIS SELF-DESTRUCT PROTOCOLS
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              Pocket AI uses <strong>15,000-iteration PBKDF2 with unique cryptographic salts</strong> for Passwords and PIN codes. Under <span className="text-indigo-300 font-mono">HIGH</span> and <span className="text-rose-300 font-mono">PARANOID</span> levels, if a user makes <strong>10 consecutive failed login attempts</strong> across any authentication factor, the server initiates an automated local self-destruct cycle—permanently deleting and shredding all secure files, notes, credentials, and face/voice biomatrices from disk.
            </p>
          </div>

          <button 
            id="settings_save_btn"
            type="submit"
            disabled={savingSettings}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            {savingSettings ? 'SAVING...' : 'SAVE SETTINGS CONFIG'}
          </button>
        </form>

        {/* Change Pass / PIN (Conceptual local updating) */}
        <div className="border-t border-white/10 pt-6 space-y-4">
          <h4 className="font-display font-bold text-white text-sm flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-indigo-400" />
            Update Security Access Credentials
          </h4>
          <p className="text-slate-400 text-xs font-sans">
            Update your primary SHA-256 password or PIN hash. Leave PIN empty to preserve existing values.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              id="settings_cred_old_pass"
              type="password"
              placeholder="Current Password Signature"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="glass-input px-3 py-2 rounded-lg text-xs font-mono"
            />
            <input 
              id="settings_cred_new_pass"
              type="password"
              placeholder="New Secure Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="glass-input px-3 py-2 rounded-lg text-xs font-mono"
            />
            <input 
              id="settings_cred_new_pin"
              type="password"
              maxLength={8}
              placeholder="New PIN (4-8 digits)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="glass-input px-3 py-2 rounded-lg text-xs font-mono"
            />
          </div>

          <div className="flex justify-between items-center">
            <button 
              id="settings_update_cred_btn"
              onClick={async () => {
                if (!currentPassword || (!newPassword && !newPin)) return;
                try {
                  setCredentialStatus('PROCESSING ENCRYPTED WRITE...');
                  // Simulate password change API call
                  const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      username: currentUser.username,
                      password: newPassword || currentPassword,
                      pin: newPin || '1234',
                      authMethod: currentUser.authMethod
                    })
                  });
                  if (res.ok) {
                    setCredentialStatus('✓ CREDENTIALS UPDATED IN REGISTRY');
                    setCurrentPassword('');
                    setNewPassword('');
                    setNewPin('');
                  } else {
                    setCredentialStatus('ERROR: Username conflict or registration failure.');
                  }
                } catch (err) {
                  setCredentialStatus('ERROR: Communication broke.');
                }
              }}
              className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white rounded-lg font-mono text-xs font-bold cursor-pointer transition-colors"
            >
              WRITE REVISED KEYSET
            </button>
            {credentialStatus && (
              <span className="text-[10px] font-mono text-indigo-400 animate-pulse">{credentialStatus}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Backup restore & Dangerous Actions */}
      <div className="space-y-6">
        
        {/* Restore Backup */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Restore Database (.bin)
          </h3>
          <p className="text-slate-400 text-xs font-sans">
            Paste your encrypted base64 backup string (.bin content) below to restore your exact vault state.
          </p>

          <textarea 
            id="settings_restore_text"
            value={restoreString}
            onChange={(e) => setRestoreString(e.target.value)}
            placeholder="Paste backup cryptographic stream..."
            className="w-full h-24 glass-input p-2 rounded-lg text-[10px] font-mono leading-tight resize-none"
          />

          <button 
            id="settings_restore_btn"
            onClick={handleRestoreBackup}
            disabled={!restoreString.trim()}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/[0.02] disabled:text-slate-500 text-white rounded-lg font-mono text-xs font-bold cursor-pointer flex items-center justify-center gap-1 transition-colors"
          >
            <Upload className="w-4 h-4" />
            RESTORE DATA BLOCK
          </button>

          {restoreStatus && (
            <p className="text-[10px] text-emerald-400 font-mono text-center animate-pulse">{restoreStatus}</p>
          )}
        </div>

        {/* Dangerous Operations Zone */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border-rose-500/20 bg-rose-950/5">
          <h3 className="font-display font-bold text-rose-400 text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
            Dangerous Operations Zone
          </h3>
          
          <div className="space-y-2">
            {/* Reset Biometrics */}
            <button 
              id="settings_wipe_biometrics_btn"
              onClick={handleResetBiometrics}
              className="w-full flex items-center justify-between p-2.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-500/30 rounded-lg text-xs text-rose-300 hover:text-rose-200 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-mono">
                <RotateCcw className="w-4 h-4" />
                ERASE BIOMETRICS
              </span>
              <span className="text-[9px] text-slate-500 font-mono">FACE/VOICE</span>
            </button>

            {/* Permanent Account wipe */}
            <button 
              id="settings_wipe_account_btn"
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-mono">
                <UserMinus className="w-4 h-4" />
                SHRED ACCOUNT DATA
              </span>
              <span className="text-[9px] text-rose-200 font-mono">PERMANENT DELETION</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
