import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  CheckCircle2, 
  Chrome, 
  ExternalLink, 
  MessageSquare, 
  Send, 
  Mail, 
  Info,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';

interface ShareAppSectionProps {
  currentUser: any;
}

export default function ShareAppSection({ currentUser }: ShareAppSectionProps) {
  const [appUrl, setAppUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'ios' | 'android'>('ios');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // Get the exact deployment URL (fallback if window is undefined)
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    // Strip query parameters to keep shared URL clean
    const cleanUrl = currentUrl.split('?')[0];
    setAppUrl(cleanUrl);

    // Check if app is running in standalone PWA mode
    if (typeof window !== 'undefined') {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true;
      setIsStandalone(isPWA);
    }

    // Generate dynamic QR code URL
    const qrEncoded = encodeURIComponent(cleanUrl || 'https://pocket-ai-vault.app');
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=ffffff&bgcolor=09090b&data=${qrEncoded}`);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pocket AI - Secure Personal Vault',
          text: '🔒 Check out Pocket AI! A highly secure personal vault featuring local Face ID, Voice Spectrogram, Hashed Password / PIN, secure storage with OCR, and an offline AI Assistant. 🤖',
          url: appUrl,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const getShareLink = (platform: 'whatsapp' | 'telegram' | 'twitter' | 'email') => {
    const text = `Check out Pocket AI! A highly secure personal vault featuring local Face ID, Voice Spectrogram, Hashed Password / PIN, secure storage with OCR, and an offline AI Assistant. 🔒🤖`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(appUrl);

    switch (platform) {
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
      case 'telegram':
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      case 'email':
        return `mailto:?subject=Secure Your Data with Pocket AI&body=${encodedText}%20${encodedUrl}`;
      default:
        return '#';
    }
  };

  return (
    <div className="space-y-6" id="share_app_section">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border-indigo-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-600/5 rounded-full blur-2xl -z-10"></div>
        
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-1.5 w-max">
              <Sparkles className="w-3.5 h-3.5" />
              Progressive Web App Module
            </span>
            <h2 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight">
              Share & Go Official
            </h2>
            <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
              Pocket AI runs completely client-side. Convert this link into a fully installable home screen application, complete with a clean launch icon, zero browser margins, and rapid instant execution.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            {isStandalone ? (
              <div className="px-4 py-2.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left font-mono">
                  <p className="text-emerald-400 text-[11px] font-bold">RUNNING AS OFFICIAL APP</p>
                  <p className="text-[9px] text-emerald-600 uppercase">Standalone sandbox active</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleNativeShare}
                className="w-full md:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Share2 className="w-4 h-4" />
                TRIGGER APP SHARE SHEET
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 2. SHARE PANEL & LINKS (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Link Copier & Sharing Buttons */}
          <div className="glass-panel p-5 rounded-2xl space-y-5">
            <h3 className="font-display font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
              <Share2 className="w-4 h-4 text-blue-400" />
              Instant Share Terminals
            </h3>

            {/* Clean input copy URL field */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Official App Link URL</label>
              <div className="flex bg-black/40 border border-white/10 rounded-xl p-1.5 focus-within:border-indigo-500/30 transition-all">
                <input 
                  type="text" 
                  readOnly 
                  value={appUrl} 
                  className="bg-transparent text-slate-300 px-3.5 py-1.5 flex-1 font-mono text-xs overflow-x-auto select-all outline-none"
                />
                <button 
                  onClick={handleCopyLink}
                  className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      COPIED
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      COPY LINK
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Official Sharing Channels */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">One-Click Messaging Integrations</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* WHATSAPP */}
                <a 
                  href={getShareLink('whatsapp')}
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 hover:border-[#25D366]/45 text-[#25D366] rounded-xl font-semibold transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                    <span className="text-xs text-white">Share via WhatsApp</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#25D366]/60 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* TELEGRAM */}
                <a 
                  href={getShareLink('telegram')}
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 hover:border-[#0088cc]/45 text-[#0088cc] rounded-xl font-semibold transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Send className="w-4 h-4 text-[#0088cc]" />
                    <span className="text-xs text-white">Share via Telegram</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#0088cc]/60 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* TWITTER / X */}
                <a 
                  href={getShareLink('twitter')}
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/45 text-sky-400 rounded-xl font-semibold transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="w-4 h-4 text-sky-400" />
                    <span className="text-xs text-white">Share on Twitter / X</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sky-400/60 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* EMAIL */}
                <a 
                  href={getShareLink('email')}
                  className="flex items-center justify-between p-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/45 text-rose-400 rounded-xl font-semibold transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-rose-400" />
                    <span className="text-xs text-white">Share via Email</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400/60 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* 3. PWA INSTALLATION USER GUIDE */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Install App on Home Screen
              </h3>
              
              <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
                <button 
                  onClick={() => setActivePlatformTab('ios')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    activePlatformTab === 'ios' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Apple iOS
                </button>
                <button 
                  onClick={() => setActivePlatformTab('android')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    activePlatformTab === 'android' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Android OS
                </button>
              </div>
            </div>

            {activePlatformTab === 'ios' ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-start gap-3">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-indigo-300 leading-relaxed font-sans">
                    Apple iOS requires utilizing the native Apple Safari browser for launching Progressive Web App installations. Be sure to copy the link, open it in <strong>Safari</strong>, and follow the steps below.
                  </p>
                </div>

                <div className="space-y-3.5 text-xs font-mono">
                  <div className="flex gap-3">
                    <span className="flex-none w-5 h-5 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                    <p className="text-slate-300">Open this app link in the <span className="text-white font-bold underline">Safari</span> browser on your iPhone or iPad.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-none w-5 h-5 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                    <p className="text-slate-300">Tap the native <span className="text-white font-bold">Share</span> button at the bottom navigation center (the square with an arrow pointing up).</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-none w-5 h-5 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                    <p className="text-slate-300">Scroll down the sharing sheet and tap <span className="text-indigo-400 font-bold">"Add to Home Screen"</span>.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-none w-5 h-5 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[10px]">4</span>
                    <p className="text-slate-300">Tap <span className="text-white font-bold">"Add"</span> in the top-right corner. The official Pocket AI app icon will now appear on your home screen!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-start gap-3">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-300 leading-relaxed font-sans">
                    Android OS supports native chrome-driven PWA webapp prompts. This enables an automatic sandbox download inside your Android device drawer.
                  </p>
                </div>

                <div className="space-y-3.5 text-xs font-mono">
                  <div className="flex gap-3">
                    <span className="flex-none w-5 h-5 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                    <p className="text-slate-300">Open this link in your mobile <span className="text-white font-bold">Google Chrome</span> browser.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-none w-5 h-5 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                    <p className="text-slate-300">Tap the browser menu button (the three vertical dots in the top-right corner).</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-none w-5 h-5 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                    <p className="text-slate-300">Select <span className="text-indigo-400 font-bold">"Install app"</span> or <span className="text-indigo-400 font-bold">"Add to Home screen"</span>.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-none w-5 h-5 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[10px]">4</span>
                    <p className="text-slate-300">Follow the chrome confirmation overlay to place the Pocket AI widget onto your home dock launcher.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. SIDE QR-CODE CONTROLLER PANEL (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dynamic scan-to-mobile QR Code Box */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="font-display font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3 w-full justify-center">
              <QrCode className="w-4 h-4 text-purple-400" />
              Scan to Mobile Phone
            </h3>

            <p className="text-[11px] text-slate-400 leading-normal max-w-xs">
              Easily open this application on your mobile phone to experience local biometric Face ID and Voice Speaker pitch analysis using the camera and microphone.
            </p>

            {qrCodeUrl ? (
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img 
                  src={qrCodeUrl} 
                  alt="Scan App Link" 
                  className="w-48 h-48 rounded-xl object-contain relative z-10" 
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-black/40 rounded-xl border border-white/10 animate-pulse"></div>
            )}

            <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-[10px] font-mono text-indigo-400 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>TLS / HTTPS Encoded QR Registry</span>
            </div>
          </div>

          {/* Device Capabilities Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-3.5">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider text-slate-400">Mobile Device Compatibilities</h4>
            
            <div className="space-y-2 font-mono text-[10px]">
              {[
                { name: 'Safari / Chrome WebRTC Camera', status: 'COMPATIBLE', desc: 'Secure local Face ID blink distance vectors' },
                { name: 'HTML5 Spectrogram Microphone', status: 'COMPATIBLE', desc: 'Speaker voiceprint recognition' },
                { name: 'Client-side LocalStorage DB', status: 'COMPATIBLE', desc: 'No remote leaks of encrypted payloads' },
                { name: 'Biometric Anti-Spoof Liveness', status: 'COMPATIBLE', desc: 'Requires active user movement & blinks' },
              ].map((cap, i) => (
                <div key={i} className="flex justify-between items-start gap-4 p-2 bg-black/25 rounded-lg border border-white/5">
                  <div>
                    <p className="text-slate-300 font-bold">{cap.name}</p>
                    <p className="text-slate-500 text-[9px] mt-0.5 leading-none">{cap.desc}</p>
                  </div>
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold text-[8px]">
                    {cap.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
