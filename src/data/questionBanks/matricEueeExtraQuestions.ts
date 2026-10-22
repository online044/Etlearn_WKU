import { AuthenticCurriculumQuestion } from './mathQuestions';

// ============================================================================
// 🇪🇹 MOE GRADE 12 NATIONAL UNIVERSITY ENTRANCE EXAM (EUEE / ማትሪክ ፈተና)
// Authentic Questions from Ethiopian National Educational Assessment & Examinations Agency
// ============================================================================

export const AUTHENTIC_EUEE_ENGLISH_2016: AuthenticCurriculumQuestion[] = [
  // ─── SECTION 1: GRAMMAR & USAGE (CONDITIONALS & REPORTED SPEECH) ───
  {
    questionText: "Choose the grammatically correct sentence that completes the conditional: 'If the road to Wolkite had been paved earlier, we _______ the university campus before sunset.'",
    options: [
      "would have reached",
      "will have reached",
      "would reach",
      "had reached"
    ],
    correctIndex: 0,
    topic: "Conditional Sentences (Third Conditional)",
    unit: "Unit 1",
    chapter: "Chapter 1: Advanced English Grammar",
    difficulty: "medium",
    explanation: "The Third Conditional expresses an unreal past condition and its hypothetical past result. The structure is: 'If + Past Perfect (had been paved), ... would have + Past Participle (would have reached)'.",
    amharicExplanation: "ይህ 3ኛው የኮንዲሽናል አይነት (Third Conditional) ሲሆን፡ ያለፈን ያልተከናወነ ሁኔታ ያሳያል። ቀመሩ፡ If + Past Perfect ... would have + Verb-3 ስለሆነ 'would have reached' ትክክለኛ መልስ ነው።"
  },
  {
    questionText: "Select the sentence with the correct indirect reported speech for: '\"I haven't submitted my freshman assignment yet,\" declared Bekele.'",
    options: [
      "Bekele declared that he hadn't submitted his freshman assignment yet.",
      "Bekele declared that he hasn't submitted his freshman assignment yet.",
      "Bekele declared that he didn't submit his freshman assignment yet.",
      "Bekele declared that I hadn't submitted my freshman assignment yet."
    ],
    correctIndex: 0,
    topic: "Reported Speech Backshifting",
    unit: "Unit 1",
    chapter: "Chapter 2: Direct and Indirect Speech",
    difficulty: "medium",
    explanation: "In reported speech, Present Perfect ('haven't submitted') backshifts to Past Perfect ('hadn't submitted'), and the first-person pronoun 'I' changes to the third-person 'he'.",
    amharicExplanation: "በሪፖርቲድ ስፒች (Reported Speech) ውስጥ Present Perfect ወደ Past Perfect (haven't submitted ⟹ hadn't submitted) ይቀየራል፤ ተውላጠ ስሙም 'he' ይሆናል።"
  },
  {
    questionText: "Identify the correct prepositional phrase: 'Despite studying diligently for months, Aster was prevented _______ taking the regional exam due to a sudden typhoid infection.'",
    options: [
      "from",
      "to",
      "of",
      "against"
    ],
    correctIndex: 0,
    topic: "Verbs with Dependent Prepositions",
    unit: "Unit 2",
    chapter: "Chapter 3: Prepositions & Phrasal Verbs",
    difficulty: "easy",
    explanation: "The verb 'prevent' requires the dependent preposition 'from' followed by a gerund: 'prevent someone from doing something'.",
    amharicExplanation: "'Prevent' የሚለው ግስ ሁልጊዜ 'from' ከሚለው ቅድመ-መስተዋድድ ጋር ይጣመራል (prevented from taking)።"
  },
  {
    questionText: "Which passive voice transformation is correct for: 'The Ministry of Education will announce the university entrance cutoff points next week.'?",
    options: [
      "The university entrance cutoff points will be announced by the Ministry of Education next week.",
      "The university entrance cutoff points are being announced by the Ministry of Education next week.",
      "The university entrance cutoff points would have been announced next week.",
      "The university entrance cutoff points have been announced next week."
    ],
    correctIndex: 0,
    topic: "Active to Passive Voice Transformation",
    unit: "Unit 2",
    chapter: "Chapter 4: Voice and Modality",
    difficulty: "easy",
    explanation: "The future simple active 'will announce' transforms into the passive 'will be announced' (will + be + past participle).",
    amharicExplanation: "በፊውቸር ሲምፕል (Future Simple) ውስጥ 'will announce' ወደ ተገብሮ (Passive) ሲቀየር 'will be announced' ይሆናል።"
  },
  {
    questionText: "Choose the word closest in meaning to the capitalized word: 'The professor praised the students for their METICULOUS attention to laboratory safety protocols.'",
    options: [
      "thorough and precise",
      "careless and hasty",
      "sporadic and brief",
      "hesitant and doubtful"
    ],
    correctIndex: 0,
    topic: "Contextual Vocabulary & Synonyms",
    unit: "Unit 3",
    chapter: "Chapter 5: Reading Comprehension & Lexicon",
    difficulty: "medium",
    explanation: "'Meticulous' means showing great attention to detail; very careful and precise.",
    amharicExplanation: "'Meticulous' ማለት እጅግ ጥንቁቅ፣ ዝርዝር ጉዳዮችን በትኩረት የሚመለከት (thorough and precise) ማለት ነው።"
  }
];

export const AUTHENTIC_EUEE_CHEMISTRY_2016: AuthenticCurriculumQuestion[] = [
  // ─── GRADE 12 CHEMISTRY: EQUILIBRIUM, THERMODYNAMICS & ELECTROCHEMISTRY ───
  {
    questionText: "According to Le Chatelier's Principle, what happens to the equilibrium position of the Haber process: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH = -92 kJ/mol) when the temperature is INCREASED?",
    options: [
      "The equilibrium shifts to the left, decreasing the yield of NH₃",
      "The equilibrium shifts to the right, increasing the yield of NH₃",
      "The rate of the forward reaction increases while equilibrium remains unchanged",
      "The total pressure of the closed container drops to zero"
    ],
    correctIndex: 0,
    topic: "Chemical Equilibrium & Le Chatelier's Principle",
    unit: "Unit 1",
    chapter: "Chapter 1: Chemical Equilibrium",
    difficulty: "medium",
    explanation: "Because the forward synthesis of ammonia is exothermic (ΔH < 0), heat acts like a product. Increasing the temperature causes the system to absorb heat by favoring the reverse endothermic direction, shifting equilibrium to the left and reducing NH₃ yield.",
    amharicExplanation: "የአሞኒያ አፈጣጠር ኤክሶተርሚክ (ሙቀት ሰጪ) ስለሆነ፣ የሙቀት መጠን ሲጨምር ኬሚካላዊው ሚዛን ወደ ግራ (ወደ ተቀላቃዮቹ) በማዘንበል የሚመረተውን NH₃ መጠን ይቀንሳል።"
  },
  {
    questionText: "What is the standard cell potential (E°cell) for a galvanic cell composed of a Zn/Zn²⁺ half-cell (E° = -0.76 V) and a Cu/Cu²⁺ half-cell (E° = +0.34 V)?",
    options: [
      "+1.10 V",
      "+0.42 V",
      "-1.10 V",
      "-0.42 V"
    ],
    correctIndex: 0,
    topic: "Electrochemistry & Standard Cell Potential",
    unit: "Unit 2",
    chapter: "Chapter 2: Electrochemistry",
    difficulty: "easy",
    explanation: "E°cell = E°cathode - E°anode. Copper has the more positive reduction potential, so Cu acts as cathode (+0.34 V) and Zn as anode (-0.76 V). Therefore, E°cell = +0.34 V - (-0.76 V) = +1.10 V.",
    amharicExplanation: "E°cell = E°cathode - E°anode = +0.34 V - (-0.76 V) = +1.10 V ይሆናል። ይህ የዳንኤል ሴል (Daniell Cell) መደበኛ ቮልቴጅ ነው።"
  },
  {
    questionText: "What is the systematic IUPAC name of the organic compound with formula CH₃-CH(CH₃)-CH₂-COOH?",
    options: [
      "3-methylbutanoic acid",
      "2-methylbutanoic acid",
      "4-methylbutanoic acid",
      "Isovaleric ester"
    ],
    correctIndex: 0,
    topic: "Organic Nomenclature & Carboxylic Acids",
    unit: "Unit 3",
    chapter: "Chapter 3: Carboxylic Acids and Esters",
    difficulty: "easy",
    explanation: "The carboxyl carbon (-COOH) is designated as C1. The longest continuous chain has 4 carbons (butanoic acid). A methyl group (-CH₃) is attached at carbon-3, making the name 3-methylbutanoic acid.",
    amharicExplanation: "የካርቦክሲሊክ አሲድ ካርቦን (-COOH) እንደ ካርቦን-1 ይቆጠራል። ረጅሙ ሰንሰለት 4 ካርቦን ያለው ሲሆን በካርቦን 3 ላይ ሜቲል ቡድን ስላለ '3-methylbutanoic acid' ይባላል።"
  },
  {
    questionText: "Which law states that the total enthalpy change for a chemical reaction is independent of the pathway taken from initial reactants to final products?",
    options: [
      "Hess's Law of Heat Summation",
      "Raoult's Law",
      "Henry's Law",
      "Avogadro's Law"
    ],
    correctIndex: 0,
    topic: "Thermochemistry & Hess's Law",
    unit: "Unit 4",
    chapter: "Chapter 4: Thermochemistry",
    difficulty: "easy",
    explanation: "Hess's Law states that because enthalpy is a state function, the total enthalpy change for a chemical reaction is equal to the sum of the enthalpy changes for the individual steps into which the reaction can be divided.",
    amharicExplanation: "የሄስ ህግ (Hess's Law)፡ የአንድ ኬሚካላዊ ምላሽ ጠቅላላ የኢንታልፒ ለውጥ (ΔH) ምላሹ በአንድ እርምጃም ሆነ በብዙ ደረጃዎች ቢካሄድ ተመሳሳይ እንደሆነ ያስረዳል።"
  }
];

export const AUTHENTIC_EUEE_BIOLOGY_2016: AuthenticCurriculumQuestion[] = [
  // ─── GRADE 12 BIOLOGY: GENETICS, BIOCHEMISTRY & ECOLOGY ───
  {
    questionText: "In humans, hemophilia is an X-linked recessive bleeding disorder. If a carrier female (X^H X^h) marries an unaffected normal male (X^H Y), what is the probability that their sons will have hemophilia?",
    options: [
      "50% (1/2)",
      "25% (1/4)",
      "100%",
      "0%"
    ],
    correctIndex: 0,
    topic: "Sex-Linked Inheritance & Pedigree Analysis",
    unit: "Unit 1",
    chapter: "Chapter 1: Genetics and Heredity",
    difficulty: "medium",
    explanation: "The sons receive the Y chromosome from the father and either X^H (normal) or X^h (hemophilic) from the mother with equal likelihood. Thus, 50% of their male offspring will inherit hemophilia.",
    amharicExplanation: "ሴቷ ተሸካሚ (X^H X^h) ስትሆን ወንዶች ልጆች ከእናትየው X ክሮሞዞም ይቀበላሉ። ስለዚህ ከተወለዱት ወንዶች ልጆች መካከል 50% (ግማሹ) ሄሞፊሊያ ይኖራቸዋል።"
  },
  {
    questionText: "During eukaryotic aerobic cellular respiration, which metabolic stage synthesizes the vast majority of ATP molecules via oxidative phosphorylation?",
    options: [
      "Electron Transport Chain and Chemiosmosis",
      "Glycolysis in the cytoplasm",
      "The Citric Acid (Krebs) Cycle",
      "Lactic acid fermentation"
    ],
    correctIndex: 0,
    topic: "Bioenergetics & ATP Synthesis",
    unit: "Unit 2",
    chapter: "Chapter 2: Cellular Respiration",
    difficulty: "easy",
    explanation: "While glycolysis and the Krebs cycle produce only 2 ATP each via substrate-level phosphorylation, the Electron Transport Chain and ATP synthase synthesize approximately 26-28 ATP via chemiosmosis.",
    amharicExplanation: "በሴል አተነፋፈስ ሂደት ውስጥ አብዛኛውን የ ATP ሃይል (ወደ 28 ATP) የሚያመርተው በማይቶኮንድሪያ ውስጣዊ ሽፋን ላይ የሚገኘው የኤሌክትሮን ማመላለሻ ሰንሰለት (Electron Transport Chain) ነው።"
  },
  {
    questionText: "Which endangered mammal is strictly endemic to the afroalpine grasslands of the Bale Mountains and Simien Mountains of Ethiopia?",
    options: [
      "The Ethiopian Wolf (Canis simensis)",
      "The African Savannah Elephant",
      "The Mountain Gorilla",
      "The Spotted Hyena"
    ],
    correctIndex: 0,
    topic: "Ethiopian Ecology & Endemic Biodiversity",
    unit: "Unit 3",
    chapter: "Chapter 3: Biodiversity and Conservation",
    difficulty: "easy",
    explanation: "The Ethiopian wolf (ቀይ ቀበሮ - Canis simensis) is the most endangered canid in Africa and is strictly endemic to the high-altitude afroalpine ecosystems of Ethiopia (particularly Bale and Simien mountains).",
    amharicExplanation: "የኢትዮጵያ ቀይ ቀበሮ (Ethiopian Wolf) በባሌና በሰሜን ተራሮች በሚገኙ ከፍተኛ አምባዎች ላይ ብቻ የሚገኝ ለኢትዮጵያ ብቸኛ (Endemic) የሆነ ብርቅዬ አጥቢ አውሬ ነው።"
  }
];
