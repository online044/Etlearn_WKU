/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Search, Download, Sparkles, AlertCircle, FileText, Bot, 
  CheckCircle, ChevronDown, Plus, BookOpenCheck, BookMarked, Sun, Moon, 
  Type, ChevronRight, X, Check, Database, Star, Filter, ArrowRight, 
  Layers, ExternalLink, RefreshCw, Zap, Bookmark, Share2
} from 'lucide-react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { getChapterContent } from '../data/textbookChapterContent';
import { safeStorage } from '../utils/safeStorage';
import { fetchPublishedBooks } from '../utils/contentStore';

export interface BookStoreViewProps {
  profile: StudentProfile;
  apiKey?: string;
  language: 'en' | 'am';
  onNavigate: (page: string) => void;
  onStudyAction: () => void;
  supabaseBooks?: any[];
  onOpenInAppViewer?: (url: string, title: string) => void;
}

export interface ModuleResource {
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
  isServerRecord?: boolean;
  fileSize?: number;
  allowDownload?: boolean;
  department?: string;
  university?: string;
  course?: string;
  rating?: number;
}

export const PREBUILT_MODULES: ModuleResource[] = [
  // --- GRADE 12 CURRICULUM ---
  {
    id: 'g12_math',
    title: 'Grade 12 Mathematics Ultimate Curriculum Module',
    subject: 'Mathematics',
    grade: 'Grade 12',
    chapters: [
      'Chapter 1: Sequences and Series',
      'Chapter 2: Limits and Continuity',
      'Chapter 3: Introduction to Calculus',
      'Chapter 4: Vectors and Analytical Geometry'
    ],
    pages: 142,
    description: 'Comprehensive Ministry Exam prep module covering differential calculus, limits, sequence notation, and solid geometry with Amharic explanations.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/mathematics',
    rating: 4.9
  },
  {
    id: 'g12_english',
    title: 'Grade 12 Communicative English Matric Workbook',
    subject: 'English',
    grade: 'Grade 12',
    chapters: [
      'Chapter 1: Tense & Aspect Pairing',
      'Chapter 2: Relative Clauses & Passive Voice',
      'Chapter 3: Direct vs Indirect Speech',
      'Chapter 4: Vocabulary Context Clues'
    ],
    pages: 105,
    description: 'Specially structured to help Ethiopian students excel in national standardized English tests, active-passive transformations, and comprehension.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/english',
    rating: 4.8
  },
  {
    id: 'g12_physics',
    title: 'Grade 12 Physics Electromagnetism & Quantum Guide',
    subject: 'Physics',
    grade: 'Grade 12',
    chapters: [
      'Chapter 1: Particle Dynamics',
      'Chapter 2: Magnetic Fields & Inductance',
      'Chapter 3: AC Circuits',
      'Chapter 4: Atomic & Quantum Physics Theory'
    ],
    pages: 120,
    description: 'Advanced matric revision guide summarizing magnetic flux equations, transformers, line spectra, photoelectric effect, and nuclear half-lives.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/physics',
    rating: 4.9
  },
  {
    id: 'g12_chemistry',
    title: 'Grade 12 Chemistry Organic & Electrochemistry Companion',
    subject: 'Chemistry',
    grade: 'Grade 12',
    chapters: [
      'Chapter 1: Solutions and Colloids',
      'Chapter 2: Acid-Base Equilibria',
      'Chapter 3: Thermodynamics & Electrochemistry',
      'Chapter 4: Nomenclature of Organic Reactants'
    ],
    pages: 135,
    description: 'Detailed study on buffer actions, pH indicators, Lewis theories, galvanic cells, and standard IUPAC nomenclature schemes.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/chemistry',
    rating: 4.7
  },
  {
    id: 'g12_biology',
    title: 'Grade 12 Biology Genetics, Evolution & Ecology Module',
    subject: 'Biology',
    grade: 'Grade 12',
    chapters: [
      'Chapter 1: Cell Biology and Macromolecules',
      'Chapter 2: Mendelian Inheritance & DNA',
      'Chapter 3: Theories of Evolution',
      'Chapter 4: Ecological Succession & Conservation'
    ],
    pages: 115,
    description: 'Targeted revision for national entrance exam genetics calculations, population genetics rules, and environmental biodiversity in Ethiopia.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/biology',
    rating: 4.8
  },
  {
    id: 'g12_amharic',
    title: 'Grade 12 Amharic (አማርኛ) Student Textbook',
    subject: 'Amharic',
    grade: 'Grade 12',
    chapters: [
      'Chapter 1: ስነ-ጽሁፍ እና ባህል (Literature & Culture)',
      'Chapter 2: ንባብና መረዳት (Reading & Comprehension)',
      'Chapter 3: የቃላት ጥናትና ሰዋስው (Vocabulary & Grammar)',
      'Chapter 4: የጽሕፈት ስልቶች (Writing Styles)'
    ],
    pages: 110,
    description: 'Official Ministry Grade 12 Amharic language companion. Study grammar, vocabulary, reading comprehension, and literature analysis.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/amharic',
    rating: 4.9
  },
  {
    id: 'g12_aptitude',
    title: 'Grade 12 Analytical and Quantitative Aptitude Handbook',
    subject: 'Aptitude',
    grade: 'Grade 12',
    chapters: [
      'Chapter 1: Verbal Analogies & Sentence Logic',
      'Chapter 2: Numerical Series & Word Problems',
      'Chapter 3: Spatial and Non-Verbal Reasoning',
      'Chapter 4: Logic Gates & Syllogism Analysis'
    ],
    pages: 160,
    description: 'Specially curated reasoning builder focusing on typical math aptitude patterns, visual sequences, and critical thinking matrices for university entrance.',
    languageSupport: 'Bilingual',
    proRequired: false,
    rating: 5.0
  },
  {
    id: 'g12_new_economics',
    title: 'Grade 12 Economics Student Textbook (New Curriculum)',
    subject: 'Economics',
    grade: 'Grade 12 New Curriculum',
    chapters: [
      'Chapter 1: Theory of Consumer Behavior',
      'Chapter 2: Market Structure and Perfect Competition',
      'Chapter 3: Macroeconomic Indicators in Ethiopia',
      'Chapter 4: Monetary and Fiscal Policies'
    ],
    pages: 168,
    description: 'Official Ministry new curriculum guide on demand elasticities, utility maximizations, inflation thresholds, and national bank monetary tools.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/economics',
    rating: 4.8
  },
  {
    id: 'g12_new_geography',
    title: 'Grade 12 Geography Student Textbook (New Curriculum)',
    subject: 'Geography',
    grade: 'Grade 12 New Curriculum',
    chapters: [
      'Chapter 1: Geological Structure and Landforms of Ethiopia',
      'Chapter 2: Climate and Weather Systems of East Africa',
      'Chapter 3: Natural Resource Management & Conservation',
      'Chapter 4: Population Density and Urbanization Profiles'
    ],
    pages: 182,
    description: 'Comprehensive spatial analysis of Ethiopian highlands, rift valleys, traditional farming soil cycles, and regional hydrological basins.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/geography',
    rating: 4.7
  },
  {
    id: 'g12_new_history',
    title: 'Grade 12 History Student Textbook (New Curriculum)',
    subject: 'History',
    grade: 'Grade 12 New Curriculum',
    chapters: [
      'Chapter 1: Human Beginnings & Stone Age Cultures in the Horn',
      'Chapter 2: State Formations, Trade and Religions (Axum, Lalibela)',
      'Chapter 3: Modern Ethiopian State Unifications (1855-1974)',
      'Chapter 4: The Federal Democratic Era & Contemporary Milestones'
    ],
    pages: 210,
    description: 'New curriculum history resource mapping prehistoric sites like Hadar, early civilizations, Battle of Adwa victory details, and constitutional developments.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/history',
    rating: 4.9
  },
  {
    id: 'g12_new_it',
    title: 'Grade 12 Information Technology Student Textbook (New Curriculum)',
    subject: 'Information Technology',
    grade: 'Grade 12 New Curriculum',
    chapters: [
      'Chapter 1: Advanced Information Systems & Databases',
      'Chapter 2: Computer Networking & Cyber-Defenses',
      'Chapter 3: Web Development Fundamentals (HTML, CSS, JS)',
      'Chapter 4: Algorithms, Python Scripting & Emerging Algos'
    ],
    pages: 154,
    description: 'Official guide covering relational database schemas, web authoring elements, and logical block scripting paradigms for high schoolers.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/ict',
    rating: 4.8
  },
  {
    id: 'g12_civics',
    title: 'Grade 12 Civics and Ethical Education Student Textbook',
    subject: 'Civics',
    grade: 'Grade 12',
    chapters: [
      'Chapter 1: Building a Democratic System',
      'Chapter 2: The Rule of Law and Judicial Organs',
      'Chapter 3: Human and Democratic Rights',
      'Chapter 4: Active Community Participation & Patriotism'
    ],
    pages: 140,
    description: 'Official Ministry textbook on federalism models, human rights codes, constitution principles, and civic duties for high school matric.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/civics-and-ethical-education',
    rating: 4.7
  },
  {
    id: 'g12_agriculture',
    title: 'Grade 12 Agriculture Student Textbook (New Curriculum)',
    subject: 'Agriculture',
    grade: 'Grade 12 New Curriculum',
    chapters: [
      'Chapter 1: Crop Production & Soil Science in Ethiopia',
      'Chapter 2: Animal Husbandry & Poultry Farming',
      'Chapter 3: Agricultural Economics & Farm Management',
      'Chapter 4: Modern Irrigation and Water Conservation'
    ],
    pages: 156,
    description: 'Comprehensive study of agrarian science, soil conservation cycles, livestock husbandry, and smart water resources management in East Africa.',
    languageSupport: 'Bilingual',
    proRequired: false,
    rating: 4.6
  },
  {
    id: 'g12_business',
    title: 'Grade 12 Business Studies Student Textbook',
    subject: 'Business',
    grade: 'Grade 12',
    chapters: [
      'Chapter 1: Nature and Scope of Business',
      'Chapter 2: Business Environments and Ethics',
      'Chapter 3: Forms of Business Ownership (Sole, Share)',
      'Chapter 4: Basic Accounting Principles & Ledger Sheets'
    ],
    pages: 130,
    description: 'Core concepts of entrepreneurship, financial accounting ledgers, ethical trade structures, and management frameworks in Ethiopia.',
    languageSupport: 'Bilingual',
    proRequired: false,
    pdfUrl: 'https://fetena.net/books/grade-12/general-business',
    rating: 4.7
  },

  // --- UNIVERSITY FRESHMAN & DEGREE COURSES ---
  {
    id: 'uni_math',
    title: 'Freshman Mathematics for Social & Natural Sciences (Math 1011)',
    subject: 'Mathematics',
    grade: 'University',
    department: 'Common Courses',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Propositional Logic and Set Theory',
      'Chapter 2: The Real & Complex Number Systems',
      'Chapter 3: Analytical Geometry & Conic Sections',
      'Chapter 4: Exponential and Hyperbolic Functions'
    ],
    pages: 195,
    description: 'Standard textbook matching Ethiopian public universities curriculum. Includes truth tables, complex algebra, and functions conversion guidelines with AI step solver.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.9
  },
  {
    id: 'uni_applied_math',
    title: 'Applied Calculus I & II Engineering Courseware (Math 1012)',
    subject: 'Applied Math',
    grade: 'University',
    department: 'Engineering & Technology',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Techniques of Advanced Integration',
      'Chapter 2: Sequences & Infinite Series Tests',
      'Chapter 3: Vectors and Partial Derivatives',
      'Chapter 4: First Order Linear Differential Equations'
    ],
    pages: 240,
    description: 'Advanced applied engineering mathematical formulas. Features trigonometric substitutions, Taylor series, and volume calculations via double integrals.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.9
  },
  {
    id: 'uni_cpp',
    title: 'Introduction to Computer Programming & C++ (CoSc 1011)',
    subject: 'Computer Science',
    grade: 'University',
    department: 'Engineering & Technology',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Algorithms, Flowcharts and Compilers',
      'Chapter 2: C++ Variables, Types, and Conditional Statements',
      'Chapter 3: Loops and Iteration Controls (For, While)',
      'Chapter 4: Custom Functions, Arrays, and Memory Pointers'
    ],
    pages: 175,
    description: 'Hands-on programming guide. Master logical arrays, sequential flows, parameter passing, and syntax structures with custom AI code-review solver tools.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 5.0
  },
  {
    id: 'uni_english',
    title: 'Communicative English Skills I (FLEn 1011)',
    subject: 'English',
    grade: 'University',
    department: 'Common Courses',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Active Reading and Note-Taking',
      'Chapter 2: Advanced Cohesive Paragraph Building',
      'Chapter 3: Academic Voice, Modals and Concord',
      'Chapter 4: Public Representation Speaking Clues'
    ],
    pages: 98,
    description: 'Core freshman curriculum guidebook to excel in university-level comprehension, syntactic styles, and academic arguments.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.8
  },
  {
    id: 'uni_english_2',
    title: 'Writing Skills II Advanced Freshman English (FLEn 1012)',
    subject: 'English',
    grade: 'University',
    department: 'Common Courses',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Essay Genres and Rhetorical Modes',
      'Chapter 2: Mechanics of Academic Citations & APA',
      'Chapter 3: Professional Correspondence & Letters',
      'Chapter 4: Formulating Business & Research Proposals'
    ],
    pages: 110,
    description: 'Focuses on peer essay editing, bibliography formatting, and writing logical, structured reports as a university scholar.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.7
  },
  {
    id: 'uni_physics',
    title: 'General Physics Mechanics, Waves & Optics (Phys 1011)',
    subject: 'Physics',
    grade: 'University',
    department: 'Natural Sciences & Engineering',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Kinematics & Work-Energy Theorems',
      'Chapter 2: Oscillations and Wave Harmonics',
      'Chapter 3: Laws of Thermodynamics & Heat',
      'Chapter 4: Geometric Optics and Lenses Theory'
    ],
    pages: 215,
    description: 'Rigorous freshman guide centered on physical concepts: work-kinetic calculations, harmonic pendulum frequencies, and ray tracing.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.8
  },
  {
    id: 'uni_chemistry',
    title: 'General Chemistry Atomic Structure & Equilibria (Chem 1011)',
    subject: 'Chemistry',
    grade: 'University',
    department: 'Natural Sciences & Medicine',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Quantum Chemistry & Atomic Periodicity',
      'Chapter 2: Chemical Bonding & VSEPR Models',
      'Chapter 3: Properties of States & Solutions',
      'Chapter 4: Chemical Kinetics and Rate Laws'
    ],
    pages: 220,
    description: 'University level molecular orbital theory, orbital hybridization, boiling point elevations, and activation energy calculations with AI solver tutorials.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.8
  },
  {
    id: 'uni_biology',
    title: 'Freshman General Biology and Microbiology (Biol 1011)',
    subject: 'Biology',
    grade: 'University',
    department: 'Medicine & Health Sciences',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Structure and Chemistry of Life',
      'Chapter 2: Cellular Metabolism & Photosynthesis',
      'Chapter 3: Anatomy and Systems of Animal Life',
      'Chapter 4: Microorganisms, Fungi and Viral Pathogens'
    ],
    pages: 185,
    description: 'Study of cellular respiration pathways, ATP models, enzyme activity limits, prokaryote structures, and plant physiology.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.9
  },
  {
    id: 'uni_anthropology',
    title: 'Social Anthropology Freshman Curriculum (Anth 1012)',
    subject: 'Anthropology',
    grade: 'University',
    department: 'Social Sciences & Humanities',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Concepts and Scope of Anthropology',
      'Chapter 2: Culture, Ethnicity, and Social Identity',
      'Chapter 3: Kinship, Marriage & Family Systems',
      'Chapter 4: Indigenous Knowledge and Adaptation in Ethiopia'
    ],
    pages: 130,
    description: 'Explore human diversity, cultural patterns, ethnographic field research methods, and pluralistic contexts in the Horn of Africa.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.8
  },
  {
    id: 'uni_logic',
    title: 'Introduction to Logic and Critical Thinking (Phil 1011)',
    subject: 'Logic',
    grade: 'University',
    department: 'Social Sciences & Humanities',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Logic, Arguments, and Premises',
      'Chapter 2: Informal Fallacies (Ad Hominem, Strawman)',
      'Chapter 3: Categorical Propositions and Venn Diagrams',
      'Chapter 4: Symbolic Logic and Natural Deduction'
    ],
    pages: 145,
    description: 'Unlock argumentative rigor. Learn to outline deductive logic structures, identify cognitive fallacies, and construct formal truth proofs.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.9
  },
  {
    id: 'uni_psychology',
    title: 'Freshman General Psychology and Life Skills (Pscy 1011)',
    subject: 'Psychology',
    grade: 'University',
    department: 'Common Courses',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Essence & Biological Bases of Behavior',
      'Chapter 2: Sensation, Perception, and Human Learning',
      'Chapter 3: Cognitive, Memory Systems and Amnesia',
      'Chapter 4: Motivation, Emotion, Personality & Life Skills'
    ],
    pages: 152,
    description: 'Deep dive into neuropsychology, Pavlovian conditioning mechanisms, cognitive memory structures, and stress management skills.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.8
  },
  {
    id: 'uni_inclusiveness',
    title: 'Inclusiveness, Disabilities & Special Education Module (Incl 1012)',
    subject: 'Inclusiveness',
    grade: 'University',
    department: 'Common Courses',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Understanding Disabilities and Vulnerabilities',
      'Chapter 2: Overcoming Social & Institutional Barriers',
      'Chapter 3: Collaborative Assistive Technologies',
      'Chapter 4: National Inclusiveness Policies and Rights'
    ],
    pages: 112,
    description: 'Framework of special needs learning support, behavioral adjustments, visual or hearing aids integrations, and human dignity principles.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.7
  },
  {
    id: 'uni_entrepreneurship',
    title: 'Freshman Entrepreneurship (Mgmt 1012)',
    subject: 'Entrepreneurship',
    grade: 'University',
    department: 'Business & Economics',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: The Entrepreneurial Mindset & Ideation',
      'Chapter 2: Market Audits, Feasibility and Customer Pain',
      'Chapter 3: Structuring a Valid Lean Business Model Canvas',
      'Chapter 4: Capital Sources and Ethiopian Microfinance Laws'
    ],
    pages: 138,
    description: 'Essential entrepreneurial toolbox. Covers competitive audits, value propositions, resource constraints, startup funding, and local business taxation.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.8
  },
  {
    id: 'uni_civics',
    title: 'Moral and Civic Education Freshman Module (MCiE 1012)',
    subject: 'Moral and Civics',
    grade: 'University',
    department: 'Common Courses',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Understanding Civics, Morality, and Ethics',
      'Chapter 2: State, Government, and Citizenship Foundations',
      'Chapter 3: Human Rights and Constitutionalism in Ethiopia',
      'Chapter 4: Democracy and Good Governance Indicators'
    ],
    pages: 165,
    description: 'Essential freshman civic education module. Covers ethical theories, federal state structures, public responsibility, and global cooperation frameworks.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.8
  },
  {
    id: 'uni_geography',
    title: 'Geography of Ethiopia and the Horn (GeES 1011)',
    subject: 'Geography',
    grade: 'University',
    department: 'Social Sciences & Humanities',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Introduction to Geography & Spatial Coordinates',
      'Chapter 2: Geological Structure & Physiographic Divisions',
      'Chapter 3: Drainage Systems & Water Basins of Ethiopia',
      'Chapter 4: Climate, Soil Systems, and Demography'
    ],
    pages: 188,
    description: 'Standard freshman geography module covering tectonic plates, Abbay (Blue Nile) and Awash basins, highland soil types, and population geography.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.8
  },
  {
    id: 'uni_emerging_tech',
    title: 'Introduction to Emerging Technologies Freshman Module (EmTe 1012)',
    subject: 'Emerging Tech',
    grade: 'University',
    department: 'Engineering & Technology',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Introduction to Industry 4.0 & Digital Transformation',
      'Chapter 2: Artificial Intelligence & Machine Learning Frameworks',
      'Chapter 3: Internet of Things (IoT) & Smart Systems',
      'Chapter 4: Blockchain, Cybersecurity, and Cloud Infrastructures'
    ],
    pages: 145,
    description: 'Covers the 4th industrial revolution (4IR) technologies: smart actuators, deep neural networks, cryptographic ledgers, and secure cloud orchestration.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 5.0
  },
  {
    id: 'uni_economics',
    title: 'Introduction to Economics Freshman Module (Econ 1011)',
    subject: 'Economics',
    grade: 'University',
    department: 'Business & Economics',
    university: 'Wolkite & National Universities',
    chapters: [
      'Chapter 1: Fundamental Concepts of Economics',
      'Chapter 2: Market Demand, Supply, and Price Equilibrium',
      'Chapter 3: Theory of Production and Cost Analysis',
      'Chapter 4: Introduction to Macroeconomics and GDP'
    ],
    pages: 172,
    description: 'Standard curriculum guide for first-year students. Explains opportunity cost, production frontiers, utility indifference curves, cost curves, and macroeconomic models.',
    languageSupport: 'English Only',
    proRequired: false,
    rating: 4.9
  }
];

export default function BookStoreView({
  profile,
  apiKey,
  language,
  onNavigate,
  onStudyAction,
  supabaseBooks
}: BookStoreViewProps) {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'title' | 'pages'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Favorites state
  const [favoriteBookIds, setFavoriteBookIds] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_favorite_books');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playClickChime();
    setFavoriteBookIds(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      safeStorage.setItem('ethiolearn_favorite_books', JSON.stringify(updated));
      return updated;
    });
  };

  // Recent books persistence
  const [recentBookIds, setRecentBookIds] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_recent_books');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const recordRecentBook = (id: string) => {
    setRecentBookIds(prev => {
      const filtered = prev.filter(x => x !== id);
      const updated = [id, ...filtered].slice(0, 4);
      safeStorage.setItem('ethiolearn_recent_books', JSON.stringify(updated));
      return updated;
    });
  };

  // Custom books state
  const [customBooks, setCustomBooks] = useState<ModuleResource[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_custom_books');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Server books state
  const [serverBooks, setServerBooks] = useState<ModuleResource[]>([]);

  useEffect(() => {
    fetchPublishedBooks().then(books => {
      if (books && books.length > 0) {
        const mapped: ModuleResource[] = books.map(b => ({
          id: b.id,
          title: b.title,
          subject: b.subject || b.course || 'Curriculum',
          grade: b.academicYear ? (b.academicYear.includes('Grade') ? b.academicYear : `University (${b.academicYear})`) : 'University',
          chapters: b.unit ? [b.unit] : ['Chapter 1: ' + (b.course || b.subject || 'Overview'), 'Chapter 2: Core Analysis', 'Chapter 3: Exercises & Review'],
          pages: b.pageCount || (b.fileSize ? Math.max(10, Math.round(b.fileSize / 50000)) : 120),
          description: b.description || `${b.course || ''} - ${b.department || ''} (${b.university || 'Wolkite University'})`,
          languageSupport: 'Bilingual',
          proRequired: false,
          pdfUrl: b.pdfUrl,
          isServerRecord: true,
          fileSize: b.fileSize,
          department: b.department,
          university: b.university,
          rating: 4.9
        }));
        setServerBooks(mapped);
      }
    }).catch(err => console.warn('Could not fetch server books:', err));
  }, []);

  // Combined master catalog
  const catalog = useMemo(() => {
    return [...PREBUILT_MODULES, ...serverBooks, ...customBooks];
  }, [serverBooks, customBooks]);

  // Filtered & Sorted Catalog
  const filteredBooks = useMemo(() => {
    return catalog.filter(book => {
      // Search match
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const matchTitle = book.title.toLowerCase().includes(q);
        const matchSubject = book.subject.toLowerCase().includes(q);
        const matchGrade = book.grade.toLowerCase().includes(q);
        const matchDesc = book.description.toLowerCase().includes(q);
        const matchDept = (book.department || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchGrade && !matchDesc && !matchDept) {
          return false;
        }
      }

      // Faculty / Category match
      if (selectedFaculty === 'favorites') {
        return favoriteBookIds.includes(book.id);
      } else if (selectedFaculty === 'university') {
        return book.grade.toLowerCase().includes('university');
      } else if (selectedFaculty === 'grade12') {
        return book.grade.toLowerCase().includes('grade 12');
      } else if (selectedFaculty === 'engineering') {
        const s = (book.subject + ' ' + (book.department || '')).toLowerCase();
        return s.includes('engineering') || s.includes('math') || s.includes('applied') || s.includes('computer') || s.includes('tech') || s.includes('physics');
      } else if (selectedFaculty === 'medicine') {
        const s = (book.subject + ' ' + (book.department || '')).toLowerCase();
        return s.includes('biology') || s.includes('health') || s.includes('medicine') || s.includes('chemistry');
      } else if (selectedFaculty === 'business') {
        const s = (book.subject + ' ' + (book.department || '')).toLowerCase();
        return s.includes('economics') || s.includes('business') || s.includes('entrepreneurship') || s.includes('accounting');
      } else if (selectedFaculty === 'social') {
        const s = (book.subject + ' ' + (book.department || '')).toLowerCase();
        return s.includes('anthropology') || s.includes('logic') || s.includes('psychology') || s.includes('civics') || s.includes('geography') || s.includes('history') || s.includes('inclusiveness');
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'pages') return b.pages - a.pages;
      return (b.rating || 4.8) - (a.rating || 4.8);
    });
  }, [catalog, debouncedSearch, selectedFaculty, favoriteBookIds, sortBy]);

  // E-Book Reader States
  const [readerOpen, setReaderOpen] = useState(false);
  const [activeBook, setActiveBook] = useState<ModuleResource | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>('');
  const [readerTheme, setReaderTheme] = useState<'dark' | 'midnight' | 'sepia'>('dark');
  const [readerFontSize, setReaderFontSize] = useState<number>(15);
  const [readerFontFamily, setReaderFontFamily] = useState<'sans' | 'serif'>('sans');
  const [readerViewMode, setReaderViewMode] = useState<'chapters' | 'pdf'>('chapters');
  const [readerSidebarOpen, setReaderSidebarOpen] = useState(true);

  // AI Tutor in Reader states
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [activePracticeQuiz, setActivePracticeQuiz] = useState<any[] | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  // Open Book Action (Direct, Instant, Unrestricted)
  const handleOpenBook = (book: ModuleResource, chapterIndex: number = 0) => {
    playClickChime();
    setActiveBook(book);
    setActiveChapter(book.chapters[chapterIndex] || book.chapters[0] || 'Chapter 1');
    setReaderViewMode('chapters');
    setAiResponse('');
    setActivePracticeQuiz(null);
    setQuizScore(null);
    setSelectedAnswers({});
    setReaderOpen(true);
    recordRecentBook(book.id);
    onStudyAction();
  };

  // Add Custom Book Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customGrade, setCustomGrade] = useState('University');
  const [customChapters, setCustomChapters] = useState('');
  const [customPages, setCustomPages] = useState('120');
  const [customDescription, setCustomDescription] = useState('');
  const [customPdfUrl, setCustomPdfUrl] = useState('');

  const handleSaveCustomBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customSubject.trim()) return;

    const chaptersArray = customChapters
      .split('\n')
      .map(c => c.trim())
      .filter(Boolean);

    const newBook: ModuleResource = {
      id: `custom_${Date.now()}`,
      title: customTitle.trim(),
      subject: customSubject.trim(),
      grade: customGrade,
      chapters: chaptersArray.length > 0 ? chaptersArray : ['Chapter 1: Overview', 'Chapter 2: In-Depth Notes'],
      pages: parseInt(customPages, 10) || 100,
      description: customDescription.trim() || 'Custom textbook notes uploaded by scholar.',
      languageSupport: 'Bilingual',
      proRequired: false,
      pdfUrl: customPdfUrl.trim() || undefined,
      rating: 5.0
    };

    const updated = [newBook, ...customBooks];
    setCustomBooks(updated);
    safeStorage.setItem('ethiolearn_custom_books', JSON.stringify(updated));
    playSuccessChime();
    setShowAddModal(false);
    setCustomTitle('');
    setCustomSubject('');
    setCustomChapters('');
    setCustomDescription('');
    setCustomPdfUrl('');
  };

  // Dynamic Subject Theme styling helper
  const getSubjectVisual = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('math') || s.includes('calculus')) {
      return { gradient: 'from-blue-600 via-indigo-600 to-cyan-600', icon: '📐', bgTag: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    } else if (s.includes('physics')) {
      return { gradient: 'from-violet-600 via-purple-600 to-indigo-700', icon: '⚡', bgTag: 'bg-violet-500/10 text-violet-400 border-violet-500/20' };
    } else if (s.includes('chemistry')) {
      return { gradient: 'from-emerald-600 via-teal-600 to-green-700', icon: '🧪', bgTag: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    } else if (s.includes('biology')) {
      return { gradient: 'from-green-600 via-emerald-600 to-teal-700', icon: '🧬', bgTag: 'bg-green-500/10 text-green-400 border-green-500/20' };
    } else if (s.includes('english')) {
      return { gradient: 'from-sky-600 via-blue-600 to-indigo-700', icon: '💬', bgTag: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
    } else if (s.includes('economics') || s.includes('business')) {
      return { gradient: 'from-amber-600 via-orange-600 to-yellow-600', icon: '📊', bgTag: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    } else if (s.includes('logic') || s.includes('psychology')) {
      return { gradient: 'from-pink-600 via-rose-600 to-purple-600', icon: '🧠', bgTag: 'bg-pink-500/10 text-pink-400 border-pink-500/20' };
    } else if (s.includes('computer') || s.includes('it') || s.includes('tech')) {
      return { gradient: 'from-cyan-600 via-teal-600 to-slate-700', icon: '💻', bgTag: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    } else if (s.includes('history') || s.includes('civics') || s.includes('anthropology')) {
      return { gradient: 'from-red-600 via-amber-700 to-yellow-700', icon: '🏛️', bgTag: 'bg-red-500/10 text-red-400 border-red-500/20' };
    } else if (s.includes('geography')) {
      return { gradient: 'from-teal-600 via-emerald-600 to-sky-700', icon: '🌍', bgTag: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
    }
    return { gradient: 'from-indigo-600 via-purple-600 to-blue-700', icon: '📚', bgTag: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
  };

  // AI Tutor Quick Actions
  const handleAiAction = (mode: 'summary' | 'formulas' | 'amharic' | 'quiz') => {
    if (!activeBook) return;
    playClickChime();
    setAiLoading(true);
    setAiPanelOpen(true);
    setActivePracticeQuiz(null);
    setQuizScore(null);

    const content = getChapterContent(activeBook.id, activeChapter, activeBook.contentJson);

    setTimeout(() => {
      if (mode === 'summary') {
        let text = `### 📖 Chapter Summary: ${activeChapter}\n`;
        text += `**Textbook:** ${activeBook.title} (${activeBook.subject})\n\n`;
        text += `**Core Thesis:**\n${content.intro}\n\n`;
        text += `#### Key Highlights:\n`;
        content.sections.forEach(s => {
          text += `* **${s.title}**: ${s.body.slice(0, 180)}...\n`;
        });
        if (content.examAlert) {
          text += `\n⚠️ **National Exam Alert**: ${content.examAlert}\n`;
        }
        setAiResponse(text);
      } else if (mode === 'formulas') {
        let text = `### 🧮 Important Formulas & Core Equations: ${activeChapter}\n\n`;
        if (content.formulas && content.formulas.length > 0) {
          content.formulas.forEach(f => {
            text += `#### ${f.name}\n`;
            text += `\`\`\`\n${f.formula}\n\`\`\`\n`;
            text += `*Concept & Application*: ${f.description}\n\n`;
          });
        } else {
          text += `*No mathematical equations in this chapter. Key conceptual relationships:*\n`;
          content.keyTerms.forEach(t => {
            text += `* **${t.term}**: ${t.definition}\n`;
          });
        }
        setAiResponse(text);
      } else if (mode === 'amharic') {
        let text = `### 🇪🇹 በአማርኛ ማብራሪያ (Amharic Explanation): ${activeChapter}\n\n`;
        text += `ይህ ምዕራፍ በዋናነት የሚያተኩረው በሚከተሉት ቁልፍ ነጥቦች ላይ ነው፦\n\n`;
        content.keyTerms.forEach(k => {
          text += `* **${k.term}** (${k.amharic || 'ፍቺ'})፦ ${k.definition}\n`;
        });
        text += `\n**የፈተና ምክር (Exam Tip)፦** በፈተና ወቅት የቃላቱን ትርጉምና ቀመሮቹን በጥንቃቄ በማስተዋል መልስ መስጠት ይመረጣል።\n`;
        setAiResponse(text);
      } else if (mode === 'quiz') {
        const generated = [
          {
            id: 1,
            question: `Which fundamental principle is central to "${activeChapter}"?`,
            options: [
              `The core relationship defined in: ${content.sections[0]?.title || 'Section 1'}`,
              `Arbitrary external variables with no proven empirical model`,
              `Non-systemic random observation without theoretical foundation`,
              `Traditional unverified assumptions prior to modern curriculum`
            ],
            correctIndex: 0,
            explanation: `As outlined in ${activeBook.title}, the official Ethiopian curriculum establishes this foundational law.`
          },
          {
            id: 2,
            question: `In university and national matric evaluations, what is essential when analyzing "${content.keyTerms[0]?.term || 'key definitions'}"?`,
            options: [
              `Disregarding boundary values and theoretical constraints`,
              `Recognizing both the analytical formula and its physical/conceptual meaning`,
              `Memorizing only the title without practical step-by-step application`,
              `Ignoring unit consistency and scientific notations`
            ],
            correctIndex: 1,
            explanation: `Standard examination rubrics award full marks for accurate conceptual precision and step-by-step logic.`
          },
          {
            id: 3,
            question: `What distinguishes the primary approach in this subject?`,
            options: [
              `Subjective guessing without mathematical derivation`,
              `Rigorous deductive framework matching university standards`,
              `Unrelated cross-domain tangents`,
              `Omitting prerequisites and proofs`
            ],
            correctIndex: 1,
            explanation: `The EthioLearn academic standard emphasizes deductive rigor and verified curriculum alignment.`
          }
        ];
        setActivePracticeQuiz(generated);
        setAiResponse('');
      }
      setAiLoading(false);
      playSuccessChime();
    }, 200);
  };

  // Recent book items helper
  const recentBooks = useMemo(() => {
    return recentBookIds
      .map(id => catalog.find(b => b.id === id))
      .filter(Boolean) as ModuleResource[];
  }, [recentBookIds, catalog]);

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 pb-28 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      
      {/* ========================================================================= */}
      {/* 🏛️ PRO HEADER: DIGITAL ACADEMIC LIBRARY HERO BANNER                      */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#101A33] via-[#0E1628] to-[#121E36] border border-white/10 p-6 sm:p-8 shadow-2xl mb-8">
        {/* Ethiopian Tri-Color Subtle Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-emerald-500" />
          <div className="flex-1 bg-[#F59E0B]" />
          <div className="flex-1 bg-red-500" />
        </div>

        {/* Ambient Warm Gold Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ክፍት የትምህርት መጻሕፍት' : '100% Free Open Access Curriculum'}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight text-white leading-tight">
              {language === 'am' ? 'የኢትዮለርን አካዳሚክ ቤተ-መጽሐፍት' : 'EthioLearn Pro Academic Library'}
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {language === 'am' 
                ? 'የዩኒቨርሲቲ ሞጁሎችና የ12ኛ ክፍል ማትሪክ መማሪያ መጻሕፍት። ማናቸውንም መጽሐፍ ያለምንም ገደብ ወዲያውኑ ይክፈቱ፣ ያንብቡና ይማሩ።'
                : 'Access official Ethiopian University course modules and Grade 12 national matric textbooks. Open whatever book you need instantly with zero restrictions.'}
            </p>

            {/* Quick Metrics Ribbon */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>{catalog.length} {language === 'am' ? 'መጻሕፍት' : 'Textbooks'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'am' ? 'ክፍት መዳረሻ' : 'All Free & Unlocked'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <Bot className="w-3.5 h-3.5 text-sky-400" />
                <span>{language === 'am' ? 'አስጎብኚ AI ያለው' : 'AI Asgobnyi Powered'}</span>
              </span>
            </div>
          </div>

          {/* Action Button: Add Custom Book */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => { playClickChime(); setShowAddModal(true); }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{language === 'am' ? 'መጽሐፍ ጨምር' : 'Add Custom Book'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ⏱️ CONTINUE READING SHELF (Recent Books if available)                    */}
      {/* ========================================================================= */}
      {recentBooks.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>{language === 'am' ? 'በቅርብ የተነበቡ' : 'Continue Reading'}</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentBooks.map(book => {
              const visual = getSubjectVisual(book.subject);
              return (
                <div
                  key={`recent_${book.id}`}
                  onClick={() => handleOpenBook(book)}
                  className="p-3.5 rounded-xl bg-[#101A33] border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer flex items-center gap-3 group shadow-md"
                >
                  <div className={`w-10 h-14 rounded-lg bg-gradient-to-br ${visual.gradient} flex items-center justify-center text-lg shadow-sm shrink-0`}>
                    {visual.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block truncate">
                      {book.subject}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {book.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {book.chapters.length} {language === 'am' ? 'ምዕራፎች' : 'chapters'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 SEARCH, FACULTY FILTERS & CONTROLS                                     */}
      {/* ========================================================================= */}
      <div className="space-y-4 mb-6">
        {/* Search Bar & View Options */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'am' ? 'በመጽሐፍ ርዕስ፣ የትምህርት አይነት ወይም ኮድ ይፈልጉ...' : 'Search textbooks by title, subject, university, or course code...'}
              className="w-full pl-10 pr-10 py-3 bg-[#101A33] border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Dropdown */}
            <div className="relative flex items-center bg-[#101A33] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300">
              <span className="text-slate-400 mr-2">{language === 'am' ? 'ቅደም ተከተል:' : 'Sort:'}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer pr-2"
              >
                <option value="rating" className="bg-[#101A33] text-white">★ Top Rated</option>
                <option value="title" className="bg-[#101A33] text-white">A-Z Title</option>
                <option value="pages" className="bg-[#101A33] text-white">Pages (High-Low)</option>
              </select>
            </div>

            {/* Layout Mode Toggle */}
            <div className="flex items-center bg-[#101A33] border border-white/10 rounded-xl p-1 gap-1">
              <button
                onClick={() => { playClickChime(); setViewMode('grid'); }}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => { playClickChime(); setViewMode('list'); }}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Compact List View"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Faculty & Subject Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: language === 'am' ? 'ሁሉም መጻሕፍት' : 'All Books', icon: '📚' },
            { id: 'university', label: language === 'am' ? 'የዩኒቨርሲቲ ኮርሶች' : 'University Common', icon: '🎓' },
            { id: 'grade12', label: language === 'am' ? '12ኛ ክፍል ማትሪክ' : 'Grade 12 Matric', icon: '🎒' },
            { id: 'engineering', label: language === 'am' ? 'ኢንጂነሪንግና ቴክ' : 'Engineering & Tech', icon: '⚙️' },
            { id: 'medicine', label: language === 'am' ? 'ህክምናና ጤና' : 'Health & Medicine', icon: '🩺' },
            { id: 'business', label: language === 'am' ? 'ቢዝነስና ኢኮኖሚክስ' : 'Business & Econ', icon: '💼' },
            { id: 'social', label: language === 'am' ? 'ማህበራዊ ሳይንስ' : 'Social Sciences', icon: '🧠' },
            { id: 'favorites', label: language === 'am' ? 'ምርጥ መጻሕፍት' : 'Favorites', icon: '⭐' }
          ].map(tab => {
            const isActive = selectedFaculty === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { playClickChime(); setSelectedFaculty(tab.id); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-[1.02]'
                    : 'bg-[#101A33]/80 text-slate-300 border-white/10 hover:border-amber-500/30 hover:bg-[#101A33]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'favorites' && favoriteBookIds.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-black/20 text-slate-950' : 'bg-amber-500/20 text-amber-400'}`}>
                    {favoriteBookIds.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📚 MAIN BOOK CATALOG (Grid or List View)                                  */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            {language === 'am' ? 'የተገኙ መጻሕፍት' : 'Showing'} <strong className="text-white">{filteredBooks.length}</strong> {language === 'am' ? 'መጻሕፍት' : 'open textbooks'}
          </span>
          {debouncedSearch && (
            <span className="text-amber-400">
              "{debouncedSearch}"
            </span>
          )}
        </div>

        {filteredBooks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#101A33] border border-white/10 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">
              {language === 'am' ? 'ምንም የተገኘ መጽሐፍ የለም' : 'No textbooks found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {language === 'am'
                ? 'እባክዎን የፍለጋ ቃሉን ወይም የተመረጠውን ዘርፍ ይቀይሩ።'
                : 'Try adjusting your search query or selecting another faculty filter tab.'}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedFaculty('all'); }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {language === 'am' ? 'ሁሉንም አሳይ' : 'Reset All Filters'}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBooks.map(book => {
              const visual = getSubjectVisual(book.subject);
              const isFav = favoriteBookIds.includes(book.id);

              return (
                <div
                  key={book.id}
                  className="rounded-2xl bg-[#101A33] border border-white/10 hover:border-amber-500/40 p-5 shadow-lg flex flex-col justify-between transition-all group hover:shadow-xl hover:-translate-y-0.5"
                >
                  <div className="space-y-4">
                    {/* Card Top: Visual Book Spine + Badge + Favorite */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Book Graphic */}
                        <div className={`w-12 h-16 rounded-xl bg-gradient-to-br ${visual.gradient} flex flex-col justify-between p-1.5 text-white shadow-md relative shrink-0 border border-white/20 select-none`}>
                          <div className="text-[8px] font-black tracking-tighter opacity-90 uppercase truncate">
                            {book.grade}
                          </div>
                          <div className="text-base self-center filter drop-shadow">
                            {visual.icon}
                          </div>
                          <div className="text-[7.5px] font-bold tracking-tight truncate text-center bg-black/30 rounded px-1">
                            {book.subject}
                          </div>
                        </div>

                        {/* Title & Subject */}
                        <div className="space-y-1 min-w-0">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${visual.bgTag}`}>
                            {book.subject}
                          </span>
                          <h3 className="font-serif font-black text-sm text-white leading-snug group-hover:text-amber-300 transition-colors line-clamp-2">
                            {book.title}
                          </h3>
                        </div>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => toggleFavorite(book.id, e)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-amber-400 cursor-pointer shrink-0"
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400 scale-110' : ''}`} />
                      </button>
                    </div>

                    {/* Book Description */}
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal">
                      {book.description}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>{book.chapters.length} {language === 'am' ? 'ምዕራፎች' : 'Chapters'}</span>
                      </span>
                      <span>•</span>
                      <span>{book.pages} {language === 'am' ? 'ገጾች' : 'pages'}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" />
                        <span>Open Access</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Actions: Primary Open & Read Button */}
                  <div className="pt-4 mt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenBook(book)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-4 h-4 text-slate-950" />
                      <span>{language === 'am' ? 'መጽሐፉን ክፈት' : 'Open & Read'}</span>
                    </button>

                    {book.pdfUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickChime();
                          window.open(book.pdfUrl, '_blank');
                        }}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Download or View PDF in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List / Compact View */
          <div className="space-y-2">
            {filteredBooks.map(book => {
              const visual = getSubjectVisual(book.subject);
              const isFav = favoriteBookIds.includes(book.id);

              return (
                <div
                  key={book.id}
                  onClick={() => handleOpenBook(book)}
                  className="p-4 rounded-xl bg-[#101A33] border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-14 rounded-lg bg-gradient-to-br ${visual.gradient} flex items-center justify-center text-lg shadow-sm shrink-0`}>
                      {visual.icon}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-white/5 text-amber-400 border border-white/10">
                          {book.grade}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {book.subject}
                        </span>
                      </div>
                      <h3 className="font-serif font-black text-sm text-white group-hover:text-amber-300 transition-colors truncate">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {book.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={(e) => toggleFavorite(book.id, e)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-amber-400 cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBook(book);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ክፈት' : 'Open'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📖 PRO E-BOOK READER MODAL / FULL INTERFACE                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {readerOpen && activeBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-0 md:p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className={`w-full h-full md:max-w-7xl md:h-[95vh] rounded-none md:rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors duration-200 ${
                readerTheme === 'dark'
                  ? 'bg-[#0A1128] text-slate-100 border-white/10'
                  : readerTheme === 'midnight'
                  ? 'bg-[#030712] text-zinc-100 border-zinc-800'
                  : 'bg-[#1C1917] text-[#F5F5F4] border-stone-800'
              }`}
            >
              {/* Reader Header Control Bar */}
              <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#0E1628]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Left: Book Title & Chapter indicator */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                    <BookOpenCheck className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                        {activeBook.grade}
                      </span>
                      <span className="text-xs text-slate-400 font-bold truncate">
                        {activeBook.subject}
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-serif font-black text-white truncate max-w-md">
                      {activeBook.title}
                    </h2>
                  </div>
                </div>

                {/* Right: Controls (Theme, Font, View Mode, Close) */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {/* Mode Switch: Chapters vs PDF */}
                  {activeBook.pdfUrl && (
                    <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-xl gap-1">
                      <button
                        onClick={() => { playClickChime(); setReaderViewMode('chapters'); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                          readerViewMode === 'chapters' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{language === 'am' ? 'ምዕራፎች' : 'Notes'}</span>
                      </button>
                      <button
                        onClick={() => { playClickChime(); setReaderViewMode('pdf'); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                          readerViewMode === 'pdf' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  )}

                  {/* Theme Selectors */}
                  <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-xl gap-1">
                    <button
                      onClick={() => { playClickChime(); setReaderTheme('dark'); }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${readerTheme === 'dark' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                      title="Navy Slate Theme"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { playClickChime(); setReaderTheme('midnight'); }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${readerTheme === 'midnight' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                      title="Midnight Dark Theme"
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { playClickChime(); setReaderTheme('sepia'); }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${readerTheme === 'sepia' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                      title="Eye-care Sepia Theme"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Font Sizer */}
                  <div className="flex items-center bg-white/5 border border-white/10 px-2 py-1.5 rounded-xl gap-2 text-xs">
                    <button
                      onClick={() => { playClickChime(); setReaderFontSize(p => Math.max(13, p - 1)); }}
                      className="font-extrabold hover:text-amber-400 cursor-pointer"
                    >
                      A-
                    </button>
                    <span className="font-mono text-[11px] text-amber-400 font-bold">{readerFontSize}px</span>
                    <button
                      onClick={() => { playClickChime(); setReaderFontSize(p => Math.min(22, p + 1)); }}
                      className="font-extrabold hover:text-amber-400 cursor-pointer"
                    >
                      A+
                    </button>
                  </div>

                  {/* Font Family Toggle */}
                  <button
                    onClick={() => { playClickChime(); setReaderFontFamily(f => f === 'sans' ? 'serif' : 'sans'); }}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                    title={readerFontFamily === 'sans' ? 'Switch to Serif' : 'Switch to Sans'}
                  >
                    <Type className="w-4 h-4" />
                  </button>

                  {/* Close Reader */}
                  <button
                    onClick={() => { playClickChime(); setReaderOpen(false); }}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                    title="Close Reader"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Reader Body Grid: Sidebar TOC + Center Stage Reading + AI Assistant */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
                
                {/* 1. Left Table of Contents Sidebar (3 columns) */}
                <div className="lg:col-span-3 border-r border-white/10 p-4 overflow-y-auto space-y-4 bg-black/20 hidden lg:block">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'am' ? 'የይዘት ማውጫ' : 'Table of Contents'}</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">{activeBook.chapters.length} items</span>
                  </div>

                  <div className="space-y-1.5">
                    {activeBook.chapters.map((ch, idx) => {
                      const isSelected = activeChapter === ch;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            playClickChime();
                            setActiveChapter(ch);
                            setAiResponse('');
                            setActivePracticeQuiz(null);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold leading-relaxed transition-all cursor-pointer flex items-start gap-2 border ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                          }`}
                        >
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded mt-0.5 ${isSelected ? 'bg-black/20 text-slate-950 font-bold' : 'bg-white/10 text-slate-400'}`}>
                            {idx + 1}
                          </span>
                          <span className="flex-1 line-clamp-2">{ch}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Direct PDF Link */}
                  {activeBook.pdfUrl && (
                    <div className="pt-3 border-t border-white/10">
                      <a
                        href={activeBook.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{language === 'am' ? 'ሙሉ ፒዲኤፍ አውርድ' : 'Open / Download PDF'}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* 2. Center Reading Stage (7 columns if AI open, else 9 columns) */}
                <div className={`${aiPanelOpen ? 'lg:col-span-6' : 'lg:col-span-9'} overflow-y-auto p-6 sm:p-8 space-y-6 transition-all`}>
                  
                  {readerViewMode === 'pdf' && activeBook.pdfUrl ? (
                    /* PDF Reading Mode: Clean direct display with open in tab action */
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
                        <span>
                          {language === 'am' 
                            ? 'ፒዲኤፉን በሙሉ ስክሪን ለማንበብ ወይም ለማውረድ አዲሱን ታብ ይጠቀሙ።' 
                            : 'Reading official verified textbook PDF. You can also open the full document directly in a separate browser tab.'}
                        </span>
                        <a
                          href={activeBook.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider shrink-0 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Tab</span>
                        </a>
                      </div>
                      <div className="w-full h-[700px] rounded-xl overflow-hidden border border-white/10 bg-slate-950 shadow-inner">
                        <iframe
                          src={`https://docs.google.com/gview?url=${encodeURIComponent(activeBook.pdfUrl)}&embedded=true`}
                          title={`PDF Textbook: ${activeBook.title}`}
                          className="w-full h-full border-0"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Structured Chapter Content Mode */
                    (() => {
                      const chapterContent = getChapterContent(activeBook.id, activeChapter, activeBook.contentJson);
                      return (
                        <div 
                          className={`space-y-6 max-w-3xl mx-auto ${readerFontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
                          style={{ fontSize: `${readerFontSize}px`, lineHeight: 1.7 }}
                        >
                          {/* Chapter Header */}
                          <div className="space-y-2 border-b border-white/10 pb-5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                {activeBook.subject} • {activeBook.grade}
                              </span>
                              <button
                                onClick={() => setAiPanelOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-colors cursor-pointer"
                              >
                                <Bot className="w-3.5 h-3.5" />
                                <span>{language === 'am' ? 'አስጎብኚ AI' : 'Ask Asgobnyi'}</span>
                              </button>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                              {chapterContent.title}
                            </h1>
                          </div>

                          {/* Chapter Intro */}
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10 italic text-slate-300">
                            {chapterContent.intro}
                          </div>

                          {/* Key Sections */}
                          <div className="space-y-6">
                            {chapterContent.sections.map((sec, idx) => (
                              <div key={idx} className="space-y-2">
                                <h2 className="text-base sm:text-lg font-bold text-amber-300 border-l-2 border-amber-400 pl-3">
                                  {sec.title}
                                </h2>
                                <p className="text-slate-200 whitespace-pre-line leading-relaxed">
                                  {sec.body}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Mathematical Formulas & Scientific Rules (if any) */}
                          {chapterContent.formulas && chapterContent.formulas.length > 0 && (
                            <div className="p-5 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                <span>🧮</span>
                                <span>{language === 'am' ? 'ቁልፍ ቀመሮችና ህጎች' : 'Core Mathematical & Scientific Formulas'}</span>
                              </h3>
                              <div className="grid grid-cols-1 gap-3">
                                {chapterContent.formulas.map((f, i) => (
                                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                                    <div className="font-bold text-sm text-white">{f.name}</div>
                                    <div className="p-2 rounded-lg bg-black/60 font-mono text-amber-300 text-xs overflow-x-auto">
                                      {f.formula}
                                    </div>
                                    <div className="text-[11px] text-slate-400">{f.description}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bilingual Glossary Terms */}
                          {chapterContent.keyTerms && chapterContent.keyTerms.length > 0 && (
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <span>📖</span>
                                <span>{language === 'am' ? 'ቁልፍ ቃላትና ፍቺዎች' : 'Essential Concepts & Glossary'}</span>
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {chapterContent.keyTerms.map((term, i) => (
                                  <div key={i} className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                                    <div className="font-bold text-xs text-amber-300">
                                      {term.term} {term.amharic ? `(${term.amharic})` : ''}
                                    </div>
                                    <div className="text-[11px] text-slate-300 leading-snug">
                                      {term.definition}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* National Exam Alert */}
                          {chapterContent.examAlert && (
                            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-extrabold uppercase tracking-wider block text-amber-400">
                                  {language === 'am' ? 'የፈተና ማሳሰቢያ' : 'National Matric Exam Alert'}
                                </span>
                                <p className="text-slate-200 leading-relaxed font-normal">{chapterContent.examAlert}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* 3. Right AI Assistant Panel (Asgobnyi "አስጎብኚ") */}
                {aiPanelOpen && (
                  <div className="lg:col-span-3 border-l border-white/10 p-4 bg-[#0E1628] flex flex-col justify-between overflow-y-auto space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                            {language === 'am' ? 'አስጎብኚ AI ረዳት' : 'Asgobnyi AI Tutor'}
                          </h4>
                        </div>
                        <button
                          onClick={() => setAiPanelOpen(false)}
                          className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick AI Prompts */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAiAction('summary')}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-[11px] font-bold text-slate-200 hover:text-amber-300 transition-all cursor-pointer flex flex-col gap-1"
                        >
                          <span>📖</span>
                          <span>{language === 'am' ? 'ምዕራፍ አሳጥር' : 'Summarize'}</span>
                        </button>
                        <button
                          onClick={() => handleAiAction('formulas')}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-[11px] font-bold text-slate-200 hover:text-amber-300 transition-all cursor-pointer flex flex-col gap-1"
                        >
                          <span>🧮</span>
                          <span>{language === 'am' ? 'ቀመሮችና ህጎች' : 'Key Formulas'}</span>
                        </button>
                        <button
                          onClick={() => handleAiAction('amharic')}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-[11px] font-bold text-slate-200 hover:text-amber-300 transition-all cursor-pointer flex flex-col gap-1"
                        >
                          <span>🇪🇹</span>
                          <span>{language === 'am' ? 'በአማርኛ አስረዳ' : 'In Amharic'}</span>
                        </button>
                        <button
                          onClick={() => handleAiAction('quiz')}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-[11px] font-bold text-slate-200 hover:text-amber-300 transition-all cursor-pointer flex flex-col gap-1"
                        >
                          <span>🎯</span>
                          <span>{language === 'am' ? '3 ጥያቄዎች' : '3 Quiz MCQs'}</span>
                        </button>
                      </div>

                      {/* AI Response Display */}
                      {aiLoading ? (
                        <div className="p-6 text-center space-y-2">
                          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                          <p className="text-xs text-slate-400">
                            {language === 'am' ? 'አስጎብኚ ትንተና በማዘጋጀት ላይ...' : 'Asgobnyi is analyzing this chapter...'}
                          </p>
                        </div>
                      ) : activePracticeQuiz ? (
                        /* Practice Quiz UI */
                        <div className="space-y-4">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                            {language === 'am' ? 'ፈጣን የፈተና ጥያቄዎች' : 'Quick Chapter Quiz'}
                          </h5>
                          {activePracticeQuiz.map((q, qIdx) => {
                            const chosen = selectedAnswers[qIdx];
                            const isAnswered = chosen !== undefined;
                            return (
                              <div key={q.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                                <p className="text-xs font-bold text-white">{qIdx + 1}. {q.question}</p>
                                <div className="space-y-1">
                                  {q.options.map((opt: string, oIdx: number) => {
                                    const isCorrect = oIdx === q.correctIndex;
                                    const isSelected = chosen === oIdx;
                                    let btnStyle = "bg-white/5 text-slate-300 hover:bg-white/10 border-white/5";
                                    if (isAnswered) {
                                      if (isCorrect) btnStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold";
                                      else if (isSelected) btnStyle = "bg-red-500/20 text-red-300 border-red-500/40";
                                    }
                                    return (
                                      <button
                                        key={oIdx}
                                        disabled={isAnswered}
                                        onClick={() => {
                                          playClickChime();
                                          setSelectedAnswers(p => ({ ...p, [qIdx]: oIdx }));
                                        }}
                                        className={`w-full text-left p-2 rounded-lg text-[11px] border transition-colors cursor-pointer ${btnStyle}`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                                {isAnswered && (
                                  <p className="text-[10px] text-slate-400 italic pt-1 border-t border-white/5">
                                    💡 {q.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : aiResponse ? (
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto">
                          {aiResponse}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-500">
                          {language === 'am' 
                            ? 'ከላይ ያሉትን ቁልፎች በመጫን የዚህን ምዕራፍ ማጠቃለያ ወይም ፈተና ይጠይቁ።'
                            : 'Select a quick action above to summarize, test yourself, or explain this chapter.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ➕ ADD CUSTOM TEXTBOOK / MODULE MODAL                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg bg-[#101A33] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">
                    {language === 'am' ? 'አዲስ መማሪያ መጽሐፍ ጨምር' : 'Add Custom Textbook / Notes'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomBook} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">
                    Book Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Fundamentals of Database Systems"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="e.g. Computer Science, Civics"
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">
                      Academic Level
                    </label>
                    <select
                      value={customGrade}
                      onChange={(e) => setCustomGrade(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="University">University</option>
                      <option value="Grade 12">Grade 12</option>
                      <option value="Grade 12 New Curriculum">Grade 12 New Curriculum</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">
                    Chapters (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={customChapters}
                    onChange={(e) => setCustomChapters(e.target.value)}
                    placeholder="Chapter 1: Relational Data Models&#10;Chapter 2: SQL & Normalization"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">
                    Direct PDF URL (Optional online link)
                  </label>
                  <input
                    type="url"
                    value={customPdfUrl}
                    onChange={(e) => setCustomPdfUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Book</span>
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
