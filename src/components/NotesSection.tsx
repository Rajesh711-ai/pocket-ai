import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Tags, 
  FolderOpen, 
  Eye, 
  BookOpen, 
  Save, 
  Sparkles,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface NotesSectionProps {
  currentUser: any;
}

export default function NotesSection({ currentUser }: NotesSectionProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  // Note Form
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Personal');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [currentUser.id]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notes?userId=${currentUser.id}`);
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewNote = () => {
    setActiveNoteId(null);
    setTitle('Untitled Secure Note');
    setContent('# New Markdown Document\n\nWrite your encrypted note contents here...');
    setCategory('General');
    setTags(['new']);
    setTagInput('');
    setIsEditing(true);
    setViewMode('edit');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSaveNote = async () => {
    if (!title.trim()) return;

    try {
      setSaveStatus('COMMITTING WRITE...');
      const payload: any = {
        userId: currentUser.id,
        title,
        content,
        category,
        tags
      };
      if (activeNoteId) payload.id = activeNoteId;

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Data save interrupted.');
      
      const data = await res.json();
      setSaveStatus('✓ SAVED TO DISK');
      
      // Update local state smoothly
      if (!activeNoteId) {
        setActiveNoteId(data.note.id);
      }
      
      fetchNotes();
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err: any) {
      setSaveStatus(`ERROR: ${err.message}`);
    }
  };

  const handleEditNote = (note: any) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setTags(note.tags || []);
    setTagInput('');
    setIsEditing(true);
    setViewMode('edit');
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Erase this encrypted note permanently? This action is zero-recoverable.')) return;

    try {
      const res = await fetch(`/api/notes/${id}?userId=${currentUser.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (activeNoteId === id) {
          setIsEditing(false);
          setActiveNoteId(null);
        }
        fetchNotes();
      }
    } catch (err) {
      alert('Delete failed.');
    }
  };

  // Beautiful simple offline Markdown Renderer
  const renderMarkdown = (md: string) => {
    if (!md) return <p className="text-gray-500 italic">No content written.</p>;

    const lines = md.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-display font-bold text-white border-b border-slate-800 pb-2 mt-4 mb-2">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-display font-semibold text-blue-400 mt-4 mb-1">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-display font-bold text-gray-200 mt-3 mb-1">{line.replace('### ', '')}</h3>;
      }
      // Bullet items
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} className="ml-4 list-disc text-xs text-gray-300 py-0.5 font-sans">{line.replace(/^[-*]\s+/, '')}</li>;
      }
      // Check list
      if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        const checked = line.startsWith('- [x] ');
        return (
          <div key={idx} className="flex items-center gap-2 text-xs py-1">
            <input type="checkbox" readOnly checked={checked} className="rounded accent-blue-500" />
            <span className={checked ? 'line-through text-gray-500' : 'text-gray-300'}>{line.substring(6)}</span>
          </div>
        );
      }
      // Code block
      if (line.startsWith('```')) {
        return null; // For simplicity we skip full block backticks lines or draw them uniquely
      }
      // Inline formatting
      let formattedLine: React.ReactNode = line;
      if (line.includes('**')) {
        const parts = line.split('**');
        formattedLine = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-blue-300 font-bold">{part}</strong> : part);
      }

      return <p key={idx} className="text-xs text-gray-300 leading-relaxed py-1 font-sans">{formattedLine}</p>;
    });
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || n.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="notes_section_container">
      {/* Sidebar: Notes Navigation and search */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col h-[580px]">
        <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
          <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            Local Notebook
          </h3>
          <button 
            id="notes_create_new_btn"
            onClick={handleCreateNewNote}
            className="p-1.5 bg-indigo-600/25 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded border border-indigo-500/20 cursor-pointer transition-all"
            title="Create new note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              id="notes_search_input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search secure notebook..."
              className="w-full glass-input pl-9 pr-3 py-2 rounded-lg font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-mono">Category:</span>
            <select 
              id="notes_category_filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="glass-input px-2 py-1 rounded bg-zinc-900 text-white border border-white/10 focus:outline-none flex-1 text-xs"
            >
              <option value="All" className="bg-zinc-950 text-white">All Categories</option>
              <option value="General" className="bg-zinc-950 text-white">General</option>
              <option value="Personal" className="bg-zinc-950 text-white">Personal</option>
              <option value="Work" className="bg-zinc-950 text-white">Work</option>
              <option value="College Presentation" className="bg-zinc-950 text-white">College Presentation</option>
              <option value="Encrypted Vaults" className="bg-zinc-950 text-white">Encrypted Vaults</option>
            </select>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-mono text-xs">WAKING RAM SEED STORAGE...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-mono text-xs">No secure notes indexed.</div>
          ) : (
            filteredNotes.map((n) => (
              <div 
                key={n.id}
                id={`note_item_${n.id}`}
                onClick={() => handleEditNote(n)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                  activeNoteId === n.id && isEditing
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-white truncate flex-1">{n.title}</h4>
                  <button 
                    id={`note_delete_btn_${n.id}`}
                    onClick={(e) => handleDeleteNote(n.id, e)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-sans truncate">{n.content.replace(/#|\*|`|-/g, '')}</p>
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase">{n.category}</span>
                  <span className="text-gray-500">{new Date(n.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main workspace: Note form or editor */}
      <div className="xl:col-span-2 glass-panel p-5 rounded-2xl flex flex-col h-[580px] relative overflow-hidden">
        {isEditing ? (
          <div className="flex flex-col h-full space-y-4">
            {/* Action panel */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10">
                  <button 
                    id="note_view_edit_btn"
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1 text-[10px] font-mono rounded-md transition-all cursor-pointer ${viewMode === 'edit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Edit3 className="w-3.5 h-3.5 inline-block mr-1" />
                    EDITOR
                  </button>
                  <button 
                    id="note_view_preview_btn"
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1 text-[10px] font-mono rounded-md transition-all cursor-pointer ${viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    <BookOpen className="w-3.5 h-3.5 inline-block mr-1" />
                    PREVIEW
                  </button>
                </div>
                {saveStatus && (
                  <span className="text-[10px] font-mono text-emerald-400 animate-pulse">{saveStatus}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  id="note_save_btn"
                  onClick={handleSaveNote}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/25"
                >
                  <Save className="w-3.5 h-3.5" />
                  SAVE NOTE
                </button>
              </div>
            </div>

            {/* Editing/Preview panels */}
            {viewMode === 'edit' ? (
              <div className="flex-1 flex flex-col space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono">NOTE TITLE</label>
                    <input 
                      id="note_form_title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Secure Note Title"
                      className="w-full bg-transparent border-b border-white/10 text-sm font-bold text-white py-1 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono">CATEGORY</label>
                    <select 
                      id="note_form_category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg text-xs text-white py-1 px-2 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="General" className="bg-zinc-950 text-white">General</option>
                      <option value="Personal" className="bg-zinc-950 text-white">Personal</option>
                      <option value="Work" className="bg-zinc-950 text-white">Work</option>
                      <option value="College Presentation" className="bg-zinc-950 text-white">College Presentation</option>
                      <option value="Encrypted Vaults" className="bg-zinc-950 text-white">Encrypted Vaults</option>
                    </select>
                  </div>
                </div>

                {/* Editor Textarea */}
                <textarea 
                  id="note_form_content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Markdown syntax: # Header, ## Sub, - Bullet, - [ ] Checklist item..."
                  className="flex-1 w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:border-indigo-500 focus:outline-none"
                />

                {/* Tag engine */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[9px] font-mono text-slate-400 flex items-center gap-1">
                        {t}
                        <button type="button" onClick={() => handleRemoveTag(t)} className="text-slate-500 hover:text-rose-400 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                  <input 
                    id="note_form_tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type tag name and hit Enter..."
                    className="w-full glass-input px-3 py-1.5 rounded-lg text-xs"
                  />
                </div>
              </div>
            ) : (
              /* Preview Markdown view */
              <div className="flex-1 overflow-y-auto bg-black/20 rounded-xl p-5 border border-white/5 prose prose-invert prose-sm max-w-none">
                <h1 className="text-2xl font-display font-bold text-white border-b border-white/10 pb-2 mb-4">{title}</h1>
                <div className="space-y-1">
                  {renderMarkdown(content)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <FileText className="w-10 h-10 stroke-1 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-white text-base">Encrypted Scratchpad</h3>
              <p className="text-slate-400 text-xs font-sans max-w-sm">
                Select a secure note from your local notebook directory or create a new document in RAM cache.
              </p>
            </div>
            <button 
              id="notes_workspace_create_btn"
              onClick={handleCreateNewNote}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer"
            >
              CREATE NEW ENCRYPTED NOTE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
