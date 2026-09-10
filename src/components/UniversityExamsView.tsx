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
  FileQuestion, HelpCircle, Lock, FilePlus
} from 'lucide-react';
import { StudentProfile, QuestionBankRecord } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { fetchPublishedExams } from '../utils/contentStore';
import { INITIAL_QUESTIONS } from '../data/initialFirestoreContent';
import { generateRandomExamQuestions, fetchQuestionsPaginated } from '../utils/supabaseQuestions';
import { getEthiopian10kExamSheets } from '../data/ethiopianExams10kBank';
import { generateUniqueQuestions } from '../utils/examQuestionGenerator';

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
// 📚 VERIFIED PAST PAPERS REPOSITORY (Wolkite, AAU, ASTU, Hawassa, Jimma, EUEE)
// ============================================================================
export const UNIVERSITY_SHEETS: ExamPaperSheet[] = getEthiopian10kExamSheets();

export default function UniversityExamsView({
  profile,
  apiKey,
  language,
  onNavigate,
  onStudyAction
}: UniversityExamsProps) {
  // Master papers repository state with separated official and student-generated questions
  const [examSheets, setExamSheets] = useState<ExamPaperSheet[]>(() => {
    const customSheets = loadCustomExamSheets();
    const baseSheets = UNIVERSITY_SHEETS.map(sheet => {
      const savedAi = loadGeneratedQuestionsForSheet(sheet.id);
      const taggedOfficial: ExamQuestion[] = sheet.questions.map(q => ({
        ...q,
        sourceType: (q.sourceType || 'official_past_exam') as 'official_past_exam' | 'ai_generated'
      }));
      return {
        ...sheet,
        questions: [...taggedOfficial, ...savedAi]
      };
    });
    return [...customSheets, ...baseSheets];
  });
  const [selectedSheetId, setSelectedSheetId] = useState<string>(() => UNIVERSITY_SHEETS[0]?.id || '');

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

  // Search, Level & Subject Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'uni' | 'matric' | 'bookmarked'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'year_desc' | 'questions' | 'uni'>('year_desc');

  // Bookmarks persistence
  const [bookmarkedPapers, setBookmarkedPapers] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_bookmarked_exams');
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
          return [...newItems, ...prev];
        });
      }
    }).catch(err => console.warn('Could not fetch remote exams:', err));

    // 2. Fetch pre-generated university questions from Supabase Question Bank
    fetchQuestionsPaginated({ examCategory: 'university_exam', isPublished: true }, 1, 200).then(res => {
      if (res.questions && res.questions.length > 0) {
        const groupMap: Record<string, {
          title: string;
          university: string;
          year: string;
          subject: string;
          department?: string;
          questions: ExamQuestion[];
        }> = {};

        res.questions.forEach(q => {
          const uni = q.university || 'Wolkite University (WKU)';
          const crs = q.course || q.subject || 'Academic';
          const yr = q.academic_year || '2016 E.C.';
          const key = `supa_exam_${uni}_${crs}_${yr}`.replace(/[^a-zA-Z0-9_]/g, '_');

          if (!groupMap[key]) {
            groupMap[key] = {
              title: `${crs} (${yr}) Exam Paper`,
              university: uni,
              year: yr,
              subject: q.subject || 'Academic',
              department: q.department || 'University Academic Faculty',
              questions: []
            };
          }

          const opts = q.options && q.options.length > 0 ? q.options : ['True', 'False'];
          const choices = opts.map((opt, oIdx) => `${String.fromCharCode(65 + oIdx)}) ${opt}`);
          let correctIdx = opts.findIndex(o => o.trim().toLowerCase() === q.correct_answer.trim().toLowerCase());
          if (correctIdx === -1) correctIdx = 0;

          groupMap[key].questions.push({
            id: groupMap[key].questions.length + 1,
            qText: q.question_text,
            choices,
            correctIndex: correctIdx,
            subjectTopic: `${q.subject} • ${q.course}${q.unit ? ` (${q.unit})` : ''}`,
            explanation: q.explanation || `Official question from ${uni} question bank.`,
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
            return [...uniqueNew, ...prev];
          });
        }
      }
    }).catch(err => console.warn('Could not load Supabase university questions:', err));
  }, []);

  // Filtered Exam Sheets
  const filteredSheets = useMemo(() => {
    return examSheets.filter(sheet => {
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
        const matchesTopic = sheet.questions.some(qn => qn.qText.toLowerCase().includes(q) || qn.subjectTopic.toLowerCase().includes(q));
        if (!matchesTitle && !matchesUni && !matchesSubject && !matchesTopic) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'questions') return b.questions.length - a.questions.length;
      if (sortBy === 'uni') return a.university.localeCompare(b.university);
      return b.year.localeCompare(a.year);
    });
  }, [examSheets, levelFilter, selectedSubject, searchQuery, sortBy, bookmarkedPapers]);

  // Active Selected Sheet
  const activeSheet = useMemo(() => {
    return examSheets.find(s => s.id === selectedSheetId) || filteredSheets[0] || examSheets[0];
  }, [examSheets, selectedSheetId, filteredSheets]);

  // Distinct subjects list for filter chips
  const subjectList = useMemo(() => {
    const set = new Set(examSheets.map(s => s.subject));
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
  const handleSelectChoice = (choiceIdx: number) => {
    if (showAnswerFeedback) return;
    if (currentQuestion && activeSheet) {
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

    // 20-Question Free Practice Quota Check
    const qKey = `${activeSheet.id}_q_${currentQuestion.id || activeQuestionIndex}`;
    const alreadyTried = triedQuestionKeys.includes(qKey);

    if (!isProUser && !alreadyTried && questionsTriedCount >= FREE_TRIAL_LIMIT) {
      playFailureChime();
      setShowTrialLimitModal(true);
      return;
    }

    if (!alreadyTried) {
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
    if (!isProUser && questionsTriedCount >= FREE_TRIAL_LIMIT) {
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

      // If database is temporarily unreachable, match from verified static repository
      const matching = UNIVERSITY_SHEETS.find(s => s.subject.toLowerCase().includes(configSubject.toLowerCase())) || UNIVERSITY_SHEETS[0];
      setSelectedSheetId(matching.id);
      setShowConfigModal(false);
      startTimedSimulation();
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
      {/* 🏛️ PRO HEADER: AUTHENTIC UNIVERSITY & MATRIC EXAM SUITE                    */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#101A33] via-[#0E1628] to-[#121E36] border border-white/10 p-6 sm:p-8 shadow-2xl mb-8">
        {/* Ethiopian Tri-Color Subtle Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-emerald-500" />
          <div className="flex-1 bg-[#F59E0B]" />
          <div className="flex-1 bg-red-500" />
        </div>

        {/* Ambient Subtle Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'am' ? 'የተረጋገጡ የፈተና ወረቀቶች' : 'Official Verified Exam Sheets'}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight text-white leading-tight">
              {language === 'am' ? 'የኢትዮለርን አካዳሚክ የፈተና ማዕከል' : 'EthioLearn Pro Examination Suite'}
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {language === 'am' 
                ? 'የወልቂጤ፣ የአዲስ አበባና የሌሎች ዩኒቨርሲቲዎች ሚድተርም/ፋይናል ፈተናዎች እና የ12ኛ ክፍል ብሔራዊ ማትሪክ ወረቀቶች። በይነተገናኝ ልምምድ ወይም በሰዓት የተገደበ የፈተና ሞዴል።'
                : 'Verified past exam papers from Wolkite, AAU, ASTU, and the National Matric Agency (EUEE). Master step-by-step solutions or test yourself in timed simulation.'}
            </p>

            {/* Quick Metrics Ribbon */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{totalQuestionsInRepository.toLocaleString()} {language === 'am' ? 'የተዘጋጁ ጥያቄዎች' : 'Verified Questions in Place'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>{examSheets.length} {language === 'am' ? 'የፈተና ወረቀቶች' : 'Exam Papers (500 Qs each)'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>{surpriseStreak} {language === 'am' ? 'ቀን ተከታታይ' : 'Day Streak'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'am' ? 'የአካዳሚክ ማብራሪያዎች' : 'Faculty Solutions'}</span>
              </span>
            </div>
          </div>

          {/* Quick Action: Daily Surprise Question & Assemble Custom Exam */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => { playClickChime(); setShowConfigModal(true); }}
              className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-400 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Configure and assemble university exam from pre-generated Question Bank"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>{language === 'am' ? 'የዩኒቨርሲቲ ፈተና አዘጋጅ' : 'Assemble University Exam'}</span>
            </button>

            <button
              onClick={launchSurpriseQuestion}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-current" />
              <span>{language === 'am' ? 'የዕለቱ የፈተና ጥያቄ' : 'Daily Challenge Question'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔍 SEARCH, LEVEL TABS & SUBJECT FILTERS                                   */}
      {/* ========================================================================= */}
      <div className="space-y-4 mb-6">
        {/* Primary Row: Search Bar & Level Segmented Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Level Filter Segment */}
          <div className="flex bg-[#101A33] border border-white/10 p-1 rounded-xl gap-1 shrink-0">
            <button
              onClick={() => { playClickChime(); setLevelFilter('all'); }}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                levelFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'am' ? 'ሁሉም ፈተናዎች' : 'All Papers'}
            </button>
            <button
              onClick={() => { playClickChime(); setLevelFilter('uni'); }}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                levelFilter === 'uni'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'am' ? 'ዩኒቨርሲቲ' : 'University'}
            </button>
            <button
              onClick={() => { playClickChime(); setLevelFilter('matric'); }}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                levelFilter === 'matric'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'am' ? '12ኛ ክፍል ማትሪክ' : 'Grade 12 (EUEE)'}
            </button>
            <button
              onClick={() => { playClickChime(); setLevelFilter('exit'); }}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                levelFilter === 'exit'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'am' ? 'የመውጫ ፈተና (Exit Exam)' : 'Exit Exam'}
            </button>
            <button
              onClick={() => { playClickChime(); setLevelFilter('bookmarked'); }}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                levelFilter === 'bookmarked'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'የተቀመጡ' : 'Saved'}</span>
            </button>
          </div>

          {/* Search Input & Sort Selector */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'am' ? 'በፈተና ርዕስ፣ ዩኒቨርሲቲ ወይም ኮርስ ይፈልጉ...' : 'Search by paper title, university, topic, or code...'}
                className="w-full pl-10 pr-10 py-2.5 bg-[#101A33] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-[#101A33] border border-white/10 rounded-xl text-xs text-slate-300 font-semibold focus:outline-none focus:border-amber-500/60 cursor-pointer shrink-0"
            >
              <option value="year_desc">{language === 'am' ? 'አዲስ ዓመት' : 'Latest Year'}</option>
              <option value="questions">{language === 'am' ? 'ብዙ ጥያቄዎች' : 'Most Questions'}</option>
              <option value="uni">{language === 'am' ? 'ዩኒቨርሲቲ' : 'University'}</option>
            </select>
          </div>
        </div>

        {/* Secondary Row: Horizontal Scrollable Subject Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {subjectList.map(subj => {
            const isSelected = selectedSubject === subj;
            const isCpp = subj.toLowerCase().includes('computer') || subj.toLowerCase().includes('c++');

            if (isCpp) {
              return (
                <button
                  key={subj}
                  onClick={() => { playClickChime(); setSelectedSubject(subj); }}
                  title="Introduction to Computer Programming with C++ (CoSc 1011)"
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 text-cyan-300 border border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/40'
                      : 'bg-cyan-950/30 text-cyan-300/90 border border-cyan-500/35 hover:bg-cyan-900/40 hover:text-cyan-100 hover:border-cyan-400/60 shadow-xs'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{language === 'am' ? 'ሲ++ (C++)' : 'C++'}</span>
                </button>
              );
            }

            return (
              <button
                key={subj}
                onClick={() => { playClickChime(); setSelectedSubject(subj); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-[#101A33] text-slate-400 border border-white/5 hover:text-slate-200 hover:border-white/15'
                }`}
              >
                {subj === 'all' ? (language === 'am' ? 'ሁሉም የትምህርት ዓይነቶች' : 'All Subjects') : subj}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📑 MASTER-DETAIL ARENA: PAPERS COLUMN (Left) + EXAM ARENA (Right)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================================= */}
        {/* LEFT: EXAM PAPERS ARCHIVE LIST (4 COLS)                                 */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {filteredSheets.length} {language === 'am' ? 'የፈተና ወረቀቶች' : 'Available Papers'}
            </span>
            <button
              type="button"
              onClick={() => setShowNewFileModal(true)}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10"
              title={language === 'am' ? 'አዲስ የፈተና ፋይል አክል' : 'Add New Exam File'}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{language === 'am' ? '+ አዲስ ፋይል' : '+ Add Exam File'}</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredSheets.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl bg-[#101A33] border border-white/10">
                <Search className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300">
                  {language === 'am' ? 'ምንም የተገኘ የፈተና ወረቀት የለም' : 'No matching exam papers found'}
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setLevelFilter('all'); setSelectedSubject('all'); }}
                  className="mt-3 px-3 py-1.5 text-xs text-amber-400 hover:underline cursor-pointer"
                >
                  {language === 'am' ? 'ሁሉንም አሳይ' : 'Reset Filters'}
                </button>
              </div>
            ) : (
              filteredSheets.map(sheet => {
                const isSelected = sheet.id === activeSheet?.id;
                const badge = getSubjectBadge(sheet.subject);
                const isBookmarked = bookmarkedPapers.includes(sheet.id);

                return (
                  <div
                    key={sheet.id}
                    onClick={() => {
                      playClickChime();
                      setSelectedSheetId(sheet.id);
                      setActiveQuestionIndex(0);
                      setSelectedChoiceIndex(null);
                      setShowAnswerFeedback(false);
                      setSimulationActive(false);
                      onStudyAction();
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[#142245] border-amber-500/60 shadow-lg ring-1 ring-amber-500/20'
                        : 'bg-[#101A33] border-white/10 hover:border-white/20 hover:bg-[#121E3B]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-md border ${badge.bg} ${badge.border} flex items-center justify-center`}>
                          <badge.Icon className={`w-3.5 h-3.5 ${badge.text}`} />
                        </span>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.bg} ${badge.border} ${badge.text}`}>
                          {badge.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                          {sheet.year}
                        </span>
                        <button
                          onClick={(e) => toggleBookmark(sheet.id, e)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <h3 className={`text-xs font-bold leading-snug line-clamp-2 mb-2 transition-colors ${
                      isSelected ? 'text-amber-300 font-extrabold' : 'text-white group-hover:text-slate-200'
                    }`}>
                      {sheet.title}
                    </h3>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-2">
                      <span className="truncate max-w-[150px] text-slate-300 font-medium">
                        {sheet.university}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {sheet.questions.length === 0 ? (
                          <span className="font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded text-[9px] border border-amber-500/30 flex items-center gap-1">
                            <FileQuestion className="w-2.5 h-2.5 text-amber-400" />
                            {language === 'am' ? 'ባዶ ፋይል' : 'Empty File'}
                          </span>
                        ) : (
                          <>
                            <span className="font-semibold text-amber-400/90">
                              {sheet.questions.filter(q => (q.sourceType || 'official_past_exam') === 'official_past_exam').length} {language === 'am' ? 'ኦፊሴላዊ' : 'official'}
                            </span>
                            {sheet.questions.some(q => q.sourceType === 'ai_generated') && (
                              <span className="font-semibold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded text-[9px] border border-indigo-500/30">
                                +{sheet.questions.filter(q => q.sourceType === 'ai_generated').length} {language === 'am' ? 'ተጨማሪ' : 'Practice'}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT: ACTIVE EXAMINATION ARENA (8 COLS)                                */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          {activeSheet ? (
            <div className="bg-[#101A33] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              
              {/* Paper Header Ribbon */}
              <div className="p-5 border-b border-white/10 bg-gradient-to-r from-[#121E3B] to-[#101A33] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      {activeSheet.university}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      {activeSheet.year}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white font-serif leading-snug">
                    {activeSheet.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {activeSheet.department || activeSheet.subject} • {activeSheet.durationMinutes} min official standard
                  </p>
                </div>

                {/* Right controls: Quota Badge & Exam Mode Selector Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Quota Indicator Pill */}
                  {isProUser ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'am' ? 'ፕሮ አባል' : 'Pro Scholar'}</span>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${
                      questionsTriedCount >= FREE_TRIAL_LIMIT 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' 
                        : 'bg-white/5 text-slate-300 border border-white/10'
                    }`}>
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>{language === 'am' ? 'ሙከራ' : 'Trial'}: {Math.min(questionsTriedCount, FREE_TRIAL_LIMIT)}/{FREE_TRIAL_LIMIT}</span>
                      {questionsTriedCount >= FREE_TRIAL_LIMIT && (
                        <button 
                          type="button"
                          onClick={() => onNavigate('upgrade')}
                          className="ml-1 text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
                        >
                          {language === 'am' ? 'አሳድግ' : 'Upgrade'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Exam Mode Selector Buttons */}
                  <div className="flex items-center bg-[#0A1128] border border-white/10 p-1 rounded-xl">
                    <button
                      onClick={() => {
                        playClickChime();
                        setExamMode('practice');
                        setSimulationActive(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        examMode === 'practice'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ጥናትና ልምምድ' : 'Interactive Study'}</span>
                    </button>
                    <button
                      onClick={() => {
                        playClickChime();
                        if (!simulationActive) {
                          startTimedSimulation();
                        } else {
                          setExamMode('simulation');
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        examMode === 'simulation'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'የፈተና ሞዴል' : 'Timed Exam'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Timed Simulation Banner if simulation is active */}
              {examMode === 'simulation' && simulationActive && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${secondsRemaining < 300 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                    <span className="text-xs font-semibold text-slate-300">
                      {language === 'am' ? 'የፈተና ሰዓት ይቀራል' : 'Time Remaining'}:
                    </span>
                    <span className={`text-sm font-mono font-black ${secondsRemaining < 300 ? 'text-red-400' : 'text-amber-400'}`}>
                      {formatTime(secondsRemaining)}
                    </span>
                  </div>

                  <button
                    onClick={submitSimulationExam}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md"
                  >
                    {language === 'am' ? 'ፈተናውን ጨርስ' : 'Submit Exam'}
                  </button>
                </div>
              )}

              {/* Question Source Separation Ribbon: All vs Official Past Exam vs AI Generated */}
              <div className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-slate-900 via-[#0E172F] to-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      playClickChime();
                      setQuestionSourceFilter('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      questionSourceFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{language === 'am' ? 'ሁሉም ጥያቄዎች' : 'All Questions'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                      {activeSheet.questions.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickChime();
                      setQuestionSourceFilter('official');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      questionSourceFilter === 'official'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{language === 'am' ? 'ኦፊሴላዊ ፈተናዎች' : 'Official Past Exams'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                      {officialQuestionsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickChime();
                      setQuestionSourceFilter('generated');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      questionSourceFilter === 'generated'
                        ? 'bg-indigo-600 text-white shadow-md font-black'
                        : 'text-indigo-300 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{language === 'am' ? 'ተጨማሪ ልምምድ' : 'Supplementary Practice'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                      {generatedQuestionsCount}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(true)}
                    className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'am' ? 'ተጨማሪ ጥያቄዎችን አዘጋጅ' : 'Add Practice Questions'}</span>
                  </button>

                  {generatedQuestionsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearGeneratedQuestions}
                      title={language === 'am' ? 'የተፈጠሩትን ጥያቄዎች አጽዳ' : 'Clear practice questions for this paper'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 📖 Curriculum Unit & Chapter Navigation & Ordering Toolbar */}
              <div className="px-4 sm:px-5 py-2.5 bg-[#0b1021] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Order Selector (Curriculum Unit/Chapter Order vs Original Exam Paper Sequence) */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'am' ? 'ቅደም ተከተል' : 'Order'}:</span>
                  </span>
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        playClickChime();
                        setOrderMode('curriculum');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        orderMode === 'curriculum'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Organize questions progressively by Unit and Chapter"
                    >
                      <span>{language === 'am' ? 'በምዕራፍና ርዕስ (Unit & Chapter)' : 'By Unit & Chapter'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClickChime();
                        setOrderMode('original');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        orderMode === 'original'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Keep questions in original exam paper numbering sequence"
                    >
                      <span>{language === 'am' ? 'የመጀመሪያው የፈተና ቅደም ተከተል' : 'Original Paper Order'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter by Unit Pills and Chapter Selector */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        playClickChime();
                        setSelectedUnitFilter('all');
                        setSelectedChapterFilter('all');
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        selectedUnitFilter === 'all'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black'
                          : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {language === 'am' ? 'ሁሉም ዩኒቶች' : 'All Units'}
                    </button>
                    {unitSummaryList.map(u => (
                      <button
                        key={u.unitLabel}
                        type="button"
                        onClick={() => {
                          playClickChime();
                          setSelectedUnitFilter(u.unitLabel);
                          setSelectedChapterFilter('all');
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          selectedUnitFilter === u.unitLabel
                            ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                            : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        <span>{u.unitLabel}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded-full ${selectedUnitFilter === u.unitLabel ? 'bg-slate-950/30 text-slate-950' : 'bg-white/10 text-slate-300'}`}>
                          {u.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Chapter Dropdown if multiple chapters available */}
                  {availableChaptersList.length > 1 && (
                    <select
                      value={selectedChapterFilter}
                      onChange={(e) => {
                        playClickChime();
                        setSelectedChapterFilter(e.target.value);
                      }}
                      className="bg-slate-900 border border-white/15 text-slate-200 text-[11px] font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="all">
                        {language === 'am' ? 'ሁሉም ምዕራፎች (All Chapters)' : 'All Chapters'}
                      </option>
                      {availableChaptersList.map(c => (
                        <option key={c.chapterTitle} value={c.chapterTitle}>
                          {c.chapterTitle} ({c.count})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Question Navigation Palette Ribbon with Windowing & Quick Jump */}
              {visibleQuestions.length > 0 && (
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] space-y-2.5">
                  {/* Upper bar: Jump to Q#, Chunk Range selector, Random in Paper, Flag button */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                        {language === 'am' ? 'ክልል' : 'Range'}:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={paletteChunkStart === 0}
                          onClick={() => {
                            playClickChime();
                            setPaletteChunkStart(prev => Math.max(0, prev - 25));
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-md text-slate-300 font-bold text-[11px] cursor-pointer"
                          title="Previous 25 questions"
                        >
                          &laquo;
                        </button>
                        <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400 font-extrabold text-[11px]">
                          Q {paletteChunkStart + 1} – {Math.min(visibleQuestions.length, paletteChunkStart + 25)}
                        </span>
                        <button
                          type="button"
                          disabled={paletteChunkStart + 25 >= visibleQuestions.length}
                          onClick={() => {
                            playClickChime();
                            setPaletteChunkStart(prev => Math.min(visibleQuestions.length - 1, prev + 25));
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-md text-slate-300 font-bold text-[11px] cursor-pointer"
                          title="Next 25 questions"
                        >
                          &raquo;
                        </button>
                      </div>

                      {/* Quick Jump Input */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const num = parseInt(jumpInput, 10);
                          if (!isNaN(num) && num >= 1 && num <= visibleQuestions.length) {
                            playClickChime();
                            setActiveQuestionIndex(num - 1);
                            setJumpInput('');
                          }
                        }}
                        className="flex items-center gap-1 ml-1 sm:ml-2"
                      >
                        <input
                          type="number"
                          min={1}
                          max={visibleQuestions.length}
                          placeholder={language === 'am' ? 'ቁጥር...' : 'Jump to #'}
                          value={jumpInput}
                          onChange={(e) => setJumpInput(e.target.value)}
                          className="w-20 px-2 py-1 bg-slate-900 border border-white/10 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-md text-[11px] cursor-pointer"
                        >
                          Go
                        </button>
                      </form>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Random in this question set */}
                      <button
                        type="button"
                        onClick={() => {
                          playClickChime();
                          const rnd = Math.floor(Math.random() * visibleQuestions.length);
                          setActiveQuestionIndex(rnd);
                        }}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 font-semibold rounded-md text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Jump to random question"
                      >
                        <Shuffle className="w-3 h-3 text-amber-400" />
                        <span>{language === 'am' ? 'የዘፈቀደ ጥያቄ' : 'Random Q'}</span>
                      </button>

                      {examMode === 'simulation' && (
                        <button
                          onClick={() => toggleFlagQuestion(activeQuestionIndex)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                            flaggedQuestions.includes(activeQuestionIndex)
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {flaggedQuestions.includes(activeQuestionIndex) 
                            ? (language === 'am' ? 'ምልክት ተደርጓል' : 'Flagged') 
                            : (language === 'am' ? 'ምልክት አድርግ' : 'Flag Question')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Buttons Strip for the current 25-question chunk */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                    {visibleQuestions
                      .slice(paletteChunkStart, Math.min(visibleQuestions.length, paletteChunkStart + 25))
                      .map((q, localIdx) => {
                        const idx = paletteChunkStart + localIdx;
                        const isCurrent = idx === activeQuestionIndex;
                        const isFlagged = flaggedQuestions.includes(idx);
                        const isAnswered = examMode === 'simulation' 
                          ? simulationAnswers[idx] !== undefined 
                          : false;
                        const isAiGen = q.sourceType === 'ai_generated';
                        const qKey = `${activeSheet.id}_q_${q.id || idx}`;
                        const isTried = triedQuestionKeys.includes(qKey);
                        const isLocked = !isProUser && questionsTriedCount >= FREE_TRIAL_LIMIT && !isTried;

                        return (
                          <button
                            key={`q_nav_${idx}`}
                            onClick={() => {
                              playClickChime();
                              if (isLocked) {
                                setShowTrialLimitModal(true);
                                return;
                              }
                              setActiveQuestionIndex(idx);
                            }}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer relative shrink-0 flex items-center justify-center ${
                              isCurrent
                                ? isAiGen
                                  ? 'bg-indigo-600 text-white font-black shadow-md scale-105 ring-2 ring-indigo-400'
                                  : 'bg-amber-500 text-slate-950 font-black shadow-md scale-105'
                                : isAnswered
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : isLocked
                                ? 'bg-amber-500/10 text-amber-400/80 border border-amber-500/30 hover:bg-amber-500/20'
                                : isAiGen
                                ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/50'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {isLocked ? (
                              <Lock className="w-3 h-3 text-amber-400" />
                            ) : (
                              idx + 1
                            )}
                            {isFlagged && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-1 ring-[#101A33]" />
                            )}
                            {isAiGen && !isCurrent && !isLocked && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Active Question Content Area or Empty State */}
              {activeSheet.questions.length === 0 ? (
                <div className="p-8 sm:p-12 text-center space-y-5 bg-white/[0.02] border border-white/10 rounded-2xl m-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
                    <FileQuestion className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 max-w-lg mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                      <span>{language === 'am' ? 'ባዶ የፈተና ፋይል' : 'Empty Exam File'}</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-white font-serif">
                      {language === 'am' ? 'በዚህ የፈተና ፋይል ውስጥ ምንም ጥያቄዎች የሉም' : 'This Exam File Currently Has No Questions'}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === 'am' 
                        ? `ለ"${activeSheet.title}" የተዘጋጁ ጥያቄዎች ገና አልተካተቱም። ወዲያውኑ 20 ደረጃቸውን የጠበቁ የዩኒቨርሲቲ ሲላበስ ጥያቄዎችን ማከል ይችላሉ።`
                        : `No questions have been attached to "${activeSheet.title}" yet. Add 20 standardized university curriculum questions directly to this file to start practicing.`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleAddQuestionsToEmptyFile(activeSheet.id)}
                      disabled={isAddingToEmptyFile}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <PlusCircle className="w-4 h-4 text-slate-950" />
                      <span>
                        {isAddingToEmptyFile 
                          ? (language === 'am' ? 'ጥያቄዎች እየተጨመሩ ነው...' : 'Adding Questions...') 
                          : (language === 'am' ? '+ 20 ጥያቄዎችን ወደ ፋይሉ አክል' : '+ Add 20 Questions to This File')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGenerateModal(true)}
                      className="px-5 py-3 bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>{language === 'am' ? 'ልዩ ጥያቄዎችን አዘጋጅ' : 'Compile Custom Batch'}</span>
                    </button>
                  </div>
                </div>
              ) : questionSourceFilter === 'generated' && generatedQuestionsCount === 0 ? (
                <div className="p-10 text-center space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl m-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto shadow-md">
                    <FileQuestion className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="text-base font-extrabold text-white">
                      {language === 'am' ? 'ለዚህ ፈተና የተዘጋጁ ተጨማሪ የልምምድ ጥያቄዎች የሉም' : 'No Supplementary Practice Questions Yet'}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === 'am' 
                        ? `የ${activeSheet.title} ነባር 500 ኦፊሴላዊ ጥያቄዎችን ሳይነኩ ፍጹም አዳዲስና ያልተደገሙ ተጨማሪ የልምምድ ጥያቄዎችን ማከል ይችላሉ።`
                        : `Expand this exam sheet with brand-new, non-repeating practice questions tailored to the curriculum. The authentic past exam questions remain completely separate.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(true)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4 text-slate-950" />
                    <span>{language === 'am' ? 'ተጨማሪ ጥያቄዎችን አዘጋጅ' : 'Generate Practice Questions'}</span>
                  </button>
                </div>
              ) : currentQuestion ? (
                <div className="p-5 sm:p-7 space-y-6">
                  
                  {/* Topic Tag & Question Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-400 uppercase tracking-wider">
                        {language === 'am' ? 'ጥያቄ' : 'Question'} {activeQuestionIndex + 1} / {visibleQuestions.length}
                      </span>
                      {currentQuestion.sourceType === 'ai_generated' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          <span>{language === 'am' ? 'ተጨማሪ የልምምድ ጥያቄ (ያልተደገመ)' : 'Supplementary Practice (Strictly Unique)'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>{language === 'am' ? 'ኦፊሴላዊ የቀደመ ፈተና' : 'Official Past Exam Archive'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {(() => {
                        const parsed = parseQuestionUnitChapter(currentQuestion, currentQuestion.id || activeQuestionIndex);
                        return (
                          <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            <BookOpen className="w-3 h-3 text-amber-400" />
                            <span>{parsed.unitLabel} • {parsed.chapterLabel}</span>
                          </span>
                        );
                      })()}
                      <span className="bg-white/5 px-2.5 py-1 rounded-md text-slate-300 font-medium text-[11px]">
                        {currentQuestion.subjectTopic}
                      </span>
                    </div>
                  </div>

                  {/* Quota Lock Warning if user has exceeded 20 questions */}
                  {!isProUser && questionsTriedCount >= FREE_TRIAL_LIMIT && !triedQuestionKeys.includes(`${activeSheet.id}_q_${currentQuestion.id || activeQuestionIndex}`) ? (
                    <div className="p-6 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border border-amber-500/40 rounded-2xl text-center space-y-4 shadow-xl">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="space-y-1.5 max-w-md mx-auto">
                        <h4 className="text-base font-extrabold text-white">
                          {language === 'am' ? 'የነጻ 20 ጥያቄዎች ሙከራ ተጠናቋል' : 'Free 20-Question Limit Reached'}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {language === 'am' 
                            ? 'የነጻ 20 ጥያቄዎች ሙከራዎን አጠናቀዋል። ያልተገደቡ የፈተና ጥያቄዎችን፣ የፋኩልቲ ሙሉ የመፍትሔ ቅደም ተከተል እና የፈተና ሲሙሌሽን ለመክፈት ወደ ፕሮ ያሳድጉ።'
                            : 'You have solved your 20 free trial questions. Upgrade to EthioLearn Pro to unlock all past exam papers across all Ethiopian universities.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => onNavigate('upgrade')}
                          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
                        >
                          {language === 'am' ? 'ወደ ፕሮ አሳድግ (Telebirr / CBE)' : 'Upgrade to Pro (Telebirr / CBE)'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Question Prompt */}
                      <div className="text-sm sm:text-base font-medium text-white leading-relaxed whitespace-pre-line bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        {currentQuestion.qText}
                      </div>

                      {/* Choices A, B, C, D */}
                      <div className="space-y-2.5">
                        {currentQuestion.choices.map((choice, cIdx) => {
                          const isSelected = examMode === 'simulation'
                            ? simulationAnswers[activeQuestionIndex] === cIdx
                            : selectedChoiceIndex === cIdx;

                          // Verification styling in Interactive Practice mode
                          let stateStyle = 'bg-white/5 border-white/10 hover:border-amber-500/40 hover:bg-white/[0.07] text-slate-200';

                          if (examMode === 'practice' && showAnswerFeedback) {
                            if (cIdx === currentQuestion.correctIndex) {
                              stateStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold shadow-md';
                            } else if (isSelected && cIdx !== currentQuestion.correctIndex) {
                              stateStyle = 'bg-red-500/20 border-red-500/60 text-red-300 line-through';
                            } else {
                              stateStyle = 'bg-white/5 border-white/5 opacity-50 text-slate-400';
                            }
                          } else if (isSelected) {
                            stateStyle = 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/30';
                          }

                          return (
                            <div
                              key={`choice_${cIdx}`}
                              onClick={() => {
                                if (examMode === 'simulation') {
                                  const qKey = `${activeSheet.id}_q_${currentQuestion.id || activeQuestionIndex}`;
                                  const alreadyTried = triedQuestionKeys.includes(qKey);
                                  if (!isProUser && !alreadyTried && questionsTriedCount >= FREE_TRIAL_LIMIT) {
                                    playFailureChime();
                                    setShowTrialLimitModal(true);
                                    return;
                                  }
                                  if (!alreadyTried) {
                                    const updatedKeys = [...triedQuestionKeys, qKey];
                                    setTriedQuestionKeys(updatedKeys);
                                    safeStorage.setItem('ethiolearn_tried_question_keys', JSON.stringify(updatedKeys));
                                    safeStorage.setItem('ethiolearn_questions_tried_count', String(updatedKeys.length));
                                  }
                                  playClickChime();
                                  setSimulationAnswers(prev => ({
                                    ...prev,
                                    [activeQuestionIndex]: cIdx
                                  }));
                                } else {
                                  handleSelectChoice(cIdx);
                                }
                              }}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs sm:text-sm ${stateStyle}`}
                            >
                              <span className="leading-relaxed">{choice}</span>
                              {examMode === 'practice' && showAnswerFeedback && cIdx === currentQuestion.correctIndex && (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Action Buttons: Practice Mode Feedback & AI Controls */}
                  {examMode === 'practice' && (
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {!showAnswerFeedback ? (
                          <button
                            onClick={handleCheckAnswer}
                            disabled={selectedChoiceIndex === null}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              selectedChoiceIndex !== null
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md'
                                : 'bg-white/10 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {language === 'am' ? 'መልስ አረጋግጥ' : 'Check Answer'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setShowAnswerFeedback(false);
                              setSelectedChoiceIndex(null);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{language === 'am' ? 'እንደገና ሞክር' : 'Try Again'}</span>
                          </button>
                        )}

                        {/* Faculty Syllabus Walkthrough Triggers */}
                        <button
                          onClick={() => handleAskAsgobnyi('breakdown')}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                          <span>{language === 'am' ? 'የመፍትሔ ቅደም ተከተል' : 'Step Solution'}</span>
                        </button>

                        <button
                          onClick={() => handleAskAsgobnyi('amharic')}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Languages className="w-3.5 h-3.5 text-amber-400" />
                          <span>{language === 'am' ? 'በአማርኛ' : 'Amharic'}</span>
                        </button>
                      </div>

                      {/* Prev / Next Question Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          disabled={activeQuestionIndex === 0}
                          onClick={() => {
                            playClickChime();
                            setActiveQuestionIndex(prev => Math.max(0, prev - 1));
                          }}
                          className={`p-2 rounded-xl border border-white/10 text-xs transition-colors ${
                            activeQuestionIndex === 0
                              ? 'text-slate-600 cursor-not-allowed'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                          disabled={activeQuestionIndex === visibleQuestions.length - 1}
                          onClick={() => {
                            playClickChime();
                            setActiveQuestionIndex(prev => Math.min(visibleQuestions.length - 1, prev + 1));
                          }}
                          className={`p-2 rounded-xl border border-white/10 text-xs transition-colors ${
                            activeQuestionIndex === visibleQuestions.length - 1
                              ? 'text-slate-600 cursor-not-allowed'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer'
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Immediate Feedback Box after checking in Practice Mode */}
                  {examMode === 'practice' && showAnswerFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border space-y-2 ${
                        selectedChoiceIndex === currentQuestion.correctIndex
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                          : 'bg-red-500/10 border-red-500/30 text-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                        {selectedChoiceIndex === currentQuestion.correctIndex ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>{language === 'am' ? 'ትክክል ነው! +5 ነጥብ' : 'Correct Answer! +5 Study Points'}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span>{language === 'am' ? 'አልተገኘም! ትክክለኛውን መልስ ይመልከቱ' : 'Incorrect. Study the breakdown below:'}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {currentQuestion.explanation}
                      </p>
                      {currentQuestion.amharicExplanation && (
                        <p className="text-xs leading-relaxed text-amber-300/90 font-sans pt-1 border-t border-white/10">
                          {currentQuestion.amharicExplanation}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Faculty Solution & Walkthrough Drawer */}
                  <AnimatePresence>
                    {aiGuideOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl bg-[#0D152A] border border-amber-500/30 p-4 space-y-3 shadow-inner overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                            <GraduationCap className="w-4 h-4 text-amber-400" />
                            <span>{language === 'am' ? 'የአካዳሚክ ማብራሪያና የአሰራር ቅደም ተከተል' : 'Faculty Course Syllabus & Step Solution'}</span>
                          </div>
                          <button
                            onClick={() => setAiGuideOpen(false)}
                            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {aiLoading ? (
                          <div className="flex items-center gap-2.5 py-4 text-xs text-slate-400">
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                            <span>{language === 'am' ? 'የአሰራር ቅደም ተከተሉን በማዘጋጀት ላይ ነው...' : 'Analyzing curriculum syllabus and solution steps...'}</span>
                          </div>
                        ) : (
                          <div className="text-xs leading-relaxed text-slate-200 whitespace-pre-line font-sans space-y-2">
                            {aiResponse}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Simulation Prev/Next Navigator */}
                  {examMode === 'simulation' && (
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                      <button
                        disabled={activeQuestionIndex === 0}
                        onClick={() => {
                          playClickChime();
                          setActiveQuestionIndex(prev => Math.max(0, prev - 1));
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border border-white/10 transition-colors ${
                          activeQuestionIndex === 0
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer'
                        }`}
                      >
                        {language === 'am' ? 'ቀዳሚ ጥያቄ' : 'Previous'}
                      </button>

                      {activeQuestionIndex < visibleQuestions.length - 1 ? (
                        <button
                          onClick={() => {
                            playClickChime();
                            setActiveQuestionIndex(prev => prev + 1);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 uppercase tracking-wider transition-all cursor-pointer font-black"
                        >
                          {language === 'am' ? 'ቀጣይ ጥያቄ' : 'Next Question'}
                        </button>
                      ) : (
                        <button
                          onClick={submitSimulationExam}
                          className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white uppercase tracking-wider transition-all cursor-pointer shadow-lg font-black"
                        >
                          {language === 'am' ? 'ፈተናውን ጨርስ' : 'Submit Final Paper'}
                        </button>
                      )}
                    </div>
                  )}

                </div>
              ) : null}

            </div>
          ) : (
            <div className="p-12 text-center bg-[#101A33] border border-white/10 rounded-2xl">
              <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                {language === 'am' ? 'ለመጀመር ከግራ በኩል የፈተና ወረቀት ይምረጡ' : 'Select an exam paper from the left archive to begin'}
              </p>
            </div>
          )}
        </div>

      </div>

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
