import { AuthenticCurriculumQuestion } from './mathQuestions';

// ============================================================================
// 🇪🇹 HARAMAYA UNIVERSITY (HrU) & ARBA MINCH UNIVERSITY (AMU)
// Real Examination Series - Verified Ethiopian University Curricula
// ============================================================================

export const AUTHENTIC_ECONOMICS_QUESTIONS_HRU_1011: AuthenticCurriculumQuestion[] = [
  // ─── HARAMAYA UNIVERSITY: INTRODUCTION TO ECONOMICS (Econ 1011) ───
  {
    questionText: "What fundamental economic concept describes the value of the next best alternative forgone when a choice is made between mutually exclusive opportunities?",
    options: [
      "Opportunity Cost",
      "Sunk Cost",
      "Marginal Revenue",
      "Deadweight Loss"
    ],
    correctIndex: 0,
    topic: "Scarcity & Opportunity Cost",
    unit: "Unit 1",
    chapter: "Chapter 1: Theory of Consumer Behavior",
    difficulty: "easy",
    explanation: "Opportunity cost represents the benefits an individual, investor, or business misses out on when choosing one alternative over another. Because resources are scarce, every choice has an opportunity cost.",
    amharicExplanation: "የዕድል ዋጋ (Opportunity Cost) ማለት አንድን ምርጫ ስንመርጥ ሌላውን ሁለተኛ የተሻለ አማራጭ በመተዋችን ምክንያት የሚታጣው ጠቀሜታ ወይም እሴት ነው።"
  },
  {
    questionText: "If a 10% increase in the price of injera teff flour causes a 5% decrease in the quantity demanded, what is the price elasticity of demand (Ed)?",
    options: [
      "0.5 (Inelastic)",
      "2.0 (Elastic)",
      "1.0 (Unitary elastic)",
      "0.0 (Perfectly inelastic)"
    ],
    correctIndex: 0,
    topic: "Elasticity of Demand",
    unit: "Unit 2",
    chapter: "Chapter 2: Demand, Supply and Elasticity",
    difficulty: "easy",
    explanation: "Price Elasticity of Demand (Ed) = (% Change in Quantity Demanded) / (% Change in Price) = |-5% / 10%| = 0.5. Since Ed < 1, the demand is price inelastic (typical of basic food staples).",
    amharicExplanation: "የዋጋ የመለጠጥ ሁኔታ (Price Elasticity) = የፍላጎት ለውጥ በመቶኛ / የዋጋ ለውጥ በመቶኛ = 5% / 10% = 0.5 ይሆናል። ዋጋው ከ 1 በታች ስለሆነ ፍላጎቱ የማይለጠጥ (Inelastic) ነው።"
  },
  {
    questionText: "In macroeconomics, which economic policy tool involves adjusting government spending and taxation to influence national aggregate demand and economic stability?",
    options: [
      "Fiscal Policy",
      "Monetary Policy (Reserve Bank tools)",
      "Commercial Tariff Protectionism",
      "Foreign Exchange Pegging"
    ],
    correctIndex: 0,
    topic: "Macroeconomic Policy & Aggregates",
    unit: "Unit 3",
    chapter: "Chapter 3: Macroeconomic Fundamentals",
    difficulty: "easy",
    explanation: "Fiscal policy is administered by the government through taxation rates and public expenditure programs to stabilize economic cycles. Monetary policy, by contrast, is conducted by the central bank via interest rates and money supply.",
    amharicExplanation: "የፊስካል ፖሊሲ (Fiscal Policy) መንግስት የግብር ምጣኔንና የበጀት ወጪን በማስተካከል የሀገሪቱን አጠቃላይ ፍላጎትና ኢኮኖሚ የሚመራበት መሳሪያ ነው።"
  }
];

export const AUTHENTIC_STATICS_QUESTIONS_AMU_1022: AuthenticCurriculumQuestion[] = [
  // ─── ARBA MINCH UNIVERSITY: ENGINEERING MECHANICS / STATICS (CEng 1022) ───
  {
    questionText: "For a two-dimensional coplanar force system acting on a rigid body in static equilibrium, what are the three necessary and sufficient scalar equations?",
    options: [
      "ΣFx = 0, ΣFy = 0, and ΣMO = 0",
      "ΣFx = ΣFy and ΣM = 1",
      "ΣF = m * a and ΣT = I * α",
      "ΣFx + ΣFy = 0 and ΣFz = 0"
    ],
    correctIndex: 0,
    topic: "Equilibrium of Rigid Bodies",
    unit: "Unit 1",
    chapter: "Chapter 1: Principles of Statics",
    difficulty: "easy",
    explanation: "A rigid body in a 2D plane is in complete static equilibrium when the algebraic sum of horizontal forces (ΣFx), vertical forces (ΣFy), and moments about any arbitrary point O (ΣMO) all equal zero.",
    amharicExplanation: "በ 2D ገጽ ላይ አንድ አካል በእረፍት (Equilibrium) ላይ የሚሆነው፡ አግድም ሃይሎች (ΣFx = 0)፣ ቀጥ ያሉ ሃይሎች (ΣFy = 0) እና አጠቃላይ የሞመንት ድምር (ΣM = 0) ዜሮ ሲሆኑ ብቻ ነው።"
  },
  {
    questionText: "In planar structural truss analysis using the Method of Joints, what is the maximum number of unknown member forces that can be determined at any single joint?",
    options: [
      "Two (2) unknown forces (since only ΣFx = 0 and ΣFy = 0 are available)",
      "Three (3) unknown forces",
      "One (1) unknown force",
      "Unlimited, provided moments are computed"
    ],
    correctIndex: 0,
    topic: "Truss Analysis & Method of Joints",
    unit: "Unit 2",
    chapter: "Chapter 2: Structural Trusses",
    difficulty: "medium",
    explanation: "Because the forces at any concurrent 2D truss joint pass through a single point, moments cannot be applied. Only two independent scalar equilibrium equations exist (ΣFx = 0 and ΣFy = 0), allowing at most two unknowns per joint.",
    amharicExplanation: "በመገጣጠሚያ ዘዴ (Method of Joints) በአንድ ነጥብ ላይ ሃይሎች ስለሚገናኙ ሁለት የእኩልነት ቀመሮች ብቻ (ΣFx = 0 እና ΣFy = 0) አሉ። ስለዚህ ቢበዛ 2 ያልታወቁ ሃይሎችን ብቻ ማግኘት ይቻላል።"
  }
];
