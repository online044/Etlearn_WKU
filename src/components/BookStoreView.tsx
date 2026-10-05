/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Search, Star, Bookmark, BookOpen, ChevronRight, ChevronLeft,
  X, Check, Bot, Sparkles, Printer, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Download, Moon, Sun, Layers, HelpCircle, CheckCircle2, RotateCcw, Share2
} from 'lucide-react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime } from '../utils/audio';
import { getChapterContent } from '../data/textbookChapterContent';
import { safeStorage } from '../utils/safeStorage';

export interface BookStoreViewProps {
  profile: StudentProfile;
  apiKey?: string;
  language: 'en' | 'am';
  onNavigate: (page: string) => void;
  onStudyAction: () => void;
  books?: any[];
  supabaseBooks?: any[];
  onOpenInAppViewer?: (url: string, title: string) => void;
}

export interface FreshmanModule {
  id: string;
  code: string;
  title: string;
  amharicTitle: string;
  stream: 'Common' | 'Natural Science' | 'Social Science';
  semester: 'Semester I' | 'Semester II';
  subject: string;
  chapters: string[];
  pages: number;
  fileSizeMb: number;
  creditHours: number;
  description: string;
  amharicDescription: string;
  rating: number;
}

/**
 * 🎓 OFFICIAL ETHIOPIAN UNIVERSITY FRESHMAN MODULES CURRICULUM
 * Standardized across all Ethiopian Higher Education Public Universities (MoE).
 */
export const FRESHMAN_MODULES: FreshmanModule[] = [
  {
    id: 'freshman_critical_thinking',
    code: 'Phil 1011',
    title: 'Critical Thinking',
    amharicTitle: 'ስነ-አመክንዮ እና ሂሳዊ አስተሳሰብ',
    stream: 'Common',
    semester: 'Semester I',
    subject: 'Logic & Philosophy',
    creditHours: 3,
    pages: 148,
    fileSizeMb: 3.6,
    rating: 4.9,
    description: 'Official Ministry of Education module covering argumentative structures, premises and conclusions, deductive validity, inductive strength, and formal/informal cognitive fallacies.',
    amharicDescription: 'የአመክንዮ መሰረቶች፣ ትክክለኛ እና ስህተት የሆኑ የመከራከሪያ ነጥቦች (Fallacies)፣ እና ሂሳዊ የአስተሳሰብ ክህሎቶችን የሚያስተምር የጋራ የዩኒቨርሲቲ ሞጁል።',
    chapters: [
      'Chapter 1: Introducing Philosophy, Logic and Arguments',
      'Chapter 2: Basic Concepts of Logic and Deduction',
      'Chapter 3: Informal Fallacies (Relevance, Weak Induction, Presumption)',
      'Chapter 4: Categorical Propositions and Syllogisms',
      'Chapter 5: Propositional Logic and Truth Tables'
    ]
  },
  {
    id: 'freshman_economics',
    code: 'Econ 1011',
    title: 'Economics',
    amharicTitle: 'መግቢያ የኢኮኖሚክስ ትምህርት',
    stream: 'Common',
    semester: 'Semester I',
    subject: 'Economics',
    creditHours: 3,
    pages: 176,
    fileSizeMb: 4.2,
    rating: 4.8,
    description: 'Foundations of economic analysis: scarcity and choice, production possibilities frontier (PPF), market demand and supply equilibrium, consumer utility, and macroeconomic indicators.',
    amharicDescription: 'የእጥረትና የምርጫ ህጎች፣ የፍላጎትና አቅርቦት ሚዛን፣ የተጠቃሚዎች እርካታ (Utility) እና አጠቃላይ የሀገር ኢኮኖሚ መለኪያዎች።',
    chapters: [
      'Chapter 1: Foundations of Economics & Scarcity',
      'Chapter 2: Demand, Supply and Market Equilibrium',
      'Chapter 3: Elasticity of Demand and Supply',
      'Chapter 4: Theory of Consumer Behavior & Utility',
      'Chapter 5: Theory of Production and Costs',
      'Chapter 6: Macroeconomic Goals and National Income Accounting'
    ]
  },
  {
    id: 'freshman_emerging_tech',
    code: 'EmTe 1012',
    title: 'Emerging Technologies',
    amharicTitle: 'መግቢያ ወደ አዳዲስ ቴክኖሎጂዎች',
    stream: 'Common',
    semester: 'Semester II',
    subject: 'Technology',
    creditHours: 3,
    pages: 154,
    fileSizeMb: 3.9,
    rating: 5.0,
    description: 'Comprehensive curriculum on the Fourth Industrial Revolution (4IR), Artificial Intelligence, Machine Learning paradigms, Internet of Things (IoT), Big Data, and Cloud/Blockchain systems.',
    amharicDescription: 'የአራተኛው የኢንዱስትሪ አብዮት (4IR)፣ አርቴፊሻል ኢንተለጀንስ (AI)፣ የነገሮች ኢንተርኔት (IoT) እና የሳይበር ደህንነት ጽንሰ-ሀሳቦች።',
    chapters: [
      'Chapter 1: Introduction to the Fourth Industrial Revolution (4IR)',
      'Chapter 2: Data Science, Big Data and Analytics',
      'Chapter 3: Artificial Intelligence and Machine Learning',
      'Chapter 4: Internet of Things (IoT) & Smart Ecosystems',
      'Chapter 5: Cybersecurity, Cloud Computing and Blockchain'
    ]
  },
  {
    id: 'freshman_entrepreneurship',
    code: 'Mgmt 1012',
    title: 'Entrepreneurship',
    amharicTitle: 'ስራ ፈጠራ እና የንግድ ልማት',
    stream: 'Common',
    semester: 'Semester II',
    subject: 'Management',
    creditHours: 3,
    pages: 142,
    fileSizeMb: 3.4,
    rating: 4.8,
    description: 'Principles of entrepreneurial mindset, opportunity recognition, business planning, market feasibility analysis, venture financing, and Ethiopian small and micro enterprise policies.',
    amharicDescription: 'የስራ ፈጠራ አስተሳሰብ፣ አዋጭ የንግድ ሃሳቦችን ማፍለቅ፣ የንግድ እቅድ ዝግጅት እና በኢትዮጵያ የስራ እድል ፈጠራ ስልቶች።',
    chapters: [
      'Chapter 1: Nature of Entrepreneurship & Entrepreneurial Mindset',
      'Chapter 2: Business Idea Generation and Opportunity Recognition',
      'Chapter 3: Business Planning and Feasibility Analysis',
      'Chapter 4: Marketing Strategies for New Ventures',
      'Chapter 5: Financing the New Venture & Micro-Finance in Ethiopia'
    ]
  },
  {
    id: 'freshman_biology',
    code: 'Biol 1011',
    title: 'General Biology',
    amharicTitle: 'አጠቃላይ ባዮሎጂ',
    stream: 'Natural Science',
    semester: 'Semester I',
    subject: 'Biology',
    creditHours: 3,
    pages: 196,
    fileSizeMb: 5.1,
    rating: 4.9,
    description: 'Molecular basis of life, cellular structure and organelle biology, bioenergetics (cellular respiration and photosynthesis), molecular genetics, and ecological biodiversity in Ethiopia.',
    amharicDescription: 'የህይወት ሞለኪውላዊ መሰረት፣ የህዋስ (Cell) አወቃቀር፣ የሃይል አመነጫጨት ስርዓት፣ የዘረ-መል (DNA) ጥናትና ስነ-ምህዳር።',
    chapters: [
      'Chapter 1: The Molecular Basis and Chemistry of Life',
      'Chapter 2: Cell Structure, Function and Membrane Transport',
      'Chapter 3: Cellular Metabolism, Respiration and Photosynthesis',
      'Chapter 4: Molecular Genetics, DNA and Protein Synthesis',
      'Chapter 5: Principles of Ecology and Ethiopian Ecosystems'
    ]
  },
  {
    id: 'freshman_chemistry',
    code: 'Chem 1011',
    title: 'General Chemistry',
    amharicTitle: 'አጠቃላይ ኬሚስትሪ',
    stream: 'Natural Science',
    semester: 'Semester I',
    subject: 'Chemistry',
    creditHours: 3,
    pages: 218,
    fileSizeMb: 5.5,
    rating: 4.8,
    description: 'Atomic structure, quantum mechanical models, periodic trends, chemical bonding and VSEPR theories, gas laws, chemical thermodynamics, kinetics, and chemical equilibrium.',
    amharicDescription: 'የአተም ውስጣዊ አወቃቀር፣ ኬሚካላዊ ትስስሮች፣ የጋዞች ህግ፣ ቴርሞዳይናሚክስ እና ኬሚካላዊ ምላሽ ፍጥነት።',
    chapters: [
      'Chapter 1: Atomic Structure, Quantum Numbers and Periodic Trends',
      'Chapter 2: Chemical Bonding and Molecular Geometry (VSEPR & Hybridization)',
      'Chapter 3: States of Matter, Gases and Solution Chemistry',
      'Chapter 4: Chemical Thermodynamics and Thermochemistry',
      'Chapter 5: Chemical Kinetics and Reaction Rates',
      'Chapter 6: Chemical Equilibrium, Acid-Base Systems'
    ]
  },
  {
    id: 'freshman_physics',
    code: 'Phys 1011',
    title: 'General Physics Course Syllabus / General Physics',
    amharicTitle: 'አጠቃላይ ፊዚክስ',
    stream: 'Natural Science',
    semester: 'Semester I',
    subject: 'Physics',
    creditHours: 3,
    pages: 232,
    fileSizeMb: 5.8,
    rating: 4.9,
    description: 'Vectors and coordinate systems, kinematics in 1D & 2D, Newton\'s laws of motion, work-energy theorems, rotational equilibrium, fluid mechanics, oscillations, and thermodynamics.',
    amharicDescription: 'የቬክተር ስሌቶች፣ የኒውተን የእንቅስቃሴ ህጎች፣ ስራና ጉልበት፣ የማዕበል ባህሪያትና የሙቀት ህጎች (ቴርሞዳይናሚክስ)።',
    chapters: [
      'Chapter 1: Vectors, Kinematics and Motion in 1D & 2D',
      'Chapter 2: Newton\'s Laws of Motion, Work and Energy',
      'Chapter 3: Rotational Dynamics and Static Equilibrium',
      'Chapter 4: Fluid Mechanics and Pressure',
      'Chapter 5: Oscillations, Waves and Optics',
      'Chapter 6: Heat Transfer and Laws of Thermodynamics'
    ]
  },
  {
    id: 'freshman_psychology',
    code: 'Pscy 1011',
    title: 'General Psychology',
    amharicTitle: 'አጠቃላይ ሳይኮሎጂ እና የህይወት ክህሎት',
    stream: 'Common',
    semester: 'Semester I',
    subject: 'Psychology',
    creditHours: 3,
    pages: 164,
    fileSizeMb: 3.8,
    rating: 4.8,
    description: 'Scientific foundations of behavior and mental processes, neuropsychology, sensation and perception, behavioral conditioning, cognitive memory models, emotion, and vital life skills.',
    amharicDescription: 'የሰው ልጅ ባህሪና የአእምሮ ሂደት ጥናት፣ የመማር ንድፈ-ሃሳቦች፣ የማስታወስ ችሎታ እና የስነ-ልቦና ህይወት ክህሎቶች።',
    chapters: [
      'Chapter 1: Introduction to Psychology & Research Methods',
      'Chapter 2: Biological Bases of Behavior and Neuroanatomy',
      'Chapter 3: Sensation, Perception and Attention',
      'Chapter 4: Theories of Learning (Classical & Operant Conditioning)',
      'Chapter 5: Human Memory Systems and Forgetting',
      'Chapter 6: Motivation, Emotion and Life Skills'
    ]
  },
  {
    id: 'freshman_geography',
    code: 'GeES 1011',
    title: 'Geography',
    amharicTitle: 'የኢትዮጵያና የአፍሪካ ቀንድ ጂኦግራፊ',
    stream: 'Common',
    semester: 'Semester I',
    subject: 'Geography',
    creditHours: 3,
    pages: 188,
    fileSizeMb: 4.6,
    rating: 4.8,
    description: 'Spatial configuration of Ethiopia and the Horn, geological formations and landforms, major drainage basins (Blue Nile, Awash, Omo), climate regimes, soils, and population demography.',
    amharicDescription: 'የኢትዮጵያ መልክዓ-ምድር አቀማመጥ፣ የጂኦሎጂ ታሪክና ተራሮች፣ የወንዞችና ሀይቆች ተፋሰሶች፣ የአየር ንብረትና የህዝብ ስነ-ስብስብ።',
    chapters: [
      'Chapter 1: Geographic Setting and Location of Ethiopia and the Horn',
      'Chapter 2: Geological History and Topography of Ethiopia',
      'Chapter 3: Drainage Systems and Water Resources of Ethiopia',
      'Chapter 4: The Climate of Ethiopia and Agro-Ecological Zones',
      'Chapter 5: Natural Resources, Soils and Vegetation of Ethiopia',
      'Chapter 6: Population Dynamics and Demography of Ethiopia'
    ]
  },
  {
    id: 'freshman_global_trends',
    code: 'GlTr 1012',
    title: 'Global Trends',
    amharicTitle: 'አለም አቀፍ አዝማሚያዎች',
    stream: 'Common',
    semester: 'Semester II',
    subject: 'Political Science',
    creditHours: 3,
    pages: 156,
    fileSizeMb: 3.7,
    rating: 4.7,
    description: 'Theories of International Relations (Realism, Liberalism, Constructivism), globalization dynamics, global political economy, regional integration in Africa, and contemporary security issues.',
    amharicDescription: 'የአለም አቀፍ ግንኙነቶች ንድፈ-ሀሳብ፣ ግሎባላይዜሽን፣ የአለም ኢኮኖሚ ስርዓትና የአፍሪካ ቀጣናዊ ትብብር።',
    chapters: [
      'Chapter 1: Understanding International Relations and Globalization',
      'Chapter 2: Theories of International Relations (Realism, Liberalism)',
      'Chapter 3: Global Political Economy and Development Disparities',
      'Chapter 4: Regionalism and Regional Integration in Africa',
      'Chapter 5: Major Global Issues: Security, Environment and Technology'
    ]
  },
  {
    id: 'freshman_inclusiveness',
    code: 'Incl 1012',
    title: 'Inclusiveness',
    amharicTitle: 'አሳታፊነት (ኢንክሉሲቭነስ)',
    stream: 'Common',
    semester: 'Semester II',
    subject: 'Special Needs',
    creditHours: 2,
    pages: 124,
    fileSizeMb: 3.1,
    rating: 4.8,
    description: 'Concepts of impairment, disability and vulnerability, screening and assessment, universal design for learning, assistive devices, and legal human rights frameworks in Ethiopian universities.',
    amharicDescription: 'ልዩ ፍላጎት ያላቸውን ሰዎች መደገፍ፣ አካታች የትምህርትና ማህበራዊ ስርዓት መገንባት እና በኢትዮጵያ የሰብዓዊ መብት ድንጋጌዎች።',
    chapters: [
      'Chapter 1: Understanding Disabilities and Vulnerabilities',
      'Chapter 2: Assessment and Identification of Special Needs',
      'Chapter 3: Creating an Inclusive Environment and Universal Design',
      'Chapter 4: Assistive Technologies and Classroom Accommodations',
      'Chapter 5: Legal Frameworks, Policies and Human Rights in Ethiopia'
    ]
  },
  {
    id: 'freshman_civics',
    code: 'MCiE 1012',
    title: 'Moral and Civic Education',
    amharicTitle: 'ስነ-ምግባር እና ዜግነት ትምህርት',
    stream: 'Common',
    semester: 'Semester II',
    subject: 'Civics & Ethics',
    creditHours: 3,
    pages: 172,
    fileSizeMb: 4.0,
    rating: 4.8,
    description: 'Normative and applied ethics, the role of state and government, citizenship responsibilities, the FDRE constitution, human and democratic rights, and peaceful conflict resolution.',
    amharicDescription: 'የስነ-ምግባር ንድፈ-ሃሳቦች፣ የመንግስትና የዜግነት መብትና ግዴታዎች፣ የኢፌዴሪ ህገ-መንግስት እና የሰላም ግንባታ።',
    chapters: [
      'Chapter 1: Foundations of Civics, Ethics and Morality',
      'Chapter 2: Approaches to Ethics (Normative, Deontological, Utilitarian)',
      'Chapter 3: State, Government, Citizenship and Constitution in Ethiopia',
      'Chapter 4: Human and Democratic Rights in Democratic Systems',
      'Chapter 5: Peace Building, Conflict Resolution and National Unity'
    ]
  },
  {
    id: 'freshman_physical_fitness',
    code: 'SpSc 1011',
    title: 'Physical Fitness',
    amharicTitle: 'የአካል ብቃትና ጤና',
    stream: 'Common',
    semester: 'Semester I',
    subject: 'Sports Science',
    creditHours: 2,
    pages: 110,
    fileSizeMb: 2.8,
    rating: 4.7,
    description: 'Health-related and skill-related fitness, cardiovascular endurance, muscular strength and flexibility, principles of exercise prescription (FITT), nutrition, and injury prevention.',
    amharicDescription: 'የአካል ብቃትና ጤናማ የአኗኗር ዘይቤ፣ የልብና የጡንቻ ብቃት ማጎልበቻ ስልቶች እና የስፖርት አመጋገብ።',
    chapters: [
      'Chapter 1: Concepts of Physical Fitness, Wellness and Health',
      'Chapter 2: Health-Related and Skill-Related Components of Fitness',
      'Chapter 3: Principles of Exercise Training and Workout Planning',
      'Chapter 4: Nutrition, Energy Systems and Weight Management',
      'Chapter 5: Common Sports Injuries, Prevention and First Aid'
    ]
  },
  {
    id: 'freshman_english_1',
    code: 'FLEn 1011',
    title: 'Communicative English Language Skills I (FLEn 1011)',
    amharicTitle: 'ተግባቦታዊ የእንግሊዝኛ ቋንቋ ክህሎት ፩',
    stream: 'Common',
    semester: 'Semester I',
    subject: 'Languages',
    creditHours: 3,
    pages: 135,
    fileSizeMb: 3.3,
    rating: 4.9,
    description: 'Active university study skills, reading comprehension techniques, paragraph structure (topic sentences, support, unity, coherence), syntactic grammar, and academic listening/speaking.',
    amharicDescription: 'የዩኒቨርሲቲ የንባብና ማስታወሻ መያዝ ክህሎቶች፣ የአንቀጽ (Paragraph) አወቃቀርና የአካዳሚክ የእንግሊዝኛ ሰዋስው።',
    chapters: [
      'Chapter 1: Study Skills, Active Reading and Note-Taking Strategies',
      'Chapter 2: Paragraph Organization, Unity and Coherence',
      'Chapter 3: Sentence Structure, Coordination and Subordination',
      'Chapter 4: Academic Vocabulary in Context',
      'Chapter 5: Oral Communication and Presentation Techniques'
    ]
  },
  {
    id: 'freshman_english_2',
    code: 'FLEn 1012',
    title: 'Communicative English Language Skills II',
    amharicTitle: 'ተግባቦታዊ የእንግሊዝኛ ቋንቋ ክህሎት ፪',
    stream: 'Common',
    semester: 'Semester II',
    subject: 'Languages',
    creditHours: 3,
    pages: 140,
    fileSizeMb: 3.5,
    rating: 4.8,
    description: 'Advanced critical reading, expository and argumentative essay writing, academic referencing and citation standards (APA/MLA), paraphrasing, summarizing, and research proposals.',
    amharicDescription: 'የአካዳሚክ ድርሰት (Essay) አጻጻፍ፣ የዋቢ መጽሐፍ አጠቃቀስ (APA/MLA)፣ እና የምርምር ፕሮፖዛል ዝግጅት።',
    chapters: [
      'Chapter 1: Advanced Reading: Critical Thinking and Inferences',
      'Chapter 2: Academic Essay Writing: Expository and Argumentative',
      'Chapter 3: Mechanics of Academic Writing and APA Referencing',
      'Chapter 4: Summary Writing, Paraphrasing and Synthesizing',
      'Chapter 5: Formal Business Letters, CVs and Research Proposals'
    ]
  },
  {
    id: 'freshman_history',
    code: 'Hist 1012',
    title: 'History of Ethiopia and the Horn',
    amharicTitle: 'የኢትዮጵያና የአፍሪካ ቀንድ ታሪክ',
    stream: 'Common',
    semester: 'Semester II',
    subject: 'History',
    creditHours: 3,
    pages: 198,
    fileSizeMb: 4.8,
    rating: 5.0,
    description: 'Historiography, human origins in the Rift Valley, Axumite civilization, Zagwe dynasty, medieval religious dynamics, modern state consolidation, the Battle of Adwa, and 20th-century Ethiopia.',
    amharicDescription: 'የሰው ልጅ አመጣጥ በጥንታዊት ኢትዮጵያ፣ የአክሱምና የላሊበላ ስልጣኔዎች፣ የሀገር ግንባታ ሂደትና የዐድዋ ድል ታሪክ።',
    chapters: [
      'Chapter 1: Introduction to History and Human Evolution in the Horn',
      'Chapter 2: Peoples and Cultures: Language Families and Religious History',
      'Chapter 3: Politics, Economy and Society (Axum, Zagwe & Medieval Period)',
      'Chapter 4: Contact with the Outside World and the Jesuit Mission',
      'Chapter 5: Modern State Formation, Adwa Victory and Independence',
      'Chapter 6: Ethiopia in the 20th Century: Modernization, Revolution & Federalism'
    ]
  },
  {
    id: 'freshman_math_natural',
    code: 'Math 1011',
    title: 'Mathematics (Natural Science Module)',
    amharicTitle: 'የተፈጥሮ ሳይንስ ሂሳብ (ማትሪክስና ካልኩለስ)',
    stream: 'Natural Science',
    semester: 'Semester I',
    subject: 'Mathematics',
    creditHours: 4,
    pages: 245,
    fileSizeMb: 6.2,
    rating: 4.9,
    description: 'Propositional logic, set theory, real and complex number systems, analytical conic sections, limit definitions, continuity theorems, and differential calculus with applied physical modeling.',
    amharicDescription: 'የፕሮፖዚሽናል ሎጂክ፣ የኮምፕሌክስ ቁጥሮች ስሌት፣ ኮኒክ ሴክሽኖች (Parabola, Ellipse) እና የዲፈረንሺያል ካልኩለስ ቀመሮች።',
    chapters: [
      'Chapter 1: Propositional Logic and Set Theory',
      'Chapter 2: The Real and Complex Number Systems',
      'Chapter 3: Functions: Polynomial, Rational, Exponential and Trigonometric',
      'Chapter 4: Analytic Geometry: Conic Sections (Parabola, Ellipse, Hyperbola)',
      'Chapter 5: Limits and Continuity',
      'Chapter 6: Derivatives and Applications of Differential Calculus'
    ]
  },
  {
    id: 'freshman_math_social',
    code: 'Math 1012',
    title: 'Mathematics (Social Science Module)',
    amharicTitle: 'የማህበራዊ ሳይንስ ሂሳብ',
    stream: 'Social Science',
    semester: 'Semester I',
    subject: 'Mathematics',
    creditHours: 3,
    pages: 205,
    fileSizeMb: 4.9,
    rating: 4.8,
    description: 'Logic and sets, systems of linear equations and matrices, mathematics of finance (simple and compound interest, annuities, amortization), business calculus, and descriptive statistics.',
    amharicDescription: 'የማትሪክስ ስሌት፣ የፋይናንስ ሂሳብ (ወለድና አኑዪቲ)፣ ለንግድና ኢኮኖሚክስ የሚውል ካልኩለስ እና መሰረታዊ ስታቲስቲክስ።',
    chapters: [
      'Chapter 1: Logic, Sets and Mathematical Reasoning',
      'Chapter 2: Real Numbers and Algebraic Expressions',
      'Chapter 3: Linear Equations, Matrices and Systems of Inequalities',
      'Chapter 4: Mathematics of Finance: Simple & Compound Interest, Annuities',
      'Chapter 5: Introduction to Differential Calculus for Business & Economics',
      'Chapter 6: Basic Probability and Descriptive Statistics'
    ]
  },
  {
    id: 'freshman_anthropology',
    code: 'Anth 1012',
    title: 'Social Anthropology',
    amharicTitle: 'ማህበራዊ አንትሮፖሎጂ',
    stream: 'Common',
    semester: 'Semester II',
    subject: 'Anthropology',
    creditHours: 3,
    pages: 168,
    fileSizeMb: 3.9,
    rating: 4.9,
    description: 'Sub-fields of anthropology, ethnography, anthropological theories of culture, kinship and descent systems in Ethiopia, marriage rules, religious worldviews, and customary dispute resolution.',
    amharicDescription: 'የባህልና የሰው ዘር ጥናት፣ የዝምድናና ጋብቻ ስርዓቶች በኢትዮጵያ፣ እና ባህላዊ የግጭት አፈታት መንገዶች።',
    chapters: [
      'Chapter 1: Introducing Anthropology and Its Sub-Fields',
      'Chapter 2: Theories and Concepts of Culture',
      'Chapter 3: Human Diversity, Race and Ethnicity',
      'Chapter 4: Kinship, Marriage and Family Systems in Ethiopia',
      'Chapter 5: Religion, Belief Systems and Worldviews',
      'Chapter 6: Indigenous Knowledge Systems and Customary Conflict Resolution'
    ]
  }
];

export default function BookStoreView({
  profile,
  apiKey,
  language,
  onNavigate,
  onStudyAction
}: BookStoreViewProps) {
  // Search & Stream Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState<'all' | 'Common' | 'Natural Science' | 'Social Science' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'title' | 'code' | 'pages'>('code');

  // Favorites state persisted in localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_fav_freshman_modules');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickChime();
    setFavoriteIds(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      safeStorage.setItem('ethiolearn_fav_freshman_modules', JSON.stringify(updated));
      return updated;
    });
  };

  // Filtered & Sorted Modules
  const filteredModules = useMemo(() => {
    return FRESHMAN_MODULES.filter(mod => {
      // Stream Filter
      if (selectedStream === 'favorites') {
        if (!favoriteIds.includes(mod.id)) return false;
      } else if (selectedStream !== 'all' && mod.stream !== selectedStream) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = mod.title.toLowerCase().includes(q);
        const matchCode = mod.code.toLowerCase().includes(q);
        const matchSubject = mod.subject.toLowerCase().includes(q);
        const matchAmharic = mod.amharicTitle.includes(q) || mod.amharicDescription.includes(q);
        const matchDesc = mod.description.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchSubject && !matchAmharic && !matchDesc) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      if (sortBy === 'pages') return b.pages - a.pages;
      return b.rating - a.rating;
    });
  }, [selectedStream, searchQuery, favoriteIds, sortBy]);

  // ---------------------------------------------------------------------------
  // 📖 PURE IN-APP PDF READER MODAL STATE
  // ---------------------------------------------------------------------------
  const [activePdfModule, setActivePdfModule] = useState<FreshmanModule | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [pdfTheme, setPdfTheme] = useState<'paper' | 'dark'>('paper');
  const [pdfSidebarOpen, setPdfSidebarOpen] = useState<boolean>(true);
  const [readerFontSize, setReaderFontSize] = useState<number>(17);
  const [searchInDoc, setSearchInDoc] = useState<string>('');
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(false);
  const [aiMode, setAiMode] = useState<'summary' | 'amharic' | 'quiz' | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const handleOpenPdf = (mod: FreshmanModule, chapterIdx: number = 0) => {
    playClickChime();
    setActivePdfModule(mod);
    setActiveChapterIndex(chapterIdx);
    setSearchInDoc('');
    setAiPanelOpen(false);
    setAiMode(null);
    setQuizAnswers({});
    onStudyAction();
  };

  const handleClosePdf = () => {
    playClickChime();
    setActivePdfModule(null);
  };

  const currentChapterTitle = activePdfModule?.chapters[activeChapterIndex] || 'Chapter 1';
  const currentChapterContent = useMemo(() => {
    if (!activePdfModule) return null;
    return getChapterContent(activePdfModule.id, currentChapterTitle);
  }, [activePdfModule, currentChapterTitle]);

  const handlePrintPdf = () => {
    playClickChime();
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 pb-28 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      
      {/* ========================================================================= */}
      {/* 🏛️ CLEAN & PURE HEADER: ETHIOPIAN FRESHMAN MODULES DIGITAL LIBRARY       */}
      {/* ========================================================================= */}
      <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-[#111C35] border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center shrink-0 shadow-inner">
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">PDF</span>
              <FileText className="w-6 h-6 text-amber-400 mt-0.5" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{language === 'am' ? 'ኦፊሴላዊ የትምህርት ሚኒስቴር ካሪኩለም' : 'Official MoE Curriculum'}</span>
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-amber-400 font-semibold">19 Freshman Modules</span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
                {language === 'am' ? 'የኢትዮጵያ ዩኒቨርሲቲ የፈርስት ኢየር (Freshman) ሞጁሎች' : 'Ethiopian University Freshman Modules'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-3xl">
                {language === 'am'
                  ? 'ለሁሉም የኢትዮጵያ ዩኒቨርሲቲዎች የመጀመሪያ አመት ተማሪዎች የተዘጋጁ 19 ኦፊሴላዊ የፒዲኤፍ (PDF) ሞጁሎች። ያለምንም ውጫዊ ድረ-ገጽ እዚሁ በቀላሉ ያንብቡ።'
                  : 'Official Ministry of Education (MoE) curriculum modules for first-year Ethiopian university students. Pure, clean, self-contained PDF reader.'}
              </p>
            </div>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0 bg-[#17233D] px-3.5 py-2 rounded-xl border border-slate-700/60 text-xs font-semibold text-slate-200">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>{filteredModules.length} {language === 'am' ? 'ሞጁሎች ይገኛሉ' : 'Modules Available'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔍 SEARCH & STREAM SELECTOR                                               */}
      {/* ========================================================================= */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'am' ? 'በሞጁል ርዕስ ወይም ኮድ ይፈልጉ (ለምሳሌ፡ Phil 1011, Math, History...)' : 'Search by module title, course code (e.g. Phil 1011, Math, Econ)...'}
              className="w-full pl-10 pr-10 py-3 bg-[#111C35] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10 transition-all shadow-inner"
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

          {/* Sort Selector */}
          <div className="flex items-center bg-[#111C35] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 shrink-0">
            <span className="text-slate-400 mr-2">{language === 'am' ? 'ቅደም ተከተል:' : 'Sort:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-amber-400 font-bold outline-none cursor-pointer pr-1"
            >
              <option value="code" className="bg-[#111C35] text-white">Course Code</option>
              <option value="title" className="bg-[#111C35] text-white">A-Z Title</option>
              <option value="pages" className="bg-[#111C35] text-white">Page Count</option>
              <option value="rating" className="bg-[#111C35] text-white">★ Top Rated</option>
            </select>
          </div>
        </div>

        {/* Stream Filter Chips: Clean & Pure */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: language === 'am' ? 'ሁሉም ሞጁሎች (19)' : 'All Freshman (19)', icon: '📚' },
            { id: 'Common', label: language === 'am' ? 'የጋራ ኮርሶች (Common)' : 'Common Courses', icon: '🏛️' },
            { id: 'Natural Science', label: language === 'am' ? 'የተፈጥሮ ሳይንስ (Natural)' : 'Natural Science', icon: '🔬' },
            { id: 'Social Science', label: language === 'am' ? 'የማህበራዊ ሳይንስ (Social)' : 'Social Science', icon: '⚖️' },
            { id: 'favorites', label: language === 'am' ? 'የተወደዱ' : 'Favorites', icon: '⭐' }
          ].map(tab => {
            const isActive = selectedStream === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { playClickChime(); setSelectedStream(tab.id as any); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-[#111C35] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'favorites' && favoriteIds.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-black/20 text-slate-950 font-bold' : 'bg-amber-500/20 text-amber-400'}`}>
                    {favoriteIds.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📄 PDF-STYLE MODULE CARDS GRID                                            */}
      {/* ========================================================================= */}
      {filteredModules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111C35] border border-slate-800 space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {language === 'am' ? 'ምንም ሞጁል አልተገኘም' : 'No modules found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {language === 'am'
              ? 'እባክዎን የፍለጋ ቃሉን ወይም የተመረጠውን ዘርፍ ይቀይሩ።'
              : 'Try adjusting your search query or selecting a different stream filter.'}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedStream('all'); }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {language === 'am' ? 'ሁሉንም አሳይ' : 'Show All Modules'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map(mod => {
            const isFav = favoriteIds.includes(mod.id);

            return (
              <div
                key={mod.id}
                onClick={() => handleOpenPdf(mod)}
                className="group relative p-4 rounded-2xl bg-[#111C35] border border-slate-800/90 hover:border-amber-400/40 hover:bg-[#14213F] transition-all flex flex-col justify-between gap-3 text-left cursor-pointer shadow-md hover:shadow-lg"
              >
                {/* Top: PDF Document Cover + Details */}
                <div className="flex items-start gap-3.5">
                  {/* Authentic PDF Document Cover Thumbnail */}
                  <div className="w-16 h-22 sm:w-18 sm:h-24 rounded-lg bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-slate-700/80 p-2 flex flex-col justify-between items-center shrink-0 shadow-md group-hover:border-amber-400/60 transition-colors relative overflow-hidden select-none">
                    {/* Top PDF Crimson Tag */}
                    <div className="w-full flex items-center justify-between">
                      <span className="px-1 py-0.5 rounded text-[8px] font-black bg-red-600 text-white tracking-wider uppercase">
                        PDF
                      </span>
                      <span className="text-[8px] font-mono text-slate-400">
                        {mod.creditHours} Cr
                      </span>
                    </div>

                    {/* Emblem / Icon */}
                    <div className="my-auto text-center">
                      <FileText className="w-6 h-6 text-amber-400 mx-auto opacity-90 group-hover:scale-110 transition-transform" />
                      <span className="text-[7.5px] font-bold text-slate-300 block truncate max-w-[60px] text-center mt-0.5">
                        {mod.code}
                      </span>
                    </div>

                    {/* Bottom Document Page indicator */}
                    <div className="w-full border-t border-slate-700/60 pt-0.5 text-center">
                      <span className="text-[7px] text-slate-400 font-mono">
                        {mod.pages} pgs
                      </span>
                    </div>
                  </div>

                  {/* Module Metadata & Title */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wide truncate">
                        {mod.code} • {mod.stream}
                      </span>
                      <button
                        onClick={(e) => toggleFavorite(mod.id, e)}
                        className="text-slate-400 hover:text-amber-400 p-1 cursor-pointer shrink-0 transition-colors"
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                      {mod.title}
                    </h3>

                    <p className="text-xs text-slate-400 truncate font-medium">
                      {mod.amharicTitle}
                    </p>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed pt-0.5">
                      {language === 'am' ? mod.amharicDescription : mod.description}
                    </p>
                  </div>
                </div>

                {/* Chapters Preview Strip */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{mod.chapters.length} {language === 'am' ? 'ምዕራፎች' : 'Units'}</span>
                    <span>{mod.pages} {language === 'am' ? 'ገጾች' : 'Pages'}</span>
                    <span className="text-slate-400 font-mono">{mod.fileSizeMb} MB</span>
                  </div>
                  
                  {/* Subtle Chapter 1 Kicker */}
                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="truncate">{mod.chapters[0]}</span>
                  </div>
                </div>

                {/* Primary Action Button: Read PDF Module */}
                <button
                  onClick={() => handleOpenPdf(mod)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm"
                >
                  <FileText className="w-4 h-4 text-slate-950" />
                  <span>{language === 'am' ? 'ፒዲኤፍ ሞጁሉን አንብብ' : 'Read PDF Module'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📖 FULLSCREEN IN-APP PDF READER MODAL                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activePdfModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-0 md:p-3 select-none"
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className={`w-full h-full md:max-w-7xl md:h-[96vh] rounded-none md:rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors duration-200 ${
                pdfTheme === 'paper' 
                  ? 'bg-[#0E1628] text-slate-900 border-white/10'
                  : 'bg-[#0A1128] text-slate-100 border-white/10'
              }`}
            >
              {/* 1. TOP PDF TOOLBAR */}
              <div className="px-4 py-3 bg-[#0B132B] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 text-slate-200">
                {/* Left: Document Identity & Code */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                        {activePdfModule.code}
                      </span>
                      <span className="text-xs text-slate-400 font-bold truncate">
                        {activePdfModule.stream} • {activePdfModule.creditHours} Cr
                      </span>
                    </div>
                    <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                      {activePdfModule.title} — MoE University Module
                    </h2>
                  </div>
                </div>

                {/* Center: Page Controls (Previous / Current / Next) */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-2 py-1 gap-1 text-xs">
                  <button
                    onClick={() => {
                      if (activeChapterIndex > 0) {
                        playClickChime();
                        setActiveChapterIndex(p => p - 1);
                      }
                    }}
                    disabled={activeChapterIndex === 0}
                    className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Previous Unit"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-mono text-xs px-2 text-amber-400 font-bold">
                    Unit {activeChapterIndex + 1} of {activePdfModule.chapters.length}
                  </span>

                  <button
                    onClick={() => {
                      if (activeChapterIndex < activePdfModule.chapters.length - 1) {
                        playClickChime();
                        setActiveChapterIndex(p => p + 1);
                      }
                    }}
                    disabled={activeChapterIndex === activePdfModule.chapters.length - 1}
                    className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Next Unit"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Right: PDF Reader Tools (Zoom, Theme, Font, Print, Close) */}
                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="hidden sm:flex items-center bg-white/5 border border-white/10 px-2 py-1 rounded-xl gap-1 text-xs">
                    <button
                      onClick={() => { playClickChime(); setPdfZoom(z => Math.max(80, z - 10)); }}
                      className="p-1 hover:text-amber-400 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[11px] text-slate-300 w-10 text-center">{pdfZoom}%</span>
                    <button
                      onClick={() => { playClickChime(); setPdfZoom(z => Math.min(130, z + 10)); }}
                      className="p-1 hover:text-amber-400 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Paper White vs Dark Slate PDF Mode */}
                  <button
                    onClick={() => {
                      playClickChime();
                      setPdfTheme(t => t === 'paper' ? 'dark' : 'paper');
                    }}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                      pdfTheme === 'paper'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-white/5 text-slate-300 border-white/10'
                    }`}
                    title={pdfTheme === 'paper' ? 'Switch to Dark PDF' : 'Switch to Paper White PDF'}
                  >
                    {pdfTheme === 'paper' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline font-bold">
                      {pdfTheme === 'paper' ? 'Paper PDF' : 'Dark PDF'}
                    </span>
                  </button>

                  {/* Print Document */}
                  <button
                    onClick={handlePrintPdf}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                    title={language === 'am' ? 'ሞጁሉን አትም / Print' : 'Print Module PDF'}
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Ask AI Asgobnyi Button */}
                  <button
                    onClick={() => { playClickChime(); setAiPanelOpen(o => !o); }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      aiPanelOpen 
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{language === 'am' ? 'አስጎብኚ AI' : 'Asgobnyi AI'}</span>
                  </button>

                  {/* Close PDF Reader */}
                  <button
                    onClick={handleClosePdf}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer ml-1"
                    title="Close PDF"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 2. PDF VIEWER MAIN STAGE (TOC Sidebar + Paper PDF Page View + AI Assistant) */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
                
                {/* 2.1 PDF OUTLINE / TABLE OF CONTENTS (Left Drawer - 3 Cols) */}
                {pdfSidebarOpen && (
                  <div className="lg:col-span-3 border-r border-white/10 bg-[#0B132B]/95 p-4 overflow-y-auto space-y-3 hidden lg:block text-slate-200">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                        <span>{language === 'am' ? 'የይዘት ማውጫ' : 'Module Outline'}</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {activePdfModule.chapters.length} Units
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {activePdfModule.chapters.map((ch, idx) => {
                        const isSelected = activeChapterIndex === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              playClickChime();
                              setActiveChapterIndex(idx);
                              setAiMode(null);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold leading-relaxed transition-all cursor-pointer flex items-start gap-2 border ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                            }`}
                          >
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 ${
                              isSelected ? 'bg-black/20 text-slate-950 font-black' : 'bg-white/10 text-slate-400'
                            }`}>
                              Unit {idx + 1}
                            </span>
                            <span className="flex-1 line-clamp-2">{ch}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Official Module Meta Info Card */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                      <div className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                        Official Academic Metadata
                      </div>
                      <div className="text-slate-300 space-y-1 text-[11px]">
                        <div><strong>Code:</strong> {activePdfModule.code}</div>
                        <div><strong>Credit Hours:</strong> {activePdfModule.creditHours}</div>
                        <div><strong>Semester:</strong> {activePdfModule.semester}</div>
                        <div><strong>Target:</strong> First Year Students (Freshman)</div>
                        <div><strong>Publisher:</strong> MoE Ethiopia / Higher Education</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2.2 CENTER PDF PAGE CANVAS */}
                <div className={`${
                  aiPanelOpen ? (pdfSidebarOpen ? 'lg:col-span-6' : 'lg:col-span-8') : (pdfSidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12')
                } overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center transition-all bg-[#070D1E]`}>
                  
                  {/* REALISTIC A4-STYLE PDF DOCUMENT SHEET */}
                  <div 
                    className={`w-full max-w-3xl rounded-xl shadow-2xl p-6 sm:p-10 transition-all ${
                      pdfTheme === 'paper' 
                        ? 'bg-[#FAFAF9] text-slate-900 border border-stone-300 shadow-stone-900/30' 
                        : 'bg-[#101A33] text-slate-100 border border-slate-700/80 shadow-black/50'
                    }`}
                    style={{
                      transform: `scale(${pdfZoom / 100})`,
                      transformOrigin: 'top center',
                      fontSize: `${readerFontSize}px`,
                      lineHeight: 1.65
                    }}
                  >
                    {/* OFFICIAL MOE ETHIOPIA HEADER BANNER */}
                    <div className="border-b-2 border-stone-800/20 pb-4 mb-6 text-center space-y-1">
                      <div className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase font-extrabold text-amber-600 dark:text-amber-400">
                        Federal Democratic Republic of Ethiopia • Ministry of Education
                      </div>
                      <div className="text-xs sm:text-sm font-serif font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        Higher Education Common Curriculum For First Year Students
                      </div>
                      <div className="inline-flex items-center gap-2 mt-1 px-3 py-0.5 rounded-full bg-stone-200/80 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <span>Course: {activePdfModule.title}</span>
                        <span>•</span>
                        <span>Course Code: {activePdfModule.code}</span>
                      </div>
                    </div>

                    {/* CHAPTER TITLE & COMPETENCIES */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
                        <span>Unit {activeChapterIndex + 1} of {activePdfModule.chapters.length}</span>
                        <span>Credit Hours: {activePdfModule.creditHours}</span>
                      </div>

                      <h1 className="text-xl sm:text-2xl font-serif font-black text-slate-900 dark:text-white leading-tight">
                        {currentChapterContent?.title || currentChapterTitle}
                      </h1>

                      {/* Intro Abstract Box */}
                      <div className="p-4 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-300/80 dark:border-white/10 italic text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                        {currentChapterContent?.intro}
                      </div>
                    </div>

                    {/* CHAPTER CONTENT SECTIONS */}
                    <div className="space-y-6">
                      {currentChapterContent?.sections.map((sec, idx) => (
                        <div key={idx} className="space-y-2">
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-amber-300 border-l-3 border-amber-500 pl-3">
                            {sec.title}
                          </h2>
                          <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                            {sec.body}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* FORMULAS & COMPUTATIONS (if applicable) */}
                    {currentChapterContent?.formulas && currentChapterContent.formulas.length > 0 && (
                      <div className="my-6 p-4 rounded-xl bg-stone-100 dark:bg-black/50 border border-stone-300 dark:border-amber-500/30 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <span>🧮</span>
                          <span>{language === 'am' ? 'ቀመሮችና ህጎች' : 'Core Mathematical & Scientific Formulas'}</span>
                        </div>
                        <div className="space-y-2.5">
                          {currentChapterContent.formulas.map((f, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-white/5 border border-stone-200 dark:border-white/5 space-y-1">
                              <div className="font-bold text-xs text-slate-900 dark:text-white">{f.name}</div>
                              <div className="p-2 rounded bg-stone-900 text-amber-300 font-mono text-xs overflow-x-auto">
                                {f.formula}
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400">{f.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* KEY TERMINOLOGY & BILINGUAL AMHARIC GLOSSARY */}
                    {currentChapterContent?.keyTerms && currentChapterContent.keyTerms.length > 0 && (
                      <div className="my-6 p-4 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-300/80 dark:border-white/10 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>📖</span>
                          <span>{language === 'am' ? 'ቁልፍ ቃላትና ፍቺዎች' : 'Essential Academic Terminology & Definitions'}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentChapterContent.keyTerms.map((t, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-stone-200 dark:border-white/5 space-y-0.5">
                              <div className="font-bold text-xs text-amber-700 dark:text-amber-400">
                                {t.term} {t.amharic ? `(${t.amharic})` : ''}
                              </div>
                              <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                                {t.definition}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EXAM ALERT BOX */}
                    {currentChapterContent?.examAlert && (
                      <div className="my-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm leading-relaxed">
                        <strong className="block font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                          ⚠️ University Mid-Term / Final Exam Guidance:
                        </strong>
                        {currentChapterContent.examAlert}
                      </div>
                    )}

                    {/* OFFICIAL PDF FOOTER */}
                    <div className="border-t border-stone-300 dark:border-white/10 pt-4 mt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 gap-2">
                      <span>Federal Democratic Republic of Ethiopia — Ministry of Education</span>
                      <span className="font-mono font-bold">
                        Unit {activeChapterIndex + 1} • {activePdfModule.code} Module
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2.3 RIGHT SIDEBAR: ASGOBNYI AI STUDY COMPANION */}
                {aiPanelOpen && (
                  <div className="lg:col-span-3 border-l border-white/10 bg-[#0B132B]/95 p-4 overflow-y-auto space-y-4 text-slate-200">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          {language === 'am' ? 'አስጎብኚ AI' : 'Asgobnyi AI'}
                        </h4>
                      </div>
                      <button
                        onClick={() => setAiPanelOpen(false)}
                        className="text-slate-400 hover:text-white p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-300">
                        {language === 'am'
                          ? 'የዚህን ምዕራፍ ማጠቃለያ፣ በአማርኛ ማብራሪያ ወይም የፈተና ጥያቄዎችን ይፈትሹ፦'
                          : 'Explore chapter summary, Amharic translations, or test yourself with an instant practice quiz:'}
                      </p>

                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => { playClickChime(); setAiMode('summary'); }}
                          className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-colors cursor-pointer flex items-center justify-between ${
                            aiMode === 'summary' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                          }`}
                        >
                          <span>📖 {language === 'am' ? 'የምዕራፉ ዋና ማጠቃለያ' : 'Chapter Summary'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => { playClickChime(); setAiMode('amharic'); }}
                          className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-colors cursor-pointer flex items-center justify-between ${
                            aiMode === 'amharic' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                          }`}
                        >
                          <span>🇪🇹 {language === 'am' ? 'በአማርኛ ማብራሪያ' : 'Amharic Concept Guide'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => { playClickChime(); setAiMode('quiz'); }}
                          className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-colors cursor-pointer flex items-center justify-between ${
                            aiMode === 'quiz' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                          }`}
                        >
                          <span>📝 {language === 'am' ? 'የልምምድ ፈተና (Quiz)' : '3-Question Practice Quiz'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* AI Response Box */}
                    {aiMode === 'summary' && (
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                        <div className="font-bold text-amber-400">Core Takeaways: {currentChapterTitle}</div>
                        <p className="text-slate-300 leading-relaxed">
                          {currentChapterContent?.intro}
                        </p>
                        <div className="pt-2 border-t border-white/5 space-y-1">
                          {currentChapterContent?.sections.map((s, idx) => (
                            <div key={idx} className="text-slate-300">
                              • <strong className="text-white">{s.title}:</strong> {s.body.slice(0, 110)}...
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiMode === 'amharic' && (
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs leading-relaxed">
                        <div className="font-bold text-amber-400">የአማርኛ ማጠቃለያ ማስታወሻ</div>
                        <p className="text-slate-300">
                          {activePdfModule.amharicDescription}
                        </p>
                        <div className="pt-2 border-t border-white/5 space-y-1.5">
                          {currentChapterContent?.keyTerms.slice(0, 4).map((k, i) => (
                            <div key={i} className="text-slate-200">
                              <span className="text-amber-300 font-bold">{k.term} ({k.amharic || 'ፍቺ'}):</span> {k.definition}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiMode === 'quiz' && (
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3 text-xs">
                        <div className="font-bold text-amber-400">Practice Question:</div>
                        <div className="space-y-1.5 text-slate-200">
                          <p className="font-medium">
                            1. In the official Ethiopian university syllabus for {activePdfModule.code}, what is primary in "{currentChapterTitle}"?
                          </p>
                          <div className="space-y-1 pt-1">
                            {[
                              `Understanding the core principles of: ${currentChapterContent?.sections[0]?.title || 'Section 1'}`,
                              'Memorizing random terms without applying them to exam cases',
                              'Ignoring definitions and focusing only on informal rumors'
                            ].map((opt, i) => {
                              const isSelected = quizAnswers[1] === i;
                              const isCorrect = i === 0;
                              return (
                                <button
                                  key={i}
                                  onClick={() => {
                                    playClickChime();
                                    setQuizAnswers(prev => ({ ...prev, 1: i }));
                                  }}
                                  className={`w-full text-left p-2 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                                    isSelected
                                      ? isCorrect
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                        : 'bg-red-500/20 text-red-300 border-red-500/40'
                                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {quizAnswers[1] !== undefined && (
                            <div className="text-[11px] text-amber-300 pt-1 font-medium">
                              {quizAnswers[1] === 0 ? '✅ Correct! Verified syllabus standard.' : '❌ Try again. Review Section 1 of this unit.'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
