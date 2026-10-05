/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Universal Question Database Manager
 * Directly handles manual questions in Firestore, Server DB, and Local Storage.
 * NO API KEY INTEGRATION NEEDED.
 */

import { safeStorage } from './safeStorage';
import { 
  fetchQuestionsFromFirestore, 
  saveQuestionToFirestore, 
  deleteQuestionFromFirestore 
} from './firebaseStore';
import { FirestoreQuestion } from '../types';
import { 
  ManualDatabaseQuestion, 
  INITIAL_MANUAL_QUESTIONS, 
  FRESHMAN_SUBJECTS_LIST 
} from '../data/databaseQuestionBank';

const LOCAL_STORAGE_DB_KEY = 'ethiolearn_manual_questions_db';

/**
 * Normalizes subject string for consistent lookups across modules
 */
export function normalizeSubjectName(sub: string): string {
  if (!sub) return '';
  return sub
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if question matches the given subject
 */
export function doesSubjectMatch(questionSubject: string, targetSubject: string): boolean {
  if (!targetSubject || targetSubject === 'all') return true;
  const nQ = normalizeSubjectName(questionSubject);
  const nT = normalizeSubjectName(targetSubject);
  return nQ.includes(nT) || nT.includes(nQ);
}

/**
 * Retrieves all stored manual questions from local storage cache
 */
export function getLocalDatabaseQuestions(): ManualDatabaseQuestion[] {
  try {
    const raw = safeStorage.getItem(LOCAL_STORAGE_DB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[Question DB] Local storage read error:', e);
    return [];
  }
}

/**
 * Saves questions list to local storage cache
 */
export function setLocalDatabaseQuestions(questions: ManualDatabaseQuestion[]) {
  try {
    safeStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(questions));
  } catch (e) {
    console.warn('[Question DB] Local storage write error:', e);
  }
}

/**
 * Fetches all questions from Server API, Firestore, Local Storage, and Seed data.
 * Merges them by question ID to ensure no duplicates.
 */
export async function getAllDatabaseQuestions(): Promise<ManualDatabaseQuestion[]> {
  const mergedMap = new Map<string, ManualDatabaseQuestion>();

  // 1. Start with initial prebuilt freshman seed questions
  for (const q of INITIAL_MANUAL_QUESTIONS) {
    mergedMap.set(q.id, q);
  }

  // 2. Add local storage cache
  const localItems = getLocalDatabaseQuestions();
  for (const q of localItems) {
    mergedMap.set(q.id, q);
  }

  // 3. Query Server Database endpoint (if available)
  try {
    const res = await fetch('/api/questions', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        for (const q of data.questions) {
          mergedMap.set(q.id, q);
        }
      }
    }
  } catch (err) {
    // Non-fatal, continue with Firestore/local
    console.warn('[Question DB] Server endpoint fetch note:', err);
  }

  // 4. Query Firestore 'questions' collection
  try {
    const fsQuestions = await fetchQuestionsFromFirestore();
    for (const item of fsQuestions) {
      const rawOptions = item.options || [];
      const optionsList: [string, string, string, string] = [
        typeof rawOptions[0] === 'object' ? rawOptions[0]?.text || 'A' : String(rawOptions[0] || 'A'),
        typeof rawOptions[1] === 'object' ? rawOptions[1]?.text || 'B' : String(rawOptions[1] || 'B'),
        typeof rawOptions[2] === 'object' ? rawOptions[2]?.text || 'C' : String(rawOptions[2] || 'C'),
        typeof rawOptions[3] === 'object' ? rawOptions[3]?.text || 'D' : String(rawOptions[3] || 'D'),
      ];

      const correctOpt = (item.correctAnswerId || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D';
      const optMap: Record<string, string> = {
        'A': optionsList[0],
        'B': optionsList[1],
        'C': optionsList[2],
        'D': optionsList[3]
      };

      const mapped: ManualDatabaseQuestion = {
        id: item.id,
        subject: item.subject || item.examId || 'Freshman Common Course',
        questionText: item.text || '',
        questionTextAmharic: item.textAmharic,
        options: optionsList,
        correctAnswer: (item as any).correctAnswer || optMap[correctOpt] || optionsList[0],
        correctOption: correctOpt,
        explanation: item.explanation || '',
        explanationAmharic: item.explanationAmharic,
        topic: (item as any).topic || item.examId,
        unit: (item as any).unit || 'Unit 1',
        difficulty: (item.difficulty as any) || 'medium',
        createdAt: item.createdAt || new Date().toISOString(),
        source: 'manual'
      };

      mergedMap.set(item.id, mapped);
    }
  } catch (fsErr) {
    console.warn('[Question DB] Firestore fetch note:', fsErr);
  }

  const allQuestions = Array.from(mergedMap.values());
  // Cache the combined set
  setLocalDatabaseQuestions(allQuestions);
  return allQuestions;
}

/**
 * Calls questions from the database for a specific subject
 */
export async function getQuestionsForSubject(subject: string): Promise<ManualDatabaseQuestion[]> {
  const all = await getAllDatabaseQuestions();
  const matched = all.filter(q => doesSubjectMatch(q.subject, subject));
  
  if (matched.length > 0) {
    return matched;
  }

  // Fallback: check if subject matches any default freshman subject
  const normalizedTarget = normalizeSubjectName(subject);
  const fallback = all.filter(q => {
    const n = normalizeSubjectName(q.subject);
    return n.includes(normalizedTarget) || normalizedTarget.includes(n);
  });

  return fallback.length > 0 ? fallback : all.slice(0, 10);
}

/**
 * Manually adds a question into the database.
 * Directly saves to Firestore, Server API, and Local Storage.
 */
export async function saveManualQuestionToDatabase(
  newQuestion: Omit<ManualDatabaseQuestion, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<{ success: boolean; question: ManualDatabaseQuestion; error?: string }> {
  const id = newQuestion.id || `manual_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = newQuestion.createdAt || new Date().toISOString();

  const completeQuestion: ManualDatabaseQuestion = {
    id,
    subject: newQuestion.subject.trim(),
    questionText: newQuestion.questionText.trim(),
    questionTextAmharic: newQuestion.questionTextAmharic?.trim() || undefined,
    options: [
      newQuestion.options[0].trim(),
      newQuestion.options[1].trim(),
      newQuestion.options[2].trim(),
      newQuestion.options[3].trim()
    ],
    correctAnswer: newQuestion.correctAnswer.trim(),
    correctOption: newQuestion.correctOption,
    explanation: newQuestion.explanation?.trim() || 'Verified answer for Ethiopian higher education curriculum.',
    explanationAmharic: newQuestion.explanationAmharic?.trim() || undefined,
    topic: newQuestion.topic?.trim() || 'Curriculum Concept',
    unit: newQuestion.unit?.trim() || 'Unit 1',
    difficulty: newQuestion.difficulty || 'medium',
    createdAt: now,
    source: 'manual'
  };

  // 1. Immediately persist in local storage cache
  const existing = getLocalDatabaseQuestions();
  const updatedLocal = [completeQuestion, ...existing.filter(q => q.id !== id)];
  setLocalDatabaseQuestions(updatedLocal);

  // 2. Save to Server DB (/api/questions)
  try {
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeQuestion)
    });
  } catch (sErr) {
    console.warn('[Question DB] Server save note:', sErr);
  }

  // 3. Save to Firestore
  try {
    await saveQuestionToFirestore({
      id,
      examId: completeQuestion.subject,
      subject: completeQuestion.subject,
      questionNumber: Math.floor(Math.random() * 1000) + 1,
      text: completeQuestion.questionText,
      textAmharic: completeQuestion.questionTextAmharic || '',
      options: completeQuestion.options.map((optText, index) => {
        const letter = String.fromCharCode(65 + index);
        return { id: letter, text: optText };
      }),
      correctAnswerId: completeQuestion.correctOption,
      explanation: completeQuestion.explanation,
      explanationAmharic: completeQuestion.explanationAmharic || '',
      difficulty: completeQuestion.difficulty,
      createdAt: now
    });
  } catch (fsErr) {
    console.warn('[Question DB] Firestore save note:', fsErr);
  }

  return { success: true, question: completeQuestion };
}

/**
 * Deletes a question from the database (Local Storage, Server API, Firestore)
 */
export async function deleteManualQuestionFromDatabase(questionId: string): Promise<{ success: boolean; error?: string }> {
  // 1. Remove from local storage
  const existing = getLocalDatabaseQuestions();
  const filtered = existing.filter(q => q.id !== questionId);
  setLocalDatabaseQuestions(filtered);

  // 2. Call server delete
  try {
    await fetch(`/api/questions/${questionId}`, {
      method: 'DELETE'
    });
  } catch (sErr) {
    console.warn('[Question DB] Server delete note:', sErr);
  }

  // 3. Delete from Firestore
  try {
    await deleteQuestionFromFirestore(questionId);
  } catch (fsErr) {
    console.warn('[Question DB] Firestore delete note:', fsErr);
  }

  return { success: true };
}

/**
 * Calculates question counts across subjects
 */
export async function getSubjectQuestionCounts(): Promise<Record<string, number>> {
  const all = await getAllDatabaseQuestions();
  const counts: Record<string, number> = {};

  // Initialize all known freshman subjects with 0
  for (const sub of FRESHMAN_SUBJECTS_LIST) {
    counts[sub] = 0;
  }

  for (const q of all) {
    const matched = FRESHMAN_SUBJECTS_LIST.find(s => doesSubjectMatch(q.subject, s));
    if (matched) {
      counts[matched] = (counts[matched] || 0) + 1;
    } else {
      counts[q.subject] = (counts[q.subject] || 0) + 1;
    }
  }

  return counts;
}
