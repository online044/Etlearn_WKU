/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Official Ethiopian University Freshman & Common Courses Question Bank
 * Manual Question Database for Curriculum Practice & Exams (0 API Key Required)
 */

export interface ManualDatabaseQuestion {
  id: string;
  subject: string;
  questionText: string;
  questionTextAmharic?: string;
  options: [string, string, string, string];
  correctAnswer: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  explanationAmharic?: string;
  topic?: string;
  unit?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  source: 'manual' | 'university_past_exam' | 'curriculum';
}

export const FRESHMAN_SUBJECTS_LIST = [
  "Critical Thinking",
  "Economics",
  "Emerging Technologies",
  "Entrepreneurship",
  "General Biology",
  "General Chemistry",
  "General Physics",
  "General Psychology",
  "Geography",
  "Global Trends",
  "Inclusiveness",
  "Moral and Civic Education",
  "Physical Fitness",
  "Communicative English Language Skills I (FLEn 1011)",
  "Communicative English Language Skills II",
  "History of Ethiopia and the Horn",
  "Mathematics (Natural Science Module)",
  "Mathematics (Social Science Module)",
  "Social Anthropology"
] as const;

export const INITIAL_MANUAL_QUESTIONS: ManualDatabaseQuestion[] = [
  // 1. Critical Thinking (Phil 1011)
  {
    id: "db_phil_01",
    subject: "Critical Thinking",
    questionText: "Which informal fallacy occurs when an arguer attacks their opponent's character, motive, or background rather than addressing the substance of their argument?",
    questionTextAmharic: "አንድ ተከራካሪ የአንባቢውን/የተቃዋሚውን ሃሳብ ወደ ጎን ትቶ የግለሰቡን ማንነት፣ ስነ-ምግባር ወይም ማንነት ሲያጠቃ የትኛው የስህተት አመክንዮ (Fallacy) ይፈጠራል?",
    options: [
      "Argumentum ad Hominem (Appeal to the Person)",
      "Straw Man Fallacy",
      "Post Hoc Ergo Propter Hoc",
      "Appeal to Ignorance (Argumentum ad Ignorantiam)"
    ],
    correctAnswer: "Argumentum ad Hominem (Appeal to the Person)",
    correctOption: "A",
    explanation: "Ad Hominem (abusive or circumstantial) occurs when an arguer directs their attack against the person presenting the claim instead of evaluating the premises and logical validity of the claim itself.",
    explanationAmharic: "አድ ሆሚነም (Ad Hominem) የሚባለው አመክንዮአዊ ስህተት የተቃዋሚውን አመክንዮ ከመመርመር ይልቅ በግለሰቡ ስብዕና ላይ ያነጣጠረ ጥቃት ሲሰነዘር ነው።",
    topic: "Informal Fallacies",
    unit: "Unit 4",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },
  {
    id: "db_phil_02",
    subject: "Critical Thinking",
    questionText: "What distinguishes a 'Sound' deductive argument from a merely 'Valid' deductive argument?",
    questionTextAmharic: "በዲዳክቲቭ (Deductive) አመክንዮ ውስጥ 'Sound' የሆነ ክርክር ከ 'Valid' ክርክር የሚለየው በምንድነው?",
    options: [
      "A sound argument is valid AND all its premises are factually true.",
      "A sound argument only requires true premises regardless of deductive form.",
      "A sound argument always deals with inductive probabilities rather than certainty.",
      "A sound argument cannot have a false conclusion even if false premises are assumed."
    ],
    correctAnswer: "A sound argument is valid AND all its premises are factually true.",
    correctOption: "A",
    explanation: "By formal logic definition: Soundness = Validity + Actual Truth of all premises. If an argument has valid form but one premise is factually false, it is valid but unsound.",
    explanationAmharic: "ሳውንድ (Sound) ክርክር የሚባለው ትክክለኛ መዋቅር (Validity) ያለውና ሁሉም መሰረታዊ ሃሳቦቹ (Premises) እውነተኛ መሆናቸው የተረጋገጠ ሲሆን ነው።",
    topic: "Deductive & Inductive Logic",
    unit: "Unit 2",
    difficulty: "medium",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 2. Economics (Econ 1011)
  {
    id: "db_econ_01",
    subject: "Economics",
    questionText: "What does the Law of Demand state regarding the relationship between the price of a normal good and the quantity demanded, ceteris paribus?",
    questionTextAmharic: "በኢኮኖሚክስ የፍላጎት ህግ (Law of Demand) መሰረት ሌሎች ሁኔታዎች ቋሚ ሆነው የዋጋ እና የተፈላጊ መጠን ዝምድና ምን ይመስላል?",
    options: [
      "There is an inverse (negative) relationship between price and quantity demanded.",
      "There is a direct proportional relationship between price and quantity demanded.",
      "Quantity demanded remains constant regardless of changes in price.",
      "Price and demand fluctuate randomly without identifiable functional correlation."
    ],
    correctAnswer: "There is an inverse (negative) relationship between price and quantity demanded.",
    correctOption: "A",
    explanation: "The law of demand states that, holding other factors constant (ceteris paribus), as the price of a good increases, the quantity demanded decreases, and vice versa.",
    explanationAmharic: "ሌሎች ሁኔታዎች ሳይለወጡ የዕቃው ዋጋ ሲጨምር ተፈላጊው መጠን ይቀንሳል፤ ዋጋ ሲቀንስ ተፈላጊ መጠን ይጨምራል።",
    topic: "Market Forces of Supply & Demand",
    unit: "Unit 2",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },
  {
    id: "db_econ_02",
    subject: "Economics",
    questionText: "If the price elasticity of demand for teff is calculated as |Ed| = 0.45, how is the demand characterized?",
    questionTextAmharic: "የጤፍ የዋጋ ፍላጎት የመለጠጥ አቅም (Elasticity) |Ed| = 0.45 ቢሆን፣ የፍላጎቱ ሁኔታ ምን ይባላል?",
    options: [
      "Inelastic demand (consumers are relatively insensitive to price shifts)",
      "Elastic demand (consumers respond dramatically to price changes)",
      "Unitary elastic demand",
      "Perfectively elastic horizontal demand"
    ],
    correctAnswer: "Inelastic demand (consumers are relatively insensitive to price shifts)",
    correctOption: "A",
    explanation: "When the absolute value of price elasticity of demand is less than 1 (|Ed| < 1), demand is inelastic, typical for staple food items and necessities like teff.",
    explanationAmharic: "|Ed| ከ 1 በታች ሲሆን ፍላጎቱ ኢላስቲክ ያልሆነ (Inelastic) ነው፤ ይህም ማለት ዋጋው ቢቀያየርም የፍላጎት መጠኑ ብዙ አይቀየርም።",
    topic: "Elasticity of Demand & Supply",
    unit: "Unit 3",
    difficulty: "medium",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 3. Emerging Technologies (EmTe 1012)
  {
    id: "db_emte_01",
    subject: "Emerging Technologies",
    questionText: "Which pillar of Industry 4.0 enables physical everyday objects to collect, exchange, and transmit telemetry data across internet networks autonomously?",
    questionTextAmharic: "በአራተኛው የኢንዱስትሪ አብዮት (Industry 4.0) ውስጥ ቁሳቁሶች ራሳቸውን ችለው ዳታ እንዲሰበስቡና በኔትወርክ እንዲለዋወጡ የሚያስችለው ቴክኖሎጂ የትኛው ነው?",
    options: [
      "Internet of Things (IoT)",
      "Additive 3D Rapid Prototyping",
      "Linear Sequential Relational Databases",
      "Quantum Cryptographic Sharding"
    ],
    correctAnswer: "Internet of Things (IoT)",
    correctOption: "A",
    explanation: "The Internet of Things (IoT) refers to interconnected computing devices, mechanical and digital machines embedded with sensors and network connectivity.",
    explanationAmharic: "ኢንተርኔት ኦፍ ቲንግስ (IoT) በሴንሰሮችና በኔትወርክ የተገናኙ ቁሳቁሶች ያለ ሰው ጣልቃገብነት መረጃ የሚለዋወጡበት ቴክኖሎጂ ነው።",
    topic: "Internet of Things & Industry 4.0",
    unit: "Unit 2",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },
  {
    id: "db_emte_02",
    subject: "Emerging Technologies",
    questionText: "In Artificial Intelligence, what is the key difference between Artificial Narrow Intelligence (ANI) and Artificial General Intelligence (AGI)?",
    questionTextAmharic: "በአርቴፊሻል ኢንተለጀንስ (AI) ውስጥ በ Narrow AI እና General AI (AGI) መካከል ያለው ዋና ልዩነት ምንድነው?",
    options: [
      "ANI is specialized for dedicated single domains, whereas AGI demonstrates human-level cognitive flexibility across all domains.",
      "ANI requires quantum optical processors whereas AGI runs solely on standard server GPUs.",
      "ANI is autonomous while AGI cannot learn without manual programmer intervention.",
      "ANI cannot process unstructured data while AGI only processes text."
    ],
    correctAnswer: "ANI is specialized for dedicated single domains, whereas AGI demonstrates human-level cognitive flexibility across all domains.",
    correctOption: "A",
    explanation: "ANI (Narrow/Weak AI) excels at specific dedicated tasks (like chess, speech recognition, image generation). AGI (Strong AI) represents hypothetical systems with human-grade broad reasoning across multiple unfamiliar disciplines.",
    explanationAmharic: "Narrow AI ለአንድ የተወሰነ ስራ ብቻ የተዘጋጀ ሲሆን፣ AGI ደግሞ እንደ ሰው ልጅ በማንኛውም መስክ የማሰብና የመማር አቅም ያለው ነው።",
    topic: "Artificial Intelligence Concepts",
    unit: "Unit 3",
    difficulty: "medium",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 4. Entrepreneurship (Mgmt 1012)
  {
    id: "db_mgmt_01",
    subject: "Entrepreneurship",
    questionText: "What is the primary function of an Executive Summary in a comprehensive business plan submitted to Ethiopian commercial banks or investors?",
    questionTextAmharic: "ለባንኮች ወይም ባለሀብቶች በሚቀርብ የቢዝነስ ፕላን (Business Plan) ውስጥ የኤክስኪዩቲቭ ሳመሪ (Executive Summary) ዋና ጠቀሜታ ምንድነው?",
    options: [
      "To provide a concise, compelling overview of the entire business concept, target market, competitive edge, and financial projections.",
      "To list all detailed tax receipts and operational line-item ledgers of the preceding five years.",
      "To serve as the final legal annex after the financial appendices.",
      "To describe the architectural blueprints of physical factory buildings."
    ],
    correctAnswer: "To provide a concise, compelling overview of the entire business concept, target market, competitive edge, and financial projections.",
    correctOption: "A",
    explanation: "The executive summary condenses the key elements of the business proposal into 1-2 pages so prospective lenders and investors can rapidly evaluate feasibility.",
    explanationAmharic: "የቢዝነስ ፕላኑን ዋና ዋና ነጥቦች፣ የገበያ ዕድል፣ የፋይናንስ ትንበያና የአሰራር ስልት በአጭሩና ሳቢ በሆነ መልኩ ለባለሀብቶች ማቅረብ ነው።",
    topic: "Business Planning & Feasibility",
    unit: "Unit 3",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 5. General Biology (Biol 1012)
  {
    id: "db_biol_01",
    subject: "General Biology",
    questionText: "During cellular respiration in eukaryotic cells, which metabolic stage produces the greatest net quantity of ATP molecules per glucose molecule?",
    questionTextAmharic: "በህዋስ ውስጥ በኦክስጅን በሚካሄድ አተነፋፈስ (Cellular Respiration) ወቅት ከፍተኛውን የ ATP ኃይል የሚያመነጨው የትኛው ምዕራፍ ነው?",
    options: [
      "Oxidative Phosphorylation (Electron Transport Chain & Chemiosmosis)",
      "Cytosolic Glycolysis",
      "The Citric Acid (Krebs) Cycle in mitochondrial matrix",
      "Lactate fermentation in muscle fibers"
    ],
    correctAnswer: "Oxidative Phosphorylation (Electron Transport Chain & Chemiosmosis)",
    correctOption: "A",
    explanation: "Oxidative phosphorylation generates approximately 26 to 28 ATP molecules per glucose via ATP synthase, far exceeding the 2 net ATP from glycolysis and 2 ATP from Krebs cycle.",
    explanationAmharic: "በኤሌክትሮን ማስተላለፊያ ሰንሰለት (Electron Transport Chain) አማካኝነት የሚካሄደው ኦክሲዳይቲቭ ፎስፎራይሌሽን ከ 26 እስከ 28 የሚደርሱ ATP ሞለኪውሎችን ያመነጫል።",
    topic: "Cellular Respiration & Bioenergetics",
    unit: "Unit 2",
    difficulty: "medium",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 6. General Chemistry (Chem 1012)
  {
    id: "db_chem_01",
    subject: "General Chemistry",
    questionText: "What is the molecular geometry and bond angle of a methane (CH₄) molecule according to VSEPR theory?",
    questionTextAmharic: "በ VSEPR ንድፈ-ሃሳብ መሰረት የሚቴን (CH₄) ሞለኪውል ቅርጽና የቦንድ አንግል (Bond Angle) ስንት ነው?",
    options: [
      "Tetrahedral geometry with bond angles of 109.5°",
      "Trigonal planar with bond angles of 120°",
      "Linear with bond angles of 180°",
      "Trigonal pyramidal with bond angles of 107°"
    ],
    correctAnswer: "Tetrahedral geometry with bond angles of 109.5°",
    correctOption: "A",
    explanation: "Carbon in CH₄ has four single covalent bonds (four electron domains) and zero lone pairs, adopting an sp³ hybridized tetrahedral geometry with bond angles of 109.5°.",
    explanationAmharic: "ሚቴን (CH₄) አራት ተያያዥ ቦንዶችና ምንም የተረፈ ኤሌክትሮን የሌለው በመሆኑ ቴትራሄድራል (Tetrahedral) ቅርፅና የ 109.5° ዲግሪ አንግል አለው።",
    topic: "Chemical Bonding & Molecular Structure",
    unit: "Unit 3",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 7. General Physics (General Physics Course Syllabus / Phys 1011)
  {
    id: "db_phys_01",
    subject: "General Physics",
    questionText: "A stone is thrown vertically upward with an initial velocity of 20 m/s. Neglecting air resistance and taking g = 10 m/s², what is the maximum height reached?",
    questionTextAmharic: "አንድ ድንጋይ በ 20 m/s የመጀመሪያ ፍጥነት ወደ ላይ ቢወረወር (g = 10 m/s² ቢሆን)፣ የሚደርስበት ከፍተኛው ከፍታ (Maximum Height) ስንት ነው?",
    options: [
      "20 meters",
      "40 meters",
      "10 meters",
      "200 meters"
    ],
    correctAnswer: "20 meters",
    correctOption: "A",
    explanation: "Using kinematics: v² = u² - 2gh. At maximum height, v = 0. Therefore, 0 = (20)² - 2(10)h ⟹ 20h = 400 ⟹ h = 20 m.",
    explanationAmharic: "ከፍታው በሚሰላበት ቀመር: v² = u² - 2gh ⟹ 0 = 400 - 20h ⟹ h = 20 ሜትር ይሆናል።",
    topic: "Kinematics in One Dimension",
    unit: "Unit 2",
    difficulty: "medium",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 8. General Psychology (Psyc 1011)
  {
    id: "db_psyc_01",
    subject: "General Psychology",
    questionText: "In classical conditioning demonstrated by Ivan Pavlov, what was the meat powder initially before any training trials took place?",
    questionTextAmharic: "በፓቭሎቭ ክላሲካል ኮንዲሽኒንግ ሙከራ ውስጥ ስጋው ከመሰልጠኑ በፊት ምን ተብሎ ይጠራ ነበር?",
    options: [
      "Unconditioned Stimulus (UCS)",
      "Conditioned Stimulus (CS)",
      "Conditioned Response (CR)",
      "Neutral Extinction Stimulus"
    ],
    correctAnswer: "Unconditioned Stimulus (UCS)",
    correctOption: "A",
    explanation: "An unconditioned stimulus (UCS) naturally and automatically triggers a physiological response (salivation = UCR) without prior conditioning.",
    explanationAmharic: "ስጋው በተፈጥሮው ውሻው ምራቁን እንዲያወጣ የሚያደርግ በመሆኑ ያልተገደበ ቀስቃሽ (Unconditioned Stimulus - UCS) ይባላል።",
    topic: "Learning & Conditioning",
    unit: "Unit 4",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 9. Geography of Ethiopia and the Horn (GeES 1011)
  {
    id: "db_geog_01",
    subject: "Geography",
    questionText: "Which physiographic division of Ethiopia contains the highest peak in the country, Mount Ras Dejen (4,550 m)?",
    questionTextAmharic: "በኢትዮጵያ የመሬት አቀማመጥ ክፍፍል ውስጥ የሀገሪቱ ረጅሙ ተራራ የሆነው ራስ ደጀን (4,550 ሜትር) የሚገኘው በየትኛው ክፍል ነው?",
    options: [
      "The North-Western Highlands (Simien Mountains)",
      "The South-Eastern Highlands (Bale Mountains)",
      "The Afar Depression (Danakil Basin)",
      "The Western Lowlands of Gambella"
    ],
    correctAnswer: "The North-Western Highlands (Simien Mountains)",
    correctOption: "A",
    explanation: "Ras Dejen is located in the Simien Mountain massif within the North-Western Highlands of Ethiopia.",
    explanationAmharic: "ራስ ደጀን ተራራ የሚገኘው በሰሜን-ምዕራብ ከፍተኛ ቦታዎች (በስሜን ተራሮች ብሔራዊ ፓርክ) ውስጥ ነው።",
    topic: "Physiographic Regions of Ethiopia",
    unit: "Unit 2",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 10. Global Trends (GlTr 1012)
  {
    id: "db_gltr_01",
    subject: "Global Trends",
    questionText: "In international relations theory, which paradigm emphasizes state sovereignty, military power, and the pursuit of national interests in an anarchic world system?",
    questionTextAmharic: "በአለም አቀፍ ግንኙነት (International Relations) ንድፈ-ሃሳብ ውስጥ የሀገራትን ሉዓላዊነት፣ ወታደራዊ ኃይልና የብሔራዊ ጥቅምን የሚያጎላው የትኛው አመለካከት ነው?",
    options: [
      "Realism (Realpolitik)",
      "Liberalism / Institutionalism",
      "Constructivism",
      "Marxist Dependency World-Systems Theory"
    ],
    correctAnswer: "Realism (Realpolitik)",
    correctOption: "A",
    explanation: "Realism posits that sovereign states operate in an anarchic international arena without an overarching global government, compelling each to prioritize military survival and power.",
    explanationAmharic: "ሪያሊዝም (Realism) በአለም አቀፍ ደረጃ የበላይ ገዢ መንግስት በሌለበት ሁኔታ ሀገራት ራሳቸውን ለማስጠበቅ በወታደራዊ ኃይላቸውና በብሔራዊ ጥቅማቸው ላይ እንዲያተኩሩ ያዛል።",
    topic: "Theories of International Relations",
    unit: "Unit 1",
    difficulty: "medium",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 11. Inclusiveness (SNIE 1012)
  {
    id: "db_snie_01",
    subject: "Inclusiveness",
    questionText: "What is the core philosophical difference between 'Integration' and genuine 'Inclusion' in educational environments?",
    questionTextAmharic: "በትምህርት ተቋማት ውስጥ 'በማቀናጀት' (Integration) እና 'በማካተት' (Inclusion) መካከል ያለው ዋነኛ የፍልስፍና ልዩነት ምንድነው?",
    options: [
      "Integration forces the student with diverse needs to adapt to an unchanged system, whereas Inclusion reconstructs the educational environment, curriculum, and methods to embrace all learners.",
      "Integration provides personalized laptops whereas Inclusion uses traditional blackboards.",
      "Integration is exclusively designed for gifted students, while Inclusion applies only to hearing impairment.",
      "There is no operational difference in higher education settings."
    ],
    correctAnswer: "Integration forces the student with diverse needs to adapt to an unchanged system, whereas Inclusion reconstructs the educational environment, curriculum, and methods to embrace all learners.",
    correctOption: "A",
    explanation: "True inclusion requires systemic transformation of curricula, physical access, and pedagogy to welcome all learners without requiring them to conform to non-inclusive setups.",
    explanationAmharic: "ኢንክሉዥን (Inclusion) ተማሪው ብቻውን እንዲላመድ ከመገደድ ይልቅ፣ ስርዓተ-ትምህርቱና ትምህርት ቤቱ የሁሉንም ተማሪ ፍላጎት በሚያሟላ መልኩ እንዲቀረፅ ያደርጋል።",
    topic: "Principles of Inclusive Education",
    unit: "Unit 2",
    difficulty: "medium",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 12. Moral and Civic Education (MCED 1012)
  {
    id: "db_mced_01",
    subject: "Moral and Civic Education",
    questionText: "Under the 1995 Constitution of the Federal Democratic Republic of Ethiopia (FDRE), what is established as the supreme organ of state power?",
    questionTextAmharic: "በ 1987ቱ የኢ.ፌ.ዲ.ሪ ህገ-መንግስት መሰረት የፌዴራሉ መንግስት የበላይ የስልጣን አካል ሆኖ የተቋቋመው የትኛው ነው?",
    options: [
      "The House of Peoples' Representatives (HoPR)",
      "The Federal Supreme Court",
      "The Council of Constitutional Inquiry",
      "The Office of the Attorney General"
    ],
    correctAnswer: "The House of Peoples' Representatives (HoPR)",
    correctOption: "A",
    explanation: "Under Article 50(3) and Article 54 of the FDRE Constitution, the House of Peoples' Representatives is designated as the highest authority of the Federal Government.",
    explanationAmharic: "በኢ.ፌ.ዲ.ሪ ህገ-መንግስት አንቀጽ 50 ንዑስ አንቀጽ 3 መሰረት የህዝብ ተወካዮች ምክር ቤት የፌዴራሉ መንግስት ከፍተኛ የስልጣን አካል ነው።",
    topic: "State Structure & Constitutional Principles",
    unit: "Unit 3",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 13. Physical Fitness (SpSc 1011)
  {
    id: "db_spsc_01",
    subject: "Physical Fitness",
    questionText: "In exercise physiology, what does the F.I.T.T. training principle formula stand for?",
    questionTextAmharic: "በስፖርትና አካል ብቃት ሳይንስ ውስጥ የ F.I.T.T. መርህ ምህፃረ-ቃል ምንን ይወክላል?",
    options: [
      "Frequency, Intensity, Time, and Type",
      "Flexibility, Interval, Tension, and Timing",
      "Force, Inertia, Traction, and Torque",
      "Fast-twitch, Isometric, Tone, and Threshold"
    ],
    correctAnswer: "Frequency, Intensity, Time, and Type",
    correctOption: "A",
    explanation: "The FITT principle provides guidelines for exercise prescription: Frequency (how often), Intensity (how hard), Time (duration), and Type (mode of activity).",
    explanationAmharic: "F.I.T.T ማለት የአካል ብቃት እንቅስቃሴ ድግግሞሽ (Frequency)፣ ጥንካሬ (Intensity)፣ ጊዜ (Time) እና የአይነት (Type) መርህ ነው።",
    topic: "Fitness Training Principles",
    unit: "Unit 2",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 14. Communicative English Language Skills I (FLEn 1011)
  {
    id: "db_flen_01",
    subject: "Communicative English Language Skills I (FLEn 1011)",
    questionText: "Choose the sentence that correctly employs the past perfect tense to show an action completed before another past event:",
    questionTextAmharic: "አንድ ድርጊት በሌላ ያለፈ ድርጊት ከመከሰቱ በፊት መጠናቀቁን የሚያሳየውን ትክክለኛ የ Past Perfect ዓረፍተ-ነገር ይምረጡ፡",
    options: [
      "By the time the professor arrived at the lecture hall, the students had already submitted their assignments.",
      "By the time the professor had arrived at the lecture hall, the students submitted their assignments.",
      "The students have already submitted their assignments before the professor was arriving.",
      "The students are submitting their assignments when the professor had arrived."
    ],
    correctAnswer: "By the time the professor arrived at the lecture hall, the students had already submitted their assignments.",
    correctOption: "A",
    explanation: "Past perfect ('had submitted') is used for the earlier past event, combined with simple past ('arrived') for the subsequent event.",
    explanationAmharic: "ቀደም ብሎ የተጠናቀቀውን ድርጊት ለመግለጽ Past Perfect ('had submitted') ጥቅም ላይ ሲውል፣ ቀጥሎ የተፈጠረው በ Simple Past ('arrived') ይገለጻል።",
    topic: "Verb Tenses & Academic Grammar",
    unit: "Unit 1",
    difficulty: "medium",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 15. Communicative English Language Skills II
  {
    id: "db_flen2_01",
    subject: "Communicative English Language Skills II",
    questionText: "What is the primary role of a 'Topic Sentence' in an academic expository paragraph?",
    questionTextAmharic: "በአካዳሚክ ድርሰት (Paragraph) ውስጥ የ 'Topic Sentence' ዋና ሚና ምንድነው?",
    options: [
      "It expresses the single controlling idea and main focus developed throughout the paragraph.",
      "It serves exclusively as a citation list referencing peer-reviewed bibliography.",
      "It must always conclude the paragraph with rhetorical questions.",
      "It introduces unrelated anecdotal commentary to entertain readers."
    ],
    correctAnswer: "It expresses the single controlling idea and main focus developed throughout the paragraph.",
    correctOption: "A",
    explanation: "A topic sentence states the main idea and controlling thought of the paragraph, guiding all supporting sentences and evidence.",
    explanationAmharic: "ቶፒክ ሴንቴንስ (Topic Sentence) የአንቀፁን ዋና ሃሳብ እና አቅጣጫ የሚገልጽ ዋነኛ ዓረፍተ-ነገር ነው።",
    topic: "Academic Paragraph Writing",
    unit: "Unit 2",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 16. History of Ethiopia and the Horn (Hist 1012)
  {
    id: "db_hist_01",
    subject: "History of Ethiopia and the Horn",
    questionText: "Which landmark historical event took place on March 1, 1896, where Ethiopian forces under Emperor Menilek II decisively defeated Italian colonial troops?",
    questionTextAmharic: "የካቲት 23 ቀን 1888 ዓ.ም (ማርች 1, 1896) ዳግማዊ አጼ ምኒልክ የኢጣሊያ ወራሪ ጦርን በድል ያጠናቀቁበት ታሪካዊ ክስተት የትኛው ነው?",
    options: [
      "The Battle of Adwa",
      "The Battle of Gundet",
      "The Battle of Chelenqo",
      "The Battle of Metemma"
    ],
    correctAnswer: "The Battle of Adwa",
    correctOption: "A",
    explanation: "The Battle of Adwa was the climatic victory of the First Italo-Ethiopian War that defended Ethiopian independence against European colonization.",
    explanationAmharic: "የዓድዋ ጦርነት ኢትዮጵያ የቅኝ ግዛት ወረራን በማክሸፍ ነፃነቷን ያስከበረችበት ድንቅ ታሪካዊ ድል ነው።",
    topic: "Sovereignty & Anti-Colonial Resistance",
    unit: "Unit 6",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 17. Mathematics (Natural Science Module) (Math 1011)
  {
    id: "db_math_nat_01",
    subject: "Mathematics (Natural Science Module)",
    questionText: "Let f(x) = ln(x² + 1). Find the first derivative f'(x) with respect to x:",
    questionTextAmharic: "f(x) = ln(x² + 1) ቢሆን፣ የመጀመሪያውን ዴሪቫቲቭ f'(x) ፈልጉ፡",
    options: [
      "f'(x) = 2x / (x² + 1)",
      "f'(x) = 1 / (x² + 1)",
      "f'(x) = 2 / (x² + 1)",
      "f'(x) = 2x * (x² + 1)"
    ],
    correctAnswer: "f'(x) = 2x / (x² + 1)",
    correctOption: "A",
    explanation: "Applying the Chain Rule: d/dx[ln(u)] = (1/u) * du/dx. Here u = x² + 1 and du/dx = 2x, hence f'(x) = 2x / (x² + 1).",
    explanationAmharic: "የቼይን ሩል (Chain Rule) ስንጠቀም፡ d/dx[ln(u)] = u'/u ነው። እዚህ u = x² + 1 ሲሆን u' = 2x ስለሆነ f'(x) = 2x / (x² + 1) ይሆናል።",
    topic: "Calculus: Differentiation & Chain Rule",
    unit: "Unit 4",
    difficulty: "medium",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 18. Mathematics (Social Science Module) (Math 1012)
  {
    id: "db_math_soc_01",
    subject: "Mathematics (Social Science Module)",
    questionText: "An investment of 10,000 ETB earns 8% simple interest per year. What is the total interest accumulated after 5 years?",
    questionTextAmharic: "10,000 የኢትዮጵያ ብር በዓመት በ 8% ቀላል ወለድ (Simple Interest) ቢቀመጥ፣ ከ 5 ዓመት በኋላ የሚገኘው አጠቃላይ ወለድ ስንት ነው?",
    options: [
      "4,000 ETB",
      "800 ETB",
      "14,000 ETB",
      "5,000 ETB"
    ],
    correctAnswer: "4,000 ETB",
    correctOption: "A",
    explanation: "Simple interest formula: I = P * r * t = 10,000 * 0.08 * 5 = 4,000 ETB.",
    explanationAmharic: "ቀላል ወለድ I = P × r × t = 10,000 × 0.08 × 5 = 4,000 ብር ይሆናል።",
    topic: "Mathematics of Finance",
    unit: "Unit 3",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  },

  // 19. Social Anthropology (Anth 1012)
  {
    id: "db_anth_01",
    subject: "Social Anthropology",
    questionText: "What anthropological concept refers to evaluating another culture's behaviors, beliefs, and values through the lens of one's own cultural standards, often assuming superiority?",
    questionTextAmharic: "የሌላውን ማህበረሰብ ባህልና እሴት በራስ ባህል መነጽር በመገምገምና የራስን ባህል የበላይ አድርጎ በመቁጠር የሚፈጠረው አመለካከት በአንትሮፖሎጂ ምን ይባላል?",
    options: [
      "Ethnocentrism",
      "Cultural Relativism",
      "Acculturation",
      "Syncretism"
    ],
    correctAnswer: "Ethnocentrism",
    correctOption: "A",
    explanation: "Ethnocentrism is the tendency to view one's own culture as the standard and judge other cultures as inferior or abnormal. Cultural relativism is its counter-principle.",
    explanationAmharic: "ኢትኖሴንትሪዝም (Ethnocentrism) የራስን ባህልና እምነት እንደ ትክክለኛ መለኪያ በመውሰድ የሌሎችን ባህል የማጣጣል አመለካከት ነው።",
    topic: "Concepts of Culture & Society",
    unit: "Unit 2",
    difficulty: "easy",
    createdAt: "2026-09-01T00:00:00.000Z",
    source: "curriculum"
  }
];
