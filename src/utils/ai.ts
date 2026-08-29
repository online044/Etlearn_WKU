/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Client AI Utility & Streaming Client
 * Communicates strictly with server-side AI endpoints (/api/claude/chat, /api/ai/chat)
 */

export interface ChatAttachment {
  name?: string;
  mimeType: string;
  data: string; // raw base64 string
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachment?: ChatAttachment;
  fileData?: ChatAttachment;
  timestamp?: string;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (err: string) => void;
}

/**
 * Streams AI Tutor chat responses from the EthioLearn server.
 */
export async function submitClaudeChat(
  messages: ChatMessage[],
  systemPrompt: string,
  _userApiKey?: string, // Deprecated: Server securely manages GEMINI_API_KEY
  callbacks: StreamCallbacks = { onChunk: () => {}, onComplete: () => {}, onError: () => {} },
  highThinking?: boolean
): Promise<void> {
  try {
    // 1. Client-side sanity validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      callbacks.onError('Message cannot be empty.');
      return;
    }

    const hasContent = messages.some(
      (m) => (m.content && m.content.trim().length > 0) || (m.attachment && m.attachment.data)
    );

    if (!hasContent) {
      callbacks.onError('Please type a question or attach study materials.');
      return;
    }

    // 2. Execute fetch to server-side AI proxy endpoint
    const response = await fetch('/api/claude/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        system: systemPrompt,
        highThinking
      })
    });

    // 3. Handle non-200 responses
    if (!response.ok) {
      let errorMessage = `AI server responded with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch (e) {
        // Response wasn't JSON
      }
      callbacks.onError(errorMessage);
      return;
    }

    // 4. Handle streaming response body
    if (!response.body) {
      callbacks.onError('AI response stream is unavailable.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    let encounteredStreamError = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep partial line in buffer

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        if (cleanLine.startsWith('data:')) {
          const rawData = cleanLine.substring(5).trim();
          if (rawData === '[DONE]') continue;

          try {
            const parsed = JSON.parse(rawData);

            if (parsed.type === 'error') {
              encounteredStreamError = true;
              callbacks.onError(parsed.error || 'AI streaming encountered an issue.');
              return;
            }

            // Stream JSON uses type: "content_block_delta" with delta.text
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const chunk = parsed.delta.text;
              accumulatedText += chunk;
              callbacks.onChunk(chunk);
            }
          } catch (e) {
            // Ignore parse errors on half-buffer slices
          }
        }
      }
    }

    // Flush any remaining buffer
    if (buffer && buffer.startsWith('data:')) {
      try {
        const parsed = JSON.parse(buffer.substring(5).trim());
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          const chunk = parsed.delta.text;
          accumulatedText += chunk;
          callbacks.onChunk(chunk);
        }
      } catch (e) {}
    }

    if (!encounteredStreamError) {
      callbacks.onComplete(accumulatedText);
    }
  } catch (err: any) {
    console.error('[EthioLearn AI Client Error]:', err);
    callbacks.onError(err.message || 'Network connection error while reaching AI service.');
  }
}

// Alias for modern naming
export const submitAIChat = submitClaudeChat;

/**
 * Generate an interactive practice quiz on a curriculum topic.
 */
export async function generateQuizAI(
  topic: string,
  subject: string,
  _apiKey?: string,
  difficulty?: string,
  qCount?: number,
  customNeeds?: string
): Promise<any[]> {
  const count = qCount || 5;
  const diffStr = difficulty || 'medium';

  let promptMessage = `Compile a high-fidelity academic practice quiz of exactly ${count} multiple-choice questions on the topic/chapter: "${topic}" under the subject "${subject}".
The difficulty tier must be: ${diffStr}.

Ensure that:
1. Every question is highly realistic, styled exactly like official Ethiopian National Entrance Exams (EUEE) or university freshman midterms/finals.
2. If the subject is Physics, Math, or Chemistry, write clear formulas, equations, correct scientific notation, and SI units (e.g. rad/s², Joules, Farads, Pascals, mol/L).
3. Do NOT include any meta-references to "AI", "AI-generated", "Gemini", "Large Language Model", or "machine learning".
4. The choices must be well-formed and structured with options labeled A), B), C), D).
5. The correct answer must be unambiguous and present in the options list.
6. The explanations must read like a published university textbook's official solution key—precise, mathematical, informative, and authoritative.`;

  if (customNeeds && customNeeds.trim()) {
    promptMessage += `\n\nEXAM REQUIREMENTS & CHAPTER FOCUS:
"${customNeeds}"
Please customize the questions, depth of content, curriculum guidelines, and language focus strictly in accordance with these parameters.`;
  }

  promptMessage += `\n\nFormat the response strictly as a JSON array of ${count} MCQ objects. Do NOT wrap inside any markdown code blocks (no \`\`\`json). Return raw JSON array only.

Each object in the array must contain:
1. "question": String (the precise exam question)
2. "options": Array of 4 strings (e.g. ["A) ...", "B) ...", "C) ...", "D) ..."])
3. "correctAnswer": String (must exactly match one of the elements in the "options" array)
4. "explanation": String (detailed step-by-step textbook-style solution showing calculations and rules)`;

  const messages: ChatMessage[] = [
    { role: 'user', content: promptMessage }
  ];

  const system = "You are an official Senior Board Examiner for the National Educational Assessment and Examinations Agency (NEAEA) and university academic registrars. You compile authentic, high-quality exam papers. You reply exclusively in raw, valid, unformatted JSON arrays containing professional question objects.";

  return new Promise((resolve) => {
    submitClaudeChat(messages, system, '', {
      onChunk: () => {},
      onComplete: (text) => {
        try {
          let cleanJson = text.trim();
          if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
          if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
          if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);

          const quiz = JSON.parse(cleanJson.trim());
          if (Array.isArray(quiz) && quiz.length > 0) {
            return resolve(quiz);
          }
        } catch (e) {
          console.warn('[Quiz AI Parser] JSON parse error, generating standard curriculum fallback quiz:', e);
        }

        // Standard curriculum fallback questions
        resolve([
          {
            question: `Which fundamental principle is central to understanding "${topic}" in ${subject}?`,
            options: [
              `A) Conservation laws and boundary conditions governing ${topic}`,
              `B) Arbitrary empirical observation without theoretical basis`,
              `C) Static non-interacting equilibrium states only`,
              `D) Independent scalar measurement without dimensions`
            ],
            correctAnswer: `A) Conservation laws and boundary conditions governing ${topic}`,
            explanation: `In standard Ethiopian university ${subject} coursework, ${topic} is analyzed through core conservation theorems and formal mathematical boundary relationships.`
          },
          {
            question: `When evaluating standard parameters for "${topic}", what is the primary methodology?`,
            options: [
              `A) Direct analytical derivation and experimental validation`,
              `B) Unverified heuristic approximations`,
              `C) Disregarding SI dimensional consistency`,
              `D) Random sampling without controls`
            ],
            correctAnswer: `A) Direct analytical derivation and experimental validation`,
            explanation: `Ethiopian National and University exam standards require strict SI dimensional consistency and analytical derivations for ${topic}.`
          }
        ]);
      },
      onError: () => {
        resolve([
          {
            question: `What is the key takeaway when revising "${topic}" in ${subject}?`,
            options: [
              `A) Systematic step-by-step problem breakdown and formula application`,
              `B) Rote memorization of final numbers only`,
              `C) Skipping prerequisite concepts`,
              `D) Guessing without analyzing given constraints`
            ],
            correctAnswer: `A) Systematic step-by-step problem breakdown and formula application`,
            explanation: `Standard exam guidance recommends breaking down ${topic} into identified variables and corresponding fundamental laws.`
          }
        ]);
      }
    });
  });
}

/**
 * Generate 10 flashcards on a topic.
 */
export async function generateFlashcardsAI(
  topic: string,
  subject: string,
  _apiKey?: string
): Promise<any[]> {
  const promptMessage = `Generate 10 high-quality flashcards for revision on: "${topic}" inside the "${subject}" curriculum.
Respond strictly in a JSON array of objects. Do not wrap inside code tags or markdown blocks.

Each object must contain:
1. "question": String (clean, precise questioning)
2. "answer": String (concise, factual summary)
3. "explanation": String (optional study tip or mnemonic)`;

  const messages: ChatMessage[] = [{ role: 'user', content: promptMessage }];
  const system = "You are a flashcards drafting engine. You output exclusively raw, unformatted JSON lists. No greeting, no markdown wrapper.";

  return new Promise((resolve) => {
    submitClaudeChat(messages, system, '', {
      onChunk: () => {},
      onComplete: (text) => {
        try {
          let cleanJson = text.trim();
          if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
          if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
          if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);

          const cards = JSON.parse(cleanJson.trim());
          if (Array.isArray(cards) && cards.length > 0) {
            return resolve(cards);
          }
        } catch (e) {}

        resolve([
          {
            question: `What is the core definition of "${topic}" in ${subject}?`,
            answer: `A foundational academic concept governing theoretical principles and practical computations.`,
            explanation: `Review university freshman chapter notes and review questions.`
          },
          {
            question: `How is "${topic}" evaluated in Ethiopian entrance and university exams?`,
            answer: `Through analytical derivation, formula application, and conceptual distinction.`,
            explanation: `Focus on standard SI units and step-by-step problem breakdown.`
          }
        ]);
      },
      onError: () => {
        resolve([
          {
            question: `Core concept: ${topic}`,
            answer: `Key learning objective under ${subject} syllabus.`,
            explanation: `Active recall study card.`
          }
        ]);
      }
    });
  });
}

/**
 * Generate flashcards from custom context.
 */
export async function generateFlashcardsFromContextAI(
  context: string,
  subject: string,
  _apiKey?: string
): Promise<any[]> {
  const promptMessage = `Based on the following educational content:
"""
${context}
"""

Generate 5 high-quality flashcards for revision. Extract the core concepts, figures, equations, or vocabulary.
Respond strictly in a JSON array of objects without markdown backticks.

Each object must contain:
1. "question": String
2. "answer": String
3. "explanation": String`;

  const messages: ChatMessage[] = [{ role: 'user', content: promptMessage }];
  const system = "You are a flashcards drafting engine. You output exclusively raw, unformatted JSON lists. No greeting, no markdown wrapper.";

  return new Promise((resolve) => {
    submitClaudeChat(messages, system, '', {
      onChunk: () => {},
      onComplete: (text) => {
        try {
          let cleanJson = text.trim();
          if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
          if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
          if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);

          const cards = JSON.parse(cleanJson.trim());
          if (Array.isArray(cards) && cards.length > 0) {
            return resolve(cards);
          }
        } catch (e) {}

        resolve([
          {
            question: `Key concept from notes (${subject}):`,
            answer: context.substring(0, 120) + (context.length > 120 ? '...' : ''),
            explanation: `Extracted from your active study session notes.`
          }
        ]);
      },
      onError: () => {
        resolve([
          {
            question: `Study note review (${subject})`,
            answer: `Key points extracted from lecture material.`,
            explanation: `Review formulas and core definitions.`
          }
        ]);
      }
    });
  });
}

/**
 * Generate structured educational note.
 */
export async function generateNoteAI(
  topic: string,
  subject: string,
  _apiKey?: string
): Promise<any> {
  const promptMessage = `Draft a structured study note for the topic: "${topic}" under the curriculum: "${subject}".
The output must use an academic layout tailored for Ethiopian secondary or university levels.

Your response must be in raw JSON matching this TypeScript type:
{
  "title": string,
  "intro": string,
  "definition": string,
  "explanation": string,
  "diagram": string,
  "mnemonics": string,
  "tableHeader": string[],
  "tableRows": string[][]
}

Do NOT write markdown wrap blocks or conversational responses. Output clean raw JSON.`;

  const messages: ChatMessage[] = [{ role: 'user', content: promptMessage }];
  const system = "You are a study notes compiling microservice. You render output solely as a raw valid JSON object. No conversational wrapper.";

  return new Promise((resolve, reject) => {
    submitClaudeChat(messages, system, '', {
      onChunk: () => {},
      onComplete: (text) => {
        try {
          let cleanJson = text.trim();
          if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
          if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
          if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);

          const noteObj = JSON.parse(cleanJson.trim());
          resolve(noteObj);
        } catch (err) {
          reject(new Error('Failed to compile study note correctly.'));
        }
      },
      onError: (err) => reject(new Error(err))
    });
  });
}

/**
 * Generate smart lesson summary & formula sheet.
 */
export async function generateLessonSummaryAI(
  subject: string,
  rawText: string,
  _apiKey?: string
): Promise<string> {
  const promptMessage = `Summarize the following study notes for subject "${subject}":
"""
${rawText}
"""

Provide a structured, highly scannable output in clean markdown:
1. 📌 **Executive Summary**: 2-3 core sentences.
2. 🔑 **Key Terms & Definitions**: Bulleted list.
3. 📐 **Core Formulas / Key Equations** (if applicable): Formatted clearly.
4. 💡 **Top 3 Exam Tips & Common Pitfalls**: Practical study advice for Ethiopian university/national exams.`;

  const messages: ChatMessage[] = [{ role: 'user', content: promptMessage }];
  const system = "You are an expert academic tutor. Provide clear, structured, encouraging summaries in markdown.";

  return new Promise((resolve, reject) => {
    submitClaudeChat(messages, system, '', {
      onChunk: () => {},
      onComplete: (text) => resolve(text),
      onError: (err) => reject(new Error(err))
    });
  });
}

/**
 * Generate personalized study plan.
 */
export async function generateStudyPlanAI(
  subjects: string[],
  examDate: string,
  dailyHours: number,
  _apiKey?: string
): Promise<string> {
  const promptMessage = `Create a high-impact personalized study plan for an Ethiopian student preparing for exams on ${examDate}.
Enrolled subjects: ${subjects.join(', ')}.
Available daily study target: ${dailyHours} hours per day.

Structure the study plan in clean markdown with:
1. 🎯 **Weekly Milestone Strategy**: Subject distribution schedule per day.
2. ⏰ **Daily Time Blocks**: Sample breakdown for a ${dailyHours}-hour study session.
3. 🧠 **Revision & Spaced Repetition Advice**: Guidance on flashcard decks and past exams.
4. 🇪🇹 **Ethiopian Academic Milestones**: Motivational advice tailored for freshman or national exam candidates.`;

  const messages: ChatMessage[] = [{ role: 'user', content: promptMessage }];
  const system = "You are an educational study counselor. Provide realistic, inspiring study schedules in markdown.";

  return new Promise((resolve, reject) => {
    submitClaudeChat(messages, system, '', {
      onChunk: () => {},
      onComplete: (text) => resolve(text),
      onError: (err) => reject(new Error(err))
    });
  });
}
