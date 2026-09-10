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

/**
 * Maps each exam sheet ID to its verified authentic curriculum questions.
 */
export const AUTHENTIC_EXAM_SHEET_MAP: Record<string, AuthenticCurriculumQuestion[]> = {
  wku_math_1011: AUTHENTIC_MATH_QUESTIONS_WKU_1011,
  wku_cpp_1011: AUTHENTIC_CPP_QUESTIONS_WKU_1011,
  wku_physics_1011: AUTHENTIC_PHYSICS_QUESTIONS_WKU_1011,
  wku_emtech_1011: AUTHENTIC_EMTECH_QUESTIONS_WKU_1011,
  aau_logic_1011: AUTHENTIC_LOGIC_QUESTIONS_AAU_1011,
  aau_entrepreneur_1012: AUTHENTIC_ENTREPRENEURSHIP_QUESTIONS_AAU_1012,
  aau_math_1012: AUTHENTIC_MATH_QUESTIONS_AAU_1012,
  aau_english_1011: AUTHENTIC_ENGLISH_QUESTIONS_FLEn_1011,
  astu_physics_1011: AUTHENTIC_PHYSICS_QUESTIONS_ASTU_1011,
  astu_math_1012: AUTHENTIC_MATH_QUESTIONS_ASTU_1012,
  hu_english_1011: AUTHENTIC_ENGLISH_QUESTIONS_HU_1011,
  hu_bio_1011: AUTHENTIC_BIOLOGY_QUESTIONS_HU_1011,
  ju_anthro_1012: AUTHENTIC_ANTHROPOLOGY_QUESTIONS_JU_1012,
  ju_physics_1011: AUTHENTIC_PHYSICS_QUESTIONS_JU_1011,
  mu_chem_1011: AUTHENTIC_CHEMISTRY_QUESTIONS_MU_1011,
  bdu_inclusive_1012: AUTHENTIC_INCLUSIVENESS_QUESTIONS_BDU_1012,
  ambo_bio_1011: AUTHENTIC_BIOLOGY_QUESTIONS_HU_1011,
  g12_math_euee_2016: AUTHENTIC_MATH_QUESTIONS_EUEE_2016,
  g12_physics_euee_2016: AUTHENTIC_PHYSICS_QUESTIONS_EUEE_2016,
  g12_aptitude_euee_2016: AUTHENTIC_APTITUDE_QUESTIONS_EUEE_2016
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
      (norm.includes('soc') && (sheetKey.includes('anthro') || sheetKey.includes('inclusive') || sheetKey.includes('entrepreneur')))
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
