/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Premium Visual Study Notes & Lecture Notebook
 * Authentic curriculum note studio supporting rich text and high-res diagrams/images.
 * Zero flashcards • 100% offline-ready & cloud-synced • Pro & Premium UI
 */

import React, { useState, useEffect, useRef, useMemo, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Edit3, FileText, Download, Plus, Trash2, Check, 
  HelpCircle, Save, AlertCircle, Search, ExternalLink, Filter, 
  GraduationCap, Calendar, Clock, Bookmark, Sparkles, Eye, Share2,
  Image as ImageIcon, Camera, Upload, X, ZoomIn, Link as LinkIcon,
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2,
  List, ListOrdered, Quote, Code, Copy, Palette, CheckCircle2,
  Maximize2, ArrowRight, Layers, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { CustomNote, NoteRecord } from '../types';
import { INITIAL_NOTES } from '../data/initialFirestoreContent';
import { fetchPublishedNotes } from '../utils/contentStore';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { User } from 'firebase/auth';
import { exportNoteToGoogleDoc, exportNotesToGoogleSheets } from '../utils/workspace';
import { jsPDF } from 'jspdf';
import { safeStorage } from '../utils/safeStorage';
import DOMPurify from 'dompurify';
import { NotesLibraryView } from './notes/NotesLibraryView';
import { NoteReaderView } from './notes/NoteReaderView';
import { canonicalSubjectId } from '../repositories/notesRepository';

interface StudyNotesViewProps {
  apiKey?: string;
  customNotes: CustomNote[];
  onSaveCustomNotes: (notes: CustomNote[]) => void;
  enrolledSubjects: string[];
  googleUser: User | null;
  googleToken: string | null;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  decksState?: any;
  onSaveDecksState?: any;
  onOpenInAppViewer?: (url: string, title: string) => void;
  language?: 'en' | 'am';
  userId?: string;
}

export default function StudyNotesView({ 
  customNotes, 
  onSaveCustomNotes, 
  enrolledSubjects = [],
  googleUser,
  googleToken,
  onGoogleSignIn,
  onGoogleSignOut,
  onOpenInAppViewer,
  language = 'en',
  userId
}: StudyNotesViewProps) {
  // Main view tab: default directly to Curriculum Notes
  const [activeTab, setActiveTab] = useState<'curriculum' | 'notebook'>('curriculum');
  const [readerNoteId, setReaderNoteId] = useState<string | null>(null);

  // Real Published Study Notes from Admin Firestore CMS
  const [publishedNotes, setPublishedNotes] = useState<NoteRecord[]>(INITIAL_NOTES as NoteRecord[]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    (INITIAL_NOTES[0] && INITIAL_NOTES[0].id) ? INITIAL_NOTES[0].id : 'note_freshman_emte_1012'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
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
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('All');
  const [noteSearchTerm, setNoteSearchTerm] = useState<string>('');
  const deferredNoteSearchTerm = useDeferredValue(noteSearchTerm);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available subject choices
  const fallbackSubjects = useMemo(() => [
    'Emerging Technologies',
    'Mathematics',
    'General Physics',
    'General Biology',
    'General Chemistry',
    'Critical Thinking',
    'Economics',
    'Geography of Ethiopia',
    'Communicative English',
    'Inclusiveness',
    'Social Anthropology',
    'Moral & Civics'
  ], []);

  const subjectsPool = useMemo(() => {
    const list = enrolledSubjects && enrolledSubjects.length > 0 ? enrolledSubjects : fallbackSubjects;
    return Array.from(new Set(list));
  }, [enrolledSubjects, fallbackSubjects]);

  // Load published study notes from local safeStorage and Firestore on mount
  useEffect(() => {
    let isMounted = true;
    const loadNotes = async () => {
      // 1. Immediately load cached published notes for offline readiness
      try {
        const cachedStr = safeStorage.getItem('ethiolearn_cached_published_notes');
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
            setPublishedNotes(parsed);
            if (!parsed.find(n => n.id === selectedNoteId)) {
              setSelectedNoteId(parsed[0].id);
            }
          }
        }
      } catch {}

      // 2. Fetch fresh published notes when online and cache them
      try {
        setIsLoadingNotes(true);
        const notes = await fetchPublishedNotes();
        if (isMounted && notes && notes.length > 0) {
          setPublishedNotes(notes);
          try {
            safeStorage.setItem('ethiolearn_cached_published_notes', JSON.stringify(notes));
          } catch {}
          if (!notes.find(n => n.id === selectedNoteId)) {
            setSelectedNoteId(notes[0].id);
          }
        }
      } catch (e) {
        console.warn('Error loading published study notes (offline mode active):', e);
      } finally {
        if (isMounted) setIsLoadingNotes(false);
      }
    };
    loadNotes();
    return () => { isMounted = false; };
  }, []);

  // Filtered published notes (Instant debounced filtering)
  const filteredPublishedNotes = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    return publishedNotes.filter(n => {
      const matchesSearch = !q || 
        n.title.toLowerCase().includes(q) ||
        (n.description && n.description.toLowerCase().includes(q)) ||
        (n.subject && n.subject.toLowerCase().includes(q)) ||
        (n.unit && n.unit.toLowerCase().includes(q)) ||
        (n.university && n.university.toLowerCase().includes(q));

      const matchesSubject = selectedSubjectFilter === 'All' || 
        (n.subject && n.subject.toLowerCase() === selectedSubjectFilter.toLowerCase()) ||
        (n.subject && canonicalSubjectId(n.subject) === canonicalSubjectId(selectedSubjectFilter));

      return matchesSearch && matchesSubject;
    });
  }, [publishedNotes, deferredSearchQuery, selectedSubjectFilter]);

  // Active selected note
  const activeSelectedNote = useMemo(() => {
    return filteredPublishedNotes.find(n => n.id === selectedNoteId) || filteredPublishedNotes[0] || null;
  }, [filteredPublishedNotes, selectedNoteId]);

  // Filtered personal notes (Instant debounced filtering)
  const filteredPersonalNotes = useMemo(() => {
    const q = deferredNoteSearchTerm.trim().toLowerCase();
    return customNotes.filter(n => {
      const nSub = (n.subject || '').toLowerCase();
      const aSub = activeSubjectFilter.toLowerCase();
      const matchesSubject = activeSubjectFilter === 'All' || 
        n.subject === activeSubjectFilter ||
        nSub.includes(aSub) ||
        aSub.includes(nSub);
      const matchesSearch = !q || 
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        nSub.includes(q);
      return matchesSubject && matchesSearch;
    });
  }, [customNotes, activeSubjectFilter, deferredNoteSearchTerm]);

  // Total images across all custom notes
  const totalAttachedImages = useMemo(() => {
    return customNotes.reduce((acc, curr) => {
      const count = curr.images?.length || (curr.imageUrl ? 1 : 0);
      return acc + count;
    }, 0);
  }, [customNotes]);

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
      const rows = customNotes.map(n => [
        n.title,
        n.subject,
        n.content.replace(/<[^>]*>/g, ' ').substring(0, 500),
        n.date || new Date().toLocaleDateString(),
        n.images?.length ? `${n.images.length} attached diagrams` : 'None'
      ]);

      const result = await exportNotesToGoogleSheets(customNotes, googleToken);
      setSyncSheetUrl(result.url);
      setSyncMessage("All study notes exported to Google Sheets!");
      playSuccessChime();
    } catch (e: any) {
      setSyncMessage(`Sheets Sync Failed: ${e.message}`);
      playFailureChime();
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Handle Image Upload and Compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 1200;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setNoteImages(prev => [...prev, compressed]);
            playSuccessChime();
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = '';
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    playClickChime();
    setNoteImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
    setShowUrlInput(false);
    playSuccessChime();
  };

  const handleRemoveImage = (indexToRemove: number) => {
    playClickChime();
    setNoteImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Save current note into persistent storage
  const saveToNotepad = () => {
    if (!noteTitle.trim()) {
      playFailureChime();
      return;
    }

    playClickChime();
    const newNote: CustomNote = {
      id: editingNoteId || `custom_note_${Date.now()}`,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      subject: noteSubject,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      color: noteColor,
      images: noteImages,
      imageUrl: noteImages[0] || undefined
    };

    if (editingNoteId) {
      const updated = customNotes.map(n => n.id === editingNoteId ? newNote : n);
      onSaveCustomNotes(updated);
    } else {
      onSaveCustomNotes([newNote, ...customNotes]);
    }

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
    playSuccessChime();
  };

  // Delete note
  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this study note?")) {
      playClickChime();
      const updated = customNotes.filter(n => n.id !== id);
      onSaveCustomNotes(updated);
      if (editingNoteId === id) {
        startNewNote();
      }
    }
  };

  // Clear inputs to draft new note
  const startNewNote = () => {
    playClickChime();
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteImages([]);
    setImageUrlInput('');
    setShowUrlInput(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  // Copy curriculum note into personal editor
  const handleCopyCurriculumToPersonal = (note: NoteRecord) => {
    playClickChime();
    setActiveTab('notebook');
    setEditingNoteId(null);
    setNoteTitle(`${note.title} (My Notes)`);
    setNoteSubject(note.subject || subjectsPool[0]);
    setNoteContent(note.content || '');
    setNoteImages([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content || '';
    }
    playSuccessChime();
  };

  // Export note as PDF (with embedded images)
  const exportNoteAsPdf = (title: string, content: string, imagesToEmbed: string[] = noteImages) => {
    playClickChime();
    const doc = new jsPDF();
    const cleanContent = content.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();

    // Document Header
    doc.setFontSize(18);
    doc.setTextColor(245, 158, 11); // Amber
    doc.text(title || 'EthioLearn Pro - Study Notes', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Subject: ${noteSubject} | Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.line(14, 32, 196, 32);

    // Body text
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const splitText = doc.splitTextToSize(cleanContent, 180);
    
    let y = 40;
    splitText.forEach((line: string) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 6;
    });

    // Embed images if available
    if (imagesToEmbed && imagesToEmbed.length > 0) {
      imagesToEmbed.forEach((imgSrc, idx) => {
        if (y > 180) {
          doc.addPage();
          y = 20;
        }
        try {
          doc.setFontSize(9);
          doc.setTextColor(140, 140, 140);
          doc.text(`[Diagram ${idx + 1}]`, 14, y + 4);
          doc.addImage(imgSrc, 'JPEG', 14, y + 6, 80, 55);
          y += 68;
        } catch {
          // If image format fails to parse into PDF, continue cleanly
        }
      });
    }

    doc.save(`${(title || 'Study_Note').replace(/[^a-zA-Z0-9]/g, '_')}_EthioLearn.pdf`);
    playSuccessChime();
  };

  // Color options for notes
  const colorsList = [
    { name: 'Warm Amber', class: 'bg-amber-500/15 border-amber-500/40 text-amber-300' },
    { name: 'Emerald Green', class: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' },
    { name: 'Sky Blue', class: 'bg-sky-500/15 border-sky-500/40 text-sky-300' },
    { name: 'Royal Indigo', class: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' },
    { name: 'Crimson Rose', class: 'bg-rose-500/15 border-rose-500/40 text-rose-300' }
  ];

  // Formatting tools
  const triggerToolbarCommand = (cmd: string, val: string = '') => {
    playClickChime();
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      setNoteContent(editorRef.current.innerHTML);
    }
  };

  // Word count helper
  const wordCount = useMemo(() => {
    const plain = noteContent.replace(/<[^>]*>/g, ' ').trim();
    if (!plain) return 0;
    return plain.split(/\s+/).length;
  }, [noteContent]);

  if (readerNoteId) {
    return (
      <NoteReaderView
        noteId={readerNoteId}
        userId={userId || googleUser?.uid || 'student_wku'}
        onBack={() => setReaderNoteId(null)}
        onNavigateToNote={(id) => setReaderNoteId(id)}
        language={language}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 text-slate-100 min-h-screen space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. HERO STUDIO HEADER (MINIMIZED PRO STUDIO)                             */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#111C35] to-[#0A1128] border border-amber-500/25 p-4 sm:p-5 shadow-xl">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-600/10 text-amber-300 border border-amber-400/40 shadow-xs shadow-amber-500/10">
                <Sparkles className="w-3 h-3 fill-amber-300 text-amber-300" />
                <span>PRO STUDY NOTEBOOK</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="font-sans">የጥናት ማስታወሻ ስቱዲዮ</span>
              </span>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Rich Text & Diagram Studio
              </span>
            </div>

            <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight leading-snug">
              Visual Notes & Lecture Journal
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Capture formulas, attach whiteboard screenshots and textbook diagrams, format chapter takeaways, and export clean PDF documents ready for exam revision.
            </p>

            {/* Quick Stat Highlights */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-slate-800">
                <Edit3 className="w-3 h-3 text-amber-400" />
                <span className="font-bold text-white">{customNotes.length}</span>
                <span className="text-slate-400">Personal Notes</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-slate-800">
                <ImageIcon className="w-3 h-3 text-emerald-400" />
                <span className="font-bold text-white">{totalAttachedImages}</span>
                <span className="text-slate-400">Attached Diagrams</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-0.5 rounded-lg border border-slate-800">
                <GraduationCap className="w-3 h-3 text-sky-400" />
                <span className="font-bold text-white">{subjectsPool.length}</span>
                <span className="text-slate-400">Active Subjects</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setActiveTab('notebook');
                startNewNote();
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Note</span>
            </button>

            {customNotes.length > 0 && (
              <button
                onClick={() => exportNoteAsPdf(noteTitle || "My_EthioLearn_Notes", noteContent)}
                className="px-3.5 py-2.5 bg-[#17233D] hover:bg-[#1E2D4E] border border-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Export active note as PDF"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRO SEGMENTED TAB SELECTOR (PERSONAL NOTEBOOK vs FACULTY CURRICULUM)   */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="inline-flex p-1.5 rounded-2xl bg-[#0B1228] border border-slate-800 text-xs font-bold">
          <button
            onClick={() => { playClickChime(); setActiveTab('notebook'); }}
            className={`px-4 sm:px-5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'notebook'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>My Study Notes & Diagrams</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'notebook' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}>
              {customNotes.length}
            </span>
          </button>

          <button
            onClick={() => { playClickChime(); setActiveTab('curriculum'); }}
            className={`px-4 sm:px-5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'curriculum'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Faculty Curriculum Notes</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'curriculum' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}>
              {publishedNotes.length}
            </span>
          </button>
        </div>

        {/* Google Cloud Workspace status */}
        <div className="flex items-center gap-2 text-xs">
          {googleUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] truncate max-w-[180px] text-slate-400 font-mono">
                {googleUser.email}
              </span>
              <button
                onClick={onGoogleSignOut}
                className="text-[10px] text-slate-400 hover:text-red-400 underline cursor-pointer ml-1"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 rounded-xl transition text-xs font-semibold cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Connect Google Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          {syncDocUrl && onOpenInAppViewer && (
            <button
              onClick={() => onOpenInAppViewer(syncDocUrl, "Google Doc")}
              className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 flex items-center gap-1 font-bold"
            >
              <ExternalLink className="w-3 h-3" /> View Doc
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE TABS                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: PERSONAL NOTEBOOK (IMAGE & TEXT COMPOSER) */}
        {activeTab === 'notebook' && (
          <motion.div
            key="personal_notebook"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* ─── LEFT COLUMN: SAVED NOTES CATALOG (4 Cols) ─── */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#111C35] border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
                
                {/* Search notes bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={noteSearchTerm}
                    onChange={(e) => setNoteSearchTerm(e.target.value)}
                    placeholder="Search notes, formulas, topics..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#0B1228] border border-slate-800 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                  {noteSearchTerm && (
                    <button
                      onClick={() => setNoteSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Subject Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
                  <button
                    onClick={() => { playClickChime(); setActiveSubjectFilter('All'); }}
                    className={`px-2.5 py-1 rounded-lg shrink-0 font-bold text-[11px] transition ${
                      activeSubjectFilter === 'All'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    All ({customNotes.length})
                  </button>
                  {subjectsPool.map(sub => {
                    const count = customNotes.filter(n => {
                      const nSub = (n.subject || '').toLowerCase();
                      const sSub = sub.toLowerCase();
                      return n.subject === sub || nSub.includes(sSub) || sSub.includes(nSub);
                    }).length;
                    return (
                      <button
                        key={sub}
                        onClick={() => { playClickChime(); setActiveSubjectFilter(sub); }}
                        className={`px-2.5 py-1 rounded-lg shrink-0 font-bold text-[11px] transition flex items-center gap-1.5 ${
                          activeSubjectFilter === sub
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <span>{sub}</span>
                        {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Notes List */}
                <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                  {filteredPersonalNotes.length === 0 ? (
                    <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-800 space-y-2">
                      <Edit3 className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-300">No notes found</p>
                      <p className="text-[11px] text-slate-500">
                        {noteSearchTerm || activeSubjectFilter !== 'All'
                          ? 'Try resetting your search or filter.'
                          : 'Use the editor on the right to compose your first study note with text and diagrams.'}
                      </p>
                      <button
                        onClick={startNewNote}
                        className="mt-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-lg transition"
                      >
                        + Create Note
                      </button>
                    </div>
                  ) : (
                    filteredPersonalNotes.map((note) => {
                      const isEditing = editingNoteId === note.id;
                      const imgs = note.images || (note.imageUrl ? [note.imageUrl] : []);
                      const wordApprox = note.content ? note.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length : 0;

                      return (
                        <div
                          key={note.id}
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setNoteTitle(note.title);
                            setNoteContent(note.content);
                            setNoteSubject(note.subject);
                            setNoteColor(note.color || 'bg-amber-950/20');
                            setNoteImages(imgs);
                            if (editorRef.current) {
                              editorRef.current.innerHTML = note.content || '';
                            }
                            playClickChime();
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group text-left ${
                            isEditing
                              ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5'
                              : 'bg-[#0B1228] border-slate-800 hover:border-slate-700 hover:bg-[#0E1733]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono truncate">
                                  {note.subject}
                                </span>
                                {note.date && (
                                  <span className="text-[10px] text-slate-500">
                                    • {note.date}
                                  </span>
                                )}
                              </div>

                              <h3 className={`text-sm font-bold truncate leading-snug ${isEditing ? 'text-amber-300' : 'text-white'}`}>
                                {note.title}
                              </h3>

                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                {note.content.replace(/<[^>]*>/g, ' ').trim() || 'No preview text...'}
                              </p>
                            </div>

                            <button
                              onClick={(e) => deleteNote(note.id, e)}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition cursor-pointer shrink-0 opacity-70 group-hover:opacity-100"
                              title="Delete Note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Thumbnail Strip if images exist */}
                          {imgs.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                {imgs.slice(0, 3).map((im, iIdx) => (
                                  <img
                                    key={iIdx}
                                    src={im}
                                    alt="diagram"
                                    className="w-7 h-7 rounded-md object-cover border border-slate-700 shrink-0"
                                  />
                                ))}
                                {imgs.length > 3 && (
                                  <span className="text-[10px] text-slate-500 font-bold">
                                    +{imgs.length - 3}
                                  </span>
                                )}
                              </div>

                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <ImageIcon className="w-3 h-3" />
                                <span>{imgs.length} {imgs.length === 1 ? 'Diagram' : 'Diagrams'}</span>
                              </span>
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>{wordApprox} words</span>
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <span>Edit</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer sync option */}
                {customNotes.length > 0 && googleUser && (
                  <button
                    onClick={handleExportAllToGoogleSheets}
                    disabled={isSyncingSheet}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sync All Notes to Google Sheets</span>
                  </button>
                )}
              </div>
            </div>

            {/* ─── RIGHT COLUMN: PRO NOTE STUDIO CANVAS (8 Cols) ─── */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-[#111C35] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl relative">
                
                {/* Editor Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm sm:text-base text-white">
                        {editingNoteId ? 'Edit Study Note' : 'Draft New Study Note'}
                      </h2>
                      <span className="text-[11px] text-slate-400">
                        {wordCount} words • ~{Math.max(1, Math.ceil(wordCount / 180))} min read
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingNoteId && (
                      <button
                        onClick={startNewNote}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition cursor-pointer"
                        title="Clear editor to draft a blank note"
                      >
                        + New Blank Note
                      </button>
                    )}

                    {isSavedToast && (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                        <Check className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}

                    <button
                      onClick={saveToNotepad}
                      disabled={!noteTitle.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-md shadow-amber-500/20 active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Note</span>
                    </button>
                  </div>
                </div>

                {/* Note Metadata Row (Title, Subject, Category Color) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Note Title / Topic
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chapter 4: Emerging Tech - 4IR Principles & Smart Contracts"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full bg-[#0B1228] border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Subject
                    </label>
                    <select
                      value={noteSubject}
                      onChange={(e) => setNoteSubject(e.target.value)}
                      className="w-full bg-[#0B1228] border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs font-semibold text-white outline-none cursor-pointer"
                    >
                      {subjectsPool.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ─── PRO FORMATTING & IMAGE TOOLBAR ─── */}
                <div className="bg-[#0B1228] border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    
                    {/* Rich text formatting tools */}
                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => triggerToolbarCommand('bold')}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 font-bold transition cursor-pointer"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToolbarCommand('italic')}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 italic transition cursor-pointer"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToolbarCommand('underline')}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                        title="Underline"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToolbarCommand('strikeThrough')}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                        title="Strikethrough"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="w-px h-4 bg-slate-800 mx-1" />

                      <button
                        type="button"
                        onClick={() => triggerToolbarCommand('formatBlock', '<h2>')}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 font-black text-xs transition cursor-pointer"
                        title="Heading"
                      >
                        <Heading1 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToolbarCommand('formatBlock', '<h3>')}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 font-bold text-xs transition cursor-pointer"
                        title="Subheading"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToolbarCommand('insertUnorderedList')}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToolbarCommand('insertOrderedList')}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToolbarCommand('formatBlock', '<blockquote>')}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                        title="Quote"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Image Attachment Trigger Buttons */}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                      
                      {/* Mobile camera snap or file browser */}
                      <button
                        type="button"
                        onClick={() => { playClickChime(); fileInputRef.current?.click(); }}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="Upload photos, whiteboard snapshots, or diagrams"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>Add Photo / Diagram</span>
                      </button>

                      {/* URL Attachment toggle */}
                      <button
                        type="button"
                        onClick={() => { playClickChime(); setShowUrlInput(!showUrlInput); }}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs rounded-xl font-medium transition cursor-pointer flex items-center gap-1"
                        title="Paste web image link"
                      >
                        <LinkIcon className="w-3 h-3 text-slate-400" />
                        <span>Image Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Image URL Input Field */}
                  {showUrlInput && (
                    <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                      <input
                        type="url"
                        placeholder="Paste web image link (https://...)..."
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddImageUrl(); }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 cursor-pointer"
                      >
                        Attach
                      </button>
                    </div>
                  )}

                  {/* ─── ATTACHED IMAGE GALLERY CAROUSEL ─── */}
                  {noteImages.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-amber-300">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Attached Diagrams & Images ({noteImages.length})</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Click any image to view in full resolution
                        </span>
                      </div>

                      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {noteImages.map((imgSrc, idx) => (
                          <div
                            key={idx}
                            className="relative group shrink-0 w-28 h-28 rounded-xl overflow-hidden border border-amber-500/30 bg-black shadow-lg"
                          >
                            <img
                              src={imgSrc}
                              alt={`Attachment ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                              onClick={() => setImageModalUrl(imgSrc)}
                            />
                            
                            {/* Diagram Number Tag */}
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-amber-300 font-mono text-[9px] font-black">
                              #{idx + 1}
                            </span>

                            {/* Hover overlay with zoom */}
                            <button
                              type="button"
                              onClick={() => setImageModalUrl(imgSrc)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                              title="Zoom diagram"
                            >
                              <ZoomIn className="w-6 h-6 text-amber-300 drop-shadow-md" />
                            </button>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                              className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-500 text-white rounded-full shadow-md transition cursor-pointer"
                              title="Remove image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Color Selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Card Highlight:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {colorsList.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => { setNoteColor(c.class); playClickChime(); }}
                        className={`h-5 w-5 rounded-full border cursor-pointer transition-transform ${c.class.split(' ')[0]} ${
                          noteColor === c.class ? 'scale-125 border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-800'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* ─── RICH CONTENTEDITABLE EDITOR CANVAS ─── */}
                <div
                  ref={editorRef}
                  contentEditable
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setNoteImages(prev => [...prev, event.target!.result as string]);
                              playSuccessChime();
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }
                  }}
                  onInput={(e) => setNoteContent(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(noteContent) }}
                  className="w-full min-h-[320px] max-h-[500px] overflow-y-auto bg-[#0B1228] border border-slate-800 focus:border-amber-400/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 leading-relaxed outline-none font-sans space-y-2 select-text"
                  placeholder="Type or paste your study notes, definitions, formulas, and lecture summaries here... You can also paste clipboard screenshots (Ctrl+V) directly."
                />

                {/* ─── BOTTOM PRO ACTION DOCK ─── */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => exportNoteAsPdf(noteTitle || "Study_Note", noteContent)}
                      disabled={!noteTitle.trim()}
                      className="text-slate-400 hover:text-amber-400 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-30 transition"
                      title="Export note as formatted PDF with embedded diagrams"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Download PDF</span>
                    </button>

                    {googleUser && (
                      <button
                        onClick={() => handleExportToGoogleDoc(noteTitle, noteSubject, noteContent)}
                        disabled={!noteTitle.trim() || isSyncingDoc}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-30 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isSyncingDoc ? 'Exporting...' : 'Sync to Google Doc'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveToNotepad}
                      disabled={!noteTitle.trim()}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-30 shadow-lg shadow-amber-500/20 active:scale-95 transition"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Study Note</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: SUPABASE ACADEMIC CURRICULUM NOTES LIBRARY */}
        {activeTab === 'curriculum' && (
          <motion.div
            key="curriculum_notes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            <NotesLibraryView
              userId={userId || googleUser?.uid || 'student_wku'}
              onOpenNote={(id) => setReaderNoteId(id)}
              language={language}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. FULL-SCREEN LIGHTBOX ZOOM MODAL FOR DIAGRAMS & IMAGES                  */}
      {/* ========================================================================= */}
      {imageModalUrl && (
        <div 
          className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setImageModalUrl(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-xs text-slate-400">
              <span className="flex items-center gap-2 text-amber-400 font-bold">
                <ImageIcon className="w-4 h-4" />
                <span>Full Resolution Diagram View</span>
              </span>
              <button 
                onClick={() => setImageModalUrl(null)}
                className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-full transition cursor-pointer"
                title="Close Lightbox"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <img 
              src={imageModalUrl} 
              alt="High-resolution study diagram" 
              className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20 select-none bg-black" 
            />
          </div>
        </div>
      )}

    </div>
  );
}
