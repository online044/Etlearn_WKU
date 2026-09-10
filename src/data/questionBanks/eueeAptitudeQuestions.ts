import { AuthenticCurriculumQuestion } from './mathQuestions';

export const AUTHENTIC_APTITUDE_QUESTIONS_EUEE_2016: AuthenticCurriculumQuestion[] = [
  // ─── VERBAL REASONING & ANALOGIES ───
  {
    questionText: "Choose the pair of words that best expresses a relationship similar to that expressed in the capitalized pair:\n\nTELESCOPE : ASTRONOMER ::",
    options: [
      "Microscope : Biologist",
      "Palette : Canvas",
      "Stethoscope : Patient",
      "Thermometer : Temperature"
    ],
    correctIndex: 0,
    topic: "Verbal Reasoning: Tool to Practitioner",
    unit: "Unit 1",
    chapter: "Chapter 1: Verbal Analogies",
    difficulty: "easy",
    explanation: "A telescope is the primary scientific optical instrument utilized by an astronomer. Similarly, a microscope is the primary optical instrument utilized by a biologist. (A stethoscope is used BY a doctor, not by a patient).",
    amharicExplanation: "ቴሌስኮፕ የስነ-ፈለክ ተመራማሪ (አስትሮኖመር) ዋና መገልገያ መሳሪያ እንደሆነ ሁሉ፣ ማይክሮስኮፕም የባዮሎጂስት ዋና መገልገያ መሳሪያ ነው።"
  },
  {
    questionText: "Find the odd one out among the four choices based on semantic or categorical classification:",
    options: [
      "Kilimanjaro",
      "Ras Dashen",
      "Batu",
      "Guna"
    ],
    correctIndex: 0,
    topic: "Analytical Classification: Ethiopian Geography",
    unit: "Unit 1",
    chapter: "Chapter 1: Classification & Categorization",
    difficulty: "easy",
    explanation: "Ras Dashen (4550m), Mount Batu (4307m), and Mount Guna (4120m) are all prominent mountain peaks located within Ethiopia. Mount Kilimanjaro is located in Tanzania.",
    amharicExplanation: "ራስ ዳሽን፣ ባቱ እና ጉና በኢትዮጵያ ውስጥ የሚገኙ ተራሮች ሲሆኑ፤ ኪሊማንጃሮ ግን በታንዛኒያ የሚገኝ በመሆኑ የተለየ ነው።"
  },

  // ─── NUMERICAL & SPATIAL REASONING ───
  {
    questionText: "Determine the missing number in the sequence:\n\n3, 7, 15, 31, 63, ?",
    options: [
      "127",
      "126",
      "125",
      "128"
    ],
    correctIndex: 0,
    topic: "Numerical Sequences & Series",
    unit: "Unit 2",
    chapter: "Chapter 1: Number Patterns",
    difficulty: "medium",
    explanation: "The pattern follows: x_(n+1) = 2 * x_n + 1. (3*2+1=7; 7*2+1=15; 15*2+1=31; 31*2+1=63; 63*2+1 = 127). Alternatively, the differences are powers of 2: +4, +8, +16, +32, +64 ⟹ 63 + 64 = 127.",
    amharicExplanation: "ስርዓተ-ጥለቱ x × 2 + 1 ነው፡ 63 × 2 + 1 = 127 (ወይም ልዩነታቸው 4፣ 8፣ 16፣ 32፣ 64 ሲሆን 63 + 64 = 127)።"
  },
  {
    questionText: "A water tank in Wolkite can be filled by Pipe A alone in 6 hours and by Pipe B alone in 12 hours. If both pipes are opened simultaneously, how many hours will it take to fill the empty tank completely?",
    options: [
      "4 hours",
      "3 hours",
      "5 hours",
      "9 hours"
    ],
    correctIndex: 0,
    topic: "Quantitative Reasoning: Rate & Work Problems",
    unit: "Unit 2",
    chapter: "Chapter 2: Rates & Proportion",
    difficulty: "easy",
    explanation: "Combined rate = 1/6 + 1/12 = (2 + 1)/12 = 3/12 = 1/4 tank per hour. Total time = 1 / (1/4) = 4 hours.",
    amharicExplanation: "የሁለቱ ቱቦዎች አጠቃላይ ፍጥነት = 1/6 + 1/12 = 3/12 = 1/4። ስለዚህ ሙሉ በሙሉ ለመሙላት 4 ሰዓታት ይፈጃል።"
  },

  // ─── LOGICAL DEDUCTION & ANALYTICAL REASONING ───
  {
    questionText: "Statements:\n1. All engineers are problem solvers.\n2. Some problem solvers are innovators.\nWhich of the following conclusions can be logically and conclusively deduced without assumptions?",
    options: [
      "None of the above can be conclusively deduced",
      "All engineers are innovators",
      "Some engineers are innovators",
      "All innovators are engineers"
    ],
    correctIndex: 0,
    topic: "Syllogistic Deduction & Formal Logic",
    unit: "Unit 3",
    chapter: "Chapter 1: Deductive Reasoning",
    difficulty: "hard",
    explanation: "The set of innovators intersects the set of problem solvers, but there is no guaranteed overlap between engineers and innovators. Therefore, none of the specific affirmative relationships between engineers and innovators can be definitively deduced.",
    amharicExplanation: "ኢንጂነሮች ችግር ፈቺዎች ቢሆኑም፣ ፈጣሪዎች የሆኑት ችግር ፈቺዎች ኢንጂነር መሆናቸው ስላልተገለጸ አንዳቸውም በእርግጠኝነት አይከተሉም።"
  },
  {
    questionText: "If 15 workers can construct an irrigation canal in 12 days working 8 hours a day, how many days will it take 20 workers to complete the same canal working 6 hours a day?",
    options: [
      "12 days",
      "10 days",
      "15 days",
      "9 days"
    ],
    correctIndex: 0,
    topic: "Quantitative Reasoning: Compound Proportions",
    unit: "Unit 2",
    chapter: "Chapter 2: Work, Time & Men",
    difficulty: "medium",
    explanation: "Total man-hours = W1 * D1 * H1 = 15 * 12 * 8 = 1440 man-hours. For the second group: Days = Total man-hours / (W2 * H2) = 1440 / (20 * 6) = 1440 / 120 = 12 days.",
    amharicExplanation: "አጠቃላይ የሰው-ሰዓት ስራ = 15 × 12 × 8 = 1440 ሰዓት። ለሁለተኛው ቡድን፡ ቀናት = 1440 / (20 × 6) = 1440 / 120 = 12 ቀናት ይሆናል።"
  },
  {
    questionText: "A merchant in Addis Ababa buys an item for 800 ETB and marks the price up by 25%. Later, during a holiday clearance sale, she offers a 20% discount on the marked price. What is her net profit or loss?",
    options: [
      "0 ETB (Break-even: neither profit nor loss)",
      "Profit of 40 ETB",
      "Loss of 40 ETB",
      "Profit of 80 ETB"
    ],
    correctIndex: 0,
    topic: "Financial Arithmetic & Percentage Markup/Discount",
    unit: "Unit 2",
    chapter: "Chapter 3: Percentages and Profit/Loss",
    difficulty: "medium",
    explanation: "Cost Price = 800 ETB. Marked price = 800 * 1.25 = 1000 ETB. Selling price after 20% discount = 1000 * (1 - 0.20) = 1000 * 0.80 = 800 ETB. Selling price equals Cost Price, resulting in exactly 0 ETB profit/loss (break-even).",
    amharicExplanation: "የመግዣ ዋጋ 800 ብር። በ 25% ሲጨምር 1000 ብር ይሆናል። በ 20% ቅናሽ ሲሸጥ 1000 × 0.80 = 800 ብር ይሆናል። የመሸጫ እና የመግዣ ዋጋ እኩል በመሆናቸው ትርፍም ኪሳራም የለም (0 ብር)።"
  },
  {
    questionText: "Pointing to a photograph of a gentleman, Selamawit says: 'His mother is the only daughter of my maternal grandfather.' How is Selamawit related to the gentleman in the photograph?",
    options: [
      "Sister (or Selamawit herself if male, but here sister/sibling)",
      "Aunt",
      "Niece",
      "Cousin"
    ],
    correctIndex: 0,
    topic: "Blood Relations & Logical Deduction",
    unit: "Unit 1",
    chapter: "Chapter 2: Family Trees & Relationships",
    difficulty: "medium",
    explanation: "'The only daughter of my maternal grandfather' is Selamawit's own mother. Therefore, the gentleman's mother is Selamawit's mother, making them brother and sister (siblings).",
    amharicExplanation: "የሰላማዊት እናት አባት ብቸኛ ሴት ልጅ ማለት የሰላማዊት እናት እራሷ ናት። ስለዚህ የፎቶው ሰው እናት የሰላማዊት እናት በመሆኗ፣ ሰላማዊት እህቱ (Sister) ናት።"
  },
  {
    questionText: "In a code language, if 'ETHIOPIA' is coded as 'GVKMQRKC' (shifting each letter forward by 2 in the alphabet), how will 'EXAM' be coded in that same cipher?",
    options: [
      "GZCO",
      "FYBN",
      "GZBN",
      "GYCO"
    ],
    correctIndex: 0,
    topic: "Coding & Decoding: Caesar Cipher Shifting",
    unit: "Unit 1",
    chapter: "Chapter 3: Letter Ciphers",
    difficulty: "easy",
    explanation: "E (+2) → G; X (+2) → Z; A (+2) → C; M (+2) → O. The resulting coded word is 'GZCO'.",
    amharicExplanation: "እያንዳንዱ ፊደል በሁለት (2) ወደፊት ሲገፋ፡ E → G፣ X → Z፣ A → C፣ M → O ሆኖ 'GZCO' ይሆናል።"
  }
];
