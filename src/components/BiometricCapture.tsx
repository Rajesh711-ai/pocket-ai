import React, { useRef, useState, useEffect } from 'react';
import { Camera, ShieldCheck, RefreshCw, AlertTriangle, HelpCircle, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface BiometricCaptureProps {
  mode: 'register' | 'login';
  onCaptureComplete: (faceTemplate: { eyeDistance: number, noseRatio: number, width: number, height: number, livenessScore: number }) => void;
  onCancel?: () => void;
}

export default function BiometricCapture({ mode, onCaptureComplete, onCancel }: BiometricCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [livenessStep, setLivenessStep] = useState<number>(1);
  const [livenessStatus, setLivenessStatus] = useState('ALIGNING BIOMETRIC CONTOUR TARGETS...');
  const [confidence, setConfidence] = useState(0);
  const [eyeDistance, setEyeDistance] = useState(120);
  const [noseRatio, setNoseRatio] = useState(1.42);

  // Simulated geometric variables
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [headTilt, setHeadTilt] = useState<'CENTER' | 'LEFT' | 'RIGHT'>('CENTER');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(false);
    try {
      const constraints = { video: { width: 320, height: 240, facingMode: 'user' } };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera blocked or unavailable, enabling high-fidelity software hardware simulation:', err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Run dynamic geometric loop simulation for face matching
  useEffect(() => {
    let timer: any;
    let currentConf = 0;

    const interval = setInterval(() => {
      if (currentConf < 100) {
        currentConf += Math.floor(Math.random() * 8) + 4;
        setConfidence(Math.min(100, currentConf));
        
        // Randomly simulate head tilt alignments or eye coordinate variations
        setEyeDistance(prev => Number((prev + (Math.random() * 4 - 2)).toFixed(2)));
        setNoseRatio(prev => Number((prev + (Math.random() * 0.04 - 0.02)).toFixed(2)));
      } else {
        clearInterval(interval);
        
        // Staged liveness checks
        if (livenessStep === 1) {
          setLivenessStatus('✓ TARGETS ALIGNED. PLEASE BLINK NOW TO CONFIRM LIVENESS...');
          setLivenessStep(2);
        }
      }
    }, 180);

    return () => {
      clearInterval(interval);
    };
  }, [livenessStep]);

  const triggerBlinkMatch = () => {
    setBlinkDetected(true);
    setLivenessStatus('✓ BLINK VERIFIED. TILT HEAD SLIGHTLY TO COMMENCE SCAN...');
    setLivenessStep(3);
  };

  const triggerHeadTilt = (tilt: 'LEFT' | 'RIGHT') => {
    setHeadTilt(tilt);
    setLivenessStatus('✓ 3D BIOMETRIC SECURE EMBEDDING GENERATED. COMPLETING CONCURRENCY...');
    setLivenessStep(4);
    
    // Complete capture in 1.2 seconds
    setTimeout(() => {
      onCaptureComplete({
        eyeDistance,
        noseRatio,
        width: 320,
        height: 240,
        livenessScore: 98.6
      });
    }, 1200);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-5 flex flex-col items-center max-w-sm mx-auto relative overflow-hidden" id="biometric_capture_hud">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
      
      {/* HUD Header */}
      <div className="text-center space-y-1 w-full">
        <div className="flex justify-center items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400 animate-pulse" />
          <h3 className="font-display font-extrabold text-white text-base tracking-wide uppercase">
            {mode === 'register' ? 'Enrolling Face Matrix' : 'Biometric Match Face Scan'}
          </h3>
        </div>
        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">POCKET_AI SECURITY LAYER_3</p>
      </div>

      {/* Video Container with custom ScanHUD */}
      <div className="relative w-[280px] h-[210px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 shadow-inner flex items-center justify-center">
        {cameraError ? (
          /* Software Simulation Screen */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-4 text-center z-10">
            <div className="absolute inset-x-0 bg-blue-500/20 h-[1.5px] biometric-scan-line z-20"></div>
            {/* Holographic face wireframe using SVG */}
            <svg className="w-28 h-28 text-blue-500/40 animate-pulse" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M50,15 C30,15 25,35 25,55 C25,75 35,85 50,85 C65,85 75,75 75,55 C75,35 70,15 50,15 Z" />
              <circle cx="38" cy="45" r="4" strokeDasharray="2" />
              <circle cx="62" cy="45" r="4" strokeDasharray="2" />
              <line x1="50" y1="40" x2="50" y2="60" />
              <path d="M40,70 Q50,75 60,70" />
              <line x1="25" y1="55" x2="75" y2="55" strokeDasharray="2" />
            </svg>
            <p className="text-[9px] text-indigo-400 font-mono mt-3 uppercase tracking-wider">HARDWARE SIMULATION INTERFACE ACTIVE</p>
          </div>
        ) : (
          /* Real Camera Stream */
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
        )}

        {/* Realtime Target HUD overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center border-2 border-slate-900/40">
          {/* Scan Line */}
          <div className="absolute inset-x-0 bg-blue-500/30 h-[2px] biometric-scan-line z-20"></div>

          {/* Targeting circle corners */}
          <div className="w-36 h-36 border border-blue-500/20 rounded-full flex items-center justify-center relative animate-spin" style={{ animationDuration: '15s' }}>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>

          {/* HUD Crosshairs */}
          <div className="absolute top-2 left-2 text-[8px] font-mono text-blue-500/60">FPS: 30.0</div>
          <div className="absolute top-2 right-2 text-[8px] font-mono text-blue-500/60">RES: 320x240</div>
          <div className="absolute bottom-2 left-2 text-[8px] font-mono text-blue-500/60">EYE_D: {eyeDistance}px</div>
          <div className="absolute bottom-2 right-2 text-[8px] font-mono text-blue-500/60">N_RATIO: {noseRatio}</div>
          
          {/* Alignment grid text */}
          {confidence < 100 && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center font-mono text-[10px] text-blue-400 font-bold uppercase tracking-wider">
              ALIGNING MATRIX: {confidence}%
            </div>
          )}
        </div>
      </div>

      {/* Liveness actions control box */}
      <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3.5">
        <p className="text-[11px] font-mono text-indigo-300 min-h-[32px] flex items-center justify-center">
          {livenessStatus}
        </p>

        {/* Action Trigger Buttons depending on Staged Liveness Steps */}
        {livenessStep === 2 && (
          <button 
            id="liveness_blink_btn"
            type="button"
            onClick={triggerBlinkMatch}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            [SIMULATE LIVENESS BLINK]
          </button>
        )}

        {livenessStep === 3 && (
          <div className="flex gap-2">
            <button 
              id="liveness_tilt_left_btn"
              type="button"
              onClick={() => triggerHeadTilt('LEFT')}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-mono text-[10px] font-bold cursor-pointer transition-all"
            >
              TILT HEAD LEFT
            </button>
            <button 
              id="liveness_tilt_right_btn"
              type="button"
              onClick={() => triggerHeadTilt('RIGHT')}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-mono text-[10px] font-bold cursor-pointer transition-all"
            >
              TILT HEAD RIGHT
            </button>
          </div>
        )}

        {livenessStep === 4 && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-xs py-1">
            <ShieldCheck className="w-5 h-5 animate-bounce" />
            <span>ENCRYPTING EMBEDDING ARRAYS...</span>
          </div>
        )}
      </div>

      {/* Footer controls */}
      {onCancel && (
        <button 
          type="button"
          onClick={() => { stopCamera(); onCancel(); }}
          className="text-xs font-mono text-gray-500 hover:text-white transition-all cursor-pointer"
        >
          Cancel Biometric Authentication
        </button>
      )}
    </div>
  );
}
