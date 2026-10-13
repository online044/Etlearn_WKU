/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Search, Star, Bookmark, BookOpen, ChevronRight, ChevronLeft,
  X, Check, Bot, Sparkles, Printer, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Download, Moon, Sun, Layers, HelpCircle, CheckCircle2, RotateCcw, Share2,
  ExternalLink, Folder, CloudDownload, Eye, ShieldCheck, LayoutGrid, List, RefreshCw, Info,
  Play, Video, Tv, Film, ListVideo, Focus, HardDrive, WifiOff, Trash2, Loader2, CheckCheck,
  Lock, Unlock, Smartphone, SlidersHorizontal, Coffee
} from 'lucide-react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime } from '../utils/audio';
import { isAdministratorEmail } from '../utils/adminAuth';
import { getChapterContent } from '../data/textbookChapterContent';
import { safeStorage } from '../utils/safeStorage';
import { fetchSupabaseBooks, fetchSupabaseLessons } from '../utils/supabaseClient';
import CourseDetail from './CourseDetail';
import MobilePdfReader from './MobilePdfReader';
import { 
  getAllOfflineBookIds, 
  getOfflineBook, 
  deleteOfflineBook, 
  downloadBookInApp, 
  formatBytes,
  extractDriveFileId,
  OfflineBookRecord 
} from '../utils/offlineBooksDB';
import { useOnlineStatus } from '../utils/useOnlineStatus';

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
    if (raw.includes('lh3.googleusercontent.com/d/')) {
      return raw;
    }

    // Convert Google Drive thumbnail or preview link to high-performance direct CDN image
    const driveMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) || raw.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
    if (driveMatch && driveMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w800`;
    }
    return raw;
  }

  // If cover_url is not set, derive directly from pdf_url Google Drive file ID
  if (book.pdf_url && typeof book.pdf_url === 'string') {
    const idMatch = book.pdf_url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) || book.pdf_url.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/) || book.pdf_url.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}=w800`;
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

  const clean = rawUrl.trim().replace(/^['"]+|['"]+$/g, '');
  const idMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) || clean.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/) || clean.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
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
    const folderMatch = clean.match(/folders\/([a-zA-Z0-9_-]{20,})/);
    const folderId = folderMatch ? folderMatch[1] : '';
    return {
      pdfUrl: clean,
      previewUrl: folderId ? `https://drive.google.com/embeddedfolderview?id=${folderId}#grid` : clean,
      downloadUrl: clean,
      isDrive: true,
      folderId
    };
  }

  return {
    pdfUrl: clean,
    previewUrl: clean,
    downloadUrl: clean,
    isDrive: false
  };
}

/**
 * 🎯 Normalize course subject keys to prevent any duplicate entries across Supabase & Curriculum lists
 */
export function getCanonicalSubjectKey(title?: string, code?: string, subject?: string): string {
  const s = `${title || ''} ${code || ''} ${subject || ''}`.toLowerCase();
  if (s.includes('fitness') || s.includes('sport') || s.includes('spsc')) return 'fitness';
  if (s.includes('physics') || s.includes('phys')) return 'physics';
  if (s.includes('biology') || s.includes('biol')) return 'biology';
  if (s.includes('chem')) return 'chemistry';
  if (s.includes('math') && (s.includes('social') || s.includes('soc') || s.includes('1012'))) return 'math_social';
  if (s.includes('math') || s.includes('calculus')) return 'math_natural';
  if (s.includes('econ')) return 'economics';
  if (s.includes('emerg') || s.includes('emte') || s.includes('4ir')) return 'emerging_tech';
  if (s.includes('entrep') || s.includes('mgmt')) return 'entrepreneurship';
  if (s.includes('logic') || s.includes('phil') || s.includes('critical') || s.includes('loct')) return 'critical_thinking';
  if (s.includes('psych') || s.includes('pscy') || s.includes('life skill')) return 'psychology';
  if (s.includes('geog') || s.includes('gees')) return 'geography';
  if (s.includes('global') || s.includes('gltr')) return 'global_trends';
  if (s.includes('inclu') || s.includes('special need')) return 'inclusiveness';
  if (s.includes('civic') || s.includes('mcie') || s.includes('moral')) return 'civics';
  if (s.includes('english') && (s.includes('ii') || s.includes(' 2') || s.includes('1012'))) return 'english_2';
  if (s.includes('english') || s.includes('flen') || s.includes('communicat') || s.includes('1011')) return 'english_1';
  if (s.includes('hist')) return 'history';
  if (s.includes('anthro')) return 'anthropology';
  return (title || 'module').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
}

export interface LectureItem {
  id: string;
  title: string;
  amharicTitle?: string;
  url: string;
  duration?: string;
  chapterNumber?: number;
  instructor?: string;
  description?: string;
  isCustomFromSupabase?: boolean;
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
  // 🎥 Video Lecture Properties
  videoUrl?: string;
  hasVideoLecture: boolean;
  isVideoFree: boolean;
  lectures: LectureItem[];
}

// ─── CURATED ETHIOPIAN UNIVERSITY FRESHMAN VIDEO LECTURES ───
export const CURATED_VIDEO_LECTURES: Record<string, LectureItem[]> = {
  biology: [
    {
      id: 'bio_lec_1',
      title: 'Unit 1: The Nature of Biology & Cell Biology',
      amharicTitle: 'ምዕራፍ 1፡ የስነ-ህይወት መሰረቶች እና የህዋስ መዋቅር',
      url: 'https://www.youtube.com/watch?v=8IlzKri08kk',
      duration: '45m',
      chapterNumber: 1,
      instructor: 'Dr. Tadesse G. / AAU Faculty',
      description: 'Comprehensive lecture covering cell theory, prokaryotic vs eukaryotic cells, membrane architecture, and organelles.'
    },
    {
      id: 'bio_lec_2',
      title: 'Unit 2: Biological Macromolecules & Enzymes',
      amharicTitle: 'ምዕራፍ 2፡ ባዮሞለኪውሎች እና ኢንዛይሞች',
      url: 'https://www.youtube.com/watch?v=H8WJ2KENlK0',
      duration: '38m',
      chapterNumber: 2,
      instructor: 'Dr. Tadesse G.',
      description: 'Covers carbohydrates, lipids, proteins, nucleic acids, and enzyme catalytic mechanisms.'
    },
    {
      id: 'bio_lec_3',
      title: 'Unit 3: Cellular Respiration, Glycolysis & Krebs Cycle',
      amharicTitle: 'ምዕራፍ 3፡ የህዋስ አተነፋፈስ እና ሃይል አመንጪ ሂደቶች',
      url: 'https://www.youtube.com/watch?v=00jbG_cfGuQ',
      duration: '52m',
      chapterNumber: 3,
      instructor: 'Dr. Tadesse G.',
      description: 'ATP generation pathways, aerobic and anaerobic respiration in cells.'
    },
    {
      id: 'bio_lec_4',
      title: 'Unit 4: Molecular Genetics, DNA Replication & Protein Synthesis',
      amharicTitle: 'ምዕራፍ 4፡ ሞለኪውላር ጀነቲክስ እና የዲኤንኤ ስሪት',
      url: 'https://www.youtube.com/watch?v=CBezq1fFUEA',
      duration: '48m',
      chapterNumber: 4,
      instructor: 'Dr. Tadesse G.',
      description: 'Transcription, translation, genetic code, mutations and regulation of gene expression.'
    },
    {
      id: 'bio_lec_5',
      title: 'Unit 5: Ethiopian Ecosystems, Biodiversity & Ecology',
      amharicTitle: 'ምዕራፍ 5፡ የኢትዮጵያ ስነ-ምህዳር እና ብዝሃ-ህይወት',
      url: 'https://www.youtube.com/watch?v=f-ldPgEfAHI',
      duration: '40m',
      chapterNumber: 5,
      instructor: 'Dr. Tadesse G.',
      description: 'Biomes of Ethiopia, conservation biology, community interactions, and population ecology.'
    }
  ],
  physics: [
    {
      id: 'phy_lec_1',
      title: 'Unit 1: Vectors, Physical Quantities & 1D Kinematics',
      amharicTitle: 'ምዕራፍ 1፡ ቬክተሮች እና ቀጥተኛ እንቅስቃሴ',
      url: 'https://www.youtube.com/watch?v=b05pIq6M5U8',
      duration: '42m',
      chapterNumber: 1,
      instructor: 'Prof. Alemayehu / WKU Faculty',
      description: 'Vector addition, dot and cross products, velocity, acceleration, and kinematic equations.'
    },
    {
      id: 'phy_lec_2',
      title: 'Unit 2: Newton\'s Laws of Motion & Dynamics',
      amharicTitle: 'ምዕራፍ 2፡ የኒውተን የእንቅስቃሴ ህጎች',
      url: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
      duration: '50m',
      chapterNumber: 2,
      instructor: 'Prof. Alemayehu',
      description: 'Inertia, force analysis, free body diagrams, and friction.'
    },
    {
      id: 'phy_lec_3',
      title: 'Unit 3: Work, Energy, Power & Conservation Laws',
      amharicTitle: 'ምዕራፍ 3፡ ስራ፣ ጉልበት እና ኃይል',
      url: 'https://www.youtube.com/watch?v=w4QFJb9a8vo',
      duration: '46m',
      chapterNumber: 3,
      instructor: 'Prof. Alemayehu',
      description: 'Work-kinetic energy theorem, conservative forces, and potential energy functions.'
    }
  ],
  math: [
    {
      id: 'math_lec_1',
      title: 'Unit 1: Propositional Logic & Quantifiers',
      amharicTitle: 'ምዕራፍ 1፡ የአመክንዮ መሰረቶች እና ኳንቲፋየሮች',
      url: 'https://www.youtube.com/watch?v=ylOzXfL1QeI',
      duration: '35m',
      chapterNumber: 1,
      instructor: 'Dr. Berhanu / Math Dept',
      description: 'Truth tables, logical equivalences, valid arguments, and predicate logic.'
    },
    {
      id: 'math_lec_2',
      title: 'Unit 2: Real Functions, Limits & Continuity',
      amharicTitle: 'ምዕራፍ 2፡ ፈንክሽኖች፣ ሊሚቶች እና ቀጣይነት',
      url: 'https://www.youtube.com/watch?v=YNstP0ESndU',
      duration: '55m',
      chapterNumber: 2,
      instructor: 'Dr. Berhanu',
      description: 'Evaluation of limits, limit theorems, asymptotes, and intermediate value theorem.'
    },
    {
      id: 'math_lec_3',
      title: 'Unit 3: Differential Calculus & Derivative Applications',
      amharicTitle: 'ምዕራፍ 3፡ ዲሪቬቲቭ እና ተዛማጅ ስሌቶች',
      url: 'https://www.youtube.com/watch?v=5yfh5cf4-0w',
      duration: '48m',
      chapterNumber: 3,
      instructor: 'Dr. Berhanu',
      description: 'Chain rule, implicit differentiation, optimization problems, and curve sketching.'
    }
  ],
  chemistry: [
    {
      id: 'chem_lec_1',
      title: 'Unit 1: Atomic Structure & Quantum Mechanical Model',
      amharicTitle: 'ምዕራፍ 1፡ የአቶም አወቃቀር እና ኳንተም ሜካኒክስ',
      url: 'https://www.youtube.com/watch?v=FSyAehMdpyI',
      duration: '44m',
      chapterNumber: 1,
      instructor: 'Dr. Martha / Chemistry Dept',
      description: 'Bohr model, wave-particle duality, orbitals, electron configuration, and periodic trends.'
    },
    {
      id: 'chem_lec_2',
      title: 'Unit 2: Chemical Bonding, Hybridization & Molecular Geometry',
      amharicTitle: 'ምዕራፍ 2፡ ኬሚካላዊ ትስስር እና የሞለኪውል ቅርጽ',
      url: 'https://www.youtube.com/watch?v=CGA8sRwqIFg',
      duration: '40m',
      chapterNumber: 2,
      instructor: 'Dr. Martha',
      description: 'Ionic vs covalent bonding, Lewis structures, VSEPR theory, and polarity.'
    }
  ],
  logic: [
    {
      id: 'log_lec_1',
      title: 'Unit 1: Introduction to Logic, Arguments & Critical Thinking',
      amharicTitle: 'ምዕራፍ 1፡ የፍልስፍና እና ሂሳዊ አስተሳሰብ መግቢያ',
      url: 'https://www.youtube.com/watch?v=Nq8Wy4B4i3c',
      duration: '39m',
      chapterNumber: 1,
      instructor: 'Ato Solomon / Philosophy Dept',
      description: 'Premise-conclusion recognition, deductive vs inductive reasoning.'
    },
    {
      id: 'log_lec_2',
      title: 'Unit 2: Informal Fallacies of Relevance & Weak Induction',
      amharicTitle: 'ምዕራፍ 2፡ የተለመዱ የመከራከሪያ ስህተቶች (Fallacies)',
      url: 'https://www.youtube.com/watch?v=IawIjqOJBU8',
      duration: '45m',
      chapterNumber: 2,
      instructor: 'Ato Solomon',
      description: 'Ad hominem, straw man, appeal to pity, appeal to force, false cause, and hasty generalization.'
    }
  ],
  economics: [
    {
      id: 'econ_lec_1',
      title: 'Unit 1: Fundamentals of Economics, Scarcity & Decision Making',
      amharicTitle: 'ምዕራፍ 1፡ የኢኮኖሚክስ መሰረቶች እና ምርጫ',
      url: 'https://www.youtube.com/watch?v=1OxGP64a_lE',
      duration: '36m',
      chapterNumber: 1,
      instructor: 'Economics Faculty',
      description: 'Scarcity, choice, opportunity cost, and the production possibilities frontier.'
    },
    {
      id: 'econ_lec_2',
      title: 'Unit 2: Demand, Supply, Elasticity & Market Equilibrium',
      amharicTitle: 'ምዕራፍ 2፡ አቅርቦት፣ ፍላጎት እና የገበያ ሚዛን',
      url: 'https://www.youtube.com/watch?v=kUPm2tMCbGE',
      duration: '42m',
      chapterNumber: 2,
      instructor: 'Economics Faculty',
      description: 'Determinants of supply and demand, equilibrium price, and elasticity.'
    }
  ],
  emerging: [
    {
      id: 'em_lec_1',
      title: 'Unit 1: Overview of Emerging Technologies & AI',
      amharicTitle: 'ምዕራፍ 1፡ ሰው ሰራሽ አስተውሎት እና ቴክኖሎጂዎች',
      url: 'https://www.youtube.com/watch?v=ad79nYk2keg',
      duration: '40m',
      chapterNumber: 1,
      instructor: 'Tech Dept Faculty',
      description: 'Artificial intelligence, machine learning, robotics, and societal impact.'
    }
  ]
};

export function resolveBookLectures(
  book: {
    id?: string;
    subject?: string;
    title?: string;
    video_url?: string | null;
    videoUrl?: string | null;
    video_lectures?: any;
    lectures?: any;
    youtube_url?: string | null;
  },
  allSupabaseLessons?: any[]
): LectureItem[] {
  const result: LectureItem[] = [];
  const normBookId = (book.id || '').toLowerCase();
  const normTitle = (book.title || '').toLowerCase();
  const normSub = (book.subject || '').toLowerCase();

  // 1. Primary Priority: Check if there are real lessons stored in Supabase 'lessons' table
  if (Array.isArray(allSupabaseLessons) && allSupabaseLessons.length > 0) {
    const matchedLessons = allSupabaseLessons.filter(l => {
      const lBookId = (l.book_id || '').toLowerCase();
      const lCourseId = (l.course_id || '').toLowerCase();
      if (lBookId && (lBookId === normBookId || lBookId === `course_${normBookId}`)) return true;
      if (lCourseId && (lCourseId === normBookId || lCourseId === `course_${normBookId}`)) return true;
      if (normSub.includes('bio') && (lBookId.includes('bio') || lCourseId.includes('bio'))) return true;
      if (normTitle.includes('bio') && (lBookId.includes('bio') || lCourseId.includes('bio'))) return true;
      return false;
    });

    if (matchedLessons.length > 0) {
      // Sort strictly by chapter_number
      matchedLessons.sort((a, b) => (Number(a.chapter_number) || 0) - (Number(b.chapter_number) || 0));
      matchedLessons.forEach((l, idx) => {
        const rawYt = (l.youtube_video_id || l.video_url || '').trim();
        const fullUrl = rawYt.startsWith('http')
          ? rawYt
          : rawYt ? `https://www.youtube.com/watch?v=${rawYt}` : '';

        result.push({
          id: l.id || `supabase_bio_${idx}`,
          title: l.title || `Unit ${l.chapter_number || idx + 1}`,
          amharicTitle: l.title,
          url: fullUrl || 'https://www.youtube.com/watch?v=BoeytcZGuXg',
          duration: l.duration || '15m',
          chapterNumber: Number(l.chapter_number) || (idx + 1),
          instructor: l.instructor_name || 'Dr. Tadesse G. / AAU Faculty',
          description: l.content || `Unit ${l.chapter_number || idx + 1} official curriculum video lecture.`,
          isCustomFromSupabase: true
        });
      });
      return result;
    }
  }

  // 2. Direct video_url from books table
  const rawVideo = ((book.video_url || book.videoUrl || book.youtube_url || '') as string).trim();
  if (rawVideo) {
    result.push({
      id: 'supabase_video_primary',
      title: `Official Lecture: ${book.title || 'Course Lecture'}`,
      amharicTitle: 'የኮርሱ ኦፊሴላዊ የቪዲዮ ትምህርት (Supabase Live)',
      url: rawVideo,
      duration: 'Live Lecture',
      chapterNumber: 1,
      instructor: 'University Faculty / Supabase Verified',
      description: 'Live verified video lecture synchronized directly from your Supabase database.',
      isCustomFromSupabase: true
    });
  }

  // If user provided a JSON array of lectures in Supabase
  const rawList = book.video_lectures || book.lectures;
  if (Array.isArray(rawList)) {
    rawList.forEach((item, idx) => {
      if (typeof item === 'string' && item.trim()) {
        result.push({
          id: `supabase_lec_${idx}`,
          title: `Lecture ${idx + 1}: ${book.title}`,
          url: item.trim(),
          isCustomFromSupabase: true
        });
      } else if (item && typeof item === 'object' && item.url) {
        result.push({
          id: item.id || `supabase_lec_${idx}`,
          title: item.title || `Lecture ${idx + 1}`,
          amharicTitle: item.amharicTitle,
          url: item.url,
          duration: item.duration || 'Lecture',
          chapterNumber: item.chapterNumber || (idx + 1),
          instructor: item.instructor,
          description: item.description,
          isCustomFromSupabase: true
        });
      }
    });
  }

  // 3. Add curated standard lectures by subject match
  let matchedKey = '';
  if (normSub.includes('bio') || normTitle.includes('bio')) matchedKey = 'biology';
  else if (normSub.includes('phys') || normTitle.includes('phys')) matchedKey = 'physics';
  else if (normSub.includes('math') || normTitle.includes('math')) matchedKey = 'math';
  else if (normSub.includes('chem') || normTitle.includes('chem')) matchedKey = 'chemistry';
  else if (normSub.includes('logic') || normSub.includes('critic') || normTitle.includes('logic')) matchedKey = 'logic';
  else if (normSub.includes('econ') || normTitle.includes('econ')) matchedKey = 'economics';
  else if (normSub.includes('emerg') || normSub.includes('tech') || normTitle.includes('emerg')) matchedKey = 'emerging';

  if (matchedKey && CURATED_VIDEO_LECTURES[matchedKey]) {
    CURATED_VIDEO_LECTURES[matchedKey].forEach(curated => {
      if (!result.some(r => r.url === curated.url)) {
        result.push(curated);
      }
    });
  }

  // 4. Fallback generic lecture if none found
  if (result.length === 0) {
    result.push({
      id: 'generic_lec_1',
      title: `Unit 1 Lecture: Introduction to ${book.title || 'Course'}`,
      amharicTitle: 'ምዕራፍ 1 የቪዲዮ ትምህርት',
      url: 'https://www.youtube.com/watch?v=8IlzKri08kk',
      duration: '40m',
      chapterNumber: 1,
      instructor: 'EthioLearn Faculty',
      description: `Introductory lecture concepts and exam essentials for ${book.title || 'this module'}.`
    });
  }

  return result;
}

export function getVideoEmbedUrl(rawUrl: string, useStandardDomain: boolean = false): { 
  embedUrl: string; 
  isDirectVideo: boolean; 
  isDrive: boolean;
  videoId?: string;
  youtubeUrl?: string;
} {
  if (!rawUrl) return { embedUrl: '', isDirectVideo: false, isDrive: false };
  const clean = rawUrl.trim();
  const domain = useStandardDomain ? 'www.youtube.com' : 'www.youtube-nocookie.com';

  // Raw 11-character YouTube video ID (from Supabase lessons table, e.g. BoeytcZGuXg)
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return {
      embedUrl: `https://${domain}/embed/${clean}?autoplay=1&rel=0&modestbranding=1`,
      isDirectVideo: false,
      isDrive: false,
      videoId: clean,
      youtubeUrl: `https://www.youtube.com/watch?v=${clean}`
    };
  }

  // YouTube watch link (watch?v=... or youtu.be/...)
  const ytMatch = clean.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const vId = ytMatch[1];
    return {
      embedUrl: `https://${domain}/embed/${vId}?autoplay=1&rel=0&modestbranding=1`,
      isDirectVideo: false,
      isDrive: false,
      videoId: vId,
      youtubeUrl: `https://www.youtube.com/watch?v=${vId}`
    };
  }

  // YouTube playlist
  const ytListMatch = clean.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (ytListMatch && ytListMatch[1] && clean.includes('youtube.com')) {
    return {
      embedUrl: `https://${domain}/embed/videoseries?list=${ytListMatch[1]}`,
      isDirectVideo: false,
      isDrive: false,
      youtubeUrl: `https://www.youtube.com/playlist?list=${ytListMatch[1]}`
    };
  }

  // Google Drive
  const driveMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/i) || clean.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
  if (driveMatch && driveMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      isDirectVideo: false,
      isDrive: true
    };
  }

  // Direct MP4 / WebM
  if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.includes('.mp4?') || clean.includes('.webm?')) {
    return {
      embedUrl: clean,
      isDirectVideo: true,
      isDrive: false
    };
  }

  return {
    embedUrl: clean,
    isDirectVideo: false,
    isDrive: false
  };
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
  videoLectures?: LectureItem[];
  videoUrl?: string;
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

export const FREE_TRIAL_COURSE_ID = 'freshman_critical_thinking';

export function isFreeTrialCourse(book?: { id?: string; code?: string; title?: string } | null): boolean {
  if (!book) return false;
  const normId = (book.id || '').toLowerCase();
  const normCode = (book.code || '').toLowerCase();
  const normTitle = (book.title || '').toLowerCase();
  return (
    normId === 'freshman_critical_thinking' ||
    normId.includes('critical') ||
    normId.includes('phil_1011') ||
    normCode.includes('phil 1011') ||
    normTitle.includes('critical thinking')
  );
}

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
  // Live Supabase Books & Lessons state
  const [supabaseList, setSupabaseList] = useState<any[]>(supabaseBooks || []);
  const [supabaseLessons, setSupabaseLessons] = useState<any[]>([]);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [viewMode, setViewMode] = useState<'covers' | 'list'>('covers');

  // Search & Stream Filter States (including prominent 'exams' tab)
  const isOnline = useOnlineStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState<'all' | 'exams' | 'Common' | 'Natural Science' | 'Social Science' | 'favorites' | 'videos' | 'downloaded'>('all');
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<UnifiedBookItem | null>(null);
  const [monthlyExamSubscriptionModalOpen, setMonthlyExamSubscriptionModalOpen] = useState<UnifiedBookItem | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'title' | 'code' | 'pages'>('code');

  // Offline Books Storage state
  const [offlineBookIds, setOfflineBookIds] = useState<Set<string>>(new Set());
  const [downloadingMap, setDownloadingMap] = useState<Record<string, number>>({});
  const [activeOfflineRecord, setActiveOfflineRecord] = useState<OfflineBookRecord | null>(null);
  const [activeOfflineBlobUrl, setActiveOfflineBlobUrl] = useState<string | null>(null);
  const [proVideoModalBook, setProVideoModalBook] = useState<UnifiedBookItem | null>(null);
  const isProUser = Boolean(profile?.isPro || profile?.proStatus === 'active');
  const isUserAdmin = Boolean(profile?.email && isAdministratorEmail(profile.email)) || profile?.userRole === 'admin' || (profile as any)?.role === 'admin';
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [pdfViewerMode, setPdfViewerMode] = useState<'mobile-native' | 'drive' | 'native' | 'gdocs'>('mobile-native');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(curr => (curr === msg ? null : curr));
    }, 4000);
  };

  const loadOfflineBookIds = async () => {
    try {
      const ids = await getAllOfflineBookIds();
      setOfflineBookIds(new Set(ids));
    } catch (err) {
      console.warn('[BookStore] Failed to load offline book ids:', err);
    }
  };

  useEffect(() => {
    loadOfflineBookIds();
  }, []);

  // When student goes offline, automatically switch to downloaded books if available
  useEffect(() => {
    if (!isOnline && offlineBookIds.size > 0 && selectedStream === 'all') {
      setSelectedStream('downloaded');
      showToast(language === 'am' ? '📡 ኢንተርኔት ተቋርጧል። የወረዱትን መጽሐፍት ከመስመር ውጭ ማንበብ ይችላሉ።' : '📡 You are offline. Showing downloaded books ready for study.');
    }
  }, [isOnline, offlineBookIds.size]);

  // Load books & lessons from Supabase if prop was empty or on manual sync
  const loadSupabaseBooks = async () => {
    setIsSyncingSupabase(true);
    playClickChime();
    try {
      const [booksData, lessonsData] = await Promise.all([
        fetchSupabaseBooks(),
        fetchSupabaseLessons()
      ]);
      if (booksData && booksData.length > 0) {
        setSupabaseList(booksData);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        playSuccessChime();
      }
      if (lessonsData && lessonsData.length > 0) {
        setSupabaseLessons(lessonsData);
      }
    } catch (err) {
      console.warn('Failed to load books/lessons from Supabase:', err);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  useEffect(() => {
    if (supabaseBooks && supabaseBooks.length > 0) {
      setSupabaseList(supabaseBooks);
      fetchSupabaseLessons().then(data => {
        if (data && data.length > 0) setSupabaseLessons(data);
      });
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

  // ─── UNIFIED BOOKS REPOSITORY (Strictly Deduplicated: 0 Repeated PDFs) ───
  const unifiedBooks = useMemo(() => {
    const canonicalMap = new Map<string, UnifiedBookItem>();

    // 1. Seed with official Ethiopian curriculum modules (canonical definitions)
    FRESHMAN_MODULES.forEach((mod) => {
      const cKey = getCanonicalSubjectKey(mod.title, mod.code, mod.subject);
      const pdfLinks = getBookPdfLinks(
        mod.googleDriveFileId ? `https://drive.google.com/uc?export=download&id=${mod.googleDriveFileId}` : ''
      );
      const coverUrl = resolveBookCover({
        cover_url: null,
        pdf_url: mod.googleDriveFileId ? `https://drive.google.com/uc?export=download&id=${mod.googleDriveFileId}` : '',
        subject: mod.subject,
        title: mod.title
      });

      const lectures = resolveBookLectures(
        { id: mod.id, subject: mod.subject, title: mod.title },
        supabaseLessons
      );

      const isBio = cKey === 'biology' || mod.subject.toLowerCase().includes('bio') || mod.title.toLowerCase().includes('bio');

      canonicalMap.set(cKey, {
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
        originalModule: mod,
        hasVideoLecture: lectures.length > 0,
        isVideoFree: isBio, // General Biology is Open & Free for all students!
        lectures,
        videoUrl: lectures[0]?.url || ''
      });
    });

    // 2. Merge all books from Supabase table - avoids creating duplicates!
    (supabaseList || []).forEach((sbBook) => {
      const sbTitle = (sbBook.title || '').trim();
      const sbCode = (sbBook.code || '').trim();
      const sbSubject = (sbBook.subject || '').trim();
      if (!sbTitle && !sbSubject) return;

      const cKey = getCanonicalSubjectKey(sbTitle, sbCode, sbSubject);
      const existing = canonicalMap.get(cKey);

      const pdfLinks = getBookPdfLinks(
        sbBook.pdf_url || existing?.pdfUrl || ''
      );
      const coverUrl = resolveBookCover({
        cover_url: sbBook.cover_url || existing?.coverUrl,
        pdf_url: sbBook.pdf_url || existing?.pdfUrl || '',
        subject: sbSubject || existing?.subject,
        title: sbTitle || existing?.title
      });

      const lectures = resolveBookLectures(
        {
          id: sbBook.id || existing?.id,
          subject: sbSubject || existing?.subject,
          title: sbTitle || existing?.title,
          video_url: sbBook.video_url || existing?.videoUrl,
          videoUrl: sbBook.videoUrl || existing?.videoUrl,
          lectures: sbBook.lectures,
          youtube_url: sbBook.youtube_url
        },
        supabaseLessons
      );

      const isBio = cKey === 'biology' || sbSubject.toLowerCase().includes('bio') || sbTitle.toLowerCase().includes('bio');

      if (existing) {
        // Merge enriched data from Supabase without creating a duplicate card
        canonicalMap.set(cKey, {
          ...existing,
          pdfUrl: sbBook.pdf_url ? pdfLinks.pdfUrl : existing.pdfUrl,
          previewUrl: sbBook.pdf_url ? pdfLinks.previewUrl : existing.previewUrl,
          downloadUrl: sbBook.pdf_url ? pdfLinks.downloadUrl : existing.downloadUrl,
          coverUrl: sbBook.cover_url ? coverUrl : existing.coverUrl,
          hasVideoLecture: lectures.length > 0 || existing.hasVideoLecture,
          isVideoFree: isBio,
          lectures: lectures.length > 0 ? lectures : existing.lectures,
          videoUrl: lectures[0]?.url || existing.videoUrl || '',
          isFromSupabase: true
        });
      } else {
        // Novel book not in curriculum list
        canonicalMap.set(cKey, {
          id: sbBook.id || `sb_${Math.random()}`,
          code: sbBook.code || (sbSubject ? `${sbSubject.slice(0, 4).toUpperCase()} 1011` : 'MOD 1011'),
          title: sbTitle || 'University Textbook',
          amharicTitle: sbBook.amharicTitle || (language === 'am' ? 'የዩኒቨርሲቲ ሞጁል' : ''),
          subject: sbSubject || 'University Curriculum',
          grade: sbBook.grade || 'Freshman',
          stream: sbBook.stream || 'Common',
          semester: sbBook.semester || 'Semester I',
          coverUrl,
          pdfUrl: pdfLinks.pdfUrl,
          previewUrl: pdfLinks.previewUrl,
          downloadUrl: pdfLinks.downloadUrl,
          description: sbBook.description || 'Official Ethiopian higher education university curriculum module textbook.',
          amharicDescription: sbBook.amharicDescription || 'ኦፊሴላዊ የኢትዮጵያ ከፍተኛ ትምህርት ተቋማት የመጀመሪያ ዓመት ካሪኩለም መማሪያ መጽሐፍ።',
          chapters: sbBook.chapters || ['Unit 1: Fundamentals & Scope', 'Unit 2: Theoretical Foundations', 'Unit 3: Applied Principles & Analysis', 'Unit 4: Review, Problems & Assessment'],
          pages: sbBook.pages || 160,
          creditHours: sbBook.creditHours || 3,
          fileSizeMb: sbBook.fileSizeMb || 4.2,
          rating: sbBook.rating || 4.9,
          isDrive: pdfLinks.isDrive,
          isFromSupabase: true,
          hasVideoLecture: lectures.length > 0,
          isVideoFree: isBio,
          lectures,
          videoUrl: lectures[0]?.url || ''
        });
      }
    });

    return Array.from(canonicalMap.values());
  }, [supabaseList, supabaseLessons, language]);

  // Filtered & Sorted Modules
  const filteredBooks = useMemo(() => {
    return unifiedBooks.filter(book => {
      // Stream Filter
      if (selectedStream === 'favorites') {
        if (!favoriteIds.includes(book.id)) return false;
      } else if (selectedStream === 'videos') {
        if (!book.hasVideoLecture) return false;
      } else if (selectedStream === 'downloaded') {
        if (!offlineBookIds.has(book.id)) return false;
      } else if (selectedStream === 'exams') {
        // Show courses in exam tab
        return true;
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
  }, [unifiedBooks, selectedStream, searchQuery, favoriteIds, sortBy, offlineBookIds]);

  // ---------------------------------------------------------------------------
  // 📖 PURE IN-APP PDF READER MODAL STATE
  // ---------------------------------------------------------------------------
  const [activePdfBook, setActivePdfBook] = useState<UnifiedBookItem | null>(null);
  const [coverModalBook, setCoverModalBook] = useState<UnifiedBookItem | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [activeLectureIndex, setActiveLectureIndex] = useState<number>(0);
  const [lectureSearch, setLectureSearch] = useState<string>('');
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [pdfTheme, setPdfTheme] = useState<'paper' | 'dark'>('dark');
  const [readerTheme, setReaderTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
  const [isTrueFullscreen, setIsTrueFullscreen] = useState<boolean>(false);
  const [pdfIframeKey, setPdfIframeKey] = useState<number>(0);
  const [coverZoom, setCoverZoom] = useState<number>(100);
  const [coverInfoOpen, setCoverInfoOpen] = useState<boolean>(false);
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const [pdfSidebarOpen, setPdfSidebarOpen] = useState<boolean>(true);
  const [readerFontSize, setReaderFontSize] = useState<number>(16);
  const [searchInDoc, setSearchInDoc] = useState<string>('');
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(false);
  const [aiMode, setAiMode] = useState<'summary' | 'amharic' | 'quiz' | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [readerTab, setReaderTab] = useState<'drive' | 'video' | 'exams' | 'cover' | 'notes'>('drive');
  const [videoDomainAlternative, setVideoDomainAlternative] = useState<boolean>(false);

  const activePdfModule = activePdfBook;

  useEffect(() => {
    const handleFsChange = () => {
      setIsTrueFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    playClickChime();
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      const el = readerContainerRef.current || document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          setIsTrueFullscreen(true);
        });
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
        setIsTrueFullscreen(true);
      } else {
        setIsTrueFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsTrueFullscreen(false);
    }
  };

  const handleDownloadBook = async (book: UnifiedBookItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playClickChime();
    if (downloadingMap[book.id]) return;

    setDownloadingMap(prev => ({ ...prev, [book.id]: 2 }));
    try {
      const res = await downloadBookInApp(book, (pct) => {
        setDownloadingMap(prev => ({ ...prev, [book.id]: pct }));
      });

      if (res.success && res.record) {
        playSuccessChime();
        setOfflineBookIds(prev => new Set([...prev, book.id]));
        showToast(
          language === 'am' 
            ? `✓ "${book.title}" በተሳካ ሁኔታ ወርዷል! አሁን ያለ ኢንተርኔት ከመስመር ውጭ ማንበብ ይችላሉ።` 
            : `✓ "${book.title}" downloaded! Available for 100% offline study.`
        );

        // If this book is active in the reader, activate offline blob immediately!
        if (activePdfBook?.id === book.id) {
          const blobUrl = URL.createObjectURL(res.record.pdfBlob);
          setActiveOfflineRecord(res.record);
          setActiveOfflineBlobUrl(blobUrl);
        }
      } else {
        showToast(
          language === 'am'
            ? `ማውረድ አልተሳካም (${res.error || 'ስህተት'})። እባክዎ እንደገና ይሞክሩ።`
            : `Download failed (${res.error || 'Error'}). Please try again.`
        );
      }
    } catch {
      showToast(
        language === 'am' ? 'የማውረድ ስህተት አጋጥሟል። እባክዎ እንደገና ይሞክሩ።' : 'Download error. Please try again.'
      );
    } finally {
      setDownloadingMap(prev => {
        const next = { ...prev };
        delete next[book.id];
        return next;
      });
    }
  };

  const handleDeleteOffline = async (bookId: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playClickChime();
    await deleteOfflineBook(bookId);
    setOfflineBookIds(prev => {
      const next = new Set(prev);
      next.delete(bookId);
      return next;
    });
    if (activePdfBook?.id === bookId) {
      if (activeOfflineBlobUrl) {
        URL.revokeObjectURL(activeOfflineBlobUrl);
        setActiveOfflineBlobUrl(null);
      }
      setActiveOfflineRecord(null);
    }
    showToast(
      language === 'am'
        ? `"${title}" ከመሳሪያዎ ተሰርዟል።`
        : `"${title}" removed from offline storage.`
    );
  };

  const handleOpenBook = async (
    book: UnifiedBookItem, 
    chapterIdx: number = 0, 
    defaultTab: 'drive' | 'video' | 'cover' | 'notes' = 'drive',
    lectureIdx: number = 0,
    startInFullPage: boolean = true
  ) => {
    // Biology videos are 100% Free! All other courses require Pro for video playback
    if (defaultTab === 'video' && !isProUser && !book.isVideoFree) {
      playClickChime();
      setProVideoModalBook(book);
      return;
    }

    playClickChime();
    setActivePdfBook(book);
    setActiveChapterIndex(chapterIdx);
    setActiveLectureIndex(lectureIdx);
    setReaderTab(defaultTab);
    setCoverZoom(100);
    setCoverInfoOpen(false);
    setSearchInDoc('');
    setAiPanelOpen(false);
    setAiMode(null);
    setQuizAnswers({});
    setIsZenMode(defaultTab === 'drive' ? true : startInFullPage);
    onStudyAction();

    // Check offline storage for cached PDF
    try {
      const offlineRec = await getOfflineBook(book.id);
      if (offlineRec && offlineRec.pdfBlob) {
        setActiveOfflineRecord(offlineRec);
        const blobUrl = URL.createObjectURL(offlineRec.pdfBlob);
        setActiveOfflineBlobUrl(blobUrl);
      } else {
        setActiveOfflineRecord(null);
        if (activeOfflineBlobUrl) {
          URL.revokeObjectURL(activeOfflineBlobUrl);
          setActiveOfflineBlobUrl(null);
        }
      }
    } catch {
      setActiveOfflineRecord(null);
    }
  };

  const handleCloseBook = () => {
    playClickChime();
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsTrueFullscreen(false);
    setIsZenMode(false);
    if (activeOfflineBlobUrl) {
      URL.revokeObjectURL(activeOfflineBlobUrl);
      setActiveOfflineBlobUrl(null);
    }
    setActiveOfflineRecord(null);
    setActivePdfBook(null);
    setCoverModalBook(null);
  };
  const handleClosePdf = handleCloseBook;

  // 🔄 Sync reader back navigation with browser history, Android gesture & Telegram BackButton
  useEffect(() => {
    if (!activePdfBook) return;

    // Push state so device hardware back button or swipe-back closes the reader
    window.history.pushState({ ethioLearnBookOpen: true }, '');

    const handlePopState = () => {
      handleCloseBook();
    };
    window.addEventListener('popstate', handlePopState);

    // Telegram WebApp native BackButton integration
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleCloseBook);
    }

    // Physical Escape key on keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZenMode) {
          setIsZenMode(false);
        } else {
          handleCloseBook();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (tg?.BackButton) {
        tg.BackButton.offClick(handleCloseBook);
        tg.BackButton.hide();
      }
    };
  }, [activePdfBook, isZenMode]);

  const currentChapterTitle = activePdfBook?.chapters[activeChapterIndex] || 'Chapter 1';
  const currentChapterContent = useMemo(() => {
    if (!activePdfBook) return null;
    const modId = activePdfBook.originalModule?.id || activePdfBook.id;
    return getChapterContent(modId, currentChapterTitle);
  }, [activePdfBook, currentChapterTitle]);

  const currentLecture = useMemo(() => {
    if (!activePdfBook || !activePdfBook.lectures || activePdfBook.lectures.length === 0) return null;
    return activePdfBook.lectures[activeLectureIndex] || activePdfBook.lectures[0] || null;
  }, [activePdfBook, activeLectureIndex]);

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
            { id: 'exams', label: language === 'am' ? 'አጋማሽና ማጠቃለያ ፈተናዎች (Exams)' : 'Mid & Final Exams (Videos)', icon: '📝' },
            { id: 'downloaded', label: language === 'am' ? `ከመስመር ውጭ (${offlineBookIds.size})` : `Offline Ready (${offlineBookIds.size})`, icon: '📥', isOfflineBadge: true },
            { id: 'videos', label: language === 'am' ? `ቪዲዮ ትምህርቶች (${unifiedBooks.filter(b => b.hasVideoLecture).length})` : `Video Lectures (${unifiedBooks.filter(b => b.hasVideoLecture).length})`, icon: '🎥' },
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
                    ? tab.id === 'downloaded' 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                      : 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : tab.id === 'downloaded' && offlineBookIds.size > 0
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60'
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

        {/* Offline Alert Ribbon */}
        {!isOnline && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {language === 'am'
                  ? `ከመስመር ውጭ (Offline) ሁነታ ላይ ነዎት። የወረዱ ${offlineBookIds.size} መጽሐፍትን ያለ ኢንተርኔት ማንበብ ይችላሉ።`
                  : `You are offline. Showing ${offlineBookIds.size} downloaded textbooks ready to read with zero data.`}
              </span>
            </div>
            <button
              onClick={() => setSelectedStream('downloaded')}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shrink-0 cursor-pointer text-[11px]"
            >
              {language === 'am' ? 'የወረዱትን እይ' : 'View Offline'}
            </button>
          </div>
        )}
      </div>

      {/* Floating Status Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-[999999] bg-[#078930] text-white px-4 py-3 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
      ) : selectedStream === 'exams' ? (
        /* 📝 EXAM TAB: MID & FINAL EXAM WALKTHROUGH VIDEOS GALLERY */
        <div className="space-y-4">
          {/* Top Banner for Exams */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111C35] via-[#152345] to-[#1E293B] border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {language === 'am' ? 'የዩኒቨርሲቲ አጋማሽና ማጠቃለያ ፈተናዎች ቪዲዮ መፍትሔ' : 'University Mid & Final Exam Solution Videos'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {language === 'am' ? 'ወርሃዊ 99 ብር' : 'Monthly 99 ETB'}
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {language === 'am'
                  ? 'የኢትዮጵያ ዩኒቨርሲቲዎች የአጋማሽ (Midterm) እና የማጠቃለያ (Final) ፈተናዎች ደረጃ-በደረጃ የቪዲዮ ትንታኔ እና የሞዴል ፈተና ልምምድ።'
                  : 'Watch comprehensive video explanations and worked solutions for official Midterm & Final examination papers by university instructors.'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{language === 'am' ? '1 ነፃ የሙከራ ኮርስ ክፍት ነው (Critical Thinking)' : '1 Free Trial Course (Critical Thinking)'}</span>
                </span>
                <span className="text-slate-400">
                  {isProUser ? '✓ ' + (language === 'am' ? 'ሙሉ አገልግሎት ተከፍቷል' : 'Full Access Subscribed') : (language === 'am' ? 'የወርሃዊ ፓስ፡ 99 ብር በወር' : 'Monthly Pass: 99 ETB / Month')}
                </span>
              </div>
            </div>

            {!isProUser && (
              <button
                onClick={() => { playClickChime(); onNavigate('upgrade'); }}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                <span>{language === 'am' ? 'በ99 ብር ተመዝገብ' : 'Subscribe 99 ETB/mo'}</span>
              </button>
            )}
          </div>

          {/* Grid of Courses with Mid & Final Exam Solution Videos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => {
              const isTrial = isFreeTrialCourse(book);
              const isAccessible = isTrial || isProUser;

              return (
                <div
                  key={`exam_card_${book.id}`}
                  className={`p-4 rounded-2xl bg-[#111C35] border transition-all duration-200 flex flex-col justify-between gap-3 shadow-lg ${
                    isTrial 
                      ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          {book.code} • {book.semester}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate mt-0.5">
                          {language === 'am' && book.amharicTitle ? book.amharicTitle : book.title}
                        </h4>
                      </div>

                      {isTrial ? (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{language === 'am' ? 'ነፃ ሙከራ' : 'Free Trial'}</span>
                        </span>
                      ) : !isProUser ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>99 ETB</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                          ✓ Pro
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-2">
                      {language === 'am' && book.amharicDescription ? book.amharicDescription : book.description}
                    </p>
                  </div>

                  {/* Mid & Final Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Midterm Video Button */}
                      <button
                        onClick={() => {
                          playClickChime();
                          if (!isAccessible) {
                            setMonthlyExamSubscriptionModalOpen(book);
                          } else {
                            setSelectedCourseForDetail(book);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isAccessible
                            ? 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300'
                            : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300'
                        }`}
                        title="Watch Midterm Solution Video"
                      >
                        {isAccessible ? (
                          <>
                            <Play className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                            <span className="truncate">Midterm Video</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">Midterm (99 ETB)</span>
                          </>
                        )}
                      </button>

                      {/* Final Exam Video Button */}
                      <button
                        onClick={() => {
                          playClickChime();
                          if (!isAccessible) {
                            setMonthlyExamSubscriptionModalOpen(book);
                          } else {
                            setSelectedCourseForDetail(book);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isAccessible
                            ? 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300'
                            : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300'
                        }`}
                        title="Watch Final Exam Solution Video"
                      >
                        {isAccessible ? (
                          <>
                            <Play className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                            <span className="truncate">Final Video</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">Final (99 ETB)</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Take Quiz Drill */}
                      <button
                        onClick={() => {
                          playClickChime();
                          setSelectedCourseForDetail(book);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>{language === 'am' ? 'ፈተና ጀምር' : 'Start Exam Quiz'}</span>
                      </button>

                      {/* Read PDF */}
                      <button
                        onClick={() => handleOpenBook(book, 0, 'drive', 0, true)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'covers' ? (
        /* 🖼️ VIEW MODE 1: DIGITAL BOOKSHELF GALLERY (WITH AUTHENTIC COVER PAGES) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {filteredBooks.map(book => {
            const isFav = favoriteIds.includes(book.id);

            return (
              <div
                key={book.id}
                onClick={() => handleOpenBook(book, 0, 'drive', 0, true)}
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

                  {/* Bottom Right: Quick Full-Page Cover Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBook(book, 0, 'cover');
                    }}
                    className="absolute bottom-11 right-2 z-10 p-1.5 rounded-lg bg-black/75 hover:bg-amber-500 hover:text-slate-950 text-amber-300 backdrop-blur-sm transition-all cursor-pointer shadow-md border border-white/10"
                    title={language === 'am' ? 'ሙሉ የሽፋን ገጽ እይ / Full Page Cover' : 'View Full Page Cover'}
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
                    {book.hasVideoLecture && (
                      <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                        <Play className="w-2.5 h-2.5 fill-amber-400" />
                        <span>{book.lectures.length} Lectures</span>
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
                  {book.hasVideoLecture && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBook(book, 0, 'video');
                      }}
                      className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98 cursor-pointer"
                      title={language === 'am' ? 'የቪዲዮ ትምህርቶች እይ' : 'Watch Video Lectures'}
                    >
                      <Play className="w-3 h-3 fill-slate-950 shrink-0" />
                      <span className="truncate">{language === 'am' ? 'ቪዲዮ ትምህርት እይ' : 'Watch Lectures'} ({book.lectures.length})</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickChime();
                      setSelectedCourseForDetail(book);
                    }}
                    className="w-full py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[10.5px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    title={language === 'am' ? 'የአጋማሽ እና ማጠቃለያ ፈተና ቪዲዮዎች' : 'Mid & Final Exam Solution Videos'}
                  >
                    <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{language === 'am' ? 'ፈተናዎች እና ቪዲዮ' : 'Mid & Final Exams'}</span>
                  </button>

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
                        handleOpenBook(book, 0, 'drive', 0, true);
                      }}
                      className={`py-1.5 px-1 font-black text-[10.5px] rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer ${
                        offlineBookIds.has(book.id)
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                      title={offlineBookIds.has(book.id) ? (language === 'am' ? 'ሙሉ ገጽ ከመስመር ውጭ አንብብ' : 'Read Full Page Offline') : (language === 'am' ? 'ሙሉ ገጽ ፒዲኤፍ አንብብ' : 'Read Full Page PDF')}
                    >
                      <Maximize2 className="w-3 h-3 text-slate-950 shrink-0" />
                      <span className="truncate">{offlineBookIds.has(book.id) ? (language === 'am' ? 'ከመስመር ውጭ' : 'Offline') : (language === 'am' ? 'ሙሉ ገጽ' : 'Full Page')}</span>
                    </button>

                    {downloadingMap[book.id] !== undefined ? (
                      <div className="py-1.5 px-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-[10px] rounded-lg flex flex-col items-center justify-center gap-0.5">
                        <div className="flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          <span>{downloadingMap[book.id]}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-400 h-full transition-all duration-200" 
                            style={{ width: `${downloadingMap[book.id]}%` }}
                          />
                        </div>
                      </div>
                    ) : offlineBookIds.has(book.id) ? (
                      <button
                        onClick={(e) => handleDeleteOffline(book.id, book.title, e)}
                        className="py-1.5 px-1 bg-emerald-950/80 hover:bg-red-950/80 text-emerald-400 hover:text-red-300 font-bold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 border border-emerald-500/40 hover:border-red-500/40 cursor-pointer group/off"
                        title={language === 'am' ? 'ከመስመር ውጭ ወርዷል (ለመሰረዝ ጠቅ ያድርጉ)' : 'Downloaded offline (Click to delete file)'}
                      >
                        <Check className="w-3 h-3 group-hover/off:hidden" />
                        <Trash2 className="w-3 h-3 hidden group-hover/off:inline text-red-400" />
                        <span className="truncate group-hover/off:hidden">{language === 'am' ? 'ወርዷል' : 'Ready'}</span>
                        <span className="truncate hidden group-hover/off:inline">{language === 'am' ? 'ሰርዝ' : 'Remove'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleDownloadBook(book, e)}
                        className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 font-bold text-[10.5px] rounded-lg transition-all flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                        title={language === 'am' ? 'በመተግበሪያው ውስጥ አውርድ (ያለ ኢንተርኔት ለማንበብ)' : 'Download in app for offline study'}
                      >
                        <CloudDownload className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{language === 'am' ? 'አውርድ' : 'Save'}</span>
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
                onClick={() => handleOpenBook(book, 0, 'drive', 0, true)}
                className="group relative p-4 rounded-2xl bg-[#111C35] border border-slate-800/90 hover:border-amber-400/40 hover:bg-[#14213F] transition-all flex flex-col justify-between gap-3 text-left cursor-pointer shadow-md hover:shadow-lg"
              >
                {/* Top: Cover Thumbnail + Metadata */}
                <div className="flex items-start gap-3.5">
                  {/* Cover Page Thumbnail */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBook(book, 0, 'cover');
                    }}
                    className="w-20 h-28 sm:w-22 sm:h-30 rounded-lg overflow-hidden border border-slate-700/80 shrink-0 shadow-md group-hover:border-amber-400/60 transition-colors relative select-none bg-slate-900 group/cover cursor-zoom-in"
                    title={language === 'am' ? 'ሙሉ የሽፋን ገጽ እይ / Full Page Cover' : 'Click to inspect full page cover'}
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
                <div className="space-y-1.5 pt-1">
                  {book.hasVideoLecture && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBook(book, 0, 'video');
                      }}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98 cursor-pointer"
                      title={language === 'am' ? 'የቪዲዮ ትምህርቶች እይ' : 'Watch Video Lectures'}
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
                      <span>{language === 'am' ? 'ቪዲዮ ትምህርት እይ' : 'Watch Video Lectures'} ({book.lectures.length})</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickChime();
                      setSelectedCourseForDetail(book);
                    }}
                    className="w-full py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    title={language === 'am' ? 'የአጋማሽ እና ማጠቃለያ ፈተና ቪዲዮዎች' : 'Mid & Final Exam Solution Videos'}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{language === 'am' ? 'አጋማሽና ማጠቃለያ ፈተናዎች (ቪዲዮ)' : 'Mid & Final Exams (Videos)'}</span>
                  </button>

                  <div className="grid grid-cols-3 gap-1.5">
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
                      handleOpenBook(book, 0, 'drive', 0, true);
                    }}
                    className={`w-full py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98 shadow-sm ${
                      offlineBookIds.has(book.id)
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-slate-950" />
                    <span>{offlineBookIds.has(book.id) ? (language === 'am' ? 'ሙሉ ገጽ ከመስመር ውጭ' : 'Offline Full Page') : (language === 'am' ? 'ሙሉ ገጽ አንብብ' : 'Read Full Page')}</span>
                  </button>

                  {downloadingMap[book.id] !== undefined ? (
                    <div className="w-full py-2 px-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{downloadingMap[book.id]}%</span>
                    </div>
                  ) : offlineBookIds.has(book.id) ? (
                    <button
                      onClick={(e) => handleDeleteOffline(book.id, book.title, e)}
                      className="w-full py-2 bg-emerald-950/80 hover:bg-red-950/80 text-emerald-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 border border-emerald-500/40 hover:border-red-500/40 cursor-pointer group/offlist"
                      title={language === 'am' ? 'ከመስመር ውጭ ወርዷል (ለመሰረዝ ጠቅ ያድርጉ)' : 'Downloaded offline (Click to delete)'}
                    >
                      <Check className="w-3.5 h-3.5 group-hover/offlist:hidden" />
                      <Trash2 className="w-3.5 h-3.5 hidden group-hover/offlist:inline text-red-400" />
                      <span className="group-hover/offlist:hidden">{language === 'am' ? 'ወርዷል' : 'Ready'}</span>
                      <span className="hidden group-hover/offlist:inline">{language === 'am' ? 'ሰርዝ' : 'Remove'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleDownloadBook(book, e)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      title={language === 'am' ? 'በመተግበሪያው ውስጥ አውርድ' : 'Download in app'}
                    >
                      <CloudDownload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'am' ? 'አውርድ' : 'Download'}</span>
                    </button>
                  )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📖 FULLSCREEN IN-APP PDF READER MODAL (Portaled to document.body)          */}
      {/* ========================================================================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activePdfModule && (
            <motion.div
              ref={readerContainerRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999999] w-screen h-[100dvh] max-h-[100dvh] p-0 m-0 border-0 rounded-none flex flex-col select-none overflow-hidden bg-black"
              style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`w-full h-full flex-1 flex flex-col overflow-hidden border-0 rounded-none relative ${
                  readerTheme === 'light'
                    ? 'bg-[#FFFFFF] text-slate-900'
                    : readerTheme === 'sepia'
                    ? 'bg-[#FAF3E0] text-[#2C2014]'
                    : 'bg-[#0A1128] text-slate-100'
                }`}
              >
                {/* 🌟 1. FOCUS MODE FLOATING PILL (Positioned at TOP-LEFT) */}
                {/* Leaves Google Drive's native top-right pop-out button COMPLETELY clear! */}
                {isZenMode && (
                  <div className="absolute top-3 left-3 sm:left-4 z-[1000000] flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-xl px-3 py-1.5 rounded-full border border-amber-500/50 shadow-2xl text-white select-none">
                    <button
                      type="button"
                      onClick={handleCloseBook}
                      className="p-1 rounded-full bg-white/10 hover:bg-red-500/30 text-slate-300 hover:text-red-300 transition-colors cursor-pointer"
                      title={language === 'am' ? 'ዝጋ' : 'Close'}
                      aria-label="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-3 w-px bg-white/20" />

                    <span className="text-[11px] font-bold text-slate-200 max-w-[120px] sm:max-w-[180px] truncate">
                      {activePdfModule.title}
                    </span>

                    <div className="h-3 w-px bg-white/20" />

                    <button
                      type="button"
                      onClick={() => { playClickChime(); setIsZenMode(false); }}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title={language === 'am' ? 'መሳሪያዎችን አሳይ' : 'Exit Focus (Show Tools)'}
                    >
                      <Minimize2 className="w-3 h-3 text-amber-400" />
                      <span>{language === 'am' ? 'መሳሪያዎች' : 'Tools'}</span>
                    </button>

                    {activePdfModule.pdfUrl && (
                      <a
                        href={activePdfModule.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playSuccessChime()}
                        className="p-1 rounded-full hover:bg-white/10 text-amber-400 transition-colors"
                        title="Open in Google Drive App"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* 🌟 2. UNIFIED REDESIGNED TOP BAR (Clean, Single Line, Responsive) */}
                {!isZenMode && (
                  <header
                    className={`h-14 sm:h-16 px-2.5 sm:px-4 border-b flex items-center justify-between gap-2 shrink-0 z-30 transition-colors backdrop-blur-md ${
                      readerTheme === 'light'
                        ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
                        : readerTheme === 'sepia'
                        ? 'bg-[#F4EBD9]/95 border-[#E2D5B8] text-[#362719] shadow-xs'
                        : 'bg-[#0F172A]/95 border-slate-800 text-slate-100 shadow-md'
                    }`}
                  >
                    {/* LEFT: Course Code & Title */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                          <span className="font-bold text-amber-500 font-mono">
                            {activePdfModule.code}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">
                            {activePdfModule.stream || (language === 'am' ? 'ሞጁል' : 'Module')}
                          </span>
                        </div>
                        <h1 className="text-xs sm:text-sm font-bold truncate leading-tight tracking-tight">
                          {activePdfModule.title}
                        </h1>
                      </div>
                    </div>

                    {/* CENTER: Clean Mode Switcher (If video lectures exist) */}
                    {activePdfModule.lectures && activePdfModule.lectures.length > 0 && (
                      <div className={`hidden md:flex items-center p-0.5 rounded-xl border ${
                        readerTheme === 'light'
                          ? 'bg-slate-100 border-slate-200'
                          : readerTheme === 'sepia'
                          ? 'bg-[#EADECE] border-[#D5C5B0]'
                          : 'bg-slate-800 border-slate-700'
                      }`}>
                        <button
                          type="button"
                          onClick={() => { playClickChime(); setReaderTab('drive'); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            readerTab === 'drive'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{language === 'am' ? 'ፒዲኤፍ አንብብ' : 'Read PDF'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { playClickChime(); setReaderTab('video'); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            readerTab === 'video'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{language === 'am' ? 'ቪዲዮ' : 'Lectures'}</span>
                          <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                            readerTab === 'video' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {activePdfModule.lectures.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { playClickChime(); setReaderTab('exams'); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            readerTab === 'exams'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{language === 'am' ? 'ፈተናዎች' : 'Exams'}</span>
                        </button>
                      </div>
                    )}

                    {/* RIGHT: Production Action Controls */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      {/* ⚡ Open in Google Drive App */}
                      {activePdfModule.pdfUrl && (
                        <a
                          href={activePdfModule.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => playSuccessChime()}
                          className="px-2.5 sm:px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                          title={language === 'am' ? 'በGoogle Drive መተግበሪያ ክፈት' : 'Open in Google Drive App'}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Drive App</span>
                        </a>
                      )}

                      {/* 🌙 Reading Theme Switcher (Slate / Sepia / Light) */}
                      <div className={`hidden sm:flex items-center p-0.5 rounded-xl border ${
                        readerTheme === 'light'
                          ? 'bg-slate-100 border-slate-200'
                          : readerTheme === 'sepia'
                          ? 'bg-[#EADECE] border-[#D5C5B0]'
                          : 'bg-slate-800 border-slate-700'
                      }`}>
                        <button
                          type="button"
                          onClick={() => { playClickChime(); setReaderTheme('dark'); }}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                            readerTheme === 'dark'
                              ? 'bg-[#0A1128] text-amber-400 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Dark Slate Theme"
                        >
                          <Moon className="w-3 h-3" />
                          <span>Dark</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { playClickChime(); setReaderTheme('sepia'); }}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                            readerTheme === 'sepia'
                              ? 'bg-[#FAF3E0] text-[#362719] shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Warm Sepia Paper Theme"
                        >
                          <Coffee className="w-3 h-3" />
                          <span>Sepia</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { playClickChime(); setReaderTheme('light'); }}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                            readerTheme === 'light'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Crisp Light Theme"
                        >
                          <Sun className="w-3 h-3" />
                          <span>Light</span>
                        </button>
                      </div>

                      {/* Mobile theme toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          playClickChime();
                          setReaderTheme((prev) => prev === 'dark' ? 'sepia' : prev === 'sepia' ? 'light' : 'dark');
                        }}
                        className="sm:hidden p-2 rounded-xl hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                        title="Switch Reading Theme"
                      >
                        {readerTheme === 'dark' ? (
                          <Moon className="w-4 h-4 text-amber-400" />
                        ) : readerTheme === 'sepia' ? (
                          <Coffee className="w-4 h-4 text-[#7A5A38]" />
                        ) : (
                          <Sun className="w-4 h-4 text-amber-500" />
                        )}
                      </button>

                      {/* 📥 Download / Offline Button */}
                      {downloadingMap[activePdfBook.id] !== undefined ? (
                        <div className="px-2.5 py-1.5 bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1 border border-amber-500/30">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{downloadingMap[activePdfBook.id]}%</span>
                        </div>
                      ) : activeOfflineBlobUrl ? (
                        <div className="px-2.5 py-1.5 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-1 border border-emerald-500/30">
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">{language === 'am' ? 'ከመስመር ውጭ ዝግጁ' : 'Offline'}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDownloadBook(activePdfBook)}
                          className={`hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            readerTheme === 'light'
                              ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                              : readerTheme === 'sepia'
                              ? 'bg-[#EADECE] hover:bg-[#DDD0C0] border-[#D5C5B0] text-[#3A2A1A]'
                              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white'
                          }`}
                          title={language === 'am' ? 'ሰነዱን አውርድ' : 'Download for Offline Reading'}
                        >
                          <CloudDownload className="w-3.5 h-3.5 text-amber-500" />
                          <span className="hidden md:inline">Download</span>
                        </button>
                      )}

                      {/* 🔄 Reload Iframe */}
                      <button
                        type="button"
                        onClick={() => { playClickChime(); setPdfIframeKey((k) => k + 1); }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          readerTheme === 'light'
                            ? 'hover:bg-slate-100 border-slate-200 text-slate-600'
                            : readerTheme === 'sepia'
                            ? 'hover:bg-[#EADECE] border-[#D5C5B0] text-[#4A3828]'
                            : 'hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title={language === 'am' ? 'እንደገና ጫን' : 'Reload'}
                      >
                        <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      {/* 🎯 Focus Mode Toggle (Hide Bars for 100% Reading immersion) */}
                      <button
                        type="button"
                        onClick={() => { playClickChime(); setIsZenMode(true); }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          readerTheme === 'light'
                            ? 'hover:bg-slate-100 border-slate-200 text-slate-600'
                            : readerTheme === 'sepia'
                            ? 'hover:bg-[#EADECE] border-[#D5C5B0] text-[#4A3828]'
                            : 'hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title={language === 'am' ? 'ሙሉ ገጽ የንባብ እይታ (Focus Mode)' : 'Focus Mode (Hide Top Bar)'}
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                      </button>

                      {/* ⛶ Hardware Fullscreen Toggle */}
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className={`hidden sm:flex p-2 rounded-xl border transition-all cursor-pointer ${
                          readerTheme === 'light'
                            ? 'hover:bg-slate-100 border-slate-200 text-slate-700'
                            : readerTheme === 'sepia'
                            ? 'hover:bg-[#EADECE] border-[#D5C5B0] text-[#4A3828]'
                            : 'hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title={isTrueFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                      >
                        {isTrueFullscreen ? (
                          <Minimize2 className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Maximize2 className="w-4 h-4 text-amber-500" />
                        )}
                      </button>

                      {/* ✕ Close Button */}
                      <button
                        type="button"
                        onClick={handleCloseBook}
                        className="p-2 rounded-xl hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        title={language === 'am' ? 'ዝጋ' : 'Close'}
                        aria-label="Close"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </header>
                )}

              {/* 2. MAIN STAGE CONTENT (Edge-to-edge, responsive per tab) */}
              <div className="flex-1 w-full h-full min-h-0 flex flex-col relative overflow-hidden">
                
                {/* ================================================================= */}
                {/* TAB 1: 🖼️ AUTHENTIC TEXTBOOK COVER PAGE (TRUE FULL PAGE VIEW, NO CUT) */}
                {/* ================================================================= */}
                {readerTab === 'cover' && (
                  <div className={`flex-1 w-full h-full min-h-0 flex flex-col relative overflow-hidden transition-colors animate-fadeIn ${
                    readerTheme === 'light'
                      ? 'bg-[#E2E8F0]'
                      : readerTheme === 'sepia'
                      ? 'bg-[#E8DCBF]'
                      : 'bg-[#050A18]'
                  }`}>
                    {/* Top Cover Sub-Toolbar */}
                    <div className={`px-3 sm:px-4 py-2 border-b flex items-center justify-between gap-2 shrink-0 text-xs transition-colors z-20 ${
                      readerTheme === 'light'
                        ? 'bg-white border-slate-300 text-slate-800'
                        : readerTheme === 'sepia'
                        ? 'bg-[#F2E5C7] border-[#DFCFAB] text-[#332211]'
                        : 'bg-[#0B132B] border-white/10 text-slate-200'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-bold truncate max-w-[140px] sm:max-w-xs">
                          {language === 'am' ? 'ሙሉ የሽፋን ገጽ' : 'Full Page Cover'}
                        </span>
                        <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 font-bold shrink-0">
                          100% Uncut Authentic Document
                        </span>
                      </div>

                      {/* Cover Zoom & Display Controls */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Zoom Controls */}
                        <div className={`flex items-center rounded-lg p-0.5 border text-xs ${
                          readerTheme === 'light'
                            ? 'bg-slate-100 border-slate-300'
                            : readerTheme === 'sepia'
                            ? 'bg-[#E3D4B3] border-[#CCBD99]'
                            : 'bg-white/5 border-white/10'
                        }`}>
                          <button
                            onClick={() => { playClickChime(); setCoverZoom(prev => Math.max(50, prev - 25)); }}
                            className="p-1 hover:text-amber-500 transition-colors cursor-pointer"
                            title="Zoom Out (-)"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { playClickChime(); setCoverZoom(100); }}
                            className="px-2 py-0.5 font-mono text-[11px] font-bold hover:text-amber-500 transition-colors cursor-pointer"
                            title="Reset to Fit Page (100%)"
                          >
                            {coverZoom}%
                          </button>
                          <button
                            onClick={() => { playClickChime(); setCoverZoom(prev => Math.min(250, prev + 25)); }}
                            className="p-1 hover:text-amber-500 transition-colors cursor-pointer"
                            title="Zoom In (+)"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Course Info Toggle */}
                        <button
                          onClick={() => { playClickChime(); setCoverInfoOpen(o => !o); }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                            coverInfoOpen
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                              : readerTheme === 'light'
                              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                              : readerTheme === 'sepia'
                              ? 'bg-[#FAF3E0] hover:bg-[#F2E5C7] border-[#DECFAF] text-[#332211]'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                          }`}
                          title="Course Syllabus Details"
                        >
                          <Info className="w-3.5 h-3.5 text-amber-500" />
                          <span className="hidden sm:inline">{language === 'am' ? 'የኮርስ ዝርዝር' : 'Course Specs'}</span>
                        </button>

                        {/* Read Official PDF Action */}
                        <button
                          onClick={() => { playClickChime(); setReaderTab('drive'); }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-md transition-all active:scale-95"
                          title="Read Official PDF"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-950" />
                          <span>{language === 'am' ? 'ፒዲኤፍ አንብብ' : 'Read PDF'}</span>
                        </button>

                        {/* Download if available */}
                        {activePdfBook.downloadUrl && (
                          <a
                            href={activePdfBook.downloadUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer hidden xs:flex items-center justify-center ${
                              readerTheme === 'light'
                                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                                : readerTheme === 'sepia'
                                ? 'bg-[#FAF3E0] hover:bg-[#F2E5C7] border-[#DECFAF] text-[#332211]'
                                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                            }`}
                            title="Download PDF File"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-500" />
                          </a>
                        )}

                        {/* Drive Link */}
                        {activePdfBook.pdfUrl && (
                          <a
                            href={activePdfBook.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer hidden xs:flex items-center justify-center ${
                              readerTheme === 'light'
                                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                                : readerTheme === 'sepia'
                                ? 'bg-[#FAF3E0] hover:bg-[#F2E5C7] border-[#DECFAF] text-[#332211]'
                                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                            }`}
                            title="Open Google Drive Link in New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Canvas: True Full Page Document (Edge to edge, Uncut, Zero cropping) */}
                    <div className="flex-1 w-full h-full min-h-0 flex overflow-hidden relative">
                      <div className="flex-1 w-full h-full min-h-0 overflow-auto p-2 sm:p-4 md:p-6 flex items-center justify-center select-none">
                        <div 
                          className="transition-transform duration-200 flex items-center justify-center max-w-full max-h-full"
                          style={{
                            transform: coverZoom !== 100 ? `scale(${coverZoom / 100})` : 'none',
                            transformOrigin: 'center center'
                          }}
                        >
                          <img
                            src={activePdfBook.coverUrl}
                            alt={activePdfBook.title}
                            className="max-h-[calc(100dvh-130px)] max-w-full w-auto h-auto object-contain rounded-md shadow-2xl border border-black/20 select-none block drop-shadow-2xl"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&q=80';
                            }}
                          />
                        </div>
                      </div>

                      {/* Slide-over Course Info Drawer */}
                      <AnimatePresence>
                        {coverInfoOpen && (
                          <motion.aside
                            initial={{ x: 320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 320, opacity: 0 }}
                            className={`w-72 sm:w-80 border-l p-4 overflow-y-auto shrink-0 shadow-2xl z-20 text-left flex flex-col justify-between ${
                              readerTheme === 'light'
                                ? 'bg-white border-slate-300 text-slate-900'
                                : readerTheme === 'sepia'
                                ? 'bg-[#FDF7E8] border-[#DFCFAB] text-[#332211]'
                                : 'bg-[#0B132B] border-white/10 text-slate-100'
                            }`}
                          >
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                                    {activePdfBook.code}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    {activePdfBook.stream}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setCoverInfoOpen(false)}
                                  className="p-1 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-white cursor-pointer"
                                  title="Close Info"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div>
                                <h3 className="text-base font-black leading-snug">
                                  {activePdfBook.title}
                                </h3>
                                {activePdfBook.amharicTitle && (
                                  <h4 className="text-xs font-bold text-amber-500 mt-0.5">
                                    {activePdfBook.amharicTitle}
                                  </h4>
                                )}
                              </div>

                              <p className={`text-xs leading-relaxed ${
                                readerTheme === 'light' ? 'text-slate-600' : readerTheme === 'sepia' ? 'text-[#4A3828]' : 'text-slate-300'
                              }`}>
                                {language === 'am' ? activePdfBook.amharicDescription : activePdfBook.description}
                              </p>

                              <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl border text-xs ${
                                readerTheme === 'light'
                                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                                  : readerTheme === 'sepia'
                                  ? 'bg-[#FAF3E0] border-[#DECFAF] text-[#332211]'
                                  : 'bg-white/5 border-white/10 text-slate-300'
                              }`}>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                                  <span className="font-medium truncate block">{activePdfBook.subject}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Semester</span>
                                  <span className="font-medium">{activePdfBook.semester}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Credit Hours</span>
                                  <span className="text-amber-500 font-bold">{activePdfBook.creditHours} Cr</span>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Page Count</span>
                                  <span className="font-medium">~{activePdfBook.pages} Pages</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 space-y-2">
                              <button
                                onClick={() => {
                                  playClickChime();
                                  setCoverInfoOpen(false);
                                  setReaderTab('drive');
                                }}
                                className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                              >
                                <Eye className="w-4 h-4 text-slate-950" />
                                <span>{language === 'am' ? 'ኦፊሴላዊ ፒዲኤፍ አንብብ' : 'Read Official PDF'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  playClickChime();
                                  setCoverInfoOpen(false);
                                  setReaderTab('notes');
                                }}
                                className={`w-full py-2 px-3 font-semibold text-xs rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                  readerTheme === 'light'
                                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                    : readerTheme === 'sepia'
                                    ? 'bg-[#FAF3E0] hover:bg-[#F2E5C7] text-[#332211] border-[#DECFAF]'
                                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
                                }`}
                              >
                                <Layers className="w-3.5 h-3.5 text-amber-500" />
                                <span>{language === 'am' ? 'የምዕራፍ ማስታወሻዎች' : 'Units & Notes'}</span>
                              </button>
                            </div>
                          </motion.aside>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* ================================================================= */}
                {/* TAB 2: 📄 PROFESSIONAL MOBILE-FRIENDLY PDF READER (EDGE-TO-EDGE)  */}
                {/* ================================================================= */}
                {readerTab === 'drive' && (
                  <div className="flex-1 w-full h-full min-h-0 flex flex-col relative overflow-hidden animate-fadeIn">
                    {/* 1. Offline Mode: Read direct from indexedDB Blob */}
                    {activeOfflineBlobUrl ? (
                      <MobilePdfReader
                        fileUrl={activeOfflineBlobUrl}
                        title={activePdfBook.title}
                        courseCode={activePdfBook.code}
                        initialTotalPages={activePdfBook.pages}
                        theme={readerTheme}
                        language={language}
                        isOffline={true}
                        externalUrl={activePdfBook.pdfUrl}
                        onClose={handleCloseBook}
                      />
                    ) : pdfViewerMode === 'mobile-native' ? (
                      /* 2. Professional PDF.js Full-bleed Vector Reader */
                      <div className="flex-1 w-full h-full min-h-0 relative flex flex-col">
                        <MobilePdfReader
                          fileUrl={`/api/books/download-pdf?id=${encodeURIComponent(activePdfBook.id)}&fileId=${encodeURIComponent((activePdfBook as any).googleDriveFileId || activePdfBook.originalModule?.googleDriveFileId || activePdfBook.fileId || extractDriveFileId(activePdfBook.downloadUrl || activePdfBook.pdfUrl) || '')}`}
                          title={activePdfBook.title}
                          courseCode={activePdfBook.code}
                          initialTotalPages={activePdfBook.pages}
                          theme={readerTheme}
                          language={language}
                          isOffline={false}
                          externalUrl={activePdfBook.pdfUrl}
                          onClose={handleCloseBook}
                        />

                        {/* Optional Quick Switcher fallback capsule */}
                        <div className="absolute top-16 right-3 z-30 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              playClickChime();
                              setPdfViewerMode('drive');
                              setPdfIframeKey((k) => k + 1);
                            }}
                            className="pointer-events-auto text-[10px] bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700 text-slate-300 hover:text-amber-400 cursor-pointer shadow-md"
                            title="Switch to Drive Embedded Mode"
                          >
                            Drive Embed ↗
                          </button>
                        </div>
                      </div>
                    ) : (activePdfBook.previewUrl || activePdfBook.downloadUrl) ? (
                      /* 3. Fallback Embed Mode */
                      <div 
                        className="flex-1 w-full h-full min-h-0 relative bg-slate-950"
                        style={{
                          WebkitOverflowScrolling: 'touch',
                          touchAction: 'pan-x pan-y pinch-zoom'
                        }}
                      >
                        <div className={`w-full h-full relative transition-all duration-300 ${
                          readerTheme === 'sepia' ? 'sepia-[0.18] brightness-[0.98]' : ''
                        }`}>
                          {pdfViewerMode === 'native' ? (
                            <object
                              data={`/api/books/download-pdf?id=${encodeURIComponent(activePdfBook.id)}&fileId=${encodeURIComponent((activePdfBook as any).googleDriveFileId || activePdfBook.originalModule?.googleDriveFileId || activePdfBook.fileId || extractDriveFileId(activePdfBook.downloadUrl || activePdfBook.pdfUrl) || '')}`}
                              type="application/pdf"
                              className="w-full h-full block"
                            >
                              <iframe
                                key={`${activePdfBook.id}-${pdfIframeKey}-native`}
                                src={`/api/books/download-pdf?id=${encodeURIComponent(activePdfBook.id)}&fileId=${encodeURIComponent((activePdfBook as any).googleDriveFileId || activePdfBook.originalModule?.googleDriveFileId || activePdfBook.fileId || extractDriveFileId(activePdfBook.downloadUrl || activePdfBook.pdfUrl) || '')}`}
                                title={activePdfBook.title}
                                className="absolute inset-0 w-full h-full border-0 block"
                                allow="autoplay; fullscreen; encrypted-media"
                              />
                            </object>
                          ) : (
                            <iframe
                              key={`${activePdfBook.id}-${pdfIframeKey}-${pdfViewerMode}`}
                              src={
                                pdfViewerMode === 'gdocs' && activePdfBook.downloadUrl
                                  ? `https://docs.google.com/viewer?url=${encodeURIComponent(activePdfBook.downloadUrl)}&embedded=true`
                                  : activePdfBook.previewUrl
                              }
                              title={activePdfBook.title}
                              className="absolute inset-0 w-full h-full border-0 block"
                              allow="autoplay; fullscreen; encrypted-media"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        {/* Quick Trouble-Shooting Helper Capsule */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
                          <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-[10px] text-slate-300 shadow-lg">
                            <span>{language === 'am' ? 'ሰነዱ ካልታየ:' : 'Display issue?'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                playClickChime();
                                setPdfViewerMode('mobile-native');
                              }}
                              className="text-amber-400 font-bold hover:underline cursor-pointer"
                            >
                              Switch to Native PDF Reader
                            </button>
                            <span aria-hidden="true">·</span>
                            {activePdfBook.pdfUrl && (
                              <a
                                href={activePdfBook.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Drive App</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                        <FileText className="w-12 h-12 text-slate-500" />
                        <h3 className="text-base font-bold">Google Drive PDF Ready</h3>
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
                            className="px-4 py-2 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5 text-amber-400" />
                            <span>{language === 'am' ? 'ወደ ማስታወሻ ቀይር' : 'Switch to Notes'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================================================================= */}
                {/* TAB 3: 🎥 INTERACTIVE VIDEO LECTURE THEATER & COURSE STUDIO          */}
                {/* ================================================================= */}
                {readerTab === 'video' && (
                  <div className={`flex-1 w-full h-full min-h-0 flex flex-col relative overflow-hidden transition-colors animate-fadeIn ${
                    readerTheme === 'light'
                      ? 'bg-[#F1F5F9]'
                      : readerTheme === 'sepia'
                      ? 'bg-[#EFE5CD]'
                      : 'bg-[#060D1E]'
                  }`}>
                    {/* Top Video Sub-Toolbar */}
                    <div className={`px-3 sm:px-4 py-2 border-b flex items-center justify-between gap-2 shrink-0 text-xs transition-colors z-20 ${
                      readerTheme === 'light'
                        ? 'bg-white border-slate-200 text-slate-800'
                        : readerTheme === 'sepia'
                        ? 'bg-[#F5EBD4] border-[#DECFAF] text-[#362719]'
                        : 'bg-[#0B132B] border-white/10 text-slate-200'
                    }`}>
                      {/* Left: Active lecture info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                          <Play className="w-3.5 h-3.5 fill-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold truncate max-w-[150px] sm:max-w-md text-xs sm:text-sm">
                              {currentLecture?.title || `Unit ${activeLectureIndex + 1}`}
                            </span>
                            {currentLecture?.isCustomFromSupabase && (
                              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Supabase Live</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {language === 'am' ? 'የትምህርት ክፍል' : 'Unit'} {activeLectureIndex + 1} of {activePdfBook.lectures.length} • {currentLecture?.duration || '15m'} • {currentLecture?.instructor || 'University Faculty'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Lecture Navigation & Textbook jump */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Previous Lecture */}
                        <button
                          onClick={() => {
                            playClickChime();
                            setActiveLectureIndex(prev => Math.max(0, prev - 1));
                          }}
                          disabled={activeLectureIndex === 0}
                          className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            readerTheme === 'light'
                              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                              : readerTheme === 'sepia'
                              ? 'bg-[#FAF3E0] hover:bg-[#F2E5C7] border-[#DECFAF] text-[#332211]'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                          }`}
                          title="Previous Unit Lecture"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{language === 'am' ? 'ቀዳሚ' : 'Previous'}</span>
                        </button>

                        {/* Next Lecture */}
                        <button
                          onClick={() => {
                            playClickChime();
                            setActiveLectureIndex(prev => Math.min(activePdfBook.lectures.length - 1, prev + 1));
                          }}
                          disabled={activeLectureIndex >= activePdfBook.lectures.length - 1}
                          className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            readerTheme === 'light'
                              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                              : readerTheme === 'sepia'
                              ? 'bg-[#FAF3E0] hover:bg-[#F2E5C7] border-[#DECFAF] text-[#332211]'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                          }`}
                          title="Next Unit Lecture"
                        >
                          <span className="hidden sm:inline">{language === 'am' ? 'ቀጣይ' : 'Next'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Read in Textbook Shortcut */}
                        <button
                          onClick={() => {
                            playClickChime();
                            setReaderTab('drive');
                          }}
                          className="px-2.5 sm:px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-sm transition-all active:scale-95"
                          title="Open Related Textbook Chapter in Full-Screen Reader"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-950" />
                          <span className="hidden xs:inline">{language === 'am' ? 'በመጽሐፍ አንብብ' : 'Read in Book'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Main Video Theater Stage */}
                    <div className="flex-1 w-full h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
                      {/* Video Screen Player (Left: 8 Cols) */}
                      <div className="lg:col-span-8 flex flex-col h-full min-h-0 overflow-y-auto p-2 sm:p-4 gap-3">
                        {/* Responsive 16:9 Cinema Container */}
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 ring-1 ring-amber-500/20 shrink-0">
                          {currentLecture?.url ? (
                            <iframe
                              key={`yt-player-${currentLecture.id || activeLectureIndex}-${currentLecture.url}-${videoDomainAlternative ? 'std' : 'nocookie'}`}
                              src={getVideoEmbedUrl(currentLecture.url, videoDomainAlternative).embedUrl}
                              title={currentLecture.title}
                              className="absolute inset-0 w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                              allowFullScreen
                              referrerPolicy="strict-origin-when-cross-origin"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-400">
                              <Play className="w-12 h-12 text-amber-500/50" />
                              <p className="text-sm font-bold text-white">No video configured for this lesson</p>
                            </div>
                          )}
                        </div>

                        {/* VPN & Direct App Quick Actions Capsule */}
                        {currentLecture?.url && (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-slate-400">
                                {language === 'am' ? 'ቪዲዮ ካልተከፈተ (በVPN ምክንያት):' : 'Video blocked by VPN?'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  playClickChime();
                                  setVideoDomainAlternative(prev => !prev);
                                }}
                                className="text-amber-400 font-bold hover:underline cursor-pointer"
                              >
                                {videoDomainAlternative ? 'Switch to YouTube-NoCookie' : 'Switch to Standard YouTube'}
                              </button>
                            </div>

                            {/* Direct Open in Official YouTube App (Bypasses web browser iframe VPN restrictions) */}
                            {getVideoEmbedUrl(currentLecture.url).youtubeUrl && (
                              <a
                                href={getVideoEmbedUrl(currentLecture.url).youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => playSuccessChime()}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                                title={language === 'am' ? 'በዩቲዩብ መተግበሪያ ክፈት' : 'Open in YouTube App'}
                              >
                                <span>YouTube App</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Lesson Information & Interactive Notes Under Video */}
                        <div className={`p-4 rounded-2xl border transition-colors ${
                          readerTheme === 'light'
                            ? 'bg-white border-slate-200 text-slate-800'
                            : readerTheme === 'sepia'
                            ? 'bg-[#FAF3E0] border-[#DECFAF] text-[#332211]'
                            : 'bg-[#0B132B] border-white/10 text-slate-200'
                        }`}>
                          <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  Unit {currentLecture?.chapterNumber || activeLectureIndex + 1}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Duration: {currentLecture?.duration || '15 min'}
                                </span>
                                {currentLecture?.instructor && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    • {currentLecture.instructor}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base sm:text-lg font-black leading-snug">
                                {currentLecture?.title}
                              </h3>
                              {currentLecture?.amharicTitle && currentLecture.amharicTitle !== currentLecture.title && (
                                <p className="text-xs text-amber-400 font-bold mt-0.5">
                                  {currentLecture.amharicTitle}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                playClickChime();
                                setActiveChapterIndex(activeLectureIndex);
                                setReaderTab('notes');
                              }}
                              className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5 text-amber-400" />
                              <span>{language === 'am' ? 'የክፍሉ ማስታወሻ' : 'Chapter Notes'}</span>
                            </button>
                          </div>

                          {currentLecture?.description && (
                            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                              {currentLecture.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Course Lecture Playlist Drawer (Right: 4 Cols) */}
                      <div className={`lg:col-span-4 border-t lg:border-t-0 lg:border-l flex flex-col h-full min-h-0 transition-colors ${
                        readerTheme === 'light'
                          ? 'bg-white border-slate-200'
                          : readerTheme === 'sepia'
                          ? 'bg-[#FAF3E0] border-[#DECFAF]'
                          : 'bg-[#0B132B] border-white/10'
                      }`}>
                        {/* Playlist Header */}
                        <div className="p-3 border-b border-inherit space-y-2 shrink-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Film className="w-4 h-4 text-amber-500" />
                              <h4 className="text-xs font-black uppercase tracking-wider">
                                {language === 'am' ? 'የትምህርት ክፍሎች' : 'Course Lectures'}
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                              {activePdfBook.lectures.length} Units
                            </span>
                          </div>

                          {/* Quick filter/search inside playlist */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={lectureSearch}
                              onChange={(e) => setLectureSearch(e.target.value)}
                              placeholder={language === 'am' ? 'ክፍል ፈልግ...' : 'Filter units...'}
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-900/40 border border-slate-700/60 focus:border-amber-400 outline-none text-white placeholder-slate-500"
                            />
                          </div>
                        </div>

                        {/* Scrollable list of units */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                          {activePdfBook.lectures
                            .filter(lec => !lectureSearch || lec.title.toLowerCase().includes(lectureSearch.toLowerCase()) || (lec.chapterNumber && String(lec.chapterNumber).includes(lectureSearch)))
                            .map((lec, idx) => {
                              const actualIdx = activePdfBook.lectures.findIndex(l => l.id === lec.id);
                              const isPlaying = actualIdx === activeLectureIndex;

                              return (
                                <button
                                  key={lec.id || idx}
                                  onClick={() => {
                                    playClickChime();
                                    setActiveLectureIndex(actualIdx);
                                  }}
                                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                                    isPlaying
                                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                                      : 'border-transparent hover:bg-white/5 hover:border-white/10 text-slate-300'
                                  }`}
                                >
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                                    isPlaying
                                      ? 'bg-amber-500 text-slate-950 shadow-md'
                                      : 'bg-white/10 text-slate-400'
                                  }`}>
                                    {isPlaying ? (
                                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                                    ) : (
                                      <span>{lec.chapterNumber || actualIdx + 1}</span>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <h5 className={`text-xs font-bold truncate leading-tight ${isPlaying ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
                                      {lec.title}
                                    </h5>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                      <span>{lec.duration || '15m'}</span>
                                      {lec.isCustomFromSupabase && (
                                        <span className="text-emerald-400 text-[9px] font-bold">Supabase</span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================================================= */}
                {/* TAB 3.5: 📝 MID & FINAL EXAM VIDEOS & INTERACTIVE TESTS           */}
                {/* ================================================================= */}
                {readerTab === 'exams' && (
                  <div className="flex-1 w-full h-full min-h-0 overflow-y-auto p-3 sm:p-5 bg-[#0B132B]">
                    <CourseDetail
                      courseId={activePdfModule.id}
                      courseTitle={activePdfModule.title}
                      language={language}
                      isProUser={isProUser}
                      isFreeTrial={isFreeTrialCourse(activePdfModule)}
                      onUpgrade={() => {
                        handleCloseBook();
                        onNavigate('upgrade');
                      }}
                      onStartQuiz={(examId, title) => {
                        handleCloseBook();
                        safeStorage.setItem('ethiolearn_active_exam_drill', JSON.stringify({ examId, title }));
                        onNavigate('quiz');
                      }}
                    />
                  </div>
                )}

                {/* ================================================================= */}
                {/* TAB 4: 📝 A4 STYLE INTERACTIVE CURRICULUM NOTES & ASGOBNYI AI     */}
                {/* ================================================================= */}
                {readerTab === 'notes' && (
                  <div className="flex-1 w-full h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden">
                    
                    {/* 3.1 PDF OUTLINE / TABLE OF CONTENTS (Left Drawer - 3 Cols) */}
                    {pdfSidebarOpen && (
                      <div className={`lg:col-span-3 border-r p-4 overflow-y-auto space-y-3 hidden lg:block transition-colors ${
                        readerTheme === 'light'
                          ? 'bg-[#FFFFFF] border-slate-200 text-slate-800'
                          : readerTheme === 'sepia'
                          ? 'bg-[#F9F2E1] border-[#DFCFA8] text-[#382617]'
                          : 'bg-[#0B132B]/95 border-white/10 text-slate-200'
                      }`}>
                        <div className="flex items-center justify-between pb-2 border-b border-inherit">
                          <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                            <span>{language === 'am' ? 'የይዘት ማውጫ' : 'Module Outline'}</span>
                          </h4>
                          <span className="text-[10px] font-mono opacity-70">
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
                                    : readerTheme === 'light'
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                    : readerTheme === 'sepia'
                                    ? 'bg-[#F2E7CD] hover:bg-[#EADBBD] text-[#3A2818] border-[#DFCFA8]'
                                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                                }`}
                              >
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 ${
                                  isSelected ? 'bg-black/20 text-slate-950 font-black' : 'bg-black/10 text-current opacity-70'
                                }`}>
                                  Unit {idx + 1}
                                </span>
                                <span className="flex-1 line-clamp-2">{ch}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Official Academic Metadata */}
                        <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                          readerTheme === 'light'
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : readerTheme === 'sepia'
                            ? 'bg-[#F2E7CD] border-[#DFCFA8] text-[#3A2818]'
                            : 'bg-black/40 border-white/5 text-slate-300'
                        }`}>
                          <div className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">
                            Official Academic Metadata
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div><strong>Code:</strong> {activePdfModule.code}</div>
                            <div><strong>Credit Hours:</strong> {activePdfModule.creditHours}</div>
                            <div><strong>Semester:</strong> {activePdfModule.semester}</div>
                            <div><strong>Target:</strong> First Year Students (Freshman)</div>
                            <div><strong>Publisher:</strong> MoE Ethiopia / Wolkite Univ</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3.2 CENTER A4 PAGE CANVAS */}
                    <div className={`${
                      aiPanelOpen ? (pdfSidebarOpen ? 'lg:col-span-6' : 'lg:col-span-8') : (pdfSidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12')
                    } overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center transition-all ${
                      readerTheme === 'light'
                        ? 'bg-[#F1F5F9]'
                        : readerTheme === 'sepia'
                        ? 'bg-[#EFE6CF]'
                        : 'bg-[#070D1E]'
                    }`}>
                      
                      {/* Interactive Unit Navigation Toolbar on Top of Notes */}
                      <div className="w-full max-w-3xl mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {/* Prev / Next Unit Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (activeChapterIndex > 0) {
                                playClickChime();
                                setActiveChapterIndex(p => p - 1);
                              }
                            }}
                            disabled={activeChapterIndex === 0}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              readerTheme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                            title="Previous Unit"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-500 dark:text-amber-400 font-bold">
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
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              readerTheme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                            title="Next Unit"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Text Zoom & Font Sizing Controls */}
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center px-2 py-1 rounded-lg border gap-1.5 ${
                            readerTheme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
                          }`}>
                            <button
                              onClick={() => { playClickChime(); setReaderFontSize(s => Math.max(13, s - 1)); }}
                              className="px-1 font-bold hover:text-amber-500 cursor-pointer text-xs"
                              title="Decrease Font Size"
                            >
                              A-
                            </button>
                            <span className="font-mono text-[11px] px-1">{readerFontSize}px</span>
                            <button
                              onClick={() => { playClickChime(); setReaderFontSize(s => Math.min(22, s + 1)); }}
                              className="px-1 font-bold hover:text-amber-500 cursor-pointer text-xs"
                              title="Increase Font Size"
                            >
                              A+
                            </button>
                          </div>

                          <button
                            onClick={handlePrintPdf}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              readerTheme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                            title={language === 'am' ? 'ሞጁሉን አትም / Print' : 'Print Module PDF'}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* A4 Academic Sheet */}
                      <div 
                        className={`w-full max-w-3xl rounded-xl shadow-2xl p-6 sm:p-10 transition-all ${
                          readerTheme === 'light' 
                            ? 'bg-[#FFFFFF] text-slate-900 border border-slate-300 shadow-xl' 
                            : readerTheme === 'sepia'
                            ? 'bg-[#FCF7EB] text-[#2C2014] border border-[#DFCFA8] shadow-amber-950/10'
                            : 'bg-[#0F172A] text-slate-100 border border-slate-700/80 shadow-2xl'
                        }`}
                        style={{
                          transform: `scale(${pdfZoom / 100})`,
                          transformOrigin: 'top center',
                          fontSize: `${readerFontSize}px`,
                          lineHeight: 1.65
                        }}
                      >
                        {/* OFFICIAL MOE ETHIOPIA HEADER BANNER */}
                        <div className="border-b-2 border-inherit pb-4 mb-6 text-center space-y-1">
                          <div className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase font-extrabold text-amber-600 dark:text-amber-400">
                            Federal Democratic Republic of Ethiopia • Ministry of Education
                          </div>
                          <div className="text-xs sm:text-sm font-serif font-black uppercase tracking-wider">
                            Higher Education Common Curriculum For First Year Students
                          </div>
                          <div className={`inline-flex items-center gap-2 mt-1 px-3 py-0.5 rounded-full text-[11px] font-bold ${
                            readerTheme === 'light' ? 'bg-slate-100 text-slate-700' : readerTheme === 'sepia' ? 'bg-[#F2E7CD] text-[#3A2818]' : 'bg-slate-800 text-slate-300'
                          }`}>
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

                          <h1 className="text-xl sm:text-2xl font-serif font-black leading-tight">
                            {currentChapterContent?.title || currentChapterTitle}
                          </h1>

                          {/* Intro Abstract Box */}
                          <div className={`p-4 rounded-xl border italic text-sm leading-relaxed ${
                            readerTheme === 'light'
                              ? 'bg-slate-50 border-slate-200 text-slate-700'
                              : readerTheme === 'sepia'
                              ? 'bg-[#F5EBD4] border-[#DECFAF] text-[#332211]'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}>
                            {currentChapterContent?.intro}
                          </div>
                        </div>

                        {/* CHAPTER CONTENT SECTIONS */}
                        <div className="space-y-6">
                          {currentChapterContent?.sections.map((sec, idx) => (
                            <div key={idx} className="space-y-2">
                              <h2 className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 border-l-3 border-amber-500 pl-3">
                                {sec.title}
                              </h2>
                              <p className="leading-relaxed whitespace-pre-line text-sm sm:text-base opacity-90">
                                {sec.body}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* FORMULAS & COMPUTATIONS (if applicable) */}
                        {currentChapterContent?.formulas && currentChapterContent.formulas.length > 0 && (
                          <div className={`my-6 p-4 rounded-xl border space-y-3 ${
                            readerTheme === 'light'
                              ? 'bg-slate-50 border-slate-200'
                              : readerTheme === 'sepia'
                              ? 'bg-[#F5EBD4] border-[#DECFAF]'
                              : 'bg-black/50 border-amber-500/30'
                          }`}>
                            <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <span>🧮</span>
                              <span>{language === 'am' ? 'ቀመሮችና ህጎች' : 'Core Mathematical & Scientific Formulas'}</span>
                            </div>
                            <div className="space-y-2.5">
                              {currentChapterContent.formulas.map((f, i) => (
                                <div key={i} className={`p-2.5 rounded-lg border space-y-1 ${
                                  readerTheme === 'light'
                                    ? 'bg-white border-slate-200'
                                    : readerTheme === 'sepia'
                                    ? 'bg-[#FCF7EB] border-[#DFCFA8]'
                                    : 'bg-white/5 border-white/5'
                                }`}>
                                  <div className="font-bold text-xs">{f.name}</div>
                                  <div className="p-2 rounded bg-slate-900 text-amber-300 font-mono text-xs overflow-x-auto">
                                    {f.formula}
                                  </div>
                                  <div className="text-[11px] opacity-75">{f.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* KEY TERMINOLOGY & BILINGUAL AMHARIC GLOSSARY */}
                        {currentChapterContent?.keyTerms && currentChapterContent.keyTerms.length > 0 && (
                          <div className={`my-6 p-4 rounded-xl border space-y-3 ${
                            readerTheme === 'light'
                              ? 'bg-slate-50 border-slate-200'
                              : readerTheme === 'sepia'
                              ? 'bg-[#F5EBD4] border-[#DECFAF]'
                              : 'bg-white/5 border-white/10'
                          }`}>
                            <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <span>📖</span>
                              <span>{language === 'am' ? 'ቁልፍ ቃላትና ፍቺዎች' : 'Essential Academic Terminology & Definitions'}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {currentChapterContent.keyTerms.map((t, i) => (
                                <div key={i} className={`p-2.5 rounded-lg border space-y-0.5 ${
                                  readerTheme === 'light'
                                    ? 'bg-white border-slate-200'
                                    : readerTheme === 'sepia'
                                    ? 'bg-[#FCF7EB] border-[#DFCFA8]'
                                    : 'bg-black/40 border-white/5'
                                }`}>
                                  <div className="font-bold text-xs text-amber-600 dark:text-amber-400">
                                    {t.term} {t.amharic ? `(${t.amharic})` : ''}
                                  </div>
                                  <div className="text-[11px] leading-snug opacity-80">
                                    {t.definition}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* EXAM ALERT BOX */}
                        {currentChapterContent?.examAlert && (
                          <div className="my-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm leading-relaxed">
                            <strong className="block font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                              ⚠️ University Mid-Term / Final Exam Guidance:
                            </strong>
                            {currentChapterContent.examAlert}
                          </div>
                        )}

                        {/* OFFICIAL FOOTER */}
                        <div className="border-t border-inherit pt-4 mt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] opacity-70 gap-2">
                          <span>Federal Democratic Republic of Ethiopia — Ministry of Education</span>
                          <span className="font-mono font-bold">
                            Unit {activeChapterIndex + 1} • {activePdfModule.code} Module
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3.3 RIGHT SIDEBAR: ASGOBNYI AI STUDY COMPANION */}
                    {aiPanelOpen && (
                      <div className={`lg:col-span-3 border-l p-4 overflow-y-auto space-y-4 transition-colors ${
                        readerTheme === 'light'
                          ? 'bg-[#FFFFFF] border-slate-200 text-slate-800'
                          : readerTheme === 'sepia'
                          ? 'bg-[#F9F2E1] border-[#DFCFA8] text-[#382617]'
                          : 'bg-[#0B132B]/95 border-white/10 text-slate-200'
                      }`}>
                        <div className="flex items-center justify-between pb-2 border-b border-inherit">
                          <div className="flex items-center gap-1.5">
                            <Bot className="w-4 h-4 text-amber-500" />
                            <h4 className="text-xs font-bold uppercase tracking-wider">
                              {language === 'am' ? 'አስጎብኚ AI' : 'Asgobnyi AI'}
                            </h4>
                          </div>
                          <button
                            onClick={() => setAiPanelOpen(false)}
                            className="p-1 cursor-pointer opacity-70 hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => { playClickChime(); setAiMode('summary'); }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border cursor-pointer ${
                              aiMode === 'summary'
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : readerTheme === 'light'
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/5'
                            }`}
                          >
                            <span>📝 {language === 'am' ? 'የምዕራፍ ማጠቃለያ' : 'Summarize Unit'}</span>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          </button>

                          <button
                            onClick={() => { playClickChime(); setAiMode('amharic'); }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border cursor-pointer ${
                              aiMode === 'amharic'
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : readerTheme === 'light'
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/5'
                            }`}
                          >
                            <span>🇪🇹 {language === 'am' ? 'የአማርኛ ማብራሪያ' : 'Amharic Explanation'}</span>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          </button>

                          <button
                            onClick={() => { playClickChime(); setAiMode('quiz'); }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border cursor-pointer ${
                              aiMode === 'quiz'
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : readerTheme === 'light'
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/5'
                            }`}
                          >
                            <span>❓ {language === 'am' ? 'የፈተና ጥያቄዎች' : 'Exam Practice'}</span>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        </div>

                        {aiMode === 'summary' && (
                          <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                            readerTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'
                          }`}>
                            <div className="font-bold text-amber-500">Unit Summary:</div>
                            <p className="leading-relaxed opacity-90">
                              {currentChapterContent?.intro || 'Reviewing key concepts in this syllabus unit for examination readiness.'}
                            </p>
                          </div>
                        )}

                        {aiMode === 'amharic' && (
                          <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                            readerTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'
                          }`}>
                            <div className="font-bold text-amber-500">የአማርኛ ይዘት ማብራሪያ:</div>
                            <p className="leading-[1.7] opacity-90">
                              ይህ ምዕራፍ በ{activePdfModule.title} ኮርስ ውስጥ የተካተተ ሲሆን ለፈተና ዝግጅት የሚያስፈልጉ ቁልፍ ነጥቦችንና ቀመሮችን ያብራራል።
                            </p>
                          </div>
                        )}

                        {aiMode === 'quiz' && (
                          <div className={`p-3.5 rounded-xl border space-y-3 text-xs ${
                            readerTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'
                          }`}>
                            <div className="font-bold text-amber-500">Practice Question:</div>
                            <div className="space-y-1.5">
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
                                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                                            : 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40'
                                          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-inherit'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              {quizAnswers[1] !== undefined && (
                                <div className="text-[11px] text-amber-500 pt-1 font-medium">
                                  {quizAnswers[1] === 0 ? '✅ Correct! Verified syllabus standard.' : '❌ Try again. Review Section 1 of this unit.'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* ========================================================================= */}
      {/* 🖼️ DEDICATED FULLSCREEN COVER PAGE MODAL OVERLAY                          */}
      {/* ========================================================================= */}
      {typeof document !== 'undefined' && createPortal(
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
              className="bg-[#0B132B] border border-amber-500/30 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row gap-6 p-4 sm:p-6 cursor-default text-left items-center md:items-start"
            >
              {/* Left: Authentic Full-Page Cover Graphic (No Cut, Uncropped) */}
              <div className="flex-1 max-w-md w-full flex items-center justify-center p-2 bg-slate-950/60 rounded-xl border border-white/10 shrink-0">
                <img
                  src={coverModalBook.coverUrl}
                  alt={coverModalBook.title}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl select-none block drop-shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&q=80';
                  }}
                />
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
                        handleOpenBook(b, 0, 'drive', 0, true);
                      }}
                      className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Maximize2 className="w-4 h-4 text-slate-950" />
                      <span>{language === 'am' ? 'ሙሉ ገጽ ፒዲኤፍ አንብብ' : 'Read Full Page PDF'}</span>
                    </button>

                    {downloadingMap[coverModalBook.id] !== undefined ? (
                      <div className="py-2.5 px-3 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{downloadingMap[coverModalBook.id]}%</span>
                      </div>
                    ) : offlineBookIds.has(coverModalBook.id) ? (
                      <button
                        onClick={(e) => handleDeleteOffline(coverModalBook.id, coverModalBook.title, e)}
                        className="py-2.5 px-3 bg-emerald-950/80 hover:bg-red-950/80 text-emerald-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 border border-emerald-500/40 hover:border-red-500/40 cursor-pointer group/offcov"
                        title={language === 'am' ? 'ከመስመር ውጭ ወርዷል (ለመሰረዝ ጠቅ ያድርጉ)' : 'Downloaded offline (Click to delete)'}
                      >
                        <Check className="w-4 h-4 group-hover/offcov:hidden" />
                        <Trash2 className="w-4 h-4 hidden group-hover/offcov:inline text-red-400" />
                        <span className="group-hover/offcov:hidden">{language === 'am' ? 'ከመስመር ውጭ ዝግጁ' : 'Offline Ready'}</span>
                        <span className="hidden group-hover/offcov:inline">{language === 'am' ? 'ሰርዝ' : 'Remove'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownloadBook(coverModalBook)}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                        title={language === 'am' ? 'በመተግበሪያው ውስጥ አውርድ (ያለ ኢንተርኔት ለማንበብ)' : 'Download in app for offline study'}
                      >
                        <CloudDownload className="w-4 h-4 text-amber-400" />
                        <span>{language === 'am' ? 'ከመስመር ውጭ አውርድ' : 'Save Offline'}</span>
                      </button>
                    )}
                  </div>

                  {coverModalBook.hasVideoLecture && (
                    <button
                      onClick={() => {
                        const b = coverModalBook;
                        setCoverModalBook(null);
                        handleOpenBook(b, 0, 'video');
                      }}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>{language === 'am' ? 'የቪዲዮ ትምህርቶች እይ' : 'Watch Video Lectures'} ({coverModalBook.lectures.length})</span>
                    </button>
                  )}

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
      </AnimatePresence>,
      document.body
    )}

      {/* ─── PRO VIDEO UPGRADE MODAL ─── */}
      {proVideoModalBook && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111C35] border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {language === 'am' ? 'የፕሮ ቪዲዮ ትምህርት' : 'Pro Video Lecture Pass'}
                  </h3>
                  <p className="text-[11px] text-amber-400 font-medium truncate max-w-[220px]">
                    {proVideoModalBook.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProVideoModalBook(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <p className="font-bold">
                  {language === 'am' ? '✓ የባዮሎጂ ቪዲዮ ለሁሉም ክፍት ነው!' : '✓ Biology video lectures are 100% Free!'}
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {language === 'am'
                    ? 'አጠቃላይ ባዮሎጂን በነፃ መከታተል ይችላሉ። የሌሎች ኮርሶች ቪዲዮዎችን ለመክፈት ወደ ፕሮ ያሳድጉ።'
                    : 'You can watch full General Biology unit lectures for free. Unlock Chemistry, Physics, Math, Economics and all other courses with a Pro Pass.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">{language === 'am' ? 'የሴሚስተር ቪዲዮ ፓስ' : 'Semester Video Pass'}</span>
                  <span className="text-amber-400 font-mono text-sm">199 ETB</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {language === 'am'
                    ? 'በቴሌብር (Telebirr) ወይም በኢትዮጵያ ንግድ ባንክ (CBE Birr) በቀላሉ ይክፈሉ።'
                    : 'Instant activation via Telebirr & Commercial Bank of Ethiopia (CBE Birr).'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setProVideoModalBook(null);
                  playClickChime();
                  onNavigate('upgrade');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>{language === 'am' ? 'በቴሌብር / ንግድ ባንክ አሳድግ (ከ99 ብር)' : 'Upgrade Pro via Telebirr (From 99 ETB)'}</span>
              </button>

              <button
                onClick={() => {
                  const b = proVideoModalBook;
                  setProVideoModalBook(null);
                  handleOpenBook(b, 0, 'drive', 0, true);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'am' ? 'ነፃ ፒዲኤፍ መጽሐፍ አንብብ (100% ነፃ)' : 'Read 100% Free PDF Textbook Instead'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SELECTED COURSE EXAM & CHAPTER DETAIL MODAL ─── */}
      {selectedCourseForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#0A1128] border border-amber-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl text-white my-auto max-h-[94vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCourseForDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer z-10"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <CourseDetail
              courseId={selectedCourseForDetail.id}
              courseTitle={selectedCourseForDetail.title}
              language={language}
              isProUser={isProUser}
              isFreeTrial={isFreeTrialCourse(selectedCourseForDetail)}
              onUpgrade={() => {
                setSelectedCourseForDetail(null);
                onNavigate('upgrade');
              }}
              onBack={() => setSelectedCourseForDetail(null)}
              onStartQuiz={(examId, title) => {
                setSelectedCourseForDetail(null);
                safeStorage.setItem('ethiolearn_active_exam_drill', JSON.stringify({ examId, title }));
                onNavigate('quiz');
              }}
            />
          </div>
        </div>
      )}

      {/* ─── MONTHLY EXAM SUBSCRIPTION PASS MODAL ─── */}
      {monthlyExamSubscriptionModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111C35] border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {language === 'am' ? 'የወርሃዊ የፈተና ቪዲዮ ፓስ' : 'Monthly Exam Solution Pass'}
                  </h3>
                  <p className="text-[11px] text-amber-400 font-medium truncate max-w-[220px]">
                    {monthlyExamSubscriptionModalOpen.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMonthlyExamSubscriptionModalOpen(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'am' ? '✓ 1 ነፃ የሙከራ ኮርስ ክፍት ነው!' : '✓ 1 Free Trial Course is Open!'}</span>
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  {language === 'am'
                    ? 'የCritical Thinking & Logic አጋማሽና ማጠቃለያ ፈተናዎችን በነፃ መሞከር ይችላሉ።'
                    : 'You can watch full Midterm & Final exam solution videos for Critical Thinking & Logic right now 100% free!'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">{language === 'am' ? 'የወርሃዊ ፓስ ክፍያ' : 'Monthly Exam Pass'}</span>
                  <span className="text-amber-400 font-mono text-sm">99 ETB / Month</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {language === 'am'
                    ? 'በቴሌብር (Telebirr) ወይም በኢትዮጵያ ንግድ ባንክ (CBE Birr) በቀላሉ ይክፈሉ።'
                    : 'Instant activation via Telebirr & CBE Birr (Monthly: 99 ETB, Semester: 199 ETB, Annual: 250 ETB).'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setMonthlyExamSubscriptionModalOpen(null);
                  playClickChime();
                  onNavigate('upgrade');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>{language === 'am' ? 'በቴሌብር በ99 ብር ክፈት' : 'Subscribe for 99 ETB / Month'}</span>
              </button>

              {/* Direct button to try the Free Trial course */}
              <button
                onClick={() => {
                  setMonthlyExamSubscriptionModalOpen(null);
                  const trialCourse = unifiedBooks.find(isFreeTrialCourse) || unifiedBooks[0];
                  if (trialCourse) {
                    setSelectedCourseForDetail(trialCourse);
                  }
                }}
                className="w-full py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'am' ? 'ነፃ የሙከራ ኮርስ አሁኑኑ ሞክር' : 'Try 1 Free Trial Course Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
