import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, HelpCircle, Bot, BookOpen, Clock, Activity, Check, CheckCircle, Flame, Filter, FileText, Sparkles,
  Zap, RefreshCw, AlertCircle, BookMarked, Trophy, ArrowRight, Dices, ChevronRight, MessageSquare, Search, SortAsc, X
} from 'lucide-react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { submitClaudeChat, generateQuizAI } from '../utils/ai';
import { safeStorage } from '../utils/safeStorage';

interface AIQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subjectTopic?: string;
  unitName?: string;
  userAnswer?: string;
}

const RECOMMENDED_UNITS: { [subject: string]: string[] } = {
  'Physics': [
    'Unit 1: Vectors & Mechanics',
    'Unit 2: Kinematics & Angular Acceleration',
    'Unit 3: Thermodynamics & Heat Systems',
    'Unit 4: Waves, Optics & Harmonic Oscillators',
    'Unit 5: Electromagnetism & Magnetic Fields'
  ],
  'Mathematics': [
    'Unit 1: Propositional Logic & Set Theory',
    'Unit 2: Real & Complex Numbers',
    'Unit 3: Functions, Graphs & Domain Calculations',
    'Unit 4: Limits and Continuity',
    'Unit 5: Derivatives & Critical Point Analysis',
    'Unit 6: Integrals & Area Calculations'
  ],
  'Chemistry': [
    'Unit 1: Atomic Theory & Quantum Numbers',
    'Unit 2: Periodic Trends & Quantum Mechanical configuration',
    'Unit 3: Chemical Bonding & Molecular Orbital Theory',
    'Unit 4: Stoichiometry & Chemical Equilibrium'
  ],
  'Biology': [
    'Unit 1: Cell Biology & Membrane Transport',
    'Unit 2: Genetics, DNA Transcription & Heredity',
    'Unit 3: Plant Nutrition, Photosynthesis & Ecosystems',
    'Unit 4: Human Nervous Coordination & Physiology'
  ],
  'English': [
    'Unit 1: Cohesive Devices & Sentence Transitions',
    'Unit 2: Relative Pronouns & Clauses',
    'Unit 3: Tenses & Subject-Verb Agreement',
    'Unit 4: Lexical Concord & Grammar Correction'
  ],
  'Aptitude': [
    'Unit 1: Verbal Analogies & Relationships',
    'Unit 2: Numerical Patterns & Logical Sequences',
    'Unit 3: Spacial Reasoning & Structural Conundrums'
  ],
  'Economics': [
    'Unit 1: Supply and Demand Price Elasticity',
    'Unit 2: Macroeconomics, GDP & Inflation Rates'
  ],
  'Civics': [
    'Unit 1: Constitutionalism & Rights',
    'Unit 2: Moral Philosophy & Ethical Principles'
  ],
  'Anthropology': [
    'Unit 1: Kinship & Maternal Descent Lines',
    'Unit 2: Cultural Diversity in Ethiopian Communities'
  ]
};

interface UniversityExamsProps {
  profile: StudentProfile;
  apiKey: string;
  language: 'en' | 'am';
  onNavigate: (page: string) => void;
  onStudyAction: () => void;
  onOpenInAppViewer?: (url: string, title: string) => void;
}

interface ExamPaperSheet {
  id: string;
  title: string;
  university: string;
  year: string;
  subject: string;
  questions: {
    id: number;
    qText: string;
    choices: string[];
    correctIndex: number;
    subjectTopic: string;
  }[];
}

interface CalendarEvent {
  id: string;
  month: string;
  day: string;
  title: string;
  description: string;
  daysLeft: number;
  color: string;
}

const UNIVERSITY_SHEETS: ExamPaperSheet[] = [
  // --- UNIVERSITY SUBJECTS ---
  {
    id: 'uni_math_sheet',
    title: 'Freshman Mathematics I (Math 1011) Midterm Exam',
    university: 'Addis Ababa University (AAU)',
    year: '2016 E.C.',
    subject: 'Mathematics',
    questions: [
      {
        id: 1,
        qText: 'Which of the following is equivalent to the logical proposition: ¬(p ∨ q)?',
        choices: [
          'A) ¬p ∧ ¬q',
          'B) ¬p ∨ ¬q',
          'C) p ∧ q',
          'D) ¬p → q'
        ],
        correctIndex: 0,
        subjectTopic: 'Propositional Logic & De Morgan\'s Law'
      },
      {
        id: 2,
        qText: 'Find the domain of the function f(x) = ln(x^2 - 4).',
        choices: [
          'A) (-∞, -2) ∪ (2, ∞)',
          'B) [-2, 2]',
          'C) (2, ∞)',
          'D) All real numbers except -2 and 2'
        ],
        correctIndex: 0,
        subjectTopic: 'Function Domain'
      }
    ]
  },
  {
    id: 'uni_english_sheet',
    title: 'Communicative English Skills I (FLEn 1011) Competency Test',
    university: 'Hawassa University (HU)',
    year: '2015 E.C.',
    subject: 'English',
    questions: [
      {
        id: 1,
        qText: 'Choose the sentence that demonstrates the correct use of a cohesive transitional phrase:',
        choices: [
          'A) She studied very hard; consequently, she failed the exam with terrible grades.',
          'B) He did not complete his assignment; nevertheless, the professor accepted it warmly.',
          'C) In spite of the rain was heavy, we went on a field measurement.',
          'D) Although he was sleepy, but he kept writing his research paragraph.'
        ],
        correctIndex: 1,
        subjectTopic: 'Cohesive Devices & Sentence Transitions'
      }
    ]
  },
  {
    id: 'uni_physics_sheet',
    title: 'General Physics Mechanics & Waves (Phys 1011) Term Exam',
    university: 'Adama Science & Technology University (ASTU)',
    year: '2016 E.C.',
    subject: 'Physics',
    questions: [
      {
        id: 1,
        qText: 'A fly-wheel has a constant angular acceleration of 2.0 rad/s^2. If it starts from rest, what angular displacement does it sweep in 3.0 seconds?',
        choices: [
          'A) 9.0 radians',
          'B) 6.0 radians',
          'C) 18.0 radians',
          'D) 4.5 radians'
        ],
        correctIndex: 0,
        subjectTopic: 'Rotational Kinematics'
      }
    ]
  },
  {
    id: 'uni_anthro_sheet',
    title: 'Social Anthropology (Anth 1012) Mid-Semester Exam',
    university: 'Jimma University (JU)',
    year: '2015 E.C.',
    subject: 'Anthropology',
    questions: [
      {
        id: 1,
        qText: 'According to social anthropologists, which of the following refers to a descent group formulated through links to the maternal line only?',
        choices: [
          'A) Patrilineal descent',
          'B) Matrilineal descent',
          'C) Ambilineal descent',
          'D) Bilateral descent'
        ],
        correctIndex: 1,
        subjectTopic: 'Kinship & Descent Systems'
      }
    ]
  },
  {
    id: 'uni_chemistry_sheet',
    title: 'General Chemistry I Atomic Theory (Chem 1011) Evaluation',
    university: 'Mekelle University (MU)',
    year: '2015 E.C.',
    subject: 'Chemistry',
    questions: [
      {
        id: 1,
        qText: 'What is the correct electron configuration of Chromium (Cr, Z = 24) in its ground state?',
        choices: [
          'A) [Ar] 4s^2 3d^4',
          'B) [Ar] 4s^1 3d^5',
          'C) [Ar] 4s^0 3d^6',
          'D) [Ar] 4s^2 3d^5'
        ],
        correctIndex: 1,
        subjectTopic: 'Ground State Electron Anomalies'
      }
    ]
  },
  {
    id: 'uni_logic_sheet',
    title: 'Introduction to Logic & Critical Thinking (Phil 1011) Final',
    university: 'Addis Ababa University (AAU)',
    year: '2016 E.C.',
    subject: 'Logic',
    questions: [
      {
        id: 1,
        qText: 'Identify the formal/informal fallacy: "We must re-elect the current Dean. If we do not, the entire department will disintegrate overnight into violent chaos!"',
        choices: [
          'A) Appeal to Fear (Argumentum ad Baculum)',
          'B) Appeal to the People (Argumentum ad Populum)',
          'C) Straw Man Fallacy',
          'D) Post Hoc Ergo Propter Hoc'
        ],
        correctIndex: 0,
        subjectTopic: 'Informal Fallacies'
      }
    ]
  },
  {
    id: 'uni_psych_sheet',
    title: 'General Psychology & Life Skills (Pscy 1011) Assessment',
    university: 'Arba Minch University (AMU)',
    year: '2014 E.C.',
    subject: 'Psychology',
    questions: [
      {
        id: 1,
        qText: 'In classical conditioning, what term describes the sudden reappearance of a extinguished conditioned response after a rest period has elapsed?',
        choices: [
          'A) Extinction',
          'B) Spontaneous Recovery',
          'C) Stimulus Discrimination',
          'D) Generalization Transfer'
        ],
        correctIndex: 1,
        subjectTopic: 'Classical Conditioning Principles'
      }
    ]
  },
  {
    id: 'uni_inclusive_sheet',
    title: 'Inclusiveness & Special Needs Education (Incl 1012) Worksheet',
    university: 'Bahir Dar University (BDU)',
    year: '2015 E.C.',
    subject: 'Inclusiveness',
    questions: [
      {
        id: 1,
        qText: 'Which of the following describes an environmental arrangement where all educational resources, buildings, and sites are made uniformly usable by both disabled and non-disabled scholars?',
        choices: [
          'A) Exclusive Exclusion',
          'B) Universal Design (Design for All)',
          'C) Standard Segregated Learning',
          'D) Ad-hoc Remediation'
        ],
        correctIndex: 1,
        subjectTopic: 'Universal Design for Learning'
      }
    ]
  },
  {
    id: 'uni_entrepreneur_sheet',
    title: 'Freshman Entrepreneurship (Mgmt 1012) Project Exam Paper',
    university: 'Addis Ababa University (AAU)',
    year: '2016 E.C.',
    subject: 'Entrepreneurship',
    questions: [
      {
        id: 1,
        qText: 'In a Lean Business Model Canvas, which block specifically describes the unique value that distinguishes your solution from existing competitors?',
        choices: [
          'A) Key Metrics',
          'B) Cost Structure',
          'C) Unique Value Proposition (UVP)',
          'D) Customer Segments'
        ],
        correctIndex: 2,
        subjectTopic: 'Lean Business Model Canvas'
      }
    ]
  },
  {
    id: 'uni_cpp_sheet',
    title: 'Introduction to Computer Programming with C++ (CoSc 1011)',
    university: 'Wollo University (WU)',
    year: '2015 E.C.',
    subject: 'C++',
    questions: [
      {
        id: 1,
        qText: 'What is the printed output of the following C++ code snippet?\nint x = 5;\ncout << ++x << " " << x++;',
        choices: [
          'A) 6 6',
          'B) 6 5',
          'C) 5 6',
          'D) Compiler Syntax Error'
        ],
        correctIndex: 0,
        subjectTopic: 'Prefix and Postfix Operators'
      }
    ]
  },
  {
    id: 'uni_english2_sheet',
    title: 'Writing Skills II Advanced Freshman English (FLEn 1012)',
    university: 'Bahir Dar University (BDU)',
    year: '2015 E.C.',
    subject: 'English Skill 2',
    questions: [
      {
        id: 1,
        qText: 'In academic writing, which APA citation element represents a correct direct quote formatting?',
        choices: [
          'A) According to Alemayehu (2020), "it was proved" (p. 15).',
          'B) Alemayehu says: "it was proved". 2020',
          'C) According to Alemayehu, it was proved (2020, page 15).',
          'D) Alemayehu, p. 15, 2020.'
        ],
        correctIndex: 0,
        subjectTopic: 'APA Citation Standards'
      }
    ]
  },
  {
    id: 'uni_applied_sheet',
    title: 'Applied Mathematics II (Math 1012) Integration Calculus Paper',
    university: 'Adama Science & Technology University (ASTU)',
    year: '2016 E.C.',
    subject: 'Applied Math',
    questions: [
      {
        id: 1,
        qText: 'Determine the value of the improper integral: ∫ from 1 to ∞ [ 1 / x^2 ] dx.',
        choices: [
          'A) 1',
          'B) 0',
          'C) Divergent to infinity',
          'D) -1'
        ],
        correctIndex: 0,
        subjectTopic: 'Improper Integrals and p-Series Convergence'
      }
    ]
  },
  {
    id: 'uni_bio_sheet',
    title: 'General Biology course (Biol 1011) Freshman Quiz',
    university: 'Ambo University (AU)',
    year: '2015 E.C.',
    subject: 'Biology',
    questions: [
      {
        id: 1,
        qText: 'During cellular respiration, which process occurs in the cytoplasm of the cell in the absolute absence of oxygen?',
        choices: [
          'A) Krebs Cycle',
          'B) Glycolysis',
          'C) Electron Transport Chain',
          'D) Oxidative Phosphorylation'
        ],
        correctIndex: 1,
        subjectTopic: 'Cellular Respiration'
      }
    ]
  },

  // --- GRADE 12 SUBJECTS ---
  {
    id: 'g12_math_sheet',
    title: 'National Grade 12 College Entrance Examination (Maths Section)',
    university: 'MoE Ethiopia Secondary',
    year: '2015 E.C.',
    subject: 'Mathematics',
    questions: [
      {
        id: 1,
        qText: 'Find the 20th term of an arithmetic sequence whose first term is 5 and common difference is 4.',
        choices: [
          'A) 81',
          'B) 85',
          'C) 77',
          'D) 79'
        ],
        correctIndex: 0,
        subjectTopic: 'Arithmetic Sequences'
      },
      {
        id: 2,
        qText: 'Find the derivative of f(x) = (3x - 1) / (2x + 5) with respect to x.',
        choices: [
          'A) 17 / (2x + 5)^2',
          'B) (6x - 2) / (2x + 5)^2',
          'C) 13 / (2x + 5)^2',
          'D) 3/2'
        ],
        correctIndex: 0,
        subjectTopic: 'The Quotient Rule'
      }
    ]
  },
  {
    id: 'g12_english_sheet',
    title: 'Secondary Matric Entrance Workbook in English Grammatics',
    university: 'MoE Ethiopia Secondary',
    year: '2016 E.C.',
    subject: 'English',
    questions: [
      {
        id: 1,
        qText: 'If we had left the school earlier, we ______ the Addis Ababa light rail train on time.',
        choices: [
          'A) would catch',
          'B) would have caught',
          'C) will catch',
          'D) caught'
        ],
        correctIndex: 1,
        subjectTopic: 'Third Conditional Clauses'
      }
    ]
  },
  {
    id: 'g12_physics_sheet',
    title: 'National College Entrance Physics Matric Practice',
    university: 'MoE Ethiopia Secondary',
    year: '2016 E.C.',
    subject: 'Physics',
    questions: [
      {
        id: 1,
        qText: 'What is the magnetic force on a wire of length 0.5m carrying a current of 2A placed perpendicular to a 3T uniform magnetic field?',
        choices: [
          'A) 3.0 N',
          'B) 1.5 N',
          'C) 6.0 N',
          'D) 0 N (No Force)'
        ],
        correctIndex: 0,
        subjectTopic: 'Magnetic Force on Current-Carrying Wires'
      }
    ]
  },
  {
    id: 'g12_chemistry_sheet',
    title: 'Grade 12 Chemistry National Matriculation Exam Papers',
    university: 'MoE Ethiopia Secondary',
    year: '2015 E.C.',
    subject: 'Chemistry',
    questions: [
      {
        id: 1,
        qText: 'Which of the following organic structures is recognized as an isomer of butane (C4H10)?',
        choices: [
          'A) 2-Methylpropane',
          'B) Propene',
          'C) Cyclobutane',
          'D) Pentane'
        ],
        correctIndex: 0,
        subjectTopic: 'Isomerism in Alkanes'
      }
    ]
  },
  {
    id: 'g12_biology_sheet',
    title: 'Grade 12 National Biology Certification Mock Sheet',
    university: 'MoE Ethiopia Secondary',
    year: '2015 E.C.',
    subject: 'Biology',
    questions: [
      {
        id: 1,
        qText: 'If a plant heterozygous for purple flowers (Pp) is crossed with a white-flowered plant (pp), what is the expected Mendelian genotype ratio of Pp to pp in the offspring?',
        choices: [
          'A) 1:1',
          'B) 3:1',
          'C) 1:2:1',
          'D) All purple'
        ],
        correctIndex: 0,
        subjectTopic: 'Mendelian Genetics Punnett Square'
      }
    ]
  },
  {
    id: 'g12_aptitude_sheet',
    title: 'National Grade 12 Scholastic Aptitude Exam Paper',
    university: 'MoE Ethiopia Secondary',
    year: '2016 E.C.',
    subject: 'Aptitude',
    questions: [
      {
        id: 1,
        qText: 'LIBRARIAN : BOOK :: CURE : ? (Select the correct relational analogy)',
        choices: [
          'A) DOCTOR',
          'B) PATIENT',
          'C) MEDICINE',
          'D) DISEASE'
        ],
        correctIndex: 0,
        subjectTopic: 'Verbal Analogy Relationships'
      },
      {
        id: 2,
        qText: 'Complete the pattern sequence: 2, 6, 12, 20, 30, ?',
        choices: [
          'A) 42',
          'B) 40',
          'C) 46',
          'D) 50'
        ],
        correctIndex: 0,
        subjectTopic: 'Numerical Reasoning and Sequences'
      }
    ]
  }
];

export default function UniversityExamsView({
  profile,
  apiKey,
  language,
  onNavigate,
  onStudyAction,
  onOpenInAppViewer
}: UniversityExamsProps) {
  const [activeTab, setActiveTab] = useState<'practice' | 'external' | 'ai-custom'>('practice');
  const [examCategory, setExamCategory] = useState<'all' | 'g12' | 'uni'>(() => {
    const saved = safeStorage.getItem('ethiolearn_exam_category_tab');
    return (saved === 'g12' || saved === 'uni' || saved === 'all') ? saved : 'all';
  });
  const [paperSearchQuery, setPaperSearchQuery] = useState<string>('');
  const [debouncedPaperQuery, setDebouncedPaperQuery] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [paperSortBy, setPaperSortBy] = useState<'year_desc' | 'year_asc' | 'university' | 'deadline'>('year_desc');

  // Debounce paper search query (~250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPaperQuery(paperSearchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [paperSearchQuery]);

  const handleCategoryChange = (cat: 'all' | 'g12' | 'uni') => {
    playClickChime();
    setExamCategory(cat);
    safeStorage.setItem('ethiolearn_exam_category_tab', cat);
  };

  const toggleSubjectFilter = (subj: string) => {
    playClickChime();
    setSelectedSubjects(prev => 
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    );
  };

  const availablePaperSubjects = useMemo(() => {
    return Array.from(new Set(UNIVERSITY_SHEETS.map(s => s.subject))).sort();
  }, []);

  const [selectedSheet, setSelectedSheet] = useState<ExamPaperSheet | null>(null);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(-1);
  const [userSelectedChoice, setUserSelectedChoice] = useState<number | null>(null);

  // Customizable Calendar states
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_university_calendar');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: '1',
        month: 'Hamle',
        day: '20',
        title: 'EUEE Grade 12 National University Entrance Exam',
        description: 'General and Social sciences matric papers starting across regional halls.',
        daysLeft: 15,
        color: 'indigo'
      },
      {
        id: '2',
        month: 'Nehas',
        day: '12',
        title: 'Freshman First Semester Midterm Worksheets',
        description: 'Mathematics, Physics, Communicative English, and Inclusiveness.',
        daysLeft: 37,
        color: 'purple'
      }
    ];
  });

  const [isAddingEvent, setIsAddingEvent] = useState<boolean>(false);
  const [isEditingEventId, setIsEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<{
    month: string;
    day: string;
    title: string;
    description: string;
    daysLeft: number;
    color: string;
  }>({
    month: 'Hamle',
    day: '15',
    title: '',
    description: '',
    daysLeft: 10,
    color: 'indigo'
  });

  const handleSaveEvent = () => {
    if (!eventForm.title.trim()) return;
    let updated: CalendarEvent[];
    if (isEditingEventId) {
      updated = calendarEvents.map(ev => 
        ev.id === isEditingEventId ? { ...ev, ...eventForm } : ev
      );
    } else {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        ...eventForm
      };
      updated = [...calendarEvents, newEvent];
    }
    setCalendarEvents(updated);
    safeStorage.setItem('ethiolearn_university_calendar', JSON.stringify(updated));
    setIsAddingEvent(false);
    setIsEditingEventId(null);
    setEventForm({
      month: 'Hamle',
      day: '15',
      title: '',
      description: '',
      daysLeft: 10,
      color: 'indigo'
    });
    playSuccessChime();
  };

  const handleDeleteEvent = (id: string) => {
    const updated = calendarEvents.filter(ev => ev.id !== id);
    setCalendarEvents(updated);
    safeStorage.setItem('ethiolearn_university_calendar', JSON.stringify(updated));
    playFailureChime();
  };

  const handleStartEditEvent = (ev: CalendarEvent) => {
    setIsEditingEventId(ev.id);
    setEventForm({
      month: ev.month,
      day: ev.day,
      title: ev.title,
      description: ev.description,
      daysLeft: ev.daysLeft,
      color: ev.color
    });
    setIsAddingEvent(true);
  };

  // Timed Simulation & Completed Papers state
  const [prepMode, setPrepMode] = useState<'practice' | 'simulation'>('practice');
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [simulationTimeLeft, setSimulationTimeLeft] = useState<number>(0);
  const [simulationAnswers, setSimulationAnswers] = useState<Record<number, number>>({});
  const [simulationScore, setSimulationScore] = useState<{correct: number, total: number} | null>(null);
  const [completedPapers, setCompletedPapers] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_completed_papers');
      return saved ? JSON.parse(saved) : ['uni_math_sheet'];
    } catch (e) {
      return ['uni_math_sheet'];
    }
  });

  // Automatically handle countdown timer in simulation
  useEffect(() => {
    let timer: any;
    if (isSimulationActive && simulationTimeLeft > 0) {
      timer = setInterval(() => {
        setSimulationTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsSimulationActive(false);
            // Compute simulation results on timer expire
            if (selectedSheet) {
              const correctCount = selectedSheet.questions.reduce((acc, q, idx) => {
                return acc + (simulationAnswers[idx] === q.correctIndex ? 1 : 0);
              }, 0);
              setSimulationScore({ correct: correctCount, total: selectedSheet.questions.length });
              playSuccessChime();
              
              const updated = Array.from(new Set([...completedPapers, selectedSheet.id]));
              setCompletedPapers(updated);
              safeStorage.setItem('ethiolearn_completed_papers', JSON.stringify(updated));
            }
            return 0;
          }
          return prev - 1;
        });
      } , 1000);
    }
    return () => clearInterval(timer);
  }, [isSimulationActive, simulationTimeLeft, selectedSheet, simulationAnswers, completedPapers]);
  
  // AI solver active states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiMode, setAiMode] = useState<'none' | 'solution' | 'clue'>('none');

  // AI Custom Generator States
  const [customSubject, setCustomSubject] = useState<string>('Physics');
  const [customGrade, setCustomGrade] = useState<string>('Grade 12 Matric');
  const [customUnit, setCustomUnit] = useState<string>('Unit 1: Vectors & Mechanics');
  const [customStyle, setCustomStyle] = useState<string>('units'); // matric, units, conceptual, scenario, surprise
  const [customQCount, setCustomQCount] = useState<number>(5);
  
  const [aiCustomQuestions, setAiCustomQuestions] = useState<AIQuestion[]>([]);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState<boolean>(false);
  const [customGenError, setCustomGenError] = useState<string | null>(null);
  const [currentCustomQIdx, setCurrentCustomQIdx] = useState<number>(0);
  const [customScore, setCustomScore] = useState<number | null>(null);
  const [hasSubmittedCustom, setHasSubmittedCustom] = useState<boolean>(false);
  
  // Hint states for custom prep
  const [hintLoadingMap, setHintLoadingMap] = useState<{[key: number]: boolean}>({});
  const [hintTextMap, setHintTextMap] = useState<{[key: number]: string}>({});

  // Surprise Me endless mode
  const [isSurpriseMode, setIsSurpriseMode] = useState<boolean>(false);
  const [surpriseQuestion, setSurpriseQuestion] = useState<AIQuestion | null>(null);
  const [isGeneratingSurprise, setIsGeneratingSurprise] = useState<boolean>(false);
  const [surpriseStreak, setSurpriseStreak] = useState<number>(() => {
    const saved = safeStorage.getItem('ethiolearn_surprise_streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [surpriseAnswered, setSurpriseAnswered] = useState<boolean>(false);
  const [selectedSurpriseChoice, setSelectedSurpriseChoice] = useState<string | null>(null);
  const [surpriseResultMsg, setSurpriseResultMsg] = useState<{success: boolean, text: string} | null>(null);
  const [surpriseExplainOpen, setSurpriseExplainOpen] = useState<boolean>(false);

  // Verify Pro Access
  const isEligible = profile.isPro || profile.proStatus === 'pending';

  // Automatically update suggested unit when subject changes
  useEffect(() => {
    if (RECOMMENDED_UNITS[customSubject]) {
      setCustomUnit(RECOMMENDED_UNITS[customSubject][0]);
    }
  }, [customSubject]);

  // Handler to generate custom questions via Gemini client proxy
  const generateCustomQuestions = async () => {
    playClickChime();
    setIsGeneratingCustom(true);
    setCustomGenError(null);
    setCustomScore(null);
    setHasSubmittedCustom(false);
    setAiCustomQuestions([]);
    setCurrentCustomQIdx(0);
    setHintTextMap({});
    setHintLoadingMap({});

    if (!isEligible) {
      playFailureChime();
      alert(language === 'en'
        ? "AI Custom Exam Generation requires Pro upgrade! Access custom stream-based blueprints and unlimited AI-generated unit papers."
        : "የአይ ብጁ ፈተናዎችን ማመንጨት የፕሮ አባልነት ይጠይቃል! እባክዎ አባልነቱን አግብተው ያልተገደበ ጥያቄዎች ያግኙ።");
      onNavigate('upgrade');
      setIsGeneratingCustom(false);
      return;
    }

    let styleDescription = "";
    if (customStyle === 'matric') {
      styleDescription = "Model after standard Ethiopian University Entrance Examination (EUEE) repeated patterns and common traps. Incorporate questions focusing on curriculum formulas that are frequently repeated over the last decade of matric exams.";
    } else if (customStyle === 'units') {
      styleDescription = "Focus heavily on dimensional analysis, conversion equations, standard SI units (e.g., Joules, Farads, Pascals, rad/s^2, Coulombs, cohesive transitions) and precise arithmetic results. Ensure numbers are clear and realistic.";
    } else if (customStyle === 'conceptual') {
      styleDescription = "Emphasize high-level conceptual analysis and critical reasoning. Avoid pure plug-and-play math, and ask for qualitative explanations of principles, proofs, and logical definitions.";
    } else if (customStyle === 'scenario') {
      styleDescription = "Weave in real-world Ethiopian applications and narratives (e.g. Tekeze hydro power dam vectors, Ethiopian agricultural yield ratios, local inflation rates, Amharic-English bilingual structural concord).";
    } else {
      styleDescription = "Provide a surprise mix of hard arithmetic calculations, matric repeated traps, conceptual diagrams (ASCII art if appropriate), and deep analysis.";
    }

    const customNeeds = `
Subject: ${customSubject}
Level: ${customGrade}
Target Chapter/Topic: ${customUnit}
Style Direction: ${styleDescription}
Provide a variety of questions within the scope of this curriculum. If the subject is Physics, Math or Chemistry, make sure to write formulas and units clearly.
`;

    try {
      const questions = await generateQuizAI(
        customUnit,
        customSubject,
        apiKey || "no-key",
        customStyle === 'conceptual' ? 'hard' : 'medium',
        customQCount,
        customNeeds
      );

      if (questions && questions.length > 0) {
        const formatted: AIQuestion[] = questions.map((q: any) => {
          let normalizedOptions = [...q.options];
          const prefixes = ['A)', 'B)', 'C)', 'D)'];
          normalizedOptions = normalizedOptions.map((opt, oIdx) => {
            const trimmed = opt.trim();
            if (trimmed.startsWith('A)') || trimmed.startsWith('B)') || trimmed.startsWith('C)') || trimmed.startsWith('D)')) {
              return trimmed;
            }
            return `${prefixes[oIdx]} ${trimmed}`;
          });

          let normCorrect = q.correctAnswer;
          const origIdx = q.options.findIndex((origOpt: string) => origOpt.trim() === q.correctAnswer.trim());
          if (origIdx !== -1) {
            normCorrect = normalizedOptions[origIdx];
          } else {
            const matchingIdx = normalizedOptions.findIndex(opt => opt.toLowerCase().includes(q.correctAnswer.toLowerCase()));
            if (matchingIdx !== -1) {
              normCorrect = normalizedOptions[matchingIdx];
            } else {
              normCorrect = normalizedOptions[0];
            }
          }

          return {
            question: q.question,
            options: normalizedOptions,
            correctAnswer: normCorrect,
            explanation: q.explanation,
            subjectTopic: q.subjectTopic || customUnit,
            unitName: customUnit
          };
        });

        setAiCustomQuestions(formatted);
        playSuccessChime();
        onStudyAction();
      } else {
        throw new Error("No questions were returned. Let us retry.");
      }
    } catch (err: any) {
      console.error('[AI Custom Generator Error]:', err);
      setCustomGenError(err.message || 'Failed to generate custom questions. Please check your API key and connection.');
      playFailureChime();
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleSelectCustomAnswer = (qIdx: number, choice: string) => {
    if (hasSubmittedCustom) return;
    setAiCustomQuestions(prev => {
      const updated = [...prev];
      updated[qIdx] = { ...updated[qIdx], userAnswer: choice };
      return updated;
    });
    playClickChime();
  };

  const handleSubmitCustomExam = () => {
    if (hasSubmittedCustom) return;
    
    let correctCount = 0;
    let unanswered = 0;
    
    aiCustomQuestions.forEach(q => {
      if (!q.userAnswer) {
        unanswered++;
      } else if (q.userAnswer.trim() === q.correctAnswer.trim()) {
        correctCount++;
      }
    });

    if (unanswered > 0) {
      const confirmSubmit = window.confirm(language === 'en'
        ? `You have ${unanswered} unanswered question(s). Are you sure you want to submit your exam?`
        : `ያልተመለሱ ${unanswered} ጥያቄዎች አሉ። ፈተናውን ለመጨረስ እርግጠኛ ነዎት?`);
      if (!confirmSubmit) return;
    }

    setHasSubmittedCustom(true);
    const scorePercentage = Math.round((correctCount / aiCustomQuestions.length) * 100);
    setCustomScore(scorePercentage);
    
    if (scorePercentage >= 70) {
      playSuccessChime();
    } else {
      playFailureChime();
    }
    
    const savedPerf = safeStorage.getItem('ethiolearn_quiz_perf');
    let perfObj = savedPerf ? JSON.parse(savedPerf) : {};
    perfObj[`ai_custom_${customSubject}_${Date.now()}`] = {
      subject: customSubject,
      score: scorePercentage,
      totalQ: aiCustomQuestions.length,
      correct: correctCount,
      date: new Date().toLocaleDateString()
    };
    safeStorage.setItem('ethiolearn_quiz_perf', JSON.stringify(perfObj));
  };

  const handleRequestHint = async (qIdx: number, qText: string) => {
    if (hintLoadingMap[qIdx]) return;
    
    playClickChime();
    setHintLoadingMap(prev => ({ ...prev, [qIdx]: true }));
    
    const systemPrompt = "You are Abreham, academic study advisor for EthioLearn. Give a warm, encouraging 1-2 sentence hint or conceptual principle for the exam question. Do NOT reveal the correct option index, letter, or final numerical calculation. Prompt the student to perform the final step or apply the formula.";
    const queryPrompt = `Help me with this question: "${qText}". Just give me a small hint or clue so I can solve it myself. Let's make sure physical units or relevant grammar rules are respected.`;

    try {
      const messages = [{ role: 'user' as const, content: queryPrompt }];
      let fullText = '';
      await submitClaudeChat(messages, systemPrompt, apiKey || "no-key", {
        onChunk: (chunk) => {
          fullText += chunk;
          setHintTextMap(prev => ({ ...prev, [qIdx]: fullText }));
        },
        onComplete: (completed) => {
          setHintLoadingMap(prev => ({ ...prev, [qIdx]: false }));
          setHintTextMap(prev => ({ ...prev, [qIdx]: completed }));
          playSuccessChime();
        },
        onError: (err) => {
          setHintLoadingMap(prev => ({ ...prev, [qIdx]: false }));
          setHintTextMap(prev => ({ ...prev, [qIdx]: `Could not get hint: ${err}` }));
          playFailureChime();
        }
      });
    } catch (e: any) {
      setHintLoadingMap(prev => ({ ...prev, [qIdx]: false }));
      setHintTextMap(prev => ({ ...prev, [qIdx]: `Error: ${e.message}` }));
    }
  };

  // Handler to generate surprise unlimited questions
  const generateSurpriseQuestion = async () => {
    setIsGeneratingSurprise(true);
    setSurpriseAnswered(false);
    setSelectedSurpriseChoice(null);
    setSurpriseResultMsg(null);
    setSurpriseExplainOpen(false);
    setSurpriseQuestion(null);
    setIsSurpriseMode(true);

    if (!isEligible) {
      playFailureChime();
      alert(language === 'en'
        ? "Surprise Me Endless Practice requires Pro upgrade! Take random, high-frequency matric preparation challenges."
        : "ሰርፕራይዝ ፈተና የፕሮ አባልነት ይጠይቃል! እባክዎ አባልነቱን አግብተው ተለማመዱ።");
      onNavigate('upgrade');
      setIsGeneratingSurprise(false);
      return;
    }

    const subjects = Object.keys(RECOMMENDED_UNITS);
    const randSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const randUnits = RECOMMENDED_UNITS[randSubject];
    const randUnit = randUnits[Math.floor(Math.random() * randUnits.length)];
    
    const styles = ['matric', 'units', 'conceptual', 'scenario'];
    const randStyle = styles[Math.floor(Math.random() * styles.length)];

    let styleDesc = "";
    if (randStyle === 'matric') {
      styleDesc = "Incorporate classic repeated Ethiopian matric structures and distractors.";
    } else if (randStyle === 'units') {
      styleDesc = "Include physical or mathematical units (SI units like Joules, Pascals, rad/s^2, cohesion clauses) in the answer choices.";
    } else if (randStyle === 'conceptual') {
      styleDesc = "Focus on conceptual depth, asking about underlying principles and definitions.";
    } else {
      styleDesc = "Include Ethiopian geography, agricultural or economic contexts in the question parameters.";
    }

    const customNeeds = `
Subject: ${randSubject}
Topic: ${randUnit}
Focus Style: ${styleDesc}
Ensure it is 1 single high-quality question with physical/mathematical units where appropriate, written with standard matric formatting.
`;

    try {
      const questions = await generateQuizAI(
        randUnit,
        randSubject,
        apiKey || "no-key",
        'medium',
        1,
        customNeeds
      );

      if (questions && questions.length > 0) {
        const q = questions[0];
        
        let normalizedOptions = [...q.options];
        const prefixes = ['A)', 'B)', 'C)', 'D)'];
        normalizedOptions = normalizedOptions.map((opt, oIdx) => {
          const trimmed = opt.trim();
          if (trimmed.startsWith('A)') || trimmed.startsWith('B)') || trimmed.startsWith('C)') || trimmed.startsWith('D)')) {
            return trimmed;
          }
          return `${prefixes[oIdx]} ${trimmed}`;
        });

        let normCorrect = q.correctAnswer;
        const origIdx = q.options.findIndex((origOpt: string) => origOpt.trim() === q.correctAnswer.trim());
        if (origIdx !== -1) {
          normCorrect = normalizedOptions[origIdx];
        } else {
          const matchingIdx = normalizedOptions.findIndex(opt => opt.toLowerCase().includes(q.correctAnswer.toLowerCase()));
          if (matchingIdx !== -1) {
            normCorrect = normalizedOptions[matchingIdx];
          } else {
            normCorrect = normalizedOptions[0];
          }
        }

        setSurpriseQuestion({
          question: q.question,
          options: normalizedOptions,
          correctAnswer: normCorrect,
          explanation: q.explanation,
          subjectTopic: `${randSubject} - ${randUnit}`
        });
        playSuccessChime();
        onStudyAction();
      } else {
        throw new Error("No surprise questions generated. Let us retry.");
      }
    } catch (err: any) {
      console.error('[Surprise Generator Error]:', err);
      setCustomGenError(err.message || 'Failed to generate surprise question. Please try again.');
      playFailureChime();
    } finally {
      setIsGeneratingSurprise(false);
    }
  };

  const handleSelectSurpriseChoice = (choice: string) => {
    if (surpriseAnswered) return;
    setSelectedSurpriseChoice(choice);
    playClickChime();
  };

  const handleSubmitSurpriseAnswer = () => {
    if (!surpriseQuestion || !selectedSurpriseChoice || surpriseAnswered) return;
    
    const isCorrect = selectedSurpriseChoice.trim() === surpriseQuestion.correctAnswer.trim();
    setSurpriseAnswered(true);
    
    if (isCorrect) {
      playSuccessChime();
      const nextStreak = surpriseStreak + 1;
      setSurpriseStreak(nextStreak);
      safeStorage.setItem('ethiolearn_surprise_streak', String(nextStreak));
      setSurpriseResultMsg({
        success: true,
        text: language === 'en' 
          ? "Excellent Job! Correct Answer! 🎉 You earned +15 Study Points and kept your streak alive!" 
          : "በጣም አሪፍ ነው! ትክክለኛ መልስ! 🎉 የ15 ነጥብ ሽልማት አግኝተዋል!"
      });
    } else {
      playFailureChime();
      setSurpriseStreak(0);
      safeStorage.setItem('ethiolearn_surprise_streak', '0');
      setSurpriseResultMsg({
        success: false,
        text: language === 'en'
          ? `Incorrect choice. The right answer was: ${surpriseQuestion.correctAnswer}. Study the AI steps below to master this concept!`
          : `መልሱ አልተገኘም። ትክክለኛው መልስ፡ ${surpriseQuestion.correctAnswer} ነው። ለማስተር በታች ያለውን ማብራሪያ ይዩ።`
      });
    }
  };

  const getPaperDeadlineEvent = (sheet: ExamPaperSheet): CalendarEvent | null => {
    const sheetSubj = sheet.subject.toLowerCase();
    const sheetUni = sheet.university.toLowerCase();
    const isG12 = sheet.id.startsWith('g12');

    return calendarEvents.find(ev => {
      const title = ev.title.toLowerCase();
      const desc = ev.description.toLowerCase();
      if (title.includes(sheetSubj) || desc.includes(sheetSubj)) return true;
      if (sheetUni !== 'moe ethiopia secondary' && (title.includes(sheetUni) || desc.includes(sheetUni))) return true;
      if (isG12 && (title.includes('euee') || title.includes('grade 12') || title.includes('entrance'))) return true;
      return false;
    }) || null;
  };

  const filteredSheets = useMemo(() => {
    return UNIVERSITY_SHEETS.filter(sheet => {
      // 1. Level tab filter
      if (examCategory === 'g12' && !sheet.id.startsWith('g12')) return false;
      if (examCategory === 'uni' && !sheet.id.startsWith('uni')) return false;

      // 2. Subject chips filter (AND)
      if (selectedSubjects.length > 0 && !selectedSubjects.includes(sheet.subject)) {
        return false;
      }

      // 3. Search query filter (AND)
      const q = debouncedPaperQuery.trim().toLowerCase();
      if (q) {
        const matchesTitle = sheet.title.toLowerCase().includes(q);
        const matchesSubject = sheet.subject.toLowerCase().includes(q);
        const matchesUni = sheet.university.toLowerCase().includes(q);
        const matchesYear = sheet.year.toLowerCase().includes(q);
        const matchesTopic = sheet.questions.some(qItem => 
          qItem.qText.toLowerCase().includes(q) || qItem.subjectTopic.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesSubject && !matchesUni && !matchesYear && !matchesTopic) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (paperSortBy === 'year_desc') {
        return b.year.localeCompare(a.year);
      }
      if (paperSortBy === 'year_asc') {
        return a.year.localeCompare(b.year);
      }
      if (paperSortBy === 'university') {
        return a.university.localeCompare(b.university);
      }
      if (paperSortBy === 'deadline') {
        const eventA = getPaperDeadlineEvent(a);
        const eventB = getPaperDeadlineEvent(b);
        const daysA = eventA ? eventA.daysLeft : 999;
        const daysB = eventB ? eventB.daysLeft : 999;
        return daysA - daysB;
      }
      return 0;
    });
  }, [examCategory, selectedSubjects, debouncedPaperQuery, paperSortBy, calendarEvents]);

  const handleSelectSheet = (sheet: ExamPaperSheet) => {
    playClickChime();
    setSelectedSheet(sheet);
    setSelectedQuestionIdx(0);
    setUserSelectedChoice(null);
    setAiResult('');
    setAiMode('none');

    // Smoothly scroll the selected exam questionnaire workspace into active view on mobile/tablet viewports
    setTimeout(() => {
      const viewer = document.getElementById('exam-viewer-section');
      if (viewer) {
        viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleSelectQuestion = (idx: number) => {
    playClickChime();
    setSelectedQuestionIdx(idx);
    setUserSelectedChoice(null);
    setAiResult('');
    setAiMode('none');
  };

  // Process AI solver action
  const handleAISolve = async (solveMode: 'solution' | 'clue') => {
    if (!selectedSheet || selectedQuestionIdx === -1) return;
    
    // Check eligibility
    if (!isEligible) {
      playFailureChime();
      alert(language === 'en'
        ? "University Past Exam Solver requires Pro upgrade! Access past exam papers with step-by-step AI solvers."
        : "የዩኒቨርሲቲ ፈተና መፍቻ የፕሮ አባልነት ይጠይቃል! እባክዎ አባልነቱን አግብተው ሙሉውን ደረጃ በደረጃ ማብራሪያ ያግኙ።");
      onNavigate('upgrade');
      return;
    }

    setAiMode(solveMode);
    setAiLoading(true);
    setAiResult('');
    playClickChime();

    const currentQ = selectedSheet.questions[selectedQuestionIdx];
    const systemPrompt = solveMode === 'solution'
      ? "You are a master scientific professor at Addis Ababa University. You break down complex physical or mathematical equations into steps, stating all formulas and principles clearly."
      : "You are a helpful study tutor that gives conceptual guidelines or core hints. You do NOT give away the exact final numerical answer, but teach them how to get there.";

    const queryPrompt = solveMode === 'solution'
      ? `Provide a step-by-step, elite resolution for this typical Freshman exam question from the ${selectedSheet.university} - ${selectedSheet.title}:
Question: "${currentQ.qText}"
Options:
${currentQ.choices.map((c, i) => `${i + 1}. ${c}`).join('\n')}
Correct Option Index: ${currentQ.correctIndex}

Highlight:
1. Core formula/standard rule used (e.g. L’Hopital’s rule, Quotient rule).
2. Step-by-step mathematical substitution or logical syntax analysis.
3. Why option ${currentQ.correctIndex + 1} is correct and why other options are common matric distractors.
Include brief explanations in Amharic where it makes formulas easier to conceptualize.`
      : `Provide a quick study clue and mathematical hint for this exam question:
Question: "${currentQ.qText}"
Options:
${currentQ.choices.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Guide me on how to approach this. Give me the primary formula but let me do the final numerical arithmetic!`;

    try {
      const messages = [{ role: 'user' as const, content: queryPrompt }];
      await submitClaudeChat(messages, systemPrompt, apiKey || "no-key", {
        onChunk: (chunk) => {
          setAiResult(prev => prev + chunk);
        },
        onComplete: (fullText) => {
          setAiLoading(false);
          setAiResult(fullText);
          playSuccessChime();
          onStudyAction();
        },
        onError: (err) => {
          setAiLoading(false);
          setAiResult(`Failed to communicate with AI solver: ${err}`);
          playFailureChime();
        }
      });
    } catch (e: any) {
      setAiLoading(false);
      setAiResult(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-650 animate-ping inline-block" />
            <h2 className="text-xl md:text-2xl font-serif font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
              <Award className="w-6 h-6 text-indigo-600" />
              {language === 'en' ? 'Freshman & University Exams Hub' : 'የዩኒቨርሲቲ ፈተናዎች ማዕከል'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans">
            {language === 'en'
              ? 'Access past midterm & final exam worksheets from AAU, ASTU, and BDU. Use the step-by-step AI Solver to simplify complex tasks.'
              : 'የአዲስ አበባ ዩኒቨርሲቲ (AAU)፣ የአዳማ (ASTU) እና ባህር ዳር (BDU) የፈተና ጥያቄዎችን ከአይ ፈጣን መፍቻ ጋር ተለማመዱ።'}
          </p>
        </div>

        {!isEligible && (
          <button
            onClick={() => { playClickChime(); onNavigate('upgrade'); }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-[#C8962E] hover:from-amber-600 hover:to-[#B28224] text-black font-bold text-xs rounded-xl shadow cursor-pointer uppercase tracking-wider flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-950 animate-pulse" />
            <span>Unlock AI Solver</span>
          </button>
        )}
      </div>

      {/* EXAMS IDENTITY BOARD: CALENDAR & PROGRESS TRACKER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 select-none">
        {/* Timeline Calendar */}
        <div className="md:col-span-7 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-150 dark:border-indigo-500/20 p-4 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <span>📅</span> {language === 'en' ? 'Ethiopian National Exams & University Calendar' : 'የኢትዮጵያ ብሔራዊ ፈተናዎች እና የዩኒቨርሲቲ ካላንደር'}
            </h4>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playClickChime();
                  setIsEditingEventId(null);
                  setEventForm({
                    month: 'Hamle',
                    day: '15',
                    title: '',
                    description: '',
                    daysLeft: 10,
                    color: 'indigo'
                  });
                  setIsAddingEvent(!isAddingEvent);
                }}
                className="text-[9px] font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded transition-colors cursor-pointer"
              >
                {isAddingEvent ? (language === 'en' ? 'Close' : 'ዝጋ') : `+ ${language === 'en' ? 'Custom' : 'ብጁ'}`}
              </button>
            </div>
          </div>

          {isAddingEvent && (
            <div className="bg-white/95 dark:bg-[#0c0d12]/95 border border-indigo-100 dark:border-zinc-850 p-3.5 rounded-xl space-y-3 font-sans text-xs">
              <h5 className="font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1">
                <span>⚡</span> {isEditingEventId ? (language === 'en' ? 'Edit Calendar Event' : 'ካላንደር ቀይር') : (language === 'en' ? 'Add Custom Calendar Event' : 'አዲስ የካላንደር መርሃግብር ጨምር')}
              </h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Month (ወር)</label>
                  <input
                    type="text"
                    value={eventForm.month}
                    onChange={(e) => setEventForm({ ...eventForm, month: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-zinc-100 font-bold"
                    placeholder="e.g. Hamle"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Day (ቀን)</label>
                  <input
                    type="text"
                    value={eventForm.day}
                    onChange={(e) => setEventForm({ ...eventForm, day: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-zinc-100 font-bold"
                    placeholder="e.g. 20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Event Title (ርዕስ)</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-zinc-100 font-semibold"
                  placeholder="e.g. Social sciences entrance exam"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Description (ዝርዝር ማብራሪያ)</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-zinc-100"
                  placeholder="e.g. Grade 12 matric final examinations across centers"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Days Left (የቀሩት ቀናት)</label>
                  <input
                    type="number"
                    value={eventForm.daysLeft}
                    onChange={(e) => setEventForm({ ...eventForm, daysLeft: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-zinc-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Badge Color (ቀለም)</label>
                  <select
                    value={eventForm.color}
                    onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-zinc-100 font-bold"
                  >
                    <option value="indigo">Indigo (ሰማያዊ)</option>
                    <option value="purple">Purple (ሐምራዊ)</option>
                    <option value="rose">Rose (ቀይ)</option>
                    <option value="emerald">Emerald (አረንጓዴ)</option>
                    <option value="amber">Amber (ቢጫ)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { playClickChime(); setIsAddingEvent(false); }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-zinc-400 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold"
                >
                  {language === 'en' ? 'Cancel' : 'ሰርዝ'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvent}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black uppercase"
                >
                  {language === 'en' ? 'Save Event' : 'አስቀምጥ'}
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
            {calendarEvents.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-zinc-500 text-xs">
                {language === 'en' ? 'No items in calendar. Add a custom entry above!' : 'በካላንደር ውስጥ ምንም መርሃግብር የለም። ከላይ ይጨምሩ!'}
              </div>
            ) : (
              calendarEvents.map((ev) => {
                const badgeColorMap: Record<string, string> = {
                  indigo: 'bg-indigo-500',
                  purple: 'bg-purple-500',
                  rose: 'bg-rose-500',
                  emerald: 'bg-emerald-500',
                  amber: 'bg-amber-500'
                };
                
                const textColorMap: Record<string, string> = {
                  indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
                  purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40',
                  rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
                  emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
                  amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                };

                const currentBadgeColor = badgeColorMap[ev.color] || 'bg-indigo-500';
                const currentTextColor = textColorMap[ev.color] || 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40';

                return (
                  <div key={ev.id} className="flex items-start gap-3 bg-white/70 dark:bg-[#121a2e]/70 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700 transition-colors group">
                    <div className={`w-10 h-10 rounded-lg ${currentBadgeColor} text-white flex flex-col items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                      <span className="text-[8px] uppercase font-semibold">{ev.month}</span>
                      <span className="leading-none text-xs font-black">{ev.day}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-[11px] text-slate-800 dark:text-zinc-100 truncate flex-1">
                          {ev.title}
                        </h5>
                      </div>
                      <p className="text-[9.5px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                        {ev.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${currentTextColor}`}>
                        {ev.daysLeft} {language === 'en' ? 'Days Left' : 'ቀን ይቀራል'}
                      </span>
                      
                      {/* Edit/Delete controls */}
                      <div className="flex items-center gap-1 opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => { playClickChime(); handleStartEditEvent(ev); }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-all cursor-pointer"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => { playClickChime(); handleDeleteEvent(ev.id); }}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-red-500 hover:text-red-700 transition-all cursor-pointer"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Progress Board */}
        <div className="md:col-span-5 bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>📊</span> {language === 'en' ? 'Matric Prep Subject Progress' : 'የፈተና ዝግጅት የትምህርት እድገት'}
            </h4>
            <p className="text-[9.5px] text-slate-400 dark:text-zinc-500 mt-0.5">
              Completed papers: <span className="font-bold font-mono text-indigo-500">{completedPapers.length} completed</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1.5">
            {/* Subject 1: Mathematics */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold">
                <span className="text-slate-700 dark:text-zinc-300">📐 Mathematics</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                  {completedPapers.includes('uni_math_sheet') ? '100%' : '50%'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: completedPapers.includes('uni_math_sheet') ? '100%' : '50%' }} />
              </div>
            </div>

            {/* Subject 2: Physics */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold">
                <span className="text-slate-700 dark:text-zinc-300">⚡ Physics</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono">
                  {completedPapers.includes('uni_physics_sheet') ? '100%' : '50%'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: completedPapers.includes('uni_physics_sheet') ? '100%' : '50%' }} />
              </div>
            </div>

            {/* Subject 3: Chemistry */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold">
                <span className="text-slate-700 dark:text-zinc-300">🧪 Chemistry</span>
                <span className="text-teal-600 dark:text-teal-400 font-mono">
                  {completedPapers.includes('uni_chemistry_sheet') ? '100%' : '25%'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full" style={{ width: completedPapers.includes('uni_chemistry_sheet') ? '100%' : '25%' }} />
              </div>
            </div>

            {/* Subject 4: English */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold">
                <span className="text-slate-700 dark:text-zinc-300">💬 English</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {completedPapers.includes('uni_english_sheet') ? '100%' : '40%'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: completedPapers.includes('uni_english_sheet') ? '100%' : '40%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation for Practice Sheets, Curriculum Exam Compiler, and External National EUEE Hub */}
      <div className="flex flex-wrap bg-slate-950 border border-slate-800 p-1 rounded-2xl max-w-2xl select-none font-sans gap-1">
        <button
          onClick={() => { playClickChime(); setActiveTab('practice'); }}
          className={`flex-1 min-w-[120px] py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center ${
            activeTab === 'practice'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {language === 'en' ? 'Practice Sheets' : 'ተግባራዊ ፈተናዎች'}
        </button>
        <button
          onClick={() => { playClickChime(); setActiveTab('ai-custom'); }}
          className={`flex-1 min-w-[150px] py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'ai-custom'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5 text-slate-950" />
          <span>{language === 'en' ? 'Board Exam Compiler' : 'የብሔራዊ ፈተና ማጠናከሪያ'}</span>
        </button>
        <button
          onClick={() => { playClickChime(); setActiveTab('external'); }}
          className={`flex-1 min-w-[150px] py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'external'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🌐</span>
          <span>{language === 'en' ? 'National Exams Hub' : 'የብሔራዊ ፈተናዎች'}</span>
        </button>
      </div>

      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: list of past university exam papers (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl sticky top-2 z-20 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                {language === 'en' ? 'Select Available Papers:' : 'ያሉትን ፈተናዎች ይምረጡ፡'}
              </h3>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {filteredSheets.length} {filteredSheets.length === 1 ? 'paper' : 'papers'}
              </span>
            </div>

            {/* Live Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={paperSearchQuery}
                onChange={(e) => setPaperSearchQuery(e.target.value)}
                placeholder={language === 'en' ? 'Search subject, course code, university...' : 'በትምህርት አይነት፣ ዩኒቨርሲቲ ይፈልጉ...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[40px]"
              />
              {paperSearchQuery && (
                <button
                  onClick={() => setPaperSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Level Tabs: All / Grade 12 / University */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl text-center text-[10.5px] select-none border border-slate-800">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`py-2 px-1 rounded-lg font-bold transition-all cursor-pointer min-h-[38px] ${
                  examCategory === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'en' ? 'All' : 'ሁሉም'}
              </button>
              <button
                onClick={() => handleCategoryChange('g12')}
                className={`py-2 px-1 rounded-lg font-bold transition-all cursor-pointer min-h-[38px] ${
                  examCategory === 'g12'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'en' ? 'Grade 12' : '12ኛ ክፍል'}
              </button>
              <button
                onClick={() => handleCategoryChange('uni')}
                className={`py-2 px-1 rounded-lg font-bold transition-all cursor-pointer min-h-[38px] ${
                  examCategory === 'uni'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'en' ? 'University' : 'ዩኒቨርሲቲ'}
              </button>
            </div>

            {/* Subject Filter Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <span>Subjects:</span>
                {selectedSubjects.length > 0 && (
                  <button
                    onClick={() => { playClickChime(); setSelectedSubjects([]); }}
                    className="text-indigo-500 hover:underline cursor-pointer lowercase"
                  >
                    clear ({selectedSubjects.length})
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => { playClickChime(); setSelectedSubjects([]); }}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition-all shrink-0 cursor-pointer min-h-[36px] ${
                    selectedSubjects.length === 0
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  All
                </button>
                {availablePaperSubjects.map((subj) => {
                  const isSelected = selectedSubjects.includes(subj);
                  return (
                    <button
                      key={subj}
                      onClick={() => toggleSubjectFilter(subj)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition-all shrink-0 cursor-pointer min-h-[36px] border ${
                        isSelected
                          ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:border-purple-500/50'
                      }`}
                    >
                      {subj}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Control */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800 text-[10.5px]">
              <span className="font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <SortAsc className="w-3 h-3" /> Sort by:
              </span>
              <select
                value={paperSortBy}
                onChange={(e) => { playClickChime(); setPaperSortBy(e.target.value as any); }}
                className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1 font-bold text-slate-700 dark:text-zinc-200 cursor-pointer focus:outline-none"
              >
                <option value="year_desc">Year (Newest → Oldest)</option>
                <option value="year_asc">Year (Oldest → Newest)</option>
                <option value="university">University Name</option>
                <option value="deadline">Closest Exam Deadline</option>
              </select>
            </div>

            {/* Paper Cards List */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredSheets.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-4">
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                    {language === 'en' ? 'No exam papers match your active search or filters.' : 'ከተመረጠው ማጣሪያ ጋር የሚስማማ ፈተና አልተገኘም።'}
                  </p>
                  <button
                    onClick={() => {
                      setPaperSearchQuery('');
                      setSelectedSubjects([]);
                      setExamCategory('all');
                      safeStorage.setItem('ethiolearn_exam_category_tab', 'all');
                    }}
                    className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer min-h-[36px]"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredSheets.map(sheet => {
                  const isSheetActive = selectedSheet?.id === sheet.id;
                  const isCompleted = completedPapers.includes(sheet.id);
                  const deadlineEvent = getPaperDeadlineEvent(sheet);

                  return (
                    <div
                      key={sheet.id}
                      onClick={() => handleSelectSheet(sheet)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative min-h-[80px] ${
                        isSheetActive
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-500 font-bold shadow-md'
                          : 'border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/40 hover:border-indigo-500/50 hover:bg-slate-100/60 dark:hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-1.5 mb-1.5">
                        <span className="text-[8.5px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded leading-none">
                          {sheet.subject}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Inline Progress Badge */}
                          {isCompleted && (
                            <span className="text-[8.5px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1 leading-none">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-500" /> Done
                            </span>
                          )}

                          {/* Deadline Countdown Badge */}
                          {deadlineEvent && (
                            <span className="text-[8.5px] font-black uppercase text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1 leading-none">
                              ⏳ {deadlineEvent.daysLeft}d Left
                            </span>
                          )}

                          <span className="text-[9.5px] text-zinc-400 font-mono italic">{sheet.year}</span>
                        </div>
                      </div>

                      <h4 className="text-[11.5px] font-serif font-black text-slate-800 dark:text-zinc-150 leading-tight">
                        {sheet.title}
                      </h4>

                      <div className="flex items-center justify-between mt-1.5 text-[9.5px] text-slate-400 font-mono tracking-wide">
                        <span>🏛️ {sheet.university}</span>
                        {isSheetActive && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-sans font-extrabold text-[9px] uppercase tracking-widest flex items-center gap-1 animate-pulse">
                            Active in Solver &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: active sheet workspace & question display (8 cols) */}
        <div id="exam-viewer-section" className="lg:col-span-8 space-y-6">
          {selectedSheet ? (
            <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-6 rounded-2xl shadow-sm space-y-5">
              
              {/* Sheet header */}
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-[#078930] bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                    {selectedSheet.university}
                  </span>
                  <h3 className="text-base font-serif font-black text-slate-805 dark:text-zinc-100 mt-1.5 leading-tight">
                    {selectedSheet.title}
                  </h3>
                </div>

                {/* Completed status indicator badge */}
                {completedPapers.includes(selectedSheet.id) && (
                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-indigo-650" /> Completed
                  </span>
                )}
              </div>

              {/* Mode Selection Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-150 dark:border-zinc-800 gap-3 select-none">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛠️</span>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                      {language === 'en' ? 'Select Preparation Mode:' : 'የዝግጅት ሁነታን ይምረጡ፡'}
                    </h4>
                    <p className="text-[9.5px] text-slate-400">
                      {prepMode === 'practice' 
                        ? (language === 'en' ? 'Study mode with immediate feedback & AI Solver.' : 'ወዲያውኑ መልስ እና አይ ረዳት የሚገኝበት የጥናት ሁነታ።')
                        : (language === 'en' ? 'Exam room mode with 1-min countdown clock per question.' : 'በእያንዳንዱ ጥያቄ 1 ደቂቃ የጊዜ ገደብ ያለው የፈተና ክፍል ሁነታ።')
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-1.5 shrink-0 bg-slate-200/60 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-slate-300/40">
                  <button
                    onClick={() => {
                      playClickChime();
                      setPrepMode('practice');
                      setIsSimulationActive(false);
                      setSimulationScore(null);
                      setSimulationAnswers({});
                      setUserSelectedChoice(null);
                    }}
                    disabled={isSimulationActive}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      prepMode === 'practice'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-40'
                    }`}
                  >
                    🔍 {language === 'en' ? 'Practice' : 'መለማመጃ'}
                  </button>
                  <button
                    onClick={() => {
                      playClickChime();
                      setPrepMode('simulation');
                      setUserSelectedChoice(null);
                    }}
                    disabled={isSimulationActive}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      prepMode === 'simulation'
                        ? 'bg-[#B22222] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-40'
                    }`}
                  >
                    ⏱️ {language === 'en' ? 'Simulation' : 'ሲሙሌሽን'}
                  </button>
                </div>
              </div>

              {/* 1. TIMED SIMULATION NOT ACTIVE VIEW */}
              {prepMode === 'simulation' && !isSimulationActive && !simulationScore && (
                <div className="p-6 bg-rose-500/5 dark:bg-rose-950/10 border-2 border-dashed border-rose-400/40 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl">
                    ⏱️
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-sm text-slate-800 dark:text-zinc-100">
                      {language === 'en' ? 'Ready for Exam Hall Simulation?' : 'ለሲሙሌሽን ፈተና ዝግጁ ነዎት?'}
                    </h4>
                    <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                      {language === 'en' 
                        ? 'You will have 1 minute per question. Immediate feedback is disabled, and your report card will be calculated on submit or timeout.'
                        : 'በእያንዳንዱ ጥያቄ 1 ደቂቃ ያገኛሉ። ፈጣን መልሶች አይታዩም፣ ሲጨርሱ ወይም ሰዓቱ ሲያልቅ ውጤትዎ ይሰላል።'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      playClickChime();
                      setIsSimulationActive(true);
                      setSimulationTimeLeft(selectedSheet.questions.length * 60);
                      setSimulationAnswers({});
                      setSimulationScore(null);
                      setSelectedQuestionIdx(0);
                    }}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                  >
                    {language === 'en' ? 'Start Simulation' : 'ሲሙሌሽን ጀምር'}
                  </button>
                </div>
              )}

              {/* 2. TIMED SIMULATION SCORE CARD VIEW */}
              {prepMode === 'simulation' && simulationScore && (
                <div className="p-6 bg-indigo-500/5 border border-indigo-250 dark:border-indigo-500/30 rounded-2xl text-center space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-2xl">
                    🎓
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-sm text-indigo-700 dark:text-indigo-400">
                      {language === 'en' ? 'Simulation Completed!' : 'ሲሙሌሽን ተጠናቋል!'}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {selectedSheet.title}
                    </p>
                  </div>
                  
                  <div className="inline-block p-4 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Your Score:</span>
                    <span className="text-3xl font-black font-serif text-slate-800 dark:text-zinc-100">
                      {simulationScore.correct} <span className="text-sm font-normal text-slate-400">/ {simulationScore.total}</span>
                    </span>
                    <span className="text-xs font-bold text-[#078930] block mt-1">
                      {Math.round((simulationScore.correct / simulationScore.total) * 100)}% Accuracy
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    {simulationScore.correct === simulationScore.total 
                      ? "🏆 Flawless performance! You're ready to teach this course!"
                      : "📖 Good effort. Click the button below to retry or switch to Practice mode to review the detailed AI formulas."
                    }
                  </p>

                  <div className="flex justify-center gap-2.5 pt-1.5">
                    <button
                      onClick={() => {
                        playClickChime();
                        setSimulationScore(null);
                        setPrepMode('practice');
                      }}
                      className="px-4 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-200 font-bold text-[10px] uppercase rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      🔍 {language === 'en' ? 'Review Questions' : 'ጥያቄዎችን ገምግም'}
                    </button>
                    <button
                      onClick={() => {
                        playClickChime();
                        setSimulationScore(null);
                        setIsSimulationActive(true);
                        setSimulationTimeLeft(selectedSheet.questions.length * 60);
                        setSimulationAnswers({});
                        setSelectedQuestionIdx(0);
                      }}
                      className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      🔄 {language === 'en' ? 'Retry Exam' : 'እንደገና ሞክር'}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. ACTIVE STUDY OR LIVE SIMULATION FLOW */}
              {((prepMode === 'practice') || (prepMode === 'simulation' && isSimulationActive)) && (
                <>
                  {/* Countdown timer banner inside active simulation */}
                  {prepMode === 'simulation' && isSimulationActive && (
                    <div className="flex items-center justify-between bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300/40 p-3 rounded-xl select-none animate-pulse">
                      <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-4 h-4 shrink-0 animate-spin" />
                        {language === 'en' ? 'SIMULATION TIMER RUNNING' : 'የሲሙሌሽን ሰዓት በመቁጠር ላይ'}
                      </span>
                      <span className="font-mono font-black text-sm">
                        {Math.floor(simulationTimeLeft / 60)}:{(simulationTimeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {/* Step: Questions list selector inside sheet */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Questions in this paper:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSheet.questions.map((q, idx) => {
                        const isQActive = selectedQuestionIdx === idx;
                        const isAnsweredInSim = prepMode === 'simulation' && simulationAnswers[idx] !== undefined;
                        
                        return (
                          <button
                            key={q.id}
                            onClick={() => handleSelectQuestion(idx)}
                            className={`w-10 h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isQActive
                                ? 'bg-indigo-650 border-indigo-650 text-white shadow-md'
                                : isAnsweredInSim
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20'
                                : 'bg-slate-50 border-slate-100 hover:border-slate-350 text-slate-650 dark:bg-zinc-900/40 dark:border-zinc-800'
                            }`}
                          >
                            Q{idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

              {/* Selected question detail layout */}
              {selectedQuestionIdx !== -1 && (
                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span className="uppercase font-bold text-indigo-705">Topic: {selectedSheet.questions[selectedQuestionIdx].subjectTopic}</span>
                    <span>Entrance / Freshman Coursework</span>
                  </div>

                  <div className="font-serif font-black text-sm text-slate-800 dark:text-zinc-100 leading-snug p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-150">
                    {selectedSheet.questions[selectedQuestionIdx].qText}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedSheet.questions[selectedQuestionIdx].choices.map((choice, i) => {
                      let isSelected = false;
                      let isCorrect = false;

                      if (prepMode === 'simulation') {
                        isSelected = simulationAnswers[selectedQuestionIdx] === i;
                      } else {
                        isSelected = userSelectedChoice === i;
                        isCorrect = i === selectedSheet.questions[selectedQuestionIdx].correctIndex;
                      }

                      let cStyle = 'border-slate-150 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-slate-750 hover:bg-slate-50';
                      
                      if (prepMode === 'simulation') {
                        if (isSelected) {
                          cStyle = 'border-indigo-650 bg-indigo-50 dark:bg-indigo-950/25 text-indigo-800 dark:text-indigo-400 font-bold';
                        }
                      } else {
                        if (userSelectedChoice !== null) {
                          if (isCorrect) {
                            cStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-805 font-bold';
                          } else if (isSelected) {
                            cStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-805';
                          } else {
                            cStyle = 'opacity-50 border-slate-100 dark:border-zinc-805';
                          }
                        }
                      }

                      return (
                        <button
                          key={i}
                          disabled={prepMode === 'practice' && userSelectedChoice !== null}
                          onClick={() => { 
                            playClickChime(); 
                            if (prepMode === 'simulation') {
                              setSimulationAnswers(prev => ({ ...prev, [selectedQuestionIdx]: i }));
                            } else {
                              setUserSelectedChoice(i); 
                            }
                          }}
                          className={`px-4 py-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${cStyle}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  {/* Immediate feedback (Only in Practice Mode) */}
                  {prepMode === 'practice' && userSelectedChoice !== null && (
                    <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl text-xs flex justify-between items-center select-none border">
                      <span className="text-slate-500 dark:text-zinc-400">
                        {userSelectedChoice === selectedSheet.questions[selectedQuestionIdx].correctIndex 
                          ? '✅ CORRECT ANSWER! Well done.' 
                          : '❌ INCORRECT! Learn the steps first.'}
                      </span>
                      <button 
                        onClick={() => { playClickChime(); setUserSelectedChoice(null); }}
                        className="text-[10px] text-[#078930] font-black uppercase hover:underline cursor-pointer"
                      >
                        Reset Choice
                      </button>
                    </div>
                  )}

                  {/* Navigation controls (Only in Simulation Mode) */}
                  {prepMode === 'simulation' && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-150 dark:border-zinc-800">
                      <span className="text-[10.5px] text-slate-400 font-mono">
                        Question {selectedQuestionIdx + 1} of {selectedSheet.questions.length}
                      </span>
                      <div className="flex gap-2">
                        {selectedQuestionIdx > 0 && (
                          <button
                            onClick={() => { playClickChime(); setSelectedQuestionIdx(prev => prev - 1); }}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold uppercase rounded-lg text-slate-600 dark:text-zinc-300 cursor-pointer"
                          >
                            &larr; Prev
                          </button>
                        )}
                        {selectedQuestionIdx < selectedSheet.questions.length - 1 ? (
                          <button
                            onClick={() => { playClickChime(); setSelectedQuestionIdx(prev => prev + 1); }}
                            className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase rounded-lg cursor-pointer"
                          >
                            Next &rarr;
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              playClickChime();
                              setIsSimulationActive(false);
                              // Calculate score
                              const correctCount = selectedSheet.questions.reduce((acc, q, idx) => {
                                return acc + (simulationAnswers[idx] === q.correctIndex ? 1 : 0);
                              }, 0);
                              setSimulationScore({ correct: correctCount, total: selectedSheet.questions.length });
                              playSuccessChime();
                              
                              const updated = Array.from(new Set([...completedPapers, selectedSheet.id]));
                              setCompletedPapers(updated);
                              safeStorage.setItem('ethiolearn_completed_papers', JSON.stringify(updated));
                            }}
                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow-md cursor-pointer animate-pulse"
                          >
                            Finish Exam 🏁
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Copilot solvers block (Only in Practice Mode) */}
                  {prepMode === 'practice' && (
                    <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">&rarr; Active past paper AI integrations:</p>
                      
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => handleAISolve('clue')}
                          disabled={aiLoading}
                          className="px-4.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl text-xs font-bold uppercase transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4 shrink-0" />
                          <span>Get Analytical Hint</span>
                        </button>
                        <button
                          onClick={() => handleAISolve('solution')}
                          disabled={aiLoading}
                          className="px-4.5 py-2.5 bg-[#078930] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                        >
                          <Bot className="w-4 h-4 shrink-0" />
                          <span>Step-by-Step AI Solver</span>
                        </button>
                      </div>

                      {/* AI explanation readout container */}
                      <AnimatePresence mode="wait">
                        {aiLoading && (
                          <div className="flex flex-col items-center justify-center py-8 space-y-2">
                            <div className="w-8 h-8 rounded-full border-2 border-indigo-650 border-t-transparent animate-spin" />
                            <p className="text-[11px] text-slate-400 font-mono animate-pulse">Computing symbolic integrations, mapping concord rules...</p>
                          </div>
                        )}

                        {!aiLoading && aiResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                          >
                            <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 px-3 py-2 rounded-xl text-indigo-705 dark:text-indigo-405 text-xs font-bold font-mono">
                              <span>👨‍💻 {aiMode === 'solution' ? 'Step-by-Step AI Formula Solver' : 'Concept Guide Clues'}</span>
                              <button onClick={() => setAiResult('')} className="hover:underline text-[10px]">Close Readout</button>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080c] border border-slate-200 dark:border-zinc-850 text-xs leading-relaxed whitespace-pre-wrap font-sans overflow-x-auto max-h-[300px]">
                              {aiResult}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                </div>
              )}
            </>
          )}

            </div>
          ) : (
            <div className="bg-white dark:bg-[#0c0d12] border border-slate-205 dark:border-zinc-805 p-8 rounded-2xl shadow-sm text-center space-y-4">
              <Award className="w-12 h-12 text-indigo-600 mx-auto animate-pulse" />
              <h3 className="font-serif font-black text-lg text-slate-850 dark:text-white">Past Entrance & University papers Solver</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-400 max-w-sm mx-auto">
                Ready to crack Calculus midterm derivations, Thermodynamics vectors, and relative grammar clauses. Select any university paper on the left to start.
              </p>
              
              <div className="pt-5 border-t border-slate-100 dark:border-zinc-800/80 max-w-xs mx-auto">
                <p className="text-[11px] text-indigo-600 dark:text-indigo-405 font-bold uppercase tracking-wider mb-1.5">🎓 Looking for official national exams?</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-3 leading-normal">
                  Switch to the <span className="font-bold text-slate-650 dark:text-zinc-300">National Exams (EUEE) Hub</span> tab above to explore official stream-sorted past papers, subject links, and free curriculum books.
                </p>
                <button
                  onClick={() => { playClickChime(); setActiveTab('external'); }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 text-indigo-700 text-[10px] font-extrabold uppercase rounded-lg transition-colors cursor-pointer"
                >
                  Explore National Hub &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      )}

      {activeTab === 'ai-custom' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 select-none font-sans text-slate-900 dark:text-zinc-150"
        >
          {/* Main Mode Segment Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode A: Custom Exam */}
            <div
              onClick={() => { playClickChime(); setIsSurpriseMode(false); }}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                !isSurpriseMode
                  ? 'bg-indigo-50/50 dark:bg-indigo-955/10 border-indigo-600 dark:border-indigo-500 shadow-sm'
                  : 'bg-white dark:bg-[#0c0d12] border-slate-200 dark:border-zinc-805 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-705 dark:text-indigo-400 rounded-xl">
                <BookMarked className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm flex items-center gap-1.5">
                  <span>Standard Chapter Exam Compiler</span>
                  {!isSurpriseMode && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">
                  Select your class, subject, and chapter unit to compile custom exam papers directly from our curriculum pool of over 400+ questions per chapter.
                </p>
              </div>
            </div>

            {/* Mode B: Surprise Me Endless */}
            <div
              onClick={() => {
                playClickChime();
                setIsSurpriseMode(true);
                if (!surpriseQuestion && !isGeneratingSurprise) {
                  generateSurpriseQuestion();
                }
              }}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 relative overflow-hidden ${
                isSurpriseMode
                  ? 'bg-amber-50/30 dark:bg-amber-955/5 border-amber-500 dark:border-amber-600/80 shadow-sm'
                  : 'bg-white dark:bg-[#0c0d12] border-slate-200 dark:border-zinc-805 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              {surpriseStreak > 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500 text-black px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider animate-bounce">
                  <Flame className="w-3 h-3 text-red-750 fill-current" />
                  <span>Streak: {surpriseStreak}</span>
                </div>
              )}
              <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <Dices className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm flex items-center gap-1.5">
                  <span>Curriculum Speed Drill Mode</span>
                  {isSurpriseMode && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">
                  Endless quick-fire practice questions selected randomly from across the 11th, 12th grade matric, and college freshman syllabi to test your overall preparedness.
                </p>
              </div>
            </div>
          </div>

          {/* Render Mode A Contents */}
          {!isSurpriseMode && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Configuration Sidebar - 4 Cols */}
              <div className="lg:col-span-4 bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-5 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-serif font-black text-sm text-slate-850 dark:text-white uppercase tracking-wider">Exam Parameters</h4>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  {/* Subject selector */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-zinc-400">1. Select Subject</label>
                    <select
                      value={customSubject}
                      onChange={(e) => { playClickChime(); setCustomSubject(e.target.value); }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-202 dark:border-zinc-802 bg-slate-50 dark:bg-[#08090d] text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {Object.keys(RECOMMENDED_UNITS).map(subj => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>
                  </div>

                  {/* Level selector */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-zinc-400">2. Academic Level</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Grade 11', 'Grade 12 Matric', 'Freshman'].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => { playClickChime(); setCustomGrade(lvl); }}
                          className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            customGrade === lvl
                              ? 'bg-indigo-650 text-white border-indigo-600'
                              : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chapter/Unit Suggester Dropdown or Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-500 dark:text-zinc-400">3. Specific Topic or Unit</label>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">Curriculum Linked</span>
                    </div>
                    <select
                      value={customUnit}
                      onChange={(e) => { playClickChime(); setCustomUnit(e.target.value); }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-202 dark:border-zinc-802 bg-slate-50 dark:bg-[#08090d] text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {RECOMMENDED_UNITS[customSubject]?.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                      <option value="All Chapters Combined">Mix All Chapters Combined</option>
                    </select>

                    <div className="pt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Or type custom unit name:</span>
                      <input
                        type="text"
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        placeholder="e.g. Unit 6: Electromagnetism"
                        className="flex-1 px-2 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-transparent text-[10px]"
                      />
                    </div>
                  </div>

                  {/* Question Focus Style Selector */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-zinc-400 font-sans">4. Question Style & Matric Focus</label>
                    <div className="space-y-2">
                      {[
                        { id: 'units', label: '📐 Formulas & Physical Units', desc: 'Focuses on SI units, dimensional analysis & rigorous calculations.' },
                        { id: 'matric', label: '⚡ Matric Repeated Trends', desc: 'Models structures frequently repeated in the last decade of EUEE.' },
                        { id: 'conceptual', label: '🎓 Heavy Conceptual Depth', desc: 'Checks abstract reasoning, definitions & underlying principles.' },
                        { id: 'scenario', label: '🌱 Ethiopian Case Scenarios', desc: 'Incorporates local projects, rivers, dams, and bilingual contexts.' },
                      ].map(style => (
                        <div
                          key={style.id}
                          onClick={() => { playClickChime(); setCustomStyle(style.id); }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                            customStyle === style.id
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-450 dark:border-indigo-550'
                              : 'bg-transparent border-slate-100 dark:border-zinc-900 hover:border-slate-200 dark:hover:border-zinc-800'
                          }`}
                        >
                          <input
                            type="radio"
                            checked={customStyle === style.id}
                            onChange={() => {}}
                            className="mt-0.5 accent-indigo-600"
                          />
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">{style.label}</span>
                            <p className="text-[9.5px] text-slate-400 dark:text-zinc-500 leading-tight font-normal">{style.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Count Selector */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <label className="text-slate-500 dark:text-zinc-400">5. Question Count</label>
                      <span className="font-bold font-mono text-indigo-650 dark:text-indigo-400">{customQCount} MCQ Questions</span>
                    </div>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => { playClickChime(); setCustomQCount(cnt); }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            customQCount === cnt
                              ? 'bg-indigo-650 text-white border-indigo-600'
                              : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={generateCustomQuestions}
                  disabled={isGeneratingCustom}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {isGeneratingCustom ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Retrieving board questions...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                      <span>Compile Curriculum Exam</span>
                    </>
                  )}
                </button>
              </div>

              {/* Practice Workspace - 8 Cols */}
              <div className="lg:col-span-8 space-y-6">
                {isGeneratingCustom && (
                  <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 rounded-2xl p-12 text-center shadow-sm space-y-4">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-650 border-t-transparent animate-spin mx-auto" />
                    <div className="space-y-1">
                      <h4 className="font-serif font-black text-slate-800 dark:text-white">Curriculum Board Exam Compiler</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Loading Ministry syllabus standards, assembling specific chapter metrics, and configuring high-fidelity formula representations for {customSubject}...
                      </p>
                    </div>
                  </div>
                )}

                {customGenError && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-red-800 dark:text-red-400">Failed to Compile Custom Exam</h5>
                      <p className="text-[11px] text-red-700 dark:text-red-550 leading-normal">{customGenError}</p>
                    </div>
                  </div>
                )}

                {/* Show Mock Exam Paper */}
                {!isGeneratingCustom && aiCustomQuestions.length > 0 && (
                  <div className="space-y-6">
                    {/* Score Card Banner */}
                    {hasSubmittedCustom && customScore !== null && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-6 rounded-2xl border text-center space-y-3 shadow-md ${
                          customScore >= 70
                            ? 'bg-emerald-50/55 dark:bg-emerald-950/15 border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-50/50 dark:bg-amber-955/10 border-amber-300 dark:border-amber-800/80'
                        }`}
                      >
                        <Trophy className={`w-12 h-12 mx-auto ${customScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <div className="space-y-1">
                          <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white">
                            {customScore >= 70 ? 'Congratulations! Passed! 🎉' : 'Keep Studying! Needs Work 📚'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                            You scored <span className="font-black text-indigo-600 dark:text-indigo-405">{customScore}%</span> in this board-standard practice exam on {customSubject}. Check step-by-step solutions below to address wrong answers.
                          </p>
                        </div>
                        <div className="inline-flex gap-4 pt-1 text-xs font-bold font-mono">
                          <span className="text-emerald-650 dark:text-emerald-400">
                            Correct: {aiCustomQuestions.filter(q => q.userAnswer && q.userAnswer.trim() === q.correctAnswer.trim()).length}
                          </span>
                          <span className="text-red-600">
                            Incorrect: {aiCustomQuestions.filter(q => !q.userAnswer || q.userAnswer.trim() !== q.correctAnswer.trim()).length}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Paper Shell Header */}
                    <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-6 rounded-2xl shadow-sm space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/60 pb-4">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded uppercase">
                            {customGrade} Worksheet Blueprint
                          </span>
                          <h3 className="text-base font-serif font-black text-slate-900 dark:text-white">
                            {customSubject}: {customUnit}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-400">Focus: <strong className="text-slate-700 dark:text-zinc-300 font-bold capitalize">{customStyle}</strong></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
                          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{aiCustomQuestions.length} Questions</span>
                        </div>
                      </div>

                      {/* Question Workspace Segment */}
                      <div className="space-y-6">
                        {/* Selected Question Indicator Buttons */}
                        <div className="flex flex-wrap gap-2 pb-1">
                          {aiCustomQuestions.map((q, qIdx) => {
                            const isAnswered = !!q.userAnswer;
                            const isCorrect = isAnswered && q.userAnswer?.trim() === q.correctAnswer.trim();
                            
                            let btnStyle = "bg-slate-50 dark:bg-[#08090d] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800";
                            if (currentCustomQIdx === qIdx) {
                              btnStyle = "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-550/25 shadow";
                            } else if (hasSubmittedCustom) {
                              btnStyle = isCorrect
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
                            } else if (isAnswered) {
                              btnStyle = "bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-300 dark:border-zinc-700";
                            }

                            return (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={() => { playClickChime(); setCurrentCustomQIdx(qIdx); }}
                                className={`w-8.5 h-8.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${btnStyle}`}
                              >
                                {qIdx + 1}
                              </button>
                            );
                          })}
                        </div>

                        {/* Active Question Panel */}
                        {aiCustomQuestions[currentCustomQIdx] && (
                          <div className="space-y-5 pt-2">
                            {/* Question text */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-405">QUESTION {currentCustomQIdx + 1} OF {aiCustomQuestions.length}</span>
                              <p className="text-sm font-bold font-mono tracking-tight text-slate-800 dark:text-zinc-150 leading-relaxed bg-slate-50/50 dark:bg-[#07080b]/50 p-4.5 rounded-xl border border-slate-105/50 dark:border-zinc-850/80">
                                {aiCustomQuestions[currentCustomQIdx].question}
                              </p>
                            </div>

                            {/* Options choices list */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {aiCustomQuestions[currentCustomQIdx].options.map((opt, oIdx) => {
                                const isSelected = aiCustomQuestions[currentCustomQIdx].userAnswer === opt;
                                const isCorrectOpt = opt.trim() === aiCustomQuestions[currentCustomQIdx].correctAnswer.trim();
                                
                                let optStyle = "border-slate-200 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-900/40 bg-white dark:bg-[#0c0d12]";
                                if (hasSubmittedCustom) {
                                  if (isCorrectOpt) {
                                    optStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400";
                                  } else if (isSelected) {
                                    optStyle = "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400";
                                  } else {
                                    optStyle = "opacity-60 border-slate-100 dark:border-zinc-850 bg-white dark:bg-[#0c0d12]";
                                  }
                                } else if (isSelected) {
                                  optStyle = "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-955/5 ring-1 ring-indigo-500 text-indigo-705 dark:text-indigo-405";
                                }

                                return (
                                  <div
                                    key={oIdx}
                                    onClick={() => handleSelectCustomAnswer(currentCustomQIdx, opt)}
                                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold flex items-center justify-between ${optStyle} ${hasSubmittedCustom ? 'pointer-events-none' : ''}`}
                                  >
                                    <span className="pr-2 leading-relaxed">{opt}</span>
                                    {!hasSubmittedCustom && isSelected && (
                                      <CheckCircle className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                                    )}
                                    {hasSubmittedCustom && isCorrectOpt && (
                                      <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black shrink-0">✓</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Help Actions & Hint Boxes */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
                              {/* Left interactive clues */}
                              <div>
                                {!hasSubmittedCustom ? (
                                  <button
                                    onClick={() => handleRequestHint(currentCustomQIdx, aiCustomQuestions[currentCustomQIdx].question)}
                                    disabled={hintLoadingMap[currentCustomQIdx]}
                                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl text-[11px] font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <MessageSquare className="w-4 h-4 shrink-0" />
                                    <span>{hintLoadingMap[currentCustomQIdx] ? 'Consulting Abreham...' : 'Ask Abreham for a Clue'}</span>
                                  </button>
                                ) : (
                                  <div className="text-[11px] text-slate-400">
                                    Topic Topic: <strong className="text-slate-655 dark:text-zinc-300 font-bold">{aiCustomQuestions[currentCustomQIdx].subjectTopic}</strong>
                                  </div>
                                )}
                              </div>

                              {/* Right navigation / submit */}
                              <div className="flex items-center gap-3">
                                {currentCustomQIdx > 0 && (
                                  <button
                                    onClick={() => { playClickChime(); setCurrentCustomQIdx(prev => prev - 1); }}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-bold"
                                  >
                                    Previous
                                  </button>
                                )}
                                {currentCustomQIdx < aiCustomQuestions.length - 1 ? (
                                  <button
                                    onClick={() => { playClickChime(); setCurrentCustomQIdx(prev => prev + 1); }}
                                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-zinc-900 text-[10px] font-bold rounded-lg flex items-center gap-1"
                                  >
                                    <span>Next Question</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  !hasSubmittedCustom && (
                                    <button
                                      onClick={handleSubmitCustomExam}
                                      className="px-5 py-2 bg-[#078930] hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition shadow-md flex items-center gap-1.5"
                                    >
                                      <Check className="w-4 h-4" />
                                      <span>Finish and Grade</span>
                                    </button>
                                  )
                                )}
                              </div>
                            </div>

                            {/* Display Hint Clue block if requested */}
                            {hintTextMap[currentCustomQIdx] && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3.5 bg-indigo-50/60 dark:bg-indigo-955/5 border border-indigo-150/50 rounded-xl space-y-1 text-xs"
                              >
                                <span className="font-bold text-indigo-705 dark:text-indigo-405 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1">
                                  <span>💡 Abreham's Study Hint:</span>
                                  {hintLoadingMap[currentCustomQIdx] && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />}
                                </span>
                                <p className="text-slate-600 dark:text-zinc-300 leading-normal text-[11px] font-medium font-serif italic">
                                  "{hintTextMap[currentCustomQIdx]}"
                                </p>
                              </motion.div>
                            )}

                            {/* Display Answer Solution Block if exam is submitted */}
                            {hasSubmittedCustom && (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-slate-50 dark:bg-[#07080c] border border-slate-200 dark:border-zinc-850 rounded-xl space-y-3"
                              >
                                <div className="flex justify-between items-center text-[10.5px] font-bold font-mono text-indigo-650 dark:text-indigo-400">
                                  <span>👨‍🏫 Board Solution & Explanations</span>
                                  <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[9.5px]">Correct answer: {aiCustomQuestions[currentCustomQIdx].correctAnswer}</span>
                                </div>
                                <p className="text-xs text-slate-650 dark:text-zinc-350 leading-relaxed font-sans whitespace-pre-line">
                                  {aiCustomQuestions[currentCustomQIdx].explanation}
                                </p>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* No exam generated state */}
                {!isGeneratingCustom && aiCustomQuestions.length === 0 && (
                  <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-8 rounded-2xl shadow-sm text-center space-y-5">
                    <BookMarked className="w-12 h-12 text-indigo-600 mx-auto animate-pulse" />
                    <div className="space-y-1.5">
                      <h3 className="font-serif font-black text-base text-slate-850 dark:text-white">Curriculum Board Exam Portal (400+ Questions)</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Select a class, subject, and unit/chapter on the left to draw from our official pool of 400+ board questions and compile an authentic, standardized practice examination.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 max-w-md mx-auto grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <span className="text-base">📐</span>
                        <h5 className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase">SI Units</h5>
                        <p className="text-[9px] text-slate-400">SI & Physical formulas</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-base">⚡</span>
                        <h5 className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase">Matric</h5>
                        <p className="text-[9px] text-slate-400">Board exam standards</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-base">📚</span>
                        <h5 className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase">Chapter Pools</h5>
                        <p className="text-[9px] text-slate-400">400+ MCQs per unit</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Render Mode B Surprise Contents */}
          {isSurpriseMode && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Streak Tracker & Title Header */}
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 dark:from-amber-955/30 dark:to-orange-955/10 border border-amber-300/40 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[9.5px] font-black tracking-widest text-amber-600 dark:text-amber-400 uppercase">Endless Surprise Arcade</span>
                  <h3 className="text-base font-serif font-black text-slate-850 dark:text-white flex items-center gap-1.5">
                    <span>Unlimited Quiz Practice Engine</span>
                  </h3>
                </div>

                <div className="flex items-center gap-4 bg-white/65 dark:bg-black/40 px-4 py-2 rounded-xl border border-amber-200/55 shadow-sm shrink-0 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-5 h-5 text-amber-550 fill-current animate-pulse" />
                    <div className="space-y-0">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">Best Streak</span>
                      <span className="text-sm font-black text-slate-850 dark:text-white leading-none">{surpriseStreak} in a row</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loader */}
              {isGeneratingSurprise && (
                <div className="bg-white dark:bg-[#0c0d12] border border-slate-202 dark:border-zinc-802 rounded-2xl p-16 text-center space-y-4">
                  <div className="w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-serif font-black text-slate-800 dark:text-white">Pulling unexpected matric questions...</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Choosing a surprise curriculum focus and applying complex physical units or high-frequency repeated formats...
                    </p>
                  </div>
                </div>
              )}

              {/* Surprise Question Workspace */}
              {!isGeneratingSurprise && surpriseQuestion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-6 rounded-2xl shadow-sm space-y-6"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-404 uppercase tracking-wider">
                        📍 Practice focus: {surpriseQuestion.subjectTopic}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-650 dark:text-emerald-400">Curriculum Standardized</span>
                  </div>

                  {/* Question */}
                  <div className="space-y-1 bg-slate-50/60 dark:bg-[#07080b]/55 p-4 rounded-xl border border-slate-105/50 dark:border-zinc-850">
                    <p className="text-sm font-bold font-mono text-slate-850 dark:text-zinc-150 leading-relaxed whitespace-pre-line">
                      {surpriseQuestion.question}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {surpriseQuestion.options.map((opt, oIdx) => {
                      const isSelected = selectedSurpriseChoice === opt;
                      const isCorrectOpt = opt.trim() === surpriseQuestion.correctAnswer.trim();

                      let optStyle = "border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] hover:bg-slate-50 dark:hover:bg-zinc-900/30";
                      if (surpriseAnswered) {
                        if (isCorrectOpt) {
                          optStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold";
                        } else if (isSelected) {
                          optStyle = "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400";
                        } else {
                          optStyle = "opacity-60 border-slate-100 dark:border-zinc-850 bg-white dark:bg-[#0c0d12]";
                        }
                      } else if (isSelected) {
                        optStyle = "border-amber-500 bg-amber-50/10 dark:bg-amber-955/5 ring-1 ring-amber-500 text-amber-800 dark:text-amber-400 font-bold";
                      }

                      return (
                        <div
                          key={oIdx}
                          onClick={() => handleSelectSurpriseChoice(opt)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold flex items-center justify-between ${optStyle} ${surpriseAnswered ? 'pointer-events-none' : ''}`}
                        >
                          <span className="pr-2 leading-relaxed">{opt}</span>
                          {!surpriseAnswered && isSelected && (
                            <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          {surpriseAnswered && isCorrectOpt && (
                            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black shrink-0">✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Action row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800/60">
                    <div>
                      {!surpriseAnswered ? (
                        <p className="text-[11px] text-slate-400">Choose your answer and click Submit to check your streak.</p>
                      ) : (
                        <button
                          onClick={() => setSurpriseExplainOpen(!surpriseExplainOpen)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>{surpriseExplainOpen ? 'Hide' : 'Show'} Step-by-Step Explanation</span>
                          <span className="text-[10px]">{surpriseExplainOpen ? '▲' : '▼'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {!surpriseAnswered ? (
                        <button
                          onClick={handleSubmitSurpriseAnswer}
                          disabled={!selectedSurpriseChoice}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-black uppercase text-xs tracking-wider rounded-xl cursor-pointer transition shadow-sm"
                        >
                          Verify Answer
                        </button>
                      ) : (
                        <button
                          onClick={generateSurpriseQuestion}
                          className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider rounded-xl cursor-pointer transition shadow-md flex items-center gap-1.5"
                        >
                          <span>Next Surprise Question</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Display grading response message */}
                  {surpriseResultMsg && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 rounded-xl text-xs font-semibold ${
                        surpriseResultMsg.success
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                      }`}
                    >
                      {surpriseResultMsg.text}
                    </motion.div>
                  )}

                  {/* Display step explanation accordion */}
                  {surpriseAnswered && surpriseExplainOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4.5 bg-slate-50 dark:bg-[#07080b]/50 border border-slate-150 dark:border-zinc-850 rounded-xl space-y-2.5"
                    >
                      <h5 className="text-[10.5px] font-bold font-mono text-indigo-600 dark:text-indigo-400">👨‍🏫 Board Solution & Formulas Key</h5>
                      <p className="text-xs text-slate-650 dark:text-zinc-350 leading-relaxed whitespace-pre-line font-sans">
                        {surpriseQuestion.explanation}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Inactive welcome surprise state */}
              {!isGeneratingSurprise && !surpriseQuestion && (
                <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-12 rounded-2xl shadow-sm text-center space-y-5">
                  <Dices className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
                  <div className="space-y-1.5">
                    <h3 className="font-serif font-black text-base text-slate-800 dark:text-white">Arcade Practice Challenge</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto animate-pulse">
                      Ready to tackle a completely unexpected challenge? Get random math proofs, physics dimensional units or relative tenses EUEE questions instantly.
                    </p>
                  </div>
                  <button
                    onClick={generateSurpriseQuestion}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-wider rounded-xl transition cursor-pointer shadow-md"
                  >
                    🎲 Start surprise practice
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'external' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Intro banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 dark:from-indigo-955/60 dark:to-zinc-950 border border-indigo-500/20 rounded-2xl p-6 text-white space-y-3 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
              <Award className="w-64 h-64 text-indigo-400" />
            </div>
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] bg-indigo-500 text-white font-extrabold tracking-widest px-2 py-0.5 rounded uppercase">Official National Matric Resources</span>
              <h3 className="text-xl font-serif font-black tracking-tight">Ethiopian University Entrance Exam (EUEE) Hub</h3>
              <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                Prepare for the national examinations with official stream-wise categorized papers, core high-school subjects, and fully complete Grade 12 curriculum books. Organized flawlessly for target revision.
              </p>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* 1. Kehulum Stream-Wise Section - 7 cols */}
            <div className="md:col-span-7 bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-[#078930] dark:text-emerald-405 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded uppercase">Stream-Based Papers</span>
                  <span className="text-[10px] font-mono text-slate-400">Kehulum Exam Portal</span>
                </div>

                <h4 className="text-base font-serif font-black text-slate-900 dark:text-zinc-150 leading-tight">
                  EUEE Past Exams by Stream (Natural vs. Social Science)
                </h4>
                
                <p className="text-xs text-slate-505 dark:text-zinc-400 leading-relaxed">
                  Since Natural Science and Social Science students take different subject combinations, practicing sorted by stream is vital to avoid mixing up relevant curriculum topics.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/20 dark:bg-emerald-950/5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#078930]" />
                      <span className="text-xs font-black text-slate-800 dark:text-emerald-400">Natural Science Stream</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-snug">
                      Mathematics, English, Aptitude, Physics, Chemistry, Biology, and Civics.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-950/50 bg-amber-50/10 dark:bg-amber-950/5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-xs font-black text-slate-800 dark:text-amber-450">Social Science Stream</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-snug">
                      Mathematics, English, Aptitude, Geography, History, Economics, Civics, and General Business.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[10.5px] text-slate-400 dark:text-zinc-500 leading-tight">
                  ⚡ Direct stream access & past years answer guides
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSuccessChime();
                    if (onOpenInAppViewer) {
                      onOpenInAppViewer("https://kehulum.com/entrance-exam", "National Entrance Exam Hub");
                    } else {
                      window.open("https://kehulum.com/entrance-exam", "_blank");
                    }
                  }}
                  className="px-5 py-2.5 bg-[#078930] hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow hover:shadow-md cursor-pointer shrink-0"
                >
                  <span>Open Entrance Exam Hub</span>
                  <span className="text-xs">↗</span>
                </button>
              </div>
            </div>

            {/* 2. EthioBookReview Subject-Wise Section - 5 cols */}
            <div className="md:col-span-5 bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-indigo-655 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded uppercase">Subject-Wise Practice</span>
                  <span className="text-[10px] font-mono text-slate-400">EthioBookReview</span>
                </div>

                <h4 className="text-base font-serif font-black text-slate-900 dark:text-zinc-150 leading-tight">
                  Direct Subject Past Exams
                </h4>
                
                <p className="text-xs text-slate-505 dark:text-zinc-400 leading-relaxed">
                  Jump straight into standard questions and solutions sorted for high-frequency EUEE exam subjects.
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playSuccessChime();
                      if (onOpenInAppViewer) {
                        onOpenInAppViewer("https://ethiobookreview.com/national-exams/mathematics", "Mathematics Past Exams");
                      } else {
                        window.open("https://ethiobookreview.com/national-exams/mathematics", "_blank");
                      }
                    }}
                    className="flex w-full items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/60 bg-slate-50 dark:bg-zinc-900/40 hover:border-indigo-450 dark:hover:border-indigo-550 transition-all text-xs font-bold text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">📐 <span>Mathematics Past Exams</span></span>
                    <span className="text-slate-400">&rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSuccessChime();
                      if (onOpenInAppViewer) {
                        onOpenInAppViewer("https://ethiobookreview.com/national-exams/english", "English Past Exams");
                      } else {
                        window.open("https://ethiobookreview.com/national-exams/english", "_blank");
                      }
                    }}
                    className="flex w-full items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/60 bg-slate-50 dark:bg-zinc-900/40 hover:border-indigo-450 dark:hover:border-indigo-550 transition-all text-xs font-bold text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">📝 <span>English Past Exams</span></span>
                    <span className="text-slate-400">&rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSuccessChime();
                      if (onOpenInAppViewer) {
                        onOpenInAppViewer("https://ethiobookreview.com/national-exams/aptitude", "Aptitude Past Exams");
                      } else {
                        window.open("https://ethiobookreview.com/national-exams/aptitude", "_blank");
                      }
                    }}
                    className="flex w-full items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/60 bg-slate-50 dark:bg-zinc-900/40 hover:border-indigo-450 dark:hover:border-indigo-550 transition-all text-xs font-bold text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">💡 <span>Aptitude Past Exams</span></span>
                    <span className="text-slate-400">&rarr;</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    playSuccessChime();
                    if (onOpenInAppViewer) {
                      onOpenInAppViewer("https://ethiobookreview.com/national-exams", "EthioBookReview National Exams");
                    } else {
                      window.open("https://ethiobookreview.com/national-exams", "_blank");
                    }
                  }}
                  className="w-full py-2.5 border border-indigo-200 hover:border-indigo-400 dark:border-indigo-900/60 dark:hover:border-indigo-800 text-indigo-650 dark:text-indigo-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>View Full List (All Subjects)</span>
                  <span>↗</span>
                </button>
              </div>
            </div>

            {/* 3. Fetena.net Official Grade 12 Textbooks - 12 cols */}
            <div className="md:col-span-12 bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black tracking-widest text-amber-655 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded uppercase">Grade 12 Reference Materials</span>
                  <h4 className="text-base font-serif font-black text-slate-900 dark:text-zinc-150">
                    Official Grade 12 Textbook PDFs (Fetena.net)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Direct Official Textbook Downloads</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Common Courses */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-2">
                    <span className="text-base font-sans">💼</span>
                    <h5 className="text-xs font-black text-slate-800 dark:text-zinc-300 uppercase tracking-wider">Common Courses</h5>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Mathematics', url: 'https://fetena.net/books/grade-12/mathematics' },
                      { name: 'English', url: 'https://fetena.net/books/grade-12/english' },
                      { name: 'Civics & Ethical Education', url: 'https://fetena.net/books/grade-12/civics-and-ethical-education' },
                      { name: 'ICT (Information Technology)', url: 'https://fetena.net/books/grade-12/ict' },
                      { name: 'Amharic', url: 'https://fetena.net/books/grade-12/amharic' },
                    ].map(bk => (
                      <button
                        key={bk.name}
                        type="button"
                        onClick={() => {
                          playSuccessChime();
                          if (onOpenInAppViewer) {
                            onOpenInAppViewer(bk.url, `Grade 12 Textbook: ${bk.name}`);
                          } else {
                            window.open(bk.url, "_blank");
                          }
                        }}
                        className="flex w-full items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/30 hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-xs text-slate-650 dark:text-zinc-300 border border-slate-105/50 dark:border-zinc-850 text-left cursor-pointer"
                      >
                        <span className="truncate">{bk.name}</span>
                        <span className="text-[10px] text-slate-405 font-mono shrink-0">In-App 📖</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Natural Science */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-2">
                    <span className="text-base font-sans">🔬</span>
                    <h5 className="text-xs font-black text-slate-800 dark:text-zinc-300 uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Natural Science Courses</h5>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Biology', url: 'https://fetena.net/books/grade-12/biology' },
                      { name: 'Chemistry', url: 'https://fetena.net/books/grade-12/chemistry' },
                      { name: 'Physics', url: 'https://fetena.net/books/grade-12/physics' },
                    ].map(bk => (
                      <button
                        key={bk.name}
                        type="button"
                        onClick={() => {
                          playSuccessChime();
                          if (onOpenInAppViewer) {
                            onOpenInAppViewer(bk.url, `Grade 12 Textbook: ${bk.name}`);
                          } else {
                            window.open(bk.url, "_blank");
                          }
                        }}
                        className="flex w-full items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/30 hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-xs text-slate-650 dark:text-zinc-300 border border-slate-105/50 dark:border-zinc-850 text-left cursor-pointer"
                      >
                        <span className="truncate">{bk.name}</span>
                        <span className="text-[10px] text-slate-405 font-mono shrink-0">In-App 📖</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Social Science */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-2">
                    <span className="text-base font-sans">🌍</span>
                    <h5 className="text-xs font-black text-slate-800 dark:text-zinc-300 uppercase tracking-wider text-amber-600 dark:text-amber-400">Social Science Courses</h5>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Geography', url: 'https://fetena.net/books/grade-12/geography' },
                      { name: 'History', url: 'https://fetena.net/books/grade-12/history' },
                      { name: 'Economics', url: 'https://fetena.net/books/grade-12/economics' },
                      { name: 'General Business', url: 'https://fetena.net/books/grade-12/general-business' },
                    ].map(bk => (
                      <button
                        key={bk.name}
                        type="button"
                        onClick={() => {
                          playSuccessChime();
                          if (onOpenInAppViewer) {
                            onOpenInAppViewer(bk.url, `Grade 12 Textbook: ${bk.name}`);
                          } else {
                            window.open(bk.url, "_blank");
                          }
                        }}
                        className="flex w-full items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/30 hover:bg-slate-100 dark:hover:bg-zinc-800/60 text-xs text-slate-650 dark:text-zinc-300 border border-slate-105/50 dark:border-zinc-850 text-left cursor-pointer"
                      >
                        <span className="truncate">{bk.name}</span>
                        <span className="text-[10px] text-slate-405 font-mono shrink-0">In-App 📖</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}

    </div>
  );
}
