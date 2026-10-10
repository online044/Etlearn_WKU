import { getSupabase } from './supabaseClient';
import { safeStorage } from './safeStorage';
import { 
  QuestionBankRecord, 
  QuestionBankFilter, 
  QuestionValidationSummary, 
  QuestionValidationIssue,
  QuestionBankStats,
  BankQuestionType,
  BankDifficulty,
  BankExamCategory
} from '../types';
import { SEED_QUESTION_BANK } from '../data/seedQuestions';
import { getAll10kQuestionBankRecords } from '../data/ethiopianExams10kBank';
import { getFreshmanQuestionBankRecords } from '../data/questionBanks/freshmanCurriculumBank';
import { GENERAL_BIOLOGY_QUESTIONS } from '../data/generalBiologyQuestions';

export const LOCAL_STORAGE_QUESTIONS_KEY = 'ethiolearn_supabase_questions_cache';
export const LOCAL_STORAGE_PROGRESS_KEY = 'ethiolearn_user_question_progress';
export const LOCAL_STORAGE_BOOKMARKS_KEY = 'ethiolearn_user_question_bookmarks';

// ============================================================================
// 1. TEXT NORMALIZATION & FINGERPRINTING (Duplicate Prevention Engine)
// ============================================================================

/**
 * Normalizes question text by lowercasing, stripping punctuation, and removing excess whitespace.
 * Used to detect duplicate questions across differing punctuation or casing.
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%\^&\*;:{}=\-_`~()?"'<>\[\]\\|]/g, '') // remove punctuation
    .replace(/\s+/g, ' ') // collapse multiple whitespace
    .trim();
}

/**
 * Generates a deterministic fingerprint for a question based on its subject, course, and normalized text.
 */
export function generateQuestionFingerprint(course: string, subject: string, questionText: string): string {
  const normSubject = (subject || '').toLowerCase().trim();
  const normCourse = (course || '').toLowerCase().trim();
  const normText = normalizeQuestionText(questionText);
  return `${normSubject}::${normCourse}::${normText}`;
}

// ============================================================================
// 2. CACHE & SEED INITIALIZATION (Ensures offline resilience & instant load)
// ============================================================================

export function getCachedQuestions(): QuestionBankRecord[] {
  try {
    const raw = safeStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[getCachedQuestions error]:', e);
  }

  // Combine authentic 10k university exam bank with 19 freshman curriculum modules & General Biology
  const master10k = getAll10kQuestionBankRecords();
  const freshmanCurriculum = getFreshmanQuestionBankRecords();
  
  const mergedMap = new Map<string, QuestionBankRecord>();
  master10k.forEach(q => mergedMap.set(q.id, q));
  freshmanCurriculum.forEach(q => mergedMap.set(q.id, q));

  // Add General Biology questions following exact user structure
  GENERAL_BIOLOGY_QUESTIONS.forEach(q => {
    const optionsRaw = [
      { id: 'A', text: q.options.A },
      { id: 'B', text: q.options.B },
      { id: 'C', text: q.options.C },
      { id: 'D', text: q.options.D }
    ];
    const optionTexts = [q.options.A, q.options.B, q.options.C, q.options.D];
    const correctLetter = q.correct_answer;
    const letterIdx = correctLetter.charCodeAt(0) - 65;
    const correctText = optionTexts[letterIdx] || q.options.A;

    const record: QuestionBankRecord = {
      id: String(q.id),
      module_id: q.module_id,
      module_name: q.module_name,
      chapter: q.chapter,
      subject_id: String(q.module_id),
      subject: q.module_name,
      course: q.module_name,
      unit: q.chapter,
      topic: q.chapter,
      question: q.question,
      question_text: q.question,
      question_type: 'multiple_choice' as BankQuestionType,
      options: optionTexts,
      options_raw: optionsRaw,
      correct_answer: correctText,
      explanation: q.explanation,
      difficulty: q.difficulty as BankDifficulty,
      exam_category: 'practice_exam' as BankExamCategory,
      source: 'General Biology Module',
      source_unit: q.chapter,
      batch_id: 'general_biology_master',
      fingerprint: generateQuestionFingerprint(q.module_name, q.module_name, q.question),
      is_published: true,
      is_pro: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mergedMap.set(String(q.id), record);
  });

  const allCombined = Array.from(mergedMap.values());
  setCachedQuestions(allCombined);
  return allCombined;
}

export function setCachedQuestions(questions: QuestionBankRecord[]) {
  try {
    safeStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.warn('[setCachedQuestions error]:', e);
  }
}

// Map a raw database row from Supabase to QuestionBankRecord
export function mapDbQuestion(row: any): QuestionBankRecord {
  let optionsArr: string[] = [];
  const optionsRaw: Array<{ id: string; text: string }> = [];

  // 1. Array format
  if (Array.isArray(row.options)) {
    row.options.forEach((o: any, idx: number) => {
      const id = typeof o === 'object' && o?.id ? String(o.id) : String.fromCharCode(65 + idx);
      const text = typeof o === 'string' ? o.trim() : String(o?.text || o || '').trim();
      optionsArr.push(text);
      optionsRaw.push({ id, text });
    });
  } else if (Array.isArray(row.choices)) {
    row.choices.forEach((o: any, idx: number) => {
      const id = typeof o === 'object' && o?.id ? String(o.id) : String.fromCharCode(65 + idx);
      const text = typeof o === 'string' ? o.trim() : String(o?.text || o || '').trim();
      optionsArr.push(text);
      optionsRaw.push({ id, text });
    });
  } else if (row.options && typeof row.options === 'object') {
    // 2. Object dictionary: { "A": "...", "B": "...", "C": "...", "D": "..." }
    ['A', 'B', 'C', 'D', 'E'].forEach((letter) => {
      const val = row.options[letter] || row.options[letter.toLowerCase()];
      if (val !== undefined && val !== null) {
        const text = String(val).trim();
        optionsArr.push(text);
        optionsRaw.push({ id: letter, text });
      }
    });
    if (optionsArr.length === 0) {
      Object.entries(row.options).forEach(([k, v]) => {
        const text = String(v).trim();
        optionsArr.push(text);
        optionsRaw.push({ id: String(k).toUpperCase(), text });
      });
    }
  } else if (typeof row.options === 'string') {
    // 3. Serialized string JSON or pipe-delimited
    try {
      const parsed = JSON.parse(row.options);
      if (Array.isArray(parsed)) {
        parsed.forEach((o: any, idx: number) => {
          const id = typeof o === 'object' && o?.id ? String(o.id) : String.fromCharCode(65 + idx);
          const text = typeof o === 'string' ? o.trim() : String(o?.text || o || '').trim();
          optionsArr.push(text);
          optionsRaw.push({ id, text });
        });
      } else if (parsed && typeof parsed === 'object') {
        ['A', 'B', 'C', 'D', 'E'].forEach((letter) => {
          const val = parsed[letter] || parsed[letter.toLowerCase()];
          if (val !== undefined && val !== null) {
            const text = String(val).trim();
            optionsArr.push(text);
            optionsRaw.push({ id: letter, text });
          }
        });
      }
    } catch {
      optionsArr = row.options.split('|').map((s: string, idx: number) => {
        const text = s.trim();
        optionsRaw.push({ id: String.fromCharCode(65 + idx), text });
        return text;
      });
    }
  }

  // 4. Fallback to separate columns (e.g. option_a, option_b, option_c, option_d or choice_a/b/c/d or a/b/c/d)
  if (optionsArr.length === 0) {
    const optA = row.option_a ?? row.optionA ?? row.choice_a ?? row.choiceA ?? row.a ?? row.A;
    const optB = row.option_b ?? row.optionB ?? row.choice_b ?? row.choiceB ?? row.b ?? row.B;
    const optC = row.option_c ?? row.optionC ?? row.choice_c ?? row.choiceC ?? row.c ?? row.C;
    const optD = row.option_d ?? row.optionD ?? row.choice_d ?? row.choiceD ?? row.d ?? row.D;
    const optE = row.option_e ?? row.optionE ?? row.choice_e ?? row.choiceE ?? row.e ?? row.E;

    if (optA !== undefined && optB !== undefined) {
      [
        { id: 'A', text: String(optA).trim() },
        { id: 'B', text: String(optB).trim() },
        ...(optC !== undefined ? [{ id: 'C', text: String(optC).trim() }] : []),
        ...(optD !== undefined ? [{ id: 'D', text: String(optD).trim() }] : []),
        ...(optE !== undefined ? [{ id: 'E', text: String(optE).trim() }] : []),
      ].forEach(item => {
        optionsArr.push(item.text);
        optionsRaw.push(item);
      });
    }
  }

  const qText = String(row.question || row.question_text || row.questionText || row.prompt || row.text || row.title || row.body || '');
  const subjectStr = String(row.subject || row.course || row.module_name || row.module || row.category || 'General Biology');
  const courseStr = String(row.course || row.subject || row.module_name || subjectStr);
  const unitStr = String(row.unit || row.chapter || row.part || row.section || 'Unit 1');
  const chapterStr = row.chapter ? String(row.chapter) : unitStr;
  const topicStr = String(row.topic || row.chapter || row.unit || 'General Topic');
  const rawCorrect = String(
    row.correct_answer ?? 
    row.correctAnswer ?? 
    row.answer ?? 
    row.correct ?? 
    row.solution ?? 
    row.right_answer ?? 
    row.correct_option ?? 
    ''
  ).trim();

  // If correct answer is a letter 'A', 'B', 'C', 'D' but options have texts, normalize
  let resolvedCorrect = rawCorrect;
  if (/^[A-E]$/i.test(rawCorrect) && optionsArr.length > 0) {
    const idx = rawCorrect.toUpperCase().charCodeAt(0) - 65;
    if (optionsArr[idx]) {
      resolvedCorrect = optionsArr[idx];
    }
  }

  return {
    id: String(row.id || row.question_id || row._id || `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    subject_id: row.subject_id ? String(row.subject_id) : undefined,
    subject: subjectStr,
    course: courseStr,
    unit: unitStr,
    topic: topicStr,
    chapter: chapterStr,
    question: qText,
    question_text: qText,
    question_type: (row.question_type || 'multiple_choice') as BankQuestionType,
    options: optionsArr,
    options_raw: optionsRaw.length > 0 ? optionsRaw : optionsArr.map((text, i) => ({ id: String.fromCharCode(65 + i), text })),
    correct_answer: resolvedCorrect || rawCorrect,
    explanation: row.explanation || row.rationale || row.solution_explanation || row.reason ? String(row.explanation || row.rationale || row.solution_explanation || row.reason) : undefined,
    difficulty: (row.difficulty || 'medium') as BankDifficulty,
    exam_category: (row.exam_category || 'practice_exam') as BankExamCategory,
    source: row.source ? String(row.source) : 'Supabase Database',
    source_unit: row.source_unit ? String(row.source_unit) : (row.unit ? String(row.unit) : undefined),
    source_file: row.source_file ? String(row.source_file) : undefined,
    university: row.university ? String(row.university) : undefined,
    department: row.department ? String(row.department) : undefined,
    academic_year: row.academic_year ? String(row.academic_year) : undefined,
    semester: row.semester ? String(row.semester) : undefined,
    is_verified_official: Boolean(row.is_verified_official),
    batch_id: String(row.batch_id || 'supabase-live'),
    fingerprint: row.fingerprint || generateQuestionFingerprint(courseStr, subjectStr, qText),
    is_published: row.is_published !== false,
    is_pro: Boolean(row.is_pro),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString()
  };
}

// ============================================================================
// 2b. DYNAMIC TABLE RESOLVER (Supports both 'questions' and 'question' in Supabase)
// ============================================================================

let cachedQuestionsTableName: 'questions' | 'question' | null = null;

export async function resolveQuestionsTable(): Promise<string> {
  if (cachedQuestionsTableName) return cachedQuestionsTableName;
  const supabase = getSupabase();
  if (!supabase) return 'questions';

  try {
    // 1. Test 'questions' (plural)
    const resPlural = await supabase.from('questions').select('id').limit(1);
    if (!resPlural.error) {
      cachedQuestionsTableName = 'questions';
      return 'questions';
    }

    // 2. Test 'question' (singular)
    const resSingular = await supabase.from('question').select('id').limit(1);
    if (!resSingular.error) {
      console.log("[Supabase Questions] Auto-detected 'question' (singular) table in Supabase");
      cachedQuestionsTableName = 'question';
      return 'question';
    }
  } catch (e) {
    console.warn('[resolveQuestionsTable] Auto-detection error:', e);
  }

  return 'questions';
}

/**
 * Loads all live questions directly from the Supabase question / questions table.
 * Automatically saves them into local cache so they are immediately available
 * across all quizzes, practice drills, and exam generators.
 */
export async function fetchAllSupabaseQuestions(forceRefresh = false): Promise<QuestionBankRecord[]> {
  const supabase = getSupabase();
  let liveRows: any[] = [];
  let foundTable = '';

  if (supabase) {
    const tableNames = ['questions', 'question'];
    for (const table of tableNames) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(3000);

        if (!error && Array.isArray(data) && data.length > 0) {
          liveRows = data;
          foundTable = table;
          cachedQuestionsTableName = table as any;
          break;
        }
      } catch (err) {
        console.warn(`[fetchAllSupabaseQuestions] Error querying table '${table}':`, err);
      }
    }
  }

  // Also try backend proxy endpoint /api/questions if direct client returned nothing
  if (liveRows.length === 0) {
    try {
      const res = await fetch('/api/questions');
      if (res.ok) {
        const json = await res.json();
        if (json.questions && Array.isArray(json.questions) && json.questions.length > 0) {
          liveRows = json.questions;
          foundTable = 'api_questions';
        }
      }
    } catch (err) {
      console.warn('[fetchAllSupabaseQuestions] /api/questions fetch error:', err);
    }
  }

  if (liveRows.length > 0) {
    console.log(`[Supabase Questions] Successfully loaded ${liveRows.length} questions from '${foundTable}'`);
    const mappedQuestions = liveRows.map(mapDbQuestion);

    // Merge into local cache so questions are accessible offline and immediately
    const currentCached = getCachedQuestions();
    const map = new Map<string, QuestionBankRecord>();
    currentCached.forEach(q => map.set(q.id, q));
    mappedQuestions.forEach(q => map.set(q.id, q));
    const merged = Array.from(map.values());
    setCachedQuestions(merged);

    return mappedQuestions;
  }

  return getCachedQuestions();
}

// ============================================================================
// 3. FILE PARSING (JSON & CSV Import with Flexible Field Variations)
// ============================================================================

/**
 * Parses raw file content (JSON or CSV) into an array of question candidate objects.
 */
export function parseImportFile(fileContent: string, fileName: string): any[] {
  const isJson = fileName.toLowerCase().endsWith('.json') || fileContent.trim().startsWith('{') || fileContent.trim().startsWith('[');
  
  if (isJson) {
    try {
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.questions)) return parsed.questions;
        if (Array.isArray(parsed.data)) return parsed.data;
        if (Array.isArray(parsed.items)) return parsed.items;
        // If single question object
        if (parsed.question_text || parsed.question) return [parsed];
      }
      throw new Error('Invalid JSON format: Expected an array of questions or an object with a "questions" array.');
    } catch (err: any) {
      throw new Error(`JSON parsing failed: ${err.message}`);
    }
  }

  // Parse CSV
  return parseCsvQuestions(fileContent);
}

/**
 * Parses CSV content with quote handling and flexible column mapping.
 */
function parseCsvQuestions(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row.');
  }

  // Parse CSV line respecting double quotes
  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[\s_-]+/g, '_'));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    rows.push(obj);
  }

  return rows;
}

// ============================================================================
// 4. VALIDATION & DUPLICATE CHECKING ENGINE
// ============================================================================

export async function validateQuestionsBatch(
  rawQuestions: any[],
  defaultBatchId: string = `batch-${Date.now()}`
): Promise<QuestionValidationSummary> {
  const existingQuestions = await fetchAllQuestionsForDuplicateCheck();
  const existingFingerprints = new Set(existingQuestions.map(q => q.fingerprint || generateQuestionFingerprint(q.course, q.subject, q.question_text)));

  const batchFingerprints = new Set<string>();
  const readyToImport: QuestionBankRecord[] = [];
  const invalidDetails: QuestionValidationIssue[] = [];
  const duplicateDetails: Array<{ index: number; question_text: string; reason: string }> = [];

  rawQuestions.forEach((raw, index) => {
    const rowNum = index + 1;

    // 1. Flexible field extraction
    const questionText = (raw.question_text || raw.question || raw.text || raw.prompt || '').trim();
    let rawType = (raw.question_type || raw.type || 'multiple_choice').toLowerCase().replace(/[\s-]+/g, '_');
    
    // Normalize question type
    let questionType: BankQuestionType = 'multiple_choice';
    if (rawType.includes('true') || rawType === 'tf' || rawType === 'boolean') {
      questionType = 'true_false';
    } else if (rawType.includes('short')) {
      questionType = 'short_answer';
    } else if (rawType.includes('fill') || rawType.includes('blank')) {
      questionType = 'fill_in_the_blank';
    } else {
      questionType = 'multiple_choice';
    }

    // Options extraction
    let options: string[] = [];
    if (Array.isArray(raw.options)) {
      options = raw.options.map(o => typeof o === 'string' ? o.trim() : (o.text || String(o)).trim()).filter(Boolean);
    } else if (raw.options && typeof raw.options === 'object') {
      // Handles dictionary: { "A": "...", "B": "...", "C": "...", "D": "..." }
      const keyOrder = ['A', 'B', 'C', 'D', 'E'];
      const fromLetters: string[] = [];
      keyOrder.forEach(k => {
        const val = raw.options[k] || raw.options[k.toLowerCase()];
        if (val !== undefined && val !== null) {
          fromLetters.push(String(val).trim());
        }
      });
      if (fromLetters.length >= 2) {
        options = fromLetters;
      } else {
        options = Object.values(raw.options).map(v => typeof v === 'string' ? v.trim() : String(v)).filter(Boolean);
      }
    } else if (typeof raw.options === 'string' && raw.options.trim().length > 0) {
      if (raw.options.includes('|')) {
        options = raw.options.split('|').map((s: string) => s.trim()).filter(Boolean);
      } else if (raw.options.includes(';;')) {
        options = raw.options.split(';;').map((s: string) => s.trim()).filter(Boolean);
      } else {
        options = raw.options.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    } else if (raw.option_a || raw.option_b || raw.option_c || raw.option_d) {
      // Check column options in CSV
      const opts = [raw.option_a, raw.option_b, raw.option_c, raw.option_d, raw.option_e].filter(Boolean).map(s => String(s).trim());
      options = opts;
    }

    if (questionType === 'true_false' && options.length === 0) {
      options = ['True', 'False'];
    }

    // Correct Answer extraction & mapping
    let correctAnswer = (raw.correct_answer || raw.correctAnswer || raw.answer || raw.correct || '').trim();

    // If answer is provided as "A", "B", "C", "D" and we have options, resolve to text
    if (options.length > 0) {
      const upper = correctAnswer.toUpperCase();
      if (upper === 'A' && options[0]) correctAnswer = options[0];
      else if (upper === 'B' && options[1]) correctAnswer = options[1];
      else if (upper === 'C' && options[2]) correctAnswer = options[2];
      else if (upper === 'D' && options[3]) correctAnswer = options[3];
      else if (upper === 'E' && options[4]) correctAnswer = options[4];
      else if (/^\d+$/.test(correctAnswer)) {
        const idx = parseInt(correctAnswer, 10);
        if (options[idx]) correctAnswer = options[idx];
      }
    }

    const subject = (raw.subject || raw.subject_name || raw.module_name || 'General Biology').trim();
    const course = (raw.course || raw.course_name || raw.module_name || `${subject}`).trim();
    const unit = (raw.unit || raw.unit_name || raw.chapter || raw.source_unit || 'Unit 1').trim();
    const topic = (raw.topic || raw.topic_name || raw.chapter || unit).trim();
    const chapter = raw.chapter ? String(raw.chapter).trim() : unit;
    const isPro = Boolean(raw.is_pro || raw.isPro);

    // Difficulty normalization
    let rawDiff = (raw.difficulty || raw.level || 'medium').toLowerCase().trim();
    let difficulty: BankDifficulty = 'medium';
    if (rawDiff.includes('easy')) difficulty = 'easy';
    else if (rawDiff.includes('hard') || rawDiff.includes('advanced')) difficulty = 'hard';

    // Exam category normalization
    let rawCat = (raw.exam_category || raw.category || 'practice_exam').toLowerCase().trim().replace(/[\s-]+/g, '_');
    let examCategory: BankExamCategory = 'practice_exam';
    if (rawCat.includes('univ')) examCategory = 'university_exam';
    else if (rawCat.includes('mock')) examCategory = 'mock_exam';
    else if (rawCat.includes('quiz')) examCategory = 'quiz';

    const source = raw.source ? String(raw.source).trim() : 'imported';
    const batchId = (raw.batch_id || defaultBatchId).trim();
    const explanation = raw.explanation ? String(raw.explanation).trim() : undefined;
    const university = raw.university ? String(raw.university).trim() : undefined;
    const department = raw.department ? String(raw.department).trim() : undefined;
    const academicYear = raw.academic_year || raw.academicYear ? String(raw.academic_year || raw.academicYear).trim() : undefined;
    const semester = raw.semester ? String(raw.semester).trim() : undefined;
    const isVerifiedOfficial = Boolean(raw.is_verified_official || raw.isVerifiedOfficial);
    const isPublished = raw.is_published !== false;

    // ─── VALIDATION CHECKS ───
    if (!questionText) {
      invalidDetails.push({ index: rowNum, issue: 'Question text is empty or missing.', severity: 'error' });
      return;
    }

    if (questionText.length < 5) {
      invalidDetails.push({ index: rowNum, question_text: questionText, issue: 'Question text is too short (minimum 5 characters).', severity: 'error' });
      return;
    }

    if (!correctAnswer) {
      invalidDetails.push({ index: rowNum, question_text: questionText, issue: 'Correct answer is missing.', severity: 'error' });
      return;
    }

    if (questionType === 'multiple_choice') {
      if (options.length < 2) {
        invalidDetails.push({ index: rowNum, question_text: questionText, issue: 'Multiple choice question requires at least 2 options.', severity: 'error' });
        return;
      }
      // Check if correct answer matches one of the options (case-insensitive fuzzy check)
      const matchesOption = options.some(opt => opt.toLowerCase() === correctAnswer.toLowerCase());
      if (!matchesOption) {
        // If not matching, append or warn
        options.push(correctAnswer);
      }
    }

    // ─── DUPLICATE CHECKS ───
    const fingerprint = generateQuestionFingerprint(course, subject, questionText);

    // Check duplicate in same import file
    if (batchFingerprints.has(fingerprint)) {
      duplicateDetails.push({
        index: rowNum,
        question_text: questionText,
        reason: 'Duplicate question found within the same uploaded file.'
      });
      return;
    }

    // Check duplicate in database
    if (existingFingerprints.has(fingerprint)) {
      duplicateDetails.push({
        index: rowNum,
        question_text: questionText,
        reason: 'Question already exists in the permanent question bank.'
      });
      return;
    }

    batchFingerprints.add(fingerprint);

    const record: QuestionBankRecord = {
      id: raw.id ? String(raw.id) : `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      question: questionText,
      question_text: questionText,
      question_type: questionType,
      options,
      options_raw: options.map((t, i) => ({ id: String.fromCharCode(65 + i), text: t })),
      correct_answer: correctAnswer,
      explanation,
      subject,
      course,
      unit,
      topic,
      chapter,
      difficulty,
      exam_category: examCategory,
      source,
      source_unit: raw.source_unit || unit,
      source_file: raw.source_file || undefined,
      university,
      department,
      academic_year: academicYear,
      semester,
      is_verified_official: isVerifiedOfficial,
      batch_id: batchId,
      fingerprint,
      is_published: isPublished,
      is_pro: isPro,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    readyToImport.push(record);
  });

  return {
    total: rawQuestions.length,
    valid: readyToImport.length,
    invalid: invalidDetails.length,
    duplicates: duplicateDetails.length,
    readyToImport,
    invalidDetails,
    duplicateDetails
  };
}

// Fetch all questions fingerprint list from DB or Cache for fast duplicate checking
async function fetchAllQuestionsForDuplicateCheck(): Promise<{ fingerprint: string; question_text: string; subject: string; course: string }[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('fingerprint, question_text, subject, course');
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('[Duplicate Check fetch error]:', e);
    }
  }

  // Fallback to cached questions
  const cached = getCachedQuestions();
  return cached.map(q => ({
    fingerprint: q.fingerprint || generateQuestionFingerprint(q.course, q.subject, q.question_text),
    question_text: q.question_text,
    subject: q.subject,
    course: q.course
  }));
}

// ============================================================================
// 5. IMPORT ENGINE (Safe Batch / Chunked Insertion with Progress Feedback)
// ============================================================================

export async function importQuestionsBatch(
  questions: QuestionBankRecord[],
  onProgress?: (imported: number, total: number, statusText: string) => void
): Promise<{ success: boolean; importedCount: number; error?: string }> {
  if (questions.length === 0) {
    return { success: true, importedCount: 0 };
  }

  const total = questions.length;
  let importedCount = 0;
  const CHUNK_SIZE = 50; // Insert in safe chunks of 50
  const supabase = getSupabase();

  onProgress?.(0, total, 'Preparing batch transaction...');

  // Update local cache first
  const currentCache = getCachedQuestions();
  const cacheMap = new Map<string, QuestionBankRecord>();
  currentCache.forEach(q => cacheMap.set(q.id, q));

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = questions.slice(i, i + CHUNK_SIZE);
    const stepStart = i + 1;
    const stepEnd = Math.min(i + CHUNK_SIZE, total);

    onProgress?.(importedCount, total, `Importing questions ${stepStart}–${stepEnd} of ${total}...`);

    if (supabase) {
      try {
        const { error } = await supabase
          .from('questions')
          .upsert(
            chunk.map(q => ({
              id: q.id,
              question: q.question || q.question_text,
              question_text: q.question_text || q.question,
              question_type: q.question_type || 'multiple_choice',
              options: q.options,
              correct_answer: q.correct_answer,
              explanation: q.explanation || null,
              subject: q.subject,
              course: q.course || q.subject,
              unit: q.unit || 'Unit 1',
              topic: q.topic || q.unit || 'General Topic',
              chapter: q.chapter || q.unit || 'Unit 1',
              module_id: (q as any).module_id || 5,
              module_name: (q as any).module_name || q.subject,
              difficulty: q.difficulty || 'medium',
              exam_category: q.exam_category || 'practice_exam',
              source: q.source || 'imported',
              source_unit: q.source_unit || q.unit,
              source_file: q.source_file || null,
              university: q.university || null,
              department: q.department || null,
              academic_year: q.academic_year || null,
              semester: q.semester || null,
              is_verified_official: q.is_verified_official || false,
              batch_id: q.batch_id || 'manual',
              fingerprint: q.fingerprint,
              is_published: q.is_published !== undefined ? q.is_published : true,
              is_pro: Boolean(q.is_pro),
              created_at: q.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            })),
            { onConflict: 'id' }
          );

        if (error) {
          console.warn('[Supabase importQuestionsBatch chunk error]:', error.message);
        }
      } catch (err: any) {
        console.warn('[Supabase importQuestionsBatch exception]:', err);
      }
    }

    // Add chunk to cache
    chunk.forEach(q => cacheMap.set(q.id, q));
    importedCount = stepEnd;
    onProgress?.(importedCount, total, `Imported: ${importedCount}/${total}`);
    // Yield brief tick for UI update
    await new Promise(res => setTimeout(res, 40));
  }

  // Save merged cache
  setCachedQuestions(Array.from(cacheMap.values()));
  onProgress?.(total, total, `Completed: ${total}/${total}`);

  return { success: true, importedCount: total };
}

// ============================================================================
// 6. PAGINATED RETRIEVAL & FILTERING (Never loads all records into DOM)
// ============================================================================

export async function fetchQuestionsPaginated(
  filter: QuestionBankFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<{ questions: QuestionBankRecord[]; totalCount: number; error?: string }> {
  const supabase = getSupabase();

  if (supabase) {
    const primaryTable = await resolveQuestionsTable();
    const candidateTables = [primaryTable, primaryTable === 'questions' ? 'question' : 'questions'];

    for (const table of candidateTables) {
      try {
        let query = supabase
          .from(table)
          .select('*', { count: 'exact' });

        if (filter.course && filter.course !== 'All') {
          query = query.eq('course', filter.course);
        }
        if (filter.subject && filter.subject !== 'All') {
          query = query.eq('subject', filter.subject);
        }
        if (filter.unit && filter.unit !== 'All') {
          query = query.eq('unit', filter.unit);
        }
        if (filter.difficulty && filter.difficulty !== 'All') {
          query = query.eq('difficulty', filter.difficulty);
        }
        if (filter.questionType && filter.questionType !== 'All') {
          query = query.eq('question_type', filter.questionType);
        }
        if (filter.examCategory && filter.examCategory !== 'All') {
          query = query.eq('exam_category', filter.examCategory);
        }
        if (filter.batchId && filter.batchId !== 'All') {
          query = query.eq('batch_id', filter.batchId);
        }
        if (filter.university && filter.university !== 'All') {
          query = query.eq('university', filter.university);
        }
        if (filter.isPublished !== undefined && filter.isPublished !== 'all') {
          query = query.eq('is_published', Boolean(filter.isPublished));
        }
        if (filter.isVerifiedOfficial !== undefined && filter.isVerifiedOfficial !== 'all') {
          query = query.eq('is_verified_official', Boolean(filter.isVerifiedOfficial));
        }
        if (filter.search && filter.search.trim()) {
          const s = filter.search.trim();
          query = query.or(`question_text.ilike.%${s}%,explanation.ilike.%${s}%,subject.ilike.%${s}%,course.ilike.%${s}%`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        query = query.order('id', { ascending: true }).range(from, to);

        const { data, count, error } = await query;

        if (!error && Array.isArray(data) && data.length > 0) {
          return {
            questions: data.map(mapDbQuestion),
            totalCount: count || data.length
          };
        }
        if (error) {
          console.warn(`[fetchQuestionsPaginated warning for '${table}']]:`, error.message);
        }
      } catch (e) {
        console.warn(`[fetchQuestionsPaginated exception for '${table}']]:`, e);
      }
    }
  }

  // Fallback to local storage cache if Supabase is offline
  const allCached = getCachedQuestions();
  let filtered = allCached;

  if (filter.course && filter.course !== 'All') {
    filtered = filtered.filter(q => q.course === filter.course);
  }
  if (filter.subject && filter.subject !== 'All') {
    filtered = filtered.filter(q => q.subject === filter.subject);
  }
  if (filter.unit && filter.unit !== 'All') {
    filtered = filtered.filter(q => q.unit === filter.unit);
  }
  if (filter.difficulty && filter.difficulty !== 'All') {
    filtered = filtered.filter(q => q.difficulty === filter.difficulty);
  }
  if (filter.questionType && filter.questionType !== 'All') {
    filtered = filtered.filter(q => q.question_type === filter.questionType);
  }
  if (filter.examCategory && filter.examCategory !== 'All') {
    filtered = filtered.filter(q => q.exam_category === filter.examCategory);
  }
  if (filter.batchId && filter.batchId !== 'All') {
    filtered = filtered.filter(q => q.batch_id === filter.batchId);
  }
  if (filter.university && filter.university !== 'All') {
    filtered = filtered.filter(q => q.university === filter.university);
  }
  if (filter.isPublished !== undefined && filter.isPublished !== 'all') {
    filtered = filtered.filter(q => q.is_published === Boolean(filter.isPublished));
  }
  if (filter.isVerifiedOfficial !== undefined && filter.isVerifiedOfficial !== 'all') {
    filtered = filtered.filter(q => q.is_verified_official === Boolean(filter.isVerifiedOfficial));
  }
  if (filter.search && filter.search.trim()) {
    const s = filter.search.toLowerCase().trim();
    filtered = filtered.filter(q => 
      q.question_text.toLowerCase().includes(s) || 
      (q.explanation && q.explanation.toLowerCase().includes(s)) ||
      q.subject.toLowerCase().includes(s) ||
      q.course.toLowerCase().includes(s)
    );
  }

  const totalCount = filtered.length;
  const from = (page - 1) * pageSize;
  const pagedQuestions = filtered.slice(from, from + pageSize);

  return { questions: pagedQuestions, totalCount };
}

// ============================================================================
// 7. REAL DATABASE STATISTICS (No fake numbers)
// ============================================================================

export async function fetchQuestionBankStats(): Promise<QuestionBankStats> {
  const supabase = getSupabase();
  let questions: QuestionBankRecord[] = [];

  if (supabase) {
    try {
      const table = await resolveQuestionsTable();
      for (const t of [table, table === 'questions' ? 'question' : 'questions']) {
        const { data, error } = await supabase
          .from(t)
          .select('*')
          .limit(3000);
        if (!error && Array.isArray(data) && data.length > 0) {
          questions = data.map(mapDbQuestion);
          break;
        }
      }
    } catch (e) {
      console.warn('[fetchQuestionBankStats exception]:', e);
    }
  }

  if (questions.length === 0) {
    questions = getCachedQuestions();
  }

  const stats: QuestionBankStats = {
    totalQuestions: questions.length,
    publishedQuestions: questions.filter(q => q.is_published).length,
    unpublishedQuestions: questions.filter(q => !q.is_published).length,
    batchCount: new Set(questions.map(q => q.batch_id)).size,
    byCourse: {},
    bySubject: {},
    byUnit: {},
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    byType: {
      multiple_choice: 0,
      true_false: 0,
      short_answer: 0,
      fill_in_the_blank: 0
    },
    byExamCategory: {
      practice_exam: 0,
      university_exam: 0,
      mock_exam: 0,
      quiz: 0
    },
    byUniversity: {}
  };

  questions.forEach(q => {
    // Course
    stats.byCourse[q.course] = (stats.byCourse[q.course] || 0) + 1;
    // Subject
    if (q.subject) {
      stats.bySubject![q.subject] = (stats.bySubject![q.subject] || 0) + 1;
    }
    // Unit
    stats.byUnit[q.unit] = (stats.byUnit[q.unit] || 0) + 1;
    // Difficulty
    if (q.difficulty in stats.byDifficulty) {
      stats.byDifficulty[q.difficulty]++;
    }
    // Type
    if (q.question_type in stats.byType) {
      stats.byType[q.question_type]++;
    }
    // Exam Category
    if (q.exam_category in stats.byExamCategory) {
      stats.byExamCategory[q.exam_category]++;
    }
    // University
    if (q.university) {
      stats.byUniversity![q.university] = (stats.byUniversity![q.university] || 0) + 1;
    }
  });

  return stats;
}

// ============================================================================
// 8. CRUD ACTIONS (Edit, Delete, Bulk Publish, Bulk Delete)
// ============================================================================

export async function updateQuestion(id: string, updates: Partial<QuestionBankRecord>): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) console.warn('[updateQuestion error]:', error.message);
    } catch (e) {
      console.warn('[updateQuestion exception]:', e);
    }
  }

  // Update local cache
  const cached = getCachedQuestions();
  const updated = cached.map(q => q.id === id ? { ...q, ...updates, updated_at: new Date().toISOString() } : q);
  setCachedQuestions(updated);

  return { success: true };
}

export async function deleteQuestion(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);
      if (error) console.warn('[deleteQuestion error]:', error.message);
    } catch (e) {
      console.warn('[deleteQuestion exception]:', e);
    }
  }

  // Update local cache
  const cached = getCachedQuestions();
  setCachedQuestions(cached.filter(q => q.id !== id));

  return { success: true };
}

export async function bulkDeleteQuestions(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .in('id', ids);
      if (error) console.warn('[bulkDeleteQuestions error]:', error.message);
    } catch (e) {
      console.warn('[bulkDeleteQuestions exception]:', e);
    }
  }

  const idSet = new Set(ids);
  const cached = getCachedQuestions();
  setCachedQuestions(cached.filter(q => !idSet.has(q.id)));

  return { success: true, count: ids.length };
}

export async function bulkPublishQuestions(ids: string[], isPublished: boolean): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_published: isPublished, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) console.warn('[bulkPublishQuestions error]:', error.message);
    } catch (e) {
      console.warn('[bulkPublishQuestions exception]:', e);
    }
  }

  const idSet = new Set(ids);
  const cached = getCachedQuestions();
  setCachedQuestions(cached.map(q => idSet.has(q.id) ? { ...q, is_published: isPublished, updated_at: new Date().toISOString() } : q));

  return { success: true, count: ids.length };
}

// ============================================================================
// 9. EXPORT ENGINE (JSON & CSV compatible with importer)
// ============================================================================

export async function exportQuestions(filter: QuestionBankFilter, format: 'json' | 'csv' = 'json'): Promise<string> {
  // Fetch matching questions without pagination limits (up to 2000 per export)
  const result = await fetchQuestionsPaginated(filter, 1, 2000);
  const list = result.questions;

  if (format === 'json') {
    return JSON.stringify({ questions: list }, null, 2);
  }

  // Format as CSV
  const headers = [
    'question_text',
    'question_type',
    'options',
    'correct_answer',
    'explanation',
    'subject',
    'course',
    'unit',
    'chapter',
    'difficulty',
    'exam_category',
    'source',
    'university',
    'department',
    'academic_year',
    'semester',
    'is_verified_official',
    'batch_id'
  ];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '';
    let str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = list.map(q => [
    escapeCsv(q.question_text),
    escapeCsv(q.question_type),
    escapeCsv(q.options.join('|')),
    escapeCsv(q.correct_answer),
    escapeCsv(q.explanation || ''),
    escapeCsv(q.subject),
    escapeCsv(q.course),
    escapeCsv(q.unit),
    escapeCsv(q.chapter || ''),
    escapeCsv(q.difficulty),
    escapeCsv(q.exam_category),
    escapeCsv(q.source || 'imported'),
    escapeCsv(q.university || ''),
    escapeCsv(q.department || ''),
    escapeCsv(q.academic_year || ''),
    escapeCsv(q.semester || ''),
    escapeCsv(q.is_verified_official ? 'true' : 'false'),
    escapeCsv(q.batch_id)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

// ============================================================================
// 10. STUDENT RANDOM EXAM GENERATION (Zero AI, Pure Supabase Retrieval)
// ============================================================================

export interface ExamGenerationConfig {
  course?: string;
  subject?: string;
  unit?: string;
  topic?: string;
  difficulty?: BankDifficulty;
  difficultyDistribution?: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
  examCategory?: BankExamCategory;
  university?: string;
  totalQuestions: number;
  excludedIds?: string[];
}

/**
 * Retrieves pre-generated, published questions from the database matching the exam specification.
 * Fully randomized, zero AI calls, deduplicated against recently taken question IDs.
 */
export async function generateRandomExamQuestions(config: ExamGenerationConfig): Promise<QuestionBankRecord[]> {
  const supabase = getSupabase();
  let candidatePool: QuestionBankRecord[] = [];

  if (supabase) {
    const primaryTable = await resolveQuestionsTable();
    const candidateTables = [primaryTable, primaryTable === 'questions' ? 'question' : 'questions'];

    for (const table of candidateTables) {
      try {
        let query = supabase.from(table).select('*');

        if (config.course && config.course !== 'All' && !config.course.startsWith('All First-Year')) {
          query = query.or(`course.ilike.%${config.course}%,subject.ilike.%${config.course}%`);
        } else if (config.subject && config.subject !== 'All' && !config.subject.startsWith('All First-Year')) {
          query = query.or(`subject.ilike.%${config.subject}%,course.ilike.%${config.subject}%`);
        }

        if (config.unit && config.unit !== 'All' && config.unit !== 'All Units') {
          query = query.eq('unit', config.unit);
        }

        if (config.topic && config.topic !== 'All' && config.topic !== 'All Topics') {
          query = query.eq('topic', config.topic);
        }

        const { data, error } = await query.limit(1000);
        if (!error && Array.isArray(data) && data.length > 0) {
          candidatePool = data.map(mapDbQuestion);
          break;
        }

        // If specific filtered query returned 0, try fetching questions from this table
        if (!candidatePool.length) {
          const { data: allData, error: allErr } = await supabase.from(table).select('*').limit(1000);
          if (!allErr && Array.isArray(allData) && allData.length > 0) {
            candidatePool = allData.map(mapDbQuestion);
            break;
          }
        }
      } catch (e) {
        console.warn(`[generateRandomExamQuestions exception for '${table}']]:`, e);
      }
    }
  }

  // Fallback to cached questions if Supabase is offline or returned empty
  if (candidatePool.length === 0) {
    candidatePool = getCachedQuestions().filter(q => q.is_published);
  }

  // Filter in memory according to config
  let filtered = candidatePool;
  if (config.subject && config.subject !== 'All' && !config.subject.startsWith('All First-Year')) {
    const subLower = config.subject.toLowerCase();
    const subMatches = candidatePool.filter(q => 
      q.subject.toLowerCase().includes(subLower) || 
      q.course.toLowerCase().includes(subLower)
    );
    if (subMatches.length >= 3) {
      filtered = subMatches;
    }
  }

  if (config.unit && config.unit !== 'All' && config.unit !== 'All Units') {
    const unitMatches = filtered.filter(q => q.unit === config.unit);
    if (unitMatches.length >= 3) {
      filtered = unitMatches;
    }
  }

  if (config.difficulty && (config.difficulty as string) !== 'all') {
    const diffMatches = filtered.filter(q => q.difficulty === config.difficulty);
    if (diffMatches.length >= 3) {
      filtered = diffMatches;
    }
  }

  candidatePool = filtered.length > 0 ? filtered : candidatePool;

  if (config.examCategory && (config.examCategory as string) !== 'All') {
    const catMatches = candidatePool.filter(q => q.exam_category === config.examCategory);
    if (catMatches.length >= 3) candidatePool = catMatches;
  }
  if (config.university && config.university !== 'All') {
    const uniMatches = candidatePool.filter(q => q.university === config.university);
    if (uniMatches.length >= 3) candidatePool = uniMatches;
  }

  // Filter out recently answered questions if possible to avoid repetition
  const excludedSet = new Set(config.excludedIds || []);
  let available = candidatePool.filter(q => !excludedSet.has(q.id));
  if (available.length < config.totalQuestions) {
    // If not enough unseen questions, reuse from pool
    available = candidatePool;
  }

  // Handle difficulty distribution if specified
  if (config.difficultyDistribution) {
    const easyCount = config.difficultyDistribution.easy || 0;
    const medCount = config.difficultyDistribution.medium || 0;
    const hardCount = config.difficultyDistribution.hard || 0;

    const easyPool = available.filter(q => q.difficulty === 'easy').sort(() => 0.5 - Math.random());
    const medPool = available.filter(q => q.difficulty === 'medium').sort(() => 0.5 - Math.random());
    const hardPool = available.filter(q => q.difficulty === 'hard').sort(() => 0.5 - Math.random());

    const selected: QuestionBankRecord[] = [
      ...easyPool.slice(0, easyCount),
      ...medPool.slice(0, medCount),
      ...hardPool.slice(0, hardCount)
    ];

    // If we didn't fill the total requested, top up with remaining random
    if (selected.length < config.totalQuestions) {
      const selectedIds = new Set(selected.map(s => s.id));
      const remaining = available.filter(q => !selectedIds.has(q.id)).sort(() => 0.5 - Math.random());
      selected.push(...remaining.slice(0, config.totalQuestions - selected.length));
    }

    return selected.sort(() => 0.5 - Math.random());
  }

  // If specific single difficulty requested
  if (config.difficulty && config.difficulty !== 'medium' as any) {
    const diffMatched = available.filter(q => q.difficulty === config.difficulty);
    if (diffMatched.length >= config.totalQuestions) {
      return diffMatched.sort(() => 0.5 - Math.random()).slice(0, config.totalQuestions);
    }
  }

  // Standard random shuffle
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(config.totalQuestions, shuffled.length));
}

// ============================================================================
// 11. QUESTION & OPTION RANDOMIZATION (Safely maps correct answer)
// ============================================================================

export interface RandomizedQuizQuestion {
  id: string;
  originalId: string;
  subject: string;
  course: string;
  unit: string;
  topic?: string;
  difficulty: BankDifficulty;
  question_type: BankQuestionType;
  question: string;
  options: Array<{ id: 'A' | 'B' | 'C' | 'D'; text: string }>;
  correct_answer_id: 'A' | 'B' | 'C' | 'D';
  correct_answer_text: string;
  explanation?: string;
  source?: string;
  source_unit?: string;
  source_file?: string;
  is_pro?: boolean;
}

/**
 * Shuffles options for a question while guaranteeing the correct answer ID ('A'|'B'|'C'|'D')
 * points to the exact correct text without modifying the database question record.
 */
export function randomizeQuestionWithMappedAnswer(q: QuestionBankRecord): RandomizedQuizQuestion {
  // Determine correct answer text
  let correctText = (q.correct_answer || '').trim();
  
  // If correct_answer was stored as a letter "A", "B", "C", "D"
  if (/^[A-D]$/i.test(correctText)) {
    const letterIdx = correctText.toUpperCase().charCodeAt(0) - 65;
    if (q.options[letterIdx]) {
      correctText = q.options[letterIdx].trim();
    }
  }

  // Extract raw option texts
  const optionTexts = q.options.length >= 2 
    ? [...q.options] 
    : (q.options_raw?.map(o => o.text) || []);

  // Ensure 4 choices if possible
  while (optionTexts.length < 4 && q.question_type === 'multiple_choice') {
    optionTexts.push(`Option ${String.fromCharCode(65 + optionTexts.length)}`);
  }

  // Shuffle option texts (Fisher-Yates)
  const shuffledTexts = [...optionTexts];
  for (let i = shuffledTexts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledTexts[i], shuffledTexts[j]] = [shuffledTexts[j], shuffledTexts[i]];
  }

  const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const formattedOptions: Array<{ id: 'A' | 'B' | 'C' | 'D'; text: string }> = shuffledTexts.slice(0, 4).map((text, idx) => ({
    id: letters[idx],
    text
  }));

  // Find which letter now holds the correct text
  let mappedCorrectId: 'A' | 'B' | 'C' | 'D' = 'A';
  const foundIdx = formattedOptions.findIndex(o => o.text.trim().toLowerCase() === correctText.toLowerCase());
  if (foundIdx >= 0) {
    mappedCorrectId = letters[foundIdx];
  } else {
    // If not found, assign to option A and update text
    formattedOptions[0].text = correctText;
    mappedCorrectId = 'A';
  }

  return {
    id: `quiz_${q.id}_${Math.random().toString(36).substring(2, 6)}`,
    originalId: q.id,
    subject: q.subject,
    course: q.course,
    unit: q.unit,
    topic: q.topic,
    difficulty: q.difficulty,
    question_type: q.question_type,
    question: q.question_text || q.question || '',
    options: formattedOptions,
    correct_answer_id: mappedCorrectId,
    correct_answer_text: correctText,
    explanation: q.explanation,
    source: q.source,
    source_unit: q.source_unit,
    source_file: q.source_file,
    is_pro: q.is_pro
  };
}

// ============================================================================
// 12. STUDENT PROGRESS & ACCURACY TRACKING
// ============================================================================

export async function recordQuestionProgress(
  userId: string,
  questionId: string,
  isCorrect: boolean,
  chosenAnswer: string
): Promise<void> {
  if (!userId || !questionId) return;

  const supabase = getSupabase();
  if (supabase) {
    try {
      // Upsert attempt into Supabase question_progress table
      const { data: existing } = await supabase
        .from('question_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .maybeSingle();

      const now = new Date().toISOString();
      if (existing) {
        await supabase
          .from('question_progress')
          .update({
            attempts: (existing.attempts || 1) + 1,
            correct_attempts: isCorrect ? (existing.correct_attempts || 0) + 1 : (existing.correct_attempts || 0),
            incorrect_attempts: !isCorrect ? (existing.incorrect_attempts || 0) + 1 : (existing.incorrect_attempts || 0),
            last_answer: chosenAnswer,
            last_attempt_at: now
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('question_progress')
          .insert({
            id: `prog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            user_id: userId,
            question_id: questionId,
            attempts: 1,
            correct_attempts: isCorrect ? 1 : 0,
            incorrect_attempts: isCorrect ? 0 : 1,
            last_answer: chosenAnswer,
            last_attempt_at: now
          });
      }
    } catch (e) {
      console.warn('[recordQuestionProgress Supabase error]:', e);
    }
  }

  // Backup to Server API
  try {
    await fetch('/api/questions/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionId, isCorrect, chosenAnswer })
    });
  } catch (e) {
    // Ignore server error
  }

  // Update local storage progress cache
  try {
    const raw = safeStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
    const progressList: any[] = raw ? JSON.parse(raw) : [];
    const idx = progressList.findIndex(p => p.question_id === questionId && p.user_id === userId);
    const now = new Date().toISOString();

    if (idx >= 0) {
      progressList[idx].attempts = (progressList[idx].attempts || 1) + 1;
      if (isCorrect) progressList[idx].correct_attempts = (progressList[idx].correct_attempts || 0) + 1;
      else progressList[idx].incorrect_attempts = (progressList[idx].incorrect_attempts || 0) + 1;
      progressList[idx].last_answer = chosenAnswer;
      progressList[idx].last_attempt_at = now;
    } else {
      progressList.push({
        id: `prog_${Date.now()}`,
        user_id: userId,
        question_id: questionId,
        attempts: 1,
        correct_attempts: isCorrect ? 1 : 0,
        incorrect_attempts: isCorrect ? 0 : 1,
        last_answer: chosenAnswer,
        last_attempt_at: now
      });
    }
    safeStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(progressList));
  } catch (e) {
    console.warn('[Progress Local Storage]:', e);
  }
}

export async function fetchUserQuestionProgress(userId: string): Promise<any[]> {
  if (!userId) return [];
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('question_progress')
        .select('*')
        .eq('user_id', userId);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
      console.warn('[fetchUserQuestionProgress Supabase error]:', e);
    }
  }

  // Try server endpoint
  try {
    const res = await fetch(`/api/questions/progress?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.progress) && json.progress.length > 0) return json.progress;
    }
  } catch {}

  // Fallback to local storage
  try {
    const raw = safeStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list.filter(p => p.user_id === userId);
    }
  } catch {}

  return [];
}

// ============================================================================
// 13. BOOKMARKS ENGINE
// ============================================================================

export async function toggleQuestionBookmark(userId: string, questionId: string): Promise<boolean> {
  if (!userId || !questionId) return false;

  let isNowBookmarked = false;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('question_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .maybeSingle();

      if (existing) {
        await supabase.from('question_bookmarks').delete().eq('id', existing.id);
        isNowBookmarked = false;
      } else {
        await supabase.from('question_bookmarks').insert({
          id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: userId,
          question_id: questionId
        });
        isNowBookmarked = true;
      }
    } catch (e) {
      console.warn('[toggleQuestionBookmark error]:', e);
    }
  }

  // Server sync
  try {
    const res = await fetch('/api/questions/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionId })
    });
    if (res.ok) {
      const j = await res.json();
      if (typeof j.isBookmarked === 'boolean') isNowBookmarked = j.isBookmarked;
    }
  } catch {}

  // Local storage cache
  try {
    const raw = safeStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY);
    const bookmarks: string[] = raw ? JSON.parse(raw) : [];
    const idx = bookmarks.indexOf(questionId);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
      isNowBookmarked = false;
    } else {
      bookmarks.push(questionId);
      isNowBookmarked = true;
    }
    safeStorage.setItem(LOCAL_STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.warn('[Bookmark local cache]:', e);
  }

  return isNowBookmarked;
}

export async function fetchUserBookmarkedQuestionIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('question_bookmarks')
        .select('question_id')
        .eq('user_id', userId);
      if (Array.isArray(data)) return data.map(d => d.question_id);
    } catch (e) {}
  }

  try {
    const res = await fetch(`/api/questions/bookmarks?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const j = await res.json();
      if (Array.isArray(j.bookmarkedQuestionIds)) return j.bookmarkedQuestionIds;
    }
  } catch {}

  try {
    const raw = safeStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return [];
}

// ============================================================================
// 14. ADMIN AI QUESTION GENERATION WORKFLOW (Draft Only -> Review Screen)
// ============================================================================

export interface AiGenerationDraftParams {
  subject: string;
  course?: string;
  unit?: string;
  topic?: string;
  count: number;
  difficultyDistribution?: { easy: number; medium: number; hard: number };
  questionType?: string;
  source?: string;
  sourceUnit?: string;
  sourceFile?: string;
  sourceExcerpt?: string;
  apiKey?: string;
}

export async function generateAiQuestionDrafts(
  params: AiGenerationDraftParams
): Promise<{ success: boolean; questions: any[]; batchId?: string; error?: string }> {
  try {
    const res = await fetch('/api/questions/ai-generate-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, questions: [], error: json.error || 'AI generation failed' };
    }

    return {
      success: true,
      questions: json.questions || [],
      batchId: json.batchId
    };
  } catch (err: any) {
    return { success: false, questions: [], error: err.message || 'Failed to call generation API' };
  }
}

// ============================================================================
// 15. OFFICIAL 19 FRESHMAN SUBJECTS DIRECTORY
// ============================================================================

export interface OfficialSubjectInfo {
  id: string;
  name: string;
  code: string;
  department: string;
  year: string;
  semester: string;
  description: string;
}

export const OFFICIAL_19_SUBJECTS: OfficialSubjectInfo[] = [
  { id: 'subj_critical_thinking', name: 'Critical Thinking', code: 'PHIL 1011', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 1', description: 'Logic, arguments, fallacies, categorical syllogisms, and propositional logic' },
  { id: 'subj_economics', name: 'Economics', code: 'ECON 1011', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 2', description: 'Microeconomic and Macroeconomic principles, consumer theory, market structures' },
  { id: 'subj_emerging_technologies', name: 'Emerging Technologies', code: 'EMTE 1011', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 2', description: 'Artificial Intelligence, IoT, Cloud, Blockchain, Big Data, Industry 4.0' },
  { id: 'subj_entrepreneurship', name: 'Entrepreneurship', code: 'MGMT 1012', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 2', description: 'Venture creation, business planning, opportunity identification, marketing' },
  { id: 'subj_general_biology', name: 'General Biology', code: 'BIOL 1011', department: 'Natural Science', year: 'Year 1', semester: 'Semester 1', description: 'Cell biology, bioenergetics, genetics, human anatomy, ecology' },
  { id: 'subj_general_chemistry', name: 'General Chemistry', code: 'CHEM 1011', department: 'Natural Science', year: 'Year 1', semester: 'Semester 1', description: 'Atomic structure, chemical bonding, equilibria, kinetics, thermodynamics' },
  { id: 'subj_general_physics', name: 'General Physics', code: 'PHYS 1011', department: 'Natural Science', year: 'Year 1', semester: 'Semester 1', description: 'Classical mechanics, thermodynamics, electromagnetism, wave optics' },
  { id: 'subj_general_psychology', name: 'General Psychology', code: 'PSYC 1011', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 1', description: 'Human cognition, perception, memory, personality, developmental psychology' },
  { id: 'subj_geography', name: 'Geography', code: 'GEOG 1011', department: 'Social Science & Common', year: 'Year 1', semester: 'Semester 1', description: 'Geography of Ethiopia and the Horn, physiography, drainage, climate, population' },
  { id: 'subj_global_trends', name: 'Global Trends', code: 'GLTR 1012', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 2', description: 'International relations, diplomacy, geopolitics, regional integration, globalization' },
  { id: 'subj_inclusiveness', name: 'Inclusiveness', code: 'SNIE 1012', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 2', description: 'Special needs education, diversity, accessibility, legal and societal frameworks' },
  { id: 'subj_moral_and_civic', name: 'Moral and Civic', code: 'MCED 1011', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 1', description: 'Ethics, constitutional governance, human rights, democracy, civil society' },
  { id: 'subj_physical_fitness', name: 'Physical Fitness', code: 'SpSc 1011', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 1', description: 'Exercise physiology, cardiovascular health, strength training, wellness' },
  { id: 'subj_english_1', name: 'Communicative English Language Skills I', code: 'FLEn 1011', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 1', description: 'Reading comprehension, communicative grammar, sentence structure, discourse' },
  { id: 'subj_english_2', name: 'Communicative English Language Skills II', code: 'FLEn 1012', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 2', description: 'Academic essay writing, argumentative discourse, presentation skills, citations' },
  { id: 'subj_history', name: 'History of Ethiopia and the Horn', code: 'HIST 1012', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 2', description: 'Prehistoric archaeology, ancient states, mediaeval dynasties, modern Ethiopian state' },
  { id: 'subj_math_natural', name: 'Mathematics — Natural Science', code: 'MATH 1011', department: 'Natural Science', year: 'Year 1', semester: 'Semester 1', description: 'Vectors, limits, differential calculus, integral calculus, analytic geometry' },
  { id: 'subj_math_social', name: 'Mathematics — Social Science', code: 'MATH 1012', department: 'Social Science', year: 'Year 1', semester: 'Semester 1', description: 'Linear equations, matrices, linear programming, financial mathematics, statistics' },
  { id: 'subj_social_anthropology', name: 'Social Anthropology', code: 'ANTH 1012', department: 'Freshman Common', year: 'Year 1', semester: 'Semester 2', description: 'Human culture, ethnography, kinship, marriage, social stratification in the Horn' }
];

export async function fetchOfficialSubjects(): Promise<OfficialSubjectInfo[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (Array.isArray(data) && data.length > 0) {
        return data as OfficialSubjectInfo[];
      }
    } catch (e) {
      console.warn('[fetchOfficialSubjects Supabase warning]:', e);
    }
  }
  return OFFICIAL_19_SUBJECTS;
}

