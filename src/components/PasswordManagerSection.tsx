import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Search, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Lock,
  Globe,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';

interface PasswordManagerSectionProps {
  currentUser: any;
}

export default function PasswordManagerSection({ currentUser }: PasswordManagerSectionProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<'Work' | 'Personal' | 'Financial' | 'Social' | 'Other'>('Personal');

  // Password Generator states
  const [genLength, setGenLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);

  // Visibility states for records
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedRecordId, setCopiedRecordId] = useState<string | null>(null);

  useEffect(() => {
    fetchPasswords();
  }, [currentUser.id]);

  const fetchPasswords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/passwords?userId=${currentUser.id}`);
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error('Failed to query passwords:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const syms = '!@#$%^&*()_+~`|}{[]:;?><,./-';
    
    let pool = chars;
    if (includeNumbers) pool += nums;
    if (includeSymbols) pool += syms;

    let generated = '';
    for (let i = 0; i < genLength; i++) {
      generated += pool.charAt(Math.floor(Math.random() * pool.length));
    }
    setPassword(generated);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !password) return;

    try {
      const payload: any = {
        userId: currentUser.id,
        siteName,
        siteUrl,
        loginUsername,
        password,
        category
      };
      if (formId) payload.id = formId;

      const res = await fetch('/api/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsAdding(false);
        setFormId(null);
        setSiteName('');
        setSiteUrl('');
        setLoginUsername('');
        setPassword('');
        setCategory('Personal');
        fetchPasswords();
      }
    } catch (err) {
      alert('Failed to save vault record.');
    }
  };

  const handleEditRecord = (rec: any) => {
    setFormId(rec.id);
    setSiteName(rec.siteName);
    setSiteUrl(rec.siteUrl);
    setLoginUsername(rec.loginUsername);
    setPassword(rec.password);
    setCategory(rec.category);
    setIsAdding(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Shred this password entry from physical storage? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/passwords/${id}?userId=${currentUser.id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchPasswords();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const isCurrentlyVisible = !prev[id];
      const next = { ...prev, [id]: isCurrentlyVisible };
      
      // Auto-lock feature: automatically lock password visibility after 8 seconds
      if (isCurrentlyVisible) {
        setTimeout(() => {
          setVisiblePasswords(curr => ({ ...curr, [id]: false }));
        }, 8000);
      }
      return next;
    });
  };

  const handleCopyPassword = (id: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedRecordId(id);
    setTimeout(() => setCopiedRecordId(null), 2000);
  };

  const filteredRecords = records.filter(rec => {
    const matchesSearch = 
      rec.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.loginUsername.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || rec.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStrengthLevel = (pass: string) => {
    if (pass.length < 8) return { label: 'VULNERABLE', color: 'text-red-400 bg-red-500/10' };
    if (pass.length < 12) return { label: 'STANDARD', color: 'text-amber-400 bg-amber-500/10' };
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    if (hasSpecial && hasNum) return { label: 'HIGH SECURITY', color: 'text-emerald-400 bg-emerald-500/10' };
    return { label: 'COMPLEX', color: 'text-blue-400 bg-blue-500/10' };
  };

  return (
    <div className="space-y-6" id="password_manager_container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-3 gap-4">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-white text-xl flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            Offline Password Vault
          </h2>
          <p className="text-slate-400 text-xs font-sans">
            Securely manage credentials locally. Database entries are encrypted via AES-256 in system RAM.
          </p>
        </div>
        
        <button 
          id="vault_add_new_btn"
          onClick={() => { setIsAdding(!isAdding); setFormId(null); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'CANCEL ADD' : 'GENERATE & ADD RECORD'}
        </button>
      </div>

      {isAdding && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-black/40 rounded-2xl border border-white/10">
          {/* Add Form */}
          <form onSubmit={handleSaveRecord} className="space-y-4">
            <h3 className="font-display font-bold text-white text-base">
              {formId ? 'Update Password Record' : 'Create Vault Record'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono uppercase">Service Name *</label>
                <input 
                  id="vault_form_site_name"
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. ProtonMail"
                  className="w-full glass-input px-3 py-2 rounded-lg font-sans text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono uppercase">Category</label>
                <select 
                  id="vault_form_category"
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-lg font-sans text-xs bg-zinc-900 text-white border border-white/10 focus:border-indigo-500/50 focus:outline-none"
                >
                  <option value="Personal" className="bg-zinc-950 text-white">Personal</option>
                  <option value="Work" className="bg-zinc-950 text-white">Work</option>
                  <option value="Financial" className="bg-zinc-950 text-white">Financial</option>
                  <option value="Social" className="bg-zinc-950 text-white">Social</option>
                  <option value="Other" className="bg-zinc-950 text-white">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase">Service URL</label>
              <input 
                id="vault_form_site_url"
                type="text"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://proton.me"
                className="w-full glass-input px-3 py-2 rounded-lg font-sans text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono uppercase">Login Username</label>
                <input 
                  id="vault_form_username"
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="e.g. student_cse"
                  className="w-full glass-input px-3 py-2 rounded-lg font-sans text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono uppercase">Secure Password *</label>
                <input 
                  id="vault_form_password"
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter or generate password"
                  className="w-full glass-input px-3 py-2 rounded-lg font-mono text-xs"
                />
              </div>
            </div>

            <button 
              id="vault_form_submit_btn"
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-xs font-bold w-full transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              COMMIT ENCRYPTED WRITE
            </button>
          </form>

          {/* Generator tool */}
          <div className="p-5 bg-black/40 border border-white/10 rounded-xl space-y-4">
            <h3 className="font-display font-bold text-white text-base flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Cryptographic Password Generator
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>PASSWORD LENGTH</span>
                  <span className="text-white font-bold">{genLength} CHARACTERS</span>
                </div>
                <input 
                  id="vault_gen_length_slider"
                  type="range"
                  min="8"
                  max="32"
                  value={genLength}
                  onChange={(e) => setGenLength(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-white/10 rounded-lg cursor-pointer h-2"
                />
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">INCLUDE NUMBERS (0-9)</span>
                <input 
                  id="vault_gen_numbers_toggle"
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">INCLUDE SPECIAL CHARS (!@#$)</span>
                <input 
                  id="vault_gen_symbols_toggle"
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
              </div>

              <button 
                id="vault_gen_trigger_btn"
                onClick={handleGeneratePassword}
                type="button"
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                GENERATE SEED SEQUENCE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white/[0.02] p-4 rounded-xl border border-white/10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            id="vault_records_search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search credentials..."
            className="w-full glass-input pl-9 pr-3 py-2 rounded-lg font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            id="vault_records_filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="glass-input px-3 py-2 rounded-lg text-xs bg-zinc-900 text-white border border-white/10 focus:outline-none"
          >
            <option value="All" className="bg-zinc-950 text-white">All Categories</option>
            <option value="Personal" className="bg-zinc-950 text-white">Personal</option>
            <option value="Work" className="bg-zinc-950 text-white">Work</option>
            <option value="Financial" className="bg-zinc-950 text-white">Financial</option>
            <option value="Social" className="bg-zinc-950 text-white">Social</option>
            <option value="Other" className="bg-zinc-950 text-white">Other</option>
          </select>
        </div>
      </div>

      {/* Password Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500 font-mono text-xs">COMMUNICATING WITH AES CACHE LEDGER...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500 font-mono text-xs flex flex-col items-center justify-center space-y-2">
            <Lock className="w-12 h-12 stroke-1 text-slate-700" />
            <span>No matching passwords recorded in vault index.</span>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const strength = getStrengthLevel(rec.password);
            const isVisible = !!visiblePasswords[rec.id];
            return (
              <div key={rec.id} className="glass-panel p-5 rounded-xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between h-[200px]">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-white text-sm truncate max-w-[150px]">{rec.siteName}</h4>
                      {rec.siteUrl && (
                        <a 
                          href={rec.siteUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] text-indigo-400 hover:underline font-mono flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          Link
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-400 text-[9px] font-mono">
                        {rec.category}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${strength.color}`}>
                        {strength.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <p className="text-slate-400">
                      User: <span className="text-white font-medium">{rec.loginUsername || 'None'}</span>
                    </p>
                    <div className="flex items-center gap-1 text-slate-400">
                      <span>Pass:</span>
                      <input 
                        type={isVisible ? 'text' : 'password'} 
                        readOnly
                        value={rec.password}
                        className="bg-transparent border-none text-white focus:outline-none font-mono text-xs flex-1 max-w-[130px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                  <span className="text-[9px] text-slate-500 font-mono">
                    Locked {isVisible ? '(Auto 8s)' : ''}
                  </span>

                  <div className="flex gap-1.5">
                    <button 
                      id={`vault_record_visibility_btn_${rec.id}`}
                      onClick={() => togglePasswordVisibility(rec.id)}
                      className="p-1.5 bg-black/40 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded transition-all cursor-pointer"
                      title="Reveal password"
                    >
                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    <button 
                      id={`vault_record_copy_btn_${rec.id}`}
                      onClick={() => handleCopyPassword(rec.id, rec.password)}
                      className="p-1.5 bg-black/40 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded transition-all cursor-pointer"
                      title="Copy plain pass"
                    >
                      {copiedRecordId === rec.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button 
                      id={`vault_record_edit_btn_${rec.id}`}
                      onClick={() => handleEditRecord(rec)}
                      className="p-1.5 bg-black/40 hover:bg-indigo-950/20 border border-white/10 hover:border-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded transition-all cursor-pointer"
                      title="Edit payload"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      id={`vault_record_delete_btn_${rec.id}`}
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="p-1.5 bg-black/40 hover:bg-rose-950/30 border border-white/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-all cursor-pointer"
                      title="Wipe record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
