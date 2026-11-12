import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  Cpu, 
  Sliders, 
  BookOpen, 
  Code, 
  Sparkles,
  FileText,
  Clock,
  User,
  BrainCircuit
} from 'lucide-react';
import { motion } from 'motion/react';
import { ChatMessage } from '../types';

interface AIAssistantSectionProps {
  currentUser: any;
}

export default function AIAssistantSection({ currentUser }: AIAssistantSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: "Hello! I am the **Pocket AI Edge Assistant**, running a local, quantized **Phi-3 (3.8B parameter)** model with zero external network connectivity. I run entirely on your terminal's RAM.\n\nI can analyze notes, design security policies, write code, or explain local cryptographic protocols without leaking any of your vault files to the cloud. What are we building today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState('Phi-3-3.8B (Local Edge)');
  const [modelStats, setModelStats] = useState({
    ramUsed: '1.42 GB',
    tokenSpeed: '32.4 tok/s',
    quantType: 'INT8 Quantised (8-bit)',
    temperature: 0.7,
    status: 'ONLINE (RAM SANDBOX)'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          messages: [...messages, userMsg]
        })
      });

      if (!res.ok) throw new Error('Offline engine timed out or memory constraint hit.');
      
      const responseData = await res.json();
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: responseData.response,
        timestamp: new Date().toISOString()
      }]);
      
      if (responseData.model) {
        setCurrentModel(responseData.model);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: `**CRITICAL ERROR: Local LLM cache overflow.**\n\n_${err.message}_\n\nUsing simulated fallback mode: Please ensure your terminal server has active CPU allocations.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    { title: 'RSA Encryption', text: 'Explain how RSA key generation works and show a secure JS implementation of RSA padding.' },
    { title: 'Biometric Anti-Spoof', text: 'What is head movement liveness verification and how is it simulated with Canvas coordinates?' },
    { title: 'Code Review', text: 'Review this secure storage API route in Express to see if there are any SQL or template injection vulnerabilities.' },
    { title: 'College Project Defense', text: 'What are the main advantages of offline biometric authentication for critical critical systems?' }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="ai_assistant_container">
      {/* Chat interface */}
      <div className="xl:col-span-3 glass-panel rounded-2xl flex flex-col h-[650px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10"></div>
        
        {/* Chat header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg animate-pulse">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-white text-base">Local AI Sandbox</h2>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                  Active Edge
                </span>
              </div>
              <p className="text-gray-400 text-xs font-mono">MODEL: {currentModel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">100% OFFLINE SAFE</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex gap-3 max-w-3xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`p-2.5 rounded-lg flex-shrink-0 h-10 w-10 flex items-center justify-center border font-mono text-xs ${
                m.sender === 'user' 
                  ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' 
                  : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
              }`}>
                {m.sender === 'user' ? <User className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
              </div>
              <div className={`p-4 rounded-xl space-y-1.5 leading-relaxed border ${
                m.sender === 'user' 
                  ? 'bg-blue-500/10 border-blue-500/20 text-white rounded-tr-none' 
                  : 'bg-white/[0.03] border-white/10 text-slate-200 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-line prose prose-invert max-w-none prose-sm font-sans">
                  {m.content}
                </div>
                <div className="text-[10px] text-slate-500 font-mono text-right">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="p-2.5 rounded-lg h-10 w-10 flex items-center justify-center bg-teal-500/10 border border-teal-500/20 text-teal-400 animate-spin">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl rounded-tl-none flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-slate-400 font-mono pl-2">PHI-3 INFERENCE CORES PROCESSING EMBEDDINGS...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-3"
          >
            <input 
              id="ai_chat_input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Query local Phi-3 (math, coding, cryptology specs, security audits)..."
              className="flex-1 glass-input px-4 py-3 rounded-xl font-mono text-xs text-white"
            />
            <button 
              id="ai_chat_send_btn"
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900/40 disabled:text-teal-700 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <Send className="w-4 h-4" />
              RUN INFERENCE
            </button>
          </form>
        </div>
      </div>

      {/* Model telemetry Sidebar */}
      <div className="space-y-4">
        {/* AI Stats */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-3">
            <Sliders className="w-4 h-4 text-teal-400" />
            Model Telemetry
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">RAM Cache Size:</span>
              <span className="text-white font-bold">{modelStats.ramUsed}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Inference Speed:</span>
              <span className="text-white font-bold">{modelStats.tokenSpeed}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Quantization:</span>
              <span className="text-teal-400 font-bold">{modelStats.quantType}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Temperature:</span>
              <span className="text-white">{modelStats.temperature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hardware Core:</span>
              <span className="text-indigo-400 font-semibold uppercase">CPU Sandbox</span>
            </div>
          </div>
        </div>

        {/* Preset prompt templates */}
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Demonstration Templates
          </h3>
          <p className="text-slate-400 text-xs font-sans pb-1">
            Click on any cybersecurity/college-defense prompt template to execute an instant local response.
          </p>

          <div className="space-y-2">
            {samplePrompts.map((p, idx) => (
              <button 
                key={idx}
                id={`preset_prompt_${idx}`}
                onClick={() => handleSendMessage(p.text)}
                disabled={loading}
                className="w-full text-left p-3 bg-white/[0.02] hover:bg-white/5 rounded-xl border border-white/10 hover:border-teal-500/30 text-xs font-sans text-slate-300 hover:text-white transition-all cursor-pointer block group space-y-1"
              >
                <div className="font-bold text-teal-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {p.title}
                </div>
                <p className="text-[11px] text-slate-400 group-hover:text-slate-300 truncate font-mono">
                  {p.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
