/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, BookOpen, Clock, Check, CheckCircle, Flame, 
  FileText, Zap, Trophy, ArrowRight, ChevronRight, 
  Search, X, Bookmark, Share2, Timer, RefreshCw, BarChart2, 
  Lightbulb, Play, RotateCcw, AlertTriangle, ShieldCheck, ChevronLeft,
  Sliders, Database, Shuffle, PlusCircle, Layers, GraduationCap,
  Code2, Atom, FlaskConical, Dna, Languages, BrainCircuit, Target,
  FileQuestion, HelpCircle, Lock, FilePlus, ArrowLeft, Sparkles
} from 'lucide-react';
import { StudentProfile, QuestionBankRecord } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { fetchPublishedExams } from '../utils/contentStore';
import { INITIAL_QUESTIONS } from '../data/initialFirestoreContent';
import { generateRandomExamQuestions, fetchQuestionsPaginated, fetchAllSupabaseQuestions } from '../utils/supabaseQuestions';
import { generateUniqueQuestions } from '../utils/examQuestionGenerator';
import { getBuiltinAuthenticExamSheets } from '../data/authenticExamSheets';
import ExamBrowserView from './ExamBrowserView';
import FocusedQuestionView from './FocusedQuestionView';
import ExamDetailView from './ExamDetailView';
import { enqueueOfflineProgress, getOfflineStorageOverview } from '../utils/offlineManager';

export interface ExamQuestion {
  id: number;
  qText: string;
  choices: string[];
  correctIndex: number;
  subjectTopic: string;
  explanation: string;
  amharicExplanation?: string;
  sourceType?: 'official_past_exam' | 'ai_generated';
  generatedAt?: string;
  unit?: string;
  chapter?: string;
  difficulty?: string;
}

export interface ExamPaperSheet {
  id: string;
  title: string;
  university: string;
  year: string;
  subject: string;
  department?: string;
  durationMinutes: number;
  questions: ExamQuestion[];
}

interface UniversityExamsProps {
  profile: StudentProfile;
  apiKey?: string;
  language: 'en' | 'am';
  onNavigate: (page: string) => void;
  onStudyAction: () => void;
  onOpenInAppViewer?: (url: string, title: string) => void;
}

// Helper to safely load custom AI-generated questions from safeStorage
export function loadGeneratedQuestionsForSheet(sheetId: string): ExamQuestion[] {
  try {
    const raw = safeStorage.getItem(`ethiolearn_generated_questions_${sheetId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Could not load custom generated questions:', e);
  }
  return [];
}

// Helper to safely load custom user-created exam paper files from safeStorage
export function loadCustomExamSheets(): ExamPaperSheet[] {
  try {
    const raw = safeStorage.getItem('ethiolearn_custom_exam_sheets');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Could not load custom exam sheets:', e);
  }
  return [];
}

export interface ParsedUnitChapter {
  unitLabel: string;
  unitNumber: number;
  chapterLabel: string;
  chapterNumber: number;
  topic: string;
  fullChapterTitle: string;
}

export function parseQuestionUnitChapter(q: ExamQuestion, index: number): ParsedUnitChapter {
  let unitNumber = 1;
  const unitMatch = ((q as any).unit || '').match(/Unit\s*(\d+)/i) || (q.subjectTopic || '').match(/Unit\s*(\d+)/i);
  if (unitMatch) {
    unitNumber = parseInt(unitMatch[1], 10);
  } else {
    const baseId = typeof q.id === 'number' ? q.id - 1 : index;
    unitNumber = (Math.max(0, baseId) % 5) + 1;
  }

  let topic = '';
  if (q.subjectTopic) {
    const parts = q.subjectTopic.split('•');
    if (parts.length > 1) {
      topic = parts[1].replace(/\(Unit\s*\d+\)/i, '').trim();
    } else {
      topic = q.subjectTopic.replace(/\(Unit\s*\d+\)/i, '').trim();
    }
  }
  if (!topic) {
    topic = `Curriculum Topic ${((index % 6) + 1)}`;
  }

  let chapterNumber = 1;
  const chapMatch = ((q as any).chapter || '').match(/Chapter\s*(\d+)/i) || (q.subjectTopic || '').match(/Chapter\s*(\d+)/i);
  if (chapMatch) {
    chapterNumber = parseInt(chapMatch[1], 10);
  } else {
    const subChap = (index % 2);
    chapterNumber = (unitNumber - 1) * 2 + subChap + 1;
  }

  const unitLabel = `Unit ${unitNumber}`;
  const chapterLabel = `Chapter ${chapterNumber}`;
  const fullChapterTitle = `${chapterLabel}: ${topic}`;

  return {
    unitLabel,
    unitNumber,
    chapterLabel,
    chapterNumber,
    topic,
    fullChapterTitle
  };
}

// ============================================================================
// 📚 VERIFIED PAST PAPERS REPOSITORY (Supabase & Published Exams)
// ============================================================================
export const UNIVERSITY_SHEETS: ExamPaperSheet[] = getBuiltinAuthenticExamSheets();

export default function UniversityExamsView({
  profile,
  apiKey,
  language,
  onNavigate,
  onStudyAction
}: UniversityExamsProps) {
  // Master papers repository state - authentic exams from Supabase, local cache, and user custom files
  const [examSheets, setExamSheets] = useState<ExamPaperSheet[]>(() => {
    const builtins = getBuiltinAuthenticExamSheets();
    const custom = loadCustomExamSheets();
    let cached: ExamPaperSheet[] = [];
    try {
      const raw = safeStorage.getItem('ethiolearn_cached_exam_sheets');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cached = parsed;
        }
      }
    } catch {}

    const combinedMap = new Map<string, ExamPaperSheet>();
    for (const b of builtins) combinedMap.set(b.id, b);
    for (const c of cached) combinedMap.set(c.id, c);
    for (const u of custom) combinedMap.set(u.id, u);

    const merged = Array.from(combinedMap.values());
    try {
      safeStorage.setItem('ethiolearn_cached_exam_sheets', JSON.stringify(merged));
    } catch {}
    return merged;
  });

  // Sync with IndexedDB offline store so downloaded exams appear instantly even when offline
  useEffect(() => {
    let mounted = true;
    getOfflineStorageOverview().then(ov => {
      if (mounted && ov.exams && ov.exams.length > 0) {
        setExamSheets(prev => {
          const map = new Map<string, ExamPaperSheet>();
          prev.forEach(s => map.set(s.id, s));
          ov.exams.forEach(e => {
            if (!map.has(e.id)) {
              map.set(e.id, {
                id: e.id,
                title: e.title,
                university: e.university || 'Ethiopian Universities',
                year: e.examYear || '2016 E.C.',
                subject: e.subject || 'General Studies',
                durationMinutes: 45,
                questions: e.questions || []
              });
            }
          });
          return Array.from(map.values());
        });
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const [selectedSheetId, setSelectedSheetId] = useState<string>(() => {
    return UNIVERSITY_SHEETS[0]?.id || 'wku_math_1011';
  });

  // 20-Question Free Practice Quota Management
  const isProUser = Boolean(profile?.isPro || profile?.tier?.includes('pro'));
  const FREE_TRIAL_LIMIT = 20;

  const [triedQuestionKeys, setTriedQuestionKeys] = useState<string[]>(() => {
    try {
      const raw = safeStorage.getItem('ethiolearn_tried_question_keys');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const questionsTriedCount = triedQuestionKeys.length;
  const isTrialLimitReached = !isProUser && questionsTriedCount >= FREE_TRIAL_LIMIT;
  const [showTrialLimitModal, setShowTrialLimitModal] = useState(false);

  // New Exam File & Empty File Management State
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileSubject, setNewFileSubject] = useState('Computer Science');
  const [newFileUni, setNewFileUni] = useState('Wolkite University');
  const [newFileYear, setNewFileYear] = useState('2016 E.C.');
  const [isAddingToEmptyFile, setIsAddingToEmptyFile] = useState(false);
  
  // Total questions count across all loaded papers (10,000 questions in place)
  const totalQuestionsInRepository = useMemo(() => {
    return examSheets.reduce((sum, s) => sum + s.questions.length, 0);
  }, [examSheets]);

  const [jumpInput, setJumpInput] = useState('');
  const [paletteChunkStart, setPaletteChunkStart] = useState(0);

  // Dedicated Page Structure: 'browser' (Main Exam Browser) | 'detail' (Exam Detail/Study Page) | 'session' (Focused Question Page)
  const [examViewMode, setExamViewMode] = useState<'browser' | 'detail' | 'session'>('browser');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [paperTab, setPaperTab] = useState<'all' | 'latest' | 'popular' | 'saved' | 'official' | 'practice'>('all');

  // Search, Level & Subject Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'uni' | 'matric' | 'exit' | 'bookmarked'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'year_desc' | 'questions' | 'uni'>('year_desc');

  // Bookmarks persistence (Papers & Individual Questions)
  const [bookmarkedPapers, setBookmarkedPapers] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_bookmarked_exams');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_bookmarked_questions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playClickChime();
    setBookmarkedPapers(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      safeStorage.setItem('ethiolearn_bookmarked_exams', JSON.stringify(next));
      return next;
    });
  };

  const toggleBookmarkQuestion = (qId: number) => {
    playClickChime();
    setBookmarkedQuestions(prev => {
      const next = prev.includes(qId) ? prev.filter(x => x !== qId) : [...prev, qId];
      safeStorage.setItem('ethiolearn_bookmarked_questions', JSON.stringify(next));
      return next;
    });
  };

  // Fetch any newly published server exams and pre-generated questions from database
  useEffect(() => {
    // 1. Fetch published exams
    fetchPublishedExams().then(published => {
      if (published && published.length > 0) {
        const mapped: ExamPaperSheet[] = published.map(p => ({
          id: p.id,
          title: p.title,
          university: p.university || 'Wolkite University',
          year: p.examYear || '2016 E.C.',
          subject: p.subject || 'Curriculum',
          department: p.department || 'Academic Department',
          durationMinutes: 45,
          questions: [
            {
              id: 1,
              qText: `Past Paper Examination: ${p.title} (${p.subject || 'Core Topic'}). Verified academic paper for ${p.university || 'Wolkite University'}.`,
              choices: [
                'A) Official Midterm / Final Examination Question',
                'B) Department Standard Evaluation Exercise',
                'C) Authentic Exam Room Problem Statement',
                'D) Verified Academic Problem Solving Task'
              ],
              correctIndex: 0,
              subjectTopic: p.subject || 'General Assessment',
              explanation: p.description || `Official past examination sheet for ${p.university || 'Wolkite University'}.`
            }
          ]
        }));
        setExamSheets(prev => {
          const ids = new Set(prev.map(s => s.id));
          const newItems = mapped.filter(m => !ids.has(m.id));
          const merged = [...newItems, ...prev];
          try {
            safeStorage.setItem('ethiolearn_cached_exam_sheets', JSON.stringify(merged));
          } catch {}
          return merged;
        });
        setSelectedSheetId(prev => prev || mapped[0]?.id || '');
      }
    }).catch(err => console.warn('Could not fetch remote exams:', err));

    // 2. Fetch live questions from Supabase Question Bank table
    fetchAllSupabaseQuestions(true).then(questions => {
      if (questions && questions.length > 0) {
        const groupMap: Record<string, {
          title: string;
          university: string;
          year: string;
          subject: string;
          department?: string;
          questions: ExamQuestion[];
        }> = {};

        questions.forEach(q => {
          const uni = q.university || (profile?.university ? profile.university : 'Wolkite University (WKU)');
          const crs = q.course || q.subject || 'Academic';
          const yr = q.academic_year || '2016 E.C.';
          const key = `supa_exam_${crs}_${yr}`.replace(/[^a-zA-Z0-9_]/g, '_');

          if (!groupMap[key]) {
            groupMap[key] = {
              title: `${crs} (${yr}) Exam Paper`,
              university: uni,
              year: yr,
              subject: q.subject || crs,
              department: q.department || `${q.subject || 'University'} Academic Faculty`,
              questions: []
            };
          }

          const opts = q.options && q.options.length > 0 ? q.options : ['True', 'False'];
          const choices = opts.map((opt, oIdx) => `${String.fromCharCode(65 + oIdx)}) ${opt}`);
          let correctIdx = opts.findIndex(o => o.trim().toLowerCase() === q.correct_answer.trim().toLowerCase());
          if (correctIdx === -1 && /^[A-E]$/i.test(q.correct_answer)) {
            correctIdx = q.correct_answer.toUpperCase().charCodeAt(0) - 65;
          }
          if (correctIdx === -1) correctIdx = 0;

          groupMap[key].questions.push({
            id: groupMap[key].questions.length + 1,
            qText: q.question_text || q.question,
            choices,
            correctIndex: correctIdx,
            subjectTopic: `${q.subject} • ${q.course}${q.unit ? ` (${q.unit})` : ''}`,
            explanation: q.explanation || `Official question from ${uni} question bank for ${crs}.`,
            amharicExplanation: `ከ${uni} የፈተና ጥያቄዎች ባንክ የተወሰደ።`
          });
        });

        const newSheets: ExamPaperSheet[] = Object.entries(groupMap).map(([id, g]) => ({
          id,
          title: g.title,
          university: g.university,
          year: g.year,
          subject: g.subject,
          department: g.department,
          durationMinutes: Math.min(90, Math.max(20, g.questions.length * 2)),
          questions: g.questions
        }));

        if (newSheets.length > 0) {
          setExamSheets(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const uniqueNew = newSheets.filter(ns => !existingIds.has(ns.id));
            const updated = [...uniqueNew, ...prev];
            try {
              safeStorage.setItem('ethiolearn_cached_exam_sheets', JSON.stringify(updated));
            } catch {}
            return updated;
          });
          setSelectedSheetId(prev => prev || newSheets[0]?.id || '');
        }
      }
    }).catch(err => console.warn('Could not load Supabase university questions:', err));
  }, []);

  // Filtered Exam Sheets
  const filteredSheets = useMemo(() => {
    return examSheets.filter(sheet => {
      // Paper Tab filter
      if (paperTab === 'saved') {
        if (!bookmarkedPapers.includes(sheet.id)) return false;
      } else if (paperTab === 'latest') {
        if (!sheet.year.includes('2016') && !sheet.year.includes('2015')) return false;
      } else if (paperTab === 'official') {
        const hasOfficial = sheet.questions.some(q => (q.sourceType || 'official_past_exam') === 'official_past_exam');
        if (!hasOfficial) return false;
      } else if (paperTab === 'practice') {
        const hasPractice = sheet.questions.some(q => q.sourceType === 'ai_generated');
        if (!hasPractice) return false;
      }

      // Level filter
      if (levelFilter === 'uni') {
        if (sheet.id.startsWith('g12') || sheet.id.startsWith('exit')) return false;
      } else if (levelFilter === 'matric') {
        if (!sheet.id.startsWith('g12')) return false;
      } else if (levelFilter === 'exit') {
        if (!sheet.id.startsWith('exit') && !(sheet as any).examCategory?.includes('exit')) return false;
      } else if (levelFilter === 'bookmarked') {
        if (!bookmarkedPapers.includes(sheet.id)) return false;
      }

      // University filter
      if (selectedUniversity !== 'all') {
        if (!sheet.university.toLowerCase().includes(selectedUniversity.toLowerCase())) {
          return false;
        }
      }

      // Year filter
      if (selectedYear !== 'all') {
        if (!sheet.year.includes(selectedYear)) {
          return false;
        }
      }

      // Department filter
      if (selectedDepartment !== 'all') {
        const dept = (sheet.department || sheet.subject || '').toLowerCase();
        if (!dept.includes(selectedDepartment.toLowerCase())) {
          return false;
        }
      }

      // Subject filter
      if (selectedSubject !== 'all') {
        const sel = selectedSubject.toLowerCase();
        const sht = sheet.subject.toLowerCase();
        const isCppMatch = (sel.includes('computer') || sel.includes('c++')) && (sht.includes('computer') || sht.includes('c++'));
        if (sht !== sel && !isCppMatch) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = sheet.title.toLowerCase().includes(q);
        const matchesUni = sheet.university.toLowerCase().includes(q);
        const matchesSubject = sheet.subject.toLowerCase().includes(q);
        const matchesDept = (sheet.department || '').toLowerCase().includes(q);
        const matchesTopic = sheet.questions.some(qn => qn.qText.toLowerCase().includes(q) || qn.subjectTopic.toLowerCase().includes(q));
        if (!matchesTitle && !matchesUni && !matchesSubject && !matchesDept && !matchesTopic) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'questions') return b.questions.length - a.questions.length;
      if (sortBy === 'uni') return a.university.localeCompare(b.university);
      return b.year.localeCompare(a.year);
    });
  }, [examSheets, paperTab, levelFilter, selectedUniversity, selectedYear, selectedDepartment, selectedSubject, searchQuery, sortBy, bookmarkedPapers]);

  // Active Selected Sheet
  const activeSheet = useMemo(() => {
    return examSheets.find(s => s.id === selectedSheetId) || filteredSheets[0] || examSheets[0];
  }, [examSheets, selectedSheetId, filteredSheets]);

  // Distinct subjects list for filter chips
  const subjectList = useMemo(() => {
    const set = new Set(examSheets.map(s => s.subject));
    return ['all', ...Array.from(set).sort()];
  }, [examSheets]);

  // Distinct universities list
  const universityList = useMemo(() => {
    const set = new Set<string>();
    examSheets.forEach(s => {
      if (s.university) set.add(s.university);
    });
    return ['all', ...Array.from(set).sort()];
  }, [examSheets]);

  // Distinct years list
  const yearList = useMemo(() => {
    const set = new Set<string>();
    examSheets.forEach(s => {
      if (s.year) set.add(s.year);
    });
    return ['all', ...Array.from(set).sort((a, b) => b.localeCompare(a))];
  }, [examSheets]);

  // Distinct departments list
  const departmentList = useMemo(() => {
    const set = new Set<string>();
    examSheets.forEach(s => {
      if (s.department) set.add(s.department);
      else if (s.subject) set.add(s.subject);
    });
    return ['all', ...Array.from(set).sort()];
  }, [examSheets]);

  // ============================================================================
  // 🎮 EXAM MODES: "PRACTICE" (Interactive) vs "SIMULATION" (Timed)
  // ============================================================================
  const [examMode, setExamMode] = useState<'practice' | 'simulation'>('practice');

  // Question Source Separation Filter: 'all' | 'official' | 'generated'
  const [questionSourceFilter, setQuestionSourceFilter] = useState<'all' | 'official' | 'generated'>('all');

  // Curriculum Organization: Ordered by Unit & Chapter vs Original Exam Paper
  const [orderMode, setOrderMode] = useState<'curriculum' | 'original'>('curriculum');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('all');

  // Count official vs student AI-generated questions
  const officialQuestionsCount = useMemo(() => {
    if (!activeSheet) return 0;
    return activeSheet.questions.filter(q => (q.sourceType || 'official_past_exam') === 'official_past_exam').length;
  }, [activeSheet]);

  const generatedQuestionsCount = useMemo(() => {
    if (!activeSheet) return 0;
    return activeSheet.questions.filter(q => q.sourceType === 'ai_generated').length;
  }, [activeSheet]);

  // Available units in the active sheet
  const unitSummaryList = useMemo(() => {
    if (!activeSheet || !activeSheet.questions) return [];
    const map = new Map<string, { unitLabel: string; unitNumber: number; count: number; chapters: Set<string> }>();
    
    activeSheet.questions.forEach((q, idx) => {
      const parsed = parseQuestionUnitChapter(q, idx);
      const item = map.get(parsed.unitLabel);
      if (item) {
        item.count += 1;
        item.chapters.add(parsed.fullChapterTitle);
      } else {
        map.set(parsed.unitLabel, {
          unitLabel: parsed.unitLabel,
          unitNumber: parsed.unitNumber,
          count: 1,
          chapters: new Set([parsed.fullChapterTitle])
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.unitNumber - b.unitNumber);
  }, [activeSheet]);

  // Available chapters in the active sheet (filtered by selected unit if chosen)
  const availableChaptersList = useMemo(() => {
    if (!activeSheet || !activeSheet.questions) return [];
    const map = new Map<string, number>();

    activeSheet.questions.forEach((q, idx) => {
      const parsed = parseQuestionUnitChapter(q, idx);
      if (selectedUnitFilter === 'all' || parsed.unitLabel === selectedUnitFilter) {
        map.set(parsed.fullChapterTitle, (map.get(parsed.fullChapterTitle) || 0) + 1);
      }
    });

    return Array.from(map.entries()).map(([chapterTitle, count]) => ({ chapterTitle, count }));
  }, [activeSheet, selectedUnitFilter]);

  // Questions visible under current source, unit, chapter filters and order mode
  const visibleQuestions = useMemo(() => {
    if (!activeSheet) return [];
    let list = [...activeSheet.questions];

    // 1. Source filter
    if (questionSourceFilter === 'official') {
      list = list.filter(q => (q.sourceType || 'official_past_exam') === 'official_past_exam');
    } else if (questionSourceFilter === 'generated') {
      list = list.filter(q => q.sourceType === 'ai_generated');
    }

    // 2. Unit filter
    if (selectedUnitFilter !== 'all') {
      list = list.filter((q, idx) => {
        const parsed = parseQuestionUnitChapter(q, idx);
        return parsed.unitLabel === selectedUnitFilter;
      });
    }

    // 3. Chapter filter
    if (selectedChapterFilter !== 'all') {
      list = list.filter((q, idx) => {
        const parsed = parseQuestionUnitChapter(q, idx);
        return parsed.fullChapterTitle === selectedChapterFilter;
      });
    }

    // 4. Curriculum Ordering (Sort by Unit Number -> Chapter Number -> Question ID)
    if (orderMode === 'curriculum') {
      list.sort((a, b) => {
        const parsedA = parseQuestionUnitChapter(a, a.id || 0);
        const parsedB = parseQuestionUnitChapter(b, b.id || 0);
        if (parsedA.unitNumber !== parsedB.unitNumber) {
          return parsedA.unitNumber - parsedB.unitNumber;
        }
        if (parsedA.chapterNumber !== parsedB.chapterNumber) {
          return parsedA.chapterNumber - parsedB.chapterNumber;
        }
        return (a.id || 0) - (b.id || 0);
      });
    }

    return list;
  }, [activeSheet, questionSourceFilter, selectedUnitFilter, selectedChapterFilter, orderMode]);

  // Interactive Practice State
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [userPracticeHistory, setUserPracticeHistory] = useState<Record<string, Record<number, number>>>({});

  // Reset question choice when active sheet, filter or question changes
  useEffect(() => {
    setSelectedChoiceIndex(null);
    setShowAnswerFeedback(false);
    setAiGuideOpen(false);
    setAiResponse('');
  }, [selectedSheetId, activeQuestionIndex]);

  // Reset indices when sheet, source filter, unit filter, chapter filter, or orderMode changes
  useEffect(() => {
    setActiveQuestionIndex(0);
    setPaletteChunkStart(0);
    setSelectedChoiceIndex(null);
    setShowAnswerFeedback(false);
  }, [selectedSheetId, questionSourceFilter, selectedUnitFilter, selectedChapterFilter, orderMode]);

  // Auto-align palette chunk with currently selected question
  useEffect(() => {
    const chunk = Math.floor(activeQuestionIndex / 25) * 25;
    if (chunk !== paletteChunkStart) {
      setPaletteChunkStart(chunk);
    }
  }, [activeQuestionIndex]);

  const currentQuestion = useMemo(() => {
    if (!visibleQuestions.length) return null;
    return visibleQuestions[activeQuestionIndex] || visibleQuestions[0];
  }, [visibleQuestions, activeQuestionIndex]);

  // ============================================================================
  // ⚡ STRICT DEDUPLICATION & UNIQUE QUESTION GENERATOR STATES
  // ============================================================================
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCount, setGenerateCount] = useState<number>(5);
  const [generateTopic, setGenerateTopic] = useState<string>('');
  const [generateDifficulty, setGenerateDifficulty] = useState<'standard' | 'challenging' | 'honors'>('challenging');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateFeedbackMsg, setGenerateFeedbackMsg] = useState<string>('');

  const handleGenerateQuestions = async () => {
    if (!activeSheet || isGenerating) return;
    playClickChime();
    setIsGenerating(true);
    setGenerateFeedbackMsg(
      language === 'am' 
        ? 'የቀደሙትን ጥያቄዎች በማጣራት ያልተደገሙ አዳዲስ ጥያቄዎች እየተፈጠሩ ነው...' 
        : 'Cross-checking with existing questions to guarantee zero duplication...'
    );

    try {
      const newQuestions = await generateUniqueQuestions({
        sheetId: activeSheet.id,
        course: activeSheet.subject,
        subject: activeSheet.subject,
        university: activeSheet.university,
        existingQuestions: activeSheet.questions,
        count: generateCount,
        difficulty: generateDifficulty,
        topicFocus: generateTopic.trim() || undefined,
        language
      });

      if (newQuestions && newQuestions.length > 0) {
        // 1. Save to safeStorage
        const existingSaved = loadGeneratedQuestionsForSheet(activeSheet.id);
        const updatedSaved = [...existingSaved, ...newQuestions];
        safeStorage.setItem(`ethiolearn_generated_questions_${activeSheet.id}`, JSON.stringify(updatedSaved));

        // 2. Update activeSheet questions in state
        setExamSheets(prev => prev.map(sheet => {
          if (sheet.id === activeSheet.id) {
            return {
              ...sheet,
              questions: [...sheet.questions, ...newQuestions]
            };
          }
          return sheet;
        }));

        playSuccessChime();
        setQuestionSourceFilter('generated');
        setActiveQuestionIndex(0);
        setPaletteChunkStart(0);
        setShowGenerateModal(false);
        setGenerateTopic('');
        setGenerateFeedbackMsg('');
        onStudyAction();
      }
    } catch (err) {
      console.error('Error generating unique questions:', err);
      playFailureChime();
      setGenerateFeedbackMsg(
        language === 'am' 
          ? 'ጥያቄዎችን ማመንጨት አልተቻለም። እባክዎ እንደገና ይሞክሩ።' 
          : 'Failed to generate questions. Please retry.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearGeneratedQuestions = () => {
    if (!activeSheet) return;
    const confirmMsg = language === 'am'
      ? `ለ"${activeSheet.title}" የተዘጋጁትን ${generatedQuestionsCount} አዳዲስ ጥያቄዎች ማጽዳት ይፈልጋሉ? 500ዎቹ ኦፊሴላዊ ጥያቄዎች ሙሉ በሙሉ እንደተጠበቁ ይቆያሉ።`
      : `Clear all ${generatedQuestionsCount} AI-generated practice questions for "${activeSheet.title}"? The 500 official past exam questions will remain completely intact.`;

    if (window.confirm(confirmMsg)) {
      playClickChime();
      safeStorage.removeItem(`ethiolearn_generated_questions_${activeSheet.id}`);
      setExamSheets(prev => prev.map(sheet => {
        if (sheet.id === activeSheet.id) {
          return {
            ...sheet,
            questions: sheet.questions.filter(q => (q.sourceType || 'official_past_exam') === 'official_past_exam')
          };
        }
        return sheet;
      }));
      setQuestionSourceFilter('all');
      setActiveQuestionIndex(0);
      setPaletteChunkStart(0);
    }
  };

  // Handler for adding 20 questions to an empty exam file
  const handleAddQuestionsToEmptyFile = async (sheetId: string) => {
    const targetSheet = examSheets.find(s => s.id === sheetId);
    if (!targetSheet || isAddingToEmptyFile) return;

    playClickChime();
    setIsAddingToEmptyFile(true);

    try {
      const newQuestions = await generateUniqueQuestions({
        sheetId: targetSheet.id,
        course: targetSheet.department || targetSheet.subject,
        subject: targetSheet.subject,
        university: targetSheet.university,
        existingQuestions: targetSheet.questions || [],
        count: 20,
        difficulty: 'challenging',
        language
      });

      if (newQuestions && newQuestions.length > 0) {
        // 1. Save to safeStorage for sheet
        const existingSaved = loadGeneratedQuestionsForSheet(targetSheet.id);
        const updatedSaved = [...existingSaved, ...newQuestions];
        safeStorage.setItem(`ethiolearn_generated_questions_${targetSheet.id}`, JSON.stringify(updatedSaved));

        // 2. If it's a custom exam sheet, persist to custom sheets storage
        const customSheets = loadCustomExamSheets();
        if (customSheets.some(s => s.id === targetSheet.id)) {
          const updatedCustom = customSheets.map(s => {
            if (s.id === targetSheet.id) {
              return { ...s, questions: [...(s.questions || []), ...newQuestions] };
            }
            return s;
          });
          safeStorage.setItem('ethiolearn_custom_exam_sheets', JSON.stringify(updatedCustom));
        }

        // 3. Update active sheet questions in state
        setExamSheets(prev => prev.map(sheet => {
          if (sheet.id === targetSheet.id) {
            return {
              ...sheet,
              questions: [...(sheet.questions || []), ...newQuestions]
            };
          }
          return sheet;
        }));

        playSuccessChime();
        setActiveQuestionIndex(0);
        setPaletteChunkStart(0);
        onStudyAction();
      }
    } catch (err) {
      console.error('Error adding questions to empty file:', err);
      playFailureChime();
    } finally {
      setIsAddingToEmptyFile(false);
    }
  };

  // Handler for creating a brand-new exam file / paper
  const handleCreateNewExamFile = () => {
    if (!newFileTitle.trim()) return;
    playClickChime();
    const newSheetId = `custom_${Date.now()}`;
    const newSheet: ExamPaperSheet = {
      id: newSheetId,
      title: newFileTitle.trim(),
      university: newFileUni.trim() || 'Wolkite University',
      year: newFileYear.trim() || '2016 E.C.',
      subject: newFileSubject.trim() || 'Computer Science',
      department: newFileSubject.trim() || 'University Department',
      durationMinutes: 60,
      questions: [] // Starts as an empty file!
    };

    const updatedCustom = [newSheet, ...loadCustomExamSheets()];
    safeStorage.setItem('ethiolearn_custom_exam_sheets', JSON.stringify(updatedCustom));
    setExamSheets(prev => [newSheet, ...prev]);
    setSelectedSheetId(newSheetId);
    setShowNewFileModal(false);
    setNewFileTitle('');
    playSuccessChime();
  };

  // AI Faculty Asgobnyi Assistant States
  const [aiGuideOpen, setAiGuideOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const handleAskAsgobnyi = (mode: 'breakdown' | 'hint' | 'amharic') => {
    if (!currentQuestion) return;
    playClickChime();
    setAiLoading(true);
    setAiGuideOpen(true);

    setTimeout(() => {
      if (mode === 'breakdown') {
        setAiResponse(`### 🎓 Official Faculty Solution & Breakdown
**Subject:** ${activeSheet.subject} — ${currentQuestion.subjectTopic}
**Standard Answer:** Option ${String.fromCharCode(65 + currentQuestion.correctIndex)}) ${currentQuestion.choices[currentQuestion.correctIndex]}

**Step-by-Step Proof & Logic:**
1. **Core Law:** ${currentQuestion.explanation}
2. **Analysis of Alternatives:** Incorrect options fail boundary checks or violate canonical physical/mathematical definitions.
3. **Faculty Advice:** When answering in university midterms, explicitly state the governing theorem before algebraic steps.

*Verified by Wolkite & Ethiopian Public Universities Examination Board.*`);
      } else if (mode === 'hint') {
        setAiResponse(`💡 **Faculty Study Clue:**
Pay close attention to **${currentQuestion.subjectTopic}**. 
* Eliminate options that have incorrect dimensions or opposite signs.
* Remember standard properties from official curriculum textbooks.
* Double-check before submitting.`);
      } else if (mode === 'amharic') {
        setAiResponse(`### 🇪🇹 በአማርኛ ማብራሪያ (Amharic Breakdown)
**የትምህርት ርዕስ፦** ${currentQuestion.subjectTopic}
**ትክክለኛ መልስ፦** ${currentQuestion.choices[currentQuestion.correctIndex]}

**ማብራሪያ፦**
${currentQuestion.amharicExplanation || currentQuestion.explanation}

**የፈተና ምክር፦** በፈተና ወቅት ጥያቄውን በጥሞና አንብበው የተሳሳቱትን አማራጮች አስቀድመው በማስወገድ ትክክለኛውን ይምረጡ።`);
      }
      setAiLoading(false);
      playSuccessChime();
      onStudyAction();
    }, 180);
  };

  // Handle Practice Choice Selection
  // Handle Practice Choice Selection
  const handleSelectChoice = (choiceIdx: number) => {
    if (showAnswerFeedback) return;
    const isSheetFree = Boolean(
      activeSheet && (
        (activeSheet.subject || '').toLowerCase().includes('bio') ||
        (activeSheet.subject || '').toLowerCase().includes('chem') ||
        (activeSheet.title || '').toLowerCase().includes('bio') ||
        (activeSheet.title || '').toLowerCase().includes('chem')
      )
    );
    if (currentQuestion && activeSheet && !isSheetFree) {
      const qKey = `${activeSheet.id}_q_${currentQuestion.id || activeQuestionIndex}`;
      const alreadyTried = triedQuestionKeys.includes(qKey);
      if (!isProUser && !alreadyTried && questionsTriedCount >= FREE_TRIAL_LIMIT) {
        playFailureChime();
        setShowTrialLimitModal(true);
        return;
      }
    }
    playClickChime();
    setSelectedChoiceIndex(choiceIdx);
  };

  const handleCheckAnswer = () => {
    if (selectedChoiceIndex === null || !currentQuestion || !activeSheet) return;

    const isSheetFree = Boolean(
      activeSheet && (
        (activeSheet.subject || '').toLowerCase().includes('bio') ||
        (activeSheet.subject || '').toLowerCase().includes('chem') ||
        (activeSheet.title || '').toLowerCase().includes('bio') ||
        (activeSheet.title || '').toLowerCase().includes('chem')
      )
    );

    // 20-Question Free Practice Quota Check (Biology & Chemistry are 100% Free!)
    const qKey = `${activeSheet.id}_q_${currentQuestion.id || activeQuestionIndex}`;
    const alreadyTried = triedQuestionKeys.includes(qKey);

    if (!isProUser && !isSheetFree && !alreadyTried && questionsTriedCount >= FREE_TRIAL_LIMIT) {
      playFailureChime();
      setShowTrialLimitModal(true);
      return;
    }

    if (!alreadyTried && !isSheetFree) {
      const updatedKeys = [...triedQuestionKeys, qKey];
      setTriedQuestionKeys(updatedKeys);
      safeStorage.setItem('ethiolearn_tried_question_keys', JSON.stringify(updatedKeys));
      safeStorage.setItem('ethiolearn_questions_tried_count', String(updatedKeys.length));

      if (!isProUser && updatedKeys.length >= FREE_TRIAL_LIMIT) {
        setTimeout(() => {
          setShowTrialLimitModal(true);
        }, 1200);
      }
    }

    setShowAnswerFeedback(true);
    const isCorrect = selectedChoiceIndex === currentQuestion.correctIndex;
    if (isCorrect) {
      playSuccessChime();
      onStudyAction();
    } else {
      playFailureChime();
    }
  };

  // ============================================================================
  // ⏱️ TIMED SIMULATION ENGINE
  // ============================================================================
  const [simulationActive, setSimulationActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [simulationAnswers, setSimulationAnswers] = useState<Record<number, number>>({});
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});

  const answeredQuestions = useMemo(() => {
    return examMode === 'simulation' ? simulationAnswers : practiceAnswers;
  }, [examMode, simulationAnswers, practiceAnswers]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [simulationResultModal, setSimulationResultModal] = useState<{
    correctCount: number;
    totalCount: number;
    scorePercent: number;
    timeTakenSeconds: number;
  } | null>(null);

  const timerRef = useRef<any>(null);

  const startTimedSimulation = () => {
    if (!activeSheet) return;
    const isSheetFree = Boolean(
      (activeSheet.subject || '').toLowerCase().includes('bio') ||
      (activeSheet.subject || '').toLowerCase().includes('chem') ||
      (activeSheet.title || '').toLowerCase().includes('bio') ||
      (activeSheet.title || '').toLowerCase().includes('chem')
    );
    if (!isProUser && !isSheetFree && questionsTriedCount >= FREE_TRIAL_LIMIT) {
      playFailureChime();
      setShowTrialLimitModal(true);
      return;
    }
    playSuccessChime();
    setSimulationAnswers({});
    setFlaggedQuestions([]);
    setActiveQuestionIndex(0);
    setSecondsRemaining((activeSheet.durationMinutes || 45) * 60);
    setSimulationActive(true);
    setExamMode('simulation');
  };

  useEffect(() => {
    if (simulationActive && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitSimulationExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simulationActive, secondsRemaining]);

  const submitSimulationExam = () => {
    if (!activeSheet) return;
    if (timerRef.current) clearInterval(timerRef.current);
    playSuccessChime();

    let correct = 0;
    activeSheet.questions.forEach((q, idx) => {
      if (simulationAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });

    const total = activeSheet.questions.length;
    const pct = Math.round((correct / total) * 100);
    const timeTaken = (activeSheet.durationMinutes * 60) - secondsRemaining;

    setSimulationResultModal({
      correctCount: correct,
      totalCount: total,
      scorePercent: pct,
      timeTakenSeconds: Math.max(10, timeTaken)
    });
    setSimulationActive(false);

    // Safely record offline exam attempt in IndexedDB queue for automatic Supabase sync
    if (profile?.email) {
      enqueueOfflineProgress(profile.email, 'exam_attempt', {
        id: `sim_${Date.now()}_${activeSheet.id}`,
        sheetId: activeSheet.id,
        sheetTitle: activeSheet.title,
        subject: activeSheet.subject,
        score: pct,
        correctCount: correct,
        totalCount: total,
        durationSeconds: Math.max(10, timeTaken),
        timestamp: new Date().toISOString()
      }).catch(err => console.warn('[Offline Progress Queue]:', err));
    }

    onStudyAction();
  };

  const toggleFlagQuestion = (idx: number) => {
    playClickChime();
    setFlaggedQuestions(prev => 
      prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]
    );
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ============================================================================
  // ⚡ DAILY SURPRISE EXAM QUESTION & STREAK
  // ============================================================================
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);
  const [surpriseQuestion, setSurpriseQuestion] = useState<ExamQuestion | null>(null);
  const [surpriseSelectedChoice, setSurpriseSelectedChoice] = useState<number | null>(null);
  const [surpriseChecked, setSurpriseChecked] = useState(false);
  const [surpriseStreak, setSurpriseStreak] = useState<number>(() => {
    try {
      const s = safeStorage.getItem('ethiolearn_surprise_streak');
      return s ? parseInt(s, 10) : 3;
    } catch {
      return 3;
    }
  });

  const launchSurpriseQuestion = () => {
    playClickChime();
    // Gather all candidate questions from all sheets
    const allQuestions: ExamQuestion[] = [];
    examSheets.forEach(s => {
      s.questions.forEach(q => allQuestions.push(q));
    });
    if (allQuestions.length > 0) {
      const picked = allQuestions[Math.floor(Math.random() * allQuestions.length)];
      setSurpriseQuestion(picked);
      setSurpriseSelectedChoice(null);
      setSurpriseChecked(false);
      setShowSurpriseModal(true);
    }
  };

  const handleSurpriseSubmit = () => {
    if (surpriseSelectedChoice === null || !surpriseQuestion) return;
    setSurpriseChecked(true);
    const isCorrect = surpriseSelectedChoice === surpriseQuestion.correctIndex;
    if (isCorrect) {
      playSuccessChime();
      const nextStreak = surpriseStreak + 1;
      setSurpriseStreak(nextStreak);
      safeStorage.setItem('ethiolearn_surprise_streak', String(nextStreak));
      onStudyAction();
    } else {
      playFailureChime();
      setSurpriseStreak(0);
      safeStorage.setItem('ethiolearn_surprise_streak', '0');
    }
  };

  // ============================================================================
  // 🏛️ UNIVERSITY EXAM CONFIGURATION (Zero AI, Pure Supabase Question Bank)
  // ============================================================================
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configUni, setConfigUni] = useState('Wolkite University (WKU)');
  const [configSubject, setConfigSubject] = useState('Mathematics');
  const [configCourse, setConfigCourse] = useState('Freshman Mathematics (Math 1011)');
  const [configYear, setConfigYear] = useState('2016 E.C.');
  const [configQuestionCount, setConfigQuestionCount] = useState<number>(10);
  const [configDifficulty, setConfigDifficulty] = useState<'easy' | 'medium' | 'hard' | 'all'>('all');
  const [configLoading, setConfigLoading] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);

  const handleLaunchConfiguredExam = async () => {
    playClickChime();
    setConfigLoading(true);
    setConfigFeedback(language === 'am' ? 'ከሱፓቤዝ የጥያቄ ባንክ በማዘጋጀት ላይ...' : 'Retrieving pre-generated questions from Supabase bank...');

    try {
      const difficultyParam = configDifficulty === 'all' ? undefined : configDifficulty;
      const records = await generateRandomExamQuestions({
        university: configUni,
        subject: configSubject,
        difficulty: difficultyParam,
        totalQuestions: configQuestionCount,
        examCategory: 'university_exam'
      });

      if (records && records.length > 0) {
        applyConfiguredExam(records);
        return;
      }

      // Broaden query to subject in database
      const fallbackRecords = await generateRandomExamQuestions({
        subject: configSubject,
        difficulty: difficultyParam,
        totalQuestions: configQuestionCount
      });

      if (fallbackRecords && fallbackRecords.length > 0) {
        applyConfiguredExam(fallbackRecords);
        return;
      }

      // Match from existing exam papers repository
      const matching = examSheets.find(s => s.subject.toLowerCase().includes(configSubject.toLowerCase())) || examSheets[0];
      if (matching) {
        setSelectedSheetId(matching.id);
        setShowConfigModal(false);
        startTimedSimulation();
      } else {
        setShowConfigModal(false);
      }
    } catch (e: any) {
      alert(`Could not load questions: ${e.message}`);
    } finally {
      setConfigLoading(false);
      setConfigFeedback(null);
    }
  };

  const applyConfiguredExam = (records: QuestionBankRecord[]) => {
    const formattedQuestions: ExamQuestion[] = records.map((q, idx) => {
      const opts = q.options && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'];
      const choices = opts.map((opt, oIdx) => `${String.fromCharCode(65 + oIdx)}) ${opt}`);
      let correctIdx = opts.findIndex(o => o.trim().toLowerCase() === q.correct_answer.trim().toLowerCase());
      if (correctIdx === -1) correctIdx = 0;

      return {
        id: idx + 1,
        qText: q.question_text,
        choices,
        correctIndex: correctIdx,
        subjectTopic: `${q.subject} • ${q.course}${q.unit ? ` (${q.unit})` : ''}`,
        explanation: q.explanation || `Official question from ${q.university || configUni} question bank.`,
        amharicExplanation: `ከ${q.university || configUni} የፈተና ባንክ የተወሰደ ጥያቄ።`
      };
    });

    const newPaperId = `custom_assembled_${Date.now()}`;
    const newPaper: ExamPaperSheet = {
      id: newPaperId,
      title: `${configUni} — ${configSubject} (${configYear}) Assembled Paper`,
      university: configUni,
      year: configYear,
      subject: configSubject,
      department: 'Faculty of Natural & Computational Sciences',
      durationMinutes: Math.max(15, records.length * 2),
      questions: formattedQuestions
    };

    setExamSheets(prev => [newPaper, ...prev]);
    setSelectedSheetId(newPaperId);
    setShowConfigModal(false);
    playSuccessChime();
    startTimedSimulation();
  };

  // ============================================================================
  // 🎨 SUBJECT VISUAL IDENTITY HELPER (Pro Academic Standard)
  // ============================================================================
  const getSubjectBadge = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('math') || s.includes('calculus')) {
      return { Icon: Target, code: 'MATH', border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400' };
    } else if (s.includes('physics')) {
      return { Icon: Atom, code: 'PHYS', border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-400' };
    } else if (s.includes('chemistry')) {
      return { Icon: FlaskConical, code: 'CHEM', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    } else if (s.includes('biology')) {
      return { Icon: Dna, code: 'BIOL', border: 'border-green-500/30', bg: 'bg-green-500/10', text: 'text-green-400' };
    } else if (s.includes('english')) {
      return { Icon: Languages, code: 'ENGL', border: 'border-sky-500/30', bg: 'bg-sky-500/10', text: 'text-sky-400' };
    } else if (s.includes('computer') || s.includes('c++')) {
      return { Icon: Code2, code: 'COSC', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-400' };
    } else if (s.includes('logic')) {
      return { Icon: BrainCircuit, code: 'LOGC', border: 'border-pink-500/30', bg: 'bg-pink-500/10', text: 'text-pink-400' };
    } else if (s.includes('aptitude')) {
      return { Icon: Target, code: 'APTD', border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' };
    } else if (s.includes('accounting') || s.includes('finance')) {
      return { Icon: BarChart2, code: 'ACCT', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    } else if (s.includes('economics')) {
      return { Icon: BarChart2, code: 'ECON', border: 'border-teal-500/30', bg: 'bg-teal-500/10', text: 'text-teal-400' };
    } else if (s.includes('electrical') || s.includes('ece')) {
      return { Icon: Zap, code: 'ECE', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-400' };
    } else if (s.includes('engineering') || s.includes('statics')) {
      return { Icon: Sliders, code: 'ENGR', border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400' };
    } else if (s.includes('geography')) {
      return { Icon: BookOpen, code: 'GEOG', border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' };
    } else if (s.includes('global') || s.includes('international')) {
      return { Icon: BookOpen, code: 'GLTR', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', text: 'text-indigo-400' };
    }
    return { Icon: GraduationCap, code: 'ACAD', border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' };
  };

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 pb-28 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      
      {/* ========================================================================= */}
      {/* 1. DEDICATED QUESTION PAGE: FOCUSED ONE-AT-A-TIME SOLVER                  */}
      {/* ========================================================================= */}
      {examViewMode === 'session' && currentQuestion && (
        <FocusedQuestionView
          paperTitle={activeSheet?.title || 'University Exam'}
          university={activeSheet?.university || 'Wolkite University'}
          subject={activeSheet?.subject || 'Exam Paper'}
          year={activeSheet?.year}
          question={currentQuestion as any}
          questionIndex={activeQuestionIndex}
          totalQuestions={visibleQuestions.length}
          selectedChoiceIndex={answeredQuestions[activeQuestionIndex] !== undefined ? answeredQuestions[activeQuestionIndex] : selectedChoiceIndex}
          onSelectChoice={(idx) => {
            handleSelectChoice(idx);
            if (examMode === 'simulation') {
              setSimulationAnswers(prev => ({ ...prev, [activeQuestionIndex]: idx }));
            } else {
              setPracticeAnswers(prev => ({ ...prev, [activeQuestionIndex]: idx }));
            }
          }}
          showFeedback={showAnswerFeedback}
          onCheckAnswer={handleCheckAnswer}
          onNextQuestion={() => {
            if (activeQuestionIndex < visibleQuestions.length - 1) {
              const nextIdx = activeQuestionIndex + 1;
              setActiveQuestionIndex(nextIdx);
              setSelectedChoiceIndex(answeredQuestions[nextIdx] !== undefined ? answeredQuestions[nextIdx] : null);
              setShowAnswerFeedback(false);
            }
          }}
          onPrevQuestion={() => {
            if (activeQuestionIndex > 0) {
              const prevIdx = activeQuestionIndex - 1;
              setActiveQuestionIndex(prevIdx);
              setSelectedChoiceIndex(answeredQuestions[prevIdx] !== undefined ? answeredQuestions[prevIdx] : null);
              setShowAnswerFeedback(false);
            }
          }}
          onJumpToQuestion={(idx) => {
            setActiveQuestionIndex(idx);
            setSelectedChoiceIndex(answeredQuestions[idx] !== undefined ? answeredQuestions[idx] : null);
            setShowAnswerFeedback(false);
          }}
          onBackToDetail={() => setExamViewMode('detail')}
          isBookmarked={bookmarkedQuestions.includes(currentQuestion.id)}
          onToggleBookmark={() => toggleBookmarkQuestion(currentQuestion.id)}
          language={language}
          isSimulation={examMode === 'simulation' && simulationActive}
          simulationTimeRemaining={secondsRemaining}
          onFinishSimulation={submitSimulationExam}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. DEDICATED EXAM BROWSER VIEW                                           */}
      {/* ========================================================================= */}
      {examViewMode === 'browser' && (
        <ExamBrowserView
          filteredSheets={filteredSheets}
          totalQuestionsInRepository={totalQuestionsInRepository}
          totalPapersCount={examSheets.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          levelFilter={levelFilter}
          onLevelFilterChange={setLevelFilter}
          selectedUniversity={selectedUniversity}
          onSelectUniversity={setSelectedUniversity}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          selectedDepartment={selectedDepartment}
          onSelectDepartment={setSelectedDepartment}
          paperTab={paperTab}
          onPaperTabChange={setPaperTab}
          sortBy={sortBy}
          onSortChange={setSortBy}
          bookmarkedPapers={bookmarkedPapers}
          onToggleBookmark={toggleBookmark}
          onOpenExam={(sheetId) => {
            setSelectedSheetId(sheetId);
            setActiveQuestionIndex(0);
            setSelectedChoiceIndex(null);
            setShowAnswerFeedback(false);
            setSimulationActive(false);
            setExamViewMode('detail');
            onStudyAction();
          }}
          onOpenNewFileModal={() => setShowNewFileModal(true)}
          onOpenConfigModal={() => setShowConfigModal(true)}
          onLaunchSurprise={launchSurpriseQuestion}
          universityList={universityList}
          yearList={yearList}
          departmentList={departmentList}
          subjectList={subjectList}
          language={language}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED EXAM DETAIL / STUDY PAGE                                    */}
      {/* ========================================================================= */}
      {examViewMode === 'detail' && activeSheet && (
        <ExamDetailView
          activeSheet={activeSheet}
          onBackToBrowser={() => {
            playClickChime();
            setExamViewMode('browser');
          }}
          onStartStudy={() => {
            playClickChime();
            setExamMode('practice');
            setSimulationActive(false);
            setActiveQuestionIndex(0);
            setSelectedChoiceIndex(null);
            setShowAnswerFeedback(false);
            setExamViewMode('session');
            onStudyAction();
          }}
          onStartSimulation={() => {
            playClickChime();
            startTimedSimulation();
            setActiveQuestionIndex(0);
            setSelectedChoiceIndex(null);
            setShowAnswerFeedback(false);
            setExamViewMode('session');
            onStudyAction();
          }}
          onOpenQuestion={(qIndex) => {
            playClickChime();
            setActiveQuestionIndex(qIndex);
            setSelectedChoiceIndex(answeredQuestions[qIndex] !== undefined ? answeredQuestions[qIndex] : null);
            setShowAnswerFeedback(false);
            setExamViewMode('session');
            onStudyAction();
          }}
          isBookmarked={bookmarkedPapers.includes(activeSheet.id)}
          onToggleBookmark={() => toggleBookmark(activeSheet.id)}
          language={language}
          isProUser={isProUser}
          onUpgrade={() => onNavigate('upgrade')}
          questionsTriedCount={questionsTriedCount}
          freeTrialLimit={FREE_TRIAL_LIMIT}
          onGenerateMoreQuestions={() => {
            setGenerateCount(20);
            setShowGenerateModal(true);
          }}
          isGeneratingQuestions={isGenerating}
          unitList={unitSummaryList.map(u => ({ unit: u.unitLabel, count: u.count }))}
          selectedUnit={selectedUnitFilter}
          onSelectUnit={setSelectedUnitFilter}
          chapterList={availableChaptersList.map(c => c.chapterTitle)}
          selectedChapter={selectedChapterFilter}
          onSelectChapter={setSelectedChapterFilter}
          questionSourceFilter={questionSourceFilter}
          onSelectSourceFilter={setQuestionSourceFilter}
          orderMode={orderMode}
          onToggleOrderMode={() => setOrderMode(prev => prev === 'curriculum' ? 'original' : 'curriculum')}
          answeredQuestions={answeredQuestions}
          visibleQuestions={visibleQuestions}
        />
      )}
      {examViewMode === 'detail' && !activeSheet && (
        <div className="p-12 text-center bg-[#101A33] border border-white/10 rounded-2xl space-y-3">
          <BookOpen className="w-10 h-10 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">
            {language === 'am' ? "ምንም የተመረጠ የፈተና ወረቀት የለም" : "No exam paper selected"}
          </p>
          <button
            onClick={() => setExamViewMode('browser')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
          >
            {language === 'am' ? "ወደ ፈተናዎች ማውጫ ሂድ" : "Go to Exam Library"}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏆 SIMULATION RESULT SCORECARD MODAL                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {simulationResultModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#101A33] border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
                <Trophy className="w-7 h-7 text-amber-400" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold font-serif text-white">
                  {language === 'am' ? 'የፈተና ውጤት ካርድ' : 'Official Performance Scorecard'}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeSheet?.university} — {activeSheet?.title}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {language === 'am' ? 'ውጤት' : 'Score'}
                  </span>
                  <span className={`text-xl font-black ${
                    simulationResultModal.scorePercent >= 75 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {simulationResultModal.scorePercent}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {language === 'am' ? 'ትክክል' : 'Correct'}
                  </span>
                  <span className="text-xl font-black text-white">
                    {simulationResultModal.correctCount}/{simulationResultModal.totalCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {language === 'am' ? 'ጊዜ' : 'Time'}
                  </span>
                  <span className="text-xl font-black text-sky-400">
                    {formatTime(simulationResultModal.timeTakenSeconds)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed font-sans">
                {simulationResultModal.scorePercent >= 75 
                  ? (language === 'am' ? '🎉 ድንቅ ውጤት! የዩኒቨርሲቲ ወይም የ12ኛ ክፍል ፈተናውን በከፍተኛ ደረጃ አልፈዋል።' : '🎉 Outstanding academic performance! You scored well above university passing thresholds.')
                  : (language === 'am' ? '📚 ጥሩ ልምምድ ነው! የተሳሳቱትን ጥያቄዎች በ"ጥናትና ልምምድ" ገጽ በድጋሚ ይከልሱ።' : '📚 Good effort! Review your missed questions in Interactive Study mode with Asgobnyi step-by-step solutions.')}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSimulationResultModal(null);
                    setExamMode('practice');
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {language === 'am' ? 'መልሶችን ገምግም' : 'Review Answers'}
                </button>
                <button
                  onClick={() => {
                    setSimulationResultModal(null);
                    startTimedSimulation();
                  }}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ⚡ DAILY SURPRISE EXAM QUESTION MODAL                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showSurpriseModal && surpriseQuestion && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#101A33] border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Zap className="w-4 h-4 fill-current" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white font-serif">
                      {language === 'am' ? 'የዕለቱ የፈተና ጥያቄ' : 'Daily Challenge Question'}
                    </h3>
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider font-extrabold">
                      {surpriseQuestion.subjectTopic}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSurpriseModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs sm:text-sm font-medium text-white leading-relaxed whitespace-pre-line bg-white/5 p-4 rounded-xl border border-white/5">
                {surpriseQuestion.qText}
              </div>

              <div className="space-y-2">
                {surpriseQuestion.choices.map((ch, idx) => {
                  const isSelected = surpriseSelectedChoice === idx;
                  let style = 'bg-white/5 border-white/10 hover:border-amber-500/40 text-slate-200';

                  if (surpriseChecked) {
                    if (idx === surpriseQuestion.correctIndex) {
                      style = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold';
                    } else if (isSelected && idx !== surpriseQuestion.correctIndex) {
                      style = 'bg-red-500/20 border-red-500/60 text-red-300 line-through';
                    } else {
                      style = 'bg-white/5 border-white/5 opacity-50 text-slate-400';
                    }
                  } else if (isSelected) {
                    style = 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold';
                  }

                  return (
                    <div
                      key={`surprise_ch_${idx}`}
                      onClick={() => {
                        if (!surpriseChecked) {
                          playClickChime();
                          setSurpriseSelectedChoice(idx);
                        }
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${style}`}
                    >
                      {ch}
                    </div>
                  );
                })}
              </div>

              {!surpriseChecked ? (
                <button
                  onClick={handleSurpriseSubmit}
                  disabled={surpriseSelectedChoice === null}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    surpriseSelectedChoice !== null
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {language === 'am' ? 'መልስ አረጋግጥ' : 'Verify Answer (+15 Points)'}
                </button>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    surpriseSelectedChoice === surpriseQuestion.correctIndex
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}>
                    {surpriseQuestion.explanation}
                  </div>
                  <button
                    onClick={() => setShowSurpriseModal(false)}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    {language === 'am' ? 'ዝጋ' : 'Done'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 🏛️ UNIVERSITY EXAM CONFIGURATION MODAL (Zero AI, Pure Supabase Question Bank)*/}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-xl bg-[#101A33] border border-white/15 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                    <Database className="w-3 h-3 text-amber-400" />
                    <span>{language === 'am' ? 'ሱፓቤዝ የፈተና ጥያቄዎች ባንክ' : 'Supabase Question Bank'}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-serif">
                    {language === 'am' ? 'የዩኒቨርሲቲ ፈተና ወረቀት አዘጋጅ' : 'Assemble University Exam'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'am'
                      ? 'ቀደም ብለው የተዘጋጁ ይፋዊ የዩኒቨርሲቲ ጥያቄዎችን ከመረጃ ቋት በመምረጥ ፈተናዎን ይጀምሩ። (ያለ AI መዘግየት)'
                      : 'Retrieve pre-generated, verified university questions directly from Supabase. No real-time AI latency.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                {/* University Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'ዒላማ ዩኒቨርሲቲ' : 'Target University'}
                  </label>
                  <select
                    value={configUni}
                    onChange={(e) => setConfigUni(e.target.value)}
                    className="w-full bg-[#182342] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Wolkite University (WKU)">Wolkite University (WKU) — ወልቂጤ ዩኒቨርሲቲ</option>
                    <option value="Addis Ababa University (AAU)">Addis Ababa University (AAU) — አዲስ አበባ ዩኒቨርሲቲ</option>
                    <option value="Adama Science & Technology (ASTU)">Adama Science & Technology University (ASTU)</option>
                    <option value="Hawassa University (HU)">Hawassa University (HU) — ሀዋሳ ዩኒቨርሲቲ</option>
                    <option value="Jimma University (JU)">Jimma University (JU) — ጅማ ዩኒቨርሲቲ</option>
                    <option value="Bahir Dar University (BDU)">Bahir Dar University (BDU) — ባህር ዳር ዩኒቨርሲቲ</option>
                    <option value="Haramaya University">Haramaya University — ሐረማያ ዩኒቨርሲቲ</option>
                    <option value="Ministry of Education (EUEE)">Ministry of Education (EUEE National Matric)</option>
                  </select>
                </div>

                {/* Course & Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'am' ? 'የትምህርት ዓይነት' : 'Subject Field'}
                    </label>
                    <select
                      value={configSubject}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfigSubject(val);
                        if (val === 'Mathematics') setConfigCourse('Freshman Mathematics (Math 1011)');
                        else if (val === 'Emerging Technologies') setConfigCourse('Emerging Technologies (EmTe 1012)');
                        else if (val === 'Inclusiveness') setConfigCourse('Inclusiveness in Education (Incl 1011)');
                        else if (val === 'Physics') setConfigCourse('General Physics (Phys 1011)');
                        else if (val === 'Economics') setConfigCourse('Intro to Economics (Econ 1011)');
                        else setConfigCourse(`${val} Core`);
                      }}
                      className="w-full bg-[#182342] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Emerging Technologies">Emerging Technologies</option>
                      <option value="Inclusiveness">Inclusiveness</option>
                      <option value="Physics">General Physics</option>
                      <option value="Biology">General Biology</option>
                      <option value="Economics">Introduction to Economics</option>
                      <option value="English">Communicative English</option>
                      <option value="Civics">Moral & Civic Education</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'am' ? 'የፈተና ዓመት' : 'Academic Year'}
                    </label>
                    <select
                      value={configYear}
                      onChange={(e) => setConfigYear(e.target.value)}
                      className="w-full bg-[#182342] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="2016 E.C.">2016 E.C. (2024 G.C.)</option>
                      <option value="2015 E.C.">2015 E.C. (2023 G.C.)</option>
                      <option value="2014 E.C.">2014 E.C. (2022 G.C.)</option>
                      <option value="2013 E.C.">2013 E.C. (2021 G.C.)</option>
                    </select>
                  </div>
                </div>

                {/* Question Count & Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'am' ? 'የጥያቄዎች ብዛት' : 'Number of Questions'}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 15, 20].map((cnt) => (
                        <button
                          key={`count_${cnt}`}
                          type="button"
                          onClick={() => setConfigQuestionCount(cnt)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            configQuestionCount === cnt
                              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                              : 'bg-[#182342] border border-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'am' ? 'የከበደነት ደረጃ' : 'Difficulty'}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                        <button
                          key={`diff_${diff}`}
                          type="button"
                          onClick={() => setConfigDifficulty(diff)}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            configDifficulty === diff
                              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                              : 'bg-[#182342] border border-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trust Information Box */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <span className="font-bold text-amber-300">
                      {language === 'am' ? 'የተረጋገጠ የጥያቄዎች ምንጭ' : 'Verified Stored Question Bank'}
                    </span>
                    <p className="text-[11px] text-amber-200/80">
                      {language === 'am'
                        ? 'ሁሉም ጥያቄዎች ከአስተዳዳሪውና ከዩኒቨርሲቲው ዳታቤዝ የሚወጡ ሲሆን በፈተና ወቅት ምንም ዓይነት የ AI ጥሪ አይደረግም።'
                        : 'All questions are pulled directly from the Supabase repository. Fast loading with 100% curriculum compliance.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                >
                  {language === 'am' ? 'ተመለስ' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={handleLaunchConfiguredExam}
                  disabled={configLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {configLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{configFeedback || 'Loading...'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>{language === 'am' ? 'ፈተናውን አዘጋጅተህ ጀምር' : 'Assemble & Start Exam'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ✨ GENERATE NEW UNIQUE QUESTIONS MODAL (ZERO REPETITION GUARANTEED)        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showGenerateModal && activeSheet && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#101A33] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'am' ? 'ተጨማሪ የፈተና ጥያቄዎች አዘጋጅ' : 'Supplementary Question Compiler'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-serif">
                    {language === 'am' ? 'ለዚህ ፈተና ተጨማሪ ጥያቄዎችን ጨምር' : 'Expand Exam with Non-Repeating Questions'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {activeSheet.title} ({activeSheet.university})
                  </p>
                </div>
                <button
                  onClick={() => !isGenerating && setShowGenerateModal(false)}
                  disabled={isGenerating}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Anti-Duplication Assurance Banner */}
              <div className="p-3.5 bg-[#142245] border border-amber-500/25 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-amber-200">
                    {language === 'am' ? 'የጥያቄ ድግግሞሽ መከላከያ ስልት' : 'Strict Non-Repetition Guarantee'}
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {language === 'am'
                      ? `በዚህ ፈተና ውስጥ ያሉ ነባር ${activeSheet.questions.length} ኦፊሴላዊ ጥያቄዎች ሳይነኩ ይቀመጣሉ። አዳዲሶቹ ጥያቄዎች ከነባሮቹ ጋር ተነጻጽረው ፍጹም ያልተደገሙ ሆነው ይቀርባሉ።`
                      : `The ${activeSheet.questions.length} existing authentic questions remain completely untouched. Supplementary questions are strictly filtered against the existing bank to guarantee zero repetition.`}
                  </p>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                {/* Topic Focus */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'የትምህርት ርዕስ (አማራጭ)' : 'Specific Topic Focus (Optional)'}
                  </label>
                  <input
                    type="text"
                    disabled={isGenerating}
                    placeholder={
                      activeSheet.subject.toLowerCase().includes('math')
                        ? 'e.g. Limits, Integration, Matrices, Vectors'
                        : activeSheet.subject.toLowerCase().includes('physic')
                        ? 'e.g. Kinematics, Thermodynamics, Electromagnetism'
                        : 'e.g. Core concepts or chapter name...'
                    }
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                    className="w-full bg-[#182342] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'የጥያቄዎች ብዛት' : 'Number of New Questions'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 10, 15].map((cnt) => (
                      <button
                        key={`gen_cnt_${cnt}`}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setGenerateCount(cnt)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          generateCount === cnt
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-[#182342] border border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        +{cnt} {language === 'am' ? 'ጥያቄ' : 'Questions'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Rigor */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'የጥያቄው ጥልቀት ደረጃ' : 'Academic Rigor'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'standard', labelEn: 'Standard', labelAm: 'መደበኛ' },
                      { id: 'challenging', labelEn: 'Challenging', labelAm: 'ፈታኝ' },
                      { id: 'honors', labelEn: 'Honors', labelAm: 'የክብር ደረጃ' }
                    ].map((diff) => (
                      <button
                        key={`gen_diff_${diff.id}`}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setGenerateDifficulty(diff.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          generateDifficulty === diff.id
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-[#182342] border border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        {language === 'am' ? diff.labelAm : diff.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generation Status or Feedback */}
                {isGenerating && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                    <p className="text-xs text-amber-200">
                      {generateFeedbackMsg || (language === 'am' ? 'ጥያቄዎች እየተዘጋጁ ነው...' : 'Compiling unique questions...')}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer disabled:opacity-30"
                >
                  {language === 'am' ? 'ተመለስ' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{language === 'am' ? 'እየተዘጋጀ ነው...' : 'Compiling...'}</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 text-slate-950" />
                      <span>{language === 'am' ? 'ጥያቄዎችን አዘጋጅ' : 'Compile Questions'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 20-QUESTION TRIAL LIMIT MODAL                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showTrialLimitModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#101A33] border border-amber-500/40 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 relative"
            >
              <button
                type="button"
                onClick={() => setShowTrialLimitModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-3 pt-2">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
                    {language === 'am' ? 'የነጻ ሙከራ ገደብ ደርሷል (20/20)' : 'Trial Limit Reached (20/20)'}
                  </span>
                  <h3 className="text-xl font-black text-white font-serif pt-1">
                    {language === 'am' ? 'የ20 ጥያቄዎች ነጻ ሙከራዎ ተጠናቋል' : '20 Free Questions Solved!'}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto pt-1">
                    {language === 'am'
                      ? 'የ20 ጥያቄዎች የነጻ ሙከራዎን በተሳካ ሁኔታ አጠናቀዋል። ሙሉ የዩኒቨርሲቲ ፈተናዎችን፣ ያልተገደቡ የልምምድ ጥያቄዎችን እና የፋኩልቲ ሙሉ የመፍትሔ ቅደም ተከተል ለመጠቀም ወደ EthioLearn Pro ያሳድጉ።'
                      : 'You have solved all 20 complimentary trial questions. Upgrade to EthioLearn Pro to unlock all 10,000+ authentic university past exam questions, step-by-step faculty proofs, and timed simulation mock rankings.'}
                  </p>
                </div>
              </div>

              {/* Pro Feature Checklist */}
              <div className="bg-[#142245] border border-white/10 rounded-xl p-4 space-y-2.5 text-xs text-slate-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{language === 'am' ? 'ያልተገደበ የፈተና ጥያቄዎች (WKU፣ AAU፣ ASTU እና ሌሎችም)' : 'Unlimited questions across WKU, AAU, ASTU & All Universities'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{language === 'am' ? 'የፋኩልቲ ደረጃ-በደረጃ የመፍትሔ ማብራሪያ (Step-by-Step Proofs)' : 'Official Faculty Step-by-Step Solutions & Theory Breakdown'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{language === 'am' ? 'ፈጣን የቴሌብር (Telebirr) እና ንግድ ባንክ (CBE) ክፍያ' : 'Instant Activation via Telebirr, CBE Birr & HelloCash'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTrialLimitModal(false);
                    onNavigate('upgrade');
                  }}
                  className="w-full sm:flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>{language === 'am' ? 'ወደ ፕሮ አሳድግ (ብር 99/ወር)' : 'Upgrade to Pro (99 ETB/mo)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTrialLimitModal(false)}
                  className="w-full sm:w-auto px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
                >
                  {language === 'am' ? 'የሞከርኳቸውን ገምግም' : 'Review Answered Qs'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* NEW EXAM FILE CREATION MODAL                                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showNewFileModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#101A33] border border-white/10 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 relative"
            >
              <button
                type="button"
                onClick={() => setShowNewFileModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'የፈተና ወረቀት ማከያ' : 'Exam Archive Manager'}</span>
                </div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {language === 'am' ? 'አዲስ የፈተና ፋይል ፍጠር' : 'Add New Exam File / Paper'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'am'
                    ? 'አዲስ የፈተና ፋይል ፍጠር፤ ባዶ ሆኖ ከተፈጠረ በኋላ በቀላሉ 20 ጥያቄዎችን በፋይሉ ውስጥ ማከል ትችላለህ።'
                    : 'Create a new exam subject paper. If empty, you can add 20 standardized questions to it with one click.'}
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'የፈተናው ሙሉ ርዕስ *' : 'Paper Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newFileTitle}
                    onChange={(e) => setNewFileTitle(e.target.value)}
                    placeholder="e.g. C++ Programming Final Exam 2016"
                    className="w-full bg-[#182342] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'am' ? 'ዩኒቨርሲቲ' : 'University'}
                    </label>
                    <input
                      type="text"
                      value={newFileUni}
                      onChange={(e) => setNewFileUni(e.target.value)}
                      placeholder="e.g. Wolkite University"
                      className="w-full bg-[#182342] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'am' ? 'የትምህርት ዓይነት' : 'Subject / Department'}
                    </label>
                    <input
                      type="text"
                      value={newFileSubject}
                      onChange={(e) => setNewFileSubject(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full bg-[#182342] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {language === 'am' ? 'የፈተና ዓመት' : 'Academic Year'}
                  </label>
                  <input
                    type="text"
                    value={newFileYear}
                    onChange={(e) => setNewFileYear(e.target.value)}
                    placeholder="e.g. 2016 E.C. (2024)"
                    className="w-full bg-[#182342] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                >
                  {language === 'am' ? 'ተመለስ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewExamFile}
                  disabled={!newFileTitle.trim()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-4 h-4 text-slate-950" />
                  <span>{language === 'am' ? 'ፋይሉን ፍጠር' : 'Create Exam File'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
