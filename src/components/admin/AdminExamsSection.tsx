/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Admin Exam Sheets Management Section
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Plus, Search, Edit3, Trash2, CheckCircle, XCircle, 
  Upload, Sparkles, Download, RefreshCw, AlertCircle, X, Check,
  Award, Calendar, Building2, BookOpen
} from 'lucide-react';
import { ExamSheetRecord, ContentAccessLevel, ContentStatus, ExamType } from '../../types';
import { saveAdminExam, deleteAdminExam, togglePublishAdminExam } from '../../utils/contentStore';
import { playClickChime, playSuccessChime, playFailureChime } from '../../utils/audio';

interface AdminExamsSectionProps {
  exams: ExamSheetRecord[];
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
  'Ministry of Education (National Exam)'
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
  'National Exit Exam'
];

const EXAM_TYPES: { value: ExamType; label: string; amLabel: string }[] = [
  { value: 'midterm', label: 'Midterm Exam', amLabel: 'የግማሽ ሰሚስተር ፈተና' },
  { value: 'final', label: 'Final Exam', amLabel: 'የመጨረሻ ፈተና' },
  { value: 'model', label: 'Model Exam', amLabel: 'ሞዴል ፈተና' },
  { value: 'quiz', label: 'Quiz / Test', amLabel: 'ፈተና / ኩዊዝ' },
  { value: 'exit_exam', label: 'National Exit Exam', amLabel: 'ብሔራዊ የመውጫ ፈተና' }
];

export default function AdminExamsSection({ exams, onRefresh, isAmharic }: AdminExamsSectionProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [uniFilter, setUniFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'pro'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSheetRecord | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUniversity, setFormUniversity] = useState('Wolkite University');
  const [formDepartment, setFormDepartment] = useState('Computer Science');
  const [formAcademicYear, setFormAcademicYear] = useState('Year 4 (Senior)');
  const [formCourse, setFormCourse] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formType, setFormType] = useState<ExamType>('final');
  const [formYear, setFormYear] = useState('2016 E.C.');
  const [formAccessLevel, setFormAccessLevel] = useState<ContentAccessLevel>('free');
  const [formAllowDownload, setFormAllowDownload] = useState(true);
  const [formStatus, setFormStatus] = useState<ContentStatus>('published');
  const [formPdfFile, setFormPdfFile] = useState<File | null>(null);

  const openCreateModal = () => {
    playClickChime();
    setEditingExam(null);
    setFormTitle('');
    setFormDescription('');
    setFormUniversity('Wolkite University');
    setFormDepartment('Computer Science');
    setFormAcademicYear('Year 4 (Senior)');
    setFormCourse('');
    setFormSubject('');
    setFormType('final');
    setFormYear('2016 E.C.');
    setFormAccessLevel('free');
    setFormAllowDownload(true);
    setFormStatus('published');
    setFormPdfFile(null);
    setShowModal(true);
  };

  const openEditModal = (exam: ExamSheetRecord) => {
    playClickChime();
    setEditingExam(exam);
    setFormTitle(exam.title);
    setFormDescription(exam.description || '');
    setFormUniversity(exam.university);
    setFormDepartment(exam.department);
    setFormAcademicYear(exam.academicYear);
    setFormCourse(exam.course);
    setFormSubject(exam.subject);
    setFormType(exam.examType);
    setFormYear(exam.examYear);
    setFormAccessLevel(exam.accessLevel);
    setFormAllowDownload(exam.allowDownload);
    setFormStatus(exam.status);
    setFormPdfFile(null);
    setShowModal(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUniversity.trim() || !formDepartment.trim() || !formCourse.trim()) {
      alert('Please fill in Title, University, Department, and Course Name.');
      return;
    }

    setFormSaving(true);
    playClickChime();

    try {
      const payload: Partial<ExamSheetRecord> = {
        id: editingExam?.id,
        title: formTitle.trim(),
        description: formDescription.trim(),
        university: formUniversity.trim(),
        department: formDepartment.trim(),
        academicYear: formAcademicYear.trim(),
        course: formCourse.trim(),
        subject: formSubject.trim() || formCourse.trim(),
        examType: formType,
        examYear: formYear.trim() || '2016 E.C.',
        accessLevel: formAccessLevel,
        allowDownload: formAllowDownload,
        status: formStatus
      };

      const res = await saveAdminExam(payload, formPdfFile);
      if (res.success) {
        playSuccessChime();
        setShowModal(false);
        onRefresh();
      } else {
        playFailureChime();
        alert(res.error || 'Failed to save exam sheet.');
      }
    } catch (err: any) {
      playFailureChime();
      alert(err.message || 'Error saving exam sheet.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleTogglePublish = async (exam: ExamSheetRecord) => {
    playClickChime();
    const newStatus: ContentStatus = exam.status === 'published' ? 'draft' : 'published';
    setActionLoading(prev => ({ ...prev, [exam.id]: true }));

    try {
      const res = await togglePublishAdminExam(exam.id, newStatus);
      if (res.success) {
        playSuccessChime();
        onRefresh();
      } else {
        alert(res.error || 'Failed to update publication status.');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [exam.id]: false }));
    }
  };

  const handleDelete = async (exam: ExamSheetRecord) => {
    if (!confirm(`Are you sure you want to permanently delete "${exam.title}"? This cannot be undone.`)) {
      return;
    }

    playClickChime();
    setActionLoading(prev => ({ ...prev, [exam.id]: true }));

    try {
      const res = await deleteAdminExam(exam.id);
      if (res.success) {
        playSuccessChime();
        onRefresh();
      } else {
        alert(res.error || 'Failed to delete exam.');
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [exam.id]: false }));
    }
  };

  // Filtered List
  const filteredExams = exams.filter(e => {
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesUni = uniFilter === 'all' || e.university.toLowerCase() === uniFilter.toLowerCase();
    const matchesDept = deptFilter === 'all' || e.department.toLowerCase() === deptFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || e.examType === typeFilter;
    const matchesAccess = accessFilter === 'all' || e.accessLevel === accessFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      e.title.toLowerCase().includes(q) ||
      e.course.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.examYear.toLowerCase().includes(q);

    return matchesStatus && matchesUni && matchesDept && matchesType && matchesAccess && matchesSearch;
  });

  const publishedCount = exams.filter(e => e.status === 'published').length;
  const draftCount = exams.filter(e => e.status === 'draft').length;
  const proCount = exams.filter(e => e.accessLevel === 'pro').length;

  return (
    <div className="space-y-6">
      {/* ─── TOP ACTION BAR & STATS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/60 text-xs text-slate-300 font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Total Exams: <strong className="text-white font-mono">{exams.length}</strong></span>
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
          <span>{isAmharic ? 'አዲስ የፈተና ወረቀት ጫን' : 'Upload Exam Sheet'}</span>
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
            placeholder={isAmharic ? 'የፈተና ወረቀት፣ ዓመት ወይም ኮርስ ፈልግ...' : 'Search exams, year, course, unit...'}
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

        {/* Exam Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">All Exam Types</option>
            {EXAM_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
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
            <option value="all">Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as any)}
            className="w-1/2 px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">Tier</option>
            <option value="free">Free</option>
            <option value="pro">Pro Only</option>
          </select>
        </div>
      </div>

      {/* ─── EXAMS LIST ─── */}
      {filteredExams.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/60 border border-slate-800/80 rounded-3xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {isAmharic ? 'ምንም የፈተና ወረቀት አልተገኘም' : 'No Exam Sheets in Database'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || uniFilter !== 'all'
              ? 'No exam sheets match the active search and filter criteria.'
              : 'Upload official past midterm, final, and exit exam sheets with PDF attachments for students.'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Exam</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredExams.map((exam) => {
            const isPublishing = actionLoading[exam.id];
            const examTypeObj = EXAM_TYPES.find(t => t.value === exam.examType);

            return (
              <motion.div
                key={exam.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-900/70 border rounded-2xl p-4.5 flex flex-col justify-between transition-all ${
                  exam.status === 'published'
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-amber-500/30 bg-amber-950/10'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        exam.status === 'published'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {exam.status === 'published' ? 'Published' : 'Draft'}
                      </span>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {examTypeObj?.label || exam.examType}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        exam.accessLevel === 'pro'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 flex items-center gap-1'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {exam.accessLevel === 'pro' && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
                        {exam.accessLevel === 'pro' ? 'Pro Member' : 'Free Access'}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                      {exam.examYear}
                    </span>
                  </div>

                  {/* Exam Card Details */}
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {exam.title}
                    </h4>
                    <p className="text-xs text-amber-400 font-medium truncate">
                      {exam.course} ({exam.subject})
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{exam.university}</span>
                      <span>•</span>
                      <span className="truncate">{exam.department}</span>
                    </div>
                  </div>

                  {/* Storage Status */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      {exam.pdfStoragePath || exam.pdfUrl ? 'PDF Attached in Vault' : 'No PDF attached'}
                    </span>
                    {exam.fileSize ? (
                      <span>{(exam.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                    ) : null}
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePublish(exam)}
                    disabled={isPublishing}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      exam.status === 'published'
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isPublishing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : exam.status === 'published' ? (
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
                      onClick={() => openEditModal(exam)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Edit Exam Sheet"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(exam)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors cursor-pointer"
                      title="Delete Exam"
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

      {/* ─── UPLOAD / EDIT EXAM MODAL ─── */}
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
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingExam ? 'Edit Exam Sheet' : 'Upload & Publish Exam Sheet'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Official University Past Examination Paper
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
              <form onSubmit={handleSaveExam} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Exam Sheet Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Operating Systems Final Exam 2016 E.C. (Wolkite University)"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* University & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      University / Institution *
                    </label>
                    <input
                      type="text"
                      list="uni-exam-list"
                      required
                      value={formUniversity}
                      onChange={(e) => setFormUniversity(e.target.value)}
                      placeholder="e.g. Wolkite University"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <datalist id="uni-exam-list">
                      {UNIVERSITIES.map(u => <option key={u} value={u} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Department *
                    </label>
                    <input
                      type="text"
                      list="dept-exam-list"
                      required
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <datalist id="dept-exam-list">
                      {DEPARTMENTS.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>
                </div>

                {/* Course, Subject, Exam Type, Exam Year */}
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
                      placeholder="e.g. Computer Networks & Security"
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
                      placeholder="e.g. Computer Science"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Exam Type
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {EXAM_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Exam Year
                    </label>
                    <input
                      type="text"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      placeholder="e.g. 2016 E.C. / 2024"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

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
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Description & Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Instructions, total marks, questions count, or answer key guidance."
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
                          name="examAccessLevel"
                          checked={formAccessLevel === 'free'}
                          onChange={() => setFormAccessLevel('free')}
                          className="accent-emerald-500"
                        />
                        <span>Free</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-amber-400 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="examAccessLevel"
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
                          name="examStatus"
                          checked={formStatus === 'published'}
                          onChange={() => setFormStatus('published')}
                          className="accent-emerald-500"
                        />
                        <span>Published</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="examStatus"
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

                {/* PDF Upload */}
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Upload Exam Sheet PDF *</span>
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
                  ) : editingExam?.pdfStoragePath ? (
                    <p className="text-[10px] text-slate-500 font-mono">
                      Existing PDF file linked in storage.
                    </p>
                  ) : null}
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
                        <span>{editingExam ? 'Update Exam' : 'Publish Exam'}</span>
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
