import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Terminal, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelProps {
  currentUser: any;
}

export default function AdminPanel({ currentUser }: AdminPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'logs' | 'incidents'>('users');
  const [logSearch, setLogSearch] = useState('');
  const [logSeverity, setLogSeverity] = useState('All');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?adminId=${currentUser.id}`);
      if (!res.ok) throw new Error('Access Denied: You do not have root administrator capabilities.');
      const responseData = await res.json();
      setData(responseData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser.id]);

  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: currentUser.id,
          targetUserId,
          newRole
        })
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      alert('Role change execution failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-rose-400 font-mono text-sm">QUERYING PRIVILEGED SQLite REGISTRIES...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center max-w-md mx-auto space-y-4 border-rose-500/20">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
        <h3 className="text-lg font-bold text-white font-display">ROOT ACCESS RESTRICTED</h3>
        <p className="text-slate-400 text-xs font-mono bg-black/40 p-3 rounded border border-white/5 leading-normal">
          {error}
        </p>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = (data?.logs || []).filter((log: any) => {
    const matchesSearch = log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                          log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
                          log.username.toLowerCase().includes(logSearch.toLowerCase());
    const matchesSeverity = logSeverity === 'All' || log.severity === logSeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6" id="admin_panel_container">
      {/* Admin header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-rose-500/10">
        <div className="space-y-1">
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
            ROOT ADMINISTRATOR CONSOLE
          </span>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">
            Relational SQLite Audit Core
          </h2>
          <p className="text-slate-400 text-xs font-mono">
            Direct database queries. Secure administrative actions. Device tampering monitoring.
          </p>
        </div>

        <button 
          id="admin_refresh_btn"
          onClick={fetchAdminData}
          className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white rounded-lg font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-rose-400 animate-spin" style={{ animationDuration: '6s' }} />
          REFRESH SCHEMAS
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-black/40 p-0.5 rounded-xl border border-white/10 w-max">
        <button 
          id="admin_subtab_users_btn"
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 text-xs font-mono rounded-lg transition-all cursor-pointer ${activeSubTab === 'users' ? 'bg-rose-600/80 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
        >
          <Users className="w-4 h-4 inline-block mr-1.5" />
          Manage Users ({data?.users?.length || 0})
        </button>
        <button 
          id="admin_subtab_logs_btn"
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 text-xs font-mono rounded-lg transition-all cursor-pointer ${activeSubTab === 'logs' ? 'bg-rose-600/80 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
        >
          <Activity className="w-4 h-4 inline-block mr-1.5" />
          Full System Audits
        </button>
        <button 
          id="admin_subtab_incidents_btn"
          onClick={() => setActiveSubTab('incidents')}
          className={`px-4 py-2 text-xs font-mono rounded-lg transition-all cursor-pointer ${activeSubTab === 'incidents' ? 'bg-rose-600/80 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
        >
          <AlertTriangle className="w-4 h-4 inline-block mr-1.5" />
          Intrusion Incidents ({data?.events?.length || 0})
        </button>
      </div>

      {/* Users view */}
      {activeSubTab === 'users' && (
        <div className="glass-panel p-5 rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 font-mono text-[10px] uppercase pb-2">
                <th className="py-3 px-4">User Detail</th>
                <th className="py-3 px-4">Authority Role</th>
                <th className="py-3 px-4">Biometrics enrolled</th>
                <th className="py-3 px-4 text-center">Files Locked</th>
                <th className="py-3 px-4 text-center">Passwords</th>
                <th className="py-3 px-4 text-center">Notes</th>
                <th className="py-3 px-4 text-right">Action override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {data?.users?.map((user: any) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-all">
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white text-sm">{user.username}</p>
                      <p className="text-[10px] font-mono text-slate-500">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <select 
                      id={`user_role_select_${user.id}`}
                      value={user.role}
                      disabled={user.id === currentUser.id}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="bg-zinc-900 border border-white/10 text-white rounded px-2 py-1 text-[11px] font-mono focus:border-rose-500/40 focus:outline-none"
                    >
                      <option value="Guest" className="bg-zinc-950 text-white">Guest</option>
                      <option value="User" className="bg-zinc-950 text-white">User</option>
                      <option value="Administrator" className="bg-zinc-950 text-white">Administrator</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${user.hasFace ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                        FACE {user.hasFace ? '✓' : '✗'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${user.hasVoice ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                        VOICE {user.hasVoice ? '✓' : '✗'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-400">{user.fileCount}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-teal-400">{user.passwordCount}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-400">{user.noteCount}</td>
                  <td className="py-3.5 px-4 text-right">
                    {user.id !== currentUser.id ? (
                      <button 
                        id={`user_wipe_btn_${user.id}`}
                        onClick={async () => {
                          if (!confirm(`Deep clean and permanently erase user '${user.username}' record and ALL nested items?`)) return;
                          await fetch('/api/settings/delete-account', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.id })
                          });
                          fetchAdminData();
                        }}
                        className="px-2.5 py-1 bg-black/40 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-white/10 hover:border-rose-500/20 rounded font-mono text-[10px] cursor-pointer transition-colors"
                      >
                        SHRED ACCOUNT
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono italic">Protected Root</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Logs view */}
      {activeSubTab === 'logs' && (
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input 
                id="admin_logs_search"
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search raw SQLite logs ledger..."
                className="w-full glass-input pl-9 pr-3 py-2 rounded-lg font-mono text-xs"
              />
            </div>

            {/* Severity filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select 
                id="admin_logs_filter"
                value={logSeverity}
                onChange={(e) => setLogSeverity(e.target.value)}
                className="glass-input px-3 py-2 rounded-lg text-xs bg-zinc-900 text-white border border-white/10 focus:outline-none"
              >
                <option value="All" className="bg-zinc-950 text-white">All Severities</option>
                <option value="INFO" className="bg-zinc-950 text-white">INFO ONLY</option>
                <option value="WARNING" className="bg-zinc-950 text-white">WARNING ONLY</option>
                <option value="CRITICAL" className="bg-zinc-950 text-white">CRITICAL ONLY</option>
              </select>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[450px] space-y-2.5 pr-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">No audit logs matched query constraints.</div>
            ) : (
              filteredLogs.map((log: any) => (
                <div key={log.id} className="p-3.5 bg-black/40 border border-white/10 rounded-xl text-xs flex gap-3 items-start hover:border-white/20 transition-all">
                  <div className="mt-0.5">
                    {log.severity === 'CRITICAL' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    ) : log.severity === 'WARNING' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Terminal className="w-4 h-4 text-teal-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-rose-300">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-300 text-xs font-sans leading-relaxed">{log.details}</p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 pt-1">
                      <span>User ID: {log.userId.slice(0, 8)}</span>
                      <span>|</span>
                      <span>Username: {log.username}</span>
                      <span>|</span>
                      <span className={`px-1 rounded font-bold ${
                        log.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400' : 
                        log.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-slate-400'
                      }`}>{log.severity}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Incident intrusion view */}
      {activeSubTab === 'incidents' && (
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2">
            <h3 className="font-display font-bold text-rose-400 text-base flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
              Active Brute-Force & Biometric Intrusions
            </h3>
            <span className="text-[10px] font-mono text-slate-500">REALTIME THREAT LOGS</span>
          </div>

          <div className="space-y-3">
            {data?.events?.length === 0 ? (
              <div className="p-8 text-center text-emerald-400/80 font-mono text-xs space-y-2 border border-emerald-500/10 bg-emerald-950/5 rounded-xl">
                <ShieldCheck className="w-12 h-12 stroke-1 text-emerald-500 mx-auto" />
                <p>System secure. No unauthorized access signatures detected in ledger registries.</p>
              </div>
            ) : (
              data?.events?.map((e: any) => (
                <div key={e.id} className="p-4 bg-rose-950/15 border border-rose-500/20 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-rose-400 font-extrabold text-sm">{e.eventType}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-rose-300 font-mono text-[11px] leading-relaxed bg-rose-950/20 p-2.5 rounded border border-rose-500/10">
                    {e.description}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <span>Associated User ID: {e.userId ? e.userId.slice(0, 8) : 'None (SYSTEM)'}</span>
                    <span>|</span>
                    <span className="px-1 bg-rose-500/10 text-rose-400 rounded font-bold font-mono">SEVERITY: CRITICAL</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
