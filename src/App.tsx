import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Key, 
  Cpu, 
  LogOut, 
  Menu, 
  X, 
  HelpCircle, 
  Terminal, 
  Eye, 
  Activity, 
  FolderLock,
  Compass,
  LayoutDashboard,
  BrainCircuit,
  Settings as SettingsIcon,
  ShieldAlert,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthMethod } from './types';

// Importing modular panels
import DashboardOverview from './components/DashboardOverview';
import AIAssistantSection from './components/AIAssistantSection';
import FileVaultSection from './components/FileVaultSection';
import PasswordManagerSection from './components/PasswordManagerSection';
import NotesSection from './components/NotesSection';
import SettingsSection from './components/SettingsSection';
import AdminPanel from './components/AdminPanel';
import BiometricCapture from './components/BiometricCapture';
import VoiceVerify from './components/VoiceVerify';
import ShareAppSection from './components/ShareAppSection';

export default function App() {
  // Navigation & Authentication states
  const [session, setSession] = useState<any>(null); // current logged in user metadata
  const [currentPage, setCurrentPage] = useState<string>('landing'); // landing, login, register, dashboard, notes, vault, passwords, settings, admin, help
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-logout timer tracking
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(10);

  // Registration state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regAuthMethod, setRegAuthMethod] = useState<AuthMethod>('Password');
  const [regFaceTemplate, setRegFaceTemplate] = useState<any>(null);
  const [regVoiceTemplate, setRegVoiceTemplate] = useState<any>(null);
  const [showBiometricSetup, setShowBiometricSetup] = useState<'none' | 'face' | 'voice'>('none');
  const [regStatus, setRegStatus] = useState('');

  // Login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginStep, setLoginStep] = useState<number>(1); // 1: username + primary credentials, 2: Face verification, 3: Voice verification
  const [loginAuthMethod, setLoginAuthMethod] = useState<AuthMethod>('Password');
  const [loginStatus, setLoginStatus] = useState('');
  const [loginLockoutMsg, setLoginLockoutMsg] = useState('');

  // Auto-logout effect
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const minutesElapsed = (Date.now() - lastActivity) / 1000 / 60;
      if (minutesElapsed >= sessionTimeoutMinutes) {
        handleLogout('Automatic security session timeout achieved.');
      }
    }, 10000);

    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [session, lastActivity, sessionTimeoutMinutes]);

  const handleLogout = (reason?: string) => {
    setSession(null);
    setCurrentPage('landing');
    setLoginUsername('');
    setLoginPassword('');
    setLoginPin('');
    setLoginStep(1);
    setLoginStatus('');
    if (reason) alert(reason);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regPassword) return;

    // Enforce biometric captures if chosen in combination
    if (regAuthMethod.includes('Face') && !regFaceTemplate) {
      setShowBiometricSetup('face');
      return;
    }
    if (regAuthMethod.includes('Voice') && !regVoiceTemplate) {
      setShowBiometricSetup('voice');
      return;
    }

    try {
      setRegStatus('COMMITTING USER SCHEMAS...');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          pin: regPin,
          authMethod: regAuthMethod,
          faceTemplate: regFaceTemplate,
          voiceTemplate: regVoiceTemplate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setRegStatus('✓ REGISTRATION SUCCESSFUL');
      setTimeout(() => {
        setRegStatus('');
        // Clean fields
        setRegUsername('');
        setRegPassword('');
        setRegPin('');
        setRegAuthMethod('Password');
        setRegFaceTemplate(null);
        setRegVoiceTemplate(null);
        setCurrentPage('login');
      }, 1500);

    } catch (err: any) {
      setRegStatus(`ERROR: ${err.message}`);
    }
  };

  // Determine needed login checkpoint factors and verify username
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername) return;

    try {
      setLoginStatus('VERIFYING ACCOUNT PROFILE...');
      setLoginLockoutMsg('');
      
      // Try hitting login endpoint with first credentials (password/PIN or just username check)
      const payload: any = { username: loginUsername, authMethodUsed: 'Password' };
      
      // If auth method is PIN only
      if (loginAuthMethod === 'PIN') {
        payload.pin = loginPin;
        payload.authMethodUsed = 'PIN';
      } else {
        payload.password = loginPassword;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.status === 423) {
        setLoginLockoutMsg(data.error || 'Factor temporarily locked. Brute force defense triggered.');
        setLoginStatus('');
        return;
      }

      if (res.status === 410) {
        setLoginLockoutMsg(data.error || 'CRITICAL SECURITY BREACH: SELF-DESTRUCT INITIATED.');
        setLoginStatus('');
        return;
      }

      if (!res.ok) {
        // If login failed but it says we need a different factor or we failed passwords
        throw new Error(data.error || 'Access denied');
      }

      // Check user registration factor sequence
      const userAuthMethod: AuthMethod = data.user.authMethod;
      setLoginAuthMethod(userAuthMethod);

      if (userAuthMethod.includes('Face')) {
        setLoginStep(2); // advance to face verify
        setLoginStatus('CHECKPOINT 1/2 VERIFIED. PROMPT BIOMETRIC FACE RECOGNITION...');
      } else if (userAuthMethod.includes('Voice')) {
        setLoginStep(3); // advance to voice verify
        setLoginStatus('CHECKPOINT 1/2 VERIFIED. PROMPT SPEAKER VOICEPRINT RECOGNITION...');
      } else {
        // Simple password/PIN succeeded and no biometrics required
        executeSessionStartup(data);
      }

    } catch (err: any) {
      setLoginStatus(`ERROR: ${err.message}`);
    }
  };

  const handleBiometricLoginSuccess = async (biometricPayload: any, type: 'face' | 'voice') => {
    try {
      setLoginStatus(`VERIFYING ${type.toUpperCase()} EMBEDDINGS IN SQLite LEDGER...`);
      const payload: any = { 
        username: loginUsername, 
        authMethodUsed: type === 'face' ? 'Face' : 'Voice'
      };

      if (type === 'face') {
        payload.faceImage = biometricPayload;
      } else {
        payload.voiceSignal = biometricPayload;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.status === 423) {
        setLoginLockoutMsg(data.error || 'Factor temporarily locked. Brute force defense active.');
        setLoginStatus('');
        return;
      }

      if (res.status === 410) {
        setLoginLockoutMsg(data.error || 'CRITICAL BREACH: SELF-DESTRUCT PROTOCOL TRIGGERED.');
        setLoginStatus('');
        return;
      }

      if (!res.ok) throw new Error(data.error || `${type.toUpperCase()} mismatch.`);

      // Succeeded factor. Check if there is a next factor
      if (type === 'face' && loginAuthMethod.includes('Voice')) {
        setLoginStep(3); // move to voice after face
        setLoginStatus('✓ FACE BIOMETRIC VERIFIED. INITIATING LEVEL 2 SPEAKER PITCH CHECK...');
      } else {
        // Complete MFA authentication successful!
        executeSessionStartup(data);
      }

    } catch (err: any) {
      setLoginStatus(`BIOMETRIC DENIED: ${err.message}`);
    }
  };

  const executeSessionStartup = (data: any) => {
    setSession(data.user);
    if (data.settings) {
      setSessionTimeoutMinutes(data.settings.autoLogoutMinutes || 10);
    }
    setCurrentPage('dashboard');
    setLoginStatus('');
  };

  const renderActiveSection = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview currentUser={session} onNavigate={setCurrentPage} />;
      case 'ai':
        return <AIAssistantSection currentUser={session} />;
      case 'vault':
        return <FileVaultSection currentUser={session} />;
      case 'passwords':
        return <PasswordManagerSection currentUser={session} />;
      case 'notes':
        return <NotesSection currentUser={session} />;
      case 'settings':
        return <SettingsSection currentUser={session} onLogout={handleLogout} />;
      case 'share':
        return <ShareAppSection currentUser={session} />;
      case 'admin':
        return <AdminPanel currentUser={session} />;
      case 'help':
        return (
          <div className="glass-panel p-6 rounded-2xl space-y-6 max-w-4xl mx-auto text-left leading-relaxed">
            <h2 className="text-2xl font-display font-extrabold text-indigo-400 border-b border-slate-800 pb-3">
              College Capstone Presentation Guide & Specs
            </h2>
            
            <div className="space-y-4 text-xs font-sans text-gray-300">
              <p>
                <strong>Pocket AI – Secure Offline Login System</strong> is designed as a standalone biometric sandbox demonstration. It is built to satisfy security requirements for advanced engineering defenses.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                <h4 className="text-white font-bold uppercase text-[10px] text-indigo-300">✓ Talking Defense Points</h4>
                <ul className="list-disc pl-4 space-y-1 text-gray-400">
                  <li><strong>Zero Leak Offline Vectoring:</strong> Facial geometric distances (eye coordinates, nose vertical thresholds) are processed client-side inside canvas rendering and compared via Euclidean matrix distances in memory, simulating native OpenCV pipelines perfectly.</li>
                  <li><strong>Liveness Anti-Spoofing:</strong> Staged verification requires active eye blinks (delta variations) and 3D head rotation checks, preventing simple printed-photo spoofing.</li>
                  <li><strong>AES-256 Key Derivation:</strong> All file uploads and password records are encrypted using static cryptography bindings which decrypt completely in safe RAM buffers rather than long-term disk caches.</li>
                  <li><strong>MFA Dynamic Verification Checkpoints:</strong> Login paths query database user capabilities dynamically and construct sequential factor gates (Password → Face Scan → Spectrogram matching).</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-[10px] bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <h5 className="text-white font-bold">SHA-256 Pass Hash</h5>
                  <p className="text-gray-500">One-way secure hashing of user strings combined with system keys on database writes.</p>
                </div>
                <div>
                  <h5 className="text-white font-bold">SQL Relational Log</h5>
                  <p className="text-gray-500">Every register, authentication success, intrusion failure, or settings change is logged in SQLite tables.</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <DashboardOverview currentUser={session} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-300 font-sans relative overflow-hidden flex flex-col">
      {/* Background radial glowing gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px] -z-10"></div>

      {/* 1. LANDING PAGE STATE */}
      {currentPage === 'landing' && !session && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto relative min-h-screen">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* Branding badge */}
            <div className="flex justify-center">
              <span className="px-3 py-1 bg-blue-500/10 border border-white/10 text-blue-400 rounded-full text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                v1.1 COLLEGE DEMONSTRATION READY
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-none text-white uppercase glow-text-blue">
                POCKET AI
              </h1>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-400">
                Offline AI Authentication Platform
              </h2>
              <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto font-sans leading-relaxed">
                A high-security, local-only multi-factor authentication terminal. Featuring dynamic face recognition, voiceprint spectroscopy, hashed password/PIN validation, encrypted file vault, OCR, and quantized Phi-3 AI assistant with zero network requirements.
              </p>
            </div>

            {/* Grid display of authentication methods */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 text-center space-y-1.5">
                <Eye className="w-5 h-5 text-blue-400 mx-auto" />
                <h4 className="font-display font-bold text-xs text-white">FACE MATRIX</h4>
                <p className="text-[10px] text-slate-500 font-mono">Blink & Liveness Verification</p>
              </div>
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 text-center space-y-1.5">
                <Terminal className="w-5 h-5 text-cyan-400 mx-auto" />
                <h4 className="font-display font-bold text-xs text-white">SPECTOR VOICE</h4>
                <p className="text-[10px] text-slate-500 font-mono">Pitch Spectral Analysis</p>
              </div>
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 text-center space-y-1.5">
                <Key className="w-5 h-5 text-indigo-400 mx-auto" />
                <h4 className="font-display font-bold text-xs text-white">SHA-256 PASS</h4>
                <p className="text-[10px] text-slate-500 font-mono">Salted One-Way Hashing</p>
              </div>
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 text-center space-y-1.5">
                <Lock className="w-5 h-5 text-purple-400 mx-auto" />
                <h4 className="font-display font-bold text-xs text-white">SECURE PIN</h4>
                <p className="text-[10px] text-slate-500 font-mono">4-8 Digit Lock Protection</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                id="landing_enter_btn"
                onClick={() => setCurrentPage('login')}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/20 w-full sm:w-auto"
              >
                ENTER SECURE TERMINAL
              </button>
              <button 
                id="landing_register_btn"
                onClick={() => setCurrentPage('register')}
                className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer w-full sm:w-auto"
              >
                REGISTER NEW ACCOUNT
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. REGISTRATION PAGE */}
      {currentPage === 'register' && !session && (
        <div className="flex-1 flex items-center justify-center p-6 min-h-screen">
          <AnimatePresence mode="wait">
            {showBiometricSetup === 'none' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-6 rounded-2xl w-full max-w-md space-y-5"
                id="register_form_card"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-display font-extrabold text-white">Create Security Profile</h2>
                  <p className="text-gray-400 text-xs font-mono">ENROLL MULTI-FACTOR SPECIFICATIONS</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-mono uppercase">System Username</label>
                    <input 
                      id="reg_username"
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. cse_officer"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-mono uppercase">Primary Password</label>
                    <input 
                      id="reg_password"
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-mono uppercase">Security PIN</label>
                      <input 
                        id="reg_pin"
                        type="password"
                        maxLength={8}
                        placeholder="e.g. 1234"
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value)}
                        className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-mono uppercase">Auth Matrix Mode</label>
                      <select 
                        id="reg_auth_method"
                        value={regAuthMethod}
                        onChange={(e: any) => setRegAuthMethod(e.target.value)}
                        className="w-full glass-input px-2 py-2.5 rounded-xl text-xs bg-black font-sans"
                      >
                        <option value="Password">Password Only</option>
                        <option value="PIN">PIN Only</option>
                        <option value="Face">Face Only</option>
                        <option value="Voice">Voice Only</option>
                        <option value="Face_Password">Face + Password</option>
                        <option value="Face_Voice">Face + Voice</option>
                        <option value="Voice_Password">Voice + Password</option>
                        <option value="Face_Voice_PIN">Face + Voice + PIN</option>
                      </select>
                    </div>
                  </div>

                  {/* Enrollment checklist */}
                  {regAuthMethod !== 'Password' && regAuthMethod !== 'PIN' && (
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-[10px] space-y-1.5 text-left">
                      <p className="text-gray-400 uppercase font-bold tracking-wider">Required Enrolments:</p>
                      {regAuthMethod.includes('Face') && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Face Vector Template</span>
                          <span className={regFaceTemplate ? 'text-emerald-400 font-bold' : 'text-amber-500 animate-pulse font-bold'}>
                            {regFaceTemplate ? '✓ READY' : '✗ PENDING ENROLMENT'}
                          </span>
                        </div>
                      )}
                      {regAuthMethod.includes('Voice') && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Voice Speaker Profile</span>
                          <span className={regVoiceTemplate ? 'text-emerald-400 font-bold' : 'text-amber-500 animate-pulse font-bold'}>
                            {regVoiceTemplate ? '✓ READY' : '✗ PENDING ENROLMENT'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {regStatus && (
                    <p className="text-[10px] font-mono text-center text-blue-400 animate-pulse">{regStatus}</p>
                  )}

                  <div className="space-y-2">
                    <button 
                      id="reg_submit_btn"
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                      {regAuthMethod.includes('Face') && !regFaceTemplate ? 'PROMPT BIOMETRIC CAMERA' : 
                       regAuthMethod.includes('Voice') && !regVoiceTemplate ? 'PROMPT MICROPHONE MATRIX' : 
                       'COMMIT SECURE REGISTER'}
                    </button>
                    
                    <button 
                      id="reg_back_btn"
                      type="button"
                      onClick={() => setCurrentPage('landing')}
                      className="w-full text-center text-xs font-mono text-gray-500 hover:text-white transition-all cursor-pointer"
                    >
                      Back to Landing Page
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : showBiometricSetup === 'face' ? (
              <BiometricCapture 
                mode="register"
                onCaptureComplete={(template) => {
                  setRegFaceTemplate(template);
                  setShowBiometricSetup('none');
                }}
                onCancel={() => setShowBiometricSetup('none')}
              />
            ) : (
              <VoiceVerify 
                mode="register"
                onCaptureComplete={(template) => {
                  setRegVoiceTemplate(template);
                  setShowBiometricSetup('none');
                }}
                onCancel={() => setShowBiometricSetup('none')}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. LOGIN PAGE FLOW */}
      {currentPage === 'login' && !session && (
        <div className="flex-1 flex items-center justify-center p-6 min-h-screen">
          <AnimatePresence mode="wait">
            {loginStep === 1 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-6 rounded-2xl w-full max-w-md space-y-5"
                id="login_form_card"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-display font-extrabold text-white">Secure Authentication</h2>
                  <p className="text-gray-400 text-xs font-mono">LEDGER CHECKPOINT ENTRY</p>
                </div>

                {loginLockoutMsg && (
                  <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-xl text-center text-xs font-mono flex items-center gap-2 justify-center">
                    <ShieldAlert className="w-4 h-4 text-rose-500 animate-bounce" />
                    <span>{loginLockoutMsg}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-mono uppercase">System Username</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                      <input 
                        id="login_username"
                        type="text"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="e.g. admin"
                        className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {loginAuthMethod === 'PIN' ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-mono uppercase">Security PIN</label>
                      <div className="relative">
                        <Key className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                        <input 
                          id="login_pin"
                          type="password"
                          required
                          maxLength={8}
                          value={loginPin}
                          onChange={(e) => setLoginPin(e.target.value)}
                          placeholder="••••"
                          className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-mono uppercase">Primary Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                        <input 
                          id="login_password"
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Factor toggler for demo convenience */}
                  <div className="text-right">
                    <button 
                      id="login_factor_toggle_btn"
                      type="button"
                      onClick={() => setLoginAuthMethod(prev => prev === 'Password' ? 'PIN' : 'Password')}
                      className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      Use {loginAuthMethod === 'Password' ? 'PIN Factor' : 'Password Factor'} Fallback
                    </button>
                  </div>

                  {loginStatus && (
                    <p className="text-[10px] font-mono text-center text-blue-400 animate-pulse">{loginStatus}</p>
                  )}

                  <div className="space-y-2">
                    <button 
                      id="login_submit_btn"
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                      VERIFY FIRST factor
                    </button>
                    
                    <button 
                      id="login_back_btn"
                      type="button"
                      onClick={() => setCurrentPage('landing')}
                      className="w-full text-center text-xs font-mono text-gray-500 hover:text-white transition-all cursor-pointer"
                    >
                      Back to Landing Page
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : loginStep === 2 ? (
              <BiometricCapture 
                mode="login"
                onCaptureComplete={(template) => handleBiometricLoginSuccess(template, 'face')}
                onCancel={() => setLoginStep(1)}
              />
            ) : (
              <VoiceVerify 
                mode="login"
                onCaptureComplete={(template) => handleBiometricLoginSuccess(template, 'voice')}
                onCancel={() => setLoginStep(1)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 4. MAIN SECURE APPLICATION SCREEN LAYOUT */}
      {session && (
        <div className="flex-1 flex overflow-hidden h-screen text-xs">
          
          {/* Left Sidebar navigation */}
          <div className={`bg-black/40 border-r border-white/10 h-full flex flex-col justify-between transition-all duration-300 z-40 ${
            isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden md:w-16'
          }`}>
            <div className="flex flex-col">
              {/* Branding header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="font-display font-black text-sm tracking-widest text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400 animate-pulse" />
                  POCKET AI
                </span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-slate-500 hover:text-white md:hidden cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Menu Links */}
              <div className="p-3 space-y-1">
                {[
                  { id: 'dashboard', label: 'System Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
                  { id: 'ai', label: 'Local AI Assistant', icon: <BrainCircuit className="w-4 h-4" /> },
                  { id: 'vault', label: 'File Vault & OCR', icon: <FolderLock className="w-4 h-4" /> },
                  { id: 'passwords', label: 'Password Manager', icon: <Key className="w-4 h-4" /> },
                  { id: 'notes', label: 'Markdown Scratchpad', icon: <Terminal className="w-4 h-4" /> },
                  { id: 'settings', label: 'Settings & Security', icon: <SettingsIcon className="w-4 h-4" /> },
                  { id: 'share', label: 'Share & Go Official', icon: <Share2 className="w-4 h-4" /> }
                ].map((item) => (
                  <button 
                    key={item.id}
                    id={`sidebar_nav_${item.id}`}
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-3 ${
                      currentPage === item.id 
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span className={`${!isSidebarOpen && 'md:hidden'}`}>{item.label}</span>
                  </button>
                ))}

                {session.role === 'Administrator' && (
                  <button 
                    id="sidebar_nav_admin"
                    onClick={() => setCurrentPage('admin')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-3 ${
                      currentPage === 'admin' 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : 'text-slate-400 hover:text-rose-400 hover:bg-white/5'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span className={`${!isSidebarOpen && 'md:hidden'}`}>Root Admin Panel</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom logout section */}
            <div className="p-3 border-t border-white/10 space-y-2">
              <div className="px-3.5 py-2 bg-black/40 rounded-xl border border-white/5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-white/10 flex items-center justify-center font-mono font-bold text-blue-400">
                  {session.username[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="font-bold text-white text-xs truncate">{session.username}</p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">{session.role}</p>
                </div>
              </div>

              <button 
                id="sidebar_nav_help"
                onClick={() => setCurrentPage('help')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-mono text-[11px] text-slate-500 hover:text-slate-300 transition-all cursor-pointer flex items-center gap-3"
              >
                <HelpCircle className="w-4 h-4" />
                <span className={`${!isSidebarOpen && 'md:hidden'}`}>Capstone Docs</span>
              </button>

              <button 
                id="sidebar_logout_btn"
                onClick={() => handleLogout()}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-white/5 transition-all cursor-pointer flex items-center gap-3"
              >
                <LogOut className="w-4 h-4" />
                <span className={`${!isSidebarOpen && 'md:hidden'}`}>LOCK SYSTEM</span>
              </button>
            </div>
          </div>

          {/* Right main viewing container */}
          <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            {/* Top toggle bar */}
            <div className="h-16 border-b border-white/10 flex justify-between items-center px-4 bg-black/40 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-1.5 hover:bg-white/5 rounded border border-white/10 text-slate-400 hover:text-white cursor-pointer"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <span className="text-gray-500 font-mono">/</span>
                <span className="font-mono text-xs text-gray-300 uppercase font-bold tracking-wider">{currentPage}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  SQLite CACHE ACTIVE
                </span>
                <span className="text-gray-500 font-mono text-[10px]">TIME: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Content view workspace */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderActiveSection()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
