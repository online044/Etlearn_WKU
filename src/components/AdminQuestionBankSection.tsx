import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database, Upload, Download, Search, Plus, Filter, CheckCircle2,
  AlertTriangle, XCircle, Trash2, Edit3, Eye, RefreshCw, Layers,
  ChevronLeft, ChevronRight, Check, X, ShieldCheck, FileText,
  FileCode, CheckSquare, Square, Sparkles, HelpCircle, ArrowUpDown
} from 'lucide-react';
import {
  QuestionBankRecord,
  QuestionBankFilter,
  QuestionValidationSummary,
  QuestionBankStats,
  BankQuestionType,
  BankDifficulty,
  BankExamCategory
} from '../types';
import {
  fetchQuestionsPaginated,
  fetchQuestionBankStats,
  parseImportFile,
  validateQuestionsBatch,
  importQuestionsBatch,
  updateQuestion,
  deleteQuestion,
  bulkDeleteQuestions,
  bulkPublishQuestions,
  exportQuestions,
  generateAiQuestionDrafts,
  OFFICIAL_19_SUBJECTS
} from '../utils/supabaseQuestions';
import { SAMPLE_10_TEST_BATCH_JSON_STRING } from '../data/seedQuestions';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';

interface AdminQuestionBankSectionProps {
  isAmharic?: boolean;
  onRefreshStats?: () => void;
}

export const AdminQuestionBankSection: React.FC<AdminQuestionBankSectionProps> = ({
  isAmharic = false,
  onRefreshStats
}) => {
  // ─── CORE STATE ───
  const [questions, setQuestions] = useState<QuestionBankRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<QuestionBankStats | null>(null);

  // ─── FILTER & PAGINATION STATE ───
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('All');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterUnit, setFilterUnit] = useState<string>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterBatch, setFilterBatch] = useState<string>('All');

  // ─── SELECTION STATE ───
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── MODALS ───
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionBankRecord | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankRecord | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // ─── IMPORT FLOW STATE ───
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importBatchId, setImportBatchId] = useState<string>(() => `batch-imp-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6)}`);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<QuestionValidationSummary | null>(null);
  const [importProgress, setImportProgress] = useState<{ active: boolean; current: number; total: number; statusText: string } | null>(null);
  const [importSummaryReport, setImportSummaryReport] = useState<{ imported: number; duplicates: number; invalid: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── AI QUESTION GENERATOR WORKFLOW STATE ───
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiSubject, setAiSubject] = useState<string>("General Biology");
  const [aiCourse, setAiCourse] = useState<string>("General Biology Module");
  const [aiUnit, setAiUnit] = useState<string>("Cell Biology");
  const [aiTopic, setAiTopic] = useState<string>("Cell Structure & Function");
  const [aiCount, setAiCount] = useState<number>(10);
  const [aiEasyPct, setAiEasyPct] = useState<number>(40);
  const [aiMedPct, setAiMedPct] = useState<number>(40);
  const [aiHardPct, setAiHardPct] = useState<number>(20);
  const [aiQuestionType, setAiQuestionType] = useState<string>("multiple_choice");
  const [aiSource, setAiSource] = useState<string>("General Biology Module");
  const [aiSourceUnit, setAiSourceUnit] = useState<string>("Cell Biology");
  const [aiSourceFile, setAiSourceFile] = useState<string>("general_biology_module.pdf");
  const [aiSourceExcerpt, setAiSourceExcerpt] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiReviewQuestions, setAiReviewQuestions] = useState<any[]>([]);
  const [aiApprovalMap, setAiApprovalMap] = useState<Record<number, boolean>>({});
  const [aiActiveStep, setAiActiveStep] = useState<'config' | 'review'>('config');
  const [editingAiIdx, setEditingAiIdx] = useState<number | null>(null);
  const [editingAiItem, setEditingAiItem] = useState<any | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ─── LOAD DATA ───
  const loadData = async (resetPage = false) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      const activeFilter: QuestionBankFilter = {
        search: searchQuery,
        course: filterCourse,
        subject: filterSubject,
        unit: filterUnit,
        difficulty: filterDifficulty,
        questionType: filterType,
        examCategory: filterCategory,
        batchId: filterBatch,
        isPublished: filterStatus === 'All' ? 'all' : filterStatus === 'published'
      };

      const [pagedRes, statsRes] = await Promise.all([
        fetchQuestionsPaginated(activeFilter, currentPage, pageSize),
        fetchQuestionBankStats()
      ]);

      setQuestions(pagedRes.questions);
      setTotalCount(pagedRes.totalCount);
      setStats(statsRes);
    } catch (e: any) {
      console.warn('[QuestionBank loadData exception]:', e);
      showToast('Error loading question bank data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, filterCourse, filterSubject, filterUnit, filterDifficulty, filterType, filterCategory, filterStatus, filterBatch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Available unique courses & subjects for dropdowns
  const availableCourses = useMemo(() => {
    if (!stats) return ['Freshman Physics', 'Freshman Mathematics', 'Emerging Technologies', 'General Biology'];
    return Object.keys(stats.byCourse).sort();
  }, [stats]);

  const availableSubjects = useMemo(() => {
    if (!stats || !stats.bySubject) return ['Physics', 'Mathematics', 'Emerging Technologies', 'Biology'];
    return Object.keys(stats.bySubject).sort();
  }, [stats]);

  const availableUnits = useMemo(() => {
    if (!stats) return ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];
    return Object.keys(stats.byUnit).sort();
  }, [stats]);

  // ─── SELECTION HANDLERS ───
  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length && questions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // ─── BULK ACTIONS ───
  const handleBulkPublish = async (isPublished: boolean) => {
    if (selectedIds.size === 0) return;
    playClickChime();
    const ids = Array.from(selectedIds) as string[];
    const res = await bulkPublishQuestions(ids, isPublished);
    if (res.success) {
      playSuccessChime();
      showToast(`${ids.length} questions ${isPublished ? 'published' : 'unpublished'} successfully.`);
      setSelectedIds(new Set());
      loadData();
      onRefreshStats?.();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} questions? This action cannot be undone.`)) {
      return;
    }
    playClickChime();
    const ids = Array.from(selectedIds) as string[];
    const res = await bulkDeleteQuestions(ids);
    if (res.success) {
      playSuccessChime();
      showToast(`${ids.length} questions deleted successfully.`);
      setSelectedIds(new Set());
      loadData();
      onRefreshStats?.();
    }
  };

  // ─── SINGLE QUESTION ACTIONS ───
  const handleTogglePublish = async (q: QuestionBankRecord) => {
    playClickChime();
    const nextVal = !q.is_published;
    const res = await updateQuestion(q.id, { is_published: nextVal });
    if (res.success) {
      setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, is_published: nextVal } : item));
      showToast(`Question ${nextVal ? 'published' : 'unpublished'}.`);
      onRefreshStats?.();
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!window.confirm('Delete this question permanently?')) return;
    playClickChime();
    const res = await deleteQuestion(id);
    if (res.success) {
      playSuccessChime();
      showToast('Question deleted.');
      loadData();
      onRefreshStats?.();
    }
  };

  // ─── FILE UPLOAD & VALIDATION FLOW ───
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setValidationResult(null);
    setImportSummaryReport(null);
    setIsValidating(true);

    try {
      const text = await file.text();
      const rawCandidates = parseImportFile(text, file.name);
      const valResult = await validateQuestionsBatch(rawCandidates, importBatchId);
      setValidationResult(valResult);
      playSuccessChime();
    } catch (err: any) {
      playFailureChime();
      showToast(err.message || 'Failed to read file', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.readyToImport.length === 0) return;
    playClickChime();
    setImportProgress({ active: true, current: 0, total: validationResult.readyToImport.length, statusText: 'Preparing...' });

    try {
      const res = await importQuestionsBatch(
        validationResult.readyToImport,
        (imported, total, statusText) => {
          setImportProgress({ active: true, current: imported, total, statusText });
        }
      );

      if (res.success) {
        playSuccessChime();
        setImportSummaryReport({
          imported: res.importedCount,
          duplicates: validationResult.duplicates,
          invalid: validationResult.invalid
        });
        showToast(`Successfully imported ${res.importedCount} questions!`);
        loadData();
        onRefreshStats?.();
      }
    } catch (e: any) {
      playFailureChime();
      showToast(`Import failed: ${e.message}`, 'error');
    } finally {
      setImportProgress(null);
    }
  };

  // ─── ONE-CLICK 10-QUESTION TEST BATCH VERIFICATION ───
  const handleLoadSample10TestBatch = async () => {
    playClickChime();
    const testBatchId = 'batch-test-10-q';
    setImportBatchId(testBatchId);
    setImportFile({ name: 'ethiolearn_10_test_questions.json' } as any);
    setValidationResult(null);
    setImportSummaryReport(null);
    setIsValidating(true);
    setShowImportModal(true);

    try {
      const text = SAMPLE_10_TEST_BATCH_JSON_STRING;
      const rawCandidates = parseImportFile(text, 'ethiolearn_10_test_questions.json');
      const valResult = await validateQuestionsBatch(rawCandidates, testBatchId);
      setValidationResult(valResult);
      playSuccessChime();
      showToast('10-Question test batch loaded & validated successfully!');
    } catch (err: any) {
      playFailureChime();
      showToast(err.message || 'Failed to load test batch', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownloadSample10TestBatch = () => {
    playClickChime();
    const blob = new Blob([SAMPLE_10_TEST_BATCH_JSON_STRING], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ethiolearn_10_test_questions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded 10-Question Test JSON');
  };

  // ─── EXPORT ACTION ───
  const handleExport = async (format: 'json' | 'csv') => {
    playClickChime();
    try {
      const activeFilter: QuestionBankFilter = {
        course: filterCourse,
        unit: filterUnit,
        difficulty: filterDifficulty,
        questionType: filterType,
        examCategory: filterCategory,
        batchId: filterBatch,
        isPublished: filterStatus === 'All' ? 'all' : filterStatus === 'published'
      };

      const exportedString = await exportQuestions(activeFilter, format);
      const blob = new Blob([exportedString], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ethiolearn-question-bank-${filterCourse !== 'All' ? filterCourse.replace(/\s+/g, '_') : 'all'}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      playSuccessChime();
      showToast(`Questions exported as ${format.toUpperCase()}`);
      setShowExportModal(false);
    } catch (err: any) {
      showToast('Export failed', 'error');
    }
  };

  // Download Sample 500-Question JSON Template
  const handleDownloadSampleTemplate = () => {
    const sampleBatch = {
      questions: Array.from({ length: 5 }).map((_, i) => ({
        question_text: `Sample Question ${i + 1}: What is the fundamental concept in unit dynamics?`,
        question_type: 'multiple_choice',
        options: [
          'Option A: Conservation of Energy',
          'Option B: Constant Velocity with Zero Acceleration',
          'Option C: Static Friction Limit',
          'Option D: Inertial Reference System'
        ],
        correct_answer: 'Option A: Conservation of Energy',
        explanation: 'Energy can neither be created nor destroyed, only transformed from one state to another.',
        subject: 'Physics',
        course: 'Freshman Physics',
        unit: 'Unit 1',
        chapter: 'Kinematics & Energy',
        difficulty: 'medium',
        exam_category: 'practice_exam',
        batch_id: 'batch-template-500'
      }))
    };

    const blob = new Blob([JSON.stringify(sampleBatch, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ethiolearn_500_question_batch_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded question batch template');
  };

  // ─── AI QUESTION GENERATOR WORKFLOW HANDLERS ───
  const handleGenerateAiQuestions = async () => {
    if (!aiSubject || !aiUnit || !aiTopic) {
      showToast('Subject, Unit, and Topic are required', 'error');
      return;
    }
    playClickChime();
    setIsGeneratingAi(true);

    try {
      const res = await generateAiQuestionDrafts({
        subject: aiSubject,
        course: aiCourse,
        unit: aiUnit,
        topic: aiTopic,
        count: aiCount,
        difficultyDistribution: {
          easy: aiEasyPct,
          medium: aiMedPct,
          hard: aiHardPct
        },
        questionType: aiQuestionType,
        source: aiSource,
        sourceUnit: aiSourceUnit,
        sourceFile: aiSourceFile,
        sourceExcerpt: aiSourceExcerpt
      });

      if (!res.success || res.questions.length === 0) {
        throw new Error(res.error || 'No questions generated. Check network or parameters.');
      }

      setAiReviewQuestions(res.questions);
      // Default all generated questions to approved initially so admin can reject or edit
      const initialMap: Record<number, boolean> = {};
      res.questions.forEach((_, idx) => {
        initialMap[idx] = true;
      });
      setAiApprovalMap(initialMap);
      setAiActiveStep('review');
      playSuccessChime();
      showToast(`Generated ${res.questions.length} questions ready for review!`);
    } catch (e: any) {
      playFailureChime();
      showToast(e.message || 'Generation failed', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleToggleAiApproval = (idx: number) => {
    playClickChime();
    setAiApprovalMap(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleApproveAllAi = () => {
    playClickChime();
    const map: Record<number, boolean> = {};
    aiReviewQuestions.forEach((_, idx) => { map[idx] = true; });
    setAiApprovalMap(map);
  };

  const handleRejectAllAi = () => {
    playClickChime();
    const map: Record<number, boolean> = {};
    aiReviewQuestions.forEach((_, idx) => { map[idx] = false; });
    setAiApprovalMap(map);
  };

  const handleSaveAiInlineEdit = (idx: number, updatedItem: any) => {
    playClickChime();
    const copy = [...aiReviewQuestions];
    copy[idx] = updatedItem;
    setAiReviewQuestions(copy);
    setEditingAiIdx(null);
    setEditingAiItem(null);
    showToast('Question details updated in review list');
  };

  const handlePublishApprovedAiQuestions = async () => {
    const approved = aiReviewQuestions.filter((_, idx) => aiApprovalMap[idx]);
    if (approved.length === 0) {
      showToast('Please approve at least one question before publishing.', 'error');
      return;
    }

    playClickChime();
    const recordsToImport: QuestionBankRecord[] = approved.map(q => {
      const optionTexts = Array.isArray(q.options) 
        ? q.options.map((o: any) => typeof o === 'string' ? o : o.text)
        : [];
      
      let correctAnsText = String(q.correct_answer || '');
      if (/^[A-D]$/i.test(correctAnsText)) {
        const letterIdx = correctAnsText.toUpperCase().charCodeAt(0) - 65;
        if (optionTexts[letterIdx]) {
          correctAnsText = optionTexts[letterIdx];
        }
      }

      return {
        id: q.id || `q_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        subject: q.subject,
        course: q.course || q.subject,
        unit: q.unit || 'Unit 1',
        topic: q.topic || 'General Topic',
        chapter: q.source_unit || q.unit,
        question: q.question,
        question_text: q.question,
        question_type: q.question_type || 'multiple_choice',
        options: optionTexts,
        options_raw: Array.isArray(q.options) && typeof q.options[0] === 'object' ? q.options : optionTexts.map((t: string, i: number) => ({ id: String.fromCharCode(65 + i), text: t })),
        correct_answer: correctAnsText,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        exam_category: 'practice_exam',
        source: q.source || 'Curriculum Module',
        source_unit: q.source_unit || q.unit,
        source_file: q.source_file || '',
        batch_id: q.batch_id || `ai_approved_${new Date().toISOString().slice(0, 10)}`,
        is_published: true, // Only approved questions are published!
        is_pro: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    try {
      const res = await importQuestionsBatch(recordsToImport);
      if (res.success) {
        playSuccessChime();
        showToast(`Published ${res.importedCount} approved questions directly into Question Bank!`);
        setShowAiModal(false);
        setAiActiveStep('config');
        setAiReviewQuestions([]);
        loadData();
        onRefreshStats?.();
      }
    } catch (err: any) {
      playFailureChime();
      showToast(err.message || 'Failed to publish questions', 'error');
    }
  };

  // ─── SAVE EDIT OR CREATE MODAL ───
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    if (!editingQuestion.question_text.trim() || !editingQuestion.correct_answer.trim()) {
      showToast('Question text and correct answer are required', 'error');
      return;
    }

    playClickChime();
    if (isCreatingNew) {
      const newRecord: QuestionBankRecord = {
        ...editingQuestion,
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await importQuestionsBatch([newRecord]);
      showToast('New question created successfully');
    } else {
      await updateQuestion(editingQuestion.id, editingQuestion);
      showToast('Question updated successfully');
    }

    setEditingQuestion(null);
    setIsCreatingNew(false);
    loadData();
    onRefreshStats?.();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      {/* ─── TOAST NOTIFICATION ─── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HEADER / ACTION BAR ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Central Question Bank
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  {stats ? `${stats.totalQuestions} Questions` : 'Loading...'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-generated repository stored in Supabase. Zero AI overhead for students during active exams.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleLoadSample10TestBatch}
            title="Load, validate, and verify the 10-question test batch into Supabase"
            className="px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Test 10-Q Batch</span>
          </button>

          <button
            onClick={handleDownloadSampleTemplate}
            title="Download JSON structure for 500-question batch generation"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>500-Q Template</span>
          </button>

          <button
            onClick={() => { playClickChime(); setShowExportModal(true); }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Bank</span>
          </button>

          <button
            onClick={() => {
              playClickChime();
              setShowAiModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
            title="Generate curriculum questions using AI, review each item, and publish approved questions"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Generator & Review</span>
          </button>

          <button
            onClick={() => {
              playClickChime();
              setImportFile(null);
              setValidationResult(null);
              setImportSummaryReport(null);
              setImportBatchId(`batch-imp-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6)}`);
              setShowImportModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import Questions (JSON/CSV)</span>
          </button>

          <button
            onClick={() => {
              playClickChime();
              setEditingQuestion({
                id: '',
                question_text: '',
                question_type: 'multiple_choice',
                options: ['', '', '', ''],
                correct_answer: '',
                explanation: '',
                subject: 'Physics',
                course: 'Freshman Physics',
                unit: 'Unit 1',
                chapter: '',
                difficulty: 'medium',
                exam_category: 'practice_exam',
                source: 'faculty_authored',
                batch_id: `batch-manual-${new Date().toISOString().slice(0, 10)}`,
                is_published: true
              });
              setIsCreatingNew(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Single</span>
          </button>

          <button
            onClick={() => { playClickChime(); loadData(); }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── REAL DATABASE STATISTICS CARDS ─── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
            <div className="text-xl font-black text-white mt-1 font-mono">{stats.totalQuestions}</div>
            <span className="text-[10px] text-slate-400">Stored in Supabase</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Published</span>
            <div className="text-xl font-black text-emerald-400 mt-1 font-mono">{stats.publishedQuestions}</div>
            <span className="text-[10px] text-emerald-500/80">Available to students</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Unpublished</span>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono">{stats.unpublishedQuestions}</div>
            <span className="text-[10px] text-slate-400">Draft / Internal review</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Batches</span>
            <div className="text-xl font-black text-sky-400 mt-1 font-mono">{stats.batchCount}</div>
            <span className="text-[10px] text-slate-400">Target 500/batch</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Difficulty</span>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-mono font-bold">
              <span className="text-emerald-400" title="Easy">{stats.byDifficulty.easy}E</span>
              <span className="text-slate-600">/</span>
              <span className="text-amber-400" title="Medium">{stats.byDifficulty.medium}M</span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400" title="Hard">{stats.byDifficulty.hard}H</span>
            </div>
            <span className="text-[10px] text-slate-400">Easy / Med / Hard</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Question Types</span>
            <div className="text-xs font-mono font-bold text-slate-300 mt-1">
              MCQ: {stats.byType.multiple_choice} | T/F: {stats.byType.true_false}
            </div>
            <span className="text-[10px] text-slate-400">Short: {stats.byType.short_answer} | Blank: {stats.byType.fill_in_the_blank}</span>
          </div>
        </div>
      )}

      {/* ─── FILTERS & SEARCH TOOLBAR ─── */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search question text, explanation, subject, course..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => {
              playClickChime();
              setSearchQuery('');
              setFilterCourse('All');
              setFilterSubject('All');
              setFilterUnit('All');
              setFilterDifficulty('All');
              setFilterType('All');
              setFilterCategory('All');
              setFilterStatus('All');
              setFilterBatch('All');
            }}
            className="text-xs text-slate-400 hover:text-amber-400 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        {/* Dropdown filters grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {/* Course */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Course</label>
            <select
              value={filterCourse}
              onChange={e => { setFilterCourse(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Courses</option>
              {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject</label>
            <select
              value={filterSubject}
              onChange={e => { setFilterSubject(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Subjects</option>
              {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Unit</label>
            <select
              value={filterUnit}
              onChange={e => { setFilterUnit(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Units</option>
              {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={e => { setFilterDifficulty(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Question Type */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
              <option value="fill_in_the_blank">Fill in Blank</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Categories</option>
              <option value="practice_exam">Practice Exam</option>
              <option value="university_exam">University Exam</option>
              <option value="mock_exam">Mock Exam</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Status</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>

          {/* Page Size */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Per Page</label>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── BULK ACTIONS BAR (When items are selected) ─── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between p-3 px-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-amber-400 font-mono">
                {selectedIds.size} of {totalCount} questions selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Clear selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkPublish(true)}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Bulk Publish
              </button>
              <button
                onClick={() => handleBulkPublish(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Bulk Unpublish
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Bulk Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── QUESTIONS TABLE ─── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <p className="text-xs">Loading question records from database...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <p className="text-sm font-bold text-white">No questions found</p>
            <p className="text-xs max-w-md">No questions matched your current filter criteria. Try resetting filters or import a new batch.</p>
            <button
              onClick={() => setShowImportModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Import Question Batch
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3 pl-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      {selectedIds.size === questions.length ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Question Prompt</th>
                  <th className="p-3">Course & Unit</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3">Type / Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {questions.map((q) => {
                  const isSelected = selectedIds.has(q.id);
                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 pl-4">
                        <button
                          onClick={() => toggleSelectOne(q.id)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Question Text */}
                      <td className="p-3 max-w-md">
                        <div className="font-semibold text-slate-200 line-clamp-2">
                          {q.question_text}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {q.is_verified_official && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" />
                              Official {q.university ? `(${q.university.split(' ')[0]})` : ''}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            Answer: {q.correct_answer.length > 25 ? `${q.correct_answer.slice(0, 25)}...` : q.correct_answer}
                          </span>
                        </div>
                      </td>

                      {/* Course & Unit */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-200">{q.course}</div>
                        <div className="text-[10px] text-slate-400">{q.unit} {q.chapter ? `• ${q.chapter}` : ''}</div>
                      </td>

                      {/* Difficulty */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            q.difficulty === 'easy'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : q.difficulty === 'hard'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>

                      {/* Type & Category */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-slate-300 font-medium capitalize">
                          {q.question_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono capitalize">
                          {q.exam_category.replace(/_/g, ' ')}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-3 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublish(q)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                            q.is_published
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {q.is_published ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Published
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Draft
                            </>
                          )}
                        </button>
                      </td>

                      {/* Batch */}
                      <td className="p-3 whitespace-nowrap text-[10px] font-mono text-slate-400">
                        {q.batch_id}
                      </td>

                      {/* Actions */}
                      <td className="p-3 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { playClickChime(); setPreviewQuestion(q); }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Preview question and answer key"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              playClickChime();
                              setEditingQuestion({ ...q });
                              setIsCreatingNew(false);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                            title="Edit question"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(q.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── PAGINATION BAR ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{questions.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-bold text-white">{Math.min(page * pageSize, totalCount)}</span> of{' '}
            <span className="font-bold text-white font-mono">{totalCount}</span> questions
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-3 py-1 font-mono text-xs font-bold text-amber-400 bg-slate-900 border border-slate-800 rounded-lg">
              Page {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MODAL 0: AI QUESTION GENERATION WORKFLOW WITH MANDATORY REVIEW  */}
      {/* ================================================================ */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative my-8 text-white max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      Curriculum AI Question Generator
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        aiActiveStep === 'config' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {aiActiveStep === 'config' ? '1. Generation Config' : `2. Review Screen (${Object.values(aiApprovalMap).filter(Boolean).length}/${aiReviewQuestions.length} Approved)`}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {aiActiveStep === 'config' 
                        ? 'Generate rigorous questions based on official Ethiopian higher education syllabus modules.'
                        : 'Review, edit, or reject candidate questions. Only approved questions will be published to Supabase.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAiModal(false);
                    setAiActiveStep('config');
                    setAiReviewQuestions([]);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {aiActiveStep === 'config' ? (
                  <div className="space-y-4">
                    {/* Subject & Course Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Curriculum Subject <span className="text-amber-400">*</span>
                        </label>
                        <select
                          value={aiSubject}
                          onChange={(e) => {
                            const sub = e.target.value;
                            setAiSubject(sub);
                            setAiCourse(`${sub} Module`);
                            setAiSource(`${sub} Module`);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          {OFFICIAL_19_SUBJECTS.map(s => (
                            <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Module / Course Name
                        </label>
                        <input
                          type="text"
                          value={aiCourse}
                          onChange={(e) => setAiCourse(e.target.value)}
                          placeholder="e.g. Logic & Critical Thinking (Phil 1011)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Unit & Topic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Unit / Chapter <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={aiUnit}
                          onChange={(e) => {
                            setAiUnit(e.target.value);
                            setAiSourceUnit(e.target.value);
                          }}
                          placeholder="e.g. Unit 1: Introduction to Logic"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Specific Topic <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          placeholder="e.g. Deductive Validity & Soundness"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Question Count & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Number of Questions: <span className="text-amber-400 font-mono font-black">{aiCount}</span>
                        </label>
                        <div className="flex gap-2">
                          {[5, 10, 15, 20, 30].map(cnt => (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => setAiCount(cnt)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                aiCount === cnt
                                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {cnt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Question Format
                        </label>
                        <select
                          value={aiQuestionType}
                          onChange={(e) => setAiQuestionType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="multiple_choice">Multiple Choice (4 options: A, B, C, D)</option>
                          <option value="true_false">True / False</option>
                          <option value="multiple_select">Multiple Select</option>
                          <option value="fill_in_the_blank">Fill in the Blank</option>
                        </select>
                      </div>
                    </div>

                    {/* Difficulty Distribution */}
                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">Target Difficulty Distribution</span>
                        <span className="text-[11px] font-mono text-slate-400">Total: {aiEasyPct + aiMedPct + aiHardPct}%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-emerald-400">Easy ({aiEasyPct}%)</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={aiEasyPct}
                            onChange={(e) => setAiEasyPct(Number(e.target.value))}
                            className="w-full accent-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-amber-400">Medium ({aiMedPct}%)</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={aiMedPct}
                            onChange={(e) => setAiMedPct(Number(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-rose-400">Hard ({aiHardPct}%)</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={aiHardPct}
                            onChange={(e) => setAiHardPct(Number(e.target.value))}
                            className="w-full accent-rose-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Source Traceability & Excerpt */}
                    <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-300">Source Traceability & Curriculum Context</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-0.5">Source Module</label>
                          <input
                            type="text"
                            value={aiSource}
                            onChange={(e) => setAiSource(e.target.value)}
                            placeholder="e.g. General Biology Module"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-0.5">Source Unit</label>
                          <input
                            type="text"
                            value={aiSourceUnit}
                            onChange={(e) => setAiSourceUnit(e.target.value)}
                            placeholder="e.g. Unit 1: Cell Biology"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-0.5">Source File Name</label>
                          <input
                            type="text"
                            value={aiSourceFile}
                            onChange={(e) => setAiSourceFile(e.target.value)}
                            placeholder="e.g. general_biology_freshman.pdf"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-0.5">
                          Textbook Excerpt / Syllabus Notes (Optional Context)
                        </label>
                        <textarea
                          rows={3}
                          value={aiSourceExcerpt}
                          onChange={(e) => setAiSourceExcerpt(e.target.value)}
                          placeholder="Paste syllabus concepts, textbook definition paragraphs, or specific formulas here to ground questions strictly in source material..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* REVIEW SCREEN */
                  <div className="space-y-4">
                    {/* Review Controls Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApproveAllAi}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve All</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRejectAllAi}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject All</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiActiveStep('config')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Back to Config</span>
                        </button>
                      </div>

                      <div className="text-xs text-slate-400">
                        <span className="font-bold text-emerald-400">{Object.values(aiApprovalMap).filter(Boolean).length}</span> Approved &bull;{' '}
                        <span className="font-bold text-rose-400">{Object.values(aiApprovalMap).filter(v => !v).length}</span> Rejected
                      </div>
                    </div>

                    {/* Question Cards List */}
                    <div className="space-y-3">
                      {aiReviewQuestions.map((q, idx) => {
                        const isApproved = aiApprovalMap[idx];
                        const isEditingThis = editingAiIdx === idx;

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border transition-all ${
                              isApproved 
                                ? 'bg-slate-950/80 border-emerald-500/40' 
                                : 'bg-slate-950/40 border-rose-500/30 opacity-70'
                            }`}
                          >
                            {/* Card Top: Badges & Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                                  Q{idx + 1}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                  q.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                  q.difficulty === 'hard' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {q.difficulty}
                                </span>
                                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                  {q.subject} &bull; {q.unit}
                                </span>
                                {q.source && (
                                  <span className="text-[10px] text-slate-500">
                                    Source: {q.source}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAiApproval(idx)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isApproved 
                                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md' 
                                      : 'bg-rose-950 text-rose-300 border border-rose-500/40 hover:bg-rose-900'
                                  }`}
                                >
                                  {isApproved ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                  <span>{isApproved ? 'Approved' : 'Rejected'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isEditingThis) {
                                      setEditingAiIdx(null);
                                      setEditingAiItem(null);
                                    } else {
                                      setEditingAiIdx(idx);
                                      setEditingAiItem(JSON.parse(JSON.stringify(q)));
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                                  title="Edit Question"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Card Content or Inline Editor */}
                            {isEditingThis && editingAiItem ? (
                              <div className="space-y-3 pt-2">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Question Text</label>
                                  <textarea
                                    rows={2}
                                    value={editingAiItem.question}
                                    onChange={(e) => setEditingAiItem({ ...editingAiItem, question: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {editingAiItem.options.map((opt: any, optIdx: number) => (
                                    <div key={optIdx}>
                                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                                        Option {opt.id || String.fromCharCode(65 + optIdx)}
                                      </label>
                                      <input
                                        type="text"
                                        value={typeof opt === 'string' ? opt : opt.text}
                                        onChange={(e) => {
                                          const copy = [...editingAiItem.options];
                                          if (typeof copy[optIdx] === 'string') copy[optIdx] = e.target.value;
                                          else copy[optIdx] = { ...copy[optIdx], text: e.target.value };
                                          setEditingAiItem({ ...editingAiItem, options: copy });
                                        }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Correct Answer ID (A, B, C, D)</label>
                                    <input
                                      type="text"
                                      value={editingAiItem.correct_answer}
                                      onChange={(e) => setEditingAiItem({ ...editingAiItem, correct_answer: e.target.value })}
                                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Difficulty</label>
                                    <select
                                      value={editingAiItem.difficulty}
                                      onChange={(e) => setEditingAiItem({ ...editingAiItem, difficulty: e.target.value })}
                                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                    >
                                      <option value="easy">easy</option>
                                      <option value="medium">medium</option>
                                      <option value="hard">hard</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Explanation</label>
                                  <textarea
                                    rows={2}
                                    value={editingAiItem.explanation || ''}
                                    onChange={(e) => setEditingAiItem({ ...editingAiItem, explanation: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => { setEditingAiIdx(null); setEditingAiItem(null); }}
                                    className="px-3 py-1 rounded-lg text-xs bg-slate-800 text-slate-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveAiInlineEdit(idx, editingAiItem)}
                                    className="px-3 py-1 rounded-lg text-xs bg-amber-500 text-slate-950 font-bold"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs font-bold text-white mb-2.5">{q.question}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                  {Array.isArray(q.options) && q.options.map((opt: any, optIdx: number) => {
                                    const optId = typeof opt === 'object' && opt.id ? opt.id : String.fromCharCode(65 + optIdx);
                                    const optText = typeof opt === 'string' ? opt : opt.text;
                                    const isCorrect = optId === q.correct_answer || optText === q.correct_answer;

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`px-3 py-2 rounded-xl text-xs flex items-start gap-2 border ${
                                          isCorrect
                                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 font-bold'
                                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                                        }`}
                                      >
                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                                          isCorrect ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                          {optId}
                                        </span>
                                        <span>{optText}</span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {q.explanation && (
                                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                                    <span className="font-bold text-amber-400">Explanation: </span>
                                    {q.explanation}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAiModal(false);
                    setAiActiveStep('config');
                    setAiReviewQuestions([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {aiActiveStep === 'config' ? (
                  <button
                    type="button"
                    disabled={isGeneratingAi}
                    onClick={handleGenerateAiQuestions}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingAi ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Generating Rigorous Questions...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>Generate {aiCount} Questions & Open Review</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAiActiveStep('config')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                    >
                      Back to Setup
                    </button>
                    <button
                      type="button"
                      onClick={handlePublishApprovedAiQuestions}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>Publish Approved ({Object.values(aiApprovalMap).filter(Boolean).length}) to Supabase</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* MODAL 1: IMPORT QUESTIONS (JSON/CSV) WITH LIVE VALIDATION        */}
      {/* ================================================================ */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Import Question Batch</h3>
                    <p className="text-xs text-slate-400">Upload pre-generated JSON or CSV batches (up to 500 questions/batch)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Batch ID Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Batch Identifier (batch_id)
                </label>
                <input
                  type="text"
                  value={importBatchId}
                  onChange={e => setImportBatchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. batch-wku-phys-2026-001"
                />
                <span className="text-[10px] text-slate-400">Every batch has a distinct ID for tracking and rollbacks.</span>
              </div>

              {/* File upload drag-and-drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-400/70 p-6 rounded-2xl bg-slate-950/60 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-white">
                  {importFile ? importFile.name : 'Click to select JSON or CSV question batch'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports JSON format with &quot;questions&quot; array or CSV with standard column headers.
                </p>
              </div>

              {/* Quick Test / Sample Batch Helpers */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs">
                <span className="text-slate-400 font-medium">Quick Test Batch (10 verified questions):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSample10TestBatch}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>Download 10-Q JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSample10TestBatch}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Load 10-Q Test Batch</span>
                  </button>
                </div>
              </div>

              {/* Live validation progress indicator */}
              {isValidating && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-400 rounded-xl text-xs font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating records and scanning database for duplicates...</span>
                </div>
              )}

              {/* Validation Results Breakdown */}
              {validationResult && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center justify-between">
                    <span>Validation Results</span>
                    <span className="font-mono text-amber-400 font-bold">{validationResult.total} Total Questions in File</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Parsed</span>
                      <span className="font-mono font-bold text-white">{validationResult.total}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-400 block">Valid</span>
                      <span className="font-mono font-bold text-emerald-400">{validationResult.valid}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-amber-500/30">
                      <span className="text-[10px] text-amber-400 block">Duplicates</span>
                      <span className="font-mono font-bold text-amber-400">{validationResult.duplicates}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-rose-500/30">
                      <span className="text-[10px] text-rose-400 block">Invalid</span>
                      <span className="font-mono font-bold text-rose-400">{validationResult.invalid}</span>
                    </div>
                  </div>

                  {/* Duplicate or Invalid Details Accordion */}
                  {(validationResult.duplicates > 0 || validationResult.invalid > 0) && (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-900 rounded-lg text-[11px]">
                      {validationResult.duplicateDetails.map((d, i) => (
                        <div key={i} className="text-amber-400 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-mono font-bold">Row {d.index}:</span> {d.reason}
                            <div className="text-slate-400 truncate max-w-sm font-mono">&quot;{d.question_text}&quot;</div>
                          </div>
                        </div>
                      ))}
                      {validationResult.invalidDetails.map((err, i) => (
                        <div key={i} className="text-rose-400 flex items-start gap-1.5">
                          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-mono font-bold">Row {err.index}:</span> {err.issue}
                            {err.question_text && <div className="text-slate-400 truncate max-w-sm font-mono">&quot;{err.question_text}&quot;</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Import Progress Bar */}
              {importProgress && importProgress.active && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-amber-500/30">
                  <div className="flex justify-between text-xs font-bold text-amber-400">
                    <span>{importProgress.statusText}</span>
                    <span className="font-mono">{importProgress.current} / {importProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-150"
                      style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Import Summary Report */}
              {importSummaryReport && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import Transaction Completed Successfully!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    <div>Successfully imported: <span className="text-emerald-400 font-bold">{importSummaryReport.imported}</span></div>
                    <div>Duplicates detected: <span className="text-amber-400 font-bold">{importSummaryReport.duplicates}</span></div>
                    <div>Invalid / Skipped: <span className="text-rose-400 font-bold">{importSummaryReport.invalid}</span></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  {importSummaryReport ? 'Close' : 'Cancel'}
                </button>

                {validationResult && validationResult.valid > 0 && !importSummaryReport && (
                  <button
                    onClick={handleExecuteImport}
                    disabled={importProgress?.active}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Import {validationResult.valid} Valid Questions</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* MODAL 2: PREVIEW QUESTION                                        */}
      {/* ================================================================ */}
      <AnimatePresence>
        {previewQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400">
                    {previewQuestion.batch_id}
                  </span>
                  <span className="text-xs font-bold text-slate-400 capitalize">
                    {previewQuestion.course} • {previewQuestion.unit}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewQuestion(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Question Text */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Question Prompt
                </span>
                <p className="text-sm font-bold text-white bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  {previewQuestion.question_text}
                </p>
              </div>

              {/* Options */}
              {previewQuestion.options && previewQuestion.options.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Options (Choices)
                  </span>
                  <div className="space-y-1.5">
                    {previewQuestion.options.map((opt, idx) => {
                      const isCorrect = opt.trim().toLowerCase() === previewQuestion.correct_answer.trim().toLowerCase();
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                            isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                          {isCorrect && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 uppercase font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Non-MCQ Correct Answer display */}
              {(!previewQuestion.options || previewQuestion.options.length === 0) && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Correct Answer
                  </span>
                  <div className="p-2.5 rounded-xl text-xs bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-bold">
                    {previewQuestion.correct_answer}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {previewQuestion.explanation && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Faculty Explanation
                  </span>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                    {previewQuestion.explanation}
                  </div>
                </div>
              )}

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  Diff: {previewQuestion.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  Type: {previewQuestion.question_type}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  Cat: {previewQuestion.exam_category}
                </span>
                {previewQuestion.university && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {previewQuestion.university}
                  </span>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewQuestion(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* MODAL 3: EDIT OR CREATE QUESTION                                */}
      {/* ================================================================ */}
      <AnimatePresence>
        {editingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white">
                  {isCreatingNew ? 'Add Single Question to Bank' : 'Edit Question'}
                </h3>
                <button
                  onClick={() => { setEditingQuestion(null); setIsCreatingNew(false); }}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Question Prompt</label>
                  <textarea
                    rows={3}
                    value={editingQuestion.question_text}
                    onChange={e => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    placeholder="Enter question prompt..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Question Type</label>
                    <select
                      value={editingQuestion.question_type}
                      onChange={e => setEditingQuestion({ ...editingQuestion, question_type: e.target.value as BankQuestionType })}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True / False</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="fill_in_the_blank">Fill in Blank</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Difficulty</label>
                    <select
                      value={editingQuestion.difficulty}
                      onChange={e => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as BankDifficulty })}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Course</label>
                    <input
                      type="text"
                      value={editingQuestion.course}
                      onChange={e => setEditingQuestion({ ...editingQuestion, course: e.target.value })}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      placeholder="e.g. Freshman Physics"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Unit</label>
                    <input
                      type="text"
                      value={editingQuestion.unit}
                      onChange={e => setEditingQuestion({ ...editingQuestion, unit: e.target.value })}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      placeholder="e.g. Unit 1"
                      required
                    />
                  </div>
                </div>

                {/* Multiple choice options editor */}
                {editingQuestion.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-300 block">Choices / Options</label>
                    {editingQuestion.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-bold w-6">{String.fromCharCode(65 + i)}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const nextOpts = [...editingQuestion.options];
                            nextOpts[i] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: nextOpts });
                          }}
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion({ ...editingQuestion, correct_answer: opt });
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                            editingQuestion.correct_answer === opt && opt.length > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          Mark Correct
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Correct answer text field */}
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Correct Answer</label>
                  <input
                    type="text"
                    value={editingQuestion.correct_answer}
                    onChange={e => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/30 rounded-xl text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                    placeholder="Exact correct answer string..."
                    required
                  />
                </div>

                {/* Faculty Explanation */}
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Explanation / Solution Rationale</label>
                  <textarea
                    rows={2}
                    value={editingQuestion.explanation || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    placeholder="Explain why the answer is correct..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Batch Identifier</label>
                    <input
                      type="text"
                      value={editingQuestion.batch_id}
                      onChange={e => setEditingQuestion({ ...editingQuestion, batch_id: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingQuestion.is_published}
                        onChange={e => setEditingQuestion({ ...editingQuestion, is_published: e.target.checked })}
                        className="rounded accent-amber-400"
                      />
                      <span className="text-slate-300 font-bold">Published</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingQuestion.is_verified_official}
                        onChange={e => setEditingQuestion({ ...editingQuestion, is_verified_official: e.target.checked })}
                        className="rounded accent-emerald-400"
                      />
                      <span className="text-emerald-400 font-bold">Verified Official</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setEditingQuestion(null); setIsCreatingNew(false); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg cursor-pointer"
                  >
                    {isCreatingNew ? 'Create Question' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* MODAL 4: EXPORT QUESTIONS                                        */}
      {/* ================================================================ */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black text-white">Export Question Bank</h3>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Export current filtered questions ({totalCount} total) into standard formats compatible with the batch importer.
              </p>

              <div className="space-y-2 text-xs font-bold">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-400/50 rounded-xl text-left flex items-center justify-between text-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FileCode className="w-4 h-4 text-amber-400" />
                    <div>
                      <div>Export as JSON Format</div>
                      <span className="text-[10px] text-slate-400 font-normal">Compatible with 500-question pre-generation pipeline</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleExport('csv')}
                  className="w-full p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-400/50 rounded-xl text-left flex items-center justify-between text-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div>Export as CSV Spreadsheet</div>
                      <span className="text-[10px] text-slate-400 font-normal">Excel and Google Sheets compatible</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
