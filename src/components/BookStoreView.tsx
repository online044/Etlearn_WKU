/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Search, Star, Bookmark, BookOpen, ChevronRight, ChevronLeft,
  X, Check, Bot, Sparkles, Printer, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Download, Moon, Sun, Layers, HelpCircle, CheckCircle2, RotateCcw, Share2,
  ExternalLink, Folder, CloudDownload, Eye, ShieldCheck, LayoutGrid, List, RefreshCw
} from 'lucide-react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime } from '../utils/audio';
import { getChapterContent } from '../data/textbookChapterContent';
import { safeStorage } from '../utils/safeStorage';
import { fetchSupabaseBooks } from '../utils/supabaseClient';

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

// ─── THEMATIC ACADEMIC COVER IMAGES (Curated Fallbacks) ───
export const THEMATIC_BOOK_COVERS: Record<string, string> = {
  physics: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&q=80',
  mathematics: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80',
  math: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80',
  chemistry: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80',
  biology: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=80',
  history: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&q=80',
  geography: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80',
  fitness: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
  economics: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&q=80',
  emerging: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80',
  it: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80',
  technology: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80',
  entrepreneurship: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
  business: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
  anthropology: 'https://images.unsplash.com/photo-1528372444006-1bc09c6c2b18?w=600&q=80',
  trends: 'https://images.unsplash.com/photo-1544380904-c686aad2fc40?w=600&q=80',
  global: 'https://images.unsplash.com/photo-1544380904-c686aad2fc40?w=600&q=80',
  logic: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=600&q=80',
  critical: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=600&q=80',
  psychology: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
  inclusiveness: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&q=80',
  english: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80',
  civics: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80'
};

export function resolveBookCover(book: { cover_url?: string | null; pdf_url?: string | null; subject?: string; title?: string }): string {
  if (book.cover_url && typeof book.cover_url === 'string' && book.cover_url.trim().length > 0) {
    const raw = book.cover_url.trim().replace(/^['"]+|['"]+$/g, '');

    // Convert Google Drive thumbnail or preview link to high-performance direct CDN image
    const driveMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/) || raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w600-h800`;
    }
    return raw;
  }

  // If cover_url is not set, derive directly from pdf_url Google Drive file ID
  if (book.pdf_url && typeof book.pdf_url === 'string') {
    const idMatch = book.pdf_url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || book.pdf_url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}=w600-h800`;
    }
  }

  const text = `${book.subject || ''} ${book.title || ''}`.toLowerCase();
  for (const [key, url] of Object.entries(THEMATIC_BOOK_COVERS)) {
    if (text.includes(key)) {
      return url;
    }
  }
  return 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&q=80';
}

export function getBookPdfLinks(rawUrl?: string) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      pdfUrl: '',
      previewUrl: '',
      downloadUrl: '',
      isDrive: false
    };
  }

  const clean = rawUrl.trim();
  const idMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/) || clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    const fileId = idMatch[1];
    return {
      pdfUrl: clean,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      isDrive: true,
      fileId
    };
  }

  if (clean.includes('drive.google.com/drive/folders/')) {
    return {
      pdfUrl: clean,
      previewUrl: clean,
      downloadUrl: clean,
      isDrive: true
    };
  }

  return {
    pdfUrl: clean,
    previewUrl: clean,
    downloadUrl: clean,
    isDrive: false
  };
}

export interface UnifiedBookItem {
  id: string;
  code: string;
  title: string;
  amharicTitle: string;
  subject: string;
  grade: string;
  stream: 'Common' | 'Natural Science' | 'Social Science';
  semester: 'Semester I' | 'Semester II';
  coverUrl: string;
  pdfUrl: string;
  previewUrl: string;
  downloadUrl: string;
  description: string;
  amharicDescription: string;
  chapters: string[];
  pages: number;
  creditHours: number;
  fileSizeMb: number;
  rating: number;
  isDrive: boolean;
  isFromSupabase: boolean;
  originalModule?: FreshmanModule;
}

// ─── GOOGLE DRIVE REPOSITORY INTEGRATION ───
export const GOOGLE_DRIVE_FOLDER_ID = '1k7l9mQ0nFUnUIn7CrJwqERAUG0UeVsAF';
export const GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1k7l9mQ0nFUnUIn7CrJwqERAUG0UeVsAF?usp=sharing';

export function getGoogleDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getGoogleDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

export function getGoogleDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
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
  googleDriveFileId?: string;
  googleDriveFileName?: string;
  googleDriveAltFileId?: string;
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
    googleDriveFileId: '124Fl_yC-lWM4JiKuFwMItJUDJM5NmV9F',
    googleDriveFileName: 'CRITICAL THINKING module.pdf',
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
    googleDriveFileId: '1nTlrUtAVzOSOsoeG4AX883sVlIxkfDrz',
    googleDriveFileName: 'ECONOMICS module.pdf',
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
    googleDriveFileId: '1sqKFF2o8ORHOnoF9VRy4x5hgY7lp-Uub',
    googleDriveFileName: 'EMERGING TECHNOLOGIES module.pdf',
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
    googleDriveFileId: '14DKK75SxkylV4sLdaYTu_6dj7Y1nXKWu',
    googleDriveFileName: 'ENTREPRENEURSHIP module.pdf',
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
    googleDriveFileId: '1On4zzWIFDWypb7kU-HMTOmx6SRwp-K7Q',
    googleDriveFileName: 'GENERAL BIOLOGY module.pdf',
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
    googleDriveFileId: '1gm0FrHxIQhxto8pfrf0Fy8NnHLDAdU0S',
    googleDriveFileName: 'GENERAL CHEMISTRY module.pdf',
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
    title: 'General Physics',
    amharicTitle: 'አጠቃላይ ፊዚክስ',
    stream: 'Natural Science',
    semester: 'Semester I',
    subject: 'Physics',
    creditHours: 3,
    pages: 232,
    fileSizeMb: 5.8,
    rating: 4.9,
    googleDriveFileId: '1JUJ1wclP4yNyyv1bb8kNXOsfHDKvJqXJ',
    googleDriveFileName: 'GENERAL PHYSICS module.pdf',
    googleDriveAltFileId: '1cLpYcabSSWrtOp6zAS5ZL2b1NtD9nAem',
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
    googleDriveFileId: '1FAVXFQheYxYKFh_PI2RkcW31HZa-SdTm',
    googleDriveFileName: 'GENERAL PYSYCHOLOGY module.pdf',
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
    title: 'Geography of Ethiopia and the Horn',
    amharicTitle: 'የኢትዮጵያና የአፍሪካ ቀንድ ጂኦግራፊ',
    stream: 'Common',
    semester: 'Semester I',
    subject: 'Geography',
    creditHours: 3,
    pages: 188,
    fileSizeMb: 4.6,
    rating: 4.8,
    googleDriveFileId: '1gJJgwSipt30xDslO7JAvMMWz2QNVMtHN',
    googleDriveFileName: 'Geography Module.pdf',
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
    googleDriveFileId: '1t4g5MyBhPhXRsXPXA01Zc6GfxAB9LVAq',
    googleDriveFileName: 'GLOBAL TRENDS module.pdf',
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
    googleDriveFileId: '1hWYVvjJB3LkndfAlbGJDtlVBzmBgkY3i',
    googleDriveFileName: 'INCLUSIVENESS Module.pdf',
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
    googleDriveFileId: '1irrsbxQWb2ZbTscmXp0hF9qzgDrZCQoV',
    googleDriveFileName: 'MORAL and CIVIC module.pdf',
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
    googleDriveFileId: '18MIM7eTALuYt3NoRD7UeaS0mFeKcQTKg',
    googleDriveFileName: 'PHYSICAL FITNESS module.pdf',
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
    title: 'Communicative English Language Skills I',
    amharicTitle: 'ተግባቦታዊ የእንግሊዝኛ ቋንቋ ክህሎት ፩',
    stream: 'Common',
    semester: 'Semester I',
    subject: 'Languages',
    creditHours: 3,
    pages: 135,
    fileSizeMb: 3.3,
    rating: 4.9,
    googleDriveFileId: '1Jq2IhWPcEoXg9If7sDlP8caqwqcjfNDk',
    googleDriveFileName: 'Communicative English Language Skills I (FLEn 1011).pdf',
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
    googleDriveFileId: '1Ih7e_MhTWbKk9Gw-UaW1Cbs_J47cyOZp',
    googleDriveFileName: 'Communicative_English_Language_Skills_II.pdf',
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
    googleDriveFileId: '1kM_myBDzTTw9gt76uhhEzCdlpJXrMIZD',
    googleDriveFileName: 'History of Ethiopian and the Horn October 2022 Final Omotic revised and final_compressed.pdf',
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
    googleDriveFileId: '1JvIpwqFCHhcme03f_MFOH7hG2x4zV9JP',
    googleDriveFileName: 'MATHEMATICS NATURAL SCIENCE MODULE_compressed.pdf',
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
    googleDriveFileId: '1r--ekd2ZqN5eKuRInRh7geVCVso1FrNr',
    googleDriveFileName: 'MATHEMATICS SOCIAL SCIENCE MODULE_compressed.pdf',
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
    googleDriveFileId: '1ZFRYrwL3hrd5jT_rtwvHXq7240qhbCtM',
    googleDriveFileName: 'Social Antropology_compressed.pdf',
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
  onStudyAction,
  books,
  supabaseBooks = [],
  onOpenInAppViewer
}: BookStoreViewProps) {
  // Live Supabase Books state
  const [supabaseList, setSupabaseList] = useState<any[]>(supabaseBooks || []);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [viewMode, setViewMode] = useState<'covers' | 'list'>('covers');

  // Search & Stream Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState<'all' | 'Common' | 'Natural Science' | 'Social Science' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'title' | 'code' | 'pages'>('code');

  // Load books from Supabase if prop was empty or on manual sync
  const loadSupabaseBooks = async () => {
    setIsSyncingSupabase(true);
    playClickChime();
    try {
      const data = await fetchSupabaseBooks();
      if (data && data.length > 0) {
        setSupabaseList(data);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        playSuccessChime();
      }
    } catch (err) {
      console.warn('Failed to load books from Supabase:', err);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  useEffect(() => {
    if (supabaseBooks && supabaseBooks.length > 0) {
      setSupabaseList(supabaseBooks);
    } else {
      loadSupabaseBooks();
    }
  }, [supabaseBooks]);

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

  // ─── UNIFIED BOOKS REPOSITORY (Supabase Live Table + Curriculum Metadata) ───
  const unifiedBooks = useMemo(() => {
    const list: UnifiedBookItem[] = [];
    const matchedModuleIds = new Set<string>();

    // 1. Process all books from Supabase table first
    (supabaseList || []).forEach((sbBook) => {
      const sbTitle = (sbBook.title || '').trim();
      const sbSubject = (sbBook.subject || '').trim();
      const normTitle = sbTitle.toLowerCase();
      const normSub = sbSubject.toLowerCase();

      // Find matching curriculum module for chapters and rich metadata
      const match = FRESHMAN_MODULES.find(m => {
        const mTitle = m.title.toLowerCase();
        const mSub = m.subject.toLowerCase();
        return (
          mTitle === normTitle ||
          mTitle.includes(normTitle) ||
          normTitle.includes(mTitle) ||
          mSub.includes(normSub) ||
          normSub.includes(mSub)
        );
      });

      if (match) {
        matchedModuleIds.add(match.id);
      }

      const pdfLinks = getBookPdfLinks(
        sbBook.pdf_url || (match?.googleDriveFileId ? `https://drive.google.com/uc?export=download&id=${match.googleDriveFileId}` : '')
      );

      const coverUrl = resolveBookCover({
        cover_url: sbBook.cover_url,
        pdf_url: sbBook.pdf_url || (match?.googleDriveFileId ? `https://drive.google.com/uc?export=download&id=${match.googleDriveFileId}` : ''),
        subject: sbSubject || match?.subject,
        title: sbTitle || match?.title
      });

      list.push({
        id: sbBook.id || match?.id || `sb_${Math.random()}`,
        code: match?.code || (sbSubject ? `${sbSubject.slice(0, 4).toUpperCase()} 1011` : 'MOD 1011'),
        title: sbTitle || match?.title || 'University Textbook',
        amharicTitle: match?.amharicTitle || (language === 'am' ? 'የዩኒቨርሲቲ ሞጁል' : ''),
        subject: sbSubject || match?.subject || 'University Curriculum',
        grade: sbBook.grade || 'Freshman',
        stream: match?.stream || (normSub.includes('phys') || normSub.includes('chem') || normSub.includes('bio') || normSub.includes('math') ? 'Natural Science' : normSub.includes('soc') || normSub.includes('econ') || normSub.includes('hist') || normSub.includes('anth') ? 'Social Science' : 'Common'),
        semester: match?.semester || 'Semester I',
        coverUrl,
        pdfUrl: pdfLinks.pdfUrl,
        previewUrl: pdfLinks.previewUrl,
        downloadUrl: pdfLinks.downloadUrl,
        description: sbBook.description || match?.description || 'Official Ethiopian higher education university curriculum module textbook.',
        amharicDescription: match?.amharicDescription || 'ኦፊሴላዊ የኢትዮጵያ ከፍተኛ ትምህርት ተቋማት የመጀመሪያ ዓመት ካሪኩለም መማሪያ መጽሐፍ።',
        chapters: match?.chapters || ['Unit 1: Fundamentals & Scope', 'Unit 2: Theoretical Foundations', 'Unit 3: Applied Principles & Analysis', 'Unit 4: Review, Problems & Assessment'],
        pages: match?.pages || 160,
        creditHours: match?.creditHours || 3,
        fileSizeMb: match?.fileSizeMb || 4.2,
        rating: match?.rating || 4.9,
        isDrive: pdfLinks.isDrive,
        isFromSupabase: true,
        originalModule: match
      });
    });

    // 2. Append any curriculum modules that were not in Supabase yet
    FRESHMAN_MODULES.forEach(mod => {
      if (!matchedModuleIds.has(mod.id)) {
        const pdfLinks = getBookPdfLinks(
          mod.googleDriveFileId ? `https://drive.google.com/uc?export=download&id=${mod.googleDriveFileId}` : ''
        );
        const coverUrl = resolveBookCover({
          cover_url: null,
          pdf_url: mod.googleDriveFileId ? `https://drive.google.com/uc?export=download&id=${mod.googleDriveFileId}` : '',
          subject: mod.subject,
          title: mod.title
        });

        list.push({
          id: mod.id,
          code: mod.code,
          title: mod.title,
          amharicTitle: mod.amharicTitle,
          subject: mod.subject,
          grade: 'Freshman',
          stream: mod.stream,
          semester: mod.semester,
          coverUrl,
          pdfUrl: pdfLinks.pdfUrl,
          previewUrl: pdfLinks.previewUrl,
          downloadUrl: pdfLinks.downloadUrl,
          description: mod.description,
          amharicDescription: mod.amharicDescription,
          chapters: mod.chapters,
          pages: mod.pages,
          creditHours: mod.creditHours,
          fileSizeMb: mod.fileSizeMb,
          rating: mod.rating,
          isDrive: pdfLinks.isDrive,
          isFromSupabase: false,
          originalModule: mod
        });
      }
    });

    return list;
  }, [supabaseList, language]);

  // Filtered & Sorted Modules
  const filteredBooks = useMemo(() => {
    return unifiedBooks.filter(book => {
      // Stream Filter
      if (selectedStream === 'favorites') {
        if (!favoriteIds.includes(book.id)) return false;
      } else if (selectedStream !== 'all' && book.stream !== selectedStream) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = book.title.toLowerCase().includes(q);
        const matchCode = book.code.toLowerCase().includes(q);
        const matchSubject = book.subject.toLowerCase().includes(q);
        const matchAmharic = (book.amharicTitle && book.amharicTitle.includes(q)) || (book.amharicDescription && book.amharicDescription.includes(q));
        const matchDesc = book.description.toLowerCase().includes(q);
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
  }, [unifiedBooks, selectedStream, searchQuery, favoriteIds, sortBy]);

  // ---------------------------------------------------------------------------
  // 📖 PURE IN-APP PDF READER MODAL STATE
  // ---------------------------------------------------------------------------
  const [activePdfBook, setActivePdfBook] = useState<UnifiedBookItem | null>(null);
  const [coverModalBook, setCoverModalBook] = useState<UnifiedBookItem | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [pdfTheme, setPdfTheme] = useState<'paper' | 'dark'>('paper');
  const [pdfSidebarOpen, setPdfSidebarOpen] = useState<boolean>(true);
  const [readerFontSize, setReaderFontSize] = useState<number>(17);
  const [searchInDoc, setSearchInDoc] = useState<string>('');
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(false);
  const [aiMode, setAiMode] = useState<'summary' | 'amharic' | 'quiz' | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [readerTab, setReaderTab] = useState<'cover' | 'drive' | 'notes'>('cover');

  const activePdfModule = activePdfBook;

  const handleOpenBook = (book: UnifiedBookItem, chapterIdx: number = 0, defaultTab: 'cover' | 'drive' | 'notes' = 'cover') => {
    playClickChime();
    setActivePdfBook(book);
    setActiveChapterIndex(chapterIdx);
    setReaderTab(defaultTab);
    setSearchInDoc('');
    setAiPanelOpen(false);
    setAiMode(null);
    setQuizAnswers({});
    onStudyAction();
  };

  const handleCloseBook = () => {
    playClickChime();
    setActivePdfBook(null);
  };
  const handleClosePdf = handleCloseBook;

  const currentChapterTitle = activePdfBook?.chapters[activeChapterIndex] || 'Chapter 1';
  const currentChapterContent = useMemo(() => {
    if (!activePdfBook) return null;
    const modId = activePdfBook.originalModule?.id || activePdfBook.id;
    return getChapterContent(modId, currentChapterTitle);
  }, [activePdfBook, currentChapterTitle]);

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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{language === 'am' ? 'ኦፊሴላዊ የትምህርት ሚኒስቴር ካሪኩለም' : 'Official MoE Curriculum'}</span>
                </span>
                
                {/* Live Supabase Sync Tag */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{supabaseList.length} {language === 'am' ? 'መጽሐፍት ከሱፓቤዝ ተመሳስለዋል' : 'Live Supabase Textbooks'}</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
                {language === 'am' ? 'የኢትዮጵያ ዩኒቨርሲቲ የፈርስት ኢየር (Freshman) ሞጁሎች' : 'Ethiopian University Freshman Modules'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-3xl">
                {language === 'am'
                  ? 'ለሁሉም የኢትዮጵያ ዩኒቨርሲቲዎች የመጀመሪያ አመት ተማሪዎች የተዘጋጁ ኦፊሴላዊ የፒዲኤፍ (PDF) ሞጁሎች ከነ ሽፋን ገጻቸው (Cover Page)። በቀጥታ ያንብቡ ወይም ያውርዱ።'
                  : 'Official Ministry of Education curriculum modules with authentic cover pages and direct PDF downloads powered by Supabase.'}
              </p>
            </div>
          </div>

          {/* Quick Counter & Live Refresh */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={loadSupabaseBooks}
              disabled={isSyncingSupabase}
              className="flex items-center gap-1.5 bg-[#17233D] hover:bg-[#1f3054] px-3.5 py-2 rounded-xl border border-slate-700/60 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Sync latest book URLs and covers from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
              <span>{isSyncingSupabase ? 'Syncing...' : (language === 'am' ? 'አድስ (Supabase)' : 'Sync Supabase')}</span>
            </button>

            <div className="flex items-center gap-2 bg-[#17233D] px-3.5 py-2 rounded-xl border border-slate-700/60 text-xs font-semibold text-slate-200">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>{filteredBooks.length} {language === 'am' ? 'መጽሐፍት' : 'Books'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔍 SEARCH, STREAM SELECTOR & VIEW MODE TOGGLE                             */}
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
              placeholder={language === 'am' ? 'በመጽሐፍ ርዕስ፣ የትምህርት ዘርፍ ወይም ኮድ ይፈልጉ (ለምሳሌ፡ Physics, Math, History)...' : 'Search by book title, subject, or code (e.g. Physics, Math, History)...'}
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

          {/* View Mode Toggle (Covers Gallery vs List) */}
          <div className="flex items-center bg-[#111C35] border border-slate-800 rounded-xl p-1 shrink-0">
            <button
              onClick={() => { playClickChime(); setViewMode('covers'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'covers' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'text-slate-400 hover:text-white'
              }`}
              title="Display with large textbook cover pages"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'የሽፋን ገጽ (Covers)' : 'Cover Bookshelf'}</span>
            </button>
            <button
              onClick={() => { playClickChime(); setViewMode('list'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'text-slate-400 hover:text-white'
              }`}
              title="Detailed list view"
            >
              <List className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ዝርዝር (List)' : 'Detail List'}</span>
            </button>
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
            { id: 'all', label: language === 'am' ? `ሁሉም (${unifiedBooks.length})` : `All Books (${unifiedBooks.length})`, icon: '📚' },
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
      {/* 📚 BOOKSTORE CONTENT: COVERS GALLERY OR DETAILED LIST                     */}
      {/* ========================================================================= */}
      {filteredBooks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111C35] border border-slate-800 space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {language === 'am' ? 'ምንም መጽሐፍ አልተገኘም' : 'No books found'}
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
            {language === 'am' ? 'ሁሉንም አሳይ' : 'Show All Books'}
          </button>
        </div>
      ) : viewMode === 'covers' ? (
        /* 🖼️ VIEW MODE 1: DIGITAL BOOKSHELF GALLERY (WITH AUTHENTIC COVER PAGES) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {filteredBooks.map(book => {
            const isFav = favoriteIds.includes(book.id);

            return (
              <div
                key={book.id}
                onClick={() => handleOpenBook(book, 0, 'cover')}
                className="group relative bg-[#111C35] hover:bg-[#142344] border border-slate-800/90 hover:border-amber-400/50 rounded-2xl p-3 sm:p-3.5 transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1"
              >
                {/* 3D Realistic Textbook Cover Page */}
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-lg border border-white/10 group-hover:border-amber-400/50 transition-all bg-slate-900 select-none">
                  {/* High-Resolution Cover Image */}
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&q=80';
                    }}
                  />

                  {/* 3D Book Spine Shadow on Left Edge */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 sm:w-4 bg-gradient-to-r from-black/70 via-black/30 to-transparent pointer-events-none" />
                  
                  {/* Diagonal Gloss Sheen Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

                  {/* Top Left: PDF Tag */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black bg-red-600 text-white tracking-wider uppercase shadow-md flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" />
                      <span>PDF</span>
                    </span>
                  </div>

                  {/* Top Right: Favorite Star */}
                  <button
                    onClick={(e) => toggleFavorite(book.id, e)}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-slate-300 hover:text-amber-400 backdrop-blur-sm transition-colors cursor-pointer shadow-md"
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  {/* Bottom Right: Quick Zoom Cover Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverModalBook(book);
                    }}
                    className="absolute bottom-11 right-2 z-10 p-1.5 rounded-lg bg-black/75 hover:bg-amber-500 hover:text-slate-950 text-amber-300 backdrop-blur-sm transition-all cursor-pointer shadow-md border border-white/10"
                    title={language === 'am' ? 'የሽፋን ገጽ አጉላ / View Cover' : 'Zoom Cover Page'}
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>

                  {/* Bottom Overlay: Course Code & Grade */}
                  <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-left">
                    <span className="text-[11px] font-mono font-bold text-amber-300 block truncate drop-shadow">
                      {book.code}
                    </span>
                    <span className="text-[9.5px] text-slate-300 font-medium truncate block">
                      {book.grade} • {book.subject}
                    </span>
                  </div>
                </div>

                {/* Book Metadata & Title */}
                <div className="space-y-1 text-left flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                      book.stream === 'Natural Science' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : book.stream === 'Social Science'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {book.stream}
                    </span>
                    {book.isFromSupabase && (
                      <span className="text-[8.5px] font-bold text-amber-400 flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Supabase</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                    {book.title}
                  </h3>

                  {book.amharicTitle && (
                    <p className="text-[11px] text-slate-400 truncate font-medium">
                      {book.amharicTitle}
                    </p>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBook(book, 0, 'cover');
                      }}
                      className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[10.5px] rounded-lg transition-all flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      title={language === 'am' ? 'የመጽሐፉን ሽፋን ገጽ እይ' : 'View Cover Page'}
                    >
                      <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{language === 'am' ? 'ሽፋን' : 'Cover'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenInAppViewer && book.previewUrl) {
                          onOpenInAppViewer(book.previewUrl, `${book.title} (Official PDF)`);
                        } else {
                          handleOpenBook(book, 0, 'drive');
                        }
                      }}
                      className="py-1.5 px-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10.5px] rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      title={language === 'am' ? 'ፒዲኤፍ አንብብ' : 'Read PDF'}
                    >
                      <Eye className="w-3 h-3 text-slate-950 shrink-0" />
                      <span className="truncate">{language === 'am' ? 'አንብብ' : 'Read'}</span>
                    </button>

                    {book.downloadUrl ? (
                      <a
                        href={book.downloadUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-[10.5px] rounded-lg transition-all flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                        title={language === 'am' ? 'ፒዲኤፍ አውርድ' : 'Download PDF'}
                      >
                        <Download className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{language === 'am' ? 'አውርድ' : 'Download'}</span>
                      </a>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBook(book, 0, 'notes');
                        }}
                        className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10.5px] rounded-lg transition-all flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Layers className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{language === 'am' ? 'ማስታወሻ' : 'Notes'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 📑 VIEW MODE 2: DETAILED LIST CARDS (WITH COVER THUMBNAIL) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map(book => {
            const isFav = favoriteIds.includes(book.id);

            return (
              <div
                key={book.id}
                onClick={() => handleOpenBook(book, 0, 'cover')}
                className="group relative p-4 rounded-2xl bg-[#111C35] border border-slate-800/90 hover:border-amber-400/40 hover:bg-[#14213F] transition-all flex flex-col justify-between gap-3 text-left cursor-pointer shadow-md hover:shadow-lg"
              >
                {/* Top: Cover Thumbnail + Metadata */}
                <div className="flex items-start gap-3.5">
                  {/* Cover Page Thumbnail */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverModalBook(book);
                    }}
                    className="w-20 h-28 sm:w-22 sm:h-30 rounded-lg overflow-hidden border border-slate-700/80 shrink-0 shadow-md group-hover:border-amber-400/60 transition-colors relative select-none bg-slate-900 group/cover cursor-zoom-in"
                    title={language === 'am' ? 'የሽፋን ገጽ አጉላ' : 'Click to inspect cover page'}
                  >
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&q=80';
                      }}
                    />
                    {/* Spine Shadow */}
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/70 to-transparent" />
                    {/* Corner Tag */}
                    <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[7px] font-black bg-red-600 text-white uppercase">
                      PDF
                    </span>
                    <span className="absolute bottom-1 right-1 p-0.5 rounded bg-black/70 text-amber-300 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                      <Maximize2 className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  {/* Module Metadata & Title */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wide truncate">
                        {book.code} • {book.stream}
                      </span>
                      <button
                        onClick={(e) => toggleFavorite(book.id, e)}
                        className="text-slate-400 hover:text-amber-400 p-1 cursor-pointer shrink-0 transition-colors"
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                      {book.title}
                    </h3>

                    {book.amharicTitle && (
                      <p className="text-xs text-slate-400 truncate font-medium">
                        {book.amharicTitle}
                      </p>
                    )}

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed pt-0.5">
                      {language === 'am' ? book.amharicDescription : book.description}
                    </p>
                  </div>
                </div>

                {/* Chapters Preview Strip */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{book.chapters.length} {language === 'am' ? 'ምዕራፎች' : 'Units'}</span>
                    <span>{book.pages} {language === 'am' ? 'ገጾች' : 'Pages'}</span>
                    <span className="text-slate-400 font-mono">{book.fileSizeMb} MB</span>
                  </div>
                  
                  {book.chapters[0] && (
                    <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">{book.chapters[0]}</span>
                    </div>
                  )}
                </div>

                {/* Primary Action Button Row */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBook(book, 0, 'cover');
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'am' ? 'ሽፋን' : 'Cover'}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenInAppViewer && book.previewUrl) {
                        onOpenInAppViewer(book.previewUrl, `${book.title} (Official PDF)`);
                      } else {
                        handleOpenBook(book, 0, 'drive');
                      }
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-950" />
                    <span>{language === 'am' ? 'አንብብ' : 'Read'}</span>
                  </button>

                  {book.downloadUrl ? (
                    <a
                      href={book.downloadUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'am' ? 'አውርድ' : 'Download'}</span>
                    </a>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBook(book, 0, 'notes');
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'am' ? 'ማስታወሻ' : 'Notes'}</span>
                    </button>
                  )}
                </div>
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

                {/* Center: Mode Tabs (Cover Page | Official PDF | Units & Notes) */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1 text-xs">
                  <button
                    onClick={() => { playClickChime(); setReaderTab('cover'); }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      readerTab === 'cover'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{language === 'am' ? 'የሽፋን ገጽ' : 'Cover Page'}</span>
                  </button>

                  <button
                    onClick={() => { playClickChime(); setReaderTab('drive'); }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      readerTab === 'drive'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{language === 'am' ? 'ኦፊሴላዊ ፒዲኤፍ' : 'Official PDF'}</span>
                  </button>

                  <button
                    onClick={() => { playClickChime(); setReaderTab('notes'); }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      readerTab === 'notes'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{language === 'am' ? 'ማስታወሻዎች' : 'Units & Notes'}</span>
                  </button>
                </div>

                {/* Optional Unit Navigator (When viewing units & notes) */}
                {readerTab === 'notes' && (
                  <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-xl px-2 py-1 gap-1 text-xs">
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
                )}

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
                  
                  {/* TAB 1: 🖼️ AUTHENTIC TEXTBOOK COVER PAGE */}
                  {readerTab === 'cover' && (
                    <div className="w-full max-w-4xl py-4 flex flex-col md:flex-row items-center md:items-start justify-center gap-8 animate-fadeIn">
                      {/* Realistic 3D Book Cover Presentation */}
                      <div className="relative w-64 sm:w-72 md:w-80 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/40 bg-slate-900 shrink-0 select-none group">
                        <img
                          src={activePdfBook.coverUrl}
                          alt={activePdfBook.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&q=80';
                          }}
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white tracking-widest uppercase shadow-md flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>OFFICIAL PDF</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase shadow-md font-mono">
                            {activePdfBook.code}
                          </span>
                        </div>

                        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent text-left">
                          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                            Ethiopian Higher Education
                          </div>
                          <div className="text-sm font-bold text-white leading-snug drop-shadow">
                            {activePdfBook.title}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {activePdfBook.grade} Curriculum Module
                          </div>
                        </div>
                      </div>

                      {/* Book Overview, Curriculum Metadata & Quick Actions */}
                      <div className="flex-1 space-y-4 text-left max-w-xl">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {activePdfBook.code}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {activePdfBook.stream}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified in Supabase</span>
                            </span>
                          </div>

                          <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
                            {activePdfBook.title}
                          </h1>
                          {activePdfBook.amharicTitle && (
                            <h2 className="text-sm sm:text-base font-bold text-amber-300 mt-0.5">
                              {activePdfBook.amharicTitle}
                            </h2>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {language === 'am' ? activePdfBook.amharicDescription : activePdfBook.description}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                            <span className="text-white font-medium">{activePdfBook.subject}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Semester</span>
                            <span className="text-white font-medium">{activePdfBook.semester}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Credit Hours</span>
                            <span className="text-amber-400 font-bold">{activePdfBook.creditHours} Cr</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Course Units</span>
                            <span className="text-white font-medium">{activePdfBook.chapters.length} Units</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Page Count</span>
                            <span className="text-white font-medium">~{activePdfBook.pages} Pages</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Digital Source</span>
                            <span className="text-emerald-400 font-medium">Google Drive / Supabase</span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                playClickChime();
                                setReaderTab('drive');
                              }}
                              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                            >
                              <Eye className="w-4 h-4 text-slate-950" />
                              <span>{language === 'am' ? 'ኦፊሴላዊ ፒዲኤፍ አንብብ' : 'Read Official PDF'}</span>
                            </button>

                            {activePdfBook.downloadUrl ? (
                              <a
                                href={activePdfBook.downloadUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                              >
                                <Download className="w-4 h-4 text-amber-400" />
                                <span>{language === 'am' ? 'ፒዲኤፍ አውርድ' : 'Download PDF File'}</span>
                              </a>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                playClickChime();
                                setReaderTab('notes');
                              }}
                              className="flex-1 py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5 text-amber-400" />
                              <span>{language === 'am' ? 'የምዕራፍ ማስታወሻዎች እና አስጎብኚ' : 'Interactive Units & Notes'}</span>
                            </button>

                            {activePdfBook.pdfUrl && (
                              <a
                                href={activePdfBook.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Open Google Drive URL"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                                <span>Drive</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: 📄 EMBEDDED GOOGLE DRIVE OFFICIAL PDF VIEWER */}
                  {readerTab === 'drive' && (
                    <div className="w-full h-full min-h-[620px] flex flex-col rounded-xl overflow-hidden border border-white/10 bg-[#0B132B] animate-fadeIn">
                      <div className="px-4 py-2.5 bg-black/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                        <div className="flex items-center gap-2 text-slate-300 min-w-0">
                          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="font-bold text-white truncate max-w-xs sm:max-w-md">{activePdfBook.title}</span>
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono shrink-0">
                            Official PDF
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setReaderTab('cover')}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3 text-amber-400" />
                            <span>{language === 'am' ? 'ሽፋን' : 'Cover'}</span>
                          </button>
                          {activePdfBook.downloadUrl && (
                            <a
                              href={activePdfBook.downloadUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Download className="w-3 h-3 text-slate-950" />
                              <span>{language === 'am' ? 'አውርድ' : 'Download'}</span>
                            </a>
                          )}
                          {activePdfBook.pdfUrl && (
                            <a
                              href={activePdfBook.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3 text-amber-400" />
                              <span>{language === 'am' ? 'ክፈት' : 'Open'}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {activePdfBook.previewUrl ? (
                        <div className="flex-1 w-full min-h-[560px] relative bg-slate-950">
                          <iframe
                            src={activePdfBook.previewUrl}
                            title={activePdfBook.title}
                            className="w-full h-full min-h-[560px] border-0"
                            allow="autoplay; fullscreen"
                          />
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
                          <FileText className="w-12 h-12 text-slate-500" />
                          <h3 className="text-base font-bold text-white">Google Drive PDF Ready</h3>
                          <p className="text-xs text-slate-400 max-w-md">
                            {language === 'am'
                              ? 'ይህ መጽሐፍ በGoogle Drive ማከማቻ ላይ ይገኛል። በቀጥታ ማውረድ ወይም ማንበብ ይችላሉ።'
                              : 'This module is hosted in the official Google Drive repository. You can download it directly or open in Drive.'}
                          </p>
                          <div className="flex items-center gap-2">
                            {activePdfBook.pdfUrl && (
                              <a
                                href={activePdfBook.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{language === 'am' ? 'በGoogle Drive ክፈት' : 'Open in Google Drive'}</span>
                              </a>
                            )}
                            <button
                              onClick={() => setReaderTab('notes')}
                              className="px-4 py-2 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
                            >
                              <Layers className="w-3.5 h-3.5 text-amber-400" />
                              <span>{language === 'am' ? 'ወደ ማስታወሻ ቀይር' : 'Switch to Notes'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: 📝 A4 STYLE INTERACTIVE CURRICULUM NOTES SHEET */}
                  {readerTab === 'notes' && (
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
                  )}
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

      {/* ========================================================================= */}
      {/* 🖼️ DEDICATED FULLSCREEN COVER PAGE MODAL OVERLAY                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {coverModalBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCoverModalBook(null)}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 cursor-pointer select-none"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B132B] border border-amber-500/30 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row gap-6 p-6 sm:p-8 cursor-default text-left"
            >
              {/* Left: 3D Authentic Cover Graphic */}
              <div className="relative w-64 sm:w-72 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/50 bg-slate-900 shrink-0 mx-auto select-none group">
                <img
                  src={coverModalBook.coverUrl}
                  alt={coverModalBook.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&q=80';
                  }}
                />
                <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white tracking-widest uppercase shadow-md flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>PDF</span>
                  </span>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent text-left">
                  <span className="text-xs font-mono font-bold text-amber-300 block">{coverModalBook.code}</span>
                  <span className="text-[11px] text-slate-300">{coverModalBook.grade} • {coverModalBook.subject}</span>
                </div>
              </div>

              {/* Right: Detailed Metadata & Fast Actions */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {coverModalBook.code}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {coverModalBook.stream}
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Supabase Live</span>
                      </span>
                    </div>

                    <button
                      onClick={() => setCoverModalBook(null)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {coverModalBook.title}
                    </h2>
                    {coverModalBook.amharicTitle && (
                      <h3 className="text-sm font-bold text-amber-300 mt-0.5">
                        {coverModalBook.amharicTitle}
                      </h3>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {language === 'am' ? coverModalBook.amharicDescription : coverModalBook.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                    <div><strong>Course Code:</strong> {coverModalBook.code}</div>
                    <div><strong>Credit Hours:</strong> {coverModalBook.creditHours} Cr</div>
                    <div><strong>Stream:</strong> {coverModalBook.stream}</div>
                    <div><strong>Target:</strong> Ethiopian Freshman (Year 1)</div>
                    <div><strong>Units:</strong> {coverModalBook.chapters.length} Units</div>
                    <div><strong>Pages:</strong> ~{coverModalBook.pages} Pages</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const b = coverModalBook;
                        setCoverModalBook(null);
                        handleOpenBook(b, 0, 'drive');
                      }}
                      className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Eye className="w-4 h-4 text-slate-950" />
                      <span>{language === 'am' ? 'ኦፊሴላዊ ፒዲኤፍ አንብብ' : 'Read Official PDF'}</span>
                    </button>

                    {coverModalBook.downloadUrl ? (
                      <a
                        href={coverModalBook.downloadUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-amber-400" />
                        <span>{language === 'am' ? 'ፒዲኤፍ አውርድ' : 'Download File'}</span>
                      </a>
                    ) : null}
                  </div>

                  <button
                    onClick={() => {
                      const b = coverModalBook;
                      setCoverModalBook(null);
                      handleOpenBook(b, 0, 'notes');
                    }}
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'am' ? 'የምዕራፍ ማስታወሻዎች እና አስጎብኚ' : 'Interactive Units & Notes'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
