import { AuthenticCurriculumQuestion } from './mathQuestions';
import {
  AUTHENTIC_MATH_QUESTIONS_WKU_1011,
  AUTHENTIC_MATH_QUESTIONS_AAU_1012,
  AUTHENTIC_MATH_QUESTIONS_ASTU_1012,
  AUTHENTIC_MATH_QUESTIONS_EUEE_2016
} from './mathQuestions';
import { AUTHENTIC_CPP_QUESTIONS_WKU_1011 } from './cppQuestions';
import {
  AUTHENTIC_PHYSICS_QUESTIONS_WKU_1011,
  AUTHENTIC_PHYSICS_QUESTIONS_ASTU_1011,
  AUTHENTIC_PHYSICS_QUESTIONS_JU_1011,
  AUTHENTIC_PHYSICS_QUESTIONS_EUEE_2016
} from './physicsQuestions';
import { AUTHENTIC_EMTECH_QUESTIONS_WKU_1011 } from './emTechQuestions';
import { AUTHENTIC_LOGIC_QUESTIONS_AAU_1011 } from './logicQuestions';
import {
  AUTHENTIC_ENGLISH_QUESTIONS_FLEn_1011,
  AUTHENTIC_ENGLISH_QUESTIONS_HU_1011
} from './englishQuestions';
import { AUTHENTIC_CHEMISTRY_QUESTIONS_MU_1011 } from './chemQuestions';
import { AUTHENTIC_BIOLOGY_QUESTIONS_HU_1011 } from './bioQuestions';
import {
  AUTHENTIC_ANTHROPOLOGY_QUESTIONS_JU_1012,
  AUTHENTIC_INCLUSIVENESS_QUESTIONS_BDU_1012,
  AUTHENTIC_ENTREPRENEURSHIP_QUESTIONS_AAU_1012
} from './socialQuestions';
import { AUTHENTIC_APTITUDE_QUESTIONS_EUEE_2016 } from './eueeAptitudeQuestions';
import {
  AUTHENTIC_EXIT_EXAM_CS_2016,
  AUTHENTIC_EXIT_EXAM_ACCOUNTING_2016,
  AUTHENTIC_EXIT_EXAM_ECE_2016
} from './exitExamQuestions';
import {
  AUTHENTIC_EUEE_ENGLISH_2016,
  AUTHENTIC_EUEE_CHEMISTRY_2016,
  AUTHENTIC_EUEE_BIOLOGY_2016
} from './matricEueeExtraQuestions';
import {
  AUTHENTIC_CHEMISTRY_QUESTIONS_WKU_1011,
  AUTHENTIC_GEOGRAPHY_QUESTIONS_WKU_1011,
  AUTHENTIC_GLOBAL_TRENDS_QUESTIONS_WKU_1012,
  AUTHENTIC_DSA_QUESTIONS_WKU_2021
} from './wkuExtraQuestions';
import {
  AUTHENTIC_ECONOMICS_QUESTIONS_HRU_1011,
  AUTHENTIC_STATICS_QUESTIONS_AMU_1022
} from './regionalExtraQuestions';
import { AUTHENTIC_MASTER_QUESTIONS } from '../authenticExamRepository';

export * from './mathQuestions';
export * from './cppQuestions';
export * from './physicsQuestions';
export * from './emTechQuestions';
export * from './logicQuestions';
export * from './englishQuestions';
export * from './chemQuestions';
export * from './bioQuestions';
export * from './socialQuestions';
export * from './eueeAptitudeQuestions';
export * from './exitExamQuestions';
export * from './matricEueeExtraQuestions';
export * from './wkuExtraQuestions';
export * from './regionalExtraQuestions';

/**
 * Maps each exam sheet ID to its verified authentic curriculum questions.
 */
export const AUTHENTIC_EXAM_SHEET_MAP: Record<string, AuthenticCurriculumQuestion[]> = {
  // Wolkite University (WKU)
  wku_math_1011: AUTHENTIC_MATH_QUESTIONS_WKU_1011,
  wku_cpp_1011: AUTHENTIC_CPP_QUESTIONS_WKU_1011,
  wku_physics_1011: [
    ...AUTHENTIC_PHYSICS_QUESTIONS_WKU_1011,
    ...AUTHENTIC_PHYSICS_QUESTIONS_ASTU_1011,
    ...AUTHENTIC_PHYSICS_QUESTIONS_JU_1011
  ],
  wku_emtech_1011: AUTHENTIC_EMTECH_QUESTIONS_WKU_1011,
  wku_chem_1011: [
    ...AUTHENTIC_CHEMISTRY_QUESTIONS_MU_1011,
    ...AUTHENTIC_CHEMISTRY_QUESTIONS_WKU_1011
  ],
  wku_geog_1011: AUTHENTIC_GEOGRAPHY_QUESTIONS_WKU_1011,
  wku_global_1012: AUTHENTIC_GLOBAL_TRENDS_QUESTIONS_WKU_1012,
  wku_dsa_2021: AUTHENTIC_DSA_QUESTIONS_WKU_2021,

  // Addis Ababa University (AAU)
  aau_logic_1011: AUTHENTIC_LOGIC_QUESTIONS_AAU_1011,
  aau_entrepreneur_1012: AUTHENTIC_ENTREPRENEURSHIP_QUESTIONS_AAU_1012,
  aau_math_1012: AUTHENTIC_MATH_QUESTIONS_AAU_1012,
  aau_english_1011: [
    ...AUTHENTIC_ENGLISH_QUESTIONS_FLEn_1011,
    ...AUTHENTIC_ENGLISH_QUESTIONS_HU_1011
  ],

  // Adama Science & Technology University (ASTU)
  astu_physics_1011: [
    ...AUTHENTIC_PHYSICS_QUESTIONS_ASTU_1011,
    ...AUTHENTIC_PHYSICS_QUESTIONS_WKU_1011
  ],
  astu_math_1012: AUTHENTIC_MATH_QUESTIONS_ASTU_1012,

  // Hawassa University (HU)
  hu_english_1011: [
    ...AUTHENTIC_ENGLISH_QUESTIONS_HU_1011,
    ...AUTHENTIC_ENGLISH_QUESTIONS_FLEn_1011
  ],
  hu_bio_1011: AUTHENTIC_BIOLOGY_QUESTIONS_HU_1011,

  // Jimma University (JU)
  ju_anthro_1012: AUTHENTIC_ANTHROPOLOGY_QUESTIONS_JU_1012,
  ju_physics_1011: [
    ...AUTHENTIC_PHYSICS_QUESTIONS_JU_1011,
    ...AUTHENTIC_PHYSICS_QUESTIONS_WKU_1011
  ],

  // Mekelle University (MU)
  mu_chem_1011: [
    ...AUTHENTIC_CHEMISTRY_QUESTIONS_MU_1011,
    ...AUTHENTIC_CHEMISTRY_QUESTIONS_WKU_1011
  ],

  // Bahir Dar University (BDU)
  bdu_inclusive_1012: AUTHENTIC_INCLUSIVENESS_QUESTIONS_BDU_1012,

  // Ambo University (AU)
  ambo_bio_1011: AUTHENTIC_BIOLOGY_QUESTIONS_HU_1011,

  // Haramaya University (HrU) & Arba Minch University (AMU)
  hru_econ_1011: AUTHENTIC_ECONOMICS_QUESTIONS_HRU_1011,
  amu_statics_1022: AUTHENTIC_STATICS_QUESTIONS_AMU_1022,

  // MoE National University Exit Exams (ፈተና መውጫ)
  exit_cs_2016: AUTHENTIC_EXIT_EXAM_CS_2016,
  exit_accounting_2016: AUTHENTIC_EXIT_EXAM_ACCOUNTING_2016,
  exit_ece_2016: AUTHENTIC_EXIT_EXAM_ECE_2016
};

/**
 * Retrieves authentic curriculum questions for a specific sheet.
 */
export function getAuthenticQuestionsForSheet(sheetId: string): AuthenticCurriculumQuestion[] {
  return AUTHENTIC_EXAM_SHEET_MAP[sheetId] || AUTHENTIC_MATH_QUESTIONS_WKU_1011;
}

/**
 * Aggregates all authentic questions across all sheets for a specific subject,
 * plus matching questions from the master authentic repository.
 */
export function getAllAuthenticQuestionsForSubject(subject: string): AuthenticCurriculumQuestion[] {
  const norm = subject.toLowerCase().trim();
  const pool: AuthenticCurriculumQuestion[] = [];
  const seenTexts = new Set<string>();

  const addIfUnique = (q: AuthenticCurriculumQuestion) => {
    const key = q.questionText.trim().toLowerCase().slice(0, 60);
    if (!seenTexts.has(key)) {
      seenTexts.add(key);
      pool.push(q);
    }
  };

  // 1. Gather from AUTHENTIC_EXAM_SHEET_MAP
  for (const [sheetKey, questions] of Object.entries(AUTHENTIC_EXAM_SHEET_MAP)) {
    if (
      sheetKey.includes(norm) ||
      norm.includes(sheetKey.split('_')[1] || '') ||
      (norm.includes('math') && sheetKey.includes('math')) ||
      (norm.includes('phys') && sheetKey.includes('physics')) ||
      (norm.includes('program') && sheetKey.includes('cpp')) ||
      (norm.includes('comput') && sheetKey.includes('cpp')) ||
      (norm.includes('logic') && sheetKey.includes('logic')) ||
      (norm.includes('eng') && sheetKey.includes('english')) ||
      (norm.includes('chem') && sheetKey.includes('chem')) ||
      (norm.includes('bio') && sheetKey.includes('bio')) ||
      (norm.includes('tech') && sheetKey.includes('emtech')) ||
      (norm.includes('apt') && sheetKey.includes('aptitude')) ||
      (norm.includes('soc') && (sheetKey.includes('anthro') || sheetKey.includes('inclusive') || sheetKey.includes('entrepreneur'))) ||
      (norm.includes('account') && sheetKey.includes('accounting')) ||
      (norm.includes('dsa') && sheetKey.includes('dsa')) ||
      (norm.includes('geog') && sheetKey.includes('geog')) ||
      (norm.includes('global') && sheetKey.includes('global')) ||
      (norm.includes('econ') && sheetKey.includes('econ')) ||
      (norm.includes('static') && sheetKey.includes('statics')) ||
      (norm.includes('ece') && sheetKey.includes('ece'))
    ) {
      questions.forEach(addIfUnique);
    }
  }

  // 2. Gather from AUTHENTIC_MASTER_QUESTIONS
  AUTHENTIC_MASTER_QUESTIONS.forEach(item => {
    const itemSubject = item.subject.toLowerCase();
    if (
      itemSubject === norm ||
      itemSubject.includes(norm) ||
      norm.includes(itemSubject) ||
      (norm.includes('math') && itemSubject.includes('math')) ||
      (norm.includes('phys') && itemSubject.includes('phys')) ||
      (norm.includes('comput') && itemSubject.includes('comput'))
    ) {
      addIfUnique({
        questionText: item.questionText,
        options: item.options,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
        amharicExplanation: item.amharicExplanation,
        topic: item.topic,
        unit: item.unit,
        chapter: item.chapter,
        difficulty: item.difficulty
      });
    }
  });

  return pool;
}
