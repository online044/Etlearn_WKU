import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Plus, Search, Pin, PinOff, Trash2, Edit3, Check, X, 
  Download, Clock, ChevronRight, Sparkles, BookOpen, GraduationCap, 
  Share2, ArrowLeft, MoreVertical
} from 'lucide-react';
import { SavedChatSession } from '../types';
import { playClickChime, playSuccessChime } from '../utils/audio';

interface SavedChatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: SavedChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onTogglePinSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  isAmharic: boolean;
}

export default function SavedChatsDrawer({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onTogglePinSession,
  onRenameSession,
  isAmharic
}: SavedChatsDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Filtered and grouped sessions
  const filteredSessions = sessions.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.messages.some(m => m.content.toLowerCase().includes(q))
    );
  });

  const pinnedSessions = filteredSessions.filter(s => s.isPinned);
  const unpinnedSessions = filteredSessions.filter(s => !s.isPinned);

  // Group unpinned sessions chronologically
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const todaySessions: SavedChatSession[] = [];
  const yesterdaySessions: SavedChatSession[] = [];
  const previous7DaysSessions: SavedChatSession[] = [];
  const olderSessions: SavedChatSession[] = [];

  unpinnedSessions.forEach(s => {
    const timestamp = new Date(s.updatedAt || s.createdAt).getTime();
    if (timestamp >= todayStart) {
      todaySessions.push(s);
    } else if (timestamp >= yesterdayStart) {
      yesterdaySessions.push(s);
    } else if (timestamp >= weekStart) {
      previous7DaysSessions.push(s);
    } else {
      olderSessions.push(s);
    }
  });

  const handleStartRename = (session: SavedChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitleValue(session.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (sessionId: string, e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editTitleValue.trim()) {
      onRenameSession(sessionId, editTitleValue.trim());
      playSuccessChime();
    }
    setEditingId(null);
  };

  const handleExportSession = (session: SavedChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickChime();
    const formatted = `# EthioLearn Pro - Ask Teacher Session\n**Topic:** ${session.title}\n**Subject:** ${session.subject}\n**Date:** ${new Date(session.createdAt).toLocaleString()}\n\n---\n\n` +
      session.messages
        .map(m => `### ${m.role === 'user' ? 'Student' : 'Ask Teacher AI'}\n${m.content}\n\n`)
        .join('');

    const blob = new Blob([formatted], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_Transcript.md`;
    link.click();
    URL.revokeObjectURL(url);
    setMenuOpenId(null);
  };

  const renderSessionItem = (session: SavedChatSession) => {
    const isActive = session.id === activeSessionId;
    const isEditing = editingId === session.id;
    const isMenuOpen = menuOpenId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => {
          if (!isEditing) {
            onSelectSession(session);
            onClose();
          }
        }}
        className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
          isActive
            ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
            : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800/80 text-slate-300 hover:text-white'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400 group-hover:text-amber-400'
          }`}>
            <MessageSquare className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <form onSubmit={(e) => handleSaveRename(session.id, e)} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  autoFocus
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-full bg-slate-950 text-white text-xs px-2 py-1 rounded border border-amber-500/60 outline-none"
                />
                <button
                  type="button"
                  onClick={(e) => handleSaveRename(session.id, e)}
                  className="p-1 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold truncate leading-snug">
                    {session.title || (isAmharic ? 'አዲስ ውይይት' : 'Untitled Chat')}
                  </p>
                  {session.isPinned && (
                    <Pin className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 truncate">
                  <span className="text-amber-400/90 font-medium truncate max-w-[110px]">
                    {session.subject}
                  </span>
                  <span>•</span>
                  <span>{session.messages.length} {isAmharic ? 'መልእክቶች' : 'msgs'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        {!isEditing && (
          <div className="flex items-center gap-1 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(isMenuOpen ? null : session.id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Session options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 z-30 w-40 rounded-xl bg-[#0F172A] border border-slate-700 shadow-xl p-1.5 space-y-0.5 text-xs text-slate-300"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePinSession(session.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left"
                  >
                    {session.isPinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAmharic ? 'ፒን አንሳ' : 'Unpin Chat'}</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAmharic ? 'ፒን አድርግ' : 'Pin to Top'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => handleStartRename(session, e)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isAmharic ? 'ስም ቀይር' : 'Rename'}</span>
                  </button>

                  <button
                    onClick={(e) => handleExportSession(session, e)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isAmharic ? 'አውርድ (MD)' : 'Export Markdown'}</span>
                  </button>

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(isAmharic ? 'ይህንን ውይይት መሰረዝ ይፈልጋሉ?' : 'Delete this chat conversation permanently?')) {
                        onDeleteSession(session.id);
                      }
                      setMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'ሰርዝ' : 'Delete Chat'}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex">
          {/* Backdrop for all screen sizes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative z-50 w-[90vw] max-w-[380px] sm:w-96 bg-[#0A1128] border-r border-slate-800 flex flex-col shadow-2xl h-full select-none"
          >
            {/* Drawer Header with Prominent Back Button */}
            <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-[#0C152E] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={onClose}
                  className="p-2 -ml-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                  title={isAmharic ? 'ወደ ውይይት ተመለስ' : 'Back to Chat'}
                >
                  <ArrowLeft className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold">{isAmharic ? 'ተመለስ' : 'Back'}</span>
                </button>

                <div className="min-w-0 pl-1">
                  <h3 className="text-sm font-bold text-white truncate leading-tight flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{isAmharic ? 'የተቀመጡ ውይይቶች' : 'Saved Chats'}</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    {sessions.length} {isAmharic ? 'ውይይቶች' : 'sessions'}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer shrink-0 active:scale-95"
                title={isAmharic ? 'ዝጋ' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Primary Action */}
            <div className="p-3 border-b border-slate-800/80 bg-[#0A1128]">
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/15 cursor-pointer transition-all active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isAmharic ? 'አዲስ ውይይት ጀምር' : 'New Chat Session'}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="px-3 pt-3 pb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAmharic ? 'ውይይት ፈልግ...' : 'Search past chats...'}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400">
                    {searchQuery 
                      ? (isAmharic ? 'ምንም የተገኘ ውይይት የለም' : 'No matching chats found')
                      : (isAmharic ? 'እስካሁን የተቀመጠ ውይይት የለም' : 'No saved chats yet')}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {isAmharic 
                      ? 'ከአይ መምህር ጋር የሚያደርጓቸው ውይይቶች እዚህ በራስ-ሰር ይቀመጣሉ።'
                      : 'Your conversations with Ask Teacher AI will automatically sync and appear here.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Pinned Section */}
                  {pinnedSessions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        <Pin className="w-3 h-3 fill-amber-400" />
                        <span>{isAmharic ? 'የተሰኩ ውይይቶች' : 'Pinned Chats'}</span>
                      </div>
                      <div className="space-y-1.5">
                        {pinnedSessions.map(renderSessionItem)}
                      </div>
                    </div>
                  )}

                  {/* Today */}
                  {todaySessions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isAmharic ? 'ዛሬ' : 'Today'}
                      </div>
                      <div className="space-y-1.5">
                        {todaySessions.map(renderSessionItem)}
                      </div>
                    </div>
                  )}

                  {/* Yesterday */}
                  {yesterdaySessions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isAmharic ? 'ትላንት' : 'Yesterday'}
                      </div>
                      <div className="space-y-1.5">
                        {yesterdaySessions.map(renderSessionItem)}
                      </div>
                    </div>
                  )}

                  {/* Previous 7 Days */}
                  {previous7DaysSessions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isAmharic ? 'ያለፉት 7 ቀናት' : 'Previous 7 Days'}
                      </div>
                      <div className="space-y-1.5">
                        {previous7DaysSessions.map(renderSessionItem)}
                      </div>
                    </div>
                  )}

                  {/* Older */}
                  {olderSessions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isAmharic ? 'የቀደሙ' : 'Older Chats'}
                      </div>
                      <div className="space-y-1.5">
                        {olderSessions.map(renderSessionItem)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer Info */}
            <div className="p-3 border-t border-slate-800 bg-[#080e22] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Auto-Saved Locally</span>
              </span>
              <button
                onClick={() => {
                  if (confirm(isAmharic ? 'ሁሉንም ውይይቶች መሰረዝ ይፈልጋሉ?' : 'Clear all saved chat history permanently?')) {
                    sessions.forEach(s => onDeleteSession(s.id));
                  }
                }}
                className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
              >
                {isAmharic ? 'ሁሉንም አጽዳ' : 'Clear All'}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
