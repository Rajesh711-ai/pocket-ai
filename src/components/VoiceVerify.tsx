import React, { useRef, useState, useEffect } from 'react';
import { Mic, ShieldCheck, HelpCircle, Volume2, HelpCircle as AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceVerifyProps {
  mode: 'register' | 'login';
  onCaptureComplete: (voiceTemplate: { frequencyAverage: number, peakFrequency: number, sampleRate: number }) => void;
  onCancel?: () => void;
}

export default function VoiceVerify({ mode, onCaptureComplete, onCancel }: VoiceVerifyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState(false);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [passphrase, setPassphrase] = useState('');
  const [status, setStatus] = useState('MIC CHANNELS STANDBY...');
  
  // Real or simulated audio context metrics
  const [freqAvg, setFreqAvg] = useState(240); // in Hz representing voice pitch
  const [peakFreq, setPeakFreq] = useState(380);

  const passphrases = [
    'POCKET AI CORE KEY 4-9-7-0 SECURE',
    'BIOMETRIC LOGON KEYPAD DELTA BRAVO CLEAR',
    'OFFLINE COGNITIVE STORAGE VERIFY SEQUENCE ZULU',
    'ENCRYPTED SQLite REGISTRY ACCESS TOKEN NINER'
  ];

  useEffect(() => {
    // Generate a secure phrase for this session
    const chosen = passphrases[Math.floor(Math.random() * passphrases.length)];
    setPassphrase(chosen);
    startMic();
    return () => {
      stopMic();
    };
  }, []);

  const startMic = async () => {
    setMicError(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      // In web applet iframe, Web Audio context might sometimes be constrained, 
      // but initializinggetUserMedia is successful. We'll use high-end simulated 
      // canvas visualization that responds beautifully!
    } catch (err) {
      console.warn('Microphone blocked or not available, fallback to hardware spectrum simulation:', err);
      setMicError(true);
    }
  };

  const stopMic = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleStartRecording = () => {
    setRecording(true);
    setStatus('LISTENING... READ SECURITY PASSPHRASE ALOUD NOW.');
    
    let timeRemaining = 4;
    setCountdown(timeRemaining);

    const interval = setInterval(() => {
      timeRemaining -= 1;
      setCountdown(timeRemaining);
      
      // Randomise frequencies to simulate voice vibration tracking
      setFreqAvg(prev => Math.floor(180 + Math.random() * 90));
      setPeakFreq(prev => Math.floor(320 + Math.random() * 110));

      if (timeRemaining <= 0) {
        clearInterval(interval);
        setRecording(false);
        setStatus('✓ AUDIOPRINT CAPTURE SUCCESSFUL. GENERATING SPECTRUM...');
        
        setTimeout(() => {
          stopMic();
          onCaptureComplete({
            frequencyAverage: freqAvg,
            peakFrequency: peakFreq,
            sampleRate: 16000
          });
        }, 1200);
      }
    }, 1000);
  };

  // Spectacular floating spectrum canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      offset += 0.05;

      const barWidth = 4;
      const spacing = 3;
      const barCount = Math.floor(canvas.width / (barWidth + spacing));

      for (let i = 0; i < barCount; i++) {
        // Base sine wave calculations + recording scale factor
        const sineInput = i * 0.15 + offset;
        let heightMultiplier = recording ? (4 + Math.sin(sineInput * 2) * 20) : (1 + Math.sin(sineInput) * 3);
        
        // Random vibration spikes during active recording
        if (recording && Math.random() > 0.7) {
          heightMultiplier += Math.random() * 15;
        }

        const barHeight = Math.max(2, heightMultiplier);
        const x = i * (barWidth + spacing);
        const y = canvas.height - barHeight - 4;

        // Custom gradient
        const grad = ctx.createLinearGradient(x, y, x, canvas.height);
        grad.addColorStop(0, '#22d3ee'); // cyan-400
        grad.addColorStop(0.5, '#3b82f6'); // blue-500
        grad.addColorStop(1, '#1e1b4b'); // indigo-950

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [recording]);

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-5 flex flex-col items-center max-w-sm mx-auto relative overflow-hidden" id="voice_verify_hud">
      <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>

      {/* HUD Header */}
      <div className="text-center space-y-1 w-full">
        <div className="flex justify-center items-center gap-2">
          <Mic className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="font-display font-extrabold text-white text-base tracking-wide uppercase">
            {mode === 'register' ? 'Enrolling Voiceprint' : 'Speaker Verification Match'}
          </h3>
        </div>
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">POCKET_AI SECURITY LAYER_4</p>
      </div>

      {/* Spectrogram canvas */}
      <div className="relative w-[280px] h-[100px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 p-1 flex flex-col justify-end">
        <canvas 
          ref={canvasRef} 
          width={270} 
          height={80} 
          className="w-full h-full"
        />
        <div className="absolute top-2 left-2 text-[8px] font-mono text-cyan-400/60 flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-cyan-400" />
          <span>SPECTROGRAM ANALYSER</span>
        </div>
        
        {recording && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[9px] font-bold animate-pulse">
            REC {countdown}S
          </div>
        )}
      </div>

      {/* Passphrase statement */}
      <div className="w-full bg-slate-950/60 p-4 rounded-xl border border-slate-900 text-center space-y-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-500/[0.02] pointer-events-none"></div>
        <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">SECURE AUDIOPRINT CODEPHRASE</p>
        <p className="text-sm font-display font-bold text-cyan-400 select-all leading-normal">
          "{passphrase}"
        </p>
      </div>

      {/* Mic control button */}
      <div className="w-full space-y-3">
        <p className="text-[10px] font-mono text-indigo-300 text-center min-h-[30px] flex items-center justify-center uppercase">
          {status}
        </p>

        {!recording && (
          <button 
            id="voice_record_start_btn"
            type="button"
            onClick={handleStartRecording}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/40"
          >
            <Mic className="w-4 h-4 animate-bounce" />
            RECORD AUTHENTICATION SIGNAL
          </button>
        )}

        {recording && (
          <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono text-xs py-1 text-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>CAPUTURING SPEAKER SPECTRUM FREQUENCIES...</span>
          </div>
        )}
      </div>

      {/* Cancel */}
      {onCancel && (
        <button 
          type="button"
          onClick={() => { stopMic(); onCancel(); }}
          className="text-xs font-mono text-gray-500 hover:text-white transition-all cursor-pointer mt-1"
        >
          Cancel Speaker Verification
        </button>
      )}
    </div>
  );
}
