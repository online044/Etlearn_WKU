import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FolderDown, 
  Trash2, 
  FileText, 
  BookOpen, 
  GraduationCap, 
  X, 
  HardDrive, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  getOfflineStorageOverview, 
  deleteDownloadedNote, 
  deleteDownloadedExam, 
  deleteDownloadedPdf, 
  formatStorageBytes,
  syncOfflineProgressWithSupabase,
  OfflineStorageOverview
} from '../utils/offlineManager';

interface OfflineDownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'am';
  onOpenItem?: (type: 'note' | 'exam' | 'book', id: string, title: string) => void;
}

export const OfflineDownloadsModal: React.FC<OfflineDownloadsModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
  onOpenItem
}) => {
  const [overview, setOverview] = useState<OfflineStorageOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'exams' | 'books'>('all');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const isAm = language === 'am';

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOfflineStorageOverview();
      setOverview(data);
    } catch (e) {
      console.warn('[OfflineDownloadsModal] load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleDelete = async (type: 'note' | 'exam' | 'pdf', id: string) => {
    if (type === 'note') await deleteDownloadedNote(id);
    else if (type === 'exam') await deleteDownloadedExam(id);
    else if (type === 'pdf') await deleteDownloadedPdf(id);
    await loadData();
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncOfflineProgressWithSupabase();
      if (res.syncedCount > 0) {
        setSyncMessage(isAm ? `${res.syncedCount} የትምህርት ሂደቶች ተመሳስለዋል!` : `Synced ${res.syncedCount} offline records to Supabase!`);
      } else {
        setSyncMessage(isAm ? 'ሁሉም መረጃዎች ቀድመው ተመሳስለዋል' : 'All progress is already synchronized');
      }
    } catch {
      setSyncMessage(isAm ? 'የማመሳሰል ስህተት ተከስቷል' : 'Failed to synchronize with Supabase');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#0F172A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isAm ? 'ያለ ዳታ የወረዱ ማስታወሻዎች እና ፈተናዎች' : 'Offline Download Manager'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAm 
                  ? `${overview?.totalItems || 0} የተቀመጡ ፋይሎች • ${overview?.formattedTotal || '0 B'} ጥቅም ላይ ውሏል` 
                  : `${overview?.totalItems || 0} cached items • ${overview?.formattedTotal || '0 B'} in storage`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-white/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            {typeof navigator !== 'undefined' && navigator.onLine ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Wifi className="w-3.5 h-3.5" />
                {isAm ? 'ኦንላይን' : 'Online'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                {isAm ? 'ያለ ዳታ (ኦፍላይን)' : 'Offline'}
              </span>
            )}
            <span className="text-slate-500">|</span>
            <span className="text-[11px] text-slate-400">
              {isAm ? 'IndexedDB ደህንነቱ የተጠበቀ ማከማቻ' : 'IndexedDB Local Persistence'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncing}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? (isAm ? 'በማመሳሰል ላይ...' : 'Syncing...') : (isAm ? 'አመሳስል' : 'Sync Supabase')}</span>
          </button>
        </div>

        {syncMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 p-2 mx-5 mt-3 bg-slate-950/60 rounded-xl border border-white/5 text-xs font-bold text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 rounded-lg transition ${activeTab === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'hover:text-white'}`}
          >
            {isAm ? 'ሁሉም' : 'All'} ({overview?.totalItems || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-1.5 rounded-lg transition ${activeTab === 'notes' ? 'bg-amber-500 text-slate-950 font-black' : 'hover:text-white'}`}
          >
            {isAm ? 'ማስታወሻዎች' : 'Notes'} ({overview?.notesCount || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exams')}
            className={`flex-1 py-1.5 rounded-lg transition ${activeTab === 'exams' ? 'bg-amber-500 text-slate-950 font-black' : 'hover:text-white'}`}
          >
            {isAm ? 'ፈተናዎች' : 'Exams'} ({overview?.examsCount || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('books')}
            className={`flex-1 py-1.5 rounded-lg transition ${activeTab === 'books' ? 'bg-amber-500 text-slate-950 font-black' : 'hover:text-white'}`}
          >
            PDF ({overview?.pdfsCount || 0})
          </button>
        </div>

        {/* Content List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {(!overview || overview.totalItems === 0) ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <HardDrive className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-sm text-slate-300">
                {isAm ? 'ምንም የወረደ ይዘት አልተገኘም' : 'No offline content downloaded yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAm 
                  ? 'በማንኛውም ማስታወሻ ወይም የፈተና ጥያቄ ላይ "Download for Offline" የሚለውን በመጫን ያለ ኢንተርኔት ይጠቀሙ' 
                  : 'Click the offline download button on any note, exam paper, or textbook to study anywhere without internet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Notes List */}
              {(activeTab === 'all' || activeTab === 'notes') && overview.notes.map(note => (
                <div 
                  key={`note-${note.id}`}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-amber-500/30 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs truncate">{note.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {note.subject} • {formatStorageBytes(note.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenItem && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenItem('note', note.id, note.title);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <span>{isAm ? 'ክፈት' : 'Open'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete('note', note.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                      title={isAm ? 'አጥፋ' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Exams List */}
              {(activeTab === 'all' || activeTab === 'exams') && overview.exams.map(exam => (
                <div 
                  key={`exam-${exam.id}`}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-amber-500/30 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs truncate">{exam.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {exam.subject} • {exam.totalQuestions} Questions • {formatStorageBytes(exam.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenItem && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenItem('exam', exam.id, exam.title);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <span>{isAm ? 'ክፈት' : 'Open'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete('exam', exam.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                      title={isAm ? 'አጥፋ' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Books / PDFs List */}
              {(activeTab === 'all' || activeTab === 'books') && overview.pdfs.map(pdf => (
                <div 
                  key={`pdf-${pdf.id}`}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-amber-500/30 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs truncate">{pdf.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        PDF • {formatStorageBytes(pdf.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenItem && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenItem('book', pdf.id, pdf.title);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <span>{isAm ? 'ክፈት' : 'Open'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete('pdf', pdf.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                      title={isAm ? 'አጥፋ' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">EthioLearn Progressive Web App &bull; Offline Shield</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition cursor-pointer"
          >
            {isAm ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
