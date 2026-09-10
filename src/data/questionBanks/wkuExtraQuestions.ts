import { AuthenticCurriculumQuestion } from './mathQuestions';

// ============================================================================
// 🇪🇹 WOLKITE UNIVERSITY (WKU) AUTHENTIC EXAMS REPOSITORY
// College of Natural & Computational Sciences, Computing & Informatics, and Social Sciences
// ============================================================================

export const AUTHENTIC_CHEMISTRY_QUESTIONS_WKU_1011: AuthenticCurriculumQuestion[] = [
  // ─── UNIT 1: ATOMIC STRUCTURE & QUANTUM NUMBERS ───
  {
    questionText: "Which set of four quantum numbers (n, l, ml, ms) is legally allowed for an electron residing in a 3d subshell orbital?",
    options: [
      "n = 3, l = 2, ml = -1, ms = +1/2",
      "n = 3, l = 3, ml = 0, ms = -1/2",
      "n = 3, l = 1, ml = +2, ms = +1/2",
      "n = 2, l = 2, ml = 0, ms = +1/2"
    ],
    correctIndex: 0,
    topic: "Atomic Structure & Quantum Numbers",
    unit: "Unit 1",
    chapter: "Chapter 1: Structure of the Atom",
    difficulty: "medium",
    explanation: "For the 3d subshell, the principal quantum number n = 3. The angular momentum quantum number for d orbitals is l = 2. The magnetic quantum number ml can range from -l to +l (-2, -1, 0, 1, 2), and spin ms can be ±1/2.",
    amharicExplanation: "ለ 3d አምድ፡ ዋናው የኳንተም ቁጥር n = 3 ሲሆን፣ ለ d ኦርቢታል l = 2 ነው። ml ደግሞ ከ -2 እስከ +2 መሆን ስለሚችል 'n = 3, l = 2, ml = -1, ms = +1/2' ትክክለኛ ጥምረት ነው።"
  },
  {
    questionText: "What mass of sodium hydroxide (NaOH, molar mass = 40.0 g/mol) is required to prepare exactly 500 mL of a 0.250 M aqueous solution?",
    options: [
      "5.00 grams",
      "10.00 grams",
      "2.50 grams",
      "20.00 grams"
    ],
    correctIndex: 0,
    topic: "Solution Stoichiometry & Molarity",
    unit: "Unit 2",
    chapter: "Chapter 2: Stoichiometry & Solutions",
    difficulty: "easy",
    explanation: "Molarity M = moles / volume(L) ⟹ moles = 0.250 mol/L * 0.500 L = 0.125 moles. Mass = moles * molar mass = 0.125 mol * 40.0 g/mol = 5.00 g.",
    amharicExplanation: "ሞላሪቲ = ሞል / ሊትር ⟹ ሞል = 0.250 * 0.500 = 0.125 ሞል። መጠነ-ቁስ (Mass) = 0.125 * 40 = 5.00 ግራም ያስፈልጋል።"
  },
  {
    questionText: "According to VSEPR theory, what is the geometric molecular shape and approximate bond angle of the sulfur tetrafluoride molecule (SF₄)?",
    options: [
      "Seesaw shape (angles < 90° and < 120°)",
      "Square planar shape (angles = 90°)",
      "Regular tetrahedral shape (angles = 109.5°)",
      "Trigonal pyramidal shape (angles = 107°)"
    ],
    correctIndex: 0,
    topic: "VSEPR Theory & Molecular Geometry",
    unit: "Unit 3",
    chapter: "Chapter 3: Chemical Bonding",
    difficulty: "hard",
    explanation: "Sulfur in SF₄ has 6 valence electrons: 4 bonding pairs with fluorine and 1 equatorial lone pair (steric number = 5, trigonal bipyramidal electron geometry). The lone pair causes repulsion, resulting in a seesaw molecular geometry.",
    amharicExplanation: "በ SF₄ ውስጥ ሰልፈር 4 ቦንዶችና 1 ያላገባ የኤሌክትሮን ጥንድ (lone pair) አለው። ስለዚህ ሞለኪውላዊ ቅርጹ ሲሶው (Seesaw) ይባላል።"
  },
  {
    questionText: "What is the pH of a 0.0050 M aqueous solution of barium hydroxide, Ba(OH)₂, assuming complete dissociation?",
    options: [
      "12.00",
      "11.70",
      "2.30",
      "12.30"
    ],
    correctIndex: 0,
    topic: "Acids, Bases & Solution pH",
    unit: "Unit 4",
    chapter: "Chapter 4: Chemical Equilibrium & Acids/Bases",
    difficulty: "medium",
    explanation: "Ba(OH)₂ dissociates to produce 2 OH⁻ ions: [OH⁻] = 2 * 0.0050 M = 0.010 M = 1.0 * 10⁻² M. pOH = -log[OH⁻] = 2.00. Since pH + pOH = 14, pH = 14 - 2.00 = 12.00.",
    amharicExplanation: "Ba(OH)₂ ሙሉ ለሙሉ ሲሟሟ 2 OH⁻ ይሰጣል ⟹ [OH⁻] = 0.010 M ⟹ pOH = 2.00 ⟹ pH = 14 - 2 = 12.00 ይሆናል።"
  }
];

export const AUTHENTIC_GEOGRAPHY_QUESTIONS_WKU_1011: AuthenticCurriculumQuestion[] = [
  // ─── GEOGRAPHY OF ETHIOPIA & THE HORN ───
  {
    questionText: "Which major Ethiopian drainage basin covers the largest territorial area and flows westward across the Sudan border into the White Nile?",
    options: [
      "The Abbay (Blue Nile) River Basin",
      "The Awash River Basin",
      "The Omo-Gibe Basin",
      "The Genale-Dawa Basin"
    ],
    correctIndex: 0,
    topic: "Drainage Systems of Ethiopia",
    unit: "Unit 1",
    chapter: "Chapter 1: Drainage Systems & Water Resources",
    difficulty: "easy",
    explanation: "The Abbay (Blue Nile) basin is the largest river basin in Ethiopia in terms of runoff volume, contributing over 60% of the Nile's total discharge, originating from Lake Tana in the northwestern highlands.",
    amharicExplanation: "የዓባይ ወንዝ ተፋሰስ (Abbay Basin) ከጣና ሀይቅ በመነሳት በስፋቱም ሆነ በሚያመነጨው የውሃ መጠን የኢትዮጵያ ቀዳሚው ተፋሰስ ሲሆን፣ የናይል ወንዝን 60% ያህል ውሃ ይሸፍናል።"
  },
  {
    questionText: "According to traditional Ethiopian agro-climatic classification, the highland zone characterized by altitudes between 2,300 and 3,200 meters above sea level and cool temperatures is termed:",
    options: [
      "Dega (ደጋ)",
      "Weyna Dega (ወይና ደጋ)",
      "Kolla (ቆላ)",
      "Wurch / Kur (ውርጭ)"
    ],
    correctIndex: 0,
    topic: "Ethiopian Agro-Ecological Zones",
    unit: "Unit 2",
    chapter: "Chapter 2: Climate of Ethiopia",
    difficulty: "easy",
    explanation: "Ethiopia's traditional agro-climatic zones are: Bereha (<500m), Kolla (500-1500m), Weyna Dega (1500-2300m), Dega (2300-3200m), and Wurch (>3200m).",
    amharicExplanation: "በኢትዮጵያ ባህላዊ የአየር ንብረት ክፍፍል መሠረት ከ 2,300 እስከ 3,200 ሜትር ከፍታ ያለው ቀዝቃዛማ የደጋ (Dega) አየር ንብረት ተብሎ ይጠራል።"
  },
  {
    questionText: "What geologic era was responsible for the extensive uplift of the Arabo-Ethiopian plateau followed by the formation of the Great East African Rift System through faulting and volcanism?",
    options: [
      "The Cenozoic Era (Tertiary & Quaternary periods)",
      "The Precambrian Era",
      "The Paleozoic Era",
      "The Mesozoic Era"
    ],
    correctIndex: 0,
    topic: "Geology and Landforms of Ethiopia",
    unit: "Unit 3",
    chapter: "Chapter 3: Geologic History of Ethiopia",
    difficulty: "medium",
    explanation: "During the Tertiary period of the Cenozoic era, massive epeirogenic uplift elevated the Ethiopian plateau, followed by crustal stretching, faulting, and formation of the Great Rift Valley accompanied by Trappean volcanism.",
    amharicExplanation: "በሴኖዞይክ ዘመን (Cenozoic Era) በቴርሸሪ ክፍለ-ዘመን የተከሰተው የምድር ማንሳፈፍና ስምጥ ሸለቆ መሰንጠቅ የኢትዮጵያን ከፍተኛ አምባዎችና የስምጥ ሸለቆ ቅርጽ ፈጥሯል።"
  }
];

export const AUTHENTIC_GLOBAL_TRENDS_QUESTIONS_WKU_1012: AuthenticCurriculumQuestion[] = [
  // ─── GLOBAL TRENDS & INTERNATIONAL RELATIONS ───
  {
    questionText: "In international relations theory, which paradigm argues that the international system is defined by anarchic self-help where sovereign nation-states act as primary, rational actors pursuing survival, security, and national power?",
    options: [
      "Classical / Structural Realism",
      "Liberal Institutionalism",
      "Constructivism",
      "Critical Marxist Theory"
    ],
    correctIndex: 0,
    topic: "Theories of International Relations",
    unit: "Unit 1",
    chapter: "Chapter 1: Theories of International Relations",
    difficulty: "easy",
    explanation: "Realism views the global sphere as anarchic (lacking a central global government), compelling nation-states to maximize security and power via military alliances and balance of power strategies.",
    amharicExplanation: "ሪያሊዝም (Realism) ዓለም አቀፍ ስርዓቱ ማዕከላዊ መንግስት የሌለው (አናርኪክ) እንደሆነና ሀገራት የራሳቸውን ደህንነትና ብሄራዊ ጥቅም ለማስጠበቅ በሃይል ላይ እንደሚተማመኑ የሚያስረዳ ጽንሰ-ሀሳብ ነው።"
  },
  {
    questionText: "Which landmark diplomatic principle has historically underpinned Ethiopia's foreign policy and continental leadership in founding the Organization of African Unity (OAU) in 1963 in Addis Ababa?",
    options: [
      "Pan-African collective solidarity and anti-colonial sovereignty",
      "Strict unipolar alignment with Western military blocs",
      "Mercantile protectionism and regional isolation",
      "Territorial irredentism in the Red Sea corridor"
    ],
    correctIndex: 0,
    topic: "Ethiopian Foreign Policy & Pan-Africanism",
    unit: "Unit 2",
    chapter: "Chapter 2: Foreign Policy of Ethiopia",
    difficulty: "medium",
    explanation: "Ethiopia has historically championed Pan-Africanism, national self-determination, and collective continental security, serving as the diplomatic capital of Africa and headquarters of the African Union.",
    amharicExplanation: "የኢትዮጵያ የውጭ ግንኙነት ፖሊሲ መሰረት ፓን-አፍሪካኒዝም (Pan-Africanism)፣ ፀረ-ቅኝ አገዛዝ ትግልና የአህጉራዊ አንድነት ድጋፍ ሲሆን፣ በ 1963 እ.ኤ.አ የአፍሪካ አንድነት ድርጅት በአዲስ አበባ እንዲመሰረት ግንባር ቀደም ሚና ተጫውታለች።"
  }
];

export const AUTHENTIC_DSA_QUESTIONS_WKU_2021: AuthenticCurriculumQuestion[] = [
  // ─── DATA STRUCTURES & ALGORITHMS (CoSc 2021) ───
  {
    questionText: "Which abstract data type operates on a Last-In, First-Out (LIFO) protocol and is universally used for function call execution stacks and syntax matching?",
    options: [
      "Stack",
      "Queue",
      "Priority Queue",
      "Circular Array"
    ],
    correctIndex: 0,
    topic: "Stacks and LIFO Operations",
    unit: "Unit 1",
    chapter: "Chapter 1: Stacks and Queues",
    difficulty: "easy",
    explanation: "A Stack follows the Last-In, First-Out (LIFO) rule where push and pop operations occur at the top of the stack in O(1) time.",
    amharicExplanation: "ስታክ (Stack) በመጨረሻ የገባ መጀመሪያ የሚወጣበት (LIFO) አሰራርን የሚከተል ሲሆን፣ የኮምፒዩተር ፈንክሽኖችን ቅደም ተከተል ለመቆጣጠር ያገለግላል።"
  },
  {
    questionText: "In a binary search tree (BST), what traversal order visits nodes in strictly ascending sorted numerical key order?",
    options: [
      "In-order Traversal (Left, Root, Right)",
      "Pre-order Traversal (Root, Left, Right)",
      "Post-order Traversal (Left, Right, Root)",
      "Level-order Breadth-First Traversal"
    ],
    correctIndex: 0,
    topic: "Binary Search Tree Traversals",
    unit: "Unit 2",
    chapter: "Chapter 2: Trees and Tree Algorithms",
    difficulty: "medium",
    explanation: "In-order traversal visits the left subtree, then the root, then the right subtree. Because the left subtree contains smaller keys and the right contains larger keys, in-order traversal yields the keys in sorted order.",
    amharicExplanation: "በ BST ዛፍ ውስጥ ኢን-ኦርደር (In-order) አሰራር መጀመሪያ የግራውን ኖድ፣ ቀጥሎ ዋናውን (Root)፣ በመጨረሻም የቀኙን ኖድ ስለሚጎበኝ ቁጥሮቹ በቅደም ተከተል (Sorted) ይወጣሉ።"
  }
];
