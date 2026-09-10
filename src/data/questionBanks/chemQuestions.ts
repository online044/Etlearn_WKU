import { AuthenticCurriculumQuestion } from './mathQuestions';

export const AUTHENTIC_CHEMISTRY_QUESTIONS_MU_1011: AuthenticCurriculumQuestion[] = [
  // ─── UNIT 1: ATOMIC STRUCTURE & QUANTUM NUMBERS ───
  {
    questionText: "Which of the following sets of quantum numbers (n, l, m_l, m_s) is permissible for an electron in an atom according to the rules of quantum mechanics?",
    options: [
      "n = 3, l = 2, m_l = -1, m_s = +1/2",
      "n = 2, l = 2, m_l = 0, m_s = -1/2",
      "n = 4, l = 1, m_l = +2, m_s = +1/2",
      "n = 1, l = 0, m_l = 0, m_s = +1"
    ],
    correctIndex: 0,
    topic: "Quantum Numbers & Atomic Orbitals",
    unit: "Unit 1",
    chapter: "Chapter 1: Quantum Mechanics of Atoms",
    difficulty: "medium",
    explanation: "For n = 3, l can take values from 0 up to n - 1 (0, 1, 2). For l = 2 (a d-orbital), m_l can range from -l to +l (-2, -1, 0, +1, +2), and m_s must be ±1/2. Option B fails because l cannot equal n; Option C fails because |m_l| > l; Option D fails because m_s must be ±1/2.",
    amharicExplanation: "በኳንተም ቁጥሮች ሕግ መሠረት n = 3 ሲሆን l = 0, 1, 2 ሊሆን ይችላል፤ l = 2 ሲሆን m_l ከ -2 እስከ +2 ሲሆን m_s ደግሞ ±1/2 ብቻ ነው። ስለዚህ 'A' ብቻ ትክክል ነው።"
  },
  {
    questionText: "What is the ground-state electron configuration of a neutral Chromium atom (Cr, Z = 24)?",
    options: [
      "[Ar] 4s¹ 3d⁵",
      "[Ar] 4s² 3d⁴",
      "[Ar] 4s⁰ 3d⁶",
      "[Ar] 3d⁶"
    ],
    correctIndex: 0,
    topic: "Anomalous Electron Configurations",
    unit: "Unit 1",
    chapter: "Chapter 1: Electron Configuration",
    difficulty: "medium",
    explanation: "Chromium is a classic exception to the Aufbau principle. Because half-filled subshells (3d⁵) provide exceptional exchange energy stability, an electron is promoted from the 4s orbital to the 3d orbital, giving [Ar] 4s¹ 3d⁵.",
    amharicExplanation: "ክሮሚየም (Cr, Z=24) ግማሽ የተሞላ (Half-filled 3d⁵) የበለጠ የተረጋጋ የኢነርጂ ሁኔታ ስለሚፈጥር ትክክለኛው ውቅር [Ar] 4s¹ 3d⁵ ነው።"
  },

  // ─── UNIT 2: PERIODIC PROPERTIES & TRENDS ───
  {
    questionText: "Why is the second ionization energy of Sodium (Na, Z = 11) dramatically higher than that of Magnesium (Mg, Z = 12)?",
    options: [
      "The second electron of Sodium must be removed from a stable noble-gas closed shell (2p⁶), which experiences much higher effective nuclear charge",
      "Sodium has more total protons than Magnesium",
      "Magnesium has a smaller atomic radius than Sodium",
      "Magnesium is an alkali metal while Sodium is an alkaline earth metal"
    ],
    correctIndex: 0,
    topic: "Ionization Energy & Periodic Trends",
    unit: "Unit 2",
    chapter: "Chapter 1: Periodic Trends",
    difficulty: "hard",
    explanation: "Removing the first electron from Na yields Na⁺ ([Ne]), which has a complete, stable noble-gas core. Removing a second electron disrupts this core (from 2p⁶), requiring tremendous energy. For Mg, removing a second electron yields the stable Mg²⁺ ([Ne]) configuration.",
    amharicExplanation: "የሶዲየም ሁለተኛ ኤሌክትሮን የሚነሳው ከተረጋጋው የኖብል ጋዝ ሼል (2p⁶) ስለሆነ እጅግ ከፍተኛ የሆነ የኢነርጂ መጠን ይጠይቃል።"
  },

  // ─── UNIT 3: CHEMICAL BONDING & MOLECULAR GEOMETRY ───
  {
    questionText: "According to VSEPR theory and hybridization models, what is the hybridization of the central sulfur atom and the molecular geometry of Sulfur Hexafluoride (SF₆)?",
    options: [
      "sp³d² hybridization with Octahedral geometry",
      "sp³d hybridization with Trigonal Bipyramidal geometry",
      "sp³ hybridization with Tetrahedral geometry",
      "dsp² hybridization with Square Planar geometry"
    ],
    correctIndex: 0,
    topic: "Hybridization & VSEPR Molecular Shapes",
    unit: "Unit 3",
    chapter: "Chapter 1: Chemical Bonding & Shapes",
    difficulty: "medium",
    explanation: "In SF₆, the sulfur atom is surrounded by 6 single bonds and zero lone pairs (steric number = 6). This requires mixing one s, three p, and two d orbitals (sp³d²), resulting in an octahedral molecular shape with 90° bond angles.",
    amharicExplanation: "በ SF₆ ውስጥ ሰልፈር 6 ቦንዶች ስላሉት ስቴሪክ ቁጥሩ 6 ሲሆን፤ ሃይብሪዳይዜሽኑ sp³d² እና ቅርጹ ኦክታሄድራል (Octahedral) ይሆናል።"
  },

  // ─── UNIT 4: STOICHIOMETRY & GAS LAWS ───
  {
    questionText: "According to Graham's Law of Effusion, if Gas A has a molar mass of 16 g/mol (CH₄) and Gas B has a molar mass of 64 g/mol (SO₂), what is the ratio of their rates of effusion (Rate_A / Rate_B)?",
    options: [
      "2.0",
      "4.0",
      "0.5",
      "1.41"
    ],
    correctIndex: 0,
    topic: "Graham's Law of Effusion",
    unit: "Unit 4",
    chapter: "Chapter 1: Gas Laws",
    difficulty: "easy",
    explanation: "Graham's Law states Rate₁ / Rate₂ = √(M₂ / M₁). Here: Rate_A / Rate_B = √(64 / 16) = √4 = 2.0. Methane effuses twice as fast as sulfur dioxide.",
    amharicExplanation: "በግራሃም ሕግ Rate_A / Rate_B = √(M_B / M_A) = √(64 / 16) = √4 = 2.0 (ጋዝ A በሁለት እጥፍ ፍጥነት ይተናል)።"
  },

  // ─── UNIT 5: THERMOCHEMISTRY & EQUILIBRIUM ───
  {
    questionText: "According to Le Chatelier's Principle, which change will shift the equilibrium to the right (favoring product formation) for the exothermic Haber process?\nN₂(g) + 3H₂(g) ⇌ 2NH₃(g)   (ΔH = -92 kJ/mol)",
    options: [
      "Increasing the total pressure of the reaction vessel and decreasing temperature",
      "Decreasing total pressure and increasing temperature",
      "Adding a heterogeneous platinum catalyst",
      "Continuously removing nitrogen gas from the system"
    ],
    correctIndex: 0,
    topic: "Chemical Equilibrium & Le Chatelier's Principle",
    unit: "Unit 5",
    chapter: "Chapter 1: Thermochemistry & Equilibrium",
    difficulty: "hard",
    explanation: "The forward reaction produces fewer moles of gas (4 moles reactant → 2 moles product) and releases heat (exothermic). Increasing pressure shifts toward fewer moles (right). Decreasing temperature favors the exothermic direction (right). Catalysts affect rate, not equilibrium position.",
    amharicExplanation: "ጫና መጨመር አነስተኛ ሞል ጋዝ ወዳለበት (ወደ ቀኝ) ሲያንቀሳቅሰው፣ ሙቀት መቀነስ ደግሞ ኤክሶተርሚክ ወደ ሆነው አቅጣጫ ምርቱን ያበዛል።"
  },
  {
    questionText: "What is the pH of an aqueous buffer solution prepared with 0.20 M Acetic Acid (CH₃COOH, Ka = 1.8 × 10⁻⁵) and 0.20 M Sodium Acetate (CH₃COONa)? (Given log(1.8) ≈ 0.26).",
    options: [
      "4.74",
      "5.24",
      "3.85",
      "7.00"
    ],
    correctIndex: 0,
    topic: "Buffer Solutions & Henderson-Hasselbalch Equation",
    unit: "Unit 5",
    chapter: "Chapter 2: Acids, Bases & Buffers",
    difficulty: "medium",
    explanation: "By the Henderson-Hasselbalch equation: pH = pKa + log([A⁻]/[HA]). pKa = -log(1.8 × 10⁻⁵) = 5 - log(1.8) = 5 - 0.26 = 4.74. Since [A⁻] = [HA] = 0.20 M, log(0.20/0.20) = log(1) = 0. Thus pH = 4.74.",
    amharicExplanation: "በሄንደርሰን-ሃሰልባልች ቀመር pH = pKa + log([A⁻]/[HA])። የሁለቱ ኮንሰንትሬሽን እኩል ስለሆነ log(1) = 0 ሲሆን፣ pH = pKa = 4.74 ይሆናል።"
  },
  {
    questionText: "In the standard galvanic cell Zn(s) | Zn²⁺(1M) || Cu²⁺(1M) | Cu(s), given standard reduction potentials E°(Zn²⁺/Zn) = -0.76 V and E°(Cu²⁺/Cu) = +0.34 V, what is the standard cell potential (E°_cell)?",
    options: [
      "+1.10 V",
      "+0.42 V",
      "-0.42 V",
      "+1.52 V"
    ],
    correctIndex: 0,
    topic: "Electrochemistry & Galvanic Cells",
    unit: "Unit 5",
    chapter: "Chapter 3: Electrochemistry & Nernst Equation",
    difficulty: "easy",
    explanation: "E°_cell = E°_cathode (reduction) - E°_anode (oxidation) = E°(Cu²⁺/Cu) - E°(Zn²⁺/Zn) = (+0.34 V) - (-0.76 V) = +0.34 + 0.76 = +1.10 Volts.",
    amharicExplanation: "የጋልቫኒክ ሴል ፖቴንሺያል E°_cell = E°(ካቶድ) - E°(አኖድ) = (+0.34) - (-0.76) = +1.10 ቮልት ይሆናል።"
  },
  {
    questionText: "Which law of thermodynamics states that the entropy of a pure, perfectly crystalline substance at absolute zero (0 Kelvin) is exactly zero?",
    options: [
      "Third Law of Thermodynamics",
      "First Law of Thermodynamics",
      "Second Law of Thermodynamics",
      "Zeroth Law of Thermodynamics"
    ],
    correctIndex: 0,
    topic: "Thermodynamics & Entropy",
    unit: "Unit 5",
    chapter: "Chapter 1: Laws of Thermodynamics",
    difficulty: "easy",
    explanation: "The Third Law of Thermodynamics establishes an absolute zero reference point for entropy, stating that a perfectly ordered crystalline lattice at 0 K possesses zero entropy (S = 0).",
    amharicExplanation: "የቴርሞዳይናሚክስ ሶስተኛው ሕግ (Third Law) ፍጹም በሆነ ክሪስታል ውስጥ በ 0 ኬልቪን (Absolute zero) ላይ ኤንትሮፒ (Entropy) ዜሮ መሆኑን ይደነግጋል።"
  },
  {
    questionText: "What is the oxidation state of Chromium in the dichromate polyatomic ion (Cr₂O₇²⁻)?",
    options: [
      "+6",
      "+3",
      "+7",
      "+4"
    ],
    correctIndex: 0,
    topic: "Oxidation Numbers & Redox Chemistry",
    unit: "Unit 3",
    chapter: "Chapter 2: Oxidation-Reduction Reactions",
    difficulty: "easy",
    explanation: "Oxygen typically has an oxidation state of -2. The total charge of Cr₂O₇²⁻ is -2. Thus: 2*(Cr) + 7*(-2) = -2 ⟹ 2*(Cr) - 14 = -2 ⟹ 2*(Cr) = +12 ⟹ Cr = +6.",
    amharicExplanation: "በ Cr₂O₇²⁻ ውስጥ፡ 2(Cr) + 7(-2) = -2 ⟹ 2(Cr) = 12 ⟹ Cr = +6 ይሆናል።"
  }
];
