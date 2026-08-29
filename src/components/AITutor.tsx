import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Send, Mic, RefreshCw, Copy, Check, MessageSquare, Sparkles, AlertCircle, HelpCircle, FileText,
  Paperclip, File, X, Languages, Volume2, VolumeX, BookOpen, GraduationCap, CheckCircle2,
  Lightbulb, HelpCircle as QuestionIcon, ArrowRight, Menu, Plus, ChevronDown, Award, 
  Share2, Trash2, Pin, Download, Flame, Search
} from 'lucide-react';
import { ChatMessage, submitClaudeChat, generateQuizAI, generateFlashcardsFromContextAI } from '../utils/ai';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import AITutorLogo from './AITutorLogo';
import { StudentProfile, Flashcard, AITeacherContext, SavedChatSession } from '../types';
import { safeStorage } from '../utils/safeStorage';
import PaywallModal from './PaywallModal';
import AIStudyToolsModal from './AIStudyToolsModal';
import SavedChatsDrawer from './SavedChatsDrawer';
import { getDailyAIUsageCount, incrementDailyAIUsage, checkSubscriptionStatus, FREE_DAILY_AI_LIMIT } from '../utils/monetization';

interface AITutorProps {
  apiKey: string;
  enrolledSubjects: string[];
  decksState?: { [deckId: string]: Flashcard[] };
  onSaveDecksState?: (deckId: string, cards: Flashcard[]) => void;
  onStudyAction?: () => void;
  profile: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
  onOpenUpgrade?: () => void;
  context?: AITeacherContext | null;
  onClearContext?: () => void;
}

const LOCAL_FALLBACK_QUIZ: { [subject: string]: any[] } = {
  "Emerging Technologies": [
    {
      question: "Which of the following is the best definition of IoT (Internet of Things)?",
      options: [
        "A network of physical objects embedded with sensors and software to exchange data over the internet.",
        "A search engine used for looking up academic textbook summaries online.",
        "A type of security protocol for central bank transactions.",
        "A private server cluster designed for hosting high-speed gaming systems."
      ],
      correctAnswer: "A network of physical objects embedded with sensors and software to exchange data over the internet.",
      explanation: "IoT connects physical devices to collect, transmit, and act on local data automatically."
    },
    {
      question: "What distinguishes Edge Computing from conventional cloud computing?",
      options: [
        "Data is processed at the network edge, closer to the source device.",
        "It consumes infinitely more internet data bandwidth.",
        "It replaces the need for any storage physical drives.",
        "It strictly prevents any wireless connections for device security."
      ],
      correctAnswer: "Data is processed at the network edge, closer to the source device.",
      explanation: "Edge computing keeps data processing close to the collection source, saving response time and bandwidth."
    }
  ],
  "Introduction to Economics": [
    {
      question: "Which term describes the total monetary value of all finished goods and services produced within a country's borders in a specific period?",
      options: [
        "Gross Domestic Product (GDP)",
        "Consumer Price Index (CPI)",
        "Aggregate Inflation Scale",
        "Giffen Marginal Utility"
      ],
      correctAnswer: "Gross Domestic Product (GDP)",
      explanation: "GDP is the standard macro-economic metric used to measure the official production output of an economy."
    }
  ],
  "General Biology": [
    {
      question: "What is the primary organic outcome of Photosynthesis in green plants?",
      options: [
        "Synthesis of glucose sugars and release of oxygen gas",
        "Production of carbon dioxide and water molecules",
        "Metabolism of lipid membranes in root tissues",
        "Direct replication of nuclear chromatin structures"
      ],
      correctAnswer: "Synthesis of glucose sugars and release of oxygen gas",
      explanation: "Chloroplasts capture sunlight to transform carbon dioxide and water into glucose and oxygen."
    }
  ],
  "Communicative English": [
    {
      question: "Which option correctly uses reported speech for: 'The examination is tomorrow,' told the tutor.",
      options: [
        "The tutor said that the examination was the next day.",
        "The tutor says the examination is tomorrow.",
        "The tutor told me that tomorrow is exam day.",
        "The tutor has been saying the examination was tomorrow."
      ],
      correctAnswer: "The tutor said that the examination was the next day.",
      explanation: "'Is' shifts to 'was' in reported speech, and 'tomorrow' shifts to 'the next day'."
    }
  ],
  "Moral and Civic Education": [
    {
      question: "Which of the following is core to the constitutional system and rule of law?",
      options: [
        "Respect for human and democratic rights and sovereignty of citizens",
        "Unchecked authority of a centralized monarch",
        "Exclusive priority of private corporate legal systems",
        "Restricting public speech and citizen representation"
      ],
      correctAnswer: "Respect for human and democratic rights and sovereignty of citizens",
      explanation: "Modern democratic constitutions ensure sovereignty belongs to the citizens, protected by rigorous checks and balances."
    }
  ],
  "Mathematics": [
    {
      question: "What is the derivative of f(x) = 3x^2 + 5x - 7 with respect to x?",
      options: [
        "6x + 5",
        "3x + 5",
        "6x^2 + 5",
        "6x"
      ],
      correctAnswer: "6x + 5",
      explanation: "By the power rule, the derivative of 3x^2 is 6x, and the derivative of 5x is 5. The derivative of a constant (-7) is 0."
    }
  ],
  "Inclusive Education": [
    {
      question: "Which of the following best describes the core philosophy of Inclusive Education?",
      options: [
        "Separating children with disabilities into special schools",
        "Providing equitable learning opportunities for all students regardless of diverse needs",
        "Only teaching high-achieving academic students",
        "Using a single uniform teaching method for everyone"
      ],
      correctAnswer: "Providing equitable learning opportunities for all students regardless of diverse needs",
      explanation: "Inclusive education aims to remove learning barriers so that all students learn together in a supportive environment."
    }
  ],
  "Geography": [
    {
      question: "Which major Ethiopian river basin accounts for the largest share of the country's annual surface water runoff?",
      options: [
        "The Abbay (Blue Nile) Basin",
        "The Awash River Basin",
        "The Omo-Gibe Basin",
        "The Wabi Shebelle Basin"
      ],
      correctAnswer: "The Abbay (Blue Nile) Basin",
      explanation: "The Blue Nile (Abbay) Basin is Ethiopia's largest river basin by runoff volume, contributing significantly to national and regional water resources."
    }
  ],
  "Logic and Critical Thinking": [
    {
      question: "Which logical fallacy occurs when an opponent's argument is misrepresented or exaggerated to make it easier to attack?",
      options: [
        "Ad Hominem",
        "Straw Man Fallacy",
        "Slippery Slope",
        "Begging the Question"
      ],
      correctAnswer: "Straw Man Fallacy",
      explanation: "A Straw Man fallacy involves oversimplifying, misrepresenting, or inventing an opponent's argument to easily knock it down."
    }
  ],
  "History": [
    {
      question: "Which historic 1896 battle secured Ethiopia's sovereignty against Italian colonial forces?",
      options: [
        "Battle of Adwa",
        "Battle of Maichew",
        "Battle of Gundet",
        "Battle of Gura"
      ],
      correctAnswer: "Battle of Adwa",
      explanation: "The Battle of Adwa on March 1, 1896 was a decisive victory for Ethiopian forces under Emperor Menelik II, preserving the nation's independence."
    }
  ],
  "Chemistry": [
    {
      question: "What type of chemical bond is formed when two atoms share electrons equally?",
      options: [
        "Ionic bond",
        "Covalent bond",
        "Hydrogen bond",
        "Metallic bond"
      ],
      correctAnswer: "Covalent bond",
      explanation: "Covalent bonds are characterized by the sharing of pairs of electrons between atoms, typically non-metals."
    }
  ],
  "Aptitude": [
    {
      question: "If a car travels 180 kilometers in 3 hours, what is its average speed in meters per second?",
      options: [
        "16.67 m/s",
        "20 m/s",
        "60 m/s",
        "15 m/s"
      ],
      correctAnswer: "16.67 m/s",
      explanation: "180 km in 3 hours is 60 km/h. To convert km/h to m/s, divide by 3.6: 60 / 3.6 = 16.67 m/s."
    }
  ],
  "General Physics": [
    {
      question: "According to Newton's Second Law of Motion, what is the relationship between Force (F), Mass (m), and Acceleration (a)?",
      options: [
        "F = m * a",
        "F = m / a",
        "F = m + a",
        "F = a / m"
      ],
      correctAnswer: "F = m * a",
      explanation: "Newton's Second Law states that force is directly proportional to the product of mass and acceleration."
    }
  ],
  "Entrepreneurship": [
    {
      question: "What document outlines a startup's operational plans, market analysis, financial projections, and value proposition?",
      options: [
        "A corporate tax return",
        "A business plan",
        "A stock certificate",
        "A bank statement"
      ],
      correctAnswer: "A business plan",
      explanation: "A business plan acts as a roadmap for an entrepreneur, detailing the strategy to launch, grow, and fund a business venture."
    }
  ],
  "Social Anthropology": [
    {
      question: "Which anthropological concept describes the practice of viewing and analyzing a culture through its own lens rather than judging it by one's own cultural standards?",
      options: [
        "Ethnocentrism",
        "Cultural Relativism",
        "Assimilation",
        "Acculturation"
      ],
      correctAnswer: "Cultural Relativism",
      explanation: "Cultural relativism promotes understanding cultural practices within their own context, suspending external moral judgments."
    }
  ],
  "C++ Programming": [
    {
      question: "Which of the following is the correct syntax to declare a dynamic array of integers in C++?",
      options: [
        "int* arr = new int[size];",
        "int arr = new int(size);",
        "new int arr[size];",
        "int arr[] = new array(size);"
      ],
      correctAnswer: "int* arr = new int[size];",
      explanation: "In C++, dynamic memory allocation for arrays uses the 'new' operator with square brackets, returning a pointer to the first element."
    }
  ]
};

type AIMode = 'teaching' | 'quiz' | 'exam_feedback' | 'chat' | 'free_chat';

const SESSIONS_STORAGE_KEY = 'ethiolearn_ask_teacher_sessions_v3';

export default function AITutor({ 
  apiKey, 
  enrolledSubjects = [], 
  decksState, 
  onSaveDecksState, 
  onStudyAction,
  profile,
  onUpdateProfile,
  onOpenUpgrade,
  context,
  onClearContext
}: AITutorProps) {
  const subjectsList = enrolledSubjects && enrolledSubjects.length > 0 
    ? enrolledSubjects 
    : ["Emerging Technologies", "Introduction to Economics", "General Biology", "Communicative English", "Mathematics", "C++ Programming"];

  const [selectedSubject, setSelectedSubject] = useState(
    context?.subject || subjectsList[0] || "Emerging Technologies"
  );
  const [activeMode, setActiveMode] = useState<AIMode>(context?.mode || 'teaching');
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isStudyToolsOpen, setIsStudyToolsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  
  // Persistent language mapping
  const [language, setLanguage] = useState<'en' | 'am'>(() => {
    const saved = safeStorage.getItem('ethiolearn_language_preference');
    return (saved === 'am' || saved === 'en') ? saved : 'en';
  });

  const isAmharic = language === 'am';
  const [highThinking, setHighThinking] = useState(false);

  // ─── SAVED CHAT SESSIONS STATE ───
  const [sessions, setSessions] = useState<SavedChatSession[]>(() => {
    try {
      const raw = safeStorage.getItem(SESSIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load saved sessions:", e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [flSuccess, setFlSuccess] = useState<string | null>(null);
  
  // File Upload Systems
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    mimeType: string;
    data: string; // raw base64 string
    previewUrl?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quiz states
  const [currentQuiz, setCurrentQuiz] = useState<any[] | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [qIndex: number]: string }>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Quick Subject Specific Prompts
  const quickChips: { [subject: string]: string[] } = {
    "Emerging Technologies": ["What is IoT?", "Explain Edge Computing vs Cloud", "What are Smart Cities?", "Explain AI ethics"],
    "Introduction to Economics": ["Supply and demand example", "Explain GDP formula", "What is Giffen Good?", "Why inflation happens"],
    "General Biology": ["Explain photosynthesis", "Lock and key enzyme model", "Mitosis vs Meiosis differences", "Explain Krebs Cycle"],
    "Communicative English": ["Reported speech rules", "Third conditional structure", "Active vs passive voice", "Used to vs Get used to"],
    "Moral and Civic Education": ["Ethiopian constitution pillars", "Human rights categories", "Federalism system", "Deontology vs Utilitarianism"],
    "Mathematics": ["Derivative power rule", "Solve quadratic formula", "Explain limits conceptually", "What is Euler's number?"],
    "Inclusive Education": ["Differentiated instruction", "Special needs accommodations", "Universal Design for Learning", "Philosophy of inclusion"],
    "Geography": ["Ethiopia rift valley lakes", "Climatic zones of Ethiopia", "What is absolute location?", "Explain river basins"],
    "Logic and Critical Thinking": ["Identify Straw Man fallacy", "Deductive vs Inductive reasoning", "Validity vs Soundness", "Syllogism definition"],
    "History": ["Causes of Battle of Adwa", "Axumite civilization achievements", "Lalibela rock-hewn churches", "The Tripartite Treaty of 1906"],
    "Chemistry": ["Balancing redox equations", "Periodic table trends", "Le Chatelier's principle", "Ideal gas law calculation"],
    "Aptitude": ["Logical reasoning patterns", "Work and time problems", "Percentage calculation tips", "Data interpretation help"],
    "General Physics": ["Newton's laws explained", "Conservation of energy", "Electric potential difference", "Wave-particle duality"],
    "Entrepreneurship": ["Design a business model", "Value proposition canvas", "Startup funding stages", "Market research methods"],
    "Social Anthropology": ["What is cultural relativism?", "Define kinship structures", "Qualitative research methods", "Ethnographic fieldwork study"],
    "C++ Programming": ["Explain pointers & references", "Object-Oriented programming in C++", "Memory allocation (new/delete)", "C++ vector class guide"]
  };

  const activeChips = quickChips[selectedSubject] || [
    "Explain core concepts step-by-step",
    "Give an authentic exam question",
    "Summarize this unit in simple points",
    "What are common student mistakes here?"
  ];

  // Helper to construct intro text
  const getIntroGreeting = (sub: string, mode: AIMode) => {
    if (mode === 'quiz') {
      return isAmharic
        ? `እንኳን ደህና መጡ! እኔ ለ*${sub}* የፈተና ጥያቄ አዘጋጅዎ ነኝ። "ፈተና አዘጋጅ" የሚለውን ይጫኑ ወይም ዝግጁ ነኝ ብለው ይጻፉ።`
        : `Ready for a knowledge check on *${sub}*? Click "Generate Quiz" or ask me to test you on any specific chapter.`;
    }
    if (mode === 'exam_feedback') {
      return isAmharic
        ? `የፈተና ስህተት መመርመሪያ ነቅቷል። በ*${sub}* ያስቸገረዎትን የፈተና ጥያቄ ያጋሩኝ እና ዋናውን ስህተት ደረጃ በደረጃ እንመርምረው!`
        : `Exam Mistake Remediation Mode activated for *${sub}*. Share any tricky exam question you got wrong or struggle with!`;
    }
    if (mode === 'chat') {
      return isAmharic
        ? `ጤና ይስጥልኝ! ለ*${sub}* የጥናት አጋርዎ ነኝ። ዛሬ በምን ርዕስ ላይ እንወያይ?`
        : `Greetings! I am your collaborative study buddy for *${sub}*. What concept or equation would you like to explore?`;
    }
    return isAmharic
      ? `ጤና ይስጥልኝ። እኔ ለ*${sub}* የትምህርት መምህርዎ (Ask Teacher) ነኝ። ማንኛውንም ጥያቄ ይጠይቁኝ፣ የጥናት መረጃዎችን ያያይዙ ወይም ራስዎን ለመፈተን ፈጣን ጥያቄዎችን ይጠቀሙ።`
      : `Greetings. I am your Ask Teacher AI Academic Mentor for *${sub}*. Ask any question, attach homework or notes, or tap a quick topic to start!`;
  };

  // Sync sessions with safeStorage
  const persistSessions = (updated: SavedChatSession[]) => {
    setSessions(updated);
    try {
      safeStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated.slice(0, 40)));
    } catch (e) {
      console.warn("Storage quota full while saving sessions:", e);
    }
  };

  // Create a brand-new chat session
  const handleNewChat = (sub?: string, mode?: AIMode) => {
    playClickChime();
    const targetSub = sub || selectedSubject;
    const targetMode = mode || activeMode;
    const newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const intro = getIntroGreeting(targetSub, targetMode);

    const newSession: SavedChatSession = {
      id: newSessionId,
      title: `${targetSub} Study`,
      subject: targetSub,
      mode: targetMode,
      messages: [{ role: 'assistant', content: intro }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false
    };

    const updated = [newSession, ...sessions];
    persistSessions(updated);
    setActiveSessionId(newSessionId);
    setMessages(newSession.messages);
    setSelectedSubject(targetSub);
    setActiveMode(targetMode);
    setCurrentQuiz(null);
  };

  // Select an existing chat session
  const handleSelectSession = (session: SavedChatSession) => {
    playClickChime();
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setSelectedSubject(session.subject);
    setActiveMode(session.mode);
    setCurrentQuiz(null);
  };

  // Delete a chat session
  const handleDeleteSession = (sessionId: string) => {
    playClickChime();
    const remaining = sessions.filter(s => s.id !== sessionId);
    persistSessions(remaining);
    if (activeSessionId === sessionId) {
      if (remaining.length > 0) {
        handleSelectSession(remaining[0]);
      } else {
        handleNewChat();
      }
    }
  };

  // Toggle Pin
  const handleTogglePinSession = (sessionId: string) => {
    playClickChime();
    const updated = sessions.map(s => s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s);
    persistSessions(updated);
  };

  // Rename Session
  const handleRenameSession = (sessionId: string, newTitle: string) => {
    const updated = sessions.map(s => s.id === sessionId ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s);
    persistSessions(updated);
  };

  // Initial load / Migration
  useEffect(() => {
    if (context) {
      // Incoming contextual session
      if (context.subject) setSelectedSubject(context.subject);
      if (context.mode) setActiveMode(context.mode);

      const subjectName = context.subject || selectedSubject;
      const lessonName = context.lessonTitle || (isAmharic ? 'ይህንን ትምህርት' : 'this lesson');
      let greeting = isAmharic
        ? `እንኳን ደህና መጡ! እኔ ለ**${context.courseTitle || subjectName}** የአይ መምህርዎ ነኝ።\n\nየትኩረት ትምህርታችን፡ **${lessonName}** ነው።\n\nከየት እንጀምር? የትምህርቱን ዋና ዋና ነጥቦች ደረጃ በደረጃ ላስረዳዎት ወይስ የተለየ ጥያቄ አለዎት?`
        : `Welcome! I am your Ask Teacher AI for **${context.courseTitle || subjectName}**.\n\nFocus unit: **${lessonName}**.\n\nWould you like a concept breakdown or do you have a specific question?`;

      const ctxSessionId = `ctx_${Date.now()}`;
      const ctxSession: SavedChatSession = {
        id: ctxSessionId,
        title: `${context.courseTitle || subjectName} - ${context.lessonTitle || 'Lesson'}`,
        subject: subjectName,
        mode: context.mode || 'teaching',
        messages: [{ role: 'assistant', content: greeting }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setSessions(prev => [ctxSession, ...prev.filter(s => !s.id.startsWith('ctx_'))]);
      setActiveSessionId(ctxSessionId);
      setMessages(ctxSession.messages);
      return;
    }

    // Standard session bootstrap
    if (sessions.length > 0 && !activeSessionId) {
      const first = sessions[0];
      setActiveSessionId(first.id);
      setMessages(first.messages);
      setSelectedSubject(first.subject);
      setActiveMode(first.mode);
    } else if (sessions.length === 0) {
      // Check legacy single-storage migration
      const legacySaved = safeStorage.getItem(`ethiolearn_chat_history_${selectedSubject}`);
      let initialMsgs: ChatMessage[] = [];
      if (legacySaved) {
        try {
          initialMsgs = JSON.parse(legacySaved).slice(-30);
        } catch (e) {
          // ignore
        }
      }
      if (initialMsgs.length === 0) {
        initialMsgs = [{ role: 'assistant', content: getIntroGreeting(selectedSubject, activeMode) }];
      }

      const initialSession: SavedChatSession = {
        id: `chat_${Date.now()}`,
        title: `${selectedSubject} Quick Study`,
        subject: selectedSubject,
        mode: activeMode,
        messages: initialMsgs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      persistSessions([initialSession]);
      setActiveSessionId(initialSession.id);
      setMessages(initialSession.messages);
    }
  }, [context]);

  useEffect(() => {
    safeStorage.setItem('ethiolearn_language_preference', language);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // System Prompt Builder
  const getSystemPrompt = () => {
    let modeInstruction = "";
    if (activeMode === 'teaching') {
      modeInstruction = `MODE: SOCRATIC TEACHER ("አስተማሪ")
- Your goal is to guide the student to master concepts step-by-step.
- Break complex ideas into intuitive chunks. Use analogies from Ethiopian life, geography, or daily reality (e.g. coffee ceremony preparation, injera fermentation, rural-urban transport, hydro dams like GERD).
- After explaining a key point, ALWAYS ask one targeted check-for-understanding question to see if the student followed.`;
    } else if (activeMode === 'quiz') {
      modeInstruction = `MODE: PRACTICE EXAM CREATOR ("ፈተና አዘጋጅ")
- Generate authentic multiple-choice practice questions mirroring Ethiopian university and Grade 12 national exam formats.
- When the student replies with an answer, immediately grade it, explain WHY the correct option is right, and explain why the other options are distractors.`;
    } else if (activeMode === 'exam_feedback') {
      modeInstruction = `MODE: EXAM MISTAKE REMEDIATION ("ስህተት መመርመሪያ")
- The student is reviewing an exam question they missed or struggled with.
- Pinpoint the exact conceptual misconception that led to the wrong choice.
- Teach the core rule clearly and give a quick mnemonic or memory tip so they will never miss this concept again on official exams.`;
    } else {
      modeInstruction = `MODE: COLLABORATIVE STUDY BUDDY ("AI የጥናት ውይይት")
- Friendly, direct Q&A, math step-by-step problem solver, and summarizer.`;
    }

    const contextDetails = context ? `
ACTIVE COURSE CONTEXT:
- Course: ${context.courseTitle || selectedSubject}
- Current Lesson: ${context.lessonTitle || 'General Unit'}
${context.lessonContent ? `- Lesson Summary/Content Excerpt:\n${context.lessonContent.slice(0, 1500)}` : ''}
` : '';

    return `You are EthioLearn Pro's Ask Teacher AI — a warm, prestigious pedagogical academic mentor for Ethiopian students.
${modeInstruction}

CRITICAL RULES:
1. Always respond in the SAME language the student uses (Amharic if they write Amharic, English if they write English).
2. Maintain high academic rigor while remaining encouraging, patient, and clear.
3. Structure your response with clean Markdown headers, bold highlights, and bullet points.

Subject: ${context?.subject || selectedSubject}
Preferred language: ${language === 'am' ? 'Amharic (አማርኛ)' : 'English'}
${contextDetails}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_SIZE) {
      setErrorBanner(
        isAmharic 
          ? "ፋይሉ በጣም ትልቅ ነው። ከፍተኛው መጠን 4 ሜጋባይት ነው።" 
          : "Your file is too large (Maximum size is 4MB). Please attach a smaller file."
      );
      playFailureChime();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      const base64Data = commaIdx !== -1 ? result.substring(commaIdx + 1) : result;
      
      setAttachedFile({
        name: file.name,
        mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        data: base64Data,
        previewUrl: file.type.startsWith('image/') ? result : undefined
      });
      setErrorBanner(null);
      playSuccessChime();
    };
    reader.onerror = () => {
      setErrorBanner(isAmharic ? "ፋይሉን ማንበብ አልተቻለም።" : "Could not read the file. Please try another one.");
      playFailureChime();
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  };

  const speakText = (text: string, idx: number) => {
    if ('speechSynthesis' in window) {
      if (speakingMsgIdx === idx) {
        window.speechSynthesis.cancel();
        setSpeakingMsgIdx(null);
        return;
      }
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'am' ? 'am-ET' : 'en-US';
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingMsgIdx(null);
      utterance.onerror = () => setSpeakingMsgIdx(null);
      setSpeakingMsgIdx(idx);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    playSuccessChime();
    setTimeout(() => setCopiedIndex(null), 3000);
  };

  // Sync active message updates back to sessions array & localStorage
  const syncSessionMessages = (newMessages: ChatMessage[], autoTitleText?: string) => {
    if (!activeSessionId) return;

    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === activeSessionId) {
          let newTitle = s.title;
          if ((s.title.includes('Study') || s.title.includes('Quick') || s.title.includes('ውይይት')) && autoTitleText) {
            newTitle = autoTitleText.slice(0, 32).trim() + (autoTitleText.length > 32 ? '...' : '');
          }
          return {
            ...s,
            title: newTitle,
            subject: selectedSubject,
            mode: activeMode,
            messages: newMessages,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
      try {
        safeStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated.slice(0, 40)));
      } catch (e) {
        console.warn("Storage quota full:", e);
      }
      return updated;
    });
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() && !attachedFile) return;

    const subInfo = checkSubscriptionStatus(profile);
    const userId = profile.email || profile.name || 'guest';
    const usedToday = getDailyAIUsageCount(userId);

    // Gating check: If not PRO and reached daily limit
    if (!subInfo.isPro && usedToday >= FREE_DAILY_AI_LIMIT) {
      playFailureChime();
      setIsPaywallOpen(true);
      return;
    }

    if (!subInfo.isPro) {
      incrementDailyAIUsage(userId);
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      attachment: attachedFile ? {
        name: attachedFile.name,
        mimeType: attachedFile.mimeType,
        data: attachedFile.data
      } : undefined
    };

    const updatedUserMessages = [...messages, userMsg];
    setMessages(updatedUserMessages);
    setInputValue('');
    setAttachedFile(null);
    setErrorBanner(null);
    setIsTyping(true);
    playClickChime();
    onStudyAction?.();

    // Auto title from first student message
    const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0;
    const titleSeed = isFirstUserMessage ? text : undefined;

    let assistantMessageIndex = updatedUserMessages.length;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    await submitClaudeChat(
      updatedUserMessages.slice(-12),
      getSystemPrompt(),
      apiKey,
      {
        onChunk: (chunk) => {
          setMessages(prev => {
            const copy = [...prev];
            if (copy[assistantMessageIndex]) {
              copy[assistantMessageIndex].content += chunk;
            }
            return copy;
          });
        },
        onComplete: (fullText) => {
          setIsTyping(false);
          const finalAnswer = fullText && fullText.trim() ? fullText : (
            isAmharic 
              ? "ይቅርታ፣ ማብራሪያውን ማግኘት አልተቻለም። እባክዎ ጥያቄዎን በድጋሚ ይጠይቁ።"
              : "I have prepared the core study notes for your topic. Please check your notes or ask a follow-up question."
          );
          setMessages(prev => {
            const copy = [...prev];
            if (copy[assistantMessageIndex]) {
              copy[assistantMessageIndex].content = finalAnswer;
            }
            syncSessionMessages(copy, titleSeed);
            return copy;
          });
        },
        onError: (err) => {
          setIsTyping(false);
          setErrorBanner(err);
          playFailureChime();
          const displayErr = isAmharic
            ? `ይቅርታ፣ ምላሽ ማግኘት አልተቻለም: ${err}`
            : `Could not retrieve AI response: ${err}`;
          setMessages(prev => {
            const copy = [...prev];
            if (copy[assistantMessageIndex]) {
              copy[assistantMessageIndex].content = copy[assistantMessageIndex].content || displayErr;
            }
            syncSessionMessages(copy, titleSeed);
            return copy;
          });
        }
      },
      highThinking
    );
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorBanner("Voice speech recognition is not supported in this browser.");
      return;
    }

    playClickChime();
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'am' ? 'am-ET' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    setListening(true);

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setInputValue(resultText);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const triggerQuizGeneration = async () => {
    setGeneratingQuiz(true);
    setCurrentQuiz(null);
    setQuizAnswers({});
    setQuizScore(null);
    playClickChime();

    try {
      const topic = activeChips[0] || selectedSubject;
      const quiz = await generateQuizAI(topic, selectedSubject, apiKey);
      if (quiz && quiz.length > 0) {
        setCurrentQuiz(quiz);
        setGeneratingQuiz(false);
        playSuccessChime();
      } else {
        throw new Error("Empty quiz response from AI");
      }
    } catch (err: any) {
      console.warn("Using offline fallback quiz:", err);
      const fallbackList = LOCAL_FALLBACK_QUIZ[selectedSubject] || LOCAL_FALLBACK_QUIZ["Emerging Technologies"];
      setCurrentQuiz(fallbackList);
      setGeneratingQuiz(false);
      playSuccessChime();
    }
  };

  const handleCreateFlashcardsFromAnswer = async (answerText: string) => {
    playClickChime();
    try {
      const cards = await generateFlashcardsFromContextAI(answerText, selectedSubject, apiKey);
      if (cards && cards.length > 0 && onSaveDecksState) {
        const deckId = `deck_${selectedSubject.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const existing = decksState?.[deckId] || [];
        onSaveDecksState(deckId, [...existing, ...cards]);
        setFlSuccess(
          isAmharic 
            ? `${cards.length} ፍላሽካርዶች ወደ "${selectedSubject}" ተጨምረዋል!` 
            : `Added ${cards.length} flashcards to your ${selectedSubject} deck!`
        );
        playSuccessChime();
        setTimeout(() => setFlSuccess(null), 4000);
      }
    } catch (e) {
      console.warn("Could not generate flashcards:", e);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const subInfo = checkSubscriptionStatus(profile);
  const dailyUsed = getDailyAIUsageCount(profile.email || profile.name || 'guest');

  return (
    <div 
      className="flex flex-col w-full h-[85vh] min-h-[640px] max-h-[960px] relative bg-[#070D1E] rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*,application/pdf" 
        className="hidden" 
      />

      {/* ─── 1. PRO TOP APP BAR (Mobile & Desktop Master Header) ─── */}
      <header className="px-3 sm:px-4 py-2.5 bg-[#0C152E]/95 backdrop-blur-md border-b border-slate-800/90 flex items-center justify-between gap-2 z-20 shrink-0">
        {/* Left Side: Drawer Toggle + Identity */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => { playClickChime(); setIsDrawerOpen(true); }}
            className="px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 flex items-center gap-1.5 transition-all cursor-pointer relative shrink-0 active:scale-95"
            title={isAmharic ? 'የተቀመጡ ውይይቶች' : 'Saved Chats Drawer'}
          >
            <Menu className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline text-xs font-bold">{isAmharic ? 'ውይይቶች' : 'Chats'}</span>
            {sessions.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center font-mono">
                {sessions.length > 9 ? '9+' : sessions.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              <AITutorLogo size={32} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-black text-white truncate tracking-tight">
                  {isAmharic ? 'መምህሩን ጠይቅ' : 'Ask Teacher'}
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold">
                  {highThinking ? 'Gemini Pro' : 'Gemini Flash AI'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[130px] sm:max-w-[220px]">
                {activeSession?.title || selectedSubject}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Fast Controls (Subject selector, Tools, Language, New Chat) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Subject Badge / Modal Trigger */}
          <button
            onClick={() => { playClickChime(); setIsSubjectModalOpen(true); }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-all max-w-[110px] sm:max-w-[160px] truncate cursor-pointer shadow-xs active:scale-95"
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{selectedSubject}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Bilingual Language Switch */}
          <button
            onClick={() => {
              const next = language === 'en' ? 'am' : 'en';
              setLanguage(next);
              playClickChime();
            }}
            className="px-2 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
            title="Switch English / Amharic"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'en' ? 'EN' : 'አማ'}</span>
          </button>

          {/* High Thinking Toggle */}
          <button
            onClick={() => {
              setHighThinking(!highThinking);
              playClickChime();
            }}
            className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
              highThinking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="High Thinking Reasoning Mode (Gemini 2.5 Pro)"
          >
            <Bot className={`w-3.5 h-3.5 ${highThinking ? 'text-amber-400 animate-pulse' : ''}`} />
            <span className="hidden md:inline">{highThinking ? 'Pro Reasoning' : 'Reasoning'}</span>
          </button>

          {/* Study Tools Suite */}
          <button
            onClick={() => { playClickChime(); setIsStudyToolsOpen(true); }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
            title="AI Study Tools (Quiz & Summaries)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAmharic ? 'መሳሪያዎች' : 'Tools'}</span>
          </button>

          {/* Quick New Chat Button */}
          <button
            onClick={() => handleNewChat()}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer active:scale-95"
            title={isAmharic ? 'አዲስ ውይይት' : 'New Chat'}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── 2. SPECIALIZED STUDY MODE TABS (Horizontal Scroll on Mobile) ─── */}
      <div className="px-3 py-2 bg-[#091024] border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 select-none">
        <button
          onClick={() => { setActiveMode('teaching'); playClickChime(); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            activeMode === 'teaching'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/15'
              : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{isAmharic ? 'አስተማሪ ሁኔታ' : 'Socratic Teaching'}</span>
        </button>

        <button
          onClick={() => { setActiveMode('quiz'); playClickChime(); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            activeMode === 'quiz'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/15'
              : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <QuestionIcon className="w-3.5 h-3.5" />
          <span>{isAmharic ? 'የፈተና ጥያቄዎች' : 'Practice Exam'}</span>
        </button>

        <button
          onClick={() => { setActiveMode('exam_feedback'); playClickChime(); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            activeMode === 'exam_feedback'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/15'
              : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>{isAmharic ? 'ስህተት መመርመሪያ' : 'Mistake Solver'}</span>
        </button>

        <button
          onClick={() => { setActiveMode('chat'); playClickChime(); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            activeMode === 'chat'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black shadow-amber-500/15'
              : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{isAmharic ? 'የጥናት ውይይት' : 'Study Buddy'}</span>
        </button>

        {/* Free Quota / Pro Status Pill on Right */}
        <div className="ml-auto flex items-center gap-1.5 pl-2 shrink-0">
          {subInfo.isPro ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              <span>PRO Unlimited ♾️</span>
            </span>
          ) : (
            <button
              onClick={() => { playClickChime(); setIsPaywallOpen(true); }}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-amber-500/30 text-amber-300 font-medium flex items-center gap-1 hover:bg-amber-500/10 cursor-pointer"
            >
              <span>{Math.max(0, FREE_DAILY_AI_LIMIT - dailyUsed)}/{FREE_DAILY_AI_LIMIT} {isAmharic ? 'ነፃ ቀርቷል' : 'Free Qs'}</span>
              <span className="text-[9px] text-amber-400 font-bold underline">{isAmharic ? 'አሻሽል' : 'Upgrade'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 3. CONTEXT / NOTIFICATION BANNERS ─── */}
      {context && (
        <div className="mx-3 mt-2 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs shadow-sm shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate text-xs">
                {context.courseTitle || context.subject} • {context.lessonTitle || 'Unit'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {isAmharic ? 'ከትምህርቱ ጋር በቀጥታ የተሳሰረ ውይይት' : 'Live tutoring connected to unit content'}
              </p>
            </div>
          </div>
          {onClearContext && (
            <button
              onClick={() => { playClickChime(); onClearContext(); }}
              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold border border-slate-700 transition-colors shrink-0"
            >
              {isAmharic ? 'አውድ አጽዳ' : 'Clear Context'}
            </button>
          )}
        </div>
      )}

      {errorBanner && (
        <div className="mx-3 mt-2 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-center gap-2 text-red-400 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="text-red-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {flSuccess && (
        <div className="mx-3 mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2 text-emerald-300 text-xs shrink-0">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{flSuccess}</span>
        </div>
      )}

      {/* ─── 4. CHAT MESSAGES STAGE ─── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-4 min-h-0 font-sans">
        {/* Interactive Quiz Mode Card (If in Quiz Mode and generating/generated) */}
        {activeMode === 'quiz' && (
          <div className="p-4 rounded-2xl bg-[#0e1736] border border-amber-500/30 space-y-3 shadow-md mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {isAmharic ? `${selectedSubject} የፈተና ጥያቄዎች` : `${selectedSubject} Practice Quiz`}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {isAmharic ? 'የኢትዮጵያ ዩኒቨርሲቲ የፈተና ሞዴል' : 'Ethiopian University Standard'}
                  </span>
                </div>
              </div>

              <button
                onClick={triggerQuizGeneration}
                disabled={generatingQuiz}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generatingQuiz ? 'animate-spin' : ''}`} />
                <span>{generatingQuiz ? (isAmharic ? 'በማዘጋጀት ላይ...' : 'Generating...') : (isAmharic ? 'አዲስ ፈተና' : 'Generate Quiz')}</span>
              </button>
            </div>

            {currentQuiz && currentQuiz.length > 0 && (
              <div className="space-y-3 pt-2">
                {currentQuiz.map((q, qIdx) => (
                  <div key={qIdx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                    <p className="font-semibold text-slate-100 leading-relaxed">
                      <span className="text-amber-400 font-bold mr-1">Q{qIdx + 1}.</span> {q.question}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isSelected = quizAnswers[qIdx] === opt;
                        const isCorrect = opt === q.correctAnswer;
                        const showFeedback = quizScore !== null;

                        let btnClass = "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-amber-500/40";
                        if (showFeedback) {
                          if (isCorrect) btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                          else if (isSelected && !isCorrect) btnClass = "bg-red-500/20 border-red-500 text-red-300 line-through";
                        } else if (isSelected) {
                          btnClass = "bg-amber-500/20 border-amber-400 text-amber-300 font-bold";
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              if (quizScore !== null) return;
                              setQuizAnswers(prev => ({ ...prev, [qIdx]: opt }));
                              playClickChime();
                            }}
                            className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2 cursor-pointer ${btnClass}`}
                          >
                            <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 leading-snug">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    {quizScore !== null && q.explanation && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                        <span className="font-bold uppercase tracking-wider text-[9px] text-amber-400 block mb-0.5">Explanation:</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  {quizScore === null ? (
                    <button
                      onClick={() => {
                        let score = 0;
                        currentQuiz.forEach((q, idx) => {
                          if (quizAnswers[idx] === q.correctAnswer) score++;
                        });
                        setQuizScore(score);
                        playSuccessChime();
                      }}
                      disabled={Object.keys(quizAnswers).length === 0}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 transition-colors shadow-md"
                    >
                      {isAmharic ? 'መልሶችን አረጋግጥ' : 'Submit & Check Answers'}
                    </button>
                  ) : (
                    <div className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Your Score</span>
                        <p className="text-sm font-black text-amber-400">
                          {quizScore} / {currentQuiz.length} ({Math.round((quizScore / currentQuiz.length) * 100)}%)
                        </p>
                      </div>
                      <button
                        onClick={triggerQuizGeneration}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                      >
                        {isAmharic ? 'እንደገና ሞክር' : 'Try Another Quiz'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              key={index}
              className={`flex gap-3 max-w-[95%] sm:max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold shadow-sm select-none ${
                isUser
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                  : 'bg-slate-900 border-slate-800 text-amber-400'
              }`}>
                {isUser ? 'You' : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Body */}
              <div className="flex flex-col min-w-0 max-w-full">
                <div className={`rounded-2xl p-4 sm:p-4.5 text-sm sm:text-[15px] leading-relaxed shadow-md break-words ${
                  isUser
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-xs shadow-amber-500/10'
                    : 'bg-[#0E1736] text-slate-100 border border-slate-800/90 rounded-tl-xs'
                }`}>
                  {/* Attached File Preview inside Message */}
                  {msg.attachment && (
                    <div className="mb-3">
                      {msg.attachment.mimeType.startsWith('image/') ? (
                        <img 
                          src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`}
                          alt="Attached Homework" 
                          className="max-h-72 w-auto rounded-xl border border-slate-800/80 object-contain max-w-full shadow-sm"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200">
                          <File className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate font-medium">{msg.attachment.name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-line break-words select-text">
                    {msg.content}
                  </div>
                </div>

                {/* Assistant Message Action Bar */}
                {!isUser && msg.content && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 self-start">
                    {/* TTS Speech Player */}
                    <button 
                      onClick={() => speakText(msg.content, index)}
                      className={`text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer select-none ${
                        speakingMsgIdx === index 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                      }`}
                      title={speakingMsgIdx === index ? "Stop voice reading" : "Read aloud (Audio TTS)"}
                    >
                      {speakingMsgIdx === index ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span>{isAmharic ? 'አቁም' : 'Stop'}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{isAmharic ? 'አዳምጥ' : 'Listen'}</span>
                        </>
                      )}
                    </button>

                    {/* Copy Text */}
                    <button 
                      onClick={() => copyText(msg.content, index)}
                      className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-amber-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer select-none"
                    >
                      {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Generate Flashcards from Answer */}
                    <button
                      onClick={() => handleCreateFlashcardsFromAnswer(msg.content)}
                      className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-amber-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer select-none"
                      title="Turn this explanation into revision flashcards"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAmharic ? 'ፍላሽካርድ ፍጠር' : 'Make Flashcards'}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Live Typing & Reasoning State */}
        {isTyping && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#0E1736] border border-slate-800 text-slate-300 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2.5 shadow-sm">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-xs font-sans">
                {isAmharic 
                  ? (highThinking ? 'መምህሩ በከፍተኛ ማሰብ እያሰላሰለ ነው (2.5 Pro)...' : 'መምህሩ እያሰበ ነው...') 
                  : (highThinking ? 'Teacher is reasoning (2.5 Pro High Thinking)...' : 'Teacher is thinking...')}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── 5. PRO INPUT STATION (Optimized for Mobile Phone & Desktop) ─── */}
      <footer className="p-3 sm:p-3.5 bg-[#0C152E]/95 backdrop-blur-md border-t border-slate-800/90 space-y-2.5 z-20 shrink-0">
        {/* Quick Suggestion Prompts Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 px-1">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          {activeChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => { playClickChime(); handleSend(chip); }}
              className="text-xs bg-slate-900/90 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 border border-slate-800 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Attachment Thumbnail Preview (if attached) */}
        {attachedFile && (
          <div className="flex items-center gap-2.5 bg-slate-900 border border-amber-500/40 p-2.5 rounded-xl text-xs max-w-sm shadow-sm animate-fade-in">
            {attachedFile.previewUrl ? (
              <img src={attachedFile.previewUrl} alt="Upload" className="w-9 h-9 rounded-lg object-cover border border-slate-800" />
            ) : (
              <File className="w-5 h-5 text-amber-400" />
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-slate-200 text-xs">{attachedFile.name}</p>
            </div>
            <button
              onClick={() => { setAttachedFile(null); playClickChime(); }}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Input Control Bar */}
        <div className="flex items-center gap-2">
          {/* File Attachment Button */}
          <button
            onClick={() => { playClickChime(); fileInputRef.current?.click(); }}
            title={isAmharic ? "ማስረጃ ፋይል አያይዝ (ፎቶ/PDF)" : "Attach image or PDF document"}
            className="w-12 h-12 min-h-[48px] bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text Input - Generous and Comfortable */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
            placeholder={isAmharic ? `ስለ ${selectedSubject} ያሰቡትን ይጠይቁ...` : `Ask Teacher anything about ${selectedSubject}...`}
            className="flex-1 bg-slate-900/95 text-white text-sm sm:text-base px-4 py-3 border border-slate-700/80 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all h-12 min-h-[48px] min-w-0 placeholder:text-slate-500"
          />

          {/* Voice Input Button */}
          <button
            onClick={startVoiceInput}
            title={isAmharic ? "በድምፅ ተናገር" : "Voice dictation"}
            className={`w-12 h-12 min-h-[48px] border rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-95 shadow-sm ${
              listening 
                ? 'text-red-400 border-red-500 bg-red-500/20 animate-pulse' 
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-amber-400 hover:border-amber-500/50'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Action Button */}
          <button
            onClick={() => handleSend()}
            disabled={(!inputValue.trim() && !attachedFile) || isTyping}
            className="h-12 min-h-[48px] px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </footer>

      {/* ─── 6. SAVED CHATS DRAWER (Slide-over on Phone & Desktop) ─── */}
      <SavedChatsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onRenameSession={handleRenameSession}
        isAmharic={isAmharic}
      />

      {/* ─── 7. FAST SUBJECT SELECTION MODAL ─── */}
      <AnimatePresence>
        {isSubjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0A1128] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    {isAmharic ? 'የትምህርት ዓይነት ይምረጡ' : 'Select Study Subject'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {subjectsList.map(sub => {
                  const isSelected = sub === selectedSubject;
                  return (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedSubject(sub);
                        playClickChime();
                        setIsSubjectModalOpen(false);
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' 
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{sub}</span>
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 8. PAYWALL MODAL GATING COMPONENT ─── */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUpgradeClick={() => {
          setIsPaywallOpen(false);
          if (onOpenUpgrade) onOpenUpgrade();
        }}
        language={language}
        questionsUsed={dailyUsed}
        maxQuestions={FREE_DAILY_AI_LIMIT}
      />

      {/* ─── 9. AI STUDY TOOLS SUITE MODAL ─── */}
      <AIStudyToolsModal
        isOpen={isStudyToolsOpen}
        onClose={() => setIsStudyToolsOpen(false)}
        language={language}
        userApiKey={apiKey}
        enrolledSubjects={subjectsList}
      />
    </div>
  );
}
