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

export const LOCAL_STORAGE_QUESTIONS_KEY = 'ethiolearn_supabase_questions_cache';

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

  // Authentic 10,000 Ethiopian University & National Matric Exam Questions repository
  return getAll10kQuestionBankRecords();
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
  if (Array.isArray(row.options)) {
    optionsArr = row.options.map((o: any) => typeof o === 'string' ? o : (o.text || String(o)));
  } else if (typeof row.options === 'string') {
    try {
      const parsed = JSON.parse(row.options);
      if (Array.isArray(parsed)) {
        optionsArr = parsed.map((o: any) => typeof o === 'string' ? o : (o.text || String(o)));
      }
    } catch {
      optionsArr = row.options.split('|').map((s: string) => s.trim());
    }
  }

  return {
    id: String(row.id || `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    question_text: String(row.question_text || row.question || ''),
    question_type: (row.question_type || 'multiple_choice') as BankQuestionType,
    options: optionsArr,
    correct_answer: String(row.correct_answer || row.correctAnswer || ''),
    explanation: row.explanation ? String(row.explanation) : undefined,
    subject: String(row.subject || 'General'),
    course: String(row.course || 'University Course'),
    unit: String(row.unit || 'Unit 1'),
    chapter: row.chapter ? String(row.chapter) : undefined,
    difficulty: (row.difficulty || 'medium') as BankDifficulty,
    exam_category: (row.exam_category || 'practice_exam') as BankExamCategory,
    source: row.source ? String(row.source) : 'imported',
    university: row.university ? String(row.university) : undefined,
    department: row.department ? String(row.department) : undefined,
    academic_year: row.academic_year ? String(row.academic_year) : undefined,
    semester: row.semester ? String(row.semester) : undefined,
    is_verified_official: Boolean(row.is_verified_official),
    batch_id: String(row.batch_id || 'manual-entry'),
    fingerprint: row.fingerprint || generateQuestionFingerprint(row.course || '', row.subject || '', row.question_text || ''),
    is_published: row.is_published !== false,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString()
  };
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

    const subject = (raw.subject || raw.subject_name || 'General').trim();
    const course = (raw.course || raw.course_name || `${subject} 101`).trim();
    const unit = (raw.unit || raw.unit_name || 'Unit 1').trim();
    const chapter = raw.chapter ? String(raw.chapter).trim() : undefined;

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
      question_text: questionText,
      question_type: questionType,
      options,
      correct_answer: correctAnswer,
      explanation,
      subject,
      course,
      unit,
      chapter,
      difficulty,
      exam_category: examCategory,
      source,
      university,
      department,
      academic_year: academicYear,
      semester,
      is_verified_official: isVerifiedOfficial,
      batch_id: batchId,
      fingerprint,
      is_published: isPublished,
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
              question_text: q.question_text,
              question_type: q.question_type,
              options: q.options,
              correct_answer: q.correct_answer,
              explanation: q.explanation || null,
              subject: q.subject,
              course: q.course,
              unit: q.unit,
              chapter: q.chapter || null,
              difficulty: q.difficulty,
              exam_category: q.exam_category,
              source: q.source || 'imported',
              university: q.university || null,
              department: q.department || null,
              academic_year: q.academic_year || null,
              semester: q.semester || null,
              is_verified_official: q.is_verified_official || false,
              batch_id: q.batch_id,
              fingerprint: q.fingerprint,
              is_published: q.is_published,
              created_at: q.created_at,
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
    try {
      let query = supabase
        .from('questions')
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

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error } = await query;

      if (!error && Array.isArray(data)) {
        return {
          questions: data.map(mapDbQuestion),
          totalCount: count || data.length
        };
      }
      if (error) {
        console.warn('[fetchQuestionsPaginated warning]:', error.message);
      }
    } catch (e) {
      console.warn('[fetchQuestionsPaginated exception]:', e);
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
      const { data, error } = await supabase
        .from('questions')
        .select('*');
      if (!error && Array.isArray(data)) {
        questions = data.map(mapDbQuestion);
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
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('is_published', true);

      if (config.course && config.course !== 'All') {
        query = query.eq('course', config.course);
      } else if (config.subject && config.subject !== 'All') {
        query = query.eq('subject', config.subject);
      }

      if (config.unit && config.unit !== 'All') {
        query = query.eq('unit', config.unit);
      }

      if (config.examCategory && (config.examCategory as string) !== 'All') {
        query = query.eq('exam_category', config.examCategory);
      }

      if (config.university && config.university !== 'All') {
        query = query.eq('university', config.university);
      }

      // Fetch up to 200 candidates to select from
      const { data, error } = await query.limit(200);
      if (!error && Array.isArray(data) && data.length > 0) {
        candidatePool = data.map(mapDbQuestion);
      }
    } catch (e) {
      console.warn('[generateRandomExamQuestions exception]:', e);
    }
  }

  // Fallback to cached questions if Supabase is offline or returned empty
  if (candidatePool.length === 0) {
    const cached = getCachedQuestions().filter(q => q.is_published);
    candidatePool = cached.filter(q => {
      if (config.course && config.course !== 'All' && q.course !== config.course) return false;
      if (config.subject && config.subject !== 'All' && q.subject !== config.subject) return false;
      if (config.unit && config.unit !== 'All' && q.unit !== config.unit) return false;
      if (config.examCategory && (config.examCategory as string) !== 'All' && q.exam_category !== config.examCategory) return false;
      if (config.university && config.university !== 'All' && q.university !== config.university) return false;
      return true;
    });

    // If still empty, broaden search to subject or general
    if (candidatePool.length === 0) {
      candidatePool = cached.filter(q => !config.subject || config.subject === 'All' || q.subject === config.subject);
      if (candidatePool.length === 0) {
        candidatePool = [...cached];
      }
    }
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
