import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Database, 
  FileText, 
  Lock, 
  Key, 
  Activity, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Download,
  Terminal,
  User,
  Fingerprint
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardOverviewProps {
  currentUser: any;
  onNavigate: (page: string) => void;
}

export default function DashboardOverview({ currentUser, onNavigate }: DashboardOverviewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'history' | 'audit' | 'security'>('history');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/security/dashboard?userId=${currentUser.id}`);
      if (!res.ok) throw new Error('Failed to retrieve system dashboard telemetry.');
      const telemetry = await res.json();
      setData(telemetry);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser.id]);

  const triggerLocalBackup = async () => {
    try {
      const res = await fetch(`/api/settings/backup?userId=${currentUser.id}`);
      const backup = await res.json();
      
      const blob = new Blob([backup.backupString], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Backup failed to compile.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-400 font-mono text-sm">LOADING LOCAL SECURE LEDGER TELEMETRY...</p>
      </div>
    );
  }

  const storagePercentage = Math.min(100, ((data?.storageUsage || 0) / (50 * 1024 * 1024)) * 100);

  return (
    <div className="space-y-6" id="dashboard_overview_container">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SECURE DECRYPTED SESSION
            </span>
            <span className="text-gray-400 text-xs font-mono">ID: {currentUser.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Welcome back, <span className="text-blue-400">{currentUser.username}</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Authenticated via <span className="font-mono text-blue-300 font-semibold">{currentUser.authMethod}</span>. Last backup was compile-verified locally.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            id="quick_backup_btn"
            onClick={triggerLocalBackup}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            EXPORT BACKUP (.bin)
          </button>
          <button 
            id="audit_reload_btn"
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg font-mono text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4 animate-pulse text-blue-400" />
            FORCE TELEMETRY POLL
          </button>
        </div>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: System Security Level */}
        <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Security Level</p>
            <p className="text-xl font-bold text-white">{data?.settings?.securityLevel || 'HIGH'}</p>
            <p className="text-[10px] text-gray-400 font-mono">Brute-Force Limit: 5 Retries</p>
          </div>
        </div>

        {/* Metric 2: Storage Quota */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Local Storage</p>
                <p className="text-sm font-bold text-white">{(data?.storageUsage / 1024).toFixed(1)} KB / 50 MB</p>
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.max(2, storagePercentage)}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: Vault Quantities */}
        <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Key className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Vault Inventory</p>
            <p className="text-xl font-bold text-white">{data?.passwordCount || 0} Passwords</p>
            <p className="text-[10px] text-gray-400 font-mono">{data?.fileCount || 0} Files | {data?.noteCount || 0} Notes</p>
          </div>
        </div>

        {/* Metric 4: AI Model status */}
        <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg">
            <Terminal className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Local AI Engine</p>
            <p className="text-xl font-bold text-white">Phi-3 (INT8)</p>
            <p className="text-[10px] text-emerald-400 font-mono">Running Offline Sandbox</p>
          </div>
        </div>
      </div>

      {/* Main Core layout: Left Log Ledger, Right quick actions & security alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ledger logs */}
        <div className="glass-panel rounded-xl p-5 lg:col-span-2 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
              Secure System Logs
            </h3>
            <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10">
              <button 
                id="tab_history_btn"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Access History
              </button>
              <button 
                id="tab_audit_btn"
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Audit Log
              </button>
              <button 
                id="tab_events_btn"
                onClick={() => setActiveTab('security')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Intrusions ({data?.events?.length || 0})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3 pr-2">
            {activeTab === 'history' && (
              data?.history?.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">No records inside ledger.</div>
              ) : (
                data?.history?.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${h.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`}></span>
                        <span className="font-mono text-white font-bold">{h.authMethodUsed}</span>
                        <span className="text-slate-500">({h.ipAddress})</span>
                      </div>
                      <p className="text-slate-400 font-mono text-[10px]">{h.deviceInfo}</p>
                      {h.failureReason && <p className="text-red-400 text-[10px] font-mono">Wipe alert: {h.failureReason}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${h.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {h.status}
                      </span>
                      <p className="text-slate-500 font-mono text-[10px] mt-1">{new Date(h.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'audit' && (
              data?.audits?.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">No operations logged yet.</div>
              ) : (
                data?.audits?.map((a: any) => (
                  <div key={a.id} className="flex gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5 text-xs items-start">
                    <div className="mt-0.5">
                      {a.severity === 'CRITICAL' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Terminal className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-blue-300 font-semibold">{a.action}</span>
                        <span className="text-slate-500 text-[10px] font-mono">{new Date(a.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-400">{a.details}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-mono">User: {a.username}</span>
                        <span className={`text-[9px] px-1 rounded font-mono font-bold ${
                          a.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 
                          a.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-slate-400'
                        }`}>
                          {a.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'security' && (
              data?.events?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-emerald-400/80 font-mono text-xs space-y-2">
                  <Shield className="w-12 h-12 stroke-1" />
                  <span>No security alert events logged. All secure.</span>
                </div>
              ) : (
                data?.events?.map((e: any) => (
                  <div key={e.id} className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-rose-400 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
                        {e.eventType}
                      </span>
                      <span className="text-rose-500 font-mono text-[10px]">{new Date(e.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-rose-300 font-mono text-[11px] bg-rose-950/30 p-2 rounded border border-rose-500/10">
                      {e.description}
                    </p>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Quick Tools Panel */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <h3 className="font-display font-bold text-white text-lg flex items-center gap-2 border-b border-white/10 pb-3">
            <Lock className="w-5 h-5 text-indigo-400" />
            Terminal Console
          </h3>

          <div className="bg-black/60 rounded-lg p-3 font-mono text-[11px] text-slate-300 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>AES-256 LEDGER CONNECTED</span>
            </div>
            <p className="text-slate-500">HOST: local.pocket.ai</p>
            <p className="text-slate-500">SW_BUILD: v1.1.0-college_demo</p>
            <p className="text-slate-400">$ integrity_check --mode=local</p>
            <p className="text-indigo-300">✓ Biometric buffers isolated.</p>
            <p className="text-indigo-300">✓ SQLite relational cache mounted.</p>
            <p className="text-indigo-300">✓ Session locked to RAM sandbox.</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Quick Jump Modules</p>
            <button 
              id="jump_notes_btn"
              onClick={() => onNavigate('notes')}
              className="w-full flex items-center justify-between p-2.5 bg-white/[0.02] hover:bg-white/5 rounded-lg border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Secure Encrypted Notes
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-1" />
            </button>

            <button 
              id="jump_vault_btn"
              onClick={() => onNavigate('vault')}
              className="w-full flex items-center justify-between p-2.5 bg-white/[0.02] hover:bg-white/5 rounded-lg border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Credential & Password Vault
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
            </button>

            <button 
              id="jump_ai_btn"
              onClick={() => onNavigate('ai')}
              className="w-full flex items-center justify-between p-2.5 bg-white/[0.02] hover:bg-white/5 rounded-lg border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                Local Edge AI Assistant
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-transform group-hover:translate-x-1" />
            </button>

            {currentUser.role === 'Administrator' && (
              <button 
                id="jump_admin_btn"
                onClick={() => onNavigate('admin')}
                className="w-full flex items-center justify-between p-2.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 text-xs text-rose-300 hover:text-rose-200 transition-all cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-rose-400" />
                  Root Command Admin Panel
                </span>
                <ArrowRight className="w-4 h-4 text-rose-500 group-hover:text-rose-300 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
