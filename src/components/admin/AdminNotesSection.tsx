/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Admin Study Notes Management Section
 * Complete authoring & publishing suite for university course notes, summaries, and lecture guides.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Plus, Search, Edit3, Trash2, CheckCircle, XCircle, 
  Upload, Download, RefreshCw, AlertCircle, X, Check,
  BookOpen, Eye, Layers, FileCode, Bold, List, Tag, Shield, Sparkles
} from 'lucide-react';
import { NoteRecord, ContentAccessLevel, ContentStatus } from '../../types';
import { saveAdminNote, deleteAdminNote, togglePublishAdminNote } from '../../utils/contentStore';
import { playClickChime, playSuccessChime, playFailureChime } from '../../utils/audio';
import AdminSupabaseNotesManager from './AdminSupabaseNotesManager';

interface AdminNotesSectionProps {
  notes: NoteRecord[];
  onRefresh: () => void;
  isAmharic: boolean;
}

const UNIVERSITIES = [
  'Wolkite University',
  'Addis Ababa University',
  'Jimma University',
  'Hawassa University',
  'Bahir Dar University',
  'Haramaya University',
  'Arba Minch University',
  'University of Gondar',
  'Mekelle University',
  'Dilla University',
  'Debre Markos University',
  'All Ethiopian Universities'
];

const DEPARTMENTS = [
  'Freshman Common Courses',
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Medicine (MD)',
  'Nursing & Public Health',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Computer Engineering',
  'Economics',
  'Management',
  'Accounting & Finance',
  'Law (LL.B)',
  'Biology',
  'Physics',
  'Mathematics',
  'Chemistry'
];

const ACADEMIC_YEARS = [
  'Year 1 (Freshman)',
  'Year 2 (Sophomore)',
  'Year 3 (Junior)',
  'Year 4 (Senior)',
  'Year 5 (Graduate/Engineering)'
];

export default function AdminNotesSection({ notes, onRefresh, isAmharic }: AdminNotesSectionProps) {
  const [notesSubTab, setNotesSubTab] = useState<'supabase' | 'cms'>('supabase');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [uniFilter, setUniFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'pro'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteRecord | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUniversity, setFormUniversity] = useState('Wolkite University');
  const [formDepartment, setFormDepartment] = useState('Freshman Common Courses');
  const [formAcademicYear, setFormAcademicYear] = useState('Year 1 (Freshman)');
  const [formCourse, setFormCourse] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formUnit, setFormUnit] = useState('Chapter 1');
  const [formContent, setFormContent] = useState('');
  const [formAccessLevel, setFormAccessLevel] = useState<ContentAccessLevel>('free');
  const [formAllowDownload, setFormAllowDownload] = useState(true);
  const [formStatus, setFormStatus] = useState<ContentStatus>('published');
  const [formAuthor, setFormAuthor] = useState('Wolkite University Educator');
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [previewNote, setPreviewNote] = useState<NoteRecord | null>(null);

  // Filtered Notes
  const filteredNotes = notes.filter(n => {
    if (statusFilter !== 'all' && n.status !== statusFilter) return false;
    if (uniFilter !== 'all' && n.university !== uniFilter) return false;
    if (deptFilter !== 'all' && n.department !== deptFilter) return false;
    if (accessFilter !== 'all' && n.accessLevel !== accessFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match = n.title.toLowerCase().includes(q) ||
        n.course.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        (n.description && n.description.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const openCreateModal = () => {
    playClickChime();
    setEditingNote(null);
    setFormTitle('');
    setFormDescription('');
    setFormUniversity('Wolkite University');
    setFormDepartment('Freshman Common Courses');
    setFormAcademicYear('Year 1 (Freshman)');
    setFormCourse('EmTe 1012');
    setFormSubject('Emerging Technologies');
    setFormUnit('Chapter 1');
    setFormContent(`# Chapter 1: Introduction to Course\n\n## 1.1 Core Concepts\n* Write your authentic lecture summary here...\n\n## 1.2 Key Formulas & Principles\n* Insert essential exam highlights...\n`);
    setFormAccessLevel('free');
    setFormAllowDownload(true);
    setFormStatus('published');
    setFormAuthor('Wolkite University Educator');
    setSelectedPdfFile(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (note: NoteRecord) => {
    playClickChime();
    setEditingNote(note);
    setFormTitle(note.title);
    setFormDescription(note.description || '');
    setFormUniversity(note.university);
    setFormDepartment(note.department);
    setFormAcademicYear(note.academicYear);
    setFormCourse(note.course);
    setFormSubject(note.subject);
    setFormUnit(note.unit || 'Chapter 1');
    setFormContent(note.content || '');
    setFormAccessLevel(note.accessLevel);
    setFormAllowDownload(note.allowDownload);
    setFormStatus(note.status);
    setFormAuthor(note.author || 'Educator');
    setSelectedPdfFile(null);
    setFormError('');
    setShowModal(true);
  };

  const insertSnippet = (prefix: string, suffix: string = '') => {
    setFormContent(prev => prev + `\n${prefix} ` + (suffix ? ` ${suffix}\n` : '\n'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError(isAmharic ? 'እባክዎ የማስታወሻ ርዕስ ያስገቡ።' : 'Please provide a note title.');
      playFailureChime();
      return;
    }
    if (!formCourse.trim() || !formSubject.trim()) {
      setFormError(isAmharic ? 'እባክዎ ኮርስ እና የትምህርት ዓይነት ያስገቡ።' : 'Course and Subject are required.');
      playFailureChime();
      return;
    }
    if (!formContent.trim()) {
      setFormError(isAmharic ? 'እባክዎ የማስታወሻውን ይዘት ይጻፉ።' : 'Please write the note content.');
      playFailureChime();
      return;
    }

    setFormSaving(true);
    setFormError('');

    try {
      const payload: Partial<NoteRecord> = {
        id: editingNote?.id,
        title: formTitle.trim(),
        description: formDescription.trim(),
        university: formUniversity,
        department: formDepartment,
        academicYear: formAcademicYear,
        course: formCourse.trim(),
        subject: formSubject.trim(),
        unit: formUnit.trim(),
        content: formContent.trim(),
        accessLevel: formAccessLevel,
        allowDownload: formAllowDownload,
        status: formStatus,
        author: formAuthor.trim(),
        pdfUrl: editingNote?.pdfUrl
      };

      const res = await saveAdminNote(payload, selectedPdfFile);
      if (res.success) {
        playSuccessChime();
        setShowModal(false);
        onRefresh();
      } else {
        setFormError(res.error || 'Failed to save note');
        playFailureChime();
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred');
      playFailureChime();
    } finally {
      setFormSaving(false);
    }
  };

  const handleTogglePublish = async (note: NoteRecord) => {
    playClickChime();
    setActionLoading(prev => ({ ...prev, [note.id]: true }));
    try {
      const res = await togglePublishAdminNote(note.id, note.status);
      if (res.success) {
        playSuccessChime();
        onRefresh();
      } else {
        playFailureChime();
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [note.id]: false }));
    }
  };

  const handleDelete = async (note: NoteRecord) => {
    const confirmMsg = isAmharic 
      ? `እርግጠኛ ነዎት "${note.title}" ማስታወሻን መሰረዝ ይፈልጋሉ?`
      : `Are you sure you want to delete note "${note.title}"?`;
    if (!window.confirm(confirmMsg)) return;

    playClickChime();
    setActionLoading(prev => ({ ...prev, [note.id]: true }));
    try {
      const res = await deleteAdminNote(note.id);
      if (res.success) {
        playSuccessChime();
        onRefresh();
      } else {
        playFailureChime();
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [note.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Segmented Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-[#0B1228] border border-slate-800 rounded-2xl">
        <div className="inline-flex p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-bold gap-1">
          <button
            onClick={() => { playClickChime(); setNotesSubTab('supabase'); }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              notesSubTab === 'supabase'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Supabase Curriculum Notes & Chapters</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
              notesSubTab === 'supabase' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
            }`}>
              Live Postgres
            </span>
          </button>

          <button
            onClick={() => { playClickChime(); setNotesSubTab('cms'); }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              notesSubTab === 'cms'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Faculty Summaries & PDF Notes</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
              notesSubTab === 'cms' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
            }`}>
              {notes.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px]">Database Active</span>
        </div>
      </div>

      {notesSubTab === 'supabase' ? (
        <AdminSupabaseNotesManager isAmharic={isAmharic} onRefreshParent={onRefresh} />
      ) : (
        <>
          {/* Top Header & Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-amber-400" />
                {isAmharic ? 'የጥናት ማስታወሻዎች አስተዳደር (Study Notes CMS)' : 'Study Notes Management (CMS)'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isAmharic 
                  ? 'በእርስዎ የተዘጋጁ እና የታተሙ የዩኒቨርሲቲ ኮርስ ማጠቃለያዎች፣ ሰነዶች እና ሌክቸር ማስታወሻዎች'
                  : 'Real university department study notes, lecture summaries, and formulas authored and published by you.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isAmharic ? 'አዲስ ማስታወሻ ጻፍና አትም' : 'Write & Publish Note'}
              </button>
            </div>
          </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isAmharic ? 'በኮርስ፣ ርዕስ ወይም ይዘት ፈልግ...' : 'Search by course, title, or content...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
        >
          <option value="all">{isAmharic ? 'ሁሉም የትምህርት ክፍሎች' : 'All Departments'}</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={accessFilter}
          onChange={e => setAccessFilter(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
        >
          <option value="all">{isAmharic ? 'ሁሉም ፈቃድ (Free/Pro)' : 'All Access (Free/Pro)'}</option>
          <option value="free">Free Only</option>
          <option value="pro">Pro Only</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
        >
          <option value="all">{isAmharic ? 'ሁሉም ሁኔታ' : 'All Statuses'}</option>
          <option value="published">{isAmharic ? 'የታተመ (Published)' : 'Published'}</option>
          <option value="draft">{isAmharic ? 'ረቂቅ (Draft)' : 'Draft'}</option>
        </select>
      </div>

      {/* Notes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map(note => (
          <motion.div
            key={note.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  note.status === 'published' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {note.status === 'published' ? (isAmharic ? 'የታተመ' : 'Published') : (isAmharic ? 'ረቂቅ' : 'Draft')}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    note.accessLevel === 'pro' 
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {note.accessLevel.toUpperCase()}
                  </span>
                  {note.pdfUrl && (
                    <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <FileText className="w-3 h-3" /> PDF
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Meta */}
              <h3 className="font-bold text-slate-100 text-base line-clamp-2 leading-snug">
                {note.title}
              </h3>
              <div className="text-xs text-amber-400/90 font-medium mt-1">
                {note.course} • {note.unit || 'Module 1'}
              </div>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {note.description || note.content.substring(0, 120) + '...'}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap gap-2 items-center">
                <span>{note.university}</span>
                <span>•</span>
                <span>{note.department}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setPreviewNote(note)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Preview Note"
              >
                <Eye className="w-3.5 h-3.5" />
                {isAmharic ? 'ይመልከቱ' : 'Read'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTogglePublish(note)}
                  disabled={actionLoading[note.id]}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
                    note.status === 'published' 
                      ? 'text-amber-400 hover:bg-amber-400/10' 
                      : 'text-emerald-400 hover:bg-emerald-400/10'
                  }`}
                >
                  {note.status === 'published' ? (isAmharic ? 'አውርድ (Draft)' : 'Unpublish') : (isAmharic ? 'አትም' : 'Publish')}
                </button>

                <button
                  onClick={() => openEditModal(note)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                  title="Edit Note"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(note)}
                  disabled={actionLoading[note.id]}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium text-sm">
              {isAmharic ? 'ምንም የተገኘ ማስታወሻ የለም።' : 'No study notes found matching filters.'}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {isAmharic ? 'አዲስ ማስታወሻ ለመጻፍ እና ለተማሪዎች ለማተም ከላይ ያለውን አዝራር ይጠቀሙ።' : 'Click "Write & Publish Note" to create authentic course materials.'}
            </p>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-100">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  {editingNote 
                    ? (isAmharic ? 'ማስታወሻ አስተካክል' : 'Edit Study Note')
                    : (isAmharic ? 'አዲስ የጥናት ማስታወሻ ጻፍና አትም' : 'Author & Publish Study Note')}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <form onSubmit={handleSave} className="mt-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAmharic ? 'የማስታወሻ ርዕስ *' : 'Note Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g. Emerging Technologies: Unit 1 & 2 Master Revision Guide"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Course, Subject, Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAmharic ? 'የኮርስ ኮድ / ስም *' : 'Course Code / Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formCourse}
                      onChange={e => setFormCourse(e.target.value)}
                      placeholder="e.g. EmTe 1012"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAmharic ? 'የትምህርት ዓይነት *' : 'Subject *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formSubject}
                      onChange={e => setFormSubject(e.target.value)}
                      placeholder="e.g. Emerging Tech"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAmharic ? 'ምዕራፍ / ዩኒት' : 'Unit / Chapter'}
                    </label>
                    <input
                      type="text"
                      value={formUnit}
                      onChange={e => setFormUnit(e.target.value)}
                      placeholder="e.g. Chapter 1 - 3"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* University, Department, Academic Year */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAmharic ? 'ዩኒቨርሲቲ' : 'University'}
                    </label>
                    <select
                      value={formUniversity}
                      onChange={e => setFormUniversity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAmharic ? 'የትምህርት ክፍል' : 'Department'}
                    </label>
                    <select
                      value={formDepartment}
                      onChange={e => setFormDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAmharic ? 'የትምህርት ዓመት' : 'Academic Year'}
                    </label>
                    <select
                      value={formAcademicYear}
                      onChange={e => setFormAcademicYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAmharic ? 'አጭር መግለጫ' : 'Short Summary / Overview'}
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Brief description of topics covered in this study note"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Content Area with Quick Format Toolbar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {isAmharic ? 'የማስታወሻው ይዘት (Rich Markdown Content) *' : 'Study Note Content (Markdown) *'}
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertSnippet('##')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                        title="Heading"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('* **Key Concept**:')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                        title="Bullet list"
                      >
                        <List className="w-3 h-3 inline" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('```\nFormula: E = mc^2\n```')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                        title="Formula / Code box"
                      >
                        <FileCode className="w-3 h-3 inline" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    required
                    rows={9}
                    value={formContent}
                    onChange={e => setFormContent(e.target.value)}
                    placeholder="Write detailed study notes, chapter summaries, formulas, and diagrams here..."
                    className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                </div>

                {/* PDF Attachment (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isAmharic ? 'ተያያዥ PDF ሰነድ (አስፈላጊ ከሆነ)' : 'Attach Lecture PDF / Summary Sheet (Optional)'}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedPdfFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700"
                  />
                  {editingNote?.pdfUrl && !selectedPdfFile && (
                    <span className="text-[11px] text-emerald-400 mt-1 inline-block">
                      ✓ Existing PDF attached
                    </span>
                  )}
                </div>

                {/* Access Level, Status & Author */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAmharic ? 'የፈቃድ ደረጃ' : 'Access Tier'}
                    </label>
                    <select
                      value={formAccessLevel}
                      onChange={e => setFormAccessLevel(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="free">Free (ለሁሉም ተማሪዎች ክፍት)</option>
                      <option value="pro">Pro Only (ፕሪሚየም)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAmharic ? 'የህትመት ሁኔታ' : 'Publish Status'}
                    </label>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="published">Published (በቀጥታ ይተም)</option>
                      <option value="draft">Draft (ረቂቅ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isAmharic ? 'አዘጋጅ / አስተማሪ' : 'Author / Educator'}
                    </label>
                    <input
                      type="text"
                      value={formAuthor}
                      onChange={e => setFormAuthor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                  >
                    {isAmharic ? 'ሰርዝ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    {formSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {isAmharic ? 'በመመዝገብ ላይ...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {formStatus === 'published' 
                          ? (isAmharic ? 'አትም (Publish to Students)' : 'Publish Note') 
                          : (isAmharic ? 'ረቂቅ አስቀምጥ' : 'Save as Draft')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reader Preview Modal */}
      <AnimatePresence>
        {previewNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-semibold">
                      {previewNote.course}
                    </span>
                    <span className="text-xs text-slate-400">
                      {previewNote.department} • {previewNote.academicYear}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">
                    {previewNote.title}
                  </h2>
                </div>
                <button
                  onClick={() => setPreviewNote(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 prose prose-invert max-w-none text-slate-200 space-y-4">
                <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  {previewNote.content}
                </div>
              </div>

              {previewNote.pdfUrl && (
                <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-sky-400" />
                    <div>
                      <div className="text-sm font-semibold text-slate-200">Attached Study Document (PDF)</div>
                      <div className="text-xs text-slate-400">Authentic university lecture PDF</div>
                    </div>
                  </div>
                  <a
                    href={previewNote.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View PDF
                  </a>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setPreviewNote(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-200"
                >
                  {isAmharic ? 'ዝጋ' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
