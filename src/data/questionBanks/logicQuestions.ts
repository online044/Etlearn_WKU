import { AuthenticCurriculumQuestion } from './mathQuestions';

export const AUTHENTIC_LOGIC_QUESTIONS_AAU_1011: AuthenticCurriculumQuestion[] = [
  // ─── UNIT 1: LOGIC, ARGUMENTS & CRITICAL THINKING ───
  {
    questionText: "Which of the following passages constitutes a genuine argument (rather than an explanation, report, or conditional statement)?",
    options: [
      "Since all mammals possess lungs, and all whales are mammals, it necessarily follows that all whales possess lungs.",
      "The price of teff increased in Addis Ababa because prolonged drought reduced harvest yields in East Shewa.",
      "If you study diligently for the university exit exam, then you will achieve a passing grade.",
      "Yesterday, the Ministry of Education announced new accreditation guidelines for private colleges."
    ],
    correctIndex: 0,
    topic: "Identifying Arguments vs Explanations",
    unit: "Unit 1",
    chapter: "Chapter 1: Nature of Logic & Arguments",
    difficulty: "easy",
    explanation: "An argument consists of premises offering evidence to support a claimed conclusion. Option A explicitly advances two premises linked by 'since' to deduce a conclusion ('it follows that'). Option B is an explanation of an already accepted fact, Option C is a conditional, and Option D is a report.",
    amharicExplanation: "ክርክር (Argument) መረጃዎችን (Premises) በማቅረብ ድምዳሜ ላይ የሚደርስ ነው። ምርጫ 'A' 'Since' እና 'it follows that' በመጠቀም ድምዳሜ ላይ ስለሚደርስ ትክክለኛ ክርክር ነው።"
  },
  {
    questionText: "What are the two mandatory criteria required for a deductive argument to be classified as 'sound'?",
    options: [
      "The argument must be deductively valid, AND all of its premises must be factually true in reality.",
      "The conclusion must be emotionally persuasive, and the speaker must be a recognized authority.",
      "The premises must make the conclusion probable, and no counterexamples exist.",
      "The argument must contain exactly three premises and two categorical terms."
    ],
    correctIndex: 0,
    topic: "Deductive Validity vs Soundness",
    unit: "Unit 1",
    chapter: "Chapter 1: Validity & Soundness",
    difficulty: "easy",
    explanation: "Soundness is a two-fold requirement for deductive arguments: (1) structural validity (if premises were true, conclusion cannot be false) and (2) factual truth (every single premise is actually true in the real world).",
    amharicExplanation: "አንድ የዲዳክቲቭ ክርክር ሳውንድ (Sound) የሚባለው፡ 1ኛ ቅርጹ ትክክል (Valid) ሲሆን እና 2ኛ ሁሉም መነሻ ሃሳቦቹ በእውነታው ዓለም እውነት (True) ሲሆኑ ብቻ ነው።"
  },

  // ─── UNIT 2: INFORMAL FALLACIES ───
  {
    questionText: "Identify the informal fallacy committed in this passage:\n'You should not accept Dr. Kebede's economic proposal for combating inflation. After all, he drives a foreign luxury car and was seen dining at an expensive resort last weekend!'",
    options: [
      "Argumentum ad Hominem (Abusive / Personal Attack)",
      "Straw Man fallacy",
      "Appeal to Ignorance (Ad Ignorantiam)",
      "Fallacy of Composition"
    ],
    correctIndex: 0,
    topic: "Fallacies of Relevance: Ad Hominem",
    unit: "Unit 2",
    chapter: "Chapter 1: Fallacies of Relevance",
    difficulty: "easy",
    explanation: "The arguer attacks Dr. Kebede's personal wealth and lifestyle instead of addressing the merits or flaws of his economic proposal. This is a classic Argumentum ad Hominem (abusive).",
    amharicExplanation: "የቀረበውን የኢኮኖሚ ሃሳብ ከመመርመር ይልቅ የዶ/ር ከበደን የግል ኑሮና መኪና በመተቸት ሃሳቡን ውድቅ ማድረግ አድ ሆሚነም (Ad Hominem) ስህተት ነው።"
  },
  {
    questionText: "Identify the fallacy committed:\n'No scientist has ever produced definitive empirical proof that extraterrestrial civilizations do not exist. Therefore, intelligent extraterrestrial life undoubtedly exists in our galaxy.'",
    options: [
      "Appeal to Ignorance (Argumentum ad Ignorantiam)",
      "Slippery Slope fallacy",
      "Begging the Question (Petitio Principii)",
      "False Cause (Post Hoc)"
    ],
    correctIndex: 0,
    topic: "Appeal to Ignorance",
    unit: "Unit 2",
    chapter: "Chapter 1: Fallacies of Weak Induction",
    difficulty: "medium",
    explanation: "Appeal to Ignorance occurs when an arguer asserts that a claim is true simply because it has not yet been proven false (or vice-versa), confusing lack of evidence with proof of the opposite.",
    amharicExplanation: "አንድ ነገር ሐሰት መሆኑ ስላልተረጋገጠ ብቻ እውነት ነው ብሎ መደምደም አፒል ቱ ኢግኖራንስ (Appeal to Ignorance) ይባላል።"
  },
  {
    questionText: "Identify the fallacy:\n'Either you spend every waking hour studying university textbooks or you will fail in life and become completely destitute. Since you don't want to become destitute, you must spend every waking hour studying.'",
    options: [
      "False Dichotomy (False Dilemma)",
      "Equivocation",
      "Red Herring",
      "Complex Question"
    ],
    correctIndex: 0,
    topic: "Fallacy of False Dilemma",
    unit: "Unit 2",
    chapter: "Chapter 2: Fallacies of Presumption",
    difficulty: "easy",
    explanation: "False Dichotomy presents two extreme alternatives as the only choices, artificially ignoring the many realistic intermediate options (such as balanced study with rest).",
    amharicExplanation: "ሌሎች ምክንያታዊ አማራጮች እያሉ ሁለት ጽንፍ የያዙ ምርጫዎችን ብቻ በማቅረብ የሚያስገድድ ፎልስ ዳይኮቶሚ (False Dilemma) ነው።"
  },
  {
    questionText: "Identify the fallacy:\n'Every individual brick used to construct the Wolkite University library is light in weight. Therefore, the entire university library building is light in weight.'",
    options: [
      "Fallacy of Composition",
      "Fallacy of Division",
      "Hasty Generalization",
      "Suppressed Evidence"
    ],
    correctIndex: 0,
    topic: "Fallacy of Composition vs Division",
    unit: "Unit 2",
    chapter: "Chapter 2: Grammatical Analogy",
    difficulty: "medium",
    explanation: "Fallacy of Composition erroneously attributes a characteristic of individual parts (light weight of single bricks) to the whole entity (the massive aggregate building).",
    amharicExplanation: "የእያንዳንዱ ጡብ ቀላል መሆን የሙሉውን ህንጻ ቀላልነት ያረጋግጣል ብሎ መደምደም ኮምፖዚሽን (Composition) ይባላል።"
  },

  // ─── UNIT 3: CATEGORICAL PROPOSITIONS & DISTRIBUTION ───
  {
    questionText: "In standard categorical logic, which terms are distributed in an E-type proposition ('No S are P')?",
    options: [
      "Both the Subject term (S) and the Predicate term (P)",
      "Only the Subject term (S)",
      "Only the Predicate term (P)",
      "Neither the Subject nor the Predicate term"
    ],
    correctIndex: 0,
    topic: "Categorical Propositions & Term Distribution",
    unit: "Unit 3",
    chapter: "Chapter 1: Categorical Propositions",
    difficulty: "medium",
    explanation: "In 'No S are P' (Universal Negative), the proposition makes an assertion about all members of S (they are wholly excluded from P) and all members of P (wholly excluded from S). Thus both S and P are distributed.",
    amharicExplanation: "በ 'No S are P' (ሁለንተናዊ አሉታ) ውስጥ ሰብጀክቱም (S) ፕሪዲኬቱም (P) ሁለቱም ሙሉ በሙሉ የተካተቱ (Distributed) ናቸው።"
  },
  {
    questionText: "According to the Traditional (Aristotelian) Square of Opposition, if an A-proposition ('All freshmen are students') is True, what is the truth value of its Contrary (E-proposition: 'No freshmen are students')?",
    options: [
      "Strictly False",
      "Strictly True",
      "Undetermined",
      "Contingently True"
    ],
    correctIndex: 0,
    topic: "Traditional Square of Opposition: Contraries",
    unit: "Unit 3",
    chapter: "Chapter 2: Square of Opposition",
    difficulty: "easy",
    explanation: "Contrary statements (A and E) cannot both be true simultaneously. If one is true, the other must be strictly false (though both may be false together).",
    amharicExplanation: "በኮንትራሪ (Contrary) ሕግ መሠረት ሁለቱም በአንድ ጊዜ እውነት ሊሆኑ አይችሉም። ስለዚህ A እውነት ከሆነ E የግድ ሐሰት (False) ይሆናል።"
  },
  {
    questionText: "What is the valid Obversion of the O-proposition: 'Some university students are not residents'?",
    options: [
      "Some university students are non-residents",
      "Some residents are not university students",
      "No university students are residents",
      "All university students are residents"
    ],
    correctIndex: 0,
    topic: "Immediate Inferences: Obversion",
    unit: "Unit 3",
    chapter: "Chapter 2: Immediate Inferences",
    difficulty: "medium",
    explanation: "Obversion involves two steps: (1) change the quality from negative to affirmative ('Some ... are not' becomes 'Some ... are'), and (2) replace the predicate term with its complement ('residents' becomes 'non-residents'). Result: 'Some university students are non-residents'.",
    amharicExplanation: "በኦብቨርዥን (Obversion) ጊዜ ጥራቱ ይቀየራል (አሉታው ወደ አዎንታ) እና ፕሪዲኬቱ ተቃራኒ ይሆናል፡ 'Some students are non-residents'።"
  },

  // ─── UNIT 4: CATEGORICAL SYLLOGISMS & RULES ───
  {
    questionText: "Consider the syllogism:\nMajor Premise: All mammals are animals.\nMinor Premise: All reptiles are animals.\nConclusion: Therefore, all reptiles are mammals.\nWhich syllogistic rule is violated?",
    options: [
      "Fallacy of Undistributed Middle (the middle term 'animals' is undistributed in both premises)",
      "Fallacy of Illicit Major",
      "Fallacy of Exclusive Premises",
      "Fallacy of Illicit Minor"
    ],
    correctIndex: 0,
    topic: "Syllogistic Rules: Undistributed Middle",
    unit: "Unit 4",
    chapter: "Chapter 1: Syllogism Validity",
    difficulty: "medium",
    explanation: "The middle term is 'animals'. In both premises ('All M are A' and 'All R are A'), 'animals' appears as the predicate of an A-proposition, which is undistributed. Since it is never distributed, the Fallacy of Undistributed Middle is committed.",
    amharicExplanation: "የመካከለኛው ቃል 'animals' በሁለቱም መነሻዎች ላይ ስላልተዳረሰ (Undistributed Middle) ክርክሩ ውድቅ ይሆናል።"
  },
  {
    questionText: "What is the Mood and Figure of the following standard-form syllogism?\nNo birds are mammals. (E)\nAll penguins are birds. (A)\nTherefore, no penguins are mammals. (E)",
    options: [
      "EAE - 1 (Figure 1: Celarent)",
      "EAE - 2",
      "AEE - 1",
      "EAA - 3"
    ],
    correctIndex: 0,
    topic: "Mood and Figure of Syllogisms",
    unit: "Unit 4",
    chapter: "Chapter 1: Standard Form Syllogisms",
    difficulty: "medium",
    explanation: "The types of the premises are E, A, and the conclusion is E (Mood: EAE). The middle term 'birds' is the subject of the major premise and predicate of the minor premise, which defines Figure 1. This valid form is known classically as Celarent.",
    amharicExplanation: "የመግለጫዎቹ አይነት E, A, E ሲሆን መካከለኛው ቃል 'birds' በፊገር 1 አቀማመጥ ላይ ይገኛል (EAE-1 ወይም Celarent)።"
  },
  {
    questionText: "Which valid rule of inference is instantiated by the following propositional argument?\n1. If inflation accelerates, the National Bank increases interest rates.\n2. The National Bank did not increase interest rates.\nTherefore, inflation did not accelerate.",
    options: [
      "Modus Tollens (Denying the Consequent)",
      "Modus Ponens (Affirming the Antecedent)",
      "Disjunctive Syllogism",
      "Hypothetical Syllogism"
    ],
    correctIndex: 0,
    topic: "Propositional Logic & Rules of Inference",
    unit: "Unit 5",
    chapter: "Chapter 1: Propositional Logic",
    difficulty: "easy",
    explanation: "Modus Tollens follows the logical form: (p → q), ¬q, therefore ¬p. Denying the consequent correctly guarantees the negation of the antecedent in classical deductive logic.",
    amharicExplanation: "ሞደስ ቶለንስ (Modus Tollens)፦ p → q, ~q, ስለዚህ ~p የሚለውን ቀመር የሚከተል ትክክለኛ የዲዳክቲቭ ክርክር ዓይነት ነው።"
  },
  {
    questionText: "An arguer reasons: 'Every single brick in this newly constructed Wolkite University library is lightweight. Therefore, the entire library building itself is lightweight.' Which informal fallacy is committed?",
    options: [
      "Fallacy of Composition",
      "Fallacy of Division",
      "Fallacy of Accident",
      "Hasty Generalization"
    ],
    correctIndex: 0,
    topic: "Fallacies of Grammatical Analogy: Composition",
    unit: "Unit 2",
    chapter: "Chapter 2: Fallacies of Analogy",
    difficulty: "medium",
    explanation: "The fallacy of composition occurs when an attribute of the individual parts is mistakenly transferred to the whole entity. Lightweight bricks together produce a heavy building.",
    amharicExplanation: "የአንድ ነገር ክፍሎች (Parts) ያላቸውን ባህሪ ለሙሉ አካሉ (Whole) መስጠት የኮምፖዚሽን (Fallacy of Composition) ስህተት ይባላል።"
  },
  {
    questionText: "What distinguishes an inductive argument from a deductive argument according to Ethiopian university critical thinking curricula?",
    options: [
      "Inductive arguments claim probability rather than strict logical necessity for their conclusions",
      "Inductive arguments are always invalid under all circumstances",
      "Deductive arguments can never have false premises",
      "Inductive reasoning only proceeds from general laws to specific instances"
    ],
    correctIndex: 0,
    topic: "Deductive vs Inductive Logic",
    unit: "Unit 1",
    chapter: "Chapter 1: Nature of Logic & Arguments",
    difficulty: "easy",
    explanation: "Deductive arguments claim that if the premises are true, it is impossible for the conclusion to be false (strict necessity). Inductive arguments claim only that if premises are true, the conclusion is probable (strength/cogency).",
    amharicExplanation: "የኢንዳክቲቭ ክርክር ዋና መለያው ድምዳሜው የመሆን እድል (Probability) እንጂ የግድ መሆን (Strict necessity) የሌለው መሆኑ ነው።"
  },
  {
    questionText: "In testing categorical syllogisms via Venn diagrams, when shading an E-proposition ('No S are P'), which region of the two overlapping circles is shaded?",
    options: [
      "The lens-shaped overlap (intersection) between circle S and circle P",
      "The crescent region of circle S outside circle P",
      "The crescent region of circle P outside circle S",
      "The entire universe of discourse outside both circles"
    ],
    correctIndex: 0,
    topic: "Venn Diagram Techniques for Syllogisms",
    unit: "Unit 4",
    chapter: "Chapter 2: Venn Diagrams for Syllogisms",
    difficulty: "medium",
    explanation: "An E-proposition asserts that the intersection S ∩ P is completely empty. In standard Venn diagramming, empty regions are indicated by shading, so the overlapping intersection is shaded.",
    amharicExplanation: "በቬን ዲያግራም E-proposition (No S are P) ሲገለጽ በሁለቱ ክበቦች መገናኛ (Intersection) ላይ ጥላ በማድረግ ክፍት መሆኑ ይገለጻል።"
  }
];

