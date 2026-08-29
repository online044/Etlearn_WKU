import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Trophy, Zap, Clock, Calendar, ArrowRight, Sparkles, FileText, CheckCircle, XCircle, HelpCircle, Award, RefreshCw, Plus, X, Star
} from 'lucide-react';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { generateQuizAI, submitClaudeChat, ChatMessage } from '../utils/ai';
import { safeStorage } from '../utils/safeStorage';

interface ExamPrepProps {
  apiKey: string;
  enrolledSubjects: string[];
  onStudyAction?: () => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

const PAST_EXAM_BANK: { [subject: string]: QuizQuestion[] } = {
  "Emerging Technologies": [
    {
      question: "Which technology acts as the underlying fabric enabling the secure decentralization of cryptocurrencies without middlemen?",
      options: ["Centralized cloud clusters", "Blockchain distributed ledgers", "Quantum supercomputing", "Edge mesh nodes"],
      correctAnswer: "Blockchain distributed ledgers",
      explanation: "Blockchain technology employs decentralized consensus mechanisms (like Proof of Work/Stake) to secure accounting books without trusting central banks or middlemen."
    },
    {
      question: "What is the primary operational advantage of implementing Edge Computing in remote industrial networks?",
      options: ["Massive cloud data-center compilation", "Reduced latency by processing closer to host devices", "Infinitely high energy consumption profiles", "Lower overall cryptography overhead"],
      correctAnswer: "Reduced latency by processing closer to host devices",
      explanation: "Edge processing handles immediate data local to the collection node, cutting transmission latency to remote servers and saving network bandwidth."
    }
  ],
  "Introduction to Economics": [
    {
      question: "Which state of a typical free market represents the stable price-point where consumer demand perfectly equals producer supply?",
      options: ["Systemic inflation", "Equilibrium price level", "Economic stagnation", "Mercantile deficit"],
      correctAnswer: "Equilibrium price level",
      explanation: "Market equilibrium occurs at the intersection of supply and demand curves. No supply surplus or demand deficit forces price adjustments."
    },
    {
      question: "What unique Giffen Good feature violates the fundamental 'Law of Demand' in microeconomics?",
      options: ["An increase in price leads to an increase in demand", "Demand falls to zero immediately upon price adjustments", "Producers refuse to supply items below premium limits", "The substitution effect eclipses real-income restrictions"],
      correctAnswer: "An increase in price leads to an increase in demand",
      explanation: "For highly essential inferior foods like staple grains in low-income populations, a high price reduces disposable cash, forcing families to buy more basic grains instead of expensive meats."
    }
  ],
  "General Biology": [
    {
      question: "What primary chemical organelle hosts the aerobic Krebs (Citric Acid) Cycle within organic eukaryotic cells?",
      options: ["Cytosolic ribosomes", "The inner mitochondria matrix", "Nucleolar envelope membranes", "Lysosome digestion bubbles"],
      correctAnswer: "The inner mitochondria matrix",
      explanation: "While glycolysis happens in the cytosol, the Citric Acid Cycle occurs inside the mitochondrial matrix to synthesize NADH, FADH2, and ATP precursors."
    },
    {
      question: "Which cellular cycle phase copies genetic chromatid structures to prepare cells for real mitosis division?",
      options: ["G0 stagnant resting stage", "S (Synthesis) phase of Interphase", "Prophase spindle convergence", "Telophase cytokinetics split"],
      correctAnswer: "S (Synthesis) phase of Interphase",
      explanation: "DNA replication is completed in the S-Phase (Synthesis Phase) of the cell cycle, ensuring each resulting daughter cell gets a perfect genome duplicate."
    }
  ],
  "Communicative English": [
    {
      question: "Choose the correct indirect reported statement for: \"I am studying biology tonight,\" said Almaz.",
      options: [
        "Almaz said she is studying biology tonight.",
        "Almaz said she was studying biology that night.",
        "Almaz said I had been studying biology tonight.",
        "Almaz says she studied biology that night."
      ],
      correctAnswer: "Almaz said she was studying biology that night.",
      explanation: "When reporting speech, present continuous shifts to past continuous ('am studying' -> 'was studying'), and time phrases shift ('tonight' -> 'that night')."
    }
  ],
  "Moral and Civic Education": [
    {
      question: "Which founding document governs the modern federal structure and human rights standards of the Federal Democratic Republic of Ethiopia?",
      options: ["The 1931 imperial decree", "The 1987 Derg legal template", "The 1995 FDRE Constitution", "The Fetha Nagast historical code"],
      correctAnswer: "The 1995 FDRE Constitution",
      explanation: "The 1995 Constitution of the FDRE established the current ethnic-based federal structure, decentralized administrative powers, and coded core democratic rights."
    }
  ],
  "Mathematics": [
    {
      question: "In vector algebra, what is the dot product of vectors u = [2, 3] and v = [4, -1]?",
      options: ["5", "11", "14", "-5"],
      correctAnswer: "5",
      explanation: "The dot product is calculated as (2*4) + (3*-1) = 8 - 3 = 5."
    }
  ],
  "Inclusive Education": [
    {
      question: "Which educational strategy involves modifying the learning environment, instruction, and assessments to support students with diverse learning styles and abilities?",
      options: ["Differentiated Instruction", "Standardized Isolationism", "Homogenous Grouping", "Unimodal lecturing"],
      correctAnswer: "Differentiated Instruction",
      explanation: "Differentiated instruction addresses the individual learning needs of all students within the same classroom setting."
    }
  ],
  "Geography": [
    {
      question: "Which morphological feature of East Africa runs completely through Ethiopia from northeast to southwest, dividing its highlands?",
      options: ["The Great Rift Valley", "The Ethiopian Plateau", "The Ras Dashen Peak", "The Danakil Depression"],
      correctAnswer: "The Great Rift Valley",
      explanation: "The East African Rift System divides the Ethiopian highlands into northwestern and southeastern sections, hosting a chain of beautiful lakes."
    }
  ],
  "Logic and Critical Thinking": [
    {
      question: "What is the form of a deductive argument that contains exactly two premises and a conclusion?",
      options: ["A syllogism", "An inductive generalization", "An analogical inference", "A formal fallacy"],
      correctAnswer: "A syllogism",
      explanation: "A syllogism is a form of reasoning in which a conclusion is drawn from two given or assumed premises (e.g. categorical syllogism)."
    }
  ],
  "History": [
    {
      question: "Which famous Axumite Emperor converted the kingdom to Christianity in the 4th century AD?",
      options: ["Emperor Ezana", "Emperor Kaleb", "Emperor Lalibela", "Emperor Menelik I"],
      correctAnswer: "Emperor Ezana",
      explanation: "Emperor Ezana was the first monarch of Axum to adopt Christianity, establishing it as the state religion around 330 AD."
    }
  ],
  "Chemistry": [
    {
      question: "According to Bronsted-Lowry theory, what species is formed when an acid donates a proton to a base?",
      options: ["Its conjugate base", "Its conjugate acid", "A neutral precipitate", "A hydronium salt"],
      correctAnswer: "Its conjugate base",
      explanation: "An acid that has lost its proton becomes its conjugate base, which is capable of accepting a proton in the reverse reaction."
    }
  ],
  "Aptitude": [
    {
      question: "A machine can produce 50 widgets in 40 minutes. How many widgets can three identical machines produce working together for 2 hours?",
      options: ["450 widgets", "150 widgets", "300 widgets", "225 widgets"],
      correctAnswer: "450 widgets",
      explanation: "One machine produces 50 widgets per 40 min, which is 150 widgets in 120 min (2 hours). Three machines will produce 150 * 3 = 450 widgets."
    }
  ],
  "General Physics": [
    {
      question: "What is the work done on an object when a constant force of 15 Newtons moves it 4 meters in the direction of the force?",
      options: ["60 Joules", "3.75 Joules", "19 Joules", "30 Joules"],
      correctAnswer: "60 Joules",
      explanation: "Work is calculated as Force * distance * cos(theta). Here, Work = 15 N * 4 m = 60 Joules."
    }
  ],
  "Entrepreneurship": [
    {
      question: "Which component of the Canvas Business Model defines the groups of people or organizations an enterprise aims to reach and serve?",
      options: ["Customer Segments", "Value Propositions", "Channels", "Key Partnerships"],
      correctAnswer: "Customer Segments",
      explanation: "Customer Segments define the specific profiles or cohorts of customers that a business builds products or services for."
    }
  ],
  "Social Anthropology": [
    {
      question: "Which of the following is a primary method used by cultural anthropologists that involves living within a community to observe and record daily life firsthand?",
      options: ["Participant Observation", "Statistical Census Surveying", "Controlled Laboratory Experimentation", "Quantitative Econometrics"],
      correctAnswer: "Participant Observation",
      explanation: "Participant observation is the hallmark qualitative research method of anthropology, requiring immersive fieldwork in local communities."
    }
  ],
  "C++ Programming": [
    {
      question: "What is the function of the 'destructor' in a C++ class?",
      options: ["To deallocate memory and clean up resources when an object goes out of scope", "To allocate dynamic pointer blocks on class instantiation", "To copy private member variables to external scopes", "To compile nested header declarations automatically"],
      correctAnswer: "To deallocate memory and clean up resources when an object goes out of scope",
      explanation: "Destructors are special member functions called automatically when an object is destroyed or goes out of scope, releasing acquired heap resources."
    }
  ],
  "Civics": [
    {
      question: "Which of the following is a key feature of a democratic system?",
      options: ["Rule of Law and accountability", "Absolute power of the executive branch", "State control of all private property", "Inherited royal leadership"],
      correctAnswer: "Rule of Law and accountability",
      explanation: "In a fully democratic system, all citizens and governmental bodies are subject to the Rule of Law, with periodic elections establishing clear accountability."
    },
    {
      question: "What is the primary role of the House of Federation (HoF) in the Federal Democratic Republic of Ethiopia?",
      options: ["Interpreting the Federal Constitution and resolving regional disputes", "Drafting and enacting national commercial codes", "Serving as the commander-in-chief of defense forces", "Representing Ethiopia in foreign diplomatic missions"],
      correctAnswer: "Interpreting the Federal Constitution and resolving regional disputes",
      explanation: "According to the 1995 FDRE Constitution, the House of Federation has the ultimate power of constitutional interpretation and federal dispute resolution."
    }
  ],
  "Agriculture": [
    {
      question: "Which soil conservation method involves planting crops across a slope following elevation lines to reduce water erosion?",
      options: ["Contour ploughing", "Monoculture farming", "Shifting cultivation", "Chemical slash-and-burn"],
      correctAnswer: "Contour ploughing",
      explanation: "Contour ploughing creates water break barriers along elevation contours, reducing soil runoff and increasing water infiltration significantly."
    },
    {
      question: "In animal nutrition, what is the primary purpose of adding leguminous forage (like Alfalfa) to livestock feed?",
      options: ["To provide high protein content and nitrogen-fixing benefits", "To decrease the digestion rate of complex cellulose", "To eliminate the need for minerals and water intake", "To artificialize milk fats production in lactating cows"],
      correctAnswer: "To provide high protein content and nitrogen-fixing benefits",
      explanation: "Leguminous plants are rich in digestible proteins, amino acids, and minerals, which drastically improve livestock growth and milk yield."
    }
  ],
  "Business": [
    {
      question: "In accounting, what is the fundamental accounting equation that governs double-entry bookkeeping?",
      options: ["Assets = Liabilities + Owner's Equity", "Assets + Liabilities = Owner's Equity", "Revenues = Expenses + Net Income", "Assets = Current Assets + Non-Current Assets"],
      correctAnswer: "Assets = Liabilities + Owner's Equity",
      explanation: "The accounting equation states that a company's total assets are funded by either borrowing (liabilities) or owners' capital contributions (equity)."
    },
    {
      question: "Which form of business ownership offers limited liability to its owners but is subject to double taxation?",
      options: ["A Share Company (Corporation)", "A Sole Proprietorship", "A General Partnership", "A Joint Venture"],
      correctAnswer: "A Share Company (Corporation)",
      explanation: "Corporations (Share Companies) protect owners via limited liability, but face double taxation: once on corporate earnings, and once on individual dividends."
    }
  ],
  "Moral and Civics": [
    {
      question: "According to ethical theories, which philosophical view holds that the moral value of an action is determined solely by its ultimate consequences?",
      options: ["Utilitarianism (Consequentialism)", "Deontological Ethics (Kantian)", "Virtue Ethics (Aristotelian)", "Ethical Relativism"],
      correctAnswer: "Utilitarianism (Consequentialism)",
      explanation: "Utilitarianism, popularized by Bentham and Mill, evaluates actions based on their consequences, aiming to maximize the greatest happiness for the greatest number."
    },
    {
      question: "Which type of state structure distributes political and administrative power between a central government and autonomous regional units?",
      options: ["A Federal State Structure", "A Unitary State Structure", "An Absolute Monarchy", "A Totalitarian Autocracy"],
      correctAnswer: "A Federal State Structure",
      explanation: "Federalism divides sovereignty between central and constituent state governments (such as in Ethiopia), safeguarding regional autonomy while preserving national integrity."
    }
  ],
  "Emerging Tech": [
    {
      question: "Which concept refers to a system of physical objects embedded with sensors, software, and network connections that exchange data without human intervention?",
      options: ["Internet of Things (IoT)", "Centralized Batch Mainframe", "Hypertext Transfer Protocol (HTTP)", "Local Area Networking (LAN)"],
      correctAnswer: "Internet of Things (IoT)",
      explanation: "IoT describes the network of smart physical items collecting and sharing data in real-time, enabling smart cities and industrial automation (Industry 4.0)."
    },
    {
      question: "What is the main role of a smart contract in a blockchain platform like Ethereum?",
      options: ["To automatically execute contractual terms when predefined conditions are met", "To encrypt user wallets with secure physical backup hardware", "To generate block hashes using graphics processing units", "To translate Ge'ez characters into binary machine code"],
      correctAnswer: "To automatically execute contractual terms when predefined conditions are met",
      explanation: "Smart contracts are self-executing computerized protocols that run directly on blockchain ledgers, automating agreement validation without trusted third parties."
    }
  ],
  "Applied Math": [
    {
      question: "What is the derivative of the function f(x) = x * ln(x) with respect to x?",
      options: ["ln(x) + 1", "ln(x)", "1/x", "x + ln(x)"],
      correctAnswer: "ln(x) + 1",
      explanation: "Using the product rule, d/dx[u*v] = u'v + uv'. Thus, d/dx[x*ln(x)] = (1)*ln(x) + x*(1/x) = ln(x) + 1."
    },
    {
      question: "What does the divergence of a vector field physically represent in fluid dynamics?",
      options: ["The net rate of expansion or contraction of fluid volume at a given point", "The rotational angular velocity or spin of fluid particles", "The maximum rate of directional temperature increases", "The conservative energy path integral over a closed loop"],
      correctAnswer: "The net rate of expansion or contraction of fluid volume at a given point",
      explanation: "Mathematically, the divergence (∇·F) measures whether a vector field behaves as a fluid source (positive divergence) or a fluid sink (negative divergence)."
    }
  ]
};

export default function ExamPrep({ apiKey, enrolledSubjects, onStudyAction }: ExamPrepProps) {
  // Load language settings from safeStorage
  const [language, setLanguage] = useState<'en' | 'am'>(() => {
    const saved = safeStorage.getItem('ethiolearn_language_preference');
    return (saved === 'am' || saved === 'en') ? saved : 'en';
  });

  const [customQuestionBank, setCustomQuestionBank] = useState<{ [subject: string]: QuizQuestion[] }>(() => {
    try {
      const stored = safeStorage.getItem('ethiolearn_custom_exams');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const [allSubjects, setAllSubjects] = useState<string[]>(() => {
    try {
      const stored = safeStorage.getItem('ethiolearn_custom_exams');
      const customSubjects = stored ? Object.keys(JSON.parse(stored)) : [];
      return Array.from(new Set([...enrolledSubjects, ...customSubjects]));
    } catch (e) {
      return enrolledSubjects;
    }
  });

  const [selectedSubject, setSelectedSubject] = useState(() => {
    try {
      const stored = safeStorage.getItem('ethiolearn_custom_exams');
      const customSubjects = stored ? Object.keys(JSON.parse(stored)) : [];
      const combined = Array.from(new Set([...enrolledSubjects, ...customSubjects]));
      return combined[0] || "Emerging Technologies";
    } catch (e) {
      return enrolledSubjects[0] || "Emerging Technologies";
    }
  });

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [qCount, setQCount] = useState<number>(5);
  const [customNeeds, setCustomNeeds] = useState<string>('');

  // Custom exam form states
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [newExamSubject, setNewExamSubject] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newOptionC, setNewOptionC] = useState('');
  const [newOptionD, setNewOptionD] = useState('');
  const [newCorrectOption, setNewCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [newExplanation, setNewExplanation] = useState('');

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamSubject.trim() || !newQuestionText.trim() || !newOptionA.trim() || !newOptionB.trim() || !newOptionC.trim() || !newOptionD.trim()) {
      alert(language === 'en' ? 'Please fill out all required fields!' : 'እባክዎን ሁሉንም አስፈላጊ ቦታዎች ይሙሉ!');
      return;
    }

    const correctMap = {
      'A': newOptionA.trim(),
      'B': newOptionB.trim(),
      'C': newOptionC.trim(),
      'D': newOptionD.trim()
    };

    const newQn: QuizQuestion = {
      question: newQuestionText.trim(),
      options: [newOptionA.trim(), newOptionB.trim(), newOptionC.trim(), newOptionD.trim()],
      correctAnswer: correctMap[newCorrectOption],
      explanation: newExplanation.trim() || undefined
    };

    const subjectKey = newExamSubject.trim();

    try {
      const stored = safeStorage.getItem('ethiolearn_custom_exams');
      const bank = stored ? JSON.parse(stored) : {};
      
      if (!bank[subjectKey]) {
        bank[subjectKey] = [];
      }
      bank[subjectKey].push(newQn);
      
      safeStorage.setItem('ethiolearn_custom_exams', JSON.stringify(bank));
      setCustomQuestionBank(bank);
      
      // Update subjects list if it's a brand new subject
      if (!allSubjects.includes(subjectKey)) {
        setAllSubjects(prev => {
          const updated = [...prev, subjectKey];
          return Array.from(new Set(updated));
        });
      }
      
      setSelectedSubject(subjectKey);
      playSuccessChime();
      alert(language === 'en' 
        ? `Successfully added your question to subject "${subjectKey}"! You can now select this subject and take your custom exam.` 
        : `ጥያቄዎ በ"${subjectKey}" ስር በተሳካ ሁኔታ ተቀምጧል! አሁን መፈተን ይችላሉ።`
      );

      // Reset
      setNewQuestionText('');
      setNewOptionA('');
      setNewOptionB('');
      setNewOptionC('');
      setNewOptionD('');
      setNewExplanation('');
      setNewCorrectOption('A');
      setShowAddExamModal(false);
    } catch (err) {
      console.error(err);
      playFailureChime();
    }
  };

  const [examMode, setExamMode] = useState<'setup' | 'active' | 'results'>('setup');
  const [examQuestions, setExamQuestions] = useState<QuizQuestion[]>([]);
  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  
  // Quiz evaluation states
  const [userSelections, setUserSelections] = useState<{ [qIndex: number]: string }>({});
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  
  const [examScore, setExamScore] = useState<number>(0);
  const [examGrade, setExamGrade] = useState<'A' | 'B' | 'C' | 'D' | 'F'>('F');
  const [pastSessions, setPastSessions] = useState<any[]>(() => {
    try {
      const stored = safeStorage.getItem("ethiolearn_exam_sessions_history");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [favoriteSessionIds, setFavoriteSessionIds] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('ethiolearn_favorite_exams');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [showFavoriteSessionsOnly, setShowFavoriteSessionsOnly] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const toggleFavoriteSession = (sessionId: string) => {
    playClickChime();
    setFavoriteSessionIds(prev => {
      const updated = prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId];
      safeStorage.setItem('ethiolearn_favorite_exams', JSON.stringify(updated));
      return updated;
    });
  };

  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [particles, setParticles] = useState<{ id: number; left: number; top: number; color: string; duration: number; size: number }[]>([]);

  // Revision tool
  const [revisionTopic, setRevisionTopic] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [revisionOutput, setRevisionOutput] = useState('');

  const examTimerRef = useRef<any>(null);

  // Sync language with state changes
  useEffect(() => {
    const handleLangChange = () => {
      const saved = safeStorage.getItem('ethiolearn_language_preference');
      if (saved === 'am' || saved === 'en') {
        setLanguage(saved);
      }
    };
    window.addEventListener('storage', handleLangChange);
    // Interval check for in-app page transfers
    const interval = setInterval(handleLangChange, 1000);
    return () => {
      window.removeEventListener('storage', handleLangChange);
      clearInterval(interval);
    };
  }, []);

  const triggerDopaminePop = () => {
    const colors = ['#078930', '#FCDD09', '#BE1931', '#2563EB', '#8B5CF6'];
    const newList = Array.from({ length: 30 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 85 + 5,
      top: Math.random() * 30 + 40,
      color: colors[i % colors.length],
      duration: 0.8 + Math.random() * 0.7,
      size: 5 + Math.random() * 7
    }));
    setParticles(newList);
    setTimeout(() => setParticles([]), 2200);
  };

  const handleStartPastExam = () => {
    const defaultBank = PAST_EXAM_BANK[selectedSubject] || [];
    const customBankForSubject = customQuestionBank[selectedSubject] || [];
    const bank = [...customBankForSubject, ...defaultBank];

    if (!bank || bank.length === 0) {
      setLoadingText(
        language === 'en' 
          ? "No hand-verified past papers available for this grade yet. We will generate questions with AI!" 
          : "በዚህ የትምህርት ምርጫ የተዘጋጀ ፈተና የለም። በአይ እናዘጋጅልዎታለን!"
      );
      playFailureChime();
      setTimeout(() => {
        setLoadingText(null);
        handleGenerateMockAI();
      }, 2500);
      return;
    }

    playClickChime();
    setExamQuestions(bank);
    setExamMode('active');
    setActiveQIndex(0);
    setUserSelections({});
    setIsAnswerRevealed(false);
    setTimeRemaining(90);
    startQuestionTimer(90);
  };

  const handleGenerateMockAI = async () => {
    setLoadingText(
      language === 'en'
        ? `Contacting AI to formulate a customized ${difficulty} quiz for you...`
        : `አይ መምህር የፈተና ጥያቄዎችን እያዘጋጀ ነው...`
    );
    playClickChime();

    try {
      const topic = `curriculum of ${selectedSubject} of grade high standards containing exactly ${qCount} multiple choice questions`;
      const questions = await generateQuizAI(topic, selectedSubject, apiKey, difficulty, qCount, customNeeds);
      if (questions && questions.length > 0) {
        setExamQuestions(questions.slice(0, qCount));
        setExamMode('active');
        setActiveQIndex(0);
        setUserSelections({});
        setIsAnswerRevealed(false);
        setLoadingText(null);
        setTimeRemaining(60);
        startQuestionTimer(60);
        playSuccessChime();
      } else {
        throw new Error("Unable to formulate quiz questions from AI.");
      }
    } catch (err: any) {
      console.warn('AI exam generation failed/offline. Activating exam bank fallback:', err);
      
      // Look up subject in local bank or default to Emerging Technologies
      const defaultBank = PAST_EXAM_BANK[selectedSubject] || PAST_EXAM_BANK["Emerging Technologies"] || [];
      const customBankForSubject = customQuestionBank[selectedSubject] || [];
      const fallbackList = [...customBankForSubject, ...defaultBank];
      
      setExamQuestions(fallbackList);
      setExamMode('active');
      setActiveQIndex(0);
      setUserSelections({});
      setIsAnswerRevealed(false);
      setLoadingText(null);
      setTimeRemaining(90);
      startQuestionTimer(90);
      
      // Show notice of local fallback
      const notice = language === 'en' 
        ? "AI was offline or slow. Loaded official curriculum practice questions from local library instead."
        : "አይ መምህሩ ከመስመር ውጭ በመሆኑ ምክንያት ጥያቄዎችን ከመካነ-መዝገቡ አምጥተናቸዋል።";
      alert(notice);
      playSuccessChime();
    }
  };

  const startQuestionTimer = (seconds: number) => {
    clearInterval(examTimerRef.current);
    setTimeRemaining(seconds);
    examTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(examTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswerRevealed) return; // Answer locked

    setUserSelections(prev => ({ ...prev, [activeQIndex]: option }));
    setIsAnswerRevealed(true);
    clearInterval(examTimerRef.current);

    const question = examQuestions[activeQIndex];
    if (option === question.correctAnswer) {
      playSuccessChime();
      triggerDopaminePop();
    } else {
      playFailureChime();
    }
    onStudyAction?.();
  };

  const handleNextQuestion = () => {
    playClickChime();
    setIsAnswerRevealed(false);
    
    if (activeQIndex < examQuestions.length - 1) {
      setActiveQIndex(activeQIndex + 1);
      const seconds = 60;
      startQuestionTimer(seconds);
    } else {
      calculateExamResults();
    }
  };

  const calculateExamResults = () => {
    let score = 0;
    examQuestions.forEach((q, idx) => {
      const selected = userSelections[idx];
      if (selected === q.correctAnswer) {
        score++;
      }
    });

    const percent = Math.round((score / examQuestions.length) * 100);
    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (percent >= 85) grade = 'A';
    else if (percent >= 70) grade = 'B';
    else if (percent >= 55) grade = 'C';
    else if (percent >= 40) grade = 'D';

    setExamScore(score);
    setExamGrade(grade);
    setExamMode('results');

    // Save logs to history
    const newSession = {
      id: `session_${Date.now()}`,
      subject: selectedSubject,
      date: new Date().toLocaleDateString(),
      score: percent,
      grade
    };

    setCurrentSessionId(newSession.id);

    const updatedSessions = [newSession, ...pastSessions].slice(0, 15);
    setPastSessions(updatedSessions);
    safeStorage.setItem("ethiolearn_exam_sessions_history", JSON.stringify(updatedSessions));

    // Save last score for Dashboard "Continue where left off" helper
    safeStorage.setItem('ethiolearn_last_subject', selectedSubject);
    safeStorage.setItem('ethiolearn_last_quiz_score', percent.toString());

    // Update global diagnostics metrics
    try {
      const analytics = JSON.parse(safeStorage.getItem("ethiolearn_analytics") || "{}");
      analytics.examsDone = (analytics.examsDone || 0) + 1;
      analytics.examHistory = analytics.examHistory || [];
      analytics.examHistory.push({
        date: new Date().toLocaleDateString(),
        score: percent
      });
      safeStorage.setItem("ethiolearn_analytics", JSON.stringify(analytics));
    } catch(e) {}

    playSuccessChime();
    triggerDopaminePop();
  };

  // AI 5-Minute summaries
  const runRevisionAI = async () => {
    if (!revisionTopic.trim()) return;
    setIsSummarizing(true);
    setRevisionOutput('');
    playClickChime();

    try {
      const sysPr = "You are a concise academic summary annotator. Summarize requested concepts into five bullet points using simple formatting, highlighting memory tricks.";
      const messages: ChatMessage[] = [{ role: 'user', content: `Summarize the topic: "${revisionTopic}" under the subject "${selectedSubject}" in a 5-minute revision card.` }];

      await submitClaudeChat(messages, sysPr, apiKey, {
        onChunk: (chunk) => {
          setRevisionOutput(prev => prev + chunk);
        },
        onComplete: (full) => {
          setIsSummarizing(false);
          setRevisionOutput(full);
          playSuccessChime();
        },
        onError: (err) => {
          setIsSummarizing(false);
          setRevisionOutput(
            language === 'en'
              ? `Revision formulation failed: ${err}`
              : `ማጠቃለያውን ማውጣት አልተቻለም፡ ${err}`
          );
          playFailureChime();
        }
      });
    } catch (err: any) {
      setIsSummarizing(false);
      setRevisionOutput(`Error: ${err}`);
      playFailureChime();
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* SETUP SCREEN */}
        {examMode === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Form configuration panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    {language === 'en' ? 'Start a Quiz' : 'ፈተና ጀምር'}
                  </h3>
                </div>
              </div>

              {/* Subject dropdown */}
              <div className="space-y-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <label>{language === 'en' ? 'Subject / ኮርስ' : 'የትምህርት አይነት'}</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-sans font-semibold rounded-xl py-3 px-3.5 outline-none cursor-pointer focus:border-emerald-600"
                >
                  {allSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Question count options */}
              <div className="space-y-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <label>{language === 'en' ? 'Length / ብዛት' : 'የጥያቄዎች ብዛት'}</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {[5, 10, 20].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => { setQCount(count); playClickChime(); }}
                      className={`py-2 text-xs font-bold rounded-lg cursor-pointer ${
                        qCount === count ? 'bg-[#078930] text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {count} {language === 'en' ? 'Qns' : 'ጥያቄ'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty level selection */}
              <div className="space-y-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <label>{language === 'en' ? 'Difficulty / ደረጃ' : 'የክብደት ደረጃ'}</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => { setDifficulty(diff); playClickChime(); }}
                      className={`py-2 text-xs font-bold rounded-lg cursor-pointer capitalize ${
                        difficulty === diff ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {language === 'en' ? diff : (diff === 'easy' ? 'ቀላል' : diff === 'medium' ? 'መካከለኛ' : 'ከባድ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom needs or specific target area */}
              <div className="space-y-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <label>{language === 'en' ? 'Specific Request / Custom Needs' : 'የተለየ ጥያቄ / የትኩረት ቦታ'}</label>
                <textarea
                  value={customNeeds}
                  onChange={(e) => setCustomNeeds(e.target.value)}
                  placeholder={language === 'en' ? 'e.g., focus on C++ pointers, conceptual questions, Amharic-English mixed explanations, etc.' : 'ምሳሌ፦ ማብራሪያው በአማርኛ ይሁን፣ በአብዛኛው ጽንሰ-ሀሳቦች ላይ ያተኩር...'}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-sans text-xs font-semibold rounded-xl py-2 px-3 outline-none focus:border-emerald-600 resize-none placeholder-slate-400 normal-case"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 space-y-3">
                <button
                  onClick={handleGenerateMockAI}
                  className="w-full h-12 min-h-[48px] bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-serif font-extrabold tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  {language === 'en' ? 'Formulate Quiz with AI' : 'በአይ ፈተና አዘጋጅ'}
                </button>

                <button
                  onClick={handleStartPastExam}
                  className="w-full h-12 min-h-[48px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-serif font-extrabold tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  {language === 'en' ? 'Start Classic Paper' : 'የተለመዱ የድሮ ፈተናዎች'}
                </button>
              </div>

              {loadingText && (
                <div className="p-3 bg-emerald-55/30 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-800 font-bold animate-pulse">
                  {loadingText}
                </div>
              )}
            </div>

            {/* AI Revision helper cards */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Zap className="w-5 h-5 text-amber-500 animate-bounce" />
                <h3 className="font-serif font-bold text-base text-slate-900">
                  {language === 'en' ? '5-Min Topic Summary' : 'ፈጣን ማጠቃለያ'}
                </h3>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {language === 'en' ? 'Enter any topic and get immediate bullet notes to review before exams!' : 'ያልገባዎትን ርዕስ እዚህ ይጻፉና በአጭር ነጥቦች ተዘጋጅቶ ይከልሱት!'}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Mitochondria, GDP, FDRE..."
                    value={revisionTopic}
                    onChange={(e) => setRevisionTopic(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 outline-none"
                  />
                  <button
                    onClick={runRevisionAI}
                    disabled={isSummarizing || !revisionTopic.trim()}
                    className="h-10 px-4 bg-[#078930] hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSummarizing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {revisionOutput ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line text-slate-700 font-sans">
                  {revisionOutput}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 font-serif">
                  {language === 'en' ? 'Notes outcome will compile here...' : 'የተዘጋጀው ማጠቃለያ እዚህ ላይ ይወጣል...'}
                </div>
              )}
            </div>

            {/* Score logs list */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-serif font-bold text-base text-[#078930]">
                    {language === 'en' ? 'Performance Logs' : 'የውጤት መዝገብ'}
                  </h3>
                </div>
                {pastSessions.length > 0 && (
                  <button
                    onClick={() => {
                      playClickChime();
                      setShowFavoriteSessionsOnly(!showFavoriteSessionsOnly);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                      showFavoriteSessionsOnly 
                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${showFavoriteSessionsOnly ? 'fill-white text-white' : ''}`} />
                    {language === 'en' ? 'Best Only' : 'ምርጦቹ ብቻ'}
                    {favoriteSessionIds.length > 0 && ` (${favoriteSessionIds.length})`}
                  </button>
                )}
              </div>

              {(() => {
                const displayedSessions = pastSessions.filter(sess => {
                  if (!showFavoriteSessionsOnly) return true;
                  const sessId = sess.id || `session_${sess.subject}_${sess.date}_${sess.score}`;
                  return favoriteSessionIds.includes(sessId);
                });

                if (displayedSessions.length === 0) {
                  return (
                    <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 font-serif">
                      {showFavoriteSessionsOnly 
                        ? (language === 'en' ? 'No favorited exam logs yet.' : 'ምርጥ ተብለው የተመረጡ ፈተናዎች የሉም።')
                        : (language === 'en' ? 'Your test grades history is currently empty' : 'የወሰዷቸው ፈተናዎች ውጤት እዚህ ሙሉ ታሪክ ሆኖ ይቀመጣል')}
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {displayedSessions.map((sess, idx) => {
                      const sessId = sess.id || `session_${sess.subject}_${sess.date}_${sess.score}`;
                      const isFav = favoriteSessionIds.includes(sessId);
                      return (
                        <div key={sessId} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => toggleFavoriteSession(sessId)}
                              className="p-1 hover:bg-slate-200/60 rounded text-slate-400 hover:text-amber-500 transition-colors shrink-0"
                              title={language === 'en' ? 'Toggle Favorite' : 'ምርጥ ምርጫ'}
                            >
                              <Star className={`w-3.5 h-3.5 transition-all ${isFav ? 'fill-amber-400 text-amber-500 scale-110' : ''}`} />
                            </button>
                            <div>
                              <span className="font-bold text-slate-800 block leading-tight">{sess.subject}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">{sess.date}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-extrabold text-sm text-emerald-600 block">{sess.score}%</span>
                            <span className="block text-[10px] font-black uppercase text-amber-600">Grade {sess.grade}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* ACTIVE EXAM RUNNING SCREEN */}
        {examMode === 'active' && examQuestions.length > 0 && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-5"
          >
            {/* Visual Progress Bar (Requirement) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase font-mono">
                <span>{selectedSubject}</span>
                <span className="text-emerald-700">
                  {language === 'en' 
                    ? `Question ${activeQIndex + 1} of ${examQuestions.length}`
                    : `ጥያቄ ${activeQIndex + 1} ከ ${examQuestions.length}`}
                </span>
              </div>
              
              {/* Actual HTML progress percentage indicators bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-[#078930] h-full rounded-full transition-all duration-300" 
                  style={{ width: `${((activeQIndex + 0.5) / examQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Timer card block */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-xs font-semibold text-slate-500">
                {language === 'en' ? 'Choose carefully to get feedback' : 'መልካም ፈተና ይሁንልዎት!'}
              </span>
              <span className="flex items-center gap-1 text-xs font-extrabold font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 select-none">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {timeRemaining} Seconds
              </span>
            </div>

            {/* Question Text block */}
            <div className="space-y-5 py-2">
              <h3 className="font-serif text-lg text-slate-900 font-extrabold leading-relaxed">
                {examQuestions[activeQIndex]?.question}
              </h3>

              {/* LARGE BUTTONS lists selecting - h-14 min-h-[48px], responsive (Requirement) */}
              <div className="grid grid-cols-1 gap-2.5">
                {examQuestions[activeQIndex]?.options.map((opt: string) => {
                  const isSelected = userSelections[activeQIndex] === opt;
                  const isCorrect = examQuestions[activeQIndex].correctAnswer === opt;
                  
                  let btnColorStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300";
                  
                  // Instant feedback coloring rule (Green for Correct, Red for Incorrect)
                  if (isAnswerRevealed) {
                    if (isCorrect) {
                      btnColorStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-extrabold ring-1 ring-emerald-500";
                    } else if (isSelected) {
                      btnColorStyle = "bg-red-50 border-red-500 text-red-800 font-extrabold ring-1 ring-red-500";
                    } else {
                      btnColorStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                    }
                  } else if (isSelected) {
                    btnColorStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold";
                  }

                  return (
                    <button
                      key={opt}
                      disabled={isAnswerRevealed}
                      onClick={() => handleOptionSelect(opt)}
                      className={`w-full min-h-[48px] h-14 px-4 rounded-xl text-left text-sm leading-snug font-sans transition-all flex items-center justify-between border-2 shadow-sm cursor-pointer select-none ${btnColorStyle}`}
                    >
                      <span>{opt}</span>
                      {isAnswerRevealed && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />}
                      {isAnswerRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation card dynamically revealed below options if answered (Requirement) */}
            {isAnswerRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-2 text-xs text-slate-600 space-y-1.5"
              >
                <div className="flex items-center gap-1.5 font-extrabold text-slate-800 uppercase tracking-wide">
                  {userSelections[activeQIndex] === examQuestions[activeQIndex].correctAnswer ? (
                    <span className="text-[#078930] flex items-center gap-1">🌟 {language === 'en' ? 'Excellent! Correct' : 'በጣም ጎበዝ! መልስዎ ትክክል ነው'}</span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">✨ {language === 'en' ? 'Incorrect' : 'ትክክለኛው መልስ አልነበረም'}</span>
                  )}
                </div>
                <p className="font-sans leading-normal font-medium italic">
                  {examQuestions[activeQIndex]?.explanation || (language === 'en' ? 'Review your subject textbooks.' : 'በመማሪያ መጽሐፉ ላይ ያሉትን ማብራሪያዎች ያንብቡ።')}
                </p>
              </motion.div>
            )}

            {/* Bottom Proceed bar */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={handleNextQuestion}
                disabled={!userSelections[activeQIndex]}
                className="w-full sm:w-auto h-12 px-6 bg-[#078930] hover:bg-emerald-700 text-white font-serif font-extrabold text-sm rounded-xl flex items-center justify-center gap-1.5 shadow disabled:opacity-40 cursor-pointer select-none active:scale-98"
              >
                <span>
                  {activeQIndex === examQuestions.length - 1 
                    ? (language === 'en' ? 'Complete quiz ' : 'ውጤት ይመልከቱ ') 
                    : (language === 'en' ? 'Next Question ' : 'ቀጣይ ጥያቄ ')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* RESULTS CELEBRATORY SCREEN */}
        {examMode === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-6 relative overflow-hidden shadow-lg"
          >
            {/* Dopamine confetti floating particles */}
            {particles.map(p => (
              <div 
                key={p.id}
                className="absolute pointer-events-none rounded-full particle-reward-rise z-50"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  backgroundColor: p.color,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animationDuration: `${p.duration}s`
                }}
              />
            ))}

            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-100 text-[#078930] rounded-full flex items-center justify-center mx-auto text-3xl font-serif font-black shadow-inner">
              {examGrade}
            </div>

            <div className="space-y-1.5">
              <h2 className="font-serif text-2xl font-black text-slate-900 leading-tight">
                {language === 'en' ? 'Quiz Session Finalized!' : 'የፈተና ጊዜ ተጠናቋል!'}
              </h2>
              
              {/* Amharic Encouragement Custom block based on score rules (Requirement) */}
              <p className="text-lg font-serif font-bold text-[#078930]">
                {Math.round((examScore / examQuestions.length) * 100) >= 80 ? (
                  <span>ጎበዝ! ምርጥ ስራ ነው 🌟 <span className="block text-xs font-sans text-slate-400 mt-1">Excellent! Keep up this high standard!</span></span>
                ) : Math.round((examScore / examQuestions.length) * 100) >= 50 ? (
                  <span>በጣም ጥሩ! በርታ/በርቺ 💪 <span className="block text-xs font-sans text-slate-400 mt-1">Great job! Keep trying and advancing!</span></span>
                ) : (
                  <span>ተስፋ አትቁረጥ! ይቻላል ✨ <span className="block text-xs font-sans text-slate-400 mt-1">Never give up under hard steps!</span></span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-xs bg-slate-50 p-4 border border-slate-200 rounded-xl shadow-inner">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase">{language === 'en' ? 'Score' : 'ውጤት'}</span>
                <span className="font-mono text-base font-extrabold text-slate-800 block">{examScore} / {examQuestions.length}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase">{language === 'en' ? 'Percentage' : 'በመቶኛ'}</span>
                <span className="font-mono text-base font-extrabold text-[#078930] block">
                  {Math.round((examScore / examQuestions.length) * 100)}%
                </span>
              </div>
            </div>

            {/* Detailed answers logging recap */}
            <div className="text-left bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs max-h-56 overflow-y-auto">
              <p className="font-bold text-slate-700 pb-1.5 border-b border-slate-200 font-serif">
                {language === 'en' ? 'Questions Recap' : 'ለጥያቄዎች የተሰጡ መልሶች፡'}
              </p>
              {examQuestions.map((q, idx) => {
                const isCorrect = userSelections[idx] === q.correctAnswer;
                return (
                  <div key={idx} className="pb-2 border-b border-slate-100 last:border-none last:pb-0 font-sans">
                    <p className="font-medium text-slate-800 flex items-start gap-1">
                      <span className={isCorrect ? "text-[#078930] font-black" : "text-red-500 font-black"}>
                        {isCorrect ? "✓" : "✗"}
                      </span>
                      <span>
                        {language === 'en' ? 'Qns' : 'ጥያቄ'} {idx + 1}: {q.question}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>

            {currentSessionId && (
              <button
                onClick={() => toggleFavoriteSession(currentSessionId)}
                className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border ${
                  favoriteSessionIds.includes(currentSessionId)
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm hover:bg-amber-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star className={`w-4 h-4 ${favoriteSessionIds.includes(currentSessionId) ? 'fill-white text-white' : ''}`} />
                {favoriteSessionIds.includes(currentSessionId)
                  ? (language === 'en' ? 'Saved to Favorite Quizzes' : 'በምርጥ ፈተናዎች ስር ተቀምጧል')
                  : (language === 'en' ? 'Save to Favorite Quizzes' : 'ይህንን ምርጥ ፈተና አስቀምጥ')}
              </button>
            )}

            <button
              onClick={() => { playClickChime(); setExamMode('setup'); }}
              className="w-full h-12 bg-[#078930] hover:bg-emerald-700 text-white font-serif font-extrabold text-sm rounded-xl cursor-pointer"
            >
              {language === 'en' ? 'Practice Another Quiz' : 'ሌላ የፈተና ጥያቄ ውሰድ'}
            </button>
          </motion.div>
        )}

        {showAddExamModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowAddExamModal(false)}
            id="add-custom-exam-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative text-left border border-slate-200"
              onClick={(e) => e.stopPropagation()}
              id="add-custom-exam-modal-card"
            >
              <button
                onClick={() => { playClickChime(); setShowAddExamModal(false); }}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5">
                <h3 className="font-serif font-black text-lg text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#078930]" />
                  {language === 'en' ? 'Add Exam Question / Subject' : 'የፈተና ጥያቄ / የትምህርት አይነት ጨምር'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en' 
                    ? 'Create your own multiple choice exam questions. They will be added to your custom quiz selection instantly.' 
                    : 'የራስዎን የፈተና ጥያቄዎች ያዘጋጁ። ወዲያውኑ ወደ የጥያቄዎች ማውጫዎ ውስጥ ይካተታሉ።'}
                </p>
              </div>

              <form onSubmit={handleAddCustomQuestion} className="space-y-3 text-xs text-slate-700">
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-500">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={newExamSubject}
                    onChange={(e) => setNewExamSubject(e.target.value)}
                    placeholder="e.g. Freshman Civics, Chemistry Unit 3"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 outline-none focus:ring-1 focus:ring-[#078930]"
                  />
                  <p className="text-[10px] text-slate-400">
                    Use an existing subject name to add a question to it, or type a new one to create a brand-new exam category.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-500">Question Text *</label>
                  <textarea
                    required
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="What is the constitutional status of Ethiopia's regional states?"
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 outline-none focus:ring-1 focus:ring-[#078930] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-500">Option A *</label>
                    <input
                      type="text"
                      required
                      value={newOptionA}
                      onChange={(e) => setNewOptionA(e.target.value)}
                      placeholder="Choice A"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 outline-none focus:ring-1 focus:ring-[#078930]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-500">Option B *</label>
                    <input
                      type="text"
                      required
                      value={newOptionB}
                      onChange={(e) => setNewOptionB(e.target.value)}
                      placeholder="Choice B"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 outline-none focus:ring-1 focus:ring-[#078930]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-500">Option C *</label>
                    <input
                      type="text"
                      required
                      value={newOptionC}
                      onChange={(e) => setNewOptionC(e.target.value)}
                      placeholder="Choice C"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 outline-none focus:ring-1 focus:ring-[#078930]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-500">Option D *</label>
                    <input
                      type="text"
                      required
                      value={newOptionD}
                      onChange={(e) => setNewOptionD(e.target.value)}
                      placeholder="Choice D"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 outline-none focus:ring-1 focus:ring-[#078930]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="block font-bold uppercase text-slate-500">Correct Option Choice *</label>
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setNewCorrectOption(opt); playClickChime(); }}
                          className={`py-2 text-xs font-bold rounded-lg cursor-pointer ${
                            newCorrectOption === opt ? 'bg-[#078930] text-white shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          Option {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold uppercase text-slate-500">Explanation (Optional Detail)</label>
                  <input
                    type="text"
                    value={newExplanation}
                    onChange={(e) => setNewExplanation(e.target.value)}
                    placeholder="Provide context explaining why this selection is correct..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 outline-none focus:ring-1 focus:ring-[#078930]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { playClickChime(); setShowAddExamModal(false); }}
                    className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#078930] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Save Exam Question
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
