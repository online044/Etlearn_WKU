/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Official Ethiopian University Question Bank & Quiz Engine
 * Production-ready Question Bank System (10,000+ Questions Scale)
 * Zero Runtime AI overhead • Supabase Pre-Generated & Offline Cache • Practice & Exam Modes
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Plus, Play, RotateCcw, CheckCircle2, XCircle, 
  HelpCircle, Award, Star, ArrowLeft, Crown, Sparkles, 
  Trash2, Search, Filter, BookOpen, Layers, Check, X,
  Clock, Trophy, AlertCircle, Share2, Eye, Bookmark, BookmarkCheck,
  Flag, ChevronLeft, ChevronRight, Zap, BookMarked, SlidersHorizontal,
  GraduationCap, CheckSquare, Dna, Atom, FlaskConical, BrainCircuit,
  TrendingUp, Cpu, Lightbulb, Activity, Compass, Globe, Users,
  ShieldCheck, UserCheck, Code2, Calculator, Binary, PieChart,
  Languages, FileText, Sliders, LayoutGrid
} from 'lucide-react';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { 
  generateRandomExamQuestions,
  randomizeQuestionWithMappedAnswer,
  RandomizedQuizQuestion,
  recordQuestionProgress,
  fetchUserQuestionProgress,
  toggleQuestionBookmark,
  fetchUserBookmarkedQuestionIds,
  getCachedQuestions,
  OFFICIAL_19_SUBJECTS
} from '../utils/supabaseQuestions';
import { QuestionBankRecord } from '../types';
import { ManualDatabaseQuestion } from '../data/databaseQuestionBank';
import { 
  getAllDatabaseQuestions, 
  saveManualQuestionToDatabase, 
  deleteManualQuestionFromDatabase
} from '../utils/questionDatabase';

export interface FreshmanSubjectItem {
  id: string;
  name: string;
  amharicName: string;
  code: string;
  stream: 'common' | 'natural' | 'social';
  semester: 'Semester I' | 'Semester II';
  unitsCount: number;
  popularUnits: string[];
  icon: any;
  color: string;
}

export const FRESHMAN_SUBJECT_CATALOG: FreshmanSubjectItem[] = [
  {
    id: 'biology',
    name: 'General Biology',
    amharicName: 'አጠቃላይ ባዮሎጂ',
    code: 'Biol 1011',
    stream: 'natural',
    semester: 'Semester I',
    unitsCount: 5,
    popularUnits: ['Cell Biology', 'Metabolism & Respiration', 'Molecular Genetics', 'Principles of Ecology'],
    icon: Dna,
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'physics',
    name: 'General Physics',
    amharicName: 'አጠቃላይ ፊዚክስ',
    code: 'Phys 1011',
    stream: 'natural',
    semester: 'Semester I',
    unitsCount: 6,
    popularUnits: ['Vectors & Kinematics', 'Newton\'s Laws & Work', 'Rotational Dynamics', 'Fluid Mechanics', 'Thermodynamics'],
    icon: Atom,
    color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30'
  },
  {
    id: 'chemistry',
    name: 'General Chemistry',
    amharicName: 'አጠቃላይ ኬሚስትሪ',
    code: 'Chem 1011',
    stream: 'natural',
    semester: 'Semester I',
    unitsCount: 6,
    popularUnits: ['Atomic Structure & Periodicity', 'Chemical Bonding & VSEPR', 'States of Matter', 'Thermodynamics', 'Kinetics'],
    icon: FlaskConical,
    color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30'
  },
  {
    id: 'critical_thinking',
    name: 'Critical Thinking',
    amharicName: 'ስነ-አመክንዮ እና ሂሳዊ አስተሳሰብ',
    code: 'Phil 1011',
    stream: 'common',
    semester: 'Semester I',
    unitsCount: 5,
    popularUnits: ['Logic & Arguments', 'Deductive & Inductive', 'Informal Fallacies', 'Categorical Propositions', 'Truth Tables'],
    icon: BrainCircuit,
    color: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30'
  },
  {
    id: 'economics',
    name: 'Economics',
    amharicName: 'መግቢያ የኢኮኖሚክስ ትምህርት',
    code: 'Econ 1011',
    stream: 'common',
    semester: 'Semester I',
    unitsCount: 6,
    popularUnits: ['Scarcity & Choice', 'Demand & Supply', 'Elasticity', 'Consumer Utility', 'Production Costs', 'Macroeconomics'],
    icon: TrendingUp,
    color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30'
  },
  {
    id: 'emerging_tech',
    name: 'Emerging Technologies',
    amharicName: 'መግቢያ ወደ አዳዲስ ቴክኖሎጂዎች',
    code: 'EmTe 1012',
    stream: 'common',
    semester: 'Semester II',
    unitsCount: 5,
    popularUnits: ['4IR Overview', 'Data Science & Big Data', 'Artificial Intelligence', 'Internet of Things (IoT)', 'Cloud & Blockchain'],
    icon: Cpu,
    color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30'
  },
  {
    id: 'math_natural',
    name: 'Mathematics — Natural Science',
    amharicName: 'ሂሳብ ለተፈጥሮ ሳይንስ',
    code: 'Math 1011',
    stream: 'natural',
    semester: 'Semester I',
    unitsCount: 5,
    popularUnits: ['Propositional Logic', 'Relations & Functions', 'Analytic Geometry', 'Matrices & Determinants', 'Limits & Derivatives'],
    icon: Calculator,
    color: 'from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'math_applied',
    name: 'Applied Mathematics',
    amharicName: 'የተግባራዊ ሂሳብ ትምህርት',
    code: 'Math 1012',
    stream: 'natural',
    semester: 'Semester II',
    unitsCount: 5,
    popularUnits: ['Vector Calculus', 'Matrices & Eigenvalues', 'Integral Calculus', 'Sequences & Series', 'Differential Equations'],
    icon: Binary,
    color: 'from-teal-500/20 to-cyan-500/10 text-teal-400 border-teal-500/30'
  },
  {
    id: 'math_social',
    name: 'Mathematics — Social Science',
    amharicName: 'ሂሳብ ለማህበራዊ ሳይንስ',
    code: 'Math 1011S',
    stream: 'social',
    semester: 'Semester I',
    unitsCount: 5,
    popularUnits: ['Matrices & Systems', 'Linear Programming', 'Financial Mathematics', 'Probability & Statistics'],
    icon: PieChart,
    color: 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/30'
  },
  {
    id: 'entrepreneurship',
    name: 'Entrepreneurship',
    amharicName: 'ስራ ፈጠራ እና የንግድ ልማት',
    code: 'Mgmt 1012',
    stream: 'common',
    semester: 'Semester II',
    unitsCount: 5,
    popularUnits: ['Entrepreneurial Mindset', 'Opportunity Recognition', 'Business Planning', 'Marketing Strategies', 'Venture Financing'],
    icon: Lightbulb,
    color: 'from-yellow-500/20 to-amber-500/10 text-yellow-400 border-yellow-500/30'
  },
  {
    id: 'psychology',
    name: 'General Psychology',
    amharicName: 'አጠቃላይ ሳይኮሎጂ እና የህይወት ክህሎት',
    code: 'Pscy 1011',
    stream: 'common',
    semester: 'Semester I',
    unitsCount: 6,
    popularUnits: ['Biological Bases of Behavior', 'Sensation & Perception', 'Theories of Learning', 'Memory & Forgetting', 'Emotion & Life Skills'],
    icon: Activity,
    color: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/30'
  },
  {
    id: 'geography',
    name: 'Geography of Ethiopia and the Horn',
    amharicName: 'የኢትዮጵያና የአፍሪካ ቀንድ ጂኦግራፊ',
    code: 'GeES 1011',
    stream: 'common',
    semester: 'Semester I',
    unitsCount: 6,
    popularUnits: ['Geographic Setting', 'Geology & Topography', 'Drainage Systems', 'Climate & Zones', 'Natural Resources', 'Population Demography'],
    icon: Compass,
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'history',
    name: 'History of Ethiopia and the Horn',
    amharicName: 'የኢትዮጵያ እና የቀንዱ ታሪክ',
    code: 'Hist 1012',
    stream: 'social',
    semester: 'Semester II',
    unitsCount: 6,
    popularUnits: ['Peoples & Cultures', 'Ancient States', 'Medieval Ethiopia', 'State Formation', 'Ethio-Italian Wars', 'Modern Transformations'],
    icon: BookOpen,
    color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30'
  },
  {
    id: 'english1',
    name: 'Communicative English Skills I',
    amharicName: 'የእንግሊዝኛ መግባቢያ ክህሎት I',
    code: 'EnLa 1011',
    stream: 'common',
    semester: 'Semester I',
    unitsCount: 6,
    popularUnits: ['Study Reading', 'Grammar in Context', 'Vocabulary Building', 'Sentence Construction', 'Paragraph Development'],
    icon: Languages,
    color: 'from-indigo-500/20 to-blue-500/10 text-indigo-400 border-indigo-500/30'
  },
  {
    id: 'english2',
    name: 'Communicative English Skills II',
    amharicName: 'የእንግሊዝኛ መግባቢያ ክህሎት II',
    code: 'EnLa 1012',
    stream: 'common',
    semester: 'Semester II',
    unitsCount: 6,
    popularUnits: ['Advanced Reading', 'Syntax & Cohesion', 'Expository Essay Writing', 'Academic Oral Presentation'],
    icon: FileText,
    color: 'from-indigo-500/20 to-blue-500/10 text-indigo-400 border-indigo-500/30'
  },
  {
    id: 'global_trends',
    name: 'Global Trends',
    amharicName: 'አለም አቀፍ አዝማሚያዎች',
    code: 'GlTr 1012',
    stream: 'common',
    semester: 'Semester II',
    unitsCount: 5,
    popularUnits: ['Theories of IR', 'Globalization Dynamics', 'Global Political Economy', 'Regionalism in Africa', 'Global Security Issues'],
    icon: Globe,
    color: 'from-sky-500/20 to-cyan-500/10 text-sky-400 border-sky-500/30'
  },
  {
    id: 'inclusiveness',
    name: 'Inclusiveness',
    amharicName: 'አካታችነት',
    code: 'Incl 1012',
    stream: 'common',
    semester: 'Semester II',
    unitsCount: 5,
    popularUnits: ['Understanding Impairment', 'Human Rights Approach', 'Universal Design', 'Inclusive Education & Livelihood'],
    icon: Users,
    color: 'from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'civics',
    name: 'Moral and Civics Education',
    amharicName: 'ስነ-ምግባር እና ዜግነት ትምህርት',
    code: 'MCED 1012',
    stream: 'common',
    semester: 'Semester II',
    unitsCount: 5,
    popularUnits: ['Ethics & Moral Philosophy', 'Constitutionalism', 'Democracy & Governance', 'Citizenship & Human Rights'],
    icon: ShieldCheck,
    color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30'
  },
  {
    id: 'anthropology',
    name: 'Social Anthropology',
    amharicName: 'ማህበራዊ አንትሮፖሎጂ',
    code: 'Anth 1012',
    stream: 'social',
    semester: 'Semester II',
    unitsCount: 5,
    popularUnits: ['Concept of Culture', 'Human Evolution & Diversity', 'Kinship, Family & Marriage', 'Traditional Institutions in Ethiopia'],
    icon: UserCheck,
    color: 'from-purple-500/20 to-violet-500/10 text-purple-400 border-purple-500/30'
  },
  {
    id: 'programming',
    name: 'Computer Programming & CS',
    amharicName: 'ኮምፒውተር ፕሮግራሚንግ',
    code: 'CoSc 1012',
    stream: 'natural',
    semester: 'Semester II',
    unitsCount: 5,
    popularUnits: ['Computer Fundamentals', 'Algorithms & Problem Solving', 'C++ Syntax & Control Flow', 'Functions & Arrays', 'Pointers & I/O'],
    icon: Code2,
    color: 'from-cyan-500/20 to-teal-500/10 text-cyan-400 border-cyan-500/30'
  }
];

interface ExamPrepProps {
  apiKey?: string;
  enrolledSubjects?: string[];
  onStudyAction?: () => void;
  onNavigateBack?: () => void;
  isPro?: boolean;
  onNavigateToUpgrade?: () => void;
  userId?: string;
}

export default function ExamPrep({ 
  onStudyAction,
  onNavigateBack,
  isPro = false,
  onNavigateToUpgrade,
  userId = 'guest_student'
}: ExamPrepProps) {
  // Bilingual support
  const [language, setLanguage] = useState<'en' | 'am'>(() => {
    const saved = safeStorage.getItem('ethiolearn_language_preference');
    return (saved === 'am' || saved === 'en') ? saved : 'en';
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'quiz_launcher' | 'bookmarked' | 'database_manager'>('quiz_launcher');

  // Master questions repository in state
  const [allQuestions, setAllQuestions] = useState<QuestionBankRecord[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // ─── QUIZ GENERATOR CONFIGURATION STATE ───
  const [selectedSubject, setSelectedSubject] = useState<string>("General Biology");
  const [selectedUnit, setSelectedUnit] = useState<string>("All Units");
  const [selectedTopic, setSelectedTopic] = useState<string>("All Topics");
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [quizMode, setQuizMode] = useState<'practice' | 'exam'>('practice');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // ─── UNI-EXAM STYLE BROWSER FILTERS ───
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [streamFilter, setStreamFilter] = useState<'all' | 'common' | 'natural' | 'social' | 'bookmarked'>('all');
  const [launcherSubTab, setLauncherSubTab] = useState<'browse' | 'custom'>('browse');

  // ─── ACTIVE QUIZ RUNTIME STATE ───
  const [quizState, setQuizState] = useState<'config' | 'active' | 'results' | 'review'>('config');
  const [activeQuestions, setActiveQuestions] = useState<RandomizedQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [index: number]: 'A' | 'B' | 'C' | 'D' }>({});
  const [userAnswerTexts, setUserAnswerTexts] = useState<{ [index: number]: string }>({});
  const [flaggedIndices, setFlaggedIndices] = useState<Set<number>>(new Set());
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState<boolean>(false);

  // ─── EXAM TIMER STATE ───
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // in seconds
  const [totalExamTime, setTotalExamTime] = useState<number>(600);
  const [examStartTimestamp, setExamStartTimestamp] = useState<number>(0);
  const examTimerRef = useRef<any>(null);

  // ─── RESULTS & CELEBRATION ───
  const [quizScore, setQuizScore] = useState<{ correct: number; wrong: number; total: number; percentage: number; timeSpentSeconds: number }>({
    correct: 0,
    wrong: 0,
    total: 0,
    percentage: 0,
    timeSpentSeconds: 0
  });
  const [performanceRating, setPerformanceRating] = useState<string>('Good');
  const [particles, setParticles] = useState<{ id: number; left: number; top: number; color: string; size: number }[]>([]);

  // ─── DATABASE MANAGER STATE (Manual question addition & testing) ───
  const [dbSearch, setDbSearch] = useState<string>('');
  const [dbSubjectFilter, setDbSubjectFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [formSubject, setFormSubject] = useState<string>("Critical Thinking");
  const [formUnit, setFormUnit] = useState<string>("Unit 1");
  const [formTopic, setFormTopic] = useState<string>("Introduction");
  const [formQuestionText, setFormQuestionText] = useState<string>("");
  const [formOptionA, setFormOptionA] = useState<string>("");
  const [formOptionB, setFormOptionB] = useState<string>("");
  const [formOptionC, setFormOptionC] = useState<string>("");
  const [formOptionD, setFormOptionD] = useState<string>("");
  const [formCorrectOption, setFormCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formExplanation, setFormExplanation] = useState<string>("");
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [formSource, setFormSource] = useState<string>("Curriculum Module");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ─── LOAD QUESTIONS & BOOKMARKS ON MOUNT ───
  const loadQuestionRepository = async () => {
    setLoadingQuestions(true);
    try {
      const cached = getCachedQuestions();
      setAllQuestions(cached);

      // Load bookmarks
      const bms = await fetchUserBookmarkedQuestionIds(userId);
      setBookmarkedIds(new Set(bms));
    } catch (e) {
      console.warn('[ExamPrep] Failed to load repository:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadQuestionRepository();
  }, [userId]);

  // Derived subject list from 19 standard subjects + any additional courses
  const subjectList = useMemo(() => {
    const list = OFFICIAL_19_SUBJECTS.map(s => s.name);
    return ['All First-Year Subjects (Comprehensive Mixed)', ...list];
  }, []);

  // Compute available units for the selected subject
  const availableUnits = useMemo(() => {
    if (selectedSubject.startsWith('All First-Year')) {
      return ['All Units'];
    }
    const unitsSet = new Set<string>();
    allQuestions.forEach(q => {
      if (q.subject.toLowerCase() === selectedSubject.toLowerCase() && q.unit) {
        unitsSet.add(q.unit);
      }
    });
    return ['All Units', ...Array.from(unitsSet).sort()];
  }, [selectedSubject, allQuestions]);

  // Compute available topics for the selected subject and unit
  const availableTopics = useMemo(() => {
    if (selectedSubject.startsWith('All First-Year')) {
      return ['All Topics'];
    }
    const topicsSet = new Set<string>();
    allQuestions.forEach(q => {
      const matchSub = q.subject.toLowerCase() === selectedSubject.toLowerCase();
      const matchUnit = selectedUnit === 'All Units' || q.unit === selectedUnit;
      if (matchSub && matchUnit && q.topic) {
        topicsSet.add(q.topic);
      }
    });
    return ['All Topics', ...Array.from(topicsSet).sort()];
  }, [selectedSubject, selectedUnit, allQuestions]);

  // Available questions count for current filter
  const matchingQuestionsCount = useMemo(() => {
    if (selectedSubject.startsWith('All First-Year')) {
      return allQuestions.filter(q => q.is_published).length;
    }
    return allQuestions.filter(q => {
      if (!q.is_published) return false;
      const subMatch = q.subject.toLowerCase().includes(selectedSubject.toLowerCase()) || 
                       selectedSubject.toLowerCase().includes(q.subject.toLowerCase());
      if (!subMatch) return false;
      if (selectedUnit !== 'All Units' && q.unit !== selectedUnit) return false;
      if (selectedTopic !== 'All Topics' && q.topic !== selectedTopic) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
      return true;
    }).length;
  }, [selectedSubject, selectedUnit, selectedTopic, selectedDifficulty, allQuestions]);

  // Celebration Dopamine Effect
  const triggerDopaminePop = () => {
    const newParticles = Array.from({ length: 24 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 80 + 10,
      top: Math.random() * 60 + 20,
      color: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EAB308'][Math.floor(Math.random() * 6)],
      size: Math.random() * 10 + 4
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2500);
  };

  // ─── START QUIZ ENGINE (0 RUNTIME AI CALLS) ───
  const handleStartQuiz = async (customSubject?: string) => {
    const targetSubject = customSubject || selectedSubject;
    playClickChime();

    try {
      const isComprehensive = targetSubject.startsWith('All First-Year');
      const candidates = await generateRandomExamQuestions({
        subject: isComprehensive ? undefined : targetSubject,
        unit: selectedUnit !== 'All Units' ? selectedUnit : undefined,
        topic: selectedTopic !== 'All Topics' ? selectedTopic : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        totalQuestions: Math.max(questionCount, 5)
      });

      if (!candidates || candidates.length === 0) {
        alert(language === 'en' 
          ? `No questions found for ${targetSubject}. Please try another subject or add questions in Manage DB.` 
          : `ለ ${targetSubject} ምንም ጥያቄ አልተገኘም። እባክዎን ሌላ ይምረጡ ወይም አዲስ ጥያቄ ያክሉ።`
        );
        return;
      }

      // Pro Access Check if Pro questions requested
      let questionsToUse = candidates;
      if (!isPro) {
        const hasProQuestions = candidates.some(c => c.is_pro);
        if (hasProQuestions) {
          const freeCandidates = candidates.filter(c => !c.is_pro);
          if (freeCandidates.length < 3) {
            onNavigateToUpgrade?.();
            return;
          }
          questionsToUse = freeCandidates;
        }
      }

      // Randomize option order and safely map correct answer without permanent DB mutation
      const randomizedItems: RandomizedQuizQuestion[] = questionsToUse.map(randomizeQuestionWithMappedAnswer);

      setActiveQuestions(randomizedItems);
      setCurrentIndex(0);
      setUserAnswers({});
      setUserAnswerTexts({});
      setFlaggedIndices(new Set());
      setIsAnswerRevealed(false);

      // Setup Timer for Exam Mode (1.2 minutes per question)
      const allocatedSeconds = quizMode === 'exam' ? Math.max(randomizedItems.length * 72, 300) : 0;
      setTimeRemaining(allocatedSeconds);
      setTotalExamTime(allocatedSeconds);
      setExamStartTimestamp(Date.now());

      if (quizMode === 'exam') {
        clearInterval(examTimerRef.current);
        examTimerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(examTimerRef.current);
              handleFinishQuizAuto();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      setQuizState('active');
      playSuccessChime();
    } catch (e) {
      console.warn('[Quiz Launch Error]:', e);
      alert('Failed to launch quiz from question bank.');
    }
  };

  // ─── UNI-EXAM STYLE INSTANT COURSE LAUNCHER ───
  const handleQuickStartCourse = async (
    courseName: string, 
    unitName?: string, 
    mode: 'practice' | 'exam' = 'practice',
    count: number = 10
  ) => {
    setSelectedSubject(courseName);
    if (unitName && unitName !== 'All Units') {
      setSelectedUnit(unitName);
    } else {
      setSelectedUnit('All Units');
    }
    setSelectedTopic('All Topics');
    setQuizMode(mode);
    setQuestionCount(count);
    playClickChime();

    try {
      let candidates = await generateRandomExamQuestions({
        subject: courseName,
        unit: unitName && unitName !== 'All Units' ? unitName : undefined,
        totalQuestions: count
      });

      if (!candidates || candidates.length === 0) {
        candidates = await generateRandomExamQuestions({
          subject: courseName,
          totalQuestions: count
        });
      }

      if (!candidates || candidates.length === 0) {
        alert(language === 'en' 
          ? `No questions currently found for ${courseName}. Try another course or build custom questions in Manage DB.` 
          : `ለ ${courseName} ምንም ጥያቄ አልተገኘም። እባክዎን ሌላ ይምረጡ።`
        );
        return;
      }

      let questionsToUse = candidates;
      if (!isPro) {
        const freeCandidates = candidates.filter(c => !c.is_pro);
        if (freeCandidates.length >= 3) {
          questionsToUse = freeCandidates;
        }
      }

      const randomizedItems: RandomizedQuizQuestion[] = questionsToUse.map(randomizeQuestionWithMappedAnswer);

      setActiveQuestions(randomizedItems);
      setCurrentIndex(0);
      setUserAnswers({});
      setUserAnswerTexts({});
      setFlaggedIndices(new Set());
      setIsAnswerRevealed(false);

      const allocatedSeconds = mode === 'exam' ? Math.max(randomizedItems.length * 72, 300) : 0;
      setTimeRemaining(allocatedSeconds);
      setTotalExamTime(allocatedSeconds);
      setExamStartTimestamp(Date.now());

      if (mode === 'exam') {
        clearInterval(examTimerRef.current);
        examTimerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(examTimerRef.current);
              handleFinishQuizAuto();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      setQuizState('active');
      playSuccessChime();
    } catch (e: any) {
      console.warn('[Quick Start Error]:', e);
      alert('Failed to launch quiz: ' + (e?.message || 'Network error'));
    }
  };

  // Bookmarked questions list
  const bookmarkedQuestionsList = useMemo(() => {
    return allQuestions.filter(q => bookmarkedIds.has(q.id));
  }, [allQuestions, bookmarkedIds]);

  // Pre-calculate count of questions per course
  const courseQuestionCountMap = useMemo(() => {
    const map = new Map<string, number>();
    allQuestions.forEach(q => {
      const s = (q.subject || '').toLowerCase().trim();
      map.set(s, (map.get(s) || 0) + 1);
    });
    return map;
  }, [allQuestions]);

  // Filtered Course Catalog matching Uni-Exam browse system
  const filteredCatalog = useMemo(() => {
    return FRESHMAN_SUBJECT_CATALOG.filter(sub => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = sub.name.toLowerCase().includes(q);
        const matchesAmharic = sub.amharicName.toLowerCase().includes(q);
        const matchesCode = sub.code.toLowerCase().includes(q);
        const matchesUnits = sub.popularUnits.some(u => u.toLowerCase().includes(q));
        if (!matchesName && !matchesAmharic && !matchesCode && !matchesUnits) return false;
      }

      if (streamFilter === 'common') return sub.stream === 'common';
      if (streamFilter === 'natural') return sub.stream === 'natural';
      if (streamFilter === 'social') return sub.stream === 'social';
      if (streamFilter === 'bookmarked') {
        return bookmarkedQuestionsList.some(q => q.subject.toLowerCase().includes(sub.name.toLowerCase()));
      }

      return true;
    });
  }, [searchQuery, streamFilter, bookmarkedQuestionsList]);

  // ─── BOOKMARK TOGGLE ───
  const handleToggleBookmark = async (questionId: string) => {
    playClickChime();
    const isNow = await toggleQuestionBookmark(userId, questionId);
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (isNow) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  };

  // ─── ANSWER SELECTION ───
  const handleSelectAnswer = (optionId: 'A' | 'B' | 'C' | 'D', optionText: string) => {
    if (quizMode === 'practice' && isAnswerRevealed) return;

    setUserAnswers(prev => ({ ...prev, [currentIndex]: optionId }));
    setUserAnswerTexts(prev => ({ ...prev, [currentIndex]: optionText }));

    const currentQ = activeQuestions[currentIndex];
    const isCorrect = optionId === currentQ.correct_answer_id;

    // Track progress in background
    recordQuestionProgress(userId, currentQ.originalId, isCorrect, optionId);

    if (quizMode === 'practice') {
      setIsAnswerRevealed(true);
      if (isCorrect) {
        playSuccessChime();
        triggerDopaminePop();
      } else {
        playFailureChime();
      }
    } else {
      playClickChime();
    }

    onStudyAction?.();
  };

  // ─── QUESTION NAVIGATION ───
  const handleNext = () => {
    playClickChime();
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswerRevealed(false);
    } else {
      handleFinishQuiz();
    }
  };

  const handlePrev = () => {
    playClickChime();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsAnswerRevealed(Boolean(userAnswers[currentIndex - 1]));
    }
  };

  const handleToggleFlag = () => {
    playClickChime();
    setFlaggedIndices(prev => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  };

  // ─── QUIZ COMPLETION & SCORING ───
  const handleFinishQuiz = () => {
    clearInterval(examTimerRef.current);
    calculateAndShowScore();
  };

  const handleFinishQuizAuto = () => {
    calculateAndShowScore();
  };

  const calculateAndShowScore = () => {
    let correct = 0;
    let wrong = 0;

    activeQuestions.forEach((q, idx) => {
      const chosen = userAnswers[idx];
      if (chosen === q.correct_answer_id) {
        correct++;
      } else {
        wrong++;
      }
    });

    const total = activeQuestions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - examStartTimestamp) / 1000));

    // Performance rating
    let rating = 'Good';
    if (percentage >= 85) rating = 'Excellent (A+)';
    else if (percentage >= 75) rating = 'Very Good (A)';
    else if (percentage >= 65) rating = 'Good (B)';
    else if (percentage >= 50) rating = 'Satisfactory (C)';
    else rating = 'Needs Improvement';

    setQuizScore({
      correct,
      wrong,
      total,
      percentage,
      timeSpentSeconds
    });
    setPerformanceRating(rating);
    setQuizState('results');

    if (percentage >= 65) {
      playSuccessChime();
      triggerDopaminePop();
    } else {
      playFailureChime();
    }
  };

  // ─── ADD MANUAL QUESTION TO DATABASE ───
  const handleAddManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestionText.trim() || !formOptionA.trim() || !formOptionB.trim()) {
      alert('Question text and at least options A and B are required.');
      return;
    }

    setIsSubmitting(true);
    playClickChime();

    const optionsList: [string, string, string, string] = [
      formOptionA.trim(),
      formOptionB.trim(),
      formOptionC.trim() || 'None',
      formOptionD.trim() || 'All of the above'
    ];

    const correctTextMap: Record<'A' | 'B' | 'C' | 'D', string> = {
      'A': formOptionA.trim(),
      'B': formOptionB.trim(),
      'C': formOptionC.trim() || 'None',
      'D': formOptionD.trim() || 'All of the above'
    };

    const newQuestion: ManualDatabaseQuestion = {
      id: `manual_db_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subject: formSubject,
      questionText: formQuestionText.trim(),
      options: optionsList,
      correctAnswer: correctTextMap[formCorrectOption],
      correctOption: formCorrectOption,
      explanation: formExplanation.trim() || 'Verified university curriculum module concept.',
      topic: formTopic.trim() || 'General Concepts',
      unit: formUnit.trim() || 'Unit 1',
      difficulty: formDifficulty,
      createdAt: new Date().toISOString(),
      source: 'manual'
    };

    try {
      await saveManualQuestionToDatabase(newQuestion);
      await loadQuestionRepository();
      setShowAddModal(false);
      setFormQuestionText('');
      setFormOptionA('');
      setFormOptionB('');
      setFormOptionC('');
      setFormOptionD('');
      setFormExplanation('');
      playSuccessChime();
    } catch (e) {
      console.warn('[Save Question Error]:', e);
      alert('Failed to save question to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time remaining MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─── DOPAMINE POP PARTICLES ─── */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
          animate={{ opacity: 0, scale: 1.8, x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="fixed pointer-events-none rounded-full z-50 shadow-lg"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`
          }}
        />
      ))}

      {/* ─── TOP BRAND & NAVIGATION BAR ─── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                University Question Bank & Quizzes
                <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {allQuestions.length} Questions
                </span>
              </h1>
              {isPro && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm">
                  <Crown className="w-3 h-3" /> PRO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              100% Pre-Generated Database &bull; Zero AI Latency &bull; Authentic Ethiopian University Curriculum
            </p>
          </div>
        </div>

        {/* Tab Switcher & Language */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => { playClickChime(); setActiveTab('quiz_launcher'); setQuizState('config'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'quiz_launcher' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Quiz Launcher
            </button>
            <button
              onClick={() => { playClickChime(); setActiveTab('bookmarked'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bookmarked' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3 h-3" />
              <span>Saved ({bookmarkedIds.size})</span>
            </button>
            <button
              onClick={() => { playClickChime(); setActiveTab('database_manager'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'database_manager' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>Manage DB</span>
            </button>
          </div>

          <button
            onClick={() => {
              playClickChime();
              const next = language === 'en' ? 'am' : 'en';
              setLanguage(next);
              safeStorage.setItem('ethiolearn_language_preference', next);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            {language === 'en' ? '🇬🇧 EN' : '🇪🇹 AM'}
          </button>
        </div>
      </header>

      {/* ─── TAB 1: QUIZ LAUNCHER & ACTIVE QUIZ FLOW ─── */}
      {activeTab === 'quiz_launcher' && (
        <>
          {/* ================================================================ */}
          {/* 1. QUIZ CONFIGURATION / GENERATOR SCREEN (UNIEXAM STYLE BROWSER) */}
          {/* ================================================================ */}
          {quizState === 'config' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Top UniExam-Style Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl">
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setLauncherSubTab('browse'); }}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      launcherSubTab === 'browse'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{language === 'am' ? 'የትምህርት ካታሎግ' : 'Course Catalog'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setLauncherSubTab('custom'); }}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      launcherSubTab === 'custom'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{language === 'am' ? 'ብጁ ፈተና አመንጪ' : 'Custom Quiz Builder'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono font-bold text-amber-400">{allQuestions.length} Questions</span>
                  <span>&bull;</span>
                  <span>19 Freshman Courses</span>
                </div>
              </div>

              {/* VIEW A: UNIEXAM-STYLE COURSE BROWSER & INSTANT QUIZZES */}
              {launcherSubTab === 'browse' && (
                <div className="space-y-5">
                  {/* Search Bar & Stream Filters */}
                  <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-3.5">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={language === 'am' ? 'የትምህርት ስም፣ ምዕራፍ፣ ወይም ኮድ ይፈልጉ (ምሳሌ፦ Biology, Math, Logic...)' : 'Search 19 freshman courses, units, or codes (e.g. Biology, Math 1011, Logic)...'}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Stream Filter Pills */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { id: 'all', label: language === 'am' ? 'ሁሉም (19)' : 'All Courses (19)' },
                          { id: 'common', label: language === 'am' ? 'የጋራ ትምህርቶች' : 'Common Courses' },
                          { id: 'natural', label: language === 'am' ? 'ተፈጥሮ ሳይንስ' : 'Natural Science' },
                          { id: 'social', label: language === 'am' ? 'ማህበራዊ ሳይንስ' : 'Social Science' },
                        ].map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => { playClickChime(); setStreamFilter(st.id as any); }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              streamFilter === st.id
                                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickStartCourse('Critical Thinking', undefined, 'practice', 10)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{language === 'am' ? 'ፈጣን ድብልቅ ልምምድ (10 ጥያቄዎች)' : 'Surprise Mixed Drill (10 Qs)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Course Cards Grid */}
                  {filteredCatalog.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                      <Search className="w-8 h-8 text-slate-500 mx-auto" />
                      <h3 className="text-sm font-bold text-white">
                        {language === 'am' ? 'ምንም የሚመሳሰል ትምህርት አልተገኘም' : 'No matching university courses found'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setStreamFilter('all'); }}
                        className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                      >
                        {language === 'am' ? 'ሁሉንም አሳይ' : 'Reset Search & Show All'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCatalog.map(sub => {
                        const IconComponent = sub.icon || BookOpen;
                        const qCount = courseQuestionCountMap.get(sub.name.toLowerCase()) || sub.unitsCount * 15;

                        return (
                          <div
                            key={sub.id}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-4 sm:p-5 transition-all flex flex-col justify-between gap-4 text-left group hover:shadow-xl hover:shadow-black/40"
                          >
                            <div className="space-y-3">
                              {/* Card Header: Code, Stream & Semester */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${sub.color}`}>
                                    <IconComponent className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="font-mono text-xs font-black text-amber-400">
                                      {sub.code}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block font-medium">
                                      {sub.semester}
                                    </span>
                                  </div>
                                </div>

                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  sub.stream === 'natural' 
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                                    : sub.stream === 'social'
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                }`}>
                                  {sub.stream}
                                </span>
                              </div>

                              {/* Title */}
                              <div>
                                <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors leading-tight">
                                  {sub.name}
                                </h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                  {sub.amharicName}
                                </p>
                              </div>

                              {/* Questions badge & Unit Count */}
                              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                                <span className="font-mono font-bold text-slate-300">
                                  {qCount}+ Questions Available
                                </span>
                                <span>{sub.unitsCount} Units</span>
                              </div>

                              {/* Clickable Unit Pills: 1-Tap Practice */}
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  {language === 'am' ? 'በምዕራፍ አጥና (1-ጠቅታ):' : 'Drill by Unit (1-Tap):'}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {Array.from({ length: sub.unitsCount }).map((_, uIdx) => {
                                    const uName = `Unit ${uIdx + 1}`;
                                    const topicName = sub.popularUnits[uIdx] || uName;
                                    return (
                                      <button
                                        key={uName}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickStartCourse(sub.name, uName, 'practice', 10);
                                        }}
                                        className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-amber-500 hover:text-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                                        title={`Practice ${uName}: ${topicName}`}
                                      >
                                        U{uIdx + 1}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons Row */}
                            <div className="space-y-2 pt-2 border-t border-slate-800/80">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleQuickStartCourse(sub.name, undefined, 'practice', 10)}
                                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-98"
                                >
                                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                                  <span>{language === 'am' ? 'ልምምድ (10)' : 'Practice (10)'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickStartCourse(sub.name, undefined, 'exam', 20)}
                                  className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                                >
                                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{language === 'am' ? 'ፈተና (20)' : 'Exam (20)'}</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSubject(sub.name);
                                  setSelectedUnit('All Units');
                                  setLauncherSubTab('custom');
                                }}
                                className="w-full py-1.5 text-[11px] text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1 transition-colors cursor-pointer font-medium"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                                <span>{language === 'am' ? 'ብጁ ፈተና አመንጪ ክፈት' : 'Configure Custom Settings'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW B: CUSTOM QUIZ BUILDER (Advanced Dropdowns & Options) */}
              {launcherSubTab === 'custom' && (
                <div className="space-y-6">
                  {/* Back to course catalog banner */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => { playClickChime(); setLauncherSubTab('browse'); }}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{language === 'am' ? 'ወደ ካታሎግ ተመለስ' : 'Back to Course Catalog'}</span>
                    </button>
                    <span className="text-xs text-slate-400">
                      Fine-grained subject, unit, and difficulty constraints
                    </span>
                  </div>

                  {/* Quiz Setup Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Subject, Unit, Topic Selectors */}
                    <div className="lg:col-span-2 space-y-5 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-amber-400" />
                          1. Select Course & Topic
                        </h3>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {matchingQuestionsCount} Questions Available
                        </span>
                      </div>

                      {/* Subject Dropdown */}
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1.5">
                          Academic Subject
                        </label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => {
                            setSelectedSubject(e.target.value);
                            setSelectedUnit('All Units');
                            setSelectedTopic('All Topics');
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-amber-500 transition-colors"
                        >
                          {subjectList.map((sub, i) => (
                            <option key={i} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>

                      {/* Unit & Topic Dropdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1.5">
                            Module Unit / Chapter
                          </label>
                          <select
                            value={selectedUnit}
                            onChange={(e) => {
                              setSelectedUnit(e.target.value);
                              setSelectedTopic('All Topics');
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 transition-colors"
                          >
                            {availableUnits.map((u, i) => (
                              <option key={i} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1.5">
                            Specific Topic
                          </label>
                          <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 transition-colors"
                          >
                            {availableTopics.map((t, i) => (
                              <option key={i} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Quick Subject Chips */}
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-2">
                          Popular Freshman Modules:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Critical Thinking",
                            "General Biology",
                            "General Physics",
                            "General Chemistry",
                            "Economics",
                            "Emerging Technologies",
                            "Mathematics — Natural Science",
                            "History of Ethiopia and the Horn"
                          ].map((subName) => (
                            <button
                              key={subName}
                              type="button"
                              onClick={() => {
                                setSelectedSubject(subName);
                                setSelectedUnit('All Units');
                                setSelectedTopic('All Topics');
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                selectedSubject === subName
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                              }`}
                            >
                              {subName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Col: Mode, Count & Launch */}
                    <div className="space-y-5 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="border-b border-slate-800/80 pb-3">
                          <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                            2. Quiz Mode & Constraints
                          </h3>
                        </div>

                        {/* Mode Toggle: Practice vs Exam */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1.5">
                            Simulation Mode
                          </label>
                          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
                            <button
                              type="button"
                              onClick={() => setQuizMode('practice')}
                              className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                                quizMode === 'practice'
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Practice Mode</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuizMode('exam')}
                              className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                                quizMode === 'exam'
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Exam Mode</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {quizMode === 'practice' 
                              ? 'Immediate feedback & explanations after each answer.' 
                              : 'Strict countdown timer & full exam submission at the end.'}
                          </p>
                        </div>

                        {/* Number of Questions */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1.5">
                            Question Count
                          </label>
                          <div className="grid grid-cols-4 gap-1.5 min-[360px]:gap-2">
                            {[5, 10, 20, 50].map(cnt => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setQuestionCount(cnt)}
                                className={`py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                                  questionCount === cnt
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {cnt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Difficulty Selection */}
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1.5">
                            Difficulty Level
                          </label>
                          <div className="grid grid-cols-4 gap-1.5 min-[360px]:gap-2">
                            {(['all', 'easy', 'medium', 'hard'] as const).map(diff => (
                              <button
                                key={diff}
                                type="button"
                                onClick={() => setSelectedDifficulty(diff)}
                                className={`py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold uppercase transition-all cursor-pointer text-center ${
                                  selectedDifficulty === diff
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {diff}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Launch Button */}
                      <button
                        onClick={() => handleStartQuiz()}
                        disabled={loadingQuestions}
                        className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Start {quizMode === 'exam' ? 'Timed Exam' : 'Practice Quiz'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* 2. ACTIVE QUIZ / EXAM SCREEN                                     */}
          {/* ================================================================ */}
          {quizState === 'active' && activeQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Question Header & Timer Bar */}
              <div className="flex items-center justify-between p-3 min-[360px]:p-4 bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl gap-2">
                <div className="flex items-center gap-2 min-[360px]:gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => {
                      if (window.confirm('Leave active quiz? Your current session answers will be lost.')) {
                        clearInterval(examTimerRef.current);
                        setQuizState('config');
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] sm:text-xs font-bold text-amber-400 font-mono block">
                      Question {currentIndex + 1} of {activeQuestions.length}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[140px] min-[360px]:max-w-[190px] sm:max-w-md">
                      {activeQuestions[currentIndex].subject} &bull; {activeQuestions[currentIndex].unit}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 min-[360px]:gap-2 shrink-0">
                  {/* Bookmark Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(activeQuestions[currentIndex].originalId)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      bookmarkedIds.has(activeQuestions[currentIndex].originalId)
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                    title="Bookmark this question"
                  >
                    {bookmarkedIds.has(activeQuestions[currentIndex].originalId) ? (
                      <BookmarkCheck className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>

                  {/* Flag button (Exam Mode) */}
                  {quizMode === 'exam' && (
                    <button
                      type="button"
                      onClick={handleToggleFlag}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        flaggedIndices.has(currentIndex)
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="Flag question for review"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}

                  {/* Timer Badge (Exam Mode) */}
                  {quizMode === 'exam' && (
                    <div className={`px-3.5 py-2 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 border ${
                      timeRemaining < 120 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                        : 'bg-slate-800 text-amber-400 border-slate-700'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(timeRemaining)}</span>
                    </div>
                  )}

                  {/* Question Palette Trigger (Always Accessible) */}
                  <button
                    type="button"
                    onClick={() => setShowQuestionPalette(true)}
                    className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1.5"
                    title="View Question Palette"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden min-[360px]:inline">Palette</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/80">
                <div 
                  className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                />
              </div>

              {/* Quick 1-Tap Question Jump Palette (UniExam Style) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar px-0.5">
                {activeQuestions.map((_, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = userAnswers[idx] !== undefined;
                  const isFlagged = flaggedIndices.has(idx);

                  return (
                    <button
                      key={`quick_jump_${idx}`}
                      type="button"
                      onClick={() => {
                        playClickChime();
                        setCurrentIndex(idx);
                        setIsAnswerRevealed(Boolean(userAnswers[idx]));
                      }}
                      className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-mono font-bold shrink-0 transition-all cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md scale-105'
                          : isFlagged
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isAnswered
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                      title={`Jump to Question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Question Card */}
              {(() => {
                const q = activeQuestions[currentIndex];
                const selectedOptionId = userAnswers[currentIndex];

                return (
                  <div className="bg-slate-900 border border-slate-800 p-4 min-[360px]:p-5 sm:p-8 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6 shadow-xl">
                    {/* Meta Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 min-[360px]:gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        q.difficulty === 'hard' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {q.difficulty}
                      </span>
                      {q.topic && (
                        <span className="text-[10px] min-[360px]:text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 truncate max-w-[160px] min-[360px]:max-w-none">
                          {q.topic}
                        </span>
                      )}
                      {q.is_pro && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1">
                          <Crown className="w-3 h-3" /> PRO
                        </span>
                      )}
                      {q.source && (
                        <span className="text-[9px] min-[360px]:text-[10px] text-slate-500 ml-auto hidden min-[400px]:inline">
                          Source: {q.source}
                        </span>
                      )}
                    </div>

                    {/* Question Text */}
                    <h2 className="text-base min-[360px]:text-lg sm:text-xl font-bold text-white leading-relaxed break-words">
                      {q.question}
                    </h2>

                    {/* 4 Choices */}
                    <div className="grid grid-cols-1 gap-2.5 sm:gap-3 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = selectedOptionId === opt.id;
                        let optionStyle = 'bg-slate-950 border-slate-800/90 text-slate-200 hover:border-slate-700';

                        if (quizMode === 'practice' && isAnswerRevealed) {
                          if (opt.id === q.correct_answer_id) {
                            optionStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-100 font-bold';
                          } else if (isSelected && opt.id !== q.correct_answer_id) {
                            optionStyle = 'bg-rose-950/70 border-rose-500 text-rose-200 font-bold';
                          } else {
                            optionStyle = 'bg-slate-950/40 border-slate-800/40 text-slate-500 opacity-60';
                          }
                        } else if (isSelected) {
                          optionStyle = 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold';
                        }

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectAnswer(opt.id, opt.text)}
                            className={`p-3 min-[360px]:p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left flex items-start gap-2.5 min-[360px]:gap-3 transition-all cursor-pointer min-h-[48px] ${optionStyle}`}
                          >
                            <span className={`w-6 h-6 min-[360px]:w-7 min-[360px]:h-7 rounded-lg sm:rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                              isSelected 
                                ? 'bg-amber-500 text-slate-950' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {opt.id}
                            </span>
                            <span className="text-xs min-[360px]:text-sm sm:text-base pt-0.5 leading-relaxed break-words">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Practice Mode Explanation Box */}
                    {quizMode === 'practice' && isAnswerRevealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3.5 min-[360px]:p-4 rounded-xl sm:rounded-2xl border text-xs sm:text-sm leading-relaxed break-words ${
                          selectedOptionId === q.correct_answer_id
                            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                            : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                        }`}
                      >
                        <div className="font-black flex items-center gap-1.5 mb-1 text-xs min-[360px]:text-sm">
                          {selectedOptionId === q.correct_answer_id ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Correct! Excellent Reasoning</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              <span>Incorrect. Correct Answer is Option {q.correct_answer_id}</span>
                            </>
                          )}
                        </div>
                        {q.explanation ? (
                          <div className="text-slate-300 mt-2 space-y-1">
                            <span className="font-bold text-amber-400">Explanation: </span>
                            <span>{q.explanation}</span>
                          </div>
                        ) : (
                          <div className="text-slate-400 mt-1 italic">
                            Refer to standard curriculum module notes for deeper study.
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-800/80 gap-2">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="px-3 min-[360px]:px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 min-h-[44px]"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      {quizMode === 'exam' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Submit Exam now and view your official score?')) {
                              handleFinishQuiz();
                            }
                          }}
                          className="px-3 min-[360px]:px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 cursor-pointer min-h-[44px]"
                        >
                          Submit Exam
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-4 min-[360px]:px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs min-[360px]:text-sm font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer min-h-[44px]"
                      >
                        <span>{currentIndex === activeQuestions.length - 1 ? (quizMode === 'exam' ? 'Submit Exam' : 'Finish Quiz') : 'Next'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* 3. RESULTS SCREEN                                                */}
          {/* ================================================================ */}
          {quizState === 'results' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto space-y-6 text-center"
            >
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <Trophy className="w-8 h-8 text-amber-400" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white">
                    {selectedSubject} {quizMode === 'exam' ? 'Exam' : 'Quiz'} Completed!
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Performance rating: <span className="font-bold text-amber-400">{performanceRating}</span>
                  </p>
                </div>

                {/* Score Big Display */}
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl">
                  <div className="text-5xl font-black text-amber-400 tracking-tight font-mono">
                    {quizScore.percentage}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Score: <span className="font-bold text-white">{quizScore.correct}</span> / {quizScore.total} Correct
                  </div>
                </div>

                {/* Breakdown Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block">Correct</span>
                    <span className="text-lg font-black text-emerald-400">{quizScore.correct}</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block">Wrong</span>
                    <span className="text-lg font-black text-rose-400">{quizScore.wrong}</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block">Time</span>
                    <span className="text-lg font-black text-amber-400 font-mono">{formatTime(quizScore.timeSpentSeconds)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setQuizState('review')}
                    className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>Review Answers</span>
                  </button>
                  <button
                    onClick={() => handleStartQuiz()}
                    className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retry Quiz</span>
                  </button>
                  <button
                    onClick={() => setQuizState('config')}
                    className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Back to Subject</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* 4. QUESTION REVIEW SCREEN                                        */}
          {/* ================================================================ */}
          {quizState === 'review' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black text-white">
                    Question-by-Question Review ({quizScore.correct}/{quizScore.total} Correct)
                  </h3>
                  <p className="text-xs text-slate-400">Inspect correct answers and detailed explanations</p>
                </div>
                <button
                  onClick={() => setQuizState('results')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Back to Results
                </button>
              </div>

              <div className="space-y-4">
                {activeQuestions.map((q, idx) => {
                  const studentChosenId = userAnswers[idx];
                  const isCorrect = studentChosenId === q.correct_answer_id;

                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-3xl border transition-all ${
                        isCorrect
                          ? 'bg-slate-900/90 border-emerald-500/40'
                          : 'bg-slate-900/90 border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className={`text-xs font-bold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isCorrect ? 'Correct Answer' : 'Incorrect'}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                            {q.subject} &bull; {q.unit}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(q.originalId)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                            bookmarkedIds.has(q.originalId) ? 'text-amber-400 border-amber-500/40' : 'text-slate-400 border-slate-700'
                          }`}
                        >
                          {bookmarkedIds.has(q.originalId) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <p className="text-sm font-bold text-white mb-3">{q.question}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {q.options.map(opt => {
                          const isStudentPick = studentChosenId === opt.id;
                          const isTargetCorrect = opt.id === q.correct_answer_id;

                          let style = 'bg-slate-950/60 border-slate-800 text-slate-400';
                          if (isTargetCorrect) {
                            style = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold';
                          } else if (isStudentPick && !isTargetCorrect) {
                            style = 'bg-rose-950/70 border-rose-500 text-rose-200 font-bold';
                          }

                          return (
                            <div key={opt.id} className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${style}`}>
                              <span className="font-black shrink-0">{opt.id}.</span>
                              <span className="leading-relaxed">{opt.text}</span>
                              {isStudentPick && (
                                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-bold">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300">
                          <span className="font-bold text-amber-400">Explanation: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ─── TAB 2: MY BOOKMARKED QUESTIONS ─── */}
      {activeTab === 'bookmarked' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-3xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                My Saved Questions ({bookmarkedQuestionsList.length})
              </h2>
              <p className="text-xs text-slate-400">Questions you flagged or saved during study sessions.</p>
            </div>
            {bookmarkedQuestionsList.length > 0 && (
              <button
                onClick={() => {
                  const randomized = bookmarkedQuestionsList.map(randomizeQuestionWithMappedAnswer);
                  setActiveQuestions(randomized);
                  setCurrentIndex(0);
                  setUserAnswers({});
                  setUserAnswerTexts({});
                  setQuizState('active');
                  setActiveTab('quiz_launcher');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Practice Saved Questions ({bookmarkedQuestionsList.length})</span>
              </button>
            )}
          </div>

          {bookmarkedQuestionsList.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
              <BookMarked className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No bookmarked questions yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click the bookmark icon on any question during quizzes or practice exams to save it here for review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarkedQuestionsList.map((q, idx) => (
                <div key={q.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {q.subject} &bull; {q.unit}
                    </span>
                    <button
                      onClick={() => handleToggleBookmark(q.id)}
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-sm font-bold text-white">{q.question_text || q.question}</p>
                  {q.explanation && (
                    <p className="text-xs text-slate-400 italic">
                      <span className="font-bold text-slate-300">Explanation:</span> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ─── TAB 3: MANAGE DATABASE (Direct manual question control - 0 API Key required) ─── */}
      {activeTab === 'database_manager' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-3xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                Manual Question Database
              </h2>
              <p className="text-xs text-slate-400">
                Directly add, test, and manage questions stored in the app repository. 0 API Key needed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question to Database</span>
              </button>
            </div>
          </div>

          {/* Search & Subject Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search questions by text or concept..."
                value={dbSearch}
                onChange={(e) => setDbSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <select
              value={dbSubjectFilter}
              onChange={(e) => setDbSubjectFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Subjects ({allQuestions.length})</option>
              {OFFICIAL_19_SUBJECTS.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Questions Grid */}
          <div className="space-y-3">
            {allQuestions
              .filter(q => {
                if (dbSubjectFilter !== 'All' && q.subject !== dbSubjectFilter) return false;
                if (dbSearch.trim()) {
                  const s = dbSearch.toLowerCase().trim();
                  const qText = (q.question_text || q.question || '').toLowerCase();
                  const exp = (q.explanation || '').toLowerCase();
                  return qText.includes(s) || exp.includes(s);
                }
                return true;
              })
              .slice(0, 50)
              .map((q) => (
                <div key={q.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {q.subject}
                      </span>
                      <span className="text-[10px] text-slate-400">{q.unit}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">[{q.difficulty}]</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white">{q.question_text || q.question}</p>
                  <div className="text-[11px] text-emerald-400 font-bold">
                    Correct Answer: {q.correct_answer}
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* ─── ADD QUESTION MODAL ─── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Add Question to Database
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddManualQuestion} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Subject</label>
                    <select
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {OFFICIAL_19_SUBJECTS.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Unit / Chapter</label>
                    <input
                      type="text"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      placeholder="e.g. Unit 1: Introduction"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Question Text</label>
                  <textarea
                    rows={2}
                    value={formQuestionText}
                    onChange={(e) => setFormQuestionText(e.target.value)}
                    required
                    placeholder="Enter full question..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Option A</label>
                    <input
                      type="text"
                      value={formOptionA}
                      onChange={(e) => setFormOptionA(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Option B</label>
                    <input
                      type="text"
                      value={formOptionB}
                      onChange={(e) => setFormOptionB(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Option C</label>
                    <input
                      type="text"
                      value={formOptionC}
                      onChange={(e) => setFormOptionC(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Option D</label>
                    <input
                      type="text"
                      value={formOptionD}
                      onChange={(e) => setFormOptionD(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Correct Option</label>
                    <select
                      value={formCorrectOption}
                      onChange={(e) => setFormCorrectOption(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Difficulty</label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Explanation</label>
                  <textarea
                    rows={2}
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                    placeholder="Why is this answer correct? Reference academic concept..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save to Database'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── QUESTION PALETTE MODAL (Exam Mode) ─── */}
      <AnimatePresence>
        {showQuestionPalette && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Exam Question Navigation Palette
                </h3>
                <button
                  onClick={() => setShowQuestionPalette(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
                {activeQuestions.map((_, idx) => {
                  const isAnswered = Boolean(userAnswers[idx]);
                  const isFlagged = flaggedIndices.has(idx);
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowQuestionPalette(false);
                      }}
                      className={`h-10 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${
                        isCurrent 
                          ? 'ring-2 ring-amber-400 bg-amber-500 text-slate-950 font-black' 
                          : isAnswered 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-emerald-500" />
                  <span>Answered ({Object.keys(userAnswers).length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-rose-500" />
                  <span>Flagged ({flaggedIndices.size})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-slate-800" />
                  <span>Remaining ({activeQuestions.length - Object.keys(userAnswers).length})</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
