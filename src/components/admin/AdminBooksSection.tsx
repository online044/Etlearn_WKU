/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Admin Books Management Section
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Plus, Search, Edit3, Trash2, CheckCircle, XCircle, 
  Upload, FileText, Image as ImageIcon, Lock, Sparkles, Download, 
  Eye, RefreshCw, AlertCircle, X, ChevronDown, Check, Filter
} from 'lucide-react';
import { BookRecord, ContentAccessLevel, ContentStatus } from '../../types';
import { saveAdminBook, deleteAdminBook, togglePublishAdminBook } from '../../utils/contentStore';
import { playClickChime, playSuccessChime, playFailureChime } from '../../utils/audio';

interface AdminBooksSectionProps {
  books: BookRecord[];
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
  'Chemistry',
  'Freshman Common Courses'
];

const ACADEMIC_YEARS = [
  'Year 1 (Freshman)',
  'Year 2 (Sophomore)',
  'Year 3 (Junior)',
  'Year 4 (Senior)',
  'Year 5 (Graduate/Engineering)',
  'General / All Years'
];

export default function AdminBooksSection({ books, onRefresh, isAmharic }: AdminBooksSectionProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [uniFilter, setUniFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'pro'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRecord | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUniversity, setFormUniversity] = useState('Wolkite University');
  const [formDepartment, setFormDepartment] = useState('Computer Science');
  const [formAcademicYear, setFormAcademicYear] = useState('Year 1 (Freshman)');
  const [formCourse, setFormCourse] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formUnit, setFormUnit] = useState('Full Curriculum');
  const [formAccessLevel, setFormAccessLevel] = useState<ContentAccessLevel>('free');
  const [formAllowDownload, setFormAllowDownload] = useState(true);
  const [formStatus, setFormStatus] = useState<ContentStatus>('published');
  const [formPdfFile, setFormPdfFile] = useState<File | null>(null);
  const [formCoverFile, setFormCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');

  const openCreateModal = () => {
    playClickChime();
    setEditingBook(null);
    setFormTitle('');
    setFormDescription('');
    setFormUniversity('Wolkite University');
    setFormDepartment('Computer Science');
    setFormAcademicYear('Year 1 (Freshman)');
    setFormCourse('');
    setFormSubject('');
    setFormUnit('Full Curriculum');
    setFormAccessLevel('free');
    setFormAllowDownload(true);
    setFormStatus('published');
    setFormPdfFile(null);
    setFormCoverFile(null);
    setCoverPreviewUrl('');
    setShowModal(true);
  };

  const openEditModal = (book: BookRecord) => {
    playClickChime();
    setEditingBook(book);
    setFormTitle(book.title);
    setFormDescription(book.description || '');
    setFormUniversity(book.university);
    setFormDepartment(book.department);
    setFormAcademicYear(book.academicYear);
    setFormCourse(book.course);
    setFormSubject(book.subject);
    setFormUnit(book.unit || 'Full Curriculum');
    setFormAccessLevel(book.accessLevel);
    setFormAllowDownload(book.allowDownload);
    setFormStatus(book.status);
    setFormPdfFile(null);
    setFormCoverFile(null);
    setCoverPreviewUrl(book.coverUrl || '');
    setShowModal(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUniversity.trim() || !formDepartment.trim() || !formCourse.trim()) {
      alert('Please fill in Title, University, Department, and Course Name.');
      return;
    }

    setFormSaving(true);
    playClickChime();

    try {
      const payload: Partial<BookRecord> = {
        id: editingBook?.id,
        title: formTitle.trim(),
        description: formDescription.trim(),
        university: formUniversity.trim(),
        department: formDepartment.trim(),
        academicYear: formAcademicYear.trim(),
        course: formCourse.trim(),
        subject: formSubject.trim() || formCourse.trim(),
        unit: formUnit.trim() || 'Full Curriculum',
        accessLevel: formAccessLevel,
        allowDownload: formAllowDownload,
        status: formStatus
      };

      const res = await saveAdminBook(payload, formPdfFile, formCoverFile);
      if (res.success) {
        playSuccessChime();
        setShowModal(false);
        onRefresh();
      } else {
        playFailureChime();
        alert(res.error || 'Failed to save book.');
      }
    } catch (err: any) {
      playFailureChime();
      alert(err.message || 'Error saving book.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleTogglePublish = async (book: BookRecord) => {
    playClickChime();
    const newStatus: ContentStatus = book.status === 'published' ? 'draft' : 'published';
    setActionLoading(prev => ({ ...prev, [book.id]: true }));

    try {
      const res = await togglePublishAdminBook(book.id, newStatus);
      if (res.success) {
        playSuccessChime();
        onRefresh();
      } else {
        alert(res.error || 'Failed to update publication status.');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [book.id]: false }));
    }
  };

  const handleDelete = async (book: BookRecord) => {
    if (!confirm(`Are you sure you want to permanently delete "${book.title}"? This cannot be undone.`)) {
      return;
    }

    playClickChime();
    setActionLoading(prev => ({ ...prev, [book.id]: true }));

    try {
      const res = await deleteAdminBook(book.id);
      if (res.success) {
        playSuccessChime();
        onRefresh();
      } else {
        alert(res.error || 'Failed to delete book.');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [book.id]: false }));
    }
  };

  // Filtered List
  const filteredBooks = books.filter(b => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesUni = uniFilter === 'all' || b.university.toLowerCase() === uniFilter.toLowerCase();
    const matchesDept = deptFilter === 'all' || b.department.toLowerCase() === deptFilter.toLowerCase();
    const matchesAccess = accessFilter === 'all' || b.accessLevel === accessFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      b.title.toLowerCase().includes(q) ||
      b.course.toLowerCase().includes(q) ||
      b.subject.toLowerCase().includes(q) ||
      (b.unit && b.unit.toLowerCase().includes(q));

    return matchesStatus && matchesUni && matchesDept && matchesAccess && matchesSearch;
  });

  const publishedCount = books.filter(b => b.status === 'published').length;
  const draftCount = books.filter(b => b.status === 'draft').length;
  const proCount = books.filter(b => b.accessLevel === 'pro').length;

  return (
    <div className="space-y-6">
      {/* ─── TOP ACTION BAR & STATS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/60 text-xs text-slate-300 font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Total Books: <strong className="text-white font-mono">{books.length}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Published: <strong className="font-mono">{publishedCount}</strong></span>
          </div>
          {draftCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Drafts: <strong className="font-mono">{draftCount}</strong></span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pro Tier: <strong className="font-mono">{proCount}</strong></span>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 cursor-pointer transition-all active:scale-98 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAmharic ? 'አዲስ መጽሐፍ ጨምር' : 'Add New Book'}</span>
        </button>
      </div>

      {/* ─── SEARCH & FILTERS BAR ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-950 border border-slate-800/80 p-3.5 rounded-2xl">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAmharic ? 'መጽሐፍ፣ ኮርስ ወይም የትምህርት ርዕስ ፈልግ...' : 'Search books, courses, subjects...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* University Filter */}
        <div>
          <select
            value={uniFilter}
            onChange={(e) => setUniFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">All Universities</option>
            {UNIVERSITIES.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Status / Access Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-1/2 px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">Status: All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as any)}
            className="w-1/2 px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">Tier: All</option>
            <option value="free">Free</option>
            <option value="pro">Pro Only</option>
          </select>
        </div>
      </div>

      {/* ─── BOOKS LIST ─── */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/60 border border-slate-800/80 rounded-3xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {isAmharic ? 'ምንም መጽሐፍ አልተገኘም' : 'No Books in Database'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || uniFilter !== 'all'
              ? 'No books match the active search and filter criteria.'
              : 'Add official university course textbooks and curriculum modules to populate the student digital library.'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Book</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBooks.map((book) => {
            const isPublishing = actionLoading[book.id];
            return (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-900/70 border rounded-2xl p-4.5 flex flex-col justify-between transition-all ${
                  book.status === 'published'
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-amber-500/30 bg-amber-950/10'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        book.status === 'published'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {book.status === 'published' ? 'Published' : 'Draft'}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        book.accessLevel === 'pro'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 flex items-center gap-1'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {book.accessLevel === 'pro' && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
                        {book.accessLevel === 'pro' ? 'Pro Member' : 'Free Access'}
                      </span>

                      {book.allowDownload && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                          <Download className="w-2.5 h-2.5" />
                          <span>DL</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-slate-500">
                      {book.academicYear}
                    </div>
                  </div>

                  {/* Book Card Details */}
                  <div className="flex gap-3 items-start">
                    {book.coverUrl ? (
                      <img 
                        src={book.coverUrl} 
                        alt={book.title} 
                        className="w-14 h-18 object-cover rounded-lg border border-slate-700/60 bg-slate-950 shrink-0 shadow-md" 
                      />
                    ) : (
                      <div className="w-14 h-18 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-amber-400 shrink-0 p-1 text-center shadow-md">
                        <BookOpen className="w-6 h-6" />
                        <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase truncate w-full">
                          {book.subject?.slice(0, 8)}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                        {book.title}
                      </h4>
                      <p className="text-xs text-amber-400/90 font-medium truncate">
                        {book.course}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {book.university} • {book.department}
                      </p>
                      {book.unit && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          Unit/Module: {book.unit}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Storage Status */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      {book.pdfStoragePath || book.pdfUrl ? 'PDF Ready in Vault' : 'No PDF attached'}
                    </span>
                    {book.fileSize ? (
                      <span>{(book.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                    ) : null}
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePublish(book)}
                    disabled={isPublishing}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      book.status === 'published'
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isPublishing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : book.status === 'published' ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Unpublish</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(book)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Edit Book Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(book)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors cursor-pointer"
                      title="Delete Book"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE / EDIT BOOK MODAL ─── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingBook ? 'Edit Book / Module' : 'Create & Publish New Book'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Database-backed University Curriculum Resource
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveBook} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Book / Module Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Fundamentals of Data Structures & Algorithms"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* University & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      University *
                    </label>
                    <input
                      type="text"
                      list="uni-list"
                      required
                      value={formUniversity}
                      onChange={(e) => setFormUniversity(e.target.value)}
                      placeholder="e.g. Wolkite University"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <datalist id="uni-list">
                      {UNIVERSITIES.map(u => <option key={u} value={u} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Department *
                    </label>
                    <input
                      type="text"
                      list="dept-list"
                      required
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <datalist id="dept-list">
                      {DEPARTMENTS.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>
                </div>

                {/* Course, Subject, Academic Year, Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Course Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCourse}
                      onChange={(e) => setFormCourse(e.target.value)}
                      placeholder="e.g. Data Structures (CoSc 2031)"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Subject / Discipline
                    </label>
                    <input
                      type="text"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="e.g. Computer Science / Programming"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Academic Year
                    </label>
                    <select
                      value={formAcademicYear}
                      onChange={(e) => setFormAcademicYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Unit / Chapter / Module
                    </label>
                    <input
                      type="text"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      placeholder="e.g. Unit 1: Introduction, or Full Module"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Description / Overview
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of this textbook, key topics covered, and university syllabus alignment."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Access Level & Download Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
                  <div>
                    <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      Access Level
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="accessLevel"
                          checked={formAccessLevel === 'free'}
                          onChange={() => setFormAccessLevel('free')}
                          className="accent-emerald-500"
                        />
                        <span>Free</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-amber-400 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="accessLevel"
                          checked={formAccessLevel === 'pro'}
                          onChange={() => setFormAccessLevel('pro')}
                          className="accent-amber-500"
                        />
                        <span>Pro Only</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="bookStatus"
                          checked={formStatus === 'published'}
                          onChange={() => setFormStatus('published')}
                          className="accent-emerald-500"
                        />
                        <span>Published</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="bookStatus"
                          checked={formStatus === 'draft'}
                          onChange={() => setFormStatus('draft')}
                          className="accent-amber-500"
                        />
                        <span>Draft</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      Download Access
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={formAllowDownload}
                        onChange={(e) => setFormAllowDownload(e.target.checked)}
                        className="accent-amber-500"
                      />
                      <span>Allow PDF Download</span>
                    </label>
                  </div>
                </div>

                {/* PDF & Cover Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* PDF Upload */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>Upload Textbook PDF</span>
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFormPdfFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 cursor-pointer"
                    />
                    {formPdfFile ? (
                      <p className="text-[10px] text-emerald-400 font-mono">
                        Selected: {formPdfFile.name} ({(formPdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    ) : editingBook?.pdfStoragePath ? (
                      <p className="text-[10px] text-slate-500 font-mono">
                        Existing PDF file linked in storage.
                      </p>
                    ) : null}
                  </div>

                  {/* Cover Image Upload */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span>Cover Image (Optional)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setFormCoverFile(file);
                          const url = URL.createObjectURL(file);
                          setCoverPreviewUrl(url);
                        }
                      }}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-purple-400 hover:file:bg-slate-700 cursor-pointer"
                    />
                    {coverPreviewUrl && (
                      <div className="flex items-center gap-2 pt-1">
                        <img src={coverPreviewUrl} alt="Cover Preview" className="w-8 h-10 object-cover rounded border border-slate-700" />
                        <span className="text-[10px] text-emerald-400">Cover preview loaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={formSaving}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {formSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingBook ? 'Update Book' : 'Publish Book'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
