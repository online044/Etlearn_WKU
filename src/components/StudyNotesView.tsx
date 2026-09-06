/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Authentic Study Notes & Lecture Summaries View
 * Real curriculum content authored and published by university educators.
 * 100% real data with zero external AI dependencies.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Edit3, Clipboard, FileText, Download, Plus, Trash2, Check, 
  HelpCircle, Save, Tags, AlertCircle, Search, ExternalLink, Filter, 
  GraduationCap, Calendar, Clock, Bookmark, Sparkles, Eye, Share2
} from 'lucide-react';
import { CustomNote, Flashcard, NoteRecord } from '../types';
import { INITIAL_NOTES } from '../data/initialFirestoreContent';
import { fetchPublishedNotes } from '../utils/contentStore';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { User } from 'firebase/auth';
import { exportNoteToGoogleDoc, exportNotesToGoogleSheets } from '../utils/workspace';
import { jsPDF } from 'jspdf';
import { safeStorage } from '../utils/safeStorage';
import DOMPurify from 'dompurify';

interface StudyNotesViewProps {
  apiKey?: string;
  customNotes: CustomNote[];
  onSaveCustomNotes: (notes: CustomNote[]) => void;
  enrolledSubjects: string[];
  googleUser: User | null;
  googleToken: string | null;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  decksState?: { [deckId: string]: Flashcard[] };
  onSaveDecksState?: (deckId: string, cards: Flashcard[]) => void;
  onOpenInAppViewer?: (url: string, title: string) => void;
}

export default function StudyNotesView({ 
  customNotes, 
  onSaveCustomNotes, 
  enrolledSubjects,
  googleUser,
  googleToken,
  onGoogleSignIn,
  onGoogleSignOut,
  decksState,
  onSaveDecksState,
  onOpenInAppViewer
}: StudyNotesViewProps) {
  const [activeTab, setActiveTab] = useState<'published' | 'notepad'>('published');

  // Real Published Study Notes from Admin Firestore CMS
  const [publishedNotes, setPublishedNotes] = useState<NoteRecord[]>(INITIAL_NOTES as NoteRecord[]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    (INITIAL_NOTES[0] && INITIAL_NOTES[0].id) ? INITIAL_NOTES[0].id : 'note_freshman_emte_1012'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  // Google Workspace Sync States
  const [isSyncingDoc, setIsSyncingDoc] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncDocUrl, setSyncDocUrl] = useState<string | null>(null);
  const [syncSheetUrl, setSyncSheetUrl] = useState<string | null>(null);

  // Note editor Notepad state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubject, setNoteSubject] = useState(enrolledSubjects[0] || 'Emerging Technologies');
  const [noteColor, setNoteColor] = useState('bg-amber-950/20');
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Flashcards extraction from Study Notes state
  const [isGeneratingNoteCards, setIsGeneratingNoteCards] = useState(false);
  const [noteCardsSuccess, setNoteCardsSuccess] = useState<string | null>(null);
  const [noteCardsErr, setNoteCardsErr] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // Load published study notes from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    const loadNotes = async () => {
      try {
        setIsLoadingNotes(true);
        const notes = await fetchPublishedNotes();
        if (isMounted && notes && notes.length > 0) {
          setPublishedNotes(notes);
          if (!notes.find(n => n.id === selectedNoteId)) {
            setSelectedNoteId(notes[0].id);
          }
        }
      } catch (e) {
        console.warn('Error loading published study notes:', e);
      } finally {
        if (isMounted) setIsLoadingNotes(false);
      }
    };
    loadNotes();
    return () => { isMounted = false; };
  }, []);

  // Filtered published notes
  const filteredPublishedNotes = useMemo(() => {
    return publishedNotes.filter(n => {
      const matchesSearch = !searchQuery.trim() || 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.description && n.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.subject && n.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.unit && n.unit.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.university && n.university.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSubject = selectedSubjectFilter === 'All' || 
        (n.subject && n.subject.toLowerCase() === selectedSubjectFilter.toLowerCase());

      return matchesSearch && matchesSubject;
    });
  }, [publishedNotes, searchQuery, selectedSubjectFilter]);

  // Active selected note
  const activeSelectedNote = useMemo(() => {
    return publishedNotes.find(n => n.id === selectedNoteId) || publishedNotes[0] || null;
  }, [publishedNotes, selectedNoteId]);

  // Unique subjects for filters
  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    publishedNotes.forEach(n => {
      if (n.subject) subjects.add(n.subject);
    });
    return ['All', ...Array.from(subjects).sort()];
  }, [publishedNotes]);

  // Deterministic Flashcard Compiler from Note Content (Zero AI Dependency)
  const handleCompileFlashcardsFromNote = (title: string, content: string, subject: string) => {
    if (!title || !title.trim()) {
      setNoteCardsErr("Study note title cannot be empty.");
      playFailureChime();
      return;
    }

    setIsGeneratingNoteCards(true);
    setNoteCardsErr(null);
    setNoteCardsSuccess(null);
    playClickChime();

    try {
      // Parse markdown headers and bullet points deterministically
      const lines = content.split('\n');
      const compiledCards: Flashcard[] = [];
      let currentSection = title;

      for (let i = 0; i < lines.length && compiledCards.length < 8; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#') || line.startsWith('**') && line.endsWith('**')) {
          currentSection = line.replace(/^[#* ]+/, '').replace(/[*#]+$/, '');
        } else if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•')) {
          const cleanText = line.replace(/^[*•\- ]+/, '').trim();
          if (cleanText.length > 15) {
            // Split term and definition if colon exists
            if (cleanText.includes(':')) {
              const [term, ...defParts] = cleanText.split(':');
              const def = defParts.join(':').trim();
              if (term.length > 2 && def.length > 5) {
                compiledCards.push({
                  id: `card_${Date.now()}_${compiledCards.length}`,
                  question: `Define / Explain: ${term.replace(/\*\*/g, '').trim()} (${subject})`,
                  answer: def,
                  explanation: `From official curriculum section: "${currentSection}"`,
                  interval: 0,
                  repetition: 0,
                  easeFactor: 2.5,
                  dueDate: new Date().toISOString()
                });
              }
            } else {
              compiledCards.push({
                id: `card_${Date.now()}_${compiledCards.length}`,
                question: `Key Concept: ${currentSection} (${subject})`,
                answer: cleanText,
                explanation: `Verified fact from ${title}`,
                interval: 0,
                repetition: 0,
                easeFactor: 2.5,
                dueDate: new Date().toISOString()
              });
            }
          }
        }
      }

      // If no bullet points found, create foundational cards from the title and summary
      if (compiledCards.length === 0) {
        compiledCards.push({
          id: `card_${Date.now()}_0`,
          question: `Core Focus of: ${title}`,
          answer: content.substring(0, 160).replace(/<[^>]*>/g, '').trim() + '...',
          explanation: `Extracted from official university study notes.`,
          interval: 0,
          repetition: 0,
          easeFactor: 2.5,
          dueDate: new Date().toISOString()
        });
      }

      if (decksState && onSaveDecksState) {
        const original = decksState["deck_free_space"] || [];
        onSaveDecksState("deck_free_space", [...compiledCards, ...original]);
      } else {
        const localState = JSON.parse(safeStorage.getItem('ethiolearn_decks_state') || '{}');
        const original = localState["deck_free_space"] || [];
        localState["deck_free_space"] = [...compiledCards, ...original];
        safeStorage.setItem('ethiolearn_decks_state', JSON.stringify(localState));
      }

      setNoteCardsSuccess(`Successfully compiled ${compiledCards.length} review cards from "${title}" into your Free Space deck!`);
      playSuccessChime();
    } catch (err: any) {
      setNoteCardsErr(err.message || 'Could not compile cards.');
      playFailureChime();
    } finally {
      setIsGeneratingNoteCards(false);
    }
  };

  // Sync Note to Google Doc
  const handleExportToGoogleDoc = async (title: string, subject: string, content: string) => {
    if (!googleToken) {
      setSyncMessage("Please connect your Google Account first!");
      playFailureChime();
      return;
    }

    setIsSyncingDoc(true);
    setSyncMessage("Exporting to Google Docs...");
    playClickChime();

    try {
      const result = await exportNoteToGoogleDoc(title, subject, content, googleToken);
      setSyncDocUrl(result.url);
      setSyncMessage(`"${title}" exported as a Google Doc!`);
      playSuccessChime();
    } catch (e: any) {
      setSyncMessage(`Doc Export Failed: ${e.message}`);
      playFailureChime();
    } finally {
      setIsSyncingDoc(false);
    }
  };

  // Sync All Custom Study Notes to Google Sheet
  const handleExportAllToGoogleSheets = async () => {
    if (!googleToken) {
      setSyncMessage("Please connect your Google Account first!");
      playFailureChime();
      return;
    }

    if (customNotes.length === 0) {
      setSyncMessage("No custom notes to export yet!");
      playFailureChime();
      return;
    }

    setIsSyncingSheet(true);
    setSyncMessage("Saving notes database to Google Sheets...");
    playClickChime();

    try {
      const result = await exportNotesToGoogleSheets(customNotes, googleToken);
      setSyncSheetUrl(result.url);
      setSyncMessage(`Success! Saved ${customNotes.length} notes in Google Sheets!`);
      playSuccessChime();
    } catch (e: any) {
      setSyncMessage(`Sheets Export Failed: ${e.message}`);
      playFailureChime();
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Personal Notepad CRUD
  const saveToNotepad = () => {
    if (!noteTitle.trim()) return;
    playClickChime();

    const newNote: CustomNote = {
      id: editingNoteId || `custom_${Date.now()}`,
      title: noteTitle,
      content: noteContent,
      subject: noteSubject,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      color: noteColor
    };

    let updated: CustomNote[];
    if (editingNoteId) {
      updated = customNotes.map(n => n.id === editingNoteId ? newNote : n);
    } else {
      updated = [newNote, ...customNotes];
    }

    onSaveCustomNotes(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
    playSuccessChime();
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickChime();
    const filtered = customNotes.filter(n => n.id !== id);
    onSaveCustomNotes(filtered);
    if (editingNoteId === id) {
      startNewNote();
    }
  };

  const startNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  // Export note as PDF
  const exportNoteAsPdf = (title: string, content: string) => {
    playClickChime();
    const doc = new jsPDF();
    
    // Clean markdown or HTML tags
    const cleanText = content.replace(/<[^>]*>/g, '').replace(/[#*`_]/g, '');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`EthioLearn Pro • Wolkite University Academic Material • ${new Date().toLocaleDateString()}`, 14, 28);
    doc.line(14, 32, 196, 32);

    doc.setFontSize(11);
    doc.setTextColor(30);
    const splitText = doc.splitTextToSize(cleanText, 180);
    
    let y = 40;
    splitText.forEach((line: string) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 6;
    });

    doc.save(`${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    playSuccessChime();
  };

  const colorsList = [
    { name: 'Warm Amber', class: 'bg-amber-950/20 border-amber-500/30' },
    { name: 'Emerald Forest', class: 'bg-emerald-950/20 border-emerald-500/30' },
    { name: 'Deep Navy', class: 'bg-blue-950/20 border-blue-500/30' },
    { name: 'Royal Violet', class: 'bg-purple-950/20 border-purple-500/30' }
  ];

  const triggerToolbarCommand = (cmd: string) => {
    document.execCommand(cmd, false);
    playClickChime();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <span>Study Notes & Lecture Summaries</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real curriculum notes, key formula sheets, and chapter breakdowns published directly by university faculty.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => { setActiveTab('published'); playClickChime(); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'published' 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Official Faculty Notes ({publishedNotes.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('notepad'); playClickChime(); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-2 transition-all ${
              activeTab === 'notepad' 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>My Personal Notepad ({customNotes.length})</span>
          </button>
        </div>
      </div>

      {/* Google Workspace Connection Banner / Feedback */}
      {(syncMessage || googleUser) && (
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${googleUser ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
            <span className="text-slate-300">
              {googleUser ? (
                <span>Connected to Google as <strong className="text-amber-400">{googleUser.email}</strong></span>
              ) : (
                <span>Google Docs & Sheets sync is ready for connection.</span>
              )}
            </span>
            {syncMessage && (
              <span className="text-slate-200 ml-2 border-l border-slate-700 pl-3 font-semibold">{syncMessage}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {syncDocUrl && onOpenInAppViewer && (
              <button
                onClick={() => onOpenInAppViewer(syncDocUrl, "Your Google Doc")}
                className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <FileText className="w-3 h-3" />
                <span>Open Google Doc</span>
              </button>
            )}

            {syncSheetUrl && onOpenInAppViewer && (
              <button
                onClick={() => onOpenInAppViewer(syncSheetUrl, "Your Google Sheet")}
                className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <FileText className="w-3 h-3" />
                <span>Open Google Sheet</span>
              </button>
            )}

            {googleUser && (
              <button
                onClick={onGoogleSignOut}
                className="text-slate-400 hover:text-red-400 text-[11px] underline cursor-pointer ml-1"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}

      {/* Note-to-Flashcard Synthesis Feedback banners */}
      {noteCardsSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-300 text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{noteCardsSuccess}</span>
        </div>
      )}
      {noteCardsErr && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3.5 flex items-center gap-2.5 text-red-400 text-xs text-left">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{noteCardsErr}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* ========================================================================= */}
        {/* TAB 1: OFFICIAL FACULTY STUDY NOTES (CMS Driven)                         */}
        {/* ========================================================================= */}
        {activeTab === 'published' && (
          <motion.div
            key="published_notes"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Sidebar list items (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              {/* Search & Subject Filters */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes, formulas, topics..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Subject chip filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {availableSubjects.map(sub => (
                    <button
                      key={sub}
                      onClick={() => { setSelectedSubjectFilter(sub); playClickChime(); }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase whitespace-nowrap cursor-pointer transition-all ${
                        selectedSubjectFilter === sub
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Published Notes */}
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 space-y-1.5 max-h-[620px] overflow-y-auto">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <span>Available Curriculum Notes</span>
                  <span>{filteredPublishedNotes.length}</span>
                </div>

                {filteredPublishedNotes.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No study notes match your search or filter.
                  </div>
                ) : (
                  filteredPublishedNotes.map((note) => {
                    const isSelected = selectedNoteId === note.id;
                    const hasPdf = Boolean(note.pdfUrl);

                    return (
                      <button
                        key={note.id}
                        onClick={() => { setSelectedNoteId(note.id); playClickChime(); }}
                        className={`w-full text-left p-3 rounded-lg border text-xs cursor-pointer flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            {note.subject || 'Common Course'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {hasPdf && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 text-[9px] font-mono font-bold">
                                PDF
                              </span>
                            )}
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                              note.accessLevel === 'pro' 
                                ? 'bg-amber-500/20 text-amber-300' 
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {note.accessLevel === 'pro' ? 'PRO' : 'FREE'}
                            </span>
                          </div>
                        </div>

                        <span className="font-bold text-slate-100 text-xs line-clamp-2 leading-tight">
                          {note.title}
                        </span>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="truncate max-w-[140px]">{note.university || 'Wolkite University'}</span>
                          <span>•</span>
                          <span>{note.unit || 'Unit Note'}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Note Reader Stage (8 cols) */}
            <div className="lg:col-span-8">
              {activeSelectedNote ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl">
                  {/* Note Header Metadata */}
                  <div className="space-y-3 pb-5 border-b border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                        {activeSelectedNote.subject}
                      </span>
                      {activeSelectedNote.course && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold">
                          {activeSelectedNote.course}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 text-[10px]">
                        {activeSelectedNote.academicYear || 'Freshman Common'}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                        {activeSelectedNote.author || 'Wolkite University Academic Board'}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                      {activeSelectedNote.title}
                    </h2>

                    {activeSelectedNote.description && (
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        {activeSelectedNote.description}
                      </p>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Open Attached PDF */}
                        {activeSelectedNote.pdfUrl && onOpenInAppViewer && (
                          <button
                            type="button"
                            onClick={() => onOpenInAppViewer(activeSelectedNote.pdfUrl!, activeSelectedNote.title)}
                            className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Attached PDF / Slides</span>
                          </button>
                        )}

                        {/* Download Note as PDF */}
                        <button
                          type="button"
                          onClick={() => exportNoteAsPdf(activeSelectedNote.title, activeSelectedNote.content)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>

                        {/* Compile Flashcards */}
                        <button
                          type="button"
                          onClick={() => handleCompileFlashcardsFromNote(
                            activeSelectedNote.title, 
                            activeSelectedNote.content, 
                            activeSelectedNote.subject
                          )}
                          disabled={isGeneratingNoteCards}
                          className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title="Extract key concepts from this note into active recall flashcards"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isGeneratingNoteCards ? 'Compiling...' : 'Create Flashcards'}</span>
                        </button>
                      </div>

                      {/* Google Docs Export */}
                      <div>
                        {googleUser ? (
                          <button
                            type="button"
                            onClick={() => handleExportToGoogleDoc(
                              activeSelectedNote.title, 
                              activeSelectedNote.subject, 
                              activeSelectedNote.content
                            )}
                            disabled={isSyncingDoc}
                            className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isSyncingDoc ? 'Exporting...' : 'Sync to Google Doc'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onGoogleSignIn}
                            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer underline"
                          >
                            <span>Connect Google Docs</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Note Body: Clean Markdown & Formatted Content */}
                  <div className="prose prose-invert max-w-none text-slate-200 text-xs sm:text-sm leading-relaxed space-y-4">
                    <div 
                      className="whitespace-pre-line font-sans"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(
                          activeSelectedNote.content
                            .replace(/### (.*)/g, '<h4 class="text-sm font-bold text-amber-400 mt-4 mb-1">$1</h4>')
                            .replace(/## (.*)/g, '<h3 class="text-base font-black text-white mt-5 mb-2 border-b border-slate-800 pb-1">$1</h3>')
                            .replace(/# (.*)/g, '<h2 class="text-lg font-black text-amber-300 mt-6 mb-3">$1</h2>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-200 font-bold">$1</strong>')
                            .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-amber-300 my-2">$1</pre>')
                        )
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  Select a study note from the left to begin reading.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PERSONAL NOTEPAD (Client & Cloud Sync)                            */}
        {/* ========================================================================= */}
        {activeTab === 'notepad' && (
          <motion.div
            key="notepad"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Custom Notes List panel */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Your Saved Sheets</span>
                <button
                  onClick={() => handleCompileFlashcardsFromNote(noteTitle, noteContent, noteSubject)}
                  disabled={isGeneratingNoteCards || !noteTitle.trim()}
                  className="p-1 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                  title="Generate revision memory cards from this active custom note"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isGeneratingNoteCards ? 'Compiling...' : 'Make Cards'}</span>
                </button>
              </div>

              {customNotes.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-800 text-center text-xs text-slate-500 rounded-lg">
                  No personal notes yet. Use the editor on the right to compose chapter summaries and lecture notes.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {customNotes.map((note) => {
                    const isEditing = editingNoteId === note.id;
                    return (
                      <div
                        key={note.id}
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setNoteTitle(note.title);
                          setNoteContent(note.content);
                          setNoteSubject(note.subject);
                          playClickChime();
                        }}
                        className={`p-3.5 rounded-lg border text-xs cursor-pointer flex justify-between items-start transition-all ${
                          isEditing
                            ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-medium'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="space-y-1 overflow-hidden pr-3">
                          <p className="font-semibold break-all truncate text-slate-100">{note.title}</p>
                          <span className="text-[9px] text-slate-500 block uppercase font-mono">{note.subject}</span>
                        </div>

                        <button
                          onClick={(e) => deleteNote(note.id, e)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded-full transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note Editor Stage */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">
                    {editingNoteId ? 'Edit Study Note' : 'Draft New Study Sheet'}
                  </h3>
                  <button
                    onClick={startNewNote}
                    className="text-[10px] text-slate-400 hover:text-amber-400 font-medium underline ml-3 cursor-pointer"
                    title="Clear editor inputs to draft a new sheet from scratch"
                  >
                    (New Blank Note)
                  </button>
                </div>
                
                {isSavedToast && (
                  <span className="text-[10px] bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 py-1 px-2.5 rounded-full flex items-center gap-1 animate-pulse">
                    <Check className="w-3.5 h-3.5" /> Saved successfully
                  </span>
                )}
              </div>

              {/* Title input and configuration selections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Chapter 1: Calculus - Derivatives & Limits..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg text-xs p-3 outline-none text-white focus:border-amber-500"
                />

                <select
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg text-xs p-3 outline-none text-white cursor-pointer"
                >
                  {enrolledSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Tag/color selectors */}
              <div className="flex flex-wrap items-center gap-2 pb-1">
                <span className="text-[10px] text-slate-400 mr-2 uppercase tracking-wide">Category color:</span>
                {colorsList.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => { setNoteColor(c.class); playClickChime(); }}
                    className={`h-5 w-5 rounded-full border cursor-pointer transition-transform ${c.class.split(' ')[0]} ${noteColor === c.class ? 'scale-125 border-amber-400' : 'border-slate-800'}`}
                    title={c.name}
                  />
                ))}
              </div>

              {/* Notepad format-rich Toolbar */}
              <div className="flex bg-slate-950 p-1.5 rounded-lg border border-slate-800 gap-0.5 max-w-sm">
                <button onClick={() => triggerToolbarCommand('bold')} className="p-1.5 text-xs text-slate-400 hover:text-amber-400 cursor-pointer font-bold" title="Bold">B</button>
                <button onClick={() => triggerToolbarCommand('italic')} className="p-1.5 text-xs text-slate-400 hover:text-amber-400 italic cursor-pointer" title="Italic">I</button>
                <button onClick={() => triggerToolbarCommand('underline')} className="p-1.5 text-xs text-slate-400 hover:text-amber-400 underline cursor-pointer" title="Underline">U</button>
                <button onClick={() => triggerToolbarCommand('insertUnorderedList')} className="p-1.5 text-xs text-slate-400 hover:text-amber-400 cursor-pointer" title="Bullet Lists">• List</button>
              </div>

              {/* Rich Contenteditable input textarea */}
              <div
                ref={editorRef}
                contentEditable
                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs overflow-y-auto leading-relaxed outline-none focus:border-amber-500 font-sans text-slate-200"
                placeholder="Compose your structured study summary guidelines, definitions, and equations here..."
                onInput={(e) => setNoteContent(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(noteContent) }}
              />

              {/* Save triggers */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-800 mt-4 flex-wrap gap-3">
                <div className="flex gap-4">
                  <button
                    onClick={() => exportNoteAsPdf(noteTitle || "Study_Note", noteContent)}
                    disabled={!noteTitle.trim()}
                    className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF Guide
                  </button>

                  {googleUser ? (
                    <>
                      <button
                        onClick={() => handleExportToGoogleDoc(noteTitle, noteSubject, noteContent)}
                        disabled={!noteTitle.trim() || isSyncingDoc}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
                        title="Export this note as a beautifully formatted Google Doc"
                      >
                        <FileText className="w-3.5 h-3.5" /> {isSyncingDoc ? 'Exporting...' : 'Sync Active Note'}
                      </button>

                      <button
                        onClick={handleExportAllToGoogleSheets}
                        disabled={customNotes.length === 0 || isSyncingSheet}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
                        title="Sync all notepad sheets into a single Google Sheets database"
                      >
                        <FileText className="w-3.5 h-3.5" /> {isSyncingSheet ? 'Syncing...' : 'Export All to Sheets'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={onGoogleSignIn}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Authorize Google integration to enable real-time cloud document sync"
                    >
                      <span>Connect Sheets/Docs Sync</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={saveToNotepad}
                  disabled={!noteTitle.trim()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-30 shadow"
                >
                  <Save className="w-3.5 h-3.5" /> Save Note
                </button>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
