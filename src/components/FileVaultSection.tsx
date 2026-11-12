import React, { useState, useEffect } from 'react';
import { 
  FolderLock, 
  UploadCloud, 
  File, 
  Trash2, 
  Eye, 
  Download, 
  ScanText, 
  Sparkles,
  Clipboard,
  Check,
  AlertTriangle,
  Lock,
  Search,
  FileSpreadsheet,
  FileImage,
  FileText,
  Terminal,
  FileAudio,
  FileVideo,
  X,
  ShieldCheck,
  Maximize2,
  EyeOff,
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface FileVaultSectionProps {
  currentUser: any;
}

export default function FileVaultSection({ currentUser }: FileVaultSectionProps) {
  const [activeTab, setActiveTab] = useState<'vault' | 'ocr'>('vault');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // File upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // OCR state
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string>('');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Decryption preview modal
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // New features state
  const [fileCategoryFilter, setFileCategoryFilter] = useState<'all' | 'images' | 'documents' | 'audio' | 'video' | 'other'>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [currentUser.id]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/files?userId=${currentUser.id}`);
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error('Failed to load file records:', err);
      showToast('Error reading database file ledger.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Convert File to base64
  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleEncryptUpload = async () => {
    if (!selectedFile) return;

    if (selectedFile.size > 40 * 1024 * 1024) {
      showToast('File size is too large (40MB limit for browser environment).', 'error');
      return;
    }

    try {
      setUploadStatus('CONVERTING_TO_BINARY...');
      const base64 = await toBase64(selectedFile);
      
      setUploadStatus('ENCRYPTING_PAYLOAD...');
      const payload = {
        userId: currentUser.id,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        fileSize: selectedFile.size,
        rawBase64: base64
      };

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Encryption write pipeline broke.');

      setSelectedFile(null);
      setUploadStatus('');
      showToast('File successfully encrypted & locked with AES-256.', 'success');
      fetchFiles();
    } catch (err: any) {
      setUploadStatus(`ERROR: ${err.message}`);
      showToast('Encryption writing failed.', 'error');
    }
  };

  const handleDecryptView = async (fileId: string) => {
    try {
      setPreviewLoading(true);
      const res = await fetch(`/api/files/download/${fileId}?userId=${currentUser.id}`);
      if (!res.ok) throw new Error();
      const decrypted = await res.json();
      setPreviewFile(decrypted);
      setIsModalOpen(true);
      showToast('AES-256 payload decrypted into local secure sandbox.', 'success');
    } catch (err) {
      showToast('Decryption pipeline failed.', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadDecrypted = (file: any) => {
    try {
      // Decode base64 to blob
      const base64Str = file.rawBase64.split(',')[1] || file.rawBase64;
      const binary = atob(base64Str);
      const array = [];
      for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      const blob = new Blob([new Uint8Array(array)], { type: file.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded decrypted memory stream.', 'success');
    } catch (err) {
      showToast('Error recreating file stream.', 'error');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}?userId=${currentUser.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('File permanently wiped from local ledger.', 'success');
        fetchFiles();
        if (previewFile && previewFile.id === fileId) {
          setPreviewFile(null);
          setIsModalOpen(false);
        }
      } else {
        showToast('Failed to shred file record.', 'error');
      }
    } catch (err) {
      showToast('Error communicating with shredder pipeline.', 'error');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // OCR methods
  const handleOcrFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOcrFile(file);
      const base64 = await toBase64(file);
      setOcrImagePreview(base64);
    }
  };

  const triggerOCR = async () => {
    if (!ocrFile || !ocrImagePreview) return;

    try {
      setOcrLoading(true);
      setOcrResult('');
      setOcrConfidence(null);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          fileName: ocrFile.name,
          rawBase64: ocrImagePreview
        })
      });

      if (!res.ok) throw new Error('OCR Local Pipeline errored.');

      const data = await res.json();
      setOcrResult(data.text);
      setOcrConfidence(data.confidence);
      showToast('OCR extraction completed.', 'success');
    } catch (err: any) {
      setOcrResult(`OCR PROCESSING FAILURE: ${err.message}`);
      showToast('OCR extraction pipeline failed.', 'error');
    } finally {
      setOcrLoading(false);
    }
  };

  const copyOcrOutput = () => {
    navigator.clipboard.writeText(ocrResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryOfFile = (mimeType: string, fileName: string): 'images' | 'documents' | 'audio' | 'video' | 'other' => {
    const mime = (mimeType || '').toLowerCase();
    const name = (fileName || '').toLowerCase();
    if (mime.startsWith('image/')) return 'images';
    if (
      mime.includes('pdf') || 
      mime.includes('text') || 
      mime.includes('csv') || 
      mime.includes('document') || 
      mime.includes('sheet') || 
      mime.includes('excel') || 
      mime.includes('word') || 
      mime.includes('presentation') || 
      mime.includes('powerpoint') ||
      name.endsWith('.pdf') ||
      name.endsWith('.txt') ||
      name.endsWith('.md') ||
      name.endsWith('.csv') ||
      name.endsWith('.docx') ||
      name.endsWith('.xlsx') ||
      name.endsWith('.pptx')
    ) return 'documents';
    if (mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a') || name.endsWith('.ogg')) return 'audio';
    if (mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.avi') || name.endsWith('.webm')) return 'video';
    return 'other';
  };

  const getFileIcon = (mimeType: string, fileName: string) => {
    const cat = getCategoryOfFile(mimeType, fileName);
    if (cat === 'images') return <FileImage className="w-5 h-5 text-purple-400" />;
    if (cat === 'documents') return <FileText className="w-5 h-5 text-rose-400" />;
    if (cat === 'audio') return <FileAudio className="w-5 h-5 text-amber-400" />;
    if (cat === 'video') return <FileVideo className="w-5 h-5 text-indigo-400" />;
    return <File className="w-5 h-5 text-sky-400" />;
  };

  const getTextContent = (file: any): string => {
    try {
      const base64Str = file.rawBase64.split(',')[1] || file.rawBase64;
      const binary = atob(base64Str);
      return decodeURIComponent(escape(binary));
    } catch (e) {
      return "Unable to decode text payload streams directly. Download the file using the button below to view.";
    }
  };

  // Combined search and category filtering
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    if (fileCategoryFilter === 'all') return matchesSearch;
    const cat = getCategoryOfFile(f.mimeType, f.fileName);
    return matchesSearch && cat === fileCategoryFilter;
  });

  return (
    <div className="space-y-6 relative" id="file_vault_container">
      {/* Toast Notifications */}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-mono font-bold shadow-lg shadow-black/40 animate-fade-in ${
          notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' :
          notification.type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-400' :
          'bg-indigo-950/90 border-indigo-500/30 text-indigo-400'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : notification.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          ) : (
            <Info className="w-4 h-4 text-indigo-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* File Vault tab header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-3">
        <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10">
          <button 
            id="tab_vault_btn"
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-1.5 text-xs font-mono rounded-md transition-all cursor-pointer ${activeTab === 'vault' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <FolderLock className="w-4 h-4 inline-block mr-1.5" />
            File Vault (AES-256)
          </button>
          <button 
            id="tab_ocr_btn"
            onClick={() => setActiveTab('ocr')}
            className={`px-4 py-1.5 text-xs font-mono rounded-md transition-all cursor-pointer ${activeTab === 'ocr' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <ScanText className="w-4 h-4 inline-block mr-1.5" />
            OCR Document Reader
          </button>
        </div>

        <div className="text-right">
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
            LOCAL AES STORAGE LAYER
          </span>
        </div>
      </div>

      {activeTab === 'vault' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File upload drag drop zone */}
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                  Encrypt & Lock Files
                </h3>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Protect any photos, PDF folders, text records, audio tracks, spreadsheets, or archives.
                </p>
              </div>

              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px] ${
                  isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-black/40 hover:border-white/20'
                }`}
                onClick={() => document.getElementById('vault_file_picker')?.click()}
              >
                <input 
                  id="vault_file_picker"
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FolderLock className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-xs font-bold text-slate-300">DRAG & DROP SECURE FILE</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">supports Photos, Docs, Audio, Video & Binaries</p>
                {selectedFile && (
                  <div className="mt-4 p-2 bg-indigo-500/5 border border-indigo-500/20 rounded-lg text-left text-xs space-y-1 w-full font-mono text-slate-300">
                    <p className="truncate text-indigo-300">File: {selectedFile.name}</p>
                    <p className="text-[10px] text-slate-500">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-indigo-500/10 rounded text-[9px] uppercase font-bold text-indigo-400">
                      Detected: {getCategoryOfFile(selectedFile.type, selectedFile.name)}
                    </span>
                  </div>
                )}
              </div>

              {uploadStatus && (
                <p className="text-[10px] text-indigo-400 font-mono text-center animate-pulse">{uploadStatus}</p>
              )}

              <button 
                id="vault_encrypt_btn"
                onClick={handleEncryptUpload}
                disabled={!selectedFile || uploadStatus.startsWith('CONVERTING') || uploadStatus.startsWith('ENCRYPTING')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950/40 disabled:text-indigo-800 text-white rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Lock className="w-4 h-4" />
                EXECUTE AES-256 WRITE
              </button>
            </div>
            
            {/* Direct Quick Preview Card */}
            {previewFile && !isModalOpen && (
              <div className="glass-panel p-5 rounded-2xl space-y-4 relative overflow-hidden border-emerald-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <h4 className="font-display font-bold text-emerald-400 text-sm uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Decrypted Buffer Active
                  </h4>
                  <button 
                    onClick={() => setPreviewFile(null)}
                    className="text-gray-500 hover:text-white font-mono text-[10px] cursor-pointer"
                  >
                    Purge RAM
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-black/60 rounded-lg border border-white/5 font-mono text-xs space-y-1">
                    <p className="text-white truncate font-bold">{previewFile.fileName}</p>
                    <p className="text-[10px] text-slate-500">MIME: {previewFile.mimeType}</p>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline block pt-1.5 flex items-center gap-1"
                    >
                      <Maximize2 className="w-3 h-3" />
                      Open Full Interactive Reader
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      id="vault_preview_download_btn"
                      onClick={() => handleDownloadDecrypted(previewFile)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md shadow-emerald-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DOWNLOAD FILE
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Files List ledger */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col min-h-[400px]">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-4 mb-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
                  <FolderLock className="w-5 h-5 text-indigo-400" />
                  Protected Vault Index
                </h3>
                
                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    id="vault_search_input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search file name..."
                    className="w-full glass-input pl-9 pr-3 py-2 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              {/* Categorizers Filters row */}
              <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-xl border border-white/10 w-max max-w-full overflow-x-auto">
                {[
                  { id: 'all', label: 'All Files', icon: FolderLock },
                  { id: 'images', label: 'Photos', icon: FileImage },
                  { id: 'documents', label: 'Docs', icon: FileText },
                  { id: 'audio', label: 'Audio', icon: FileAudio },
                  { id: 'video', label: 'Video', icon: FileVideo },
                  { id: 'other', label: 'Other', icon: Terminal },
                ].map((cat) => {
                  const CatIcon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFileCategoryFilter(cat.id as any)}
                      className={`px-3 py-1 text-[11px] font-mono rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                        fileCategoryFilter === cat.id 
                          ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 pr-1">
              {loading ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">QUERYING SECURE REGISTERS...</div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-mono text-xs flex flex-col items-center justify-center space-y-2">
                  <FolderLock className="w-12 h-12 stroke-1 text-slate-700" />
                  <span>No matching encrypted files found.</span>
                </div>
              ) : (
                filteredFiles.map((f) => (
                  <div key={f.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3.5 bg-white/[0.02] rounded-xl border border-white/10 hover:border-white/20 transition-all gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="p-2.5 bg-black/40 rounded-lg border border-white/10">
                        {getFileIcon(f.mimeType, f.fileName)}
                      </div>
                      <div className="space-y-0.5 truncate flex-1 md:max-w-md">
                        <p className="text-sm font-bold text-white truncate">{f.fileName}</p>
                        <div className="flex flex-wrap items-center gap-x-3 text-[10px] font-mono text-slate-500">
                          <span>{(f.fileSize / 1024).toFixed(1)} KB</span>
                          <span className="text-white/20">|</span>
                          <span className="truncate">{f.mimeType}</span>
                          <span className="text-white/20">|</span>
                          <span className="text-indigo-400 uppercase font-bold text-[9px]">
                            {getCategoryOfFile(f.mimeType, f.fileName)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end font-mono text-xs">
                      <span className="text-[10px] text-slate-500 mr-2">{new Date(f.uploadedAt).toLocaleDateString()}</span>
                      
                      {deleteConfirmId === f.id ? (
                        <div className="bg-rose-950/40 border border-rose-500/20 px-2.5 py-1 rounded-lg flex items-center gap-2 animate-pulse">
                          <span className="text-rose-400 font-bold text-[10px]">SHRED FILE?</span>
                          <button 
                            onClick={() => handleDeleteFile(f.id)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[10px]"
                          >
                            YES
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded text-[10px]"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            id={`vault_decrypt_btn_${f.id}`}
                            onClick={() => handleDecryptView(f.id)}
                            disabled={previewLoading}
                            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-400 hover:text-indigo-300 rounded font-bold cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            DECRYPT
                          </button>

                          <button 
                            id={`vault_delete_btn_${f.id}`}
                            onClick={() => setDeleteConfirmId(f.id)}
                            className="p-1.5 bg-black/40 hover:bg-rose-950/30 border border-white/10 hover:border-rose-500/20 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                            title="Shred record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* OCR Section view */
        <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
          
          {/* Upload doc area */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
              <ScanText className="w-4 h-4 text-indigo-400" />
              Scanned Document Reader
            </h3>
            <p className="text-slate-400 text-xs font-sans">
              Drag and drop an image (JPEG, PNG) or photo of a scanned note/invoice. The local sandbox OCR engine extracts the text completely offline.
            </p>

            <div 
              className="border-2 border-dashed border-white/10 bg-black/40 hover:border-white/20 rounded-xl p-6 text-center transition-all cursor-pointer min-h-[220px] flex flex-col items-center justify-center"
              onClick={() => document.getElementById('ocr_file_picker')?.click()}
            >
              <input 
                id="ocr_file_picker"
                type="file"
                accept="image/*"
                onChange={handleOcrFileSelect}
                className="hidden"
              />
              <ScanText className="w-10 h-10 text-slate-500 mb-3 animate-pulse" />
              <p className="text-xs font-bold text-slate-300">UPLOAD SCAN / IMAGE</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">supports standard image files</p>
              
              {ocrFile && (
                <p className="mt-2 text-xs font-mono text-indigo-300 font-bold truncate max-w-xs">{ocrFile.name}</p>
              )}
            </div>

            {ocrImagePreview && (
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10">
                <p className="text-[10px] text-slate-500 font-mono mb-2 uppercase">Image Cache Frame Preview</p>
                <img 
                  src={ocrImagePreview} 
                  alt="OCR preview" 
                  className="max-h-48 rounded object-contain border border-white/10 w-full bg-black/40"
                />
              </div>
            )}

            <button 
              id="ocr_run_btn"
              onClick={triggerOCR}
              disabled={!ocrFile || ocrLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950/40 disabled:text-indigo-800 text-white rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <Sparkles className="w-4 h-4" />
              RUN OFFLINE OCR INFERENCE
            </button>
          </div>

          {/* Results Doc area */}
          <div className="flex flex-col min-h-[350px] p-5 bg-black/40 rounded-xl border border-white/10">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                OCR Extracted Ledger Output
              </span>
              {ocrConfidence && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                  CONFIDENCE: {ocrConfidence}%
                </span>
              )}
            </div>

            {ocrLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-400">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>PERFORMING LOCAL STRUCTURAL SPECTRUM MATCHING...</span>
              </div>
            ) : ocrResult ? (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <textarea 
                  readOnly
                  value={ocrResult}
                  className="flex-1 w-full bg-white/[0.02] border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-300 resize-none outline-none leading-relaxed min-h-[250px]"
                />
                
                <button 
                  id="ocr_copy_btn"
                  onClick={copyOcrOutput}
                  className="py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded font-mono text-xs font-bold border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                  {copied ? 'COPIED TO STORAGE' : 'COPY EXTRACTED TEXT'}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs space-y-2">
                <ScanText className="w-10 h-10 stroke-1 text-slate-700" />
                <span>Upload a document to view character outputs.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stunning Interactive Decrypted Reader Overlay Modal */}
      {isModalOpen && previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-4 my-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-3 relative z-10">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 w-max">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  DECRYPTED SECURE CONTAINER
                </span>
                <h3 className="font-display font-bold text-white text-base truncate max-w-md mt-1.5">{previewFile.fileName}</h3>
                <p className="text-[10px] text-slate-500 font-mono">Size: {(previewFile.fileSize/1024).toFixed(1)} KB | Type: {previewFile.mimeType}</p>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setPreviewFile(null);
                }}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer Content based on Type */}
            <div className="relative z-10 bg-black/40 rounded-xl border border-white/5 p-4 min-h-[220px] flex items-center justify-center max-h-[400px] overflow-y-auto">
              {getCategoryOfFile(previewFile.mimeType, previewFile.fileName) === 'images' ? (
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src={previewFile.rawBase64} 
                    alt={previewFile.fileName} 
                    className="max-h-[320px] rounded-lg object-contain w-full select-none" 
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">AES-256 Photo Decrypted Successfully</span>
                </div>
              ) : getCategoryOfFile(previewFile.mimeType, previewFile.fileName) === 'audio' ? (
                <div className="w-full text-center space-y-3 py-6">
                  <FileAudio className="w-16 h-16 text-amber-400 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-400 font-mono">Secure Audio Playback Interface</p>
                  <audio src={previewFile.rawBase64} controls className="w-full max-w-md mx-auto" />
                </div>
              ) : getCategoryOfFile(previewFile.mimeType, previewFile.fileName) === 'video' ? (
                <div className="w-full text-center space-y-3">
                  <video src={previewFile.rawBase64} controls className="w-full max-h-[280px] rounded-lg bg-black/60 mx-auto" />
                  <span className="text-[10px] text-slate-500 font-mono">AES-256 Secure Video Player</span>
                </div>
              ) : (previewFile.mimeType.startsWith('text/') || previewFile.mimeType === 'application/json' || previewFile.fileName.endsWith('.json') || previewFile.fileName.endsWith('.txt') || previewFile.fileName.endsWith('.md') || previewFile.fileName.endsWith('.csv')) ? (
                <div className="w-full">
                  <textarea 
                    readOnly
                    value={getTextContent(previewFile)}
                    className="w-full min-h-[250px] bg-black/40 border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-300 resize-none outline-none leading-relaxed"
                  />
                </div>
              ) : (
                <div className="text-center space-y-3 py-6">
                  <FolderLock className="w-16 h-16 text-indigo-400 mx-auto" />
                  <p className="text-xs font-mono text-slate-400">Binary Document Preview Unsupported</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto">This binary format can only be previewed by downloading it to your local file system.</p>
                </div>
              )}
            </div>

            {/* Footer / Controls */}
            <div className="flex gap-3 pt-2 relative z-10">
              <button 
                onClick={() => handleDownloadDecrypted(previewFile)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                DOWNLOAD DECRYPTED FILE
              </button>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setPreviewFile(null);
                  showToast('Decrypted memory buffer cleared immediately.', 'info');
                }}
                className="px-4 py-2.5 bg-white/5 hover:bg-rose-950/25 border border-white/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer"
              >
                <EyeOff className="w-4 h-4 inline-block mr-1.5" />
                CLOSE & RE-LOCK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
