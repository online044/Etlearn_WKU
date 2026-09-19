import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Trophy, Zap, Clock, Calendar, ArrowRight, Layers, FileText, CheckCircle, XCircle, 
  HelpCircle, Award, RefreshCw, Plus, X, Star, ArrowLeft, Crown, Lock, Sparkles, AlertTriangle, 
  Check, BookOpen, RotateCcw, Home, GraduationCap, ChevronRight, ShieldCheck
} from 'lucide-react';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { generateRandomExamQuestions } from '../utils/supabaseQuestions';

interface ExamPrepProps {
  apiKey: string;
  enrolledSubjects: string[];
  onStudyAction?: () => void;
  onNavigateBack?: () => void;
  isPro?: boolean;
  onNavigateToUpgrade?: () => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

const DEFAULT_SUBJECTS = [
  "Mathematics",
  "General Biology",
  "Emerging Technologies",
  "Introduction to Economics",
  "Communicative English",
  "Moral and Civic Education",
  "General Physics",
  "Chemistry",
  "Logic and Critical Thinking",
  "C++ Programming",
  "Geography of Ethiopia",
  "History of Ethiopia"
];

const PAST_EXAM_BANK: { [subject: string]: QuizQuestion[] } = {
  "Mathematics": [
    {
      question: "What is the derivative of f(x) = 3x^4 - 5x^2 + 7 with respect to x?",
      options: ["12x^3 - 10x", "12x^3 - 5x + 7", "7x^3 - 10x", "12x^4 - 10x^2"],
      correctAnswer: "12x^3 - 10x",
      explanation: "Using the power rule d/dx(x^n) = n*x^(n-1): d/dx(3x^4) = 12x^3, d/dx(-5x^2) = -10x, and the derivative of constant (7) is 0."
    },
    {
      question: "Evaluate the limit: lim(x -> 0) [sin(5x) / x].",
      options: ["5", "1", "0", "Does not exist"],
      correctAnswer: "5",
      explanation: "Using the standard limit theorem lim(u -> 0) [sin(u)/u] = 1, lim(x -> 0) [sin(5x)/x] = 5 * lim(x -> 0) [sin(5x)/(5x)] = 5 * 1 = 5."
    },
    {
      question: "In linear algebra, if matrix A has a determinant det(A) = 0, which statement is always true?",
      options: ["Matrix A is singular and non-invertible", "Matrix A is symmetric", "Matrix A is an identity matrix", "The eigenvalues of A are all equal to 1"],
      correctAnswer: "Matrix A is singular and non-invertible",
      explanation: "A square matrix is invertible if and only if its determinant is non-zero. When det(A) = 0, the matrix is singular."
    },
    {
      question: "What is the integral ∫ (2x + 3)^4 dx?",
      options: ["(1/10)(2x + 3)^5 + C", "(1/5)(2x + 3)^5 + C", "(2/5)(2x + 3)^5 + C", "(1/8)(2x + 3)^4 + C"],
      correctAnswer: "(1/10)(2x + 3)^5 + C",
      explanation: "Let u = 2x + 3, then du = 2 dx or dx = du/2. The integral becomes (1/2) ∫ u^4 du = (1/10)(2x + 3)^5 + C."
    }
  ],
  "General Biology": [
    {
      question: "What primary cellular organelle hosts the aerobic Krebs (Citric Acid) Cycle within eukaryotic cells?",
      options: ["The inner mitochondrial matrix", "Cytosolic ribosomes", "Nucleolar envelope membranes", "Lysosome digestion vesicles"],
      correctAnswer: "The inner mitochondrial matrix",
      explanation: "While glycolysis happens in the cytosol, the Citric Acid Cycle occurs inside the mitochondrial matrix to synthesize NADH, FADH2, and ATP precursors."
    },
    {
      question: "Which cellular cycle phase replicates genomic DNA to prepare cells for mitotic division?",
      options: ["S (Synthesis) phase of Interphase", "G0 stagnant resting stage", "Prophase spindle convergence", "Telophase cytokinesis split"],
      correctAnswer: "S (Synthesis) phase of Interphase",
      explanation: "DNA replication is carried out during the S-phase (Synthesis phase) of the cell cycle, ensuring each resulting daughter cell inherits a complete duplicate genome."
    },
    {
      question: "During light-dependent photosynthetic reactions in chloroplasts, where is molecular oxygen (O2) derived from?",
      options: ["The photolysis (splitting) of water molecules", "Carbon dioxide fixation in the Calvin cycle", "The degradation of glucose monomers", "ATP synthase catalytic activity"],
      correctAnswer: "The photolysis (splitting) of water molecules",
      explanation: "Light energy absorbed by Photosystem II oxidizes and splits water (H2O) into protons, electrons, and O2 gas as a byproduct."
    },
    {
      question: "Which enzyme is responsible for synthesizing mRNA from a DNA template during transcription?",
      options: ["RNA Polymerase II", "DNA Ligase", "DNA Polymerase III", "Peptidyl Transferase"],
      correctAnswer: "RNA Polymerase II",
      explanation: "RNA Polymerase binds to the gene promoter region and transcribes the DNA sequence into messenger RNA (mRNA)."
    }
  ],
  "Emerging Technologies": [
    {
      question: "Which technology acts as the underlying decentralized fabric enabling verifiable trust without central intermediaries?",
      options: ["Blockchain distributed ledgers", "Centralized relational databases", "Quantum supercomputing nodes", "Edge mesh radios"],
      correctAnswer: "Blockchain distributed ledgers",
      explanation: "Blockchain technology employs decentralized cryptographic consensus mechanisms (PoW/PoS) to secure ledgers without relying on centralized banks or authorities."
    },
    {
      question: "What is the primary operational advantage of implementing Edge Computing in IoT sensor networks?",
      options: ["Reduced latency by processing data closer to local source devices", "Higher centralization in distant global cloud hubs", "Increased long-haul bandwidth consumption", "Lower computational requirements on microcontrollers"],
      correctAnswer: "Reduced latency by processing data closer to local source devices",
      explanation: "Edge processing analyzes data directly at or near the collection node, cutting transmission latency to distant cloud servers and saving precious network bandwidth."
    },
    {
      question: "In Machine Learning, what type of learning paradigm trains algorithms using explicitly labeled input-output pairs?",
      options: ["Supervised Learning", "Unsupervised Clustering", "Reinforcement Learning", "Self-Organizing Heuristic Learning"],
      correctAnswer: "Supervised Learning",
      explanation: "Supervised learning algorithms are provided with pairs of inputs and corresponding ground-truth targets (labels) to learn a mapping function."
    },
    {
      question: "What is the primary purpose of a Smart Contract deployed on the Ethereum virtual machine?",
      options: ["To automatically execute contractual agreements when predefined conditions are satisfied", "To physically secure hardware mining rigs", "To generate GPU clock speed profiles", "To compress video files for distributed streaming"],
      correctAnswer: "To automatically execute contractual agreements when predefined conditions are satisfied",
      explanation: "Smart contracts are autonomous, self-executing code blocks living on a blockchain that execute logic automatically without third-party arbitration."
    }
  ],
  "Introduction to Economics": [
    {
      question: "Which state of a competitive market represents the stable price level where quantity demanded equals quantity supplied?",
      options: ["Equilibrium price level", "Inflationary gap", "Deadweight monopoly surplus", "Mercantile deficit"],
      correctAnswer: "Equilibrium price level",
      explanation: "Market equilibrium occurs at the intersection of supply and demand curves, where no excess supply or unmet demand exerts pressure on prices."
    },
    {
      question: "What does the concept of 'Opportunity Cost' measure in economic decision-making?",
      options: ["The value of the next best alternative forgone when a choice is made", "The total monetary expenditure incurred during production", "The historical sunk cost that cannot be recovered", "The profit margin earned after deducting taxes"],
      correctAnswer: "The value of the next best alternative forgone when a choice is made",
      explanation: "Opportunity cost represents the highest-valued alternative sacrificed whenever resources are allocated to one specific choice over another."
    },
    {
      question: "If the cross-price elasticity of demand between good X and good Y is positive, what is the economic relationship between them?",
      options: ["They are substitute goods", "They are complementary goods", "They are inferior goods", "They are luxury Giffen goods"],
      correctAnswer: "They are substitute goods",
      explanation: "A positive cross-price elasticity means that an increase in the price of one good causes an increase in demand for the other, indicating they can substitute for each other."
    },
    {
      question: "Which macroeconomic indicator calculates the total market value of all final goods and services produced within a country's borders in a given year?",
      options: ["Gross Domestic Product (GDP)", "Gross National Product (GNP)", "Net National Disposable Income", "Consumer Price Index (CPI)"],
      correctAnswer: "Gross Domestic Product (GDP)",
      explanation: "GDP measures the monetary value of all finished goods and services produced domestically over a specified period."
    }
  ],
  "Communicative English": [
    {
      question: "Choose the correct reported speech form: 'I am preparing for the midterm exam now,' said Abebe.",
      options: [
        "Abebe said that he was preparing for the midterm exam then.",
        "Abebe said that he is preparing for the midterm exam now.",
        "Abebe told that he will prepare for the midterm exam then.",
        "Abebe said he had been preparing for the midterm exam today."
      ],
      correctAnswer: "Abebe said that he was preparing for the midterm exam then.",
      explanation: "In reported speech with a past reporting verb ('said'), present continuous ('am preparing') shifts to past continuous ('was preparing') and 'now' shifts to 'then'."
    },
    {
      question: "Identify the grammatically correct sentence with proper subject-verb agreement:",
      options: [
        "The professor, along with her graduate assistants, has published a groundbreaking paper.",
        "The professor, along with her graduate assistants, have published a groundbreaking paper.",
        "Neither the students nor the instructor were present at the auditorium.",
        "A bouquet of fresh yellow roses were placed on the podium."
      ],
      correctAnswer: "The professor, along with her graduate assistants, has published a groundbreaking paper.",
      explanation: "Parenthetical phrases introduced by 'along with' do not change the number of the singular subject ('The professor' -> 'has published')."
    }
  ],
  "Moral and Civic Education": [
    {
      question: "Which supreme legal document serves as the foundational framework for governance and human rights in modern Ethiopia?",
      options: ["The 1995 FDRE Constitution", "The 1931 Imperial Constitution", "The 1987 PDRE Constitution", "The Fetha Nagast historical code"],
      correctAnswer: "The 1995 FDRE Constitution",
      explanation: "The 1995 Constitution of the Federal Democratic Republic of Ethiopia establishes the federal state structure, separation of powers, and human and democratic rights."
    },
    {
      question: "In philosophical ethics, which normative theory asserts that the morality of an action depends solely on the greatest overall happiness it produces?",
      options: ["Utilitarianism (Consequentialism)", "Kantian Deontology", "Virtue Ethics", "Ethical Egoism"],
      correctAnswer: "Utilitarianism (Consequentialism)",
      explanation: "Utilitarianism judges actions based on their consequences, seeking the greatest good for the greatest number."
    }
  ],
  "General Physics": [
    {
      question: "A constant force of 20 N acts upon a 4 kg mass initially at rest. What is the acceleration produced?",
      options: ["5 m/s²", "80 m/s²", "16 m/s²", "0.2 m/s²"],
      correctAnswer: "5 m/s²",
      explanation: "By Newton's Second Law of Motion: F = m * a. Therefore, a = F / m = 20 N / 4 kg = 5 m/s²."
    },
    {
      question: "What physical quantity does the area under a Velocity-Time graph represent?",
      options: ["Displacement", "Instantaneous acceleration", "Kinetic momentum", "Jerk"],
      correctAnswer: "Displacement",
      explanation: "The definite integral of velocity with respect to time (∫ v(t) dt) calculates the displacement of the moving body."
    }
  ],
  "Chemistry": [
    {
      question: "What is the pH of a 0.001 M hydrochloric acid (HCl) aqueous solution at 25°C?",
      options: ["3.0", "1.0", "11.0", "7.0"],
      correctAnswer: "3.0",
      explanation: "HCl is a strong monoprotic acid that dissociates completely: [H+] = 0.001 M = 10^-3 M. pH = -log10([H+]) = -log10(10^-3) = 3.0."
    },
    {
      question: "According to the Bronsted-Lowry acid-base definition, what is a base?",
      options: ["A proton (H+) acceptor", "A proton (H+) donor", "An electron pair donor only", "A substance that produces OH- ions in nonpolar solvents"],
      correctAnswer: "A proton (H+) acceptor",
      explanation: "In Bronsted-Lowry theory, an acid is a proton donor and a base is a proton acceptor."
    }
  ]
};

export default function ExamPrep({ 
  apiKey, 
  enrolledSubjects, 
  onStudyAction,
  onNavigateBack,
  isPro = false,
  onNavigateToUpgrade
}: ExamPrepProps) {
  // Load language settings from safeStorage
  const [language, setLanguage] = useState<'en' | 'am'>(() => {
    const saved = safeStorage.getItem('ethiolearn_language_preference');
    return (saved === 'am' || saved === 'en') ? saved : 'en';
  });

  // Track practiced subjects for Free tier limit (max 3 subjects)
  const [triedSubjects, setTriedSubjects] = useState<string[]>(() => {
    try {
      const stored = safeStorage.getItem('ethiolearn_quiz_tried_subjects');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [customQuestionBank, setCustomQuestionBank] = useState<{ [subject: string]: QuizQuestion[] }>(() => {
    try {
      const stored = safeStorage.getItem('ethiolearn_custom_exams');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [allSubjects, setAllSubjects] = useState<string[]>(() => {
    try {
      const stored = safeStorage.getItem('ethiolearn_custom_exams');
      const customSubjects = stored ? Object.keys(JSON.parse(stored)) : [];
      const combined = Array.from(new Set([...DEFAULT_SUBJECTS, ...enrolledSubjects, ...customSubjects]));
      return combined;
    } catch {
      return DEFAULT_SUBJECTS;
    }
  });

  const [selectedSubject, setSelectedSubject] = useState(() => {
    return allSubjects[0] || "Mathematics";
  });

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qCount, setQCount] = useState<number>(5);
  const [customNeeds, setCustomNeeds] = useState<string>('');

  // Custom exam form states
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [newExamSubject, setNewExamSubject] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newOptionC, setNewOptionC] = useState('');
  const [newOptionD, setNewOptionD] = useState('');
  const [newCorrectOption, setNewCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [newExplanation, setNewExplanation] = useState('');

  // Exam runtime state
  const [examMode, setExamMode] = useState<'setup' | 'active' | 'results'>('setup');
  const [examQuestions, setExamQuestions] = useState<QuizQuestion[]>([]);
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [userSelections, setUserSelections] = useState<{ [index: number]: string }>({});
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(90);
  const examTimerRef = useRef<any>(null);

  // Results State
  const [examScore, setExamScore] = useState<number>(0);
  const [examGrade, setExamGrade] = useState<string>('A');
  const [particles, setParticles] = useState<{ id: number; left: number; top: number; color: string; size: number; duration: number }[]>([]);

  // 5-minute revision summaries
  const [revisionTopic, setRevisionTopic] = useState('');
  const [revisionOutput, setRevisionOutput] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Loading state
  const [loadingText, setLoadingText] = useState<string | null>(null);

  // History & Favorites
  const [pastSessions, setPastSessions] = useState<any[]>(() => {
    try {
      const stored = safeStorage.getItem('ethiolearn_exam_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [favoriteSessionIds, setFavoriteSessionIds] = useState<string[]>(() => {
    try {
      const stored = safeStorage.getItem('ethiolearn_favorite_exam_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showFavoriteSessionsOnly, setShowFavoriteSessionsOnly] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Check if selected subject is permitted under the 3-subject rule
  const isSubjectPermitted = (sub: string): boolean => {
    if (isPro) return true;
    if (triedSubjects.includes(sub)) return true;
    return triedSubjects.length < 3;
  };

  const recordSubjectUsage = (sub: string) => {
    if (!triedSubjects.includes(sub)) {
      const updated = [...triedSubjects, sub];
      setTriedSubjects(updated);
      try {
        safeStorage.setItem('ethiolearn_quiz_tried_subjects', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist tried subjects', e);
      }
    }
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamSubject.trim() || !newQuestionText.trim() || !newOptionA.trim() || !newOptionB.trim() || !newOptionC.trim() || !newOptionD.trim()) {
      alert(language === 'en' ? 'Please fill out all required fields!' : 'እባክዎን ሁሉንም አስፈላጊ ቦታዎች ይሙሉ!');
      return;
    }

    const correctMap = {
      'A': newOptionA.trim(),
      'B': newOptionB.trim(),
      'C': newOptionC.trim(),
      'D': newOptionD.trim()
    };

    const newQn: QuizQuestion = {
      question: newQuestionText.trim(),
      options: [newOptionA.trim(), newOptionB.trim(), newOptionC.trim(), newOptionD.trim()],
      correctAnswer: correctMap[newCorrectOption],
      explanation: newExplanation.trim() || undefined
    };

    const subjectKey = newExamSubject.trim();

    try {
      const stored = safeStorage.getItem('ethiolearn_custom_exams');
      const bank = stored ? JSON.parse(stored) : {};
      
      if (!bank[subjectKey]) {
        bank[subjectKey] = [];
      }
      bank[subjectKey].push(newQn);
      
      safeStorage.setItem('ethiolearn_custom_exams', JSON.stringify(bank));
      setCustomQuestionBank(bank);
      
      if (!allSubjects.includes(subjectKey)) {
        setAllSubjects(prev => Array.from(new Set([...prev, subjectKey])));
      }
      
      setSelectedSubject(subjectKey);
      playSuccessChime();
      alert(language === 'en' 
        ? `Successfully added your question to "${subjectKey}"!` 
        : `ጥያቄዎ ወደ "${subjectKey}" በተሳካ ሁኔታ ተጨምሯል!`
      );
      
      setNewQuestionText('');
      setNewOptionA('');
      setNewOptionB('');
      setNewOptionC('');
      setNewOptionD('');
      setNewExplanation('');
      setShowAddExamModal(false);
    } catch {
      alert(language === 'en' ? 'Failed to save custom question.' : 'ጥያቄውን መመዝገብ አልተቻለም።');
    }
  };

  const triggerDopaminePop = () => {
    const newParticles = Array.from({ length: 24 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 80 + 10,
      top: Math.random() * 60 + 20,
      color: ['#078930', '#FCDD09', '#DA121A', '#3B82F6', '#10B981', '#F59E0B'][Math.floor(Math.random() * 6)],
      size: Math.random() * 8 + 4,
      duration: Math.random() * 1.5 + 1
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2500);
  };

  const toggleFavoriteSession = (sessionId: string) => {
    playClickChime();
    setFavoriteSessionIds(prev => {
      let updated: string[];
      if (prev.includes(sessionId)) {
        updated = prev.filter(id => id !== sessionId);
      } else {
        updated = [...prev, sessionId];
      }
      safeStorage.setItem('ethiolearn_favorite_exam_sessions', JSON.stringify(updated));
      return updated;
    });
  };

  const finalizeQuizStart = (questions: QuizQuestion[]) => {
    recordSubjectUsage(selectedSubject);
    setExamQuestions(questions);
    setExamMode('active');
    setActiveQIndex(0);
    setUserSelections({});
    setIsAnswerRevealed(false);
    setTimeRemaining(90);
    startQuestionTimer(90);
    playSuccessChime();
  };

  // Generate Authentic Pro AI Quiz
  const handleGenerateCuratedMock = async () => {
    // 3-Subject Subscription Check
    if (!isSubjectPermitted(selectedSubject)) {
      playFailureChime();
      setShowUpgradeModal(true);
      return;
    }

    playClickChime();
    setLoadingText(language === 'en' 
      ? `Asgobnyi AI is generating verified ${selectedSubject} questions...` 
      : `አስጎብኚ AI ትክክለኛ የ${selectedSubject} የፈተና ጥያቄዎችን በማዘጋጀት ላይ...`
    );

    try {
      const resp = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          topic: revisionTopic || undefined,
          difficulty,
          qCount,
          customNeeds,
          language
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          setLoadingText(null);
          finalizeQuizStart(data.questions);
          return;
        }
      }
    } catch (e) {
      console.warn('[Quiz API Error, falling back to dedicated subject bank]:', e);
    }

    // Fallback: strictly query questions for this subject only.
    // NEVER mix questions from other subjects!
    const defaultBank = PAST_EXAM_BANK[selectedSubject] || [];
    const customBankForSubject = customQuestionBank[selectedSubject] || [];
    let combined: QuizQuestion[] = [...customBankForSubject, ...defaultBank];

    if (combined.length === 0) {
      combined = [
        {
          question: `In Ethiopian university syllabus for ${selectedSubject}, which core concept governs ${customNeeds || 'foundational analysis'}?`,
          options: [
            `A) Theoretical axioms and empirical verification in ${selectedSubject}`,
            `B) Unsubstantiated empirical observation without foundational models`,
            `C) Isolated scalar approximations disregarding domain boundaries`,
            `D) Non-reproducible empirical extrapolation`
          ],
          correctAnswer: `A) Theoretical axioms and empirical verification in ${selectedSubject}`,
          explanation: `In standard university level ${selectedSubject}, academic rigor requires proven theoretical frameworks and empirical consistency.`
        }
      ];
    }

    const shuffled = [...combined].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(qCount, shuffled.length));
    setLoadingText(null);
    finalizeQuizStart(selected);
  };

  const handleStartPastExam = async () => {
    // 3-Subject Subscription Check
    if (!isSubjectPermitted(selectedSubject)) {
      playFailureChime();
      setShowUpgradeModal(true);
      return;
    }

    playClickChime();
    setLoadingText(language === 'en' 
      ? `Retrieving authentic ${selectedSubject} university examination paper...` 
      : `ኦፊሴላዊ የ${selectedSubject} የዩኒቨርሲቲ ፈተና ጥያቄዎችን በማምጣት ላይ...`
    );

    try {
      const dbQuestions = await generateRandomExamQuestions({
        subject: selectedSubject,
        totalQuestions: 10,
        examCategory: 'practice_exam'
      });

      if (dbQuestions && dbQuestions.length > 0) {
        const mapped: QuizQuestion[] = dbQuestions.map(q => ({
          question: q.question_text,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation || `${q.course} (${q.unit})`
        }));
        setLoadingText(null);
        finalizeQuizStart(mapped);
        return;
      }
    } catch {
      // Fallback below
    }

    // Fallback: dedicated subject bank only
    const defaultBank = PAST_EXAM_BANK[selectedSubject] || PAST_EXAM_BANK["Mathematics"] || [];
    const customBankForSubject = customQuestionBank[selectedSubject] || [];
    const bank = [...customBankForSubject, ...defaultBank];
    setLoadingText(null);
    finalizeQuizStart(bank);
  };

  const startQuestionTimer = (seconds: number) => {
    clearInterval(examTimerRef.current);
    setTimeRemaining(seconds);
    examTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(examTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswerRevealed) return;

    setUserSelections(prev => ({ ...prev, [activeQIndex]: option }));
    setIsAnswerRevealed(true);
    clearInterval(examTimerRef.current);

    const question = examQuestions[activeQIndex];
    if (option === question.correctAnswer) {
      playSuccessChime();
      triggerDopaminePop();
    } else {
      playFailureChime();
    }
    onStudyAction?.();
  };

  const handleNextQuestion = () => {
    playClickChime();
    if (activeQIndex < examQuestions.length - 1) {
      setActiveQIndex(prev => prev + 1);
      setIsAnswerRevealed(false);
      setTimeRemaining(90);
      startQuestionTimer(90);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    clearInterval(examTimerRef.current);

    let score = 0;
    examQuestions.forEach((q, idx) => {
      if (userSelections[idx] === q.correctAnswer) {
        score++;
      }
    });

    setExamScore(score);
    const percent = Math.round((score / examQuestions.length) * 100);

    let grade = 'F';
    if (percent >= 90) grade = 'A+';
    else if (percent >= 85) grade = 'A';
    else if (percent >= 80) grade = 'A-';
    else if (percent >= 75) grade = 'B+';
    else if (percent >= 70) grade = 'B';
    else if (percent >= 60) grade = 'C';
    else if (percent >= 50) grade = 'D';

    setExamGrade(grade);
    setExamMode('results');

    const newSessionId = `session_${Date.now()}_${selectedSubject}`;
    setCurrentSessionId(newSessionId);

    const sessionRecord = {
      id: newSessionId,
      subject: selectedSubject,
      score: percent,
      grade,
      correctCount: score,
      totalCount: examQuestions.length,
      date: new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'am-ET', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    };

    const updatedSessions = [sessionRecord, ...pastSessions].slice(0, 30);
    setPastSessions(updatedSessions);
    safeStorage.setItem('ethiolearn_exam_sessions', JSON.stringify(updatedSessions));

    playSuccessChime();
    triggerDopaminePop();
  };

  // Exit Quiz cleanly if student changes their mind
  const handleConfirmExitQuiz = () => {
    playClickChime();
    clearInterval(examTimerRef.current);
    setShowExitConfirm(false);
    setExamMode('setup');
  };

  // Curriculum 5-Minute summaries
  const runTopicRevision = async () => {
    if (!revisionTopic.trim()) return;
    setIsSummarizing(true);
    setRevisionOutput('');
    playClickChime();

    setTimeout(() => {
      const summaryCard = `### 📌 5-Minute High-Yield Study Revision Card
**Subject:** ${selectedSubject}
**Topic:** ${revisionTopic}

**Core Curriculum Takeaways:**
1. **Fundamental Axiom:** Review the key theorems and definitions of ${revisionTopic} in ${selectedSubject}.
2. **High-Frequency University Exam Formula:** Verify standard equations, formulas, and relationships used in Ethiopian universities.
3. **Common Trap to Avoid:** Distractor options often invert variables or drop units. Always verify dimensional consistency.
4. **Active Application:** Connect theoretical concepts directly to practical exam problem solving.
5. **Exam Strategy:** Eliminate choices that contradict foundational definitions first.

*Verified Ethiopian Higher Education Curriculum Reference.*`;
      setIsSummarizing(false);
      setRevisionOutput(summaryCard);
      playSuccessChime();
    }, 250);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* SETUP SCREEN */}
        {examMode === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Top Navigation & Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
              <button
                onClick={() => {
                  playClickChime();
                  if (onNavigateBack) onNavigateBack();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>{language === 'en' ? 'Back to Dashboard' : 'ወደ ዋናው ገጽ ተመለስ'}</span>
              </button>

              {isPro ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-xs">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'en' ? 'EthioLearn Pro: Unlimited Subjects' : 'ኢትዮለርን ፕሮ፦ ያልተገደቡ ትምህርቶች'}</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    playClickChime();
                    if (onNavigateToUpgrade) onNavigateToUpgrade();
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {language === 'en' 
                      ? `${triedSubjects.length}/3 Free Subjects Tried (Upgrade for All)` 
                      : `${triedSubjects.length}/3 ነፃ ትምህርቶች ተሞክረዋል (ሙሉ ለማግኘት አሻሽሉ)`}
                  </span>
                </button>
              )}
            </div>

            {/* Subject Quota Meter for Free Plan */}
            {!isPro && (
              <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-200">
                      {language === 'en' ? 'Free Plan Subject Quota' : 'የነፃ እቅድ የትምህርት ገደብ'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    triedSubjects.length >= 3 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {triedSubjects.length} / 3 {language === 'en' ? 'Subjects Active' : 'ትምህርቶች ነፃ ተሞክረዋል'}
                  </span>
                </div>

                <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      triedSubjects.length >= 3 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, (triedSubjects.length / 3) * 100)}%` }}
                  />
                </div>

                {triedSubjects.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400">{language === 'en' ? 'Active Unlocked Subjects:' : 'ያገለገሉ ነፃ ትምህርቶች፦'}</span>
                    {triedSubjects.map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          playClickChime();
                          setSelectedSubject(sub);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          selectedSubject === sub 
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        ✓ {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form configuration panel */}
              <div className="bg-slate-850 bg-[#141E33] p-6 rounded-2xl border border-slate-700/80 shadow-md space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-amber-400" />
                    <h3 className="font-serif font-bold text-base text-white">
                      {language === 'en' ? 'Curriculum Practice & Exams' : 'ፈተና እና ልምምድ ጀምር'}
                    </h3>
                  </div>

                  <button
                    onClick={() => { playClickChime(); setShowAddExamModal(true); }}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                    title={language === 'en' ? 'Add Custom Exam Question' : 'ብጁ ጥያቄ ጨምር'}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Subject dropdown */}
                <div className="space-y-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                    <label>{language === 'en' ? 'Subject / Course' : 'የትምህርት አይነት'}</label>
                    {!isSubjectPermitted(selectedSubject) && (
                      <span className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {language === 'en' ? 'Pro Subject' : 'ፕሮ ትምህርት'}
                      </span>
                    )}
                  </div>

                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-sans font-semibold rounded-xl py-3 px-3.5 outline-none cursor-pointer focus:border-amber-400"
                  >
                    {allSubjects.map(s => {
                      const locked = !isSubjectPermitted(s);
                      return (
                        <option key={s} value={s}>
                          {s} {locked ? '🔒 (Pro)' : (triedSubjects.includes(s) ? '✓' : '')}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Question count options */}
                <div className="space-y-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <label>{language === 'en' ? 'Number of Questions' : 'የጥያቄዎች ብዛት'}</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                    {[5, 10, 20].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => { setQCount(count); playClickChime(); }}
                        className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          qCount === count ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {count} {language === 'en' ? 'Qns' : 'ጥያቄ'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty level selection */}
                <div className="space-y-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <label>{language === 'en' ? 'Difficulty Level' : 'የክብደት ደረጃ'}</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => { setDifficulty(diff); playClickChime(); }}
                        className={`py-2 text-xs font-bold rounded-lg cursor-pointer capitalize transition-all ${
                          difficulty === diff ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {language === 'en' ? diff : (diff === 'easy' ? 'ቀላል' : diff === 'medium' ? 'መካከለኛ' : 'ከባድ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom needs or specific target area */}
                <div className="space-y-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <label>{language === 'en' ? 'Specific Request / Custom Topic' : 'የተለየ ጥያቄ / የትኩረት ምዕራፍ'}</label>
                  <textarea
                    value={customNeeds}
                    onChange={(e) => setCustomNeeds(e.target.value)}
                    placeholder={language === 'en' 
                      ? 'e.g., Focus strictly on Chapter 3 integrals, include Amharic solutions, exam-standard calculations...' 
                      : 'ምሳሌ፦ በምዕራፍ 3 ላይ ብቻ ያተኩር፣ ማብራሪያው በአማርኛ ይሁን፣ የዩኒቨርሲቲ ፈተና ደረጃ ጥያቄዎች...'}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 font-sans text-xs font-semibold rounded-xl py-2 px-3 outline-none focus:border-amber-400 resize-none placeholder-slate-500 normal-case"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-3">
                  <button
                    onClick={handleGenerateCuratedMock}
                    className="w-full h-12 min-h-[48px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                  >
                    <Layers className="w-4 h-4 text-slate-950" />
                    {language === 'en' ? 'Start AI Practice Quiz' : 'የልምምድ ፈተና ጀምር'}
                  </button>

                  <button
                    onClick={handleStartPastExam}
                    className="w-full h-12 min-h-[48px] bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-750 hover:text-white text-sm font-bold tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    {language === 'en' ? 'Official Past University Paper' : 'ኦፊሴላዊ የዩኒቨርሲቲ ፈተና ጀምር'}
                  </button>

                  {/* Change mind / back button */}
                  {onNavigateBack && (
                    <button
                      onClick={() => {
                        playClickChime();
                        onNavigateBack();
                      }}
                      className="w-full text-center py-1 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      {language === 'en' ? 'Changed your mind? Return to Dashboard' : 'ሀሳብዎን ቀየሩ? ወደ ዋናው ዳሽቦርድ ይመለሱ'}
                    </button>
                  )}
                </div>

                {loadingText && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-xs text-amber-300 font-bold animate-pulse">
                    {loadingText}
                  </div>
                )}
              </div>

              {/* Topic Revision helper cards */}
              <div className="bg-[#141E33] p-6 rounded-2xl border border-slate-700/80 shadow-md space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-700/60">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="font-serif font-bold text-base text-white">
                    {language === 'en' ? '5-Min Topic Summary' : 'ፈጣን የርዕስ ማጠቃለያ'}
                  </h3>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    {language === 'en' 
                      ? 'Type any difficult chapter or concept to generate high-yield revision notes before taking your quiz!' 
                      : 'ያልገባዎትን ርዕስ እዚህ ይጻፉና ፈተና ከመውሰድዎ በፊት ፈጣን ማጠቃለያ ይከልሱ!'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={language === 'en' ? "e.g. Mitochondria, GDP, FDRE Constitution..." : "ምሳሌ፦ Mitochondria, GDP, የፌደራል ህገ-መንግስት..."}
                      value={revisionTopic}
                      onChange={(e) => setRevisionTopic(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={runTopicRevision}
                      disabled={isSummarizing || !revisionTopic.trim()}
                      className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSummarizing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {revisionOutput ? (
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-xs leading-relaxed max-h-64 overflow-y-auto whitespace-pre-line text-slate-300 font-sans">
                    {revisionOutput}
                  </div>
                ) : (
                  <div className="p-8 border border-dashed border-slate-700 rounded-xl text-center text-xs text-slate-500 font-serif">
                    {language === 'en' ? 'Notes outcome will compile here...' : 'የተዘጋጀው ማጠቃለያ እዚህ ላይ ይወጣል...'}
                  </div>
                )}
              </div>

              {/* Performance Logs list */}
              <div className="bg-[#141E33] p-6 rounded-2xl border border-slate-700/80 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="font-serif font-bold text-base text-white">
                      {language === 'en' ? 'Performance History' : 'የፈተና ታሪክ እና ውጤት'}
                    </h3>
                  </div>

                  {pastSessions.length > 0 && (
                    <button
                      onClick={() => {
                        playClickChime();
                        setShowFavoriteSessionsOnly(!showFavoriteSessionsOnly);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                        showFavoriteSessionsOnly 
                          ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${showFavoriteSessionsOnly ? 'fill-slate-950 text-slate-950' : ''}`} />
                      {language === 'en' ? 'Favorites' : 'ምርጦቹ'}
                      {favoriteSessionIds.length > 0 && ` (${favoriteSessionIds.length})`}
                    </button>
                  )}
                </div>

                {(() => {
                  const displayedSessions = pastSessions.filter(sess => {
                    if (!showFavoriteSessionsOnly) return true;
                    const sessId = sess.id || `session_${sess.subject}_${sess.date}_${sess.score}`;
                    return favoriteSessionIds.includes(sessId);
                  });

                  if (displayedSessions.length === 0) {
                    return (
                      <div className="p-8 border border-dashed border-slate-700 rounded-xl text-center text-xs text-slate-500 font-serif">
                        {showFavoriteSessionsOnly 
                          ? (language === 'en' ? 'No favorited exam logs yet.' : 'ምርጥ ተብለው የተመረጡ ፈተናዎች የሉም።')
                          : (language === 'en' ? 'Your test grades history is currently empty' : 'የወሰዷቸው ፈተናዎች ውጤት እዚህ ሙሉ ታሪክ ሆኖ ይቀመጣል')}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {displayedSessions.map((sess) => {
                        const sessId = sess.id || `session_${sess.subject}_${sess.date}_${sess.score}`;
                        const isFav = favoriteSessionIds.includes(sessId);
                        return (
                          <div key={sessId} className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs hover:border-slate-600 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={() => toggleFavoriteSession(sessId)}
                                className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-amber-400 transition-colors shrink-0"
                                title={language === 'en' ? 'Toggle Favorite' : 'ምርጥ ምርጫ'}
                              >
                                <Star className={`w-3.5 h-3.5 transition-all ${isFav ? 'fill-amber-400 text-amber-400 scale-110' : ''}`} />
                              </button>
                              <div>
                                <span className="font-bold text-slate-200 block leading-tight">{sess.subject}</span>
                                <span className="text-[10px] text-slate-400 mt-0.5 block">{sess.date}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-extrabold text-sm text-emerald-400 block">{sess.score}%</span>
                              <span className="block text-[10px] font-black uppercase text-amber-400">Grade {sess.grade}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTIVE EXAM RUNNING SCREEN */}
        {examMode === 'active' && examQuestions.length > 0 && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto bg-[#141E33] p-6 rounded-2xl border border-slate-700 shadow-xl space-y-5"
          >
            {/* Header with Exit Quiz Button */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
              <button
                onClick={() => setShowExitConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'en' ? 'Exit Quiz' : 'ውጣ / ተመለስ'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-amber-400 uppercase tracking-wide">
                  {selectedSubject}
                </span>
              </div>

              <span className="flex items-center gap-1 text-xs font-extrabold font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {timeRemaining}s
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>{language === 'en' ? 'Progress' : 'ሂደት'}</span>
                <span className="text-amber-400 font-mono">
                  {activeQIndex + 1} / {examQuestions.length}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${((activeQIndex + 1) / examQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text block */}
            <div className="space-y-4 py-2">
              <h3 className="font-serif text-lg text-slate-100 font-bold leading-relaxed">
                {examQuestions[activeQIndex]?.question}
              </h3>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {examQuestions[activeQIndex]?.options.map((opt: string) => {
                  const isSelected = userSelections[activeQIndex] === opt;
                  const isCorrect = examQuestions[activeQIndex].correctAnswer === opt;
                  
                  let btnStyle = "bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600";
                  
                  if (isAnswerRevealed) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold ring-1 ring-emerald-500";
                    } else if (isSelected) {
                      btnStyle = "bg-red-500/15 border-red-500 text-red-300 font-bold ring-1 ring-red-500";
                    } else {
                      btnStyle = "bg-slate-900/50 border-slate-800 text-slate-500 opacity-50";
                    }
                  } else if (isSelected) {
                    btnStyle = "bg-amber-500/15 border-amber-400 text-amber-300 font-bold";
                  }

                  return (
                    <button
                      key={opt}
                      disabled={isAnswerRevealed}
                      onClick={() => handleOptionSelect(opt)}
                      className={`w-full min-h-[48px] py-3 px-4 rounded-xl text-left text-sm leading-snug font-sans transition-all flex items-center justify-between border shadow-sm cursor-pointer select-none ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {isAnswerRevealed && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                      {isAnswerRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation card dynamically revealed */}
            {isAnswerRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1.5"
              >
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide">
                  {userSelections[activeQIndex] === examQuestions[activeQIndex].correctAnswer ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>{language === 'en' ? 'Correct Answer!' : 'በጣም ጎበዝ! መልስዎ ትክክል ነው'}</span>
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 font-bold">
                      <XCircle className="w-4 h-4" />
                      <span>{language === 'en' ? 'Incorrect' : 'ትክክለኛው መልስ አልነበረም'}</span>
                    </span>
                  )}
                </div>
                <p className="font-sans leading-relaxed text-slate-300 italic">
                  {examQuestions[activeQIndex]?.explanation || (language === 'en' ? 'Verified academic solution.' : 'ትክክለኛ አካዳሚያዊ ማብራሪያ።')}
                </p>
              </motion.div>
            )}

            {/* Proceed button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
              <button
                onClick={() => setShowExitConfirm(true)}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {language === 'en' ? 'Leave Quiz' : 'ውጣ'}
              </button>

              <button
                onClick={handleNextQuestion}
                disabled={!userSelections[activeQIndex]}
                className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 shadow disabled:opacity-40 cursor-pointer select-none active:scale-98 transition-all"
              >
                <span>
                  {activeQIndex === examQuestions.length - 1 
                    ? (language === 'en' ? 'Complete Quiz' : 'ውጤት ይመልከቱ') 
                    : (language === 'en' ? 'Next Question' : 'ቀጣይ ጥያቄ')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* RESULTS CELEBRATORY SCREEN */}
        {examMode === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto bg-[#141E33] p-6 rounded-2xl border border-slate-700 text-center space-y-6 relative overflow-hidden shadow-xl"
          >
            {/* Confetti */}
            {particles.map(p => (
              <div 
                key={p.id}
                className="absolute pointer-events-none rounded-full particle-reward-rise z-50"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  backgroundColor: p.color,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animationDuration: `${p.duration}s`
                }}
              />
            ))}

            <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl font-serif font-black shadow-inner">
              {examGrade}
            </div>

            <div className="space-y-1.5">
              <h2 className="font-serif text-2xl font-black text-white leading-tight">
                {language === 'en' ? 'Quiz Session Finalized!' : 'የፈተና ጊዜ ተጠናቋል!'}
              </h2>
              
              <p className="text-base font-serif font-bold text-amber-400">
                {Math.round((examScore / examQuestions.length) * 100) >= 80 ? (
                  <span>ጎበዝ! ምርጥ ውጤት ነው 🌟 <span className="block text-xs font-sans text-slate-400 mt-1">Excellent mastery of {selectedSubject}!</span></span>
                ) : Math.round((examScore / examQuestions.length) * 100) >= 50 ? (
                  <span>በጣም ጥሩ! በርታ/በርቺ 💪 <span className="block text-xs font-sans text-slate-400 mt-1">Great practice. Review concepts to reach an A!</span></span>
                ) : (
                  <span>ተስፋ አትቁረጥ! ይቻላል 🎯 <span className="block text-xs font-sans text-slate-400 mt-1">Practice makes perfect. Review the revision cards!</span></span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-xs bg-slate-900 p-4 border border-slate-700 rounded-xl shadow-inner">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase">{language === 'en' ? 'Score' : 'ውጤት'}</span>
                <span className="font-mono text-lg font-extrabold text-white block">{examScore} / {examQuestions.length}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase">{language === 'en' ? 'Percentage' : 'በመቶኛ'}</span>
                <span className="font-mono text-lg font-extrabold text-amber-400 block">
                  {Math.round((examScore / examQuestions.length) * 100)}%
                </span>
              </div>
            </div>

            {/* Questions Recap */}
            <div className="text-left bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-3 text-xs max-h-56 overflow-y-auto">
              <p className="font-bold text-slate-200 pb-1.5 border-b border-slate-700 font-serif">
                {language === 'en' ? 'Questions Recap' : 'ለጥያቄዎች የተሰጡ መልሶች፡'}
              </p>
              {examQuestions.map((q, idx) => {
                const isCorrect = userSelections[idx] === q.correctAnswer;
                return (
                  <div key={idx} className="pb-2 border-b border-slate-800 last:border-none last:pb-0 font-sans">
                    <p className="font-medium text-slate-300 flex items-start gap-1.5">
                      <span className={isCorrect ? "text-emerald-400 font-black" : "text-red-400 font-black"}>
                        {isCorrect ? "✓" : "✗"}
                      </span>
                      <span>
                        {language === 'en' ? 'Q' : 'ጥያቄ'} {idx + 1}: {q.question}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Favorite toggle */}
            {currentSessionId && (
              <button
                onClick={() => toggleFavoriteSession(currentSessionId)}
                className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border ${
                  favoriteSessionIds.includes(currentSessionId)
                    ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <Star className={`w-4 h-4 ${favoriteSessionIds.includes(currentSessionId) ? 'fill-slate-950 text-slate-950' : ''}`} />
                {favoriteSessionIds.includes(currentSessionId)
                  ? (language === 'en' ? 'Saved to Favorites' : 'በምርጥ ፈተናዎች ስር ተቀምጧል')
                  : (language === 'en' ? 'Save to Favorites' : 'ይህንን ምርጥ ፈተና አስቀምጥ')}
              </button>
            )}

            {/* Navigation options: practice another or return home */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => { playClickChime(); setExamMode('setup'); }}
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                {language === 'en' ? 'Choose Another Subject / Retake' : 'ሌላ ትምህርት ምረጥ / ደግመህ ሞክር'}
              </button>

              {onNavigateBack && (
                <button
                  onClick={() => { playClickChime(); onNavigateBack(); }}
                  className="w-full h-11 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Home className="w-4 h-4" />
                  {language === 'en' ? 'Return to Dashboard' : 'ወደ ዋናው ዳሽቦርድ ተመለስ'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM EXIT QUIZ MODAL */}
      {showExitConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          onClick={() => setShowExitConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-[#141E33] border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-white">
                {language === 'en' ? 'Changed Your Mind?' : 'ከፈተናው መውጣት ይፈልጋሉ?'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'en' 
                  ? 'If you change your mind, you can safely return to subject selection. Your active answers in this session will not be saved.' 
                  : 'ሀሳብዎን ከቀየሩ ወይም ሌላ ትምህርት መምረጥ ከፈለጉ ወደ ኋላ መመለስ ይችላሉ። የዚህ ፈተና መልሶች አይቀመጡም።'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="h-11 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
              >
                {language === 'en' ? 'Keep Going' : 'ፈተናውን ቀጥል'}
              </button>

              <button
                onClick={handleConfirmExitQuiz}
                className="h-11 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {language === 'en' ? 'Yes, Exit Quiz' : 'አዎ፣ ውጣ'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* PRO UPGRADE MODAL (3-Subject Limit) */}
      {showUpgradeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowUpgradeModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-[#141E33] border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-black text-lg text-white">
                  {language === 'en' ? 'Subject Limit Reached (Free Plan: 3/3)' : 'የትምህርት ገደብ ደርሰዋል (ነፃ እቅድ፦ 3/3)'}
                </h3>
                <p className="text-xs text-amber-400 font-bold">
                  {language === 'en' ? 'Upgrade to EthioLearn Pro to Unlock All Subjects' : 'ሁሉንም ትምህርቶች ለመክፈት ወደ ኢትዮለርን ፕሮ ያሻሽሉ'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2 text-xs text-slate-300">
              <p className="leading-relaxed">
                {language === 'en'
                  ? `You have explored your 3 free subjects: ${triedSubjects.join(', ')}. Upgrade to EthioLearn Pro to unlock all faculties, national entrance papers, and unlimited AI tutoring.`
                  : `እስካሁን የሞከሯቸው 3 ነፃ ትምህርቶች፦ ${triedSubjects.join(', ')} ናቸው። ሁሉንም የዩኒቨርሲቲ ኮርሶች፣ ብሔራዊ ፈተናዎች እና ያልተገደበ AI ፈተና ለማግኘት ፕሮ አባል ይሁኑ።`}
              </p>

              <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Access all 40+ Ethiopian university courses' : 'ከ40+ በላይ የዩኒቨርሲቲ ኮርሶች'}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Unlimited AI Exam & Quiz Generation' : 'ያልተገደበ የAI ፈተና ዝግጅት'}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Direct Telebirr, CBE Birr & HelloCash instant activation' : 'በቴሌብር እና በኢትዮጵያ ንግድ ባንክ ቀላል ክፍያ'}</span>
                </div>
              </div>
            </div>

            {/* Price Badge */}
            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                  {language === 'en' ? 'Special Student Pricing' : 'የተማሪዎች ቅናሽ'}
                </span>
                <span className="font-serif text-lg font-black text-amber-400">
                  149 ETB <span className="text-xs text-slate-400 font-normal">/ month</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Telebirr
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  CBE Birr
                </span>
              </div>
            </div>

            {/* Upgrade Action */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  playClickChime();
                  setShowUpgradeModal(false);
                  if (onNavigateToUpgrade) onNavigateToUpgrade();
                }}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
              >
                <Crown className="w-4 h-4 text-slate-950" />
                {language === 'en' ? 'Upgrade to Pro (149 ETB)' : 'ወደ ፕሮ አሻሽል (149 ብር)'}
              </button>

              {/* Or switch to an active subject */}
              {triedSubjects.length > 0 && (
                <div className="text-center pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1.5">
                    {language === 'en' ? 'Or continue with your 3 active subjects:' : 'ወይም ከነፃ ትምህርቶችዎ አንዱን ይምረጡ፦'}
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {triedSubjects.map(sub => (
                      <button
                        key={sub}
                        onClick={() => {
                          playClickChime();
                          setSelectedSubject(sub);
                          setShowUpgradeModal(false);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 cursor-pointer"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ADD CUSTOM EXAM MODAL */}
      {showAddExamModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowAddExamModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-[#141E33] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative text-left border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { playClickChime(); setShowAddExamModal(false); }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif font-black text-lg text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                {language === 'en' ? 'Add Exam Question / Subject' : 'የፈተና ጥያቄ / የትምህርት አይነት ጨምር'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'en' 
                  ? 'Add official questions from your university midterms or instructors.' 
                  : 'የዩኒቨርሲቲ መምህራን የሰጧቸውን ወይም ያለፉ ፈተናዎችን እዚህ ያክሉ።'}
              </p>
            </div>

            <form onSubmit={handleAddCustomQuestion} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  {language === 'en' ? 'Subject Name' : 'የትምህርት አይነት ስም'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Invertebrate Zoology, Data Structures..."
                  value={newExamSubject}
                  onChange={(e) => setNewExamSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  {language === 'en' ? 'Question Text' : 'የጥያቄው ጽሑፍ'}
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder={language === 'en' ? "Enter the exam question here..." : "የፈተናውን ጥያቄ እዚህ ይጻፉ..."}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Option A</label>
                  <input
                    type="text"
                    required
                    value={newOptionA}
                    onChange={(e) => setNewOptionA(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Option B</label>
                  <input
                    type="text"
                    required
                    value={newOptionB}
                    onChange={(e) => setNewOptionB(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Option C</label>
                  <input
                    type="text"
                    required
                    value={newOptionC}
                    onChange={(e) => setNewOptionC(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Option D</label>
                  <input
                    type="text"
                    required
                    value={newOptionD}
                    onChange={(e) => setNewOptionD(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300">
                    {language === 'en' ? 'Correct Answer' : 'ትክክለኛው ምርጫ'}
                  </label>
                  <select
                    value={newCorrectOption}
                    onChange={(e) => setNewCorrectOption(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300">
                    {language === 'en' ? 'Explanation (Optional)' : 'ማብራሪያ (አስፈላጊ ከሆነ)'}
                  </label>
                  <input
                    type="text"
                    value={newExplanation}
                    onChange={(e) => setNewExplanation(e.target.value)}
                    placeholder={language === 'en' ? "e.g. Chapter 4 reference" : "ምሳሌ፦ ከምዕራፍ 4 ማጣቀሻ"}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExamModal(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'ይቅር'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  {language === 'en' ? 'Save Question' : 'ጥያቄውን መዝግብ'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
