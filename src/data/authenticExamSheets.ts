/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Master Built-in Authentic Exam Sheets Repository
 * 100% offline-ready official Ethiopian university past exams, exit exams, and entrance exams.
 */

import { ExamPaperSheet, ExamQuestion } from '../components/UniversityExamsView';
import { ExamPaper } from '../types';
import { AUTHENTIC_EXAM_SHEET_MAP } from './questionBanks';

interface SheetMeta {
  title: string;
  university: string;
  year: string;
  subject: string;
  department: string;
  durationMinutes: number;
  level: 'University' | 'Grade 12' | 'Common Courses';
}

const SHEET_METADATA_REGISTRY: Record<string, SheetMeta> = {
  // Wolkite University (WKU)
  wku_math_1011: {
    title: 'Freshman Mathematics (Math 1011) Final Exam',
    university: 'Wolkite University (WKU)',
    year: '2016 E.C.',
    subject: 'Mathematics',
    department: 'College of Natural & Computational Sciences',
    durationMinutes: 60,
    level: 'Common Courses'
  },
  wku_cpp_1011: {
    title: 'Computer Programming (C++ 1011) Midterm & Final',
    university: 'Wolkite University (WKU)',
    year: '2016 E.C.',
    subject: 'Computer Science',
    department: 'College of Computing & Informatics',
    durationMinutes: 60,
    level: 'University'
  },
  wku_physics_1011: {
    title: 'General Physics (Phys 1011) University Exam',
    university: 'Wolkite University (WKU)',
    year: '2016 E.C.',
    subject: 'Physics',
    department: 'Department of Physics',
    durationMinutes: 60,
    level: 'Common Courses'
  },
  wku_emtech_1011: {
    title: 'Emerging Technologies (EmTe 1012) Common Exam',
    university: 'Wolkite University (WKU)',
    year: '2016 E.C.',
    subject: 'Emerging Technologies',
    department: 'Freshman Division',
    durationMinutes: 50,
    level: 'Common Courses'
  },
  wku_chem_1011: {
    title: 'General Chemistry (Chem 1011) Past Paper',
    university: 'Wolkite University (WKU)',
    year: '2015 E.C.',
    subject: 'Chemistry',
    department: 'Department of Chemistry',
    durationMinutes: 60,
    level: 'Common Courses'
  },
  wku_geog_1011: {
    title: 'Geography of Ethiopia & the Horn (Geog 1011)',
    university: 'Wolkite University (WKU)',
    year: '2016 E.C.',
    subject: 'Geography',
    department: 'College of Social Sciences',
    durationMinutes: 50,
    level: 'Common Courses'
  },
  wku_global_1012: {
    title: 'Global Trends & International Relations (GlTr 1012)',
    university: 'Wolkite University (WKU)',
    year: '2016 E.C.',
    subject: 'Global Trends',
    department: 'College of Social Sciences',
    durationMinutes: 50,
    level: 'Common Courses'
  },
  wku_dsa_2021: {
    title: 'Data Structures & Algorithms (CoSc 2021) Exam',
    university: 'Wolkite University (WKU)',
    year: '2016 E.C.',
    subject: 'Computer Science',
    department: 'College of Computing & Informatics',
    durationMinutes: 60,
    level: 'University'
  },

  // Addis Ababa University (AAU)
  aau_logic_1011: {
    title: 'Logic and Critical Thinking (Phil 1011) University Exam',
    university: 'Addis Ababa University (AAU)',
    year: '2016 E.C.',
    subject: 'Critical Thinking',
    department: 'Department of Philosophy',
    durationMinutes: 60,
    level: 'Common Courses'
  },
  aau_entrepreneur_1012: {
    title: 'Entrepreneurship & Innovation (Mgmt 1012)',
    university: 'Addis Ababa University (AAU)',
    year: '2016 E.C.',
    subject: 'Entrepreneurship',
    department: 'School of Commerce',
    durationMinutes: 50,
    level: 'Common Courses'
  },
  aau_math_1012: {
    title: 'Freshman Mathematics (Social Science Module)',
    university: 'Addis Ababa University (AAU)',
    year: '2015 E.C.',
    subject: 'Mathematics',
    department: 'College of Natural Sciences',
    durationMinutes: 60,
    level: 'Common Courses'
  },
  aau_english_1011: {
    title: 'Communicative English Language Skills I (FLEn 1011)',
    university: 'Addis Ababa University (AAU)',
    year: '2016 E.C.',
    subject: 'English',
    department: 'Department of Foreign Languages',
    durationMinutes: 50,
    level: 'Common Courses'
  },

  // Adama Science & Technology University (ASTU)
  astu_physics_1011: {
    title: 'General Physics for Engineering (Phys 1011)',
    university: 'Adama Science & Technology University (ASTU)',
    year: '2016 E.C.',
    subject: 'Physics',
    department: 'School of Applied Natural Science',
    durationMinutes: 60,
    level: 'Common Courses'
  },
  astu_math_1012: {
    title: 'Engineering Calculus & Linear Algebra (Math 1012)',
    university: 'Adama Science & Technology University (ASTU)',
    year: '2016 E.C.',
    subject: 'Mathematics',
    department: 'Department of Mathematics',
    durationMinutes: 60,
    level: 'Common Courses'
  },

  // Hawassa University (HU)
  hu_english_1011: {
    title: 'Communicative English Language Skills (FLEn 1011)',
    university: 'Hawassa University (HU)',
    year: '2016 E.C.',
    subject: 'English',
    department: 'College of Social Sciences',
    durationMinutes: 50,
    level: 'Common Courses'
  },
  hu_bio_1011: {
    title: 'General Biology (Biol 1011) Past Paper',
    university: 'Hawassa University (HU)',
    year: '2016 E.C.',
    subject: 'Biology',
    department: 'College of Natural Sciences',
    durationMinutes: 60,
    level: 'Common Courses'
  },

  // Jimma University (JU)
  ju_anthro_1012: {
    title: 'Social Anthropology (Anth 1012) University Exam',
    university: 'Jimma University (JU)',
    year: '2016 E.C.',
    subject: 'Social Anthropology',
    department: 'College of Social Sciences',
    durationMinutes: 50,
    level: 'Common Courses'
  },
  ju_physics_1011: {
    title: 'General Physics (Phys 1011) Midterm Assessment',
    university: 'Jimma University (JU)',
    year: '2015 E.C.',
    subject: 'Physics',
    department: 'Department of Physics',
    durationMinutes: 60,
    level: 'Common Courses'
  },

  // Mekelle University (MU)
  mu_chem_1011: {
    title: 'General Chemistry (Chem 1011) Final Exam',
    university: 'Mekelle University (MU)',
    year: '2016 E.C.',
    subject: 'Chemistry',
    department: 'College of Natural & Computational Sciences',
    durationMinutes: 60,
    level: 'Common Courses'
  },

  // Bahir Dar University (BDU)
  bdu_inclusive_1012: {
    title: 'Inclusiveness & Special Needs Education (SNEd 1012)',
    university: 'Bahir Dar University (BDU)',
    year: '2016 E.C.',
    subject: 'Inclusiveness',
    department: 'Faculty of Educational & Behavioral Sciences',
    durationMinutes: 50,
    level: 'Common Courses'
  },

  // Ambo University (AU)
  ambo_bio_1011: {
    title: 'General Biology for Natural Science (Biol 1011)',
    university: 'Ambo University (AU)',
    year: '2016 E.C.',
    subject: 'Biology',
    department: 'College of Natural Sciences',
    durationMinutes: 60,
    level: 'Common Courses'
  },

  // Haramaya University (HrU) & Arba Minch University (AMU)
  hru_econ_1011: {
    title: 'Introduction to Economics (Econ 1011) University Exam',
    university: 'Haramaya University (HrU)',
    year: '2016 E.C.',
    subject: 'Economics',
    department: 'College of Business & Economics',
    durationMinutes: 60,
    level: 'Common Courses'
  },
  amu_statics_1022: {
    title: 'Engineering Mechanics: Statics (MEng 1022)',
    university: 'Arba Minch University (AMU)',
    year: '2016 E.C.',
    subject: 'Engineering Mechanics',
    department: 'Institute of Technology',
    durationMinutes: 60,
    level: 'University'
  },

  // MoE National University Exit Exams (ፈተና መውጫ)
  exit_cs_2016: {
    title: 'MoE National University Exit Exam: Computer Science',
    university: 'Ministry of Education (MoE)',
    year: '2016 E.C.',
    subject: 'Computer Science',
    department: 'National Higher Education Exit Exam',
    durationMinutes: 90,
    level: 'University'
  },
  exit_accounting_2016: {
    title: 'MoE National University Exit Exam: Accounting & Finance',
    university: 'Ministry of Education (MoE)',
    year: '2016 E.C.',
    subject: 'Accounting',
    department: 'National Higher Education Exit Exam',
    durationMinutes: 90,
    level: 'University'
  },
  exit_ece_2016: {
    title: 'MoE National University Exit Exam: Electrical Engineering',
    university: 'Ministry of Education (MoE)',
    year: '2016 E.C.',
    subject: 'Electrical Engineering',
    department: 'National Higher Education Exit Exam',
    durationMinutes: 90,
    level: 'University'
  },

  // MoE Grade 12 National University Entrance Exam (EUEE / Matric)
  g12_math_euee_2016: {
    title: 'EUEE National University Entrance: Mathematics',
    university: 'Educational Assessment and Examinations Service (EAES)',
    year: '2016 E.C.',
    subject: 'Mathematics',
    department: 'Grade 12 National University Entrance Examination',
    durationMinutes: 90,
    level: 'Grade 12'
  },
  g12_physics_euee_2016: {
    title: 'EUEE National University Entrance: Physics',
    university: 'Educational Assessment and Examinations Service (EAES)',
    year: '2016 E.C.',
    subject: 'Physics',
    department: 'Grade 12 National University Entrance Examination',
    durationMinutes: 90,
    level: 'Grade 12'
  },
  g12_aptitude_euee_2016: {
    title: 'EUEE Scholastic Aptitude & Reasoning Test',
    university: 'Educational Assessment and Examinations Service (EAES)',
    year: '2016 E.C.',
    subject: 'Aptitude',
    department: 'Grade 12 National University Entrance Examination',
    durationMinutes: 80,
    level: 'Grade 12'
  },
  g12_english_euee_2016: {
    title: 'EUEE National University Entrance: English Language',
    university: 'Educational Assessment and Examinations Service (EAES)',
    year: '2016 E.C.',
    subject: 'English',
    department: 'Grade 12 National University Entrance Examination',
    durationMinutes: 90,
    level: 'Grade 12'
  },
  g12_chem_euee_2016: {
    title: 'EUEE National University Entrance: Chemistry',
    university: 'Educational Assessment and Examinations Service (EAES)',
    year: '2016 E.C.',
    subject: 'Chemistry',
    department: 'Grade 12 National University Entrance Examination',
    durationMinutes: 90,
    level: 'Grade 12'
  },
  g12_bio_euee_2016: {
    title: 'EUEE National University Entrance: Biology',
    university: 'Educational Assessment and Examinations Service (EAES)',
    year: '2016 E.C.',
    subject: 'Biology',
    department: 'Grade 12 National University Entrance Examination',
    durationMinutes: 90,
    level: 'Grade 12'
  }
};

/**
 * Generates full ExamPaperSheet list from authentic questions map.
 * Available 100% offline with zero network dependency.
 */
export function getBuiltinAuthenticExamSheets(): ExamPaperSheet[] {
  const sheets: ExamPaperSheet[] = [];

  for (const [sheetId, rawQuestions] of Object.entries(AUTHENTIC_EXAM_SHEET_MAP)) {
    const meta = SHEET_METADATA_REGISTRY[sheetId] || {
      title: `${sheetId.replace(/_/g, ' ').toUpperCase()} Exam Paper`,
      university: 'Ethiopian University',
      year: '2016 E.C.',
      subject: 'Curriculum Course',
      department: 'Academic Faculty',
      durationMinutes: 60,
      level: 'University'
    };

    const formattedQuestions: ExamQuestion[] = rawQuestions.map((q, idx) => {
      const choices = q.options.map((opt, oIdx) => `${String.fromCharCode(65 + oIdx)}) ${opt}`);
      return {
        id: idx + 1,
        qText: q.questionText,
        choices,
        correctIndex: q.correctIndex,
        subjectTopic: `${meta.subject} • ${q.topic || 'Core Subject'}`,
        explanation: q.explanation || `Correct option is ${String.fromCharCode(65 + q.correctIndex)}.`,
        amharicExplanation: q.amharicExplanation || undefined,
        sourceType: 'official_past_exam',
        unit: q.unit || 'Unit 1',
        chapter: q.chapter || 'Chapter 1',
        difficulty: q.difficulty || 'medium'
      };
    });

    sheets.push({
      id: sheetId,
      title: meta.title,
      university: meta.university,
      year: meta.year,
      subject: meta.subject,
      department: meta.department,
      durationMinutes: meta.durationMinutes,
      questions: formattedQuestions
    });
  }

  return sheets;
}

/**
 * Generates full ExamPaper list for the timed ExamEngine simulator.
 * Available 100% offline.
 */
export function getBuiltinExamPapersForEngine(): ExamPaper[] {
  const sheets = getBuiltinAuthenticExamSheets();
  return sheets.map(s => {
    const meta = SHEET_METADATA_REGISTRY[s.id];
    return {
      id: s.id,
      title: s.title,
      subject: s.subject,
      level: meta?.level || 'University',
      university: s.university,
      year: s.year,
      durationMinutes: s.durationMinutes,
      totalQuestions: s.questions.length,
      passingScore: 60,
      passingPercentage: 60,
      instructions: `Official exam paper for ${s.university} (${s.subject}). Complete within ${s.durationMinutes} minutes. Available 100% offline.`,
      status: 'published',
      questions: s.questions.map((q, idx) => ({
        id: `${s.id}_q_${idx + 1}`,
        questionNumber: idx + 1,
        text: q.qText,
        options: q.choices.map(c => c.replace(/^[A-D]\)\s*/, '')),
        correctAnswer: q.choices[q.correctIndex]?.replace(/^[A-D]\)\s*/, '') || '',
        explanation: q.explanation,
        subject: s.subject,
        topic: q.subjectTopic
      }))
    };
  });
}
