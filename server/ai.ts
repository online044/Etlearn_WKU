/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Dedicated Server-Side Curriculum Advisor & Study Engine
 * 100% Self-Contained Manual Academic Engine (Zero External AI Dependencies)
 */

import { Request, Response } from 'express';

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
 * Ethiopian University Curriculum Knowledge Base
 * Hand-curated domain concepts for manual, authoritative responses.
 */
interface CurriculumTopic {
  keywords: string[];
  subject: string;
  title: string;
  coreConcepts: string[];
  formulas?: string[];
  examTip: string;
  amharicTitle?: string;
  amharicSummary?: string;
}

const CURRICULUM_TOPICS: CurriculumTopic[] = [
  {
    keywords: ['derivative', 'differentiation', 'calculus', 'limit', 'integral', 'integration', 'tangent', 'maxima', 'minima'],
    subject: 'Mathematics / Calculus',
    title: 'Differential & Integral Calculus',
    amharicTitle: 'ዲፈረንሺያል እና ኢንተግራል ካልኩለስ',
    coreConcepts: [
      'The derivative $f\'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$ represents the instantaneous rate of change and the geometric slope of the tangent line.',
      'Fundamental Theorem of Calculus bridges differentiation and integration: $\\int_a^b f(x)\\,dx = F(b) - F(a)$ where $F\'(x) = f(x)$.',
      'Chain Rule: $\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)$, crucial for composite functions in physics and engineering models.'
    ],
    formulas: [
      'Power Rule: d/dx(x^n) = n·x^(n-1)',
      'Product Rule: (u·v)\' = u\'v + uv\'',
      'Integration by Parts: ∫ u dv = uv - ∫ v du'
    ],
    examTip: 'Always check the domain of functions before differentiating, especially logarithmic ln(g(x)) and rational functions with vertical asymptotes.',
    amharicSummary: 'ካልኩለስ በተለይ ለፈተናዎች የልዩ ልዩ ተግባራትን (Derivative, Limits, Integrals) ወሳኝ ቀመሮችን መያዝ እና በተግባር መለማመድን ይጠይቃል።'
  },
  {
    keywords: ['blockchain', 'ledger', 'hash', 'cryptography', 'consensus', 'bitcoin', 'ethereum', 'smart contract'],
    subject: 'Emerging Technologies',
    title: 'Blockchain & Distributed Ledger Technology',
    amharicTitle: 'ብሎክቼይን እና የተዘረጋ ሌጀር ቴክኖሎጂ',
    coreConcepts: [
      'Decentralization: Eliminates single points of failure and central intermediaries by replicating the ledger across all participant nodes.',
      'Cryptographic Hashing: Each block references the cryptographic SHA-256 hash of the preceding block, rendering retroactive alterations mathematically detectable.',
      'Consensus Mechanisms: Proof of Work (PoW) and Proof of Stake (PoS) guarantee state agreement without trusting any individual participant.'
    ],
    formulas: [
      'Block Header = { PreviousBlockHash, MerkleRoot, Timestamp, Nonce, DifficultyTarget }'
    ],
    examTip: 'Exam questions frequently contrast public permissionless blockchains (e.g. Bitcoin) with consortium or private permissioned networks (e.g. Hyperledger).',
    amharicSummary: 'ብሎክቼይን ያለማዕከላዊ ተቆጣጣሪ ደህንነቱ የተጠበቀ የመረጃ ልውውጥ የሚያስችል ዘመናዊ ቴክኖሎጂ ነው።'
  },
  {
    keywords: ['iot', 'internet of things', 'sensor', 'actuator', 'rfid', 'gateway', 'mqtt'],
    subject: 'Emerging Technologies',
    title: 'Internet of Things (IoT) Architecture',
    amharicTitle: 'የነገሮች ኢንተርኔት (IoT) አርክቴክቸር',
    coreConcepts: [
      'Perception Layer: Physical sensors and actuators gathering ambient data (temperature, pressure, acoustic, GPS).',
      'Network Layer: Transmission protocols (Zigbee, LoRaWAN, Cellular, Wi-Fi) routing packets to cloud computing centers.',
      'Application Layer: End-user smart agriculture, grid monitoring, smart logistics, and industrial telematics.'
    ],
    examTip: 'Remember the distinction between a sensor (converts physical phenomena into electrical signals) and an actuator (converts electrical signals into physical movement).',
    amharicSummary: 'IoT የተለያዩ ቁሳቁሶችን ከኢንተርኔት ጋር በማገናኘት መረጃ እንዲለዋወጡ የሚያስችል የስርዓተ-ትምህርት ክፍል ነው።'
  },
  {
    keywords: ['kinematics', 'velocity', 'acceleration', 'force', 'newton', 'momentum', 'energy', 'friction', 'gravity'],
    subject: 'General Physics',
    title: 'Classical Mechanics & Dynamics',
    amharicTitle: 'ክላሲካል ሜካኒክስ እና ዳይናሚክስ',
    coreConcepts: [
      'Newton\'s 1st Law: Law of Inertia (An object remains at rest or constant velocity unless acted upon by a net external force).',
      'Newton\'s 2nd Law: $\\sum \\vec{F} = m\\vec{a}$ (Net force produces acceleration proportional to mass).',
      'Conservation of Linear Momentum: $\\sum \\vec{p}_{initial} = \\sum \\vec{p}_{final}$ in isolated systems, vital for collision problems.'
    ],
    formulas: [
      'v = v_0 + a·t',
      's = v_0·t + (1/2)·a·t^2',
      'v^2 = v_0^2 + 2·a·s',
      'Work = F · d · cos(θ)'
    ],
    examTip: 'Always draw a complete Free Body Diagram (FBD) resolving forces into parallel and perpendicular components along inclined planes before writing equations.',
    amharicSummary: 'በፊዚክስ ፈተናዎች የኒውተን ህጎችን እና የሃይል (Force/Friction) ስሌቶችን ደረጃ በደረጃ ማስቀመጥ ከፍተኛ ነጥብ ያስገኛል።'
  },
  {
    keywords: ['elasticity', 'demand', 'supply', 'inflation', 'gdp', 'monopoly', 'market', 'microeconomics', 'macroeconomics'],
    subject: 'Economics',
    title: 'Principles of Economics & Market Equilibrium',
    amharicTitle: 'የኢኮኖሚክስ መርሆዎች እና የገበያ ሚዛን',
    coreConcepts: [
      'Law of Demand: Ceteris paribus, as price increases, quantity demanded decreases (negative inverse slope).',
      'Price Elasticity of Demand (PED): Percentage change in quantity demanded divided by percentage change in price.',
      'Gross Domestic Product (GDP): Market value of all final goods and services produced within a nation in a given period ($GDP = C + I + G + (X - M)$).'
    ],
    formulas: [
      'PED = (% ΔQd) / (% ΔP) = (dQ/dP) · (P/Q)',
      'Total Revenue = Price × Quantity'
    ],
    examTip: 'Note the difference between shifts along a demand curve (caused exclusively by change in the own price of the good) and shifts of the entire curve (caused by income, tastes, prices of substitutes/complements).',
    amharicSummary: 'ኢኮኖሚክስ የፍላጎትና አቅርቦት (Demand & Supply) እንዲሁም የገበያ ሚዛንን መረዳት ወሳኝ ነው።'
  },
  {
    keywords: ['rift valley', 'topography', 'drainage', 'climate', 'abbay', 'awash', 'plateau', 'geography', 'ethiopia'],
    subject: 'Geography of Ethiopia and the Horn',
    title: 'Physiography & Drainage Systems of Ethiopia',
    amharicTitle: 'የኢትዮጵያ መልክአ-ምድር እና የተፈጥሮ ሀብት',
    coreConcepts: [
      'Three Major Physiographic Divisions: Western Highlands & Lowlands, South-Eastern Highlands & Lowlands, and the Great Rift Valley.',
      'Drainage Basins: Mediterranean Basin (Abbay, Tekeze, Baro-Akobo draining ~70% of runoff westward), Indian Ocean Basin (Wabi Shebelle, Genale-Dawa), and Closed Internal Basin (Awash, Omo-Gibe, Rift lakes).',
      'Altitudinal Agro-Climatic Zones: Bereha (<500m), Kolla (500-1500m), Woina Dega (1500-2300m), Dega (2300-3200m), and Wurch (>3200m).'
    ],
    examTip: 'The Abbay (Blue Nile) basin accounts for the largest share of annual surface discharge, while the Awash river is the most extensively utilized for commercial irrigation.',
    amharicSummary: 'የኢትዮጵያ ጂኦግራፊ ፈተናዎች በተለይ ወንዞችን፣ ተፋሰሶችን እና የአየር ንብረት ቀጠናዎችን በጥልቀት ይፈትሻሉ።'
  },
  {
    keywords: ['syllogism', 'fallacy', 'deductive', 'inductive', 'premise', 'conclusion', 'validity', 'soundness', 'logic'],
    subject: 'Logic & Critical Thinking',
    title: 'Formal Logic & Argumentative Analysis',
    amharicTitle: 'ሎጂክ እና ሂሳዊ አስተሳሰብ',
    coreConcepts: [
      'Deductive Argument: Claims that if all premises are true, it is impossible for the conclusion to be false (evaluated for Validity & Soundness).',
      'Inductive Argument: Claims that true premises establish a high probability for the conclusion (evaluated for Strength & Cogency).',
      'Informal Fallacies: Fallacies of Relevance (Ad Hominem, Straw Man, Appeal to Force/Pity), and Fallacies of Presumption (Begging the Question, False Dichotomy).'
    ],
    examTip: 'Remember: Validity is strictly a structural property! An argument can have false premises and a false conclusion, yet still be formally valid.',
    amharicSummary: 'ሎጂክ ክርክሮችን መገምገም፣ ትክክለኛ መደምደሚያ ላይ መድረስ እና የተሳሳቱ አስተሳሰቦችን (Fallacies) ለይቶ ማወቅ ነው።'
  },
  {
    keywords: ['passive', 'reported speech', 'clause', 'conditional', 'tenses', 'grammar', 'preposition', 'english'],
    subject: 'Communicative English Skills',
    title: 'Advanced English Grammar & Academic Structures',
    amharicTitle: 'የእንግሊዝኛ ቋንቋ ሰዋሰው እና የአጻጻፍ ክህሎት',
    coreConcepts: [
      'Reported Speech Shifts: Present simple becomes past simple, "now" becomes "then", "today" becomes "that day", and modal "will" shifts to "would".',
      'Conditionals: Type 1 (Real present/future: If + present, will + base), Type 2 (Hypothetical present: If + past simple, would + base), Type 3 (Past counterfactual: If + had + past participle, would have + past participle).',
      'Subject-Verb Agreement: Phrases between subject and verb (e.g. "along with", "as well as", "in addition to") do not alter the grammatical number of the subject.'
    ],
    examTip: 'National exam questions frequently test Inversion after negative adverbs (e.g. "Rarely have I seen...", "Seldom does she arrive...").',
    amharicSummary: 'በእንግሊዝኛ ፈተናዎች የሰዋሰው (Tenses, Conditionals, Reported Speech) ህጎችን መከተል ውጤታማ ያደርጋል።'
  }
];

/**
 * Synthesizes an authoritative curriculum response manually.
 */
function buildManualCurriculumResponse(userQuery: string, systemPrompt?: string): string {
  const queryLower = userQuery.toLowerCase();
  const isAmharic = /[\u1200-\u137F]/.test(userQuery) || (systemPrompt && (systemPrompt.includes('Amharic') || systemPrompt.includes('አማርኛ')));

  // Match best curriculum topic
  let matchedTopic: CurriculumTopic | null = null;
  let maxScore = 0;

  for (const topic of CURRICULUM_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (queryLower.includes(kw)) score += 2;
    }
    if (queryLower.includes(topic.subject.toLowerCase())) score += 3;
    if (score > maxScore) {
      maxScore = score;
      matchedTopic = topic;
    }
  }

  if (matchedTopic) {
    if (isAmharic) {
      return `### 🎓 የአካዳሚክ ጥናት መመሪያ፦ ${matchedTopic.amharicTitle || matchedTopic.title}
**የትምህርት ዘርፍ (Subject):** ${matchedTopic.subject}

#### 1. ዋና ንድፈ-ሃሳቦች (Core Principles)
${matchedTopic.coreConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

${matchedTopic.formulas && matchedTopic.formulas.length > 0 ? `#### 2. አስፈላጊ ቀመሮችና መርሆዎች (Formulas & Laws)\n${matchedTopic.formulas.map(f => `* \`${f}\``).join('\n')}\n` : ''}
#### 3. የፈተና ዝግጅት ሚስጥር (Exam Strategy & Pitfalls)
💡 ${matchedTopic.examTip}

#### 4. ማጠቃለያ
${matchedTopic.amharicSummary || 'ይህ ርዕስ በዩኒቨርሲቲ ፈተናዎች እና በብሔራዊ ምዘናዎች ላይ በተደጋጋሚ የሚቀርብ በመሆኑ የቀረቡትን ነጥቦች በደንብ ይለማመዱ።'}`;
    }

    return `### 🎓 Academic Curriculum Guide: ${matchedTopic.title}
**Subject Area:** ${matchedTopic.subject}

#### 1. Core Principles & Theoretical Foundation
${matchedTopic.coreConcepts.map((c, i) => `${i + 1}. **Concept ${i + 1}:** ${c}`).join('\n')}

${matchedTopic.formulas && matchedTopic.formulas.length > 0 ? `#### 2. Essential Formulations & Governing Laws\n${matchedTopic.formulas.map(f => `* \`${f}\``).join('\n')}\n` : ''}
#### 3. High-Frequency Examination Strategy
💡 **Exam Advice:** ${matchedTopic.examTip}

#### 4. Recommended Study Action
* Review corresponding textbook chapters in the **BookStore** section.
* Solve past exam questions from Wolkite University and National banks in the **University Exams** tab to master this topic under timed conditions.`;
  }

  // General helpful academic fallback response
  if (isAmharic) {
    return `### 📚 የአካዳሚክ አማካሪ መመሪያ (Academic Advisor)

ጥያቄዎን ተቀብለናል፦ **"${userQuery.slice(0, 120)}"**

1. **የትምህርት ትኩረት**፦ በኢትዮጵያ ዩኒቨርሲቲዎች ስርዓተ-ትምህርት መሠረት፣ የአካዳሚክ ውጤታማነት የሚገኘው ዋና ዋና ንድፈ-ሃሳቦችን ከቀደምት ፈተናዎች ጋር በማቀናጀት በማጥናት ነው።
2. **የተግባር መመሪያዎች**፦
   - በ **BookStore** ክፍል ያሉትን የትምህርት ሞጁሎች በምዕራፍ ከፋፍለው ያንብቡ።
   - በ **University Exams** ክፍል የሚገኙትን የደረጃ በደረጃ የመፍትሄ ማብራሪያዎች (Step-by-Step Faculty Solutions) ይመልከቱ።
   - በ **Flashcards** ክፍል ቃላትን እና ቀመሮችን በየቀኑ ይለማመዱ።
3. **ስኬት**፦ በርቱ! ጥያቄዎትን በርዕስ ወይም በምዕራፍ ለይተው በማቅረብ ዝርዝር መረጃዎችን ማግኘት ይችላሉ።`;
  }

  return `### 📚 Academic Curriculum Advisor

Regarding your study question: **"${userQuery.slice(0, 120)}"**

1. **Curriculum Alignment**:
   - In Ethiopian higher education institutions and freshman programs, academic mastery requires anchoring conceptual definitions with systematic problem-solving routines.
2. **Recommended Study Workflow**:
   - **Textbooks & Notes**: Review the official lecture modules and structured blueprints in the **BookStore** and **Notes** tabs.
   - **Verified Past Exams**: Practice university midterm and final exam questions in the **University Exams** tab with step-by-step faculty solution breakdowns.
   - **Spaced Repetition**: Consolidate key definitions and equations using the **Flashcards** module.
3. **Study Tip**:
   - For specific derivations or formula guides, enter the subject name (e.g., *Calculus*, *Physics*, *Emerging Tech*, *Economics*) along with your specific chapter question!`;
}

/**
 * Core handler for streaming curriculum advisor responses using Server-Sent Events (SSE).
 * Works completely manually without external API dependencies.
 */
export async function handleAIChatStream(req: Request, res: Response): Promise<void> {
  const validation = validateChatPayload(req.body);
  if (!validation.valid) {
    res.status(validation.status).json({
      success: false,
      error: validation.error
    });
    return;
  }

  const { messages, system } = req.body;
  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || 'Hello';

  // Initialize SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const fullResponse = buildManualCurriculumResponse(lastUserMsg, system);

  // Stream in realistic, responsive sentence chunks
  const chunks = fullResponse.split(/(?<=[.\n])/);

  let idx = 0;
  const interval = setInterval(() => {
    if (idx < chunks.length) {
      const chunkText = chunks[idx];
      if (chunkText) {
        const payload = {
          type: 'content_block_delta',
          delta: { text: chunkText }
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
      idx++;
    } else {
      clearInterval(interval);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }, 25);

  req.on('close', () => {
    clearInterval(interval);
  });
}

/**
 * Non-streaming single response handler for quick utilities (support chat, summary generation, etc.).
 * Works completely manually with zero external dependencies.
 */
export async function generateSingleAIResponse(
  messages: IncomingChatMessage[],
  systemInstruction?: string
): Promise<{ success: boolean; text?: string; error?: string; status: number }> {
  const validation = validateChatPayload({ messages });
  if (!validation.valid) {
    return { success: false, error: validation.error, status: validation.status };
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || 'Hello';
  const responseText = buildManualCurriculumResponse(lastUserMsg, systemInstruction);

  return {
    success: true,
    text: responseText,
    status: 200
  };
}
