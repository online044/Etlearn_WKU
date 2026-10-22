import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Edit3, Trash2, Check, RefreshCw, 
  Sparkles, Layers, FileText, ChevronRight, Sigma, 
  Lightbulb, AlertTriangle, HelpCircle, Eye,
  Palette, Save, X, ExternalLink, Database, Copy, CheckCheck
} from 'lucide-react';
import { Subject, Chapter, Note } from '../../types/notes';
import { notesRepository } from '../../repositories/notesRepository';
import { playClickChime, playSuccessChime, playFailureChime } from '../../utils/audio';
import { getSupabase, testSupabaseConnection, ETHIOLEARN_SUPABASE_SQL_SCRIPT } from '../../utils/supabaseClient';

interface AdminSupabaseNotesManagerProps {
  isAmharic: boolean;
  onRefreshParent?: () => void;
}

export default function AdminSupabaseNotesManager({ isAmharic, onRefreshParent }: AdminSupabaseNotesManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(() => Boolean(getSupabase()));
  const [missingTables, setMissingTables] = useState<string[]>([]);
  const [copiedSql, setCopiedSql] = useState(false);

  // Selected filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectColor, setSubjectColor] = useState('#D97706');
  const [subjectSortOrder, setSubjectSortOrder] = useState('0');

  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterSortOrder, setChapterSortOrder] = useState('1');

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteReadTime, setNoteReadTime] = useState('5');
  const [noteSortOrder, setNoteSortOrder] = useState('1');
  const [noteIsPublished, setNoteIsPublished] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoadingNoteContent, setIsLoadingNoteContent] = useState(false);

  const [isSeeding, setIsSeeding] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const checkSupabaseHealth = async () => {
    try {
      const diag = await testSupabaseConnection();
      setSupabaseConnected(diag.success);
      const reqTables = ['subjects', 'chapters', 'notes'];
      const missing = reqTables.filter(t => !diag.tablesFound.includes(t));
      setMissingTables(missing);
    } catch (e) {
      setSupabaseConnected(Boolean(getSupabase()));
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      checkSupabaseHealth();
      const [subs, chaps, nts] = await Promise.all([
        notesRepository.fetchSubjects(),
        notesRepository.fetchChapters(),
        notesRepository.fetchNotesList(undefined, true) // Include unpublished drafts for admin
      ]);
      setSubjects(subs);
      setChapters(chaps);
      setNotes(nts as any);

      if (!selectedSubjectId && subs.length > 0) {
        setSelectedSubjectId(subs[0].id);
      }
    } catch (err) {
      console.warn('Error loading Supabase notes data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered chapters for current subject
  const currentSubjectChapters = chapters.filter(c => 
    !selectedSubjectId || c.subject_id === selectedSubjectId
  ).sort((a, b) => a.sort_order - b.sort_order);

  // Filtered notes
  const filteredNotes = notes.filter(n => {
    if (selectedChapterId && n.chapter_id !== selectedChapterId) return false;
    if (selectedSubjectId) {
      const parentChapter = chapters.find(c => c.id === n.chapter_id);
      if (parentChapter && parentChapter.subject_id !== selectedSubjectId) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q));
    }
    return true;
  }).sort((a, b) => a.sort_order - b.sort_order);

  // Handlers for Subject
  const handleOpenSubjectModal = (sub?: Subject) => {
    playClickChime();
    if (sub) {
      setEditingSubject(sub);
      setSubjectName(sub.name);
      setSubjectColor(sub.color || '#4F46E5');
      setSubjectSortOrder(String(sub.sort_order ?? 0));
    } else {
      setEditingSubject(null);
      setSubjectName('');
      setSubjectColor('#F59E0B');
      setSubjectSortOrder(String(subjects.length + 1));
    }
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    playClickChime();
    try {
      const saved = await notesRepository.adminSaveSubject({
        id: editingSubject?.id,
        name: subjectName.trim(),
        color: subjectColor,
        sort_order: parseInt(subjectSortOrder, 10) || 0
      });
      playSuccessChime();
      setShowSubjectModal(false);
      setFeedbackMessage(`Subject "${saved.name}" saved successfully.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      playFailureChime();
      alert(`Error saving subject: ${err.message}`);
    }
  };

  const handleDeleteSubject = async (sub: Subject) => {
    if (!confirm(`Are you sure you want to delete subject "${sub.name}"? This will delete all linked chapters and notes!`)) return;
    playClickChime();
    await notesRepository.adminDeleteSubject(sub.id);
    playSuccessChime();
    await loadData();
  };

  // Handlers for Chapter
  const handleOpenChapterModal = (chap?: Chapter) => {
    if (!selectedSubjectId) {
      alert('Please select a subject first.');
      return;
    }
    playClickChime();
    if (chap) {
      setEditingChapter(chap);
      setChapterTitle(chap.title);
      setChapterSortOrder(String(chap.sort_order ?? 1));
    } else {
      setEditingChapter(null);
      setChapterTitle('');
      setChapterSortOrder(String(currentSubjectChapters.length + 1));
    }
    setShowChapterModal(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim() || !selectedSubjectId) return;
    playClickChime();
    try {
      const saved = await notesRepository.adminSaveChapter({
        id: editingChapter?.id,
        subject_id: selectedSubjectId,
        title: chapterTitle.trim(),
        sort_order: parseInt(chapterSortOrder, 10) || 1
      });
      playSuccessChime();
      setShowChapterModal(false);
      setFeedbackMessage(`Chapter "${saved.title}" saved.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      playFailureChime();
      alert(`Error saving chapter: ${err.message}`);
    }
  };

  const handleDeleteChapter = async (chap: Chapter) => {
    if (!confirm(`Delete chapter "${chap.title}"? Linked notes will be removed.`)) return;
    playClickChime();
    await notesRepository.adminDeleteChapter(chap.id);
    playSuccessChime();
    await loadData();
  };

  // Handlers for Note
  const handleOpenNoteModal = async (note?: Note) => {
    playClickChime();
    setPreviewMode(false);
    if (note) {
      setEditingNote(note);
      setNoteTitle(note.title);
      setNoteContent(note.content || '');
      setNoteReadTime(String(note.read_time_min || 5));
      setNoteSortOrder(String(note.sort_order ?? 1));
      setNoteIsPublished(note.is_published ?? true);
      setSelectedChapterId(note.chapter_id);
      setShowNoteModal(true);

      // Fetch full note markdown from Supabase/cache if empty
      if (!note.content) {
        setIsLoadingNoteContent(true);
        try {
          const full = await notesRepository.fetchNoteById(note.id);
          if (full && full.content) {
            setNoteContent(full.content);
          }
        } catch (e) {
          console.warn('Could not fetch full note content:', e);
        } finally {
          setIsLoadingNoteContent(false);
        }
      }
    } else {
      const targetChapterId = selectedChapterId || (currentSubjectChapters[0]?.id) || '';
      if (!targetChapterId) {
        alert('Please create or select a chapter before adding notes.');
        return;
      }
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent(`# Chapter Overview\n\n:::definition\n**Core Principle**: Introduce the fundamental concepts of this unit here.\n:::\n\n## 1. Important Points\n* High-yield exam concepts\n* Theoretical foundation\n\n:::key-point\nRemember to verify the soundness and validity of the deductive structure.\n:::\n\n$$E = mc^2$$\n`);
      setNoteReadTime('5');
      setNoteSortOrder(String(filteredNotes.length + 1));
      setNoteIsPublished(true);
      setSelectedChapterId(targetChapterId);
      setShowNoteModal(true);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !selectedChapterId) {
      alert('Please provide a title and select a valid chapter.');
      return;
    }
    playClickChime();
    try {
      const saved = await notesRepository.adminSaveNote({
        id: editingNote?.id,
        chapter_id: selectedChapterId,
        title: noteTitle.trim(),
        content: noteContent,
        read_time_min: parseInt(noteReadTime, 10) || 5,
        sort_order: parseInt(noteSortOrder, 10) || 1,
        is_published: noteIsPublished,
        created_at: editingNote?.created_at
      });
      playSuccessChime();
      setShowNoteModal(false);
      setFeedbackMessage(`Note "${saved.title}" successfully saved & published to Supabase!`);
      setTimeout(() => setFeedbackMessage(null), 4000);
      await loadData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      playFailureChime();
      alert(`Error saving note: ${err.message}`);
    }
  };

  const handleDeleteNote = async (note: Note) => {
    if (!confirm(`Delete note "${note.title}"?`)) return;
    playClickChime();
    await notesRepository.adminDeleteNote(note.id);
    playSuccessChime();
    await loadData();
    if (onRefreshParent) onRefreshParent();
  };

  const handleTogglePublishNote = async (note: Note) => {
    playClickChime();
    await notesRepository.adminSaveNote({
      ...note,
      is_published: !note.is_published
    });
    playSuccessChime();
    await loadData();
  };

  // Seed standard curriculum
  const handleSeedCurriculum = async () => {
    if (!confirm('Populate standard Ethiopian University curriculum notes (Logic, Emerging Tech, Math, Psychology)?')) return;
    setIsSeeding(true);
    playClickChime();
    try {
      const res = await notesRepository.adminSeedAllCurriculumData();
      playSuccessChime();
      setFeedbackMessage(`Successfully seeded ${res.subjectsCount} subjects, ${res.chaptersCount} chapters, and ${res.notesCount} notes into Supabase!`);
      setTimeout(() => setFeedbackMessage(null), 6000);
      await loadData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      playFailureChime();
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const insertSnippet = (snippet: string) => {
    setNoteContent(prev => prev + '\n' + snippet + '\n');
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-300 font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Supabase Connection Status Banner */}
      {!supabaseConnected ? (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Supabase is currently not connected. Notes are running on high-speed offline storage.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClickChime();
                navigator.clipboard.writeText(ETHIOLEARN_SUPABASE_SQL_SCRIPT);
                setCopiedSql(true);
                setTimeout(() => setCopiedSql(false), 3000);
              }}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition text-[11px]"
            >
              {copiedSql ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'SQL Script Copied!' : 'Copy SQL Script'}</span>
            </button>
          </div>
        </div>
      ) : missingTables.length > 0 ? (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <Database className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Connected to Supabase, but tables [{missingTables.join(', ')}] are not created yet in your project.</span>
          </div>
          <button
            onClick={() => {
              playClickChime();
              navigator.clipboard.writeText(ETHIOLEARN_SUPABASE_SQL_SCRIPT);
              setCopiedSql(true);
              setTimeout(() => setCopiedSql(false), 3000);
            }}
            className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-amber-400 transition text-[11px]"
          >
            {copiedSql ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'SQL Copied! Run in Supabase SQL Editor' : '1-Click Copy Notes SQL Script'}</span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Supabase PostgreSQL Connected & Verified (subjects, chapters, notes active)</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400/80">Cloud Sync Active</span>
        </div>
      )}

      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F172A] border border-amber-500/20 p-4 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              SUPABASE POSTGRESQL ENGINE
            </span>
            <span className="text-xs text-slate-400">
              {subjects.length} Subjects · {chapters.length} Chapters · {notes.length} Markdown Notes
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">
            {isAmharic ? 'የዩኒቨርሲቲ የጥናት ማስታወሻዎች እና ምዕራፎች ማኔጀር' : 'Curriculum Notes & Chapter Studio'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedCurriculum}
            disabled={isSeeding}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Seed Ethiopian university freshman curriculum notes"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Seeding...' : '1-Click Seed Freshman Notes'}</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="Reload live database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3-Column Hierarchy Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COLUMN 1: SUBJECTS (3 Cols) */}
        <div className="lg:col-span-4 bg-[#111C35] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Subjects ({subjects.length})</span>
            </div>
            <button
              onClick={() => handleOpenSubjectModal()}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[460px] pr-1 scrollbar-thin">
            {subjects.map((sub, sIdx) => {
              const isSelected = selectedSubjectId === sub.id;
              const subChaptersCount = chapters.filter(c => c.subject_id === sub.id).length;
              return (
                <div
                  key={`${sub.id}_admin_sub_${sIdx}`}
                  onClick={() => { setSelectedSubjectId(sub.id); setSelectedChapterId(null); }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-xs'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: sub.color || '#4F46E5' }} 
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{sub.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {subChaptersCount} chapters · order #{sub.sort_order}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenSubjectModal(sub); }}
                      className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-amber-400"
                      title="Edit subject"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(sub); }}
                      className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
                      title="Delete subject"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: CHAPTERS (3 Cols) */}
        <div className="lg:col-span-3 bg-[#111C35] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Chapters ({currentSubjectChapters.length})</span>
            </div>
            <button
              onClick={() => handleOpenChapterModal()}
              disabled={!selectedSubjectId}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[460px] pr-1 scrollbar-thin">
            {currentSubjectChapters.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No chapters for this subject yet.
              </div>
            ) : (
              currentSubjectChapters.map((chap) => {
                const isSelected = selectedChapterId === chap.id;
                const chapNotesCount = notes.filter(n => n.chapter_id === chap.id).length;
                return (
                  <div
                    key={chap.id}
                    onClick={() => setSelectedChapterId(isSelected ? null : chap.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-xs'
                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold truncate">{chap.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {chapNotesCount} notes · #{chap.sort_order}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenChapterModal(chap); }}
                        className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-amber-400"
                        title="Edit chapter"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chap); }}
                        className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
                        title="Delete chapter"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: MARKDOWN NOTES LIST (5 Cols) */}
        <div className="lg:col-span-5 bg-[#111C35] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Notes Catalog ({filteredNotes.length})</span>
            </div>
            <button
              onClick={() => handleOpenNoteModal()}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Compose Note</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[460px] pr-1 scrollbar-thin">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No notes found matching your selection.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const parentChapter = chapters.find(c => c.id === note.chapter_id);
                return (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          note.is_published 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {note.is_published ? 'Published' : 'Draft'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {note.read_time_min}m read
                        </span>
                        {parentChapter && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            · {parentChapter.title}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1 group-hover:text-amber-400 transition-colors">
                        {note.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {note.content?.substring(0, 140)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      <button
                        onClick={() => handleTogglePublishNote(note)}
                        className={`p-1.5 rounded-lg border transition text-[10px] font-bold ${
                          note.is_published
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                        }`}
                        title={note.is_published ? 'Unpublish note' : 'Publish note'}
                      >
                        {note.is_published ? 'Live' : 'Draft'}
                      </button>

                      <button
                        onClick={() => handleOpenNoteModal(note)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition"
                        title="Edit note"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteNote(note)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ─── MODAL 1: SUBJECT MODAL ─── */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>{editingSubject ? 'Edit Academic Subject' : 'Add New Subject'}</span>
              </h4>
              <button onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Logic & Critical Thinking (Phil 1011)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Badge Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={subjectColor}
                      onChange={(e) => setSubjectColor(e.target.value)}
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={subjectColor}
                      onChange={(e) => setSubjectColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Display Order #</label>
                  <input
                    type="number"
                    value={subjectSortOrder}
                    onChange={(e) => setSubjectSortOrder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CHAPTER MODAL ─── */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{editingChapter ? 'Edit Chapter' : 'Add Chapter to Subject'}</span>
              </h4>
              <button onClick={() => setShowChapterModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Chapter Title *</label>
                <input
                  type="text"
                  required
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="e.g. Chapter 2: Basic Concepts of Logic"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Sort Order #</label>
                <input
                  type="number"
                  value={chapterSortOrder}
                  onChange={(e) => setChapterSortOrder(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: FULL MARKDOWN NOTE AUTHORING STUDIO ─── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  {editingNote ? `Edit Note: ${editingNote.title}` : 'Author Markdown Curriculum Note'}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    previewMode
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{previewMode ? 'Editor View' : 'Preview Live'}</span>
                </button>

                <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveNote} className="flex-1 flex flex-col space-y-3.5 min-h-0 overflow-y-auto">
              
              {/* Note Meta inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 shrink-0">
                <div className="sm:col-span-6">
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Note Title *</label>
                  <input
                    type="text"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. 1.2 Deductive Validity & Soundness"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Parent Chapter *</label>
                  <select
                    value={selectedChapterId || ''}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                  >
                    {chapters.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 flex items-center gap-3 pt-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Minutes</label>
                    <input
                      type="number"
                      value={noteReadTime}
                      onChange={(e) => setNoteReadTime(e.target.value)}
                      className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white text-center"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer mt-4">
                    <input
                      type="checkbox"
                      checked={noteIsPublished}
                      onChange={(e) => setNoteIsPublished(e.target.checked)}
                      className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-300">Published</span>
                  </label>
                </div>
              </div>

              {/* Snippet Insertion Quick Bar */}
              {!previewMode && (
                <div className="flex items-center gap-1.5 flex-wrap p-2 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px] font-mono">
                  <span className="text-slate-500 text-[10px] font-bold uppercase px-1">Insert:</span>
                  <button
                    type="button"
                    onClick={() => insertSnippet(':::definition\n**Term**: Explanation of the academic concept.\n:::')}
                    className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg flex items-center gap-1"
                  >
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    <span>:::definition</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet(':::key-point\nEssential exam takeaway to remember.\n:::')}
                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>:::key-point</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet(':::warning\nCommon logical or student pitfall in exam problems.\n:::')}
                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>:::warning</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet(':::formula\n$$\\Delta G = \\Delta H - T\\Delta S$$\n:::')}
                    className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg flex items-center gap-1"
                  >
                    <Sigma className="w-3 h-3 text-sky-400" />
                    <span>:::formula</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('| Concept | Details | Example |\n| :--- | :--- | :--- |\n| Term A | Definition A | Sample A |\n| Term B | Definition B | Sample B |')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('$$P(A|B) = \\frac{P(B|A)P(A)}{P(B)}$$')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg"
                  >
                    <span>$$KaTeX$$</span>
                  </button>
                </div>
              )}

              {/* Main Content Editor / Preview */}
              <div className="flex-1 min-h-[300px] relative">
                {isLoadingNoteContent && (
                  <div className="absolute inset-0 bg-[#0A1128]/80 backdrop-blur-xs flex items-center justify-center gap-2 text-amber-400 text-xs font-bold z-10 rounded-2xl">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading latest note markdown from Supabase...</span>
                  </div>
                )}
                {previewMode ? (
                  <div className="w-full h-full p-4 bg-[#0A1128] border border-slate-800 rounded-2xl overflow-y-auto text-slate-200 text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none">
                    <h1 className="text-xl font-bold text-white mb-2">{noteTitle || 'Untitled Note'}</h1>
                    <pre className="whitespace-pre-wrap font-sans text-xs">{noteContent}</pre>
                  </div>
                ) : (
                  <textarea
                    required
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write Markdown content here. Supports # Headings, :::callout blocks, KaTeX equations ($inline$, $$block$$), tables, and bold/italic."
                    className="w-full h-full min-h-[300px] p-4 bg-[#0A1128] border border-slate-800 focus:border-amber-400 rounded-2xl text-xs sm:text-sm text-slate-100 font-mono leading-relaxed outline-none resize-none"
                  />
                )}
              </div>

              {/* Footer Save */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
                <span className="text-xs text-slate-500 font-mono">
                  {noteContent.split(/\s+/).filter(Boolean).length} words
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Deploy to Supabase</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
