/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Dedicated Server-Side Gemini AI Controller
 */

import { GoogleGenAI } from '@google/genai';
import { Request, Response } from 'express';

// Standard supported models from official @google/genai specifications
const PRIMARY_MODEL = 'gemini-3.7-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash';

export interface ChatAttachment {
  name?: string;
  mimeType: string;
  data: string; // base64 encoded data
}

export interface IncomingChatMessage {
  role: 'user' | 'assistant' | 'model' | 'system';
  content?: string;
  attachment?: ChatAttachment;
}

/**
 * Validates whether the incoming messages payload is non-empty and well-formed.
 */
export function validateChatPayload(body: any): { valid: boolean; error?: string; status: number } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.', status: 400 };
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return { valid: false, error: "Invalid request: 'messages' array is required.", status: 400 };
  }

  if (messages.length === 0) {
    return { valid: false, error: "Invalid request: 'messages' array cannot be empty.", status: 400 };
  }

  // Ensure at least one message has non-empty content or attachment
  const hasValidContent = messages.some((m: any) => {
    if (!m || typeof m !== 'object') return false;
    const textValid = typeof m.content === 'string' && m.content.trim().length > 0;
    const attachmentValid = m.attachment && typeof m.attachment.data === 'string' && m.attachment.data.length > 0;
    return textValid || attachmentValid;
  });

  if (!hasValidContent) {
    return { valid: false, error: 'Invalid request: at least one message must contain text or attachment.', status: 400 };
  }

  return { valid: true, status: 200 };
}

/**
 * Normalizes client messages into the Gemini Content schema.
 */
function normalizeGeminiContents(messages: IncomingChatMessage[]): { role: 'user' | 'model'; parts: any[] }[] {
  const contents: { role: 'user' | 'model'; parts: any[] }[] = [];

  for (const m of messages) {
    if (!m) continue;
    const role: 'user' | 'model' = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
    const parts: any[] = [];

    if (m.content && typeof m.content === 'string' && m.content.trim().length > 0) {
      parts.push({ text: m.content.trim() });
    }

    if (m.attachment && m.attachment.data && m.attachment.mimeType) {
      parts.push({
        inlineData: {
          data: m.attachment.data,
          mimeType: m.attachment.mimeType
        }
      });
    }

    if (parts.length === 0) {
      continue;
    }

    // Merge sequential turns of same role
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts.push(...parts);
    } else {
      contents.push({ role, parts });
    }
  }

  // Gemini API requires the first turn to be 'user'
  while (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  return contents;
}

/**
 * Classifies Gemini API error into appropriate HTTP status code and user-safe message.
 */
function classifyGeminiError(err: any): { status: number; message: string } {
  const errorMsg = (err?.message || '').toLowerCase();
  const errorCode = err?.status || err?.code || err?.statusCode;

  // Rate limits and Quota limits
  if (errorCode === 429 || errorMsg.includes('quota') || errorMsg.includes('resource_exhausted') || errorMsg.includes('too many requests')) {
    return {
      status: 429,
      message: 'AI service rate limit reached. Please wait a few moments before submitting your next question.'
    };
  }

  // Invalid arguments or prompts
  if (errorCode === 400 || errorMsg.includes('invalid_argument') || errorMsg.includes('bad request')) {
    return {
      status: 400,
      message: 'The submitted message format or parameter was invalid.'
    };
  }

  // Unauthorized or Invalid API Key
  if (errorCode === 401 || errorCode === 403 || errorMsg.includes('unauthenticated') || errorMsg.includes('permission_denied') || errorMsg.includes('api key not valid')) {
    return {
      status: 503,
      message: 'AI service configuration error: Unable to authenticate with the AI provider.'
    };
  }

  // Upstream Unavailable / Timeout / Deadlines
  if (errorCode === 503 || errorCode === 504 || errorMsg.includes('unavailable') || errorMsg.includes('deadline') || errorMsg.includes('timeout') || errorMsg.includes('econnreset')) {
    return {
      status: 503,
      message: 'AI service is temporarily busy or unavailable. Please try again shortly.'
    };
  }

  // General server failure
  return {
    status: 500,
    message: 'An unexpected error occurred while generating the AI response.'
  };
}

/**
 * Core handler for streaming AI Tutor chat responses to the client using Server-Sent Events (SSE).
 */
export async function handleAIChatStream(req: Request, res: Response): Promise<void> {
  // 1. Validate request body
  const validation = validateChatPayload(req.body);
  if (!validation.valid) {
    res.status(validation.status).json({
      success: false,
      error: validation.error
    });
    return;
  }

  // 2. Validate GEMINI_API_KEY configuration
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0 || ['no-key', 'no-api-key', 'undefined', 'null', 'none'].includes(apiKey.trim().toLowerCase())) {
    console.error('[EthioLearn AI] GEMINI_API_KEY is not set or invalid in server environment variables.');
    res.status(503).json({
      success: false,
      error: 'AI service temporarily unavailable: Server GEMINI_API_KEY is missing or unconfigured.'
    });
    return;
  }

  const { messages, system, highThinking } = req.body;
  const geminiContents = normalizeGeminiContents(messages);

  // 3. Initialize GoogleGenAI SDK
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const candidateModels = highThinking
    ? [PRIMARY_MODEL, FALLBACK_MODEL]
    : [PRIMARY_MODEL, FALLBACK_MODEL];

  let streamSucceeded = false;
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const stream = await ai.models.generateContentStream({
        model: modelName,
        contents: geminiContents,
        config: {
          systemInstruction: system && typeof system === 'string' && system.trim().length > 0 ? system.trim() : undefined,
          ...(highThinking && modelName.includes('3.7') ? { thinkingConfig: { thinkingBudget: 2048 } } : {})
        }
      });

      // Initialize SSE headers if not already sent
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
      }

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          streamSucceeded = true;
          const payload = {
            type: 'content_block_delta',
            delta: { text }
          };
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
      }

      if (streamSucceeded) {
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    } catch (err: any) {
      console.error(`[EthioLearn AI] Model ${modelName} stream error:`, err?.message || err);
      lastError = err;
    }
  }

  // If streaming loop finished without success
  if (lastError) {
    const { status, message } = classifyGeminiError(lastError);
    if (!res.headersSent) {
      res.status(status).json({
        success: false,
        error: message
      });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } else {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Unable to retrieve educational response from AI service.'
      });
    } else {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}

/**
 * Non-streaming single response handler for quick utilities (support chat, summary generation, etc.).
 */
export async function generateSingleAIResponse(
  messages: IncomingChatMessage[],
  systemInstruction?: string
): Promise<{ success: boolean; text?: string; error?: string; status: number }> {
  const validation = validateChatPayload({ messages });
  if (!validation.valid) {
    return { success: false, error: validation.error, status: validation.status };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0 || ['no-key', 'no-api-key', 'undefined', 'null', 'none'].includes(apiKey.trim().toLowerCase())) {
    console.error('[EthioLearn AI] GEMINI_API_KEY is not configured on server.');
    return {
      success: false,
      error: 'AI service temporarily unavailable: GEMINI_API_KEY is missing.',
      status: 503
    };
  }

  const geminiContents = normalizeGeminiContents(messages);
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const candidateModels = [PRIMARY_MODEL, FALLBACK_MODEL];

  let lastError: any = null;
  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: geminiContents,
        config: {
          systemInstruction: systemInstruction && systemInstruction.trim().length > 0 ? systemInstruction.trim() : undefined
        }
      });

      const replyText = response.text || '';
      if (replyText.trim().length > 0) {
        return { success: true, text: replyText, status: 200 };
      }
    } catch (err: any) {
      console.error(`[EthioLearn AI] Model ${modelName} error:`, err?.message || err);
      lastError = err;
    }
  }

  if (lastError) {
    const { status, message } = classifyGeminiError(lastError);
    return { success: false, error: message, status };
  }

  return { success: false, error: 'AI service returned empty response.', status: 500 };
}
