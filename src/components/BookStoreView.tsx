import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Search, Download, Sparkles, AlertCircle, Play, FileText, Bot, Compass, CheckCircle, ChevronDown, Award, RefreshCw, Plus,
  BookOpenCheck, Sliders, Sun, Moon, Type, ChevronLeft, ChevronRight, Share2, HelpCircle, X, Check, Database, AlertTriangle, MessageSquare,
  ExternalLink, Star
} from 'lucide-react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { submitClaudeChat } from '../utils/ai';
import { fetchSupabaseBooks, getSupabase, saveSupabaseCredentials, clearSupabaseCredentials } from '../utils/supabaseClient';
import { getChapterContent } from '../data/textbookChapterContent';
import { safeStorage } from '../utils/safeStorage';

interface BookStoreViewProps {
  profile: StudentProfile;
  apiKey: string;
  language: 'en' | 'am';
  onNavigate: (page: string) => void;
  onStudyAction: () => void;
  supabaseBooks?: any[];
  onOpenInAppViewer?: (url: string, title: string) => void;
}

interface ModuleResource {
  id: string;
  title: string;
  subject: string;
  grade: string;
  chapters: string[];
  pages: number;
  description: string;
  languageSupport: 'English Only' | 'Bilingual';
  proRequired: boolean;
  pdfUrl?: string;
  contentJson?: string;
  isSupabase?: boolean;
}

const PREBUILT_MODULES: ModuleResource[] = [
  // --- GRADE 12 ---
  {
    id: 'g12_math',
    title: 'Grade 12 Mathematics Ultimate Curriculum Module',
    subject: 'Mathematics',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Sequences and Series', 'Chapter 2: Limits and Continuity', 'Chapter 3: Introduction to Calculus', 'Chapter 4: Vectors and Analytical Geometry'],
    pages: 142,
    description: 'Comprehensive Ministry Exam prep module covering differential calculus, limits, sequence notation, and solid geometry calculations with Amharic translations.',
    languageSupport: 'Bilingual',
    proRequired: true,
    pdfUrl: 'https://fetena.net/books/grade-12/mathematics'
  },
  {
    id: 'g12_english',
    title: 'Grade 12 Communicative English Matric Workbook',
    subject: 'English',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Tense & Aspect Pairing', 'Chapter 2: Relative Clauses & Passive Voice', 'Chapter 3: Direct vs Indirect Speech', 'Chapter 4: Vocabulary Context Clues'],
    pages: 105,
    description: 'Specially structured to help high school students excel in national standardized English layouts, active-passive voice transitions, and comprehension skills.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/english'
  },
  {
    id: 'g12_physics',
    title: 'Grade 12 Physics Electromagnetism & Quantum Guide',
    subject: 'Physics',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Particle Dynamics', 'Chapter 2: Magnetic Fields & Inductance', 'Chapter 3: AC Circuits', 'Chapter 4: Atomic & Quantum Physics Theory'],
    pages: 120,
    description: 'Advanced matric revision guide summarizing magnetic flux equations, transformers, line spectra, photoelectric effect, and radioactive half-lives.',
    languageSupport: 'Bilingual',
    proRequired: true,
    pdfUrl: 'https://fetena.net/books/grade-12/physics'
  },
  {
    id: 'g12_chemistry',
    title: 'Grade 12 Chemistry Organic & Electrochemistry Companion',
    subject: 'Chemistry',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Solutions and Colloids', 'Chapter 2: Acid-Base Equilibria', 'Chapter 3: Thermodynamics & Electrochemistry', 'Chapter 4: Nomenclature of Organic Reactants'],
    pages: 135,
    description: 'Detailed study on buffer actions, pH indicators, Lewis theories, galvanic cells, and standard IUPAC nomenclature schemes.',
    languageSupport: 'Bilingual',
    proRequired: true,
    pdfUrl: 'https://fetena.net/books/grade-12/chemistry'
  },
  {
    id: 'g12_biology',
    title: 'Grade 12 Biology Genetics, Evolution & Ecology Module',
    subject: 'Biology',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Cell Biology and Macromolecules', 'Chapter 2: Mendelian Inheritance & DNA', 'Chapter 3: Theories of Evolution', 'Chapter 4: Ecological Succession & Conservation'],
    pages: 115,
    description: 'Targeted revision for national entrance exam genetics calculations, population genetics rules, and environmental issues facing Ethiopia.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/biology'
  },
  {
    id: 'g12_amharic',
    title: 'Grade 12 Amharic (አማርኛ) Student Textbook',
    subject: 'Amharic',
    grade: 'Grade 12',
    chapters: ['Chapter 1: ስነ-ጽሁፍ እና ባህል (Literature & Culture)', 'Chapter 2: ንባብና መረዳት (Reading & Comprehension)', 'Chapter 3: የቃላት ጥናትና ሰዋስው (Vocabulary & Grammar)', 'Chapter 4: የጽሕፈት ስልቶች (Writing Styles)'],
    pages: 110,
    description: 'Official Ministry Grade 12 Amharic language companion. Study grammar, vocabulary, reading comprehension, and literature analysis.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/amharic'
  },
  {
    id: 'g12_aptitude',
    title: 'Grade 12 Analytical and Quantitative Aptitude Handbook',
    subject: 'Aptitude',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Verbal Analogies & Sentence Logic', 'Chapter 2: Numerical Series & Word Problems', 'Chapter 3: Spatial and Non-Verbal Reasoning', 'Chapter 4: Logic Gates & Syllogism Analysis'],
    pages: 160,
    description: 'Specially curated reasoning builder focusing on typical math aptitude patterns, visual sequences, and critical thinking matrices for entrance exams.',
    languageSupport: 'Bilingual',
    proRequired: true
  },

  // --- UNIVERSITY ---
  {
    id: 'uni_math',
    title: 'Freshman Mathematics for Social & Natural Sciences (Math 1011)',
    subject: 'Mathematics',
    grade: 'University',
    chapters: ['Chapter 1: Propositional Logic and Set Theory', 'Chapter 2: The Real & Complex Number Systems', 'Chapter 3: Analytical Geometry & Conic Sections', 'Chapter 4: Exponential and Hyperbolic Functions'],
    pages: 195,
    description: 'Standard textbook helper matching Ethiopian public universities curriculum. Includes truth tables, complex algebra, and functions conversion guidelines with AI step solver.',
    languageSupport: 'English Only',
    proRequired: true
  },
  {
    id: 'uni_applied_math',
    title: 'Applied Calculus I & II Engineering Courseware (Math 1012)',
    subject: 'Applied Math',
    grade: 'University',
    chapters: ['Chapter 1: Techniques of Advanced Integration', 'Chapter 2: Sequences & Infinite Series Tests', 'Chapter 3: Vectors and Partial Derivatives', 'Chapter 4: First Order Linear Differential Equations'],
    pages: 240,
    description: 'Advanced applied engineering mathematical formulas. Features trigonometric substitutions, Taylor series, and volume calculations via double integrals.',
    languageSupport: 'English Only',
    proRequired: true
  },
  {
    id: 'uni_english',
    title: 'Communicative English Skills I (FLEn 1011)',
    subject: 'English',
    grade: 'University',
    chapters: ['Chapter 1: Active Reading and Note-Taking', 'Chapter 2: Advanced Cohesive Paragraph Building', 'Chapter 3: Academic Voice, Modals and Concord', 'Chapter 4: Public Representation Speaking Clues'],
    pages: 98,
    description: 'Core freshman curriculum guidebook to excel in university-level comprehension, syntactic styles, and academic arguments.',
    languageSupport: 'English Only',
    proRequired: false
  },
  {
    id: 'uni_english_2',
    title: 'Writing Skills II Advanced Freshman English (FLEn 1012)',
    subject: 'English Skill 2',
    grade: 'University',
    chapters: ['Chapter 1: Essay Genres and Rhetorical Modes', 'Chapter 2: Mechanics of Academic Citations & APA', 'Chapter 3: Professional Correspondence & Letters', 'Chapter 4: Formulating Business & Research Proposals'],
    pages: 110,
    description: 'Focuses on peer essays editing, bibliography formatting, and writing logical, structured reports as a university scholar.',
    languageSupport: 'English Only',
    proRequired: true
  },
  {
    id: 'uni_physics',
    title: 'General Physics Mechanics, Waves & Optics (Phys 1011)',
    subject: 'Physics',
    grade: 'University',
    chapters: ['Chapter 1: Kinematics & Work-Energy Theorems', 'Chapter 2: Oscillations and Wave Harmonics', 'Chapter 3: Laws of Thermodynamics & Heat', 'Chapter 4: Geometric Optics and Lenses Theory'],
    pages: 215,
    description: 'Rigorous freshman guide centered on physical concepts: work-kinetic calculations, harmonic pendulum frequencies, and ray tracing.',
    languageSupport: 'English Only',
    proRequired: true
  },
  {
    id: 'uni_chemistry',
    title: 'General Chemistry Atomic Structure & Equilibria (Chem 1011)',
    subject: 'Chemistry',
    grade: 'University',
    chapters: ['Chapter 1: Quantum Chemistry & Atomic Periodicity', 'Chapter 2: Chemical Bonding & VSEPR Models', 'Chapter 3: Properties of States & Solutions', 'Chapter 4: Chemical Kinetics and Rate Laws'],
    pages: 220,
    description: 'University level molecular orbital theory, orbital hybridization, boiling point elevations, and activation energy calculations with AI solver tutorials.',
    languageSupport: 'English Only',
    proRequired: true
  },
  {
    id: 'uni_biology',
    title: 'Freshman General Biology and Microbiology (Biol 1011)',
    subject: 'Biology',
    grade: 'University',
    chapters: ['Chapter 1: Structure and Chemistry of Life', 'Chapter 2: Cellular Metabolism & Photosynthesis', 'Chapter 3: Anatomy and Systems of Animal Life', 'Chapter 4: Microorganisms, Fungi and Viral Pathogens'],
    pages: 185,
    description: 'Study of cellular respiration pathways, ATP models, enzyme activity limits, prokaryote structures, and plant physiology.',
    languageSupport: 'English Only',
    proRequired: false
  },
  {
    id: 'uni_anthropology',
    title: 'Social Anthropology Freshman Curriculum (Anth 1012)',
    subject: 'Anthropology',
    grade: 'University',
    chapters: ['Chapter 1: Concepts and Scope of Anthropology', 'Chapter 2: Culture, Ethnicity, and Social Identity', 'Chapter 3: Kinship, Marriage & Family Systems', 'Chapter 4: Indigenous Knowledge and Adaptation in Ethiopia'],
    pages: 130,
    description: 'Explore human diversity, tribal custom definitions, ethnographic field research methods, and pluralistic contexts in the Horn of Africa.',
    languageSupport: 'English Only',
    proRequired: false
  },
  {
    id: 'uni_logic',
    title: 'Introduction to Logic and Critical Thinking (Phil 1011)',
    subject: 'Logic',
    grade: 'University',
    chapters: ['Chapter 1: Logic, Arguments, and Premises', 'Chapter 2: Informal Fallacies (Ad Hominem, Strawman)', 'Chapter 3: Categorical Propositions and Venn Diagrams', 'Chapter 4: Symbolic Logic and Natural Deduction'],
    pages: 145,
    description: 'Unlock argumentative rigor. Learn to outline deductive logic structures, identify cognitive traps, and construct formal proofs with AI reasoning explanations.',
    languageSupport: 'English Only',
    proRequired: true
  },
  {
    id: 'uni_psychology',
    title: 'Freshman General Psychology and Life Skills (Pscy 1011)',
    subject: 'Psychology',
    grade: 'University',
    chapters: ['Chapter 1: Essence & Biological Bases of Behavior', 'Chapter 2: Sensation, Perception, and Human Learning', 'Chapter 3: Cognitive, Memory Systems and Amnesia', 'Chapter 4: Motivation, Emotion, Personality & Life Skills'],
    pages: 152,
    description: 'Deep dive into neuropsychology, Pavlovian conditioning mechanisms, proactive interference, developmental stages, and stress tolerance.',
    languageSupport: 'English Only',
    proRequired: false
  },
  {
    id: 'uni_inclusiveness',
    title: 'Inclusiveness, Disabilities & Special Education Module (Incl 1012)',
    subject: 'Inclusiveness',
    grade: 'University',
    chapters: ['Chapter 1: Understanding Disabilities and Vulnerabilities', 'Chapter 2: Overcoming Social & Institutional Barriers', 'Chapter 3: Collaborative Assistive Technologies', 'Chapter 4: National Inclusiveness Policies and Rights'],
    pages: 112,
    description: 'Framework of special needs learning support, behavioral adjustments, visual or hearing aids integrations, and human dignity principles.',
    languageSupport: 'English Only',
    proRequired: false
  },
  {
    id: 'uni_entrepreneurship',
    title: 'Freshman Entrepreneurship (Mgmt 1012)',
    subject: 'Entrepreneurship',
    grade: 'University',
    chapters: ['Chapter 1: The Entrepreneurial Mindset & Ideation', 'Chapter 2: Market Audits, Feasibility and Customer Pain', 'Chapter 3: Structuring a Valid Lean Business Model Canvas', 'Chapter 4: Capital Sources and Ethiopian Microfinance Laws'],
    pages: 138,
    description: 'Essential entrepreneurial toolbox. Covers competitive audits, value propositions, resource constraints, startup funding hacks, and local taxation.',
    languageSupport: 'English Only',
    proRequired: false
  },
  {
    id: 'uni_cpp',
    title: 'Introduction to Computer Programming & C++ (CoSc 1011)',
    subject: 'C++',
    grade: 'University',
    chapters: ['Chapter 1: Algorithms, Flowcharts and Compilers', 'Chapter 2: C++ Variables, Types, and Conditional Statements', 'Chapter 3: Loops and Iteration Controls (For, While)', 'Chapter 4: Custom Functions, Arrays, and Memory Pointers'],
    pages: 175,
    description: 'Hands-on programming guide. Master logical arrays, sequential flows, parameter passing, and syntax structures with custom AI code-review solver tools.',
    languageSupport: 'English Only',
    proRequired: true
  },
  {
    id: 'g12_civics',
    title: 'Grade 12 Civics and Ethical Education Student Textbook',
    subject: 'Civics',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Building a Democratic System', 'Chapter 2: The Rule of Law and Judicial Organs', 'Chapter 3: Human and Democratic Rights', 'Chapter 4: Active Community Participation & Patriotism'],
    pages: 140,
    description: 'Official Ministry textbook on federalism models, human rights codes, constitution principles, and civic duties for high school matric.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/civics-and-ethical-education'
  },
  {
    id: 'g12_agriculture',
    title: 'Grade 12 Agriculture Student Textbook (New Curriculum)',
    subject: 'Agriculture',
    grade: 'Grade 12 New Curriculum',
    chapters: ['Chapter 1: Crop Production & Soil Science in Ethiopia', 'Chapter 2: Animal Husbandry & Poultry Farming', 'Chapter 3: Agricultural Economics & Farm Management', 'Chapter 4: Modern Irrigation and Water Conservation'],
    pages: 156,
    description: 'Comprehensive study of agrarian science, soil conservation cycles, livestock husbandry, and smart water resources management in East Africa.',
    languageSupport: 'Bilingual',
    proRequired: false
  },
  {
    id: 'g12_business',
    title: 'Grade 12 Business Studies Student Textbook',
    subject: 'Business',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Nature and Scope of Business', 'Chapter 2: Business Environments and Ethics', 'Chapter 3: Forms of Business Ownership (Sole, Share)', 'Chapter 4: Basic Accounting Principles & Ledger Sheets'],
    pages: 130,
    description: 'Core concepts of entrepreneurship, financial accounting ledgers, ethical trade structures, and management frameworks in Ethiopia.',
    languageSupport: 'Bilingual',
    proRequired: true,
    pdfUrl: 'https://fetena.net/books/grade-12/general-business'
  },
  {
    id: 'g12_new_economics',
    title: 'Grade 12 Economics Student Textbook (New Curriculum)',
    subject: 'Economics',
    grade: 'Grade 12 New Curriculum',
    chapters: ['Chapter 1: Theory of Consumer Behavior', 'Chapter 2: Market Structure and Perfect Competition', 'Chapter 3: Macroeconomic Indicators in Ethiopia', 'Chapter 4: Monetary and Fiscal Policies'],
    pages: 168,
    description: 'Official Ministry new curriculum guide on demand elasticities, utility maximizations, inflation thresholds, and national bank monetary tools.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/economics'
  },
  {
    id: 'g12_new_geography',
    title: 'Grade 12 Geography Student Textbook (New Curriculum)',
    subject: 'Geography',
    grade: 'Grade 12 New Curriculum',
    chapters: ['Chapter 1: Geological Structure and Landforms of Ethiopia', 'Chapter 2: Climate and Weather Systems of East Africa', 'Chapter 3: Natural Resource Management & Conservation', 'Chapter 4: Population Density and Urbanization Profiles'],
    pages: 182,
    description: 'Comprehensive spatial analysis of Ethiopian highlands rift valleys, traditional farming soil cycles, and regional hydrological basins.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/geography'
  },
  {
    id: 'g12_new_history',
    title: 'Grade 12 History Student Textbook (New Curriculum)',
    subject: 'History',
    grade: 'Grade 12 New Curriculum',
    chapters: ['Chapter 1: Human Beginnings & Stone Age Cultures in the Horn', 'Chapter 2: State Formations, Trade and Religions (Axum, Lalibela)', 'Chapter 3: Modern Ethiopian State Unifications (1855-1974)', 'Chapter 4: The Federal Democratic Era & Contemporary Milestones'],
    pages: 210,
    description: 'New curriculum history resource mapping prehistoric sites like Hadar, early civilizations, Battle of Adwa victory details, and constitutional updates.',
    languageSupport: 'Bilingual',
    proRequired: true,
    pdfUrl: 'https://fetena.net/books/grade-12/history'
  },
  {
    id: 'g12_new_it',
    title: 'Grade 12 Information Technology Student Textbook (New Curriculum)',
    subject: 'Information Technology',
    grade: 'Grade 12 New Curriculum',
    chapters: ['Chapter 1: Advanced Information Systems & Databases', 'Chapter 2: Computer Networking & Cyber-Defenses', 'Chapter 3: Web Development Fundamentals (HTML, CSS, JS)', 'Chapter 4: Algorithms, Python Scripting & Emerging Algos'],
    pages: 154,
    description: 'Official guide covering relational database schemas, web authoring elements, and logical block scripting paradigms for high schoolers.',
    languageSupport: 'Bilingual',
    proRequired: true,
    pdfUrl: 'https://fetena.net/books/grade-12/ict'
  },
  {
    id: 'uni_civics',
    title: 'Moral and Civic Education Freshman Module (MCiE 1012)',
    subject: 'Moral and Civics',
    grade: 'University',
    chapters: ['Chapter 1: Understanding Civics, Morality, and Ethics', 'Chapter 2: State, Government, and Citizenship Foundations', 'Chapter 3: Human Rights and Constitutionalism in Ethiopia', 'Chapter 4: Democracy and Good Governance Indicators'],
    pages: 165,
    description: 'Essential freshman civic education module. Covers ethical theories, federal state structures, public responsibility, and global cooperation frameworks.',
    languageSupport: 'English Only',
    proRequired: false
  },
  {
    id: 'uni_geography',
    title: 'Geography of Ethiopia and the Horn (GeES 1011)',
    subject: 'Geography',
    grade: 'University',
    chapters: ['Chapter 1: Introduction to Geography & Spatial Coordinates', 'Chapter 2: Geological Structure & Physiographic Divisions', 'Chapter 3: Drainage Systems & Water Basins of Ethiopia', 'Chapter 4: Climate, Soil Systems, and Demography'],
    pages: 188,
    description: 'Standard freshman geography module covering tectonic plates, Abbay (Blue Nile) and Awash basins, highland soil types, and population geography.',
    languageSupport: 'English Only',
    proRequired: false
  },
  {
    id: 'uni_emerging_tech',
    title: 'Introduction to Emerging Technologies Freshman Module (EmTe 1012)',
    subject: 'Emerging Tech',
    grade: 'University',
    chapters: ['Chapter 1: Introduction to Industry 4.0 & Digital Transformation', 'Chapter 2: Artificial Intelligence & Machine Learning Frameworks', 'Chapter 3: Internet of Things (IoT) & Smart Systems', 'Chapter 4: Blockchain, Cybersecurity, and Cloud Infrastructures'],
    pages: 145,
    description: 'Covers the 4th industrial revolution (4IR) technologies: smart actuators, deep neural networks, cryptographic ledgers, and secure cloud orchestration.',
    languageSupport: 'English Only',
    proRequired: true
  },
  {
    id: 'uni_economics',
    title: 'Introduction to Economics Freshman Module (Econ 1011)',
    subject: 'Economics',
    grade: 'University',
    chapters: ['Chapter 1: Fundamental Concepts of Economics', 'Chapter 2: Market Demand, Supply, and Price Equilibrium', 'Chapter 3: Theory of Production and Cost Analysis', 'Chapter 4: Introduction to Macroeconomics and GDP'],
    pages: 172,
    description: 'Standard curriculum guide for first-year students. Explains opportunity cost, production frontiers, utility indifference curves, cost curves, and macroeconomic models.',
    languageSupport: 'English Only',
    proRequired: false
  }
];

export default function BookStoreView({
  profile,
  apiKey,
  language,
  onNavigate,
  onStudyAction,
  supabaseBooks,
  onOpenInAppViewer
}: BookStoreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search input (~250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  
  // Recent books list (1 to 3 items)
  const [recentBookIds, setRecentBookIds] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_recent_books');
      if (saved) return JSON.parse(saved);
      const oldSingle = safeStorage.getItem('ethiolearn_recently_viewed');
      return oldSingle ? [oldSingle] : [];
    } catch (e) {
      return [];
    }
  });

  // Collapsed subjects state (default is collapsed = true unless explicitly saved as false)
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_bookstore_collapsed_subjects');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const toggleSubjectCollapse = (subj: string) => {
    setCollapsedSubjects(prev => {
      // Default state is collapsed (true). So clicking toggles: if undefined or true, becomes false (expanded).
      const currentIsCollapsed = prev[subj] ?? true;
      const updated = { ...prev, [subj]: !currentIsCollapsed };
      safeStorage.setItem('ethiolearn_bookstore_collapsed_subjects', JSON.stringify(updated));
      return updated;
    });
  };

  const [activeSubjectChip, setActiveSubjectChip] = useState<string>('All');

  const [favoriteBookIds, setFavoriteBookIds] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_favorite_books');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const toggleFavoriteBook = (bookId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    playClickChime();
    setFavoriteBookIds(prev => {
      const updated = prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId];
      safeStorage.setItem('ethiolearn_favorite_books', JSON.stringify(updated));
      return updated;
    });
  };

  const renderBookCover = (mod: ModuleResource) => {
    const subject = mod.subject.toLowerCase();
    let bgGradient = "from-indigo-500 to-purple-600";
    let icon = "📚";
    if (subject.includes("math") || subject.includes("calculus")) {
      bgGradient = "from-blue-600 to-indigo-700";
      icon = "📐";
    } else if (subject.includes("physics")) {
      bgGradient = "from-violet-600 to-blue-700";
      icon = "⚡";
    } else if (subject.includes("chemistry")) {
      bgGradient = "from-emerald-500 to-teal-600";
      icon = "🧪";
    } else if (subject.includes("biology")) {
      bgGradient = "from-green-500 to-emerald-600";
      icon = "🧬";
    } else if (subject.includes("english")) {
      bgGradient = "from-cyan-500 to-blue-600";
      icon = "💬";
    } else if (subject.includes("aptitude")) {
      bgGradient = "from-purple-600 to-pink-600";
      icon = "🧩";
    } else if (subject.includes("logic")) {
      bgGradient = "from-amber-500 to-orange-600";
      icon = "🧠";
    } else if (subject.includes("history") || subject.includes("civics")) {
      bgGradient = "from-red-600 to-amber-700";
      icon = "🏛️";
    } else if (subject.includes("geography")) {
      bgGradient = "from-teal-600 to-green-700";
      icon = "🌍";
    } else if (subject.includes("programming") || subject.includes("tech")) {
      bgGradient = "from-slate-700 to-slate-900";
      icon = "💻";
    }
    
    return (
      <div className={`w-12 h-16 rounded-lg bg-gradient-to-br ${bgGradient} flex flex-col justify-between p-1 text-white shadow-md relative shrink-0 overflow-hidden select-none border border-white/10`}>
        <div className="absolute -right-2 -bottom-2 w-7 h-7 rounded-full bg-white/10" />
        <div className="absolute -left-1 -top-1 w-5 h-5 rounded-full bg-white/5" />
        <div className="text-[7.5px] font-black tracking-tighter opacity-85 uppercase leading-none truncate">
          {mod.grade}
        </div>
        <div className="text-sm self-center my-0.5 filter drop-shadow">
          {icon}
        </div>
        <div className="text-[7px] font-bold tracking-tight line-clamp-1 leading-tight text-center bg-black/25 rounded px-0.5 py-0.2">
          {mod.subject}
        </div>
      </div>
    );
  };
  
  // All active modules state
  const [allModules, setAllModules] = useState<ModuleResource[]>(() => {
    const baseList: ModuleResource[] = [...PREBUILT_MODULES];
    try {
      const saved = safeStorage.getItem('ethiolearn_custom_books');
      if (saved) {
        return [...baseList, ...JSON.parse(saved)];
      }
    } catch (e) {
      console.error('Error loading custom books:', e);
    }
    return baseList;
  });

  // Selected resource for detailed preview / AI interactions
  const [activeModule, setActiveModule] = useState<ModuleResource | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  
  // AI activity state
  const [aiMode, setAiMode] = useState<'none' | 'summary' | 'exam' | 'notes'>('none');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  // Quiz Engine state if exam generated
  const [customQuizQuestions, setCustomQuizQuestions] = useState<any[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);

  // Supabase states
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false);
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'idle' | 'loading' | 'success' | 'err'>('idle');
  const [showSupabaseGuide, setShowSupabaseGuide] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => safeStorage.getItem('ethiolearn_supabase_url') || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => safeStorage.getItem('ethiolearn_supabase_key') || '');

  // In-app Reader states
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [viewingPdfMode, setViewingPdfMode] = useState(false);
  const [readerTheme, setReaderTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [readerFontSize, setReaderFontSize] = useState<number>(14);
  const [readerSearchQuery, setReaderSearchQuery] = useState('');
  const [readerHighlights, setReaderHighlights] = useState<string[]>([]);
  const [inlineAiQuestion, setInlineAiQuestion] = useState('');
  const [inlineAiResponse, setInlineAiResponse] = useState('');
  const [inlineAiLoading, setInlineAiLoading] = useState(false);

  // Custom book addition form/modal states
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookSubject, setNewBookSubject] = useState('');
  const [newBookGrade, setNewBookGrade] = useState('Grade 12');
  const [newBookDescription, setNewBookDescription] = useState('');
  const [newBookChaptersText, setNewBookChaptersText] = useState('');
  const [newBookPages, setNewBookPages] = useState('120');
  const [newBookPdfUrl, setNewBookPdfUrl] = useState('');
  const [newBookContent, setNewBookContent] = useState('');

  const handleAddCustomBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !newBookSubject.trim()) {
      alert(language === 'en' ? 'Please provide a title and subject for your book!' : 'እባክዎን የመጽሐፍ ርዕስ እና የትምህርት አይነት ያስገቡ!');
      return;
    }

    const customId = `custom_book_${Date.now()}`;
    const parsedChapters = newBookChaptersText
      ? newBookChaptersText.split(/[,\n]+/).map(c => c.trim()).filter(Boolean)
      : ['Chapter 1: Foundations', 'Chapter 2: Advanced Analysis', 'Chapter 3: Mock Revision'];

    // Format content nicely for textbook engine
    const dynamicContent: Record<string, any> = {};
    parsedChapters.forEach((ch) => {
      dynamicContent[ch] = {
        title: ch,
        intro: `Notes segment for ${ch} in ${newBookTitle}.`,
        sections: [
          {
            title: `1. Study Module: ${ch}`,
            body: newBookContent || `Detailed student learning sheet for ${ch}. Use Abreham's AI assistant or the summary tools below to flesh out standard study logs.`
          }
        ],
        keyTerms: [
          { term: 'Custom Reference (የተማሪ ማስታወሻ)', definition: 'Studying materials inputted by the student user.' }
        ]
      };
    });

    const newBook: ModuleResource = {
      id: customId,
      title: newBookTitle,
      subject: newBookSubject,
      grade: newBookGrade,
      chapters: parsedChapters,
      pages: parseInt(newBookPages) || 120,
      description: newBookDescription || 'Student-uploaded custom study guide.',
      languageSupport: 'Bilingual',
      proRequired: false,
      pdfUrl: newBookPdfUrl.trim() || undefined,
      contentJson: JSON.stringify(dynamicContent),
      isSupabase: false
    };

    try {
      const saved = safeStorage.getItem('ethiolearn_custom_books');
      const customBooks = saved ? JSON.parse(saved) : [];
      const updated = [...customBooks, newBook];
      safeStorage.setItem('ethiolearn_custom_books', JSON.stringify(updated));
      
      setAllModules(prev => [...prev, newBook]);
      playSuccessChime();
      alert(language === 'en' 
        ? `Successfully added your book "${newBookTitle}"! It is now fully integrated with our AI Summarizers and Study Buddies.` 
        : `መጽሐፍዎ "${newBookTitle}" በተሳካ ሁኔታ ተጨምሯል! አሁን ከአይ ረዳቱ ጋር አብሮ ይሰራል።`
      );

      // Reset form fields
      setNewBookTitle('');
      setNewBookSubject('');
      setNewBookGrade('Grade 12');
      setNewBookDescription('');
      setNewBookChaptersText('');
      setNewBookPages('120');
      setNewBookPdfUrl('');
      setNewBookContent('');
      setShowAddBookModal(false);
      setActiveModule(newBook);
      setSelectedChapter(parsedChapters[0]);
    } catch (err) {
      console.error(err);
      playFailureChime();
    }
  };

  // Filter modules with debounced search query and precise grade checks
  const filtered = allModules.filter(m => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
                          m.title.toLowerCase().includes(q) || 
                          m.subject.toLowerCase().includes(q) || 
                          m.description.toLowerCase().includes(q) ||
                          m.chapters.some(ch => ch.toLowerCase().includes(q));
    
    let matchesGrade = false;
    if (selectedGrade === 'All') {
      matchesGrade = true;
    } else if (selectedGrade === 'Grade 12') {
      matchesGrade = m.grade === 'Grade 12';
    } else if (selectedGrade === 'Grade 12 New Curriculum') {
      matchesGrade = m.grade === 'Grade 12 New Curriculum';
    } else if (selectedGrade === 'University') {
      matchesGrade = m.grade === 'University';
    } else {
      matchesGrade = m.grade === selectedGrade;
    }

    const matchesFavorites = !showFavoritesOnly || favoriteBookIds.includes(m.id);

    return matchesSearch && matchesGrade && matchesFavorites;
  });

  // IntersectionObserver to sync active subject chip with scroll position
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const subjId = entry.target.getAttribute('data-subject-id');
            if (subjId) {
              setActiveSubjectChip(subjId);
            }
          }
        });
      },
      { threshold: 0.15, rootMargin: '-60px 0px -40% 0px' }
    );

    const subjectElements = document.querySelectorAll('[data-subject-id]');
    subjectElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [filtered, collapsedSubjects, debouncedSearchQuery]);

  // Check trial expiration vs pro
  const isEligible = profile.isPro || profile.proStatus === 'pending';

  const handleSelectModule = (mod: ModuleResource) => {
    playClickChime();
    setActiveModule(mod);
    setSelectedChapter(mod.chapters[0]);
    
    // Save to recent books history (up to 3 items)
    setRecentBookIds(prev => {
      const updated = [mod.id, ...prev.filter(id => id !== mod.id)].slice(0, 3);
      safeStorage.setItem('ethiolearn_recent_books', JSON.stringify(updated));
      return updated;
    });
    safeStorage.setItem('ethiolearn_recently_viewed', mod.id);

    // Reset AI states
    setAiMode('none');
    setAiResponse('');
    setCustomQuizQuestions([]);
    setQuizScore(null);

    // Speedily scroll the active module block into view for seamless mobile view
    setTimeout(() => {
      const viewer = document.getElementById('module-viewer-section');
      if (viewer) {
        viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Run AI summaries
  const handleAISummarize = async () => {
    if (!activeModule) return;
    if (!isEligible && activeModule.proRequired) {
      playFailureChime();
      alert(language === 'en' 
        ? "This module requires premium upgrade! Your 3-day trial is up. Please upgrade to Pro for 200 BIRR per semester." 
        : "ይህ ሞጁል የአባልነት ክፍያ ይጠይቃል። እባክዎ በአንድ ሴሚስተር 200 ብር ብቻ ከፍለው መዳረሻ ያግኙ።");
      onNavigate('upgrade');
      return;
    }

    setAiMode('summary');
    setAiLoading(true);
    setAiResponse('');
    playClickChime();

    const chapterText = selectedChapter || activeModule.chapters[0];
    const systemPrompt = "You are a professional educational summarizer with key facts highlights. Output structured bullet notes with beautiful ASCII charts where relevant.";
    const userPrompt = `Under the document titled "${activeModule.title}" and subject "${activeModule.subject}", generate short notes and a revision overview for: "${chapterText}". 
Include:
1. Core Principles (Explained in 3 clear bullet points)
2. Crucial Formulas, Equations, or Core definitions (High value for National exams)
3. One quick mnemonic or shortcut to remember these points under stress.
Format nicely so it is very clean, accessible, and matches an EdTech application layout. Add brief Amharic summaries for technical terms.`;

    try {
      const messages = [{ role: 'user' as const, content: userPrompt }];
      await submitClaudeChat(messages, systemPrompt, apiKey || "no-key", {
        onChunk: (chunk) => {
          setAiResponse(prev => prev + chunk);
        },
        onComplete: (fullText) => {
          setAiLoading(false);
          setAiResponse(fullText);
          playSuccessChime();
          onStudyAction(); // extends streak
        },
        onError: (err) => {
          setAiLoading(false);
          setAiResponse(`Failed to call AI model helper: ${err}`);
          playFailureChime();
        }
      });
    } catch (e: any) {
      setAiLoading(false);
      setAiResponse(`System Error: ${e.message}`);
    }
  };

  // Run AI Custom Exam Generator
  const handleAIGenerateExam = async () => {
    if (!activeModule) return;
    if (!isEligible && activeModule.proRequired) {
      playFailureChime();
      onNavigate('upgrade');
      return;
    }

    setAiMode('exam');
    setAiLoading(true);
    setAiResponse('');
    setCustomQuizQuestions([]);
    setQuizScore(null);
    setCurrentQuizIndex(0);
    playClickChime();

    const chapterText = selectedChapter || activeModule.chapters[0];
    const systemPrompt = "You are an Ethiopian National Exam compiler specializing in multiple-choice questions. You output ONLY valid JSON arrays. Do not wrap in markdown or markdown code blocks.";
    const userPrompt = `Construct a highly-curated mock exam with exactly 3 multiple choice questions based on ${activeModule.subject} - ${chapterText} from the textbook "${activeModule.title}". 
Respond strictly in a clean JSON format matching this pattern:
[
  {
    "question": "Clear exam level multiple-choice question text?",
    "options": ["A) Correct Option", "B) Option", "C) Option", "D) Option"],
    "correctIndex": 0,
    "explanation": "High-value detailed step-by-step math or physical calculation explaining why this derivative, flux, or clause is the chosen alternative."
  }
]
No other text. No conversational prefix. No markdown \`\`\`json wrappers.`;

    try {
      const messages = [{ role: 'user' as const, content: userPrompt }];
      await submitClaudeChat(messages, systemPrompt, apiKey || "no-key", {
        onChunk: () => {},
        onComplete: (fullText) => {
          setAiLoading(false);
          try {
            let clean = fullText.trim();
            if (clean.startsWith('```json')) clean = clean.slice(7);
            if (clean.startsWith('```')) clean = clean.slice(3);
            if (clean.endsWith('```')) clean = clean.slice(0, -3);
            
            const parsed = JSON.parse(clean.trim());
            if (Array.isArray(parsed)) {
              setCustomQuizQuestions(parsed);
              playSuccessChime();
            } else {
              throw new Error("Parsed data is not an array");
            }
          } catch (e) {
            console.error(e);
            setAiResponse("AI response format was unparsable standard text. Let us display raw draft below:\n\n" + fullText);
          }
        },
        onError: (err) => {
          setAiLoading(false);
          setAiResponse(`Failed to compile exam: ${err}`);
          playFailureChime();
        }
      });
    } catch (e: any) {
      setAiLoading(false);
      setAiResponse(`Failed: ${e.message}`);
    }
  };

  // Run Pro Notes Draft
  const handleAIGenerateProNotes = async () => {
    if (!activeModule) return;
    if (!isEligible && activeModule.proRequired) {
      playFailureChime();
      onNavigate('upgrade');
      return;
    }

    setAiMode('notes');
    setAiLoading(true);
    setAiResponse('');
    playClickChime();

    const chapterText = selectedChapter || activeModule.chapters[0];
    const systemPrompt = "You are a master scientific scribe that constructs elite-level concise, stylized study sheets with diagnostic details.";
    const userPrompt = `Write a blueprint-level Pro Notebook article for the topic "${chapterText}" in "${activeModule.title}" (Subject: ${activeModule.subject}). 
Ensure the layout utilizes clear headers, a detailed markdown text explanation, visual ASCII flowcharts mapping the principles, exam trap alerts (highly-tested trick questions), and localized applications for Ethiopian context. Include bilingual English/Amharic vocab mappings.`;

    try {
      const messages = [{ role: 'user' as const, content: userPrompt }];
      await submitClaudeChat(messages, systemPrompt, apiKey || "no-key", {
        onChunk: (chunk) => {
          setAiResponse(prev => prev + chunk);
        },
        onComplete: (fullText) => {
          setAiLoading(false);
          setAiResponse(fullText);
          playSuccessChime();
          onStudyAction();
        },
        onError: (err) => {
          setAiLoading(false);
          setAiResponse(`Failed to generate Pro Notes: ${err}`);
        }
      });
    } catch (e: any) {
      setAiLoading(false);
      setAiResponse(`Error: ${e.message}`);
    }
  };

  const getOfflineTutorResponse = (question: string, content: any): string => {
    const qLower = question.toLowerCase();
    
    // Find matching terms
    let termMatches = '';
    if (content.keyTerms && content.keyTerms.length > 0) {
      const matches = content.keyTerms.filter((kt: any) => {
        const term = (kt.term || '').toLowerCase();
        return qLower.includes(term) || term.split(' ').some((w: string) => w.length > 3 && qLower.includes(w));
      });
      if (matches.length > 0) {
        termMatches = `#### 🔑 Vocabulary & Key Terms Found:\n` + matches.map((m: any) => `* **${m.term}**${m.amharic ? ` (${m.amharic})` : ''}: ${m.definition}`).join('\n') + `\n\n`;
      }
    }

    // Find matching sections
    let sectionMatches = '';
    if (content.sections && content.sections.length > 0) {
      const matches = content.sections.filter((sec: any) => {
        const title = (sec.title || '').toLowerCase();
        const body = (sec.body || '').toLowerCase();
        return qLower.includes(title) || title.split(/[\s,.-]+/).some((w: string) => w.length > 4 && qLower.includes(w)) ||
               body.split(/[\s,.-]+/).some((w: string) => w.length > 5 && qLower.includes(w));
      });
      if (matches.length > 0) {
        sectionMatches = `#### 📖 Textbook Content Breakdown Details:\n` + matches.map((m: any) => `* **${m.title}**\n  ${m.body}`).join('\n\n') + `\n\n`;
      }
    }

    // Formulas if any
    let formulaMatches = '';
    if (content.formulas && content.formulas.length > 0) {
      const matches = content.formulas.filter((f: any) => {
        const name = (f.name || '').toLowerCase();
        return qLower.includes(name) || qLower.includes('formula') || qLower.includes('calculate') || qLower.includes('equation');
      });
      if (matches.length > 0) {
        formulaMatches = `#### 🧮 Important Equations Explained:\n` + matches.map((m: any) => `* **${m.name}**: \`${m.formula}\` — *${m.description}*`).join('\n') + `\n\n`;
      }
    }

    // Default summaries if zero specific matched items
    let defaultResponse = '';
    if (!termMatches && !sectionMatches && !formulaMatches) {
      defaultResponse = `#### 📖 Chapter Overview:\n${content.intro || 'This chapter introduces essential topics from the curriculum syllabus.'}\n\n* **Curriculum Focus**: Ethiopian National Exam Preparatory Content.\n* **Available Topics** in this chapter: \n  ${(content.sections || []).map((s: any) => `  - *${s.title}*`).join('\n')}\n\n`;
    }

    const header = `### 🤖 EthioLearn Local Study Buddy (Offline Mode)
*Your live tutor is currently offline (Check your API settings/internet status).* Let's explore the cached textbook information for your question!

---

`;

    const footer = `---
💡 **Study Tip**: You can customize or activate a live interactive AI Tutor at any time by configuring a valid **API Key** or server fallback in the **Settings** menu at the top-right corner. Keep practicing! 🚀`;

    return `${header}${termMatches}${sectionMatches}${formulaMatches}${defaultResponse}${footer}`;
  };

  // Inline AI Tutor Chapter helper chat
  const handleInlineAnswer = async () => {
    if (!inlineAiQuestion.trim() || !activeModule) return;
    setInlineAiLoading(true);
    setInlineAiResponse('');
    playClickChime();

    const chapterContent = getChapterContent(activeModule.id, selectedChapter, activeModule.contentJson);
    const contentSummary = `Book: ${activeModule.title}\nChapter: ${selectedChapter}\nIntro: ${chapterContent.intro}\nContent: ${chapterContent.sections.map(s => s.title + ': ' + s.body).join('\n')}`;

    const systemPrompt = `You are the EthioLearn AI Tutor. You are helping an Ethiopian student read the active chapter of their textbook.\nActive textbook material context:\n${contentSummary}\nAnswer the student's question clearly, concisely, and encouragingly. Use local analogies (such as Ethiopia's rivers, cities, historical triumphs, agriculture) where helpful. Keep formatting neat.`;
    
    const messages = [
      { role: 'user' as const, content: inlineAiQuestion }
    ];

    try {
      await submitClaudeChat(messages, systemPrompt, apiKey || "no-key", {
        onChunk: (chunk) => {
          setInlineAiResponse(prev => prev + chunk);
        },
        onComplete: (fullText) => {
          setInlineAiLoading(false);
          setInlineAiResponse(fullText);
          playSuccessChime();
        },
        onError: (err) => {
          console.warn('AI Tutor Live error, falling back locally:', err);
          const offlineAnswer = getOfflineTutorResponse(inlineAiQuestion, chapterContent);
          setInlineAiLoading(false);
          setInlineAiResponse(offlineAnswer);
        }
      });
    } catch (err: any) {
      console.warn('AI Tutor Connection thrown error, falling back locally:', err);
      const offlineAnswer = getOfflineTutorResponse(inlineAiQuestion, chapterContent);
      setInlineAiLoading(false);
      setInlineAiResponse(offlineAnswer);
    }
  };

  // Custom Quiz Engine handling
  const handleQuizAnswer = (optionIdx: number) => {
    if (selectedQuizOption !== null) return; // already selected
    setSelectedQuizOption(optionIdx);
    playClickChime();
  };

  const handleNextQuizQuestion = () => {
    if (selectedQuizOption === null) return;
    
    // Check answer correctness
    const currentQ = customQuizQuestions[currentQuizIndex];
    const isCorrect = selectedQuizOption === currentQ.correctIndex;
    if (isCorrect) {
      setQuizScore(prev => (prev || 0) + 1);
      playSuccessChime();
    } else {
      playFailureChime();
    }

    if (currentQuizIndex + 1 < customQuizQuestions.length) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedQuizOption(null);
    } else {
      // Finished
      const finalScoreCount = (quizScore || 0) + (isCorrect ? 1 : 0);
      setQuizScore(finalScoreCount);
      playSuccessChime();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {language === 'en' ? 'Digital Textbook & Reference Library' : 'የሞጁሎችና ዲጂታል መጻሕፍት ማከማቻ'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans max-w-xl">
            {language === 'en' 
              ? 'Access Ethiopian Ministry of Education curriculum textbooks, freshman university modules, and AI chapter summaries.' 
              : 'የብሔራዊ ፈተና ማዘጋጃ ሞጁሎችን፣ የዩኒቨርሲቲ መጽሐፎችን እና ጠቃሚ ፒዲኤፎችን እዚህ ያግኙ።'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search title, subject, unit...' : 'መጽሐፍ ወይም ትምህርት ፈልግ..'}
              className="w-full sm:w-52 pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          <button
            onClick={() => {
              playClickChime();
              setShowFavoritesOnly(!showFavoritesOnly);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer min-h-[38px] ${
              showFavoritesOnly 
                ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-slate-950 text-slate-950' : 'text-amber-400'}`} />
            {language === 'en' ? 'Favorites' : 'ምርጦች'}
            {favoriteBookIds.length > 0 && ` (${favoriteBookIds.length})`}
          </button>

          <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs font-bold leading-none select-none overflow-x-auto">
            {['All', 'Grade 12', 'Grade 12 New Curriculum', 'University'].map(g => (
              <button
                key={g}
                onClick={() => { playClickChime(); setSelectedGrade(g); }}
                className={`px-3 py-2 rounded-lg text-[10px] cursor-pointer tracking-tight uppercase transition-all whitespace-nowrap min-h-[36px] ${
                  selectedGrade === g 
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Subject Quick-Nav Bar */}
      {(() => {
        const availableSubjects = Array.from(new Set(filtered.map(m => m.subject))) as string[];
        if (availableSubjects.length <= 1) return null;

        return (
          <div className="sticky top-2 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-lg overflow-x-auto scrollbar-none flex items-center gap-2 select-none">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pl-2 shrink-0 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" /> Department / Subject:
            </span>
            <button
              onClick={() => {
                playClickChime();
                setActiveSubjectChip('All');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1 min-h-[36px] ${
                activeSubjectChip === 'All'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              All ({filtered.length})
            </button>

            {availableSubjects.map((subj) => {
              const isActive = activeSubjectChip === subj;
              const count = filtered.filter(m => m.subject === subj).length;
              return (
                <button
                  key={subj}
                  onClick={() => {
                    playClickChime();
                    setActiveSubjectChip(subj);
                    // Ensure target subject section is uncollapsed
                    if (collapsedSubjects[subj] ?? true) {
                      setCollapsedSubjects(prev => {
                        const updated = { ...prev, [subj]: false };
                        safeStorage.setItem('ethiolearn_bookstore_collapsed_subjects', JSON.stringify(updated));
                        return updated;
                      });
                    }
                    setTimeout(() => {
                      const targetEl = document.getElementById(`subject-section-${encodeURIComponent(subj)}`);
                      if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 40);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border min-h-[36px] ${
                    isActive
                      ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md font-black scale-105'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/50'
                  }`}
                >
                  <span>{subj}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Module selection left list (5 columns) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Continue where you left off (1 - 3 recent books) */}
          {(() => {
            const recentModules = recentBookIds
              .map(id => allModules.find(m => m.id === id))
              .filter((m): m is ModuleResource => !!m);

            if (recentModules.length === 0) return null;

            return (
              <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-emerald-500/20 border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>📖</span> {language === 'en' ? 'Continue Where You Left Off' : 'ንባብዎን ካቆሙበት ይቀጥሉ'}
                  </h4>
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono font-extrabold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                    {recentModules.length} {recentModules.length === 1 ? 'Book' : 'Books'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {recentModules.map(rm => (
                    <div 
                      key={rm.id}
                      onClick={() => handleSelectModule(rm)}
                      className="flex items-center gap-3 bg-white/95 dark:bg-[#121a2e]/95 p-2.5 rounded-xl hover:shadow-md cursor-pointer border border-slate-100 dark:border-zinc-800 transition-all hover:scale-[1.01] group"
                    >
                      {renderBookCover(rm)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase text-slate-400 dark:text-zinc-500">
                          <span>{rm.grade}</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400">{rm.subject}</span>
                        </div>
                        <h5 className="font-serif font-black text-xs text-slate-800 dark:text-zinc-100 truncate mt-0.5 group-hover:text-indigo-500 transition-colors">
                          {rm.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                          {rm.description}
                        </p>
                      </div>
                      <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shrink-0 shadow-sm cursor-pointer">
                        Resume &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Collapsible lists grouped by subject */}
          <div className="space-y-4">
            {(() => {
              const groupedBySubject = filtered.reduce((acc, m) => {
                const subj = m.subject;
                if (!acc[subj]) acc[subj] = [];
                acc[subj].push(m);
                return acc;
              }, {} as Record<string, ModuleResource[]>);

              const subjectKeys = Object.keys(groupedBySubject);
              if (subjectKeys.length === 0) {
                return (
                  <div className="text-center py-10 bg-white dark:bg-[#121A2E] border border-slate-200 dark:border-zinc-800 rounded-2xl">
                    <p className="text-sm text-slate-400 dark:text-zinc-500">
                      {language === 'en' ? 'No textbook modules match your filters.' : 'ከምርጫዎ ጋር የሚዛመድ ሞጁል አልተገኘም።'}
                    </p>
                  </div>
                );
              }

              return subjectKeys.map(subj => {
                // Default state is collapsed (true), unless user explicitly opened it, or active search
                const isSearching = debouncedSearchQuery.trim().length > 0;
                const isCollapsed = isSearching ? false : (collapsedSubjects[subj] ?? true);
                const subjectModules = groupedBySubject[subj];

                return (
                  <div 
                    key={subj} 
                    id={`subject-section-${encodeURIComponent(subj)}`}
                    data-subject-id={subj}
                    className="border border-slate-200 dark:border-zinc-800/60 p-3 rounded-2xl bg-white dark:bg-[#0f1423] shadow-sm space-y-2 scroll-mt-20"
                  >
                    {/* Collapsible Subject Header */}
                    <div 
                      onClick={() => {
                        playClickChime();
                        toggleSubjectCollapse(subj);
                      }}
                      className="flex items-center justify-between px-2 py-2 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-zinc-800/40 rounded-xl transition-all min-h-[44px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📚</span>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                          <span>{subj}</span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono font-normal bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                            {subjectModules.length} {subjectModules.length === 1 ? 'book' : 'books'}
                          </span>
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                          {isCollapsed ? 'Expand' : 'Collapse'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                      </div>
                    </div>
                    
                    {/* Subject book cards list */}
                    {!isCollapsed && (
                      <div className="grid grid-cols-1 gap-2.5 pt-1">
                        {subjectModules.map(mod => {
                          const isActive = activeModule?.id === mod.id;
                          const hasPremiumBadge = mod.proRequired;
                          return (
                            <div
                              key={mod.id}
                              onClick={() => handleSelectModule(mod)}
                              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden flex items-center gap-3 hover:translate-y-[-1px] ${
                                isActive
                                  ? 'border-[#4F46E5] bg-indigo-500/5 dark:border-indigo-500/60 shadow-md'
                                  : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#121A2E] hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:shadow-sm'
                              }`}
                            >
                              {/* Dynamic book cover */}
                              {renderBookCover(mod)}
                              
                              {/* Book info content */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[8.5px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400">
                                    {mod.grade}
                                  </span>
                                  
                                  <div className="flex items-center gap-1.5 font-sans">
                                    {mod.isSupabase && (
                                      <span className="text-[8px] font-bold uppercase tracking-widest px-1 bg-[#078930]/10 text-[#078930] dark:text-emerald-400 border border-[#078930]/10 rounded flex items-center gap-0.5">
                                        <Database className="w-2 h-2 text-[#078930] dark:text-emerald-400" /> Online Library
                                      </span>
                                    )}
                                    {hasPremiumBadge && (
                                      isEligible ? (
                                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md">
                                          ⭐ PRO Access
                                        </span>
                                      ) : (
                                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-md animate-pulse">
                                          🔒 PRO Limit
                                        </span>
                                      )
                                    )}
                                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                                      {mod.pages} p.
                                    </span>
                                    <button
                                      onClick={(e) => toggleFavoriteBook(mod.id, e)}
                                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 text-slate-400 dark:text-zinc-500 hover:text-amber-500 group"
                                      title={language === 'en' ? 'Add to Favorites' : 'ወደ ምርጥ መጻሕፍት ጨምር'}
                                    >
                                      <Star 
                                        className={`w-3.5 h-3.5 transition-all ${
                                          favoriteBookIds.includes(mod.id)
                                            ? 'fill-amber-400 text-amber-500 scale-110'
                                            : 'group-hover:scale-105'
                                        }`} 
                                      />
                                    </button>
                                  </div>
                                </div>

                                <h3 className="font-serif font-black text-xs text-slate-800 dark:text-zinc-100 leading-tight truncate">
                                  {mod.title}
                                </h3>

                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-1 leading-normal">
                                  {mod.description}
                                </p>
                                
                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-0.5">
                                  <span>📚 {mod.subject}</span>
                                  <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                                    Open &rarr;
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Interactive PDF reading and AI panel (7 columns) */}
        <div id="module-viewer-section" className="lg:col-span-7 space-y-6">
          {activeModule ? (
            <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Module Header info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-105 dark:border-zinc-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-805 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded uppercase">
                      {activeModule.subject}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                      • {activeModule.languageSupport}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-black text-slate-900 dark:text-zinc-100 leading-tight">
                    {activeModule.title}
                  </h3>
                </div>

                {/* Status indicator badge / Favorite button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => toggleFavoriteBook(activeModule.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      favoriteBookIds.includes(activeModule.id)
                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm hover:bg-amber-600'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${favoriteBookIds.includes(activeModule.id) ? 'fill-white text-white' : ''}`} />
                    {favoriteBookIds.includes(activeModule.id) 
                      ? (language === 'en' ? 'Favorited' : 'ተመርጧል')
                      : (language === 'en' ? 'Favorite' : 'ወደ ምርጥ')}
                  </button>
                  {!isEligible && activeModule.proRequired && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-bold leading-none shrink-0 cursor-pointer" onClick={() => onNavigate('upgrade')}>
                      <span>🔒 Trial Ended Upgrade</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PDF Chapters drop and selection */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Select Chapter / Segment to Analyze:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeModule.chapters.map(ch => {
                      const isChActive = selectedChapter === ch;
                      return (
                        <button
                          key={ch}
                          onClick={() => { playClickChime(); setSelectedChapter(ch); }}
                          className={`px-3 py-2.5 rounded-xl border-2 text-left text-xs font-semibold leading-tight capitalize transition-colors cursor-pointer ${
                            isChActive
                              ? 'border-[#078930] bg-[#078930]/5 text-emerald-850 dark:text-white dark:border-emerald-500'
                              : 'border-slate-100 dark:border-zinc-805 bg-slate-50 dark:bg-zinc-900 hover:border-slate-350 hover:bg-slate-100'
                          }`}
                        >
                          <span className="line-clamp-1">{ch}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Book e-Reader primary trigger button */}
                <div className="pt-2 pb-1 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => { playClickChime(); setIsReaderOpen(true); }}
                      className="py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-extrabold uppercase tracking-widest cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <BookOpenCheck className="w-5 h-5 shrink-0" />
                      <span>📖 Read In-App</span>
                    </button>

                    {activeModule.pdfUrl ? (
                      <button
                        onClick={() => {
                          playClickChime();
                          if (onOpenInAppViewer) {
                            onOpenInAppViewer(activeModule.pdfUrl!, activeModule.title);
                          } else {
                            setViewingPdfMode(!viewingPdfMode);
                          }
                        }}
                        className={`py-4 rounded-2xl text-xs font-extrabold uppercase tracking-widest cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border-2 ${
                          viewingPdfMode 
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-[#078930] dark:text-emerald-400 font-black' 
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-100 hover:bg-slate-205 text-slate-700 dark:text-zinc-200'
                        }`}
                      >
                        <FileText className="w-5 h-5 shrink-0 animate-bounce" />
                        <span>📄 Open PDF In-App</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="py-4 bg-slate-104 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 text-slate-400 dark:text-zinc-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                      >
                        <FileText className="w-5 h-5 shrink-0 opacity-40" />
                        <span>No PDF File</span>
                      </button>
                    )}
                  </div>

                  {activeModule.pdfUrl && (
                    <div className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div className="space-y-0.5 max-w-[70%]">
                        <p className="font-bold text-[#078930] dark:text-emerald-404 flex items-center gap-1 text-[11px]">
                          📥 Original PDF Detected
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                          File: {activeModule.pdfUrl.split('/').pop() || 'Textbook Document'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playSuccessChime();
                          if (onOpenInAppViewer) {
                            onOpenInAppViewer(activeModule.pdfUrl!, activeModule.title);
                          } else {
                            window.open(activeModule.pdfUrl, "_blank");
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-605 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Read In-App</span>
                      </button>
                    </div>
                  )}

                  {/* Standard embedded IFrame PDF presentation */}
                  {viewingPdfMode && activeModule.pdfUrl && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 overflow-hidden rounded-2xl border-2 border-emerald-600 bg-slate-900 text-white shadow-inner"
                    >
                      <div className="px-3 py-2 bg-emerald-950/40 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-400">
                        <span className="truncate flex items-center gap-1.5">
                          📄 {activeModule.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              playSuccessChime();
                              if (onOpenInAppViewer) {
                                onOpenInAppViewer(activeModule.pdfUrl!, activeModule.title);
                              } else {
                                window.open(activeModule.pdfUrl, "_blank");
                              }
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-black uppercase rounded flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Expand View ↗</span>
                          </button>
                          <button 
                            onClick={() => setViewingPdfMode(false)}
                            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Helper box */}
                      <div className="p-2 bg-amber-500/10 border-b border-zinc-800 text-[11px] text-amber-300 flex items-center gap-1.5 px-3">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span className="leading-tight">
                          If the textbook fails to render below, tap 
                          <button 
                            type="button"
                            onClick={() => {
                              playSuccessChime();
                              if (onOpenInAppViewer) {
                                onOpenInAppViewer(activeModule.pdfUrl!, activeModule.title);
                              } else {
                                window.open(activeModule.pdfUrl, "_blank");
                              }
                            }}
                            className="underline mx-1 font-bold text-white hover:text-emerald-400 cursor-pointer bg-transparent border-0 p-0"
                          >
                            In-App Reader
                          </button> 
                          to load it reliably inside the app!
                        </span>
                      </div>

                      <div className="relative w-full h-[600px] bg-slate-950">
                        <iframe 
                          src={`https://docs.google.com/gview?url=${encodeURIComponent(activeModule.pdfUrl)}&embedded=true`}
                          title={`PDF Textbook Viewer: ${activeModule.title}`}
                          className="w-full h-full border-0"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </motion.div>
                  )}

                  <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500 mt-1.5 font-sans">
                    Optionally read the interactive chapter lessons directly, or preview & download the official textbook PDF.
                  </p>
                </div>

                {/* AI Interactive buttons row */}
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3.5">🎯 AI Modules Copilot Actions:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Summarize button */}
                    <button
                      onClick={handleAISummarize}
                      disabled={aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-[#078930] to-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Bot className="w-4 h-4 shrink-0" />
                      <span>Summarize Note</span>
                    </button>

                    {/* Generate Custom Exam button */}
                    <button
                      onClick={handleAIGenerateExam}
                      disabled={aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-indigo-650 to-indigo-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 shrink-0" />
                      <span>Custom Exam</span>
                    </button>

                    {/* Pro notes guide */}
                    <button
                      onClick={handleAIGenerateProNotes}
                      disabled={aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-amber-500 to-[#C8962E] text-black rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Pro Study Card</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Workspace response stage */}
              <div className="border-t border-slate-105 dark:border-zinc-800 pt-5">
                
                {aiLoading && (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <div className="w-10 h-10 border-4 border-[#078930] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-500 animate-pulse font-mono">Consolidating syllabus, preparing educational stream...</p>
                  </div>
                )}

                {!aiLoading && aiMode === 'none' && (
                  <div className="py-8 bg-slate-50 dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 p-6 rounded-2xl text-center">
                    <Compass className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
                    <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase mt-2">Ready to compile syllabus details</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-650 mt-1 max-w-sm mx-auto">
                      Choose any chapter from the list above and click an AI action to generate interactive summaries, custom MCQ exams, or blueprint pro study sheets.
                    </p>
                  </div>
                )}

                {/* Markdown text display for summary or notes */}
                {!aiLoading && (aiMode === 'summary' || aiMode === 'notes') && aiResponse && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-150 text-[#078930] dark:text-emerald-405 text-xs font-bold font-mono">
                      <span>📌 {aiMode === 'summary' ? 'Syllabus Summary Notes' : 'Pro Revision Blueprint Card'}</span>
                      <button onClick={() => { playClickChime(); setAiResponse(''); setAiMode('none'); }} className="hover:underline">Clear Notes</button>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#07080c] border border-slate-200 dark:border-zinc-850 overflow-y-auto max-h-[350px] scrollbar-thin text-xs leading-relaxed space-y-3 font-sans">
                      <div className="whitespace-pre-wrap">{aiResponse}</div>
                    </div>
                  </div>
                )}

                {/* Custom Exam Multiple Choice Quiz interface */}
                {!aiLoading && aiMode === 'exam' && customQuizQuestions.length > 0 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/20 px-3 py-2 rounded-xl border border-indigo-150 text-indigo-705 dark:text-indigo-405 text-xs font-bold font-mono">
                      <span>📝 Custom Mock Exam ({customQuizQuestions.length} Questions)</span>
                      <button onClick={() => { playClickChime(); setCustomQuizQuestions([]); setAiMode('none'); }} className="hover:underline">Cancel Quiz</button>
                    </div>

                    {quizScore !== null && quizScore === customQuizQuestions.length ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-300 p-6 rounded-2xl text-center space-y-3">
                        <span className="text-3xl">🏆</span>
                        <h4 className="text-base font-bold font-serif text-emerald-800 dark:text-emerald-400">Excellent Work, Pro Scholar!</h4>
                        <p className="text-xs text-slate-505 dark:text-zinc-300 leading-normal">
                          You scored <span className="font-extrabold">{quizScore} out of {customQuizQuestions.length}</span>! Keep compiling textbook sessions. Your local index records this learning streak.
                        </p>
                        <button
                          onClick={() => { playClickChime(); setQuizScore(null); setCustomQuizQuestions([]); setAiMode('none'); }}
                          className="px-4 py-2 bg-[#078930] hover:bg-[#067228] text-white rounded-xl text-xs font-bold uppercase transition"
                        >
                          Complete Review
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Process tracker */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                          <span>Question {currentQuizIndex + 1} of {customQuizQuestions.length}</span>
                          <span>Subject: {activeModule.subject}</span>
                        </div>

                        {/* Progress line */}
                        <div className="w-full bg-slate-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden select-none">
                          <div 
                            className="bg-indigo-650 h-full transition-all duration-300"
                            style={{ width: `${((currentQuizIndex + 1) / customQuizQuestions.length) * 100}%` }}
                          />
                        </div>

                        <div className="font-serif font-extrabold text-sm text-slate-800 dark:text-zinc-100 leading-snug">
                          {customQuizQuestions[currentQuizIndex].question}
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {customQuizQuestions[currentQuizIndex].options.map((opt: string, idx: number) => {
                            const isSelected = selectedQuizOption === idx;
                            const isCorrectAnswer = idx === customQuizQuestions[currentQuizIndex].correctIndex;
                            
                            let btnStyle = 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300';
                            if (selectedQuizOption !== null) {
                              if (isCorrectAnswer) {
                                btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 font-bold';
                              } else if (isSelected) {
                                btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400';
                              } else {
                                btnStyle = 'opacity-50 border-slate-200 dark:border-zinc-800';
                              }
                            }

                            return (
                              <button
                                key={idx}
                                disabled={selectedQuizOption !== null}
                                onClick={() => handleQuizAnswer(idx)}
                                className={`w-full px-4 py-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {selectedQuizOption !== null && (
                          <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs leading-relaxed space-y-2">
                            <p className="font-bold text-[#078930]">&rarr; Step-by-Step AI Explanation:</p>
                            <p className="text-slate-500 dark:text-zinc-350">{customQuizQuestions[currentQuizIndex].explanation}</p>
                            
                            <div className="pt-2 text-right">
                              <button
                                onClick={handleNextQuizQuestion}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
                              >
                                {currentQuizIndex + 1 === customQuizQuestions.length ? 'Show Score' : 'Next Question &rarr;'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 rounded-2xl p-8 shadow-sm text-center select-none space-y-4">
              <Compass className="w-12 h-12 text-[#078930] mx-auto animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-serif font-black text-lg text-slate-800 dark:text-zinc-150">Open a Textbook Module</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-400 max-w-sm mx-auto">
                  Click on any curriculum guide or textbook in the bookstore list on the left to start analyzing with AI.
                </p>
              </div>

              <div className="border-t border-slate-105 dark:border-zinc-800/80 pt-6 max-w-sm mx-auto">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl text-left border">
                    <span className="text-lg">📕</span>
                    <p className="font-extrabold text-[#078930] text-[10px] uppercase mt-1">Grades 8 - 12</p>
                    <p className="text-[9px] text-slate-400 leading-tight">Ministry prep worksheets & exam binders</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl text-left border">
                    <span className="text-lg">🏛️</span>
                    <p className="font-extrabold text-[#078930] text-[10px] uppercase mt-1">Freshman Courses</p>
                    <p className="text-[9px] text-slate-400 leading-tight">University Maths, Physics & Economics guides</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* 📖 PREMIUM IN-APP E-BOOK READER OVERLAY                  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isReaderOpen && activeModule && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 bg-[#0a0b10]/95 backdrop-blur-sm flex flex-col items-center justify-center p-0 md:p-4 select-none"
          >
            <div 
              className={`w-full h-full md:max-w-7xl md:h-[94vh] rounded-none md:rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
                readerTheme === 'light' 
                  ? 'bg-slate-50 text-slate-900 border-slate-200' 
                  : readerTheme === 'sepia' 
                  ? 'bg-[#f4ecd8] text-[#3d2f1f] border-amber-250/50' 
                  : 'bg-[#0f111a] text-zinc-200 border-zinc-800'
              }`}
            >
              {/* E-Reader Title Header Control Bar */}
              <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4 bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-[#078930] text-white rounded-xl">
                    <BookOpen className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      EthioLearn eBook Reader
                    </h4>
                    <h3 className="text-sm font-serif font-black line-clamp-1">
                      {activeModule.title}
                    </h3>
                  </div>
                </div>

                {/* E-Reader Controls Row */}
                <div className="flex flex-wrap items-center gap-2.5">
                  
                  {/* Theme Selectors */}
                  <div className="flex items-center bg-black/10 dark:bg-white/10 p-1 rounded-xl gap-1">
                    <button
                      onClick={() => { playClickChime(); setReaderTheme('light'); }}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        readerTheme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Daylight Theme"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { playClickChime(); setReaderTheme('sepia'); }}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        readerTheme === 'sepia' ? 'bg-[#3d2f1f]/20 text-[#3d2f1f] shadow-sm' : 'text-amber-700/60'
                      }`}
                      title="Sepia Vintage Theme"
                    >
                      <Type className="w-3.5 h-3.5 text-amber-900" />
                    </button>
                    <button
                      onClick={() => { playClickChime(); setReaderTheme('dark'); }}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        readerTheme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Midnight Theme"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Font Sizers */}
                  <div className="flex items-center bg-black/10 dark:bg-white/10 px-2 py-1.5 rounded-xl gap-2 font-mono text-xs">
                    <button 
                      onClick={() => { playClickChime(); setReaderFontSize(p => Math.max(12, p - 1)); }} 
                      className="px-1.5 font-bold hover:scale-110 active:scale-90 cursor-pointer"
                    >
                      A-
                    </button>
                    <span className="font-extrabold">{readerFontSize}px</span>
                    <button 
                      onClick={() => { playClickChime(); setReaderFontSize(p => Math.min(22, p + 1)); }} 
                      className="px-1.5 font-bold hover:scale-110 active:scale-90 cursor-pointer"
                    >
                      A+
                    </button>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => { playClickChime(); setIsReaderOpen(false); }}
                    className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Container - Left sidebar for Chapters Index & Glossary, Center/Right split for active text & AI Tutor */}
              {(() => {
                const currentChapterData = getChapterContent(activeModule.id, selectedChapter, activeModule.contentJson);
                return (
                  <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    
                    {/* 1. Left Book Navigation Index Sidebar (3 Columns) */}
                    <div className="lg:col-span-3 border-r p-4 overflow-y-auto space-y-5 bg-black/[0.02] dark:bg-white/[0.02] hidden lg:block">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 tracking-widest mb-3">
                          Table of Contents
                        </h4>
                        <div className="space-y-1.5">
                          {activeModule.chapters.map((ch, idx) => {
                            const isChSelected = selectedChapter === ch;
                            return (
                              <button
                                key={idx}
                                onClick={() => { playClickChime(); setSelectedChapter(ch); }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold leading-relaxed transition-colors cursor-pointer ${
                                  isChSelected
                                    ? 'bg-[#078930] text-white'
                                    : 'hover:bg-slate-200/50 dark:hover:bg-zinc-850'
                                }`}
                              >
                                {ch}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Micro Bilingual Glossary lookup */}
                      <div className="pt-4 border-t border-slate-200/60 dark:border-zinc-800">
                        <h4 className="text-[10px] font-bold uppercase text-[#078930] dark:text-emerald-400 tracking-widest mb-2 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" /> Interactive Vocabulary
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-2 leading-relaxed">
                          Tap highlighted study terminology inside textbook content to review explanation notes instantly.
                        </p>
                        <div className="bg-white/40 dark:bg-black/20 p-3 rounded-xl border space-y-2">
                          <p className="text-[11px] font-extrabold italic">Featured Terminology:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {currentChapterData.keyTerms.map(kt => (
                              <span 
                                key={kt.term}
                                onClick={() => alert(`"${kt.term}" (${kt.amharic})\n\nDefinition:\n${kt.definition}`)}
                                className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded-lg hover:bg-emerald-500/20 cursor-pointer transition-all font-mono"
                              >
                                {kt.term}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Middle Textbook Chapter Content canvas (6 Columns) */}
                    <div className="lg:col-span-6 p-6 overflow-y-auto space-y-6 flex flex-col justify-between select-text" style={{ fontSize: `${readerFontSize}px` }}>
                      
                      {/* Active Page Header indicator */}
                      <div className="space-y-4 font-sans">
                        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-mono border-b pb-2">
                          <span>Curriculum Section Unit</span>
                          <span>PAGE 12 OF {activeModule.pages}</span>
                        </div>

                        {/* Chapter Title Headings */}
                        <div className="space-y-1">
                          <h2 className="text-xl md:text-2xl font-serif font-black tracking-tight text-emerald-805 dark:text-emerald-400">
                            {currentChapterData.title}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed italic">
                            {currentChapterData.intro}
                          </p>
                        </div>
                      </div>

                      {/* Body Textbook Content rendering */}
                      <div className="space-y-5 font-serif leading-relaxed text-justify">
                        {currentChapterData.sections.map((sect, sIdx) => (
                          <div key={sIdx} className="space-y-2">
                            <h4 className="text-sm font-sans font-black uppercase text-slate-700 dark:text-zinc-200 tracking-tight">
                              {sect.title}
                            </h4>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {sect.body}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* ASCII Diagram Area */}
                      {currentChapterData.asciiDiagram && (
                        <div className="my-4 font-mono">
                          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 mb-2 font-sans">
                            Fig 1.1 Structural System Flow:
                          </p>
                          <pre className="text-[10px] leading-tight p-3 bg-black/10 dark:bg-black/30 border border-emerald-800/10 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl overflow-x-auto select-none">
                            {currentChapterData.asciiDiagram}
                          </pre>
                        </div>
                      )}

                      {/* Formulas Blackboard Box */}
                      {currentChapterData.formulas && (
                        <div className="my-5 p-4 bg-slate-900 border border-zinc-805 text-neutral-100 rounded-2xl shadow-inner font-sans">
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-widest font-black border-b border-zinc-800 pb-2 mb-3">
                            <span>📐 Essential Formulas & Constants</span>
                          </div>
                          <div className="space-y-3.5 text-xs">
                            {currentChapterData.formulas?.map((frm, fIdx) => (
                              <div key={fIdx} className="space-y-1">
                                <p className="font-extrabold text-[#C8962E]">{frm.name}</p>
                                <div className="p-2 bg-black/40 rounded-lg text-emerald-400 font-mono text-center my-1 select-all font-bold">
                                  {frm.formula}
                                </div>
                                <p className="text-[11px] text-neutral-400 leading-snug">{frm.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ministry Exam Alert Card */}
                      {currentChapterData.examAlert && (
                        <div className="p-4 bg-rose-500/10 border-l-4 border-rose-500 text-rose-800 dark:text-rose-400 rounded-r-xl space-y-1.5 font-sans leading-relaxed">
                          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>National Exam Pitfalls Warning</span>
                          </div>
                          <p className="text-xs leading-normal">
                            {currentChapterData.examAlert}
                          </p>
                        </div>
                      )}

                      {/* Sticky bottom page controls */}
                      <div className="pt-6 border-t mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
                        <p className="text-slate-400">
                          Bilingual study tools strictly compliant with Ministry standards.
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className="font-bold text-slate-500 dark:text-zinc-400">Fully Dynamic Reader</span>
                        </div>
                      </div>

                    </div>

                    {/* 3. Right Sidebar - AI Study Assistant Chatbot Interactive Pane (3 Columns) */}
                    <div className="lg:col-span-3 border-l p-4 flex flex-col justify-between bg-black/[0.01] dark:bg-white/[0.01]">
                      
                      <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                        
                        {/* Header */}
                        <div className="border-b pb-2">
                          <h4 className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-widest flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" /> Direct Ask Teacher Assistant
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                            Curious about an equation, detail or translation? Ask Teacher to explain it using simple terms.
                          </p>
                        </div>

                        {/* Tutor Chat Log display stage */}
                        <div className="flex-1 overflow-y-auto p-2 bg-black/5 dark:bg-black/35 rounded-2xl border space-y-3.5 min-h-[140px] max-h-[360px] text-xs leading-relaxed select-text font-sans">
                          {inlineAiResponse ? (
                            <div className="space-y-2">
                              <div className="p-2.5 bg-[#078930]/10 border border-[#078930]/20 rounded-xl text-emerald-805 dark:text-emerald-300">
                                <p className="font-extrabold text-[10px] uppercase text-emerald-700">Teacher Response:</p>
                                <p className="mt-1 leading-relaxed capitalize whitespace-pre-wrap">{inlineAiResponse}</p>
                              </div>
                            </div>
                          ) : inlineAiLoading ? (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-2 text-zinc-400">
                              <div className="w-5 h-5 border-2 border-[#078930] border-t-transparent rounded-full animate-spin" />
                              <p className="text-[10px] font-mono animate-pulse">Reading pages, querying concepts...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-450 dark:text-zinc-500 italic space-y-1">
                              <Bot className="w-7 h-7 mb-1 text-slate-350 animate-bounce" />
                              <p>Ask Teacher anything about this chapter!</p>
                              <p className="text-[9px] text-slate-400 dark:text-zinc-650 tracking-tight not-italic">e.g., "Give me a simple real-life analogy for Cardinal Utility."</p>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Query input panel */}
                      <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-800 space-y-2 font-sans">
                        <textarea
                          value={inlineAiQuestion}
                          onChange={(e) => setInlineAiQuestion(e.target.value)}
                          placeholder="Ask Teacher about this chapter..."
                          className="w-full p-2 text-xs border rounded-xl bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none resize-none h-14"
                        />
                        
                        <button
                          onClick={handleInlineAnswer}
                          disabled={inlineAiLoading || !inlineAiQuestion.trim()}
                          className="w-full py-2 bg-[#078930] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <Bot className="w-3.5 h-3.5 text-white" />
                          <span>Ask Teacher</span>
                        </button>
                        {inlineAiResponse && (
                          <button 
                            onClick={() => setInlineAiResponse('')}
                            className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 underline font-mono cursor-pointer block"
                          >
                            Clear Chat Response
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 🔌 SUPABASE WIZARD SETUP GUIDE MODAL                      */}
      {/* ========================================================= */}
      <AnimatePresence>
        {/* Supabase textbook sync indicator */}

        {showAddBookModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowAddBookModal(false)}
            id="add-custom-book-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
              id="add-custom-book-modal-card"
            >
              <button
                onClick={() => { playClickChime(); setShowAddBookModal(false); }}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5">
                <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#078930]" />
                  {language === 'en' ? 'Add Your Own Book / Module' : 'የራስዎን መጽሐፍ / ሞጁል ይጨምሩ'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {language === 'en' 
                    ? 'Enter your textbook details. They will be saved securely to your browser storage.' 
                    : 'የመጽሐፍዎን ዝርዝር ያስገቡ። መረጃው በአሳሽዎ ውስጥ ደህንነቱ በተጠበቀ ሁኔታ ይቀመጣል።'}
                </p>
              </div>

              <form onSubmit={handleAddCustomBook} className="space-y-3.5 text-xs text-slate-700 dark:text-zinc-300">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-400">Book Title *</label>
                    <input
                      type="text"
                      required
                      value={newBookTitle}
                      onChange={(e) => setNewBookTitle(e.target.value)}
                      placeholder="e.g. Freshman Civics Draft"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-[#078930]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-400">Subject *</label>
                    <input
                      type="text"
                      required
                      value={newBookSubject}
                      onChange={(e) => setNewBookSubject(e.target.value)}
                      placeholder="e.g. Civics, Computer Science"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-[#078930]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-400">Grade Level</label>
                    <select
                      value={newBookGrade}
                      onChange={(e) => setNewBookGrade(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-zinc-100 outline-none cursor-pointer"
                    >
                      <option value="Grade 12">Grade 12</option>
                      <option value="Grade 12 New Curriculum">Grade 12 New Curriculum</option>
                      <option value="University">University</option>
                      <option value="Custom Study">Custom Study</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-400">Total Pages</label>
                    <input
                      type="number"
                      value={newBookPages}
                      onChange={(e) => setNewBookPages(e.target.value)}
                      placeholder="120"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-[#078930]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-400">Chapters (comma-separated or one per line) *</label>
                  <textarea
                    required
                    value={newBookChaptersText}
                    onChange={(e) => setNewBookChaptersText(e.target.value)}
                    placeholder="Chapter 1: Democratic Values, Chapter 2: Constitution"
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-[#078930] resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-400">Description</label>
                  <input
                    type="text"
                    value={newBookDescription}
                    onChange={(e) => setNewBookDescription(e.target.value)}
                    placeholder="Brief summary about the book content..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-[#078930]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-400">Direct PDF URL (Optional Online Link)</label>
                  <input
                    type="url"
                    value={newBookPdfUrl}
                    onChange={(e) => setNewBookPdfUrl(e.target.value)}
                    placeholder="https://example.com/textbook.pdf"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-[#078930]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-400">Copy/Paste Textbook Notes or Chapter Content (Optional)</label>
                  <textarea
                    value={newBookContent}
                    onChange={(e) => setNewBookContent(e.target.value)}
                    placeholder="Paste textbook details or notes content here. Our AI summarizes and tests you based directly on these details!"
                    rows={4}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-[#078930]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setShowAddBookModal(false); }}
                    className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer animate-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#078930] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Save Textbook
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
