export interface FillBlankQuestion {
  id: string;
  sentence: string;
  blanks: string[]; // correct answers
  hints?: string;
  explanation: string;
}

export interface ReviewQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface MultiChoiceQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption: string; // "A" | "B" | "C" | "D"
  explanation: string;
}

export interface TrueFalseQuestion {
  id: string;
  question: string;
  correctAnswer: boolean;
  explanation: string;
}

// ---------------- COMMUNICATIVE ENGLISH ----------------
export const ENGLISH_SECTIONS = {
  reportedSpeech: {
    title: "Reported Speech",
    keyRule: "When reporting what someone said, the verb tense usually shifts one step back into the past.",
    backshifts: [
      { direct: "Present Simple (e.g., 'I work here.')", reported: "Past Simple (e.g., 'He said he worked there.')" },
      { direct: "Present Continuous (e.g., 'I am eating.')", reported: "Past Continuous (e.g., 'She said she was eating.')" },
      { direct: "Present Perfect (e.g., 'I have finished.')", reported: "Past Perfect (e.g., 'He said he had finished.')" },
      { direct: "Past Simple (e.g., 'I saw it.')", reported: "Past Perfect (e.g., 'She said she had seen it.')" },
      { direct: "Will (e.g., 'I will come.')", reported: "Would (e.g., 'He said he would come.')" },
      { direct: "Can (e.g., 'I can help.')", reported: "Could (e.g., 'She said she could help.')" },
      { direct: "May (e.g., 'It may rain.')", reported: "Might (e.g., 'He said it might rain.')" }
    ],
    timeChanges: [
      { direct: "now", reported: "then" },
      { direct: "today", reported: "that day" },
      { direct: "yesterday", reported: "the day before" },
      { direct: "tomorrow", reported: "the next day" },
      { direct: "here", reported: "there" },
      { direct: "this", reported: "that" }
    ],
    specialRules: [
      { category: "Yes/No Questions", rule: "Use if or whether: 'Are you tired?' → He asked if I was tired." },
      { category: "Wh- Questions", rule: "Keep the wh-word, use statement word order: 'Where do you live?' → She asked where I lived." },
      { category: "Commands", rule: "Use told + object + to-infinitive: 'Close the door.' → He told me to close the door. (Negative: 'Don't shout.' → She told him not to shout.)" }
    ],
    questions: [
      { id: "es_q1", sentence: "\"I am studying for the exam.\" → She said she _______ for the exam.", blanks: ["was studying"], explanation: "Present Continuous backshifts to Past Continuous." },
      { id: "es_q2", sentence: "\"We have eaten lunch.\" → They told us they _______ lunch.", blanks: ["had eaten"], explanation: "Present Perfect backshifts to Past Perfect." },
      { id: "es_q3", sentence: "\"I will help you tomorrow.\" → He promised he _______ help me _______.", blanks: ["would", "the next day"], explanation: "Will backshifts to would; tomorrow shifts to the next day." },
      { id: "es_q4", sentence: "\"Can you come now?\" → She asked if I _______ come _______.", blanks: ["could", "then"], explanation: "Can backshifts to could; now shifts to then." },
      { id: "es_q5", sentence: "\"Don't touch the books.\" → The teacher told us _______ _______ the books.", blanks: ["not", "to touch"], explanation: "Negative command is reported as 'not to + infinitive'." },
      { id: "es_q6", sentence: "\"Where do you live?\" → He asked me where I _______.", blanks: ["lived"], explanation: "Wh-question keeps the wh-word and uses normal statement word order." },
      { id: "es_q7", sentence: "\"I may visit Addis Ababa next week.\" → She said she _______ visit Addis Ababa _______.", blanks: ["might", "the next week"], explanation: "May shifts to might; next week shifts to the next week / the following week." },
      { id: "es_q8", sentence: "\"I saw the accident yesterday.\" → He told me he _______ _______ the accident _______.", blanks: ["had seen", "the day before"], explanation: "Past Simple backshifts to Past Perfect; yesterday shifts to the day before." },
      { id: "es_q9", sentence: "\"Open the window, please.\" (Tricky) → She asked him _______ _______ the window.", blanks: ["to open"], explanation: "A polite request uses the infinitive form." },
      { id: "es_q10", sentence: "\"Are you happy here?\" → He asked me if I was happy _______.", blanks: ["there"], explanation: "Here shifts to there in indirect speech." }
    ] as FillBlankQuestion[]
  },
  relativeClauses: {
    title: "Relative Clauses",
    keyRule: "Relative pronouns connect a clause or phrase to a noun or pronoun. We distinguish between defining and non-defining clauses.",
    pronouns: [
      { pronoun: "who", usedFor: "People (subject)", example: "The man who called is my uncle." },
      { pronoun: "whom", usedFor: "People (object)", example: "The girl whom I met was kind." },
      { pronoun: "which", usedFor: "Things / Animals", example: "The book which I read was long." },
      { pronoun: "that", usedFor: "People or Things", example: "The car that he drives is new." },
      { pronoun: "whose", usedFor: "Possession", example: "The student whose bag is lost is crying." },
      { pronoun: "where", usedFor: "Places", example: "The city where I was born is Addis." },
      { pronoun: "when", usedFor: "Time", example: "The year when he graduated was 2022." }
    ],
    definingVsNon: [
      { type: "Defining (no commas)", rule: "Provides essential information. E.g., 'The woman who lives next door is a doctor.'" },
      { type: "Non-Defining (with commas)", rule: "Provides extra info that can be safely removed. E.g., 'My sister, who lives in London, is a nurse.'" },
      { type: "Crucial Note", rule: "The pronoun 'that' cannot be used in non-defining clauses." }
    ],
    questions: [
      { id: "rc_q1", sentence: "The student _______ passed the exam was very happy.", blanks: ["who"], explanation: "Use 'who' or 'that' for people as subjects." },
      { id: "rc_q2", sentence: "This is the house _______ I grew up.", blanks: ["where"], explanation: "Use 'where' for place references (equal to 'in which')." },
      { id: "rc_q3", sentence: "The letter _______ arrived this morning is for you.", blanks: ["which"], explanation: "Use 'which' or 'that' for things." },
      { id: "rc_q4", sentence: "The teacher _______ class I enjoy most is Mr. Hailu.", blanks: ["whose"], explanation: "Use 'whose' to show possession." },
      { id: "rc_q5", sentence: "Do you remember the day _______ we first met?", blanks: ["when"], explanation: "Use 'when' for time reference." },
      { id: "rc_q6", sentence: "He is the man _______ I told you about.", blanks: ["whom"], explanation: "Use 'whom' (or 'who') as object of the relative clause." },
      { id: "rc_q7", sentence: "Abebe, _______ is my best friend, lives in Hawassa.", blanks: ["who"], explanation: "Must use 'who' for people in non-defining (comma-separated) clauses. 'that' is forbidden." },
      { id: "rc_q8", sentence: "The pen _______ I lost was a gift.", blanks: ["which"], explanation: "Use 'which' or 'that' (or blank)." },
      { id: "rc_q9", sentence: "Combine: \"I know the woman. She won the prize.\" → I know the woman _______ won the prize.", blanks: ["who"], explanation: "Combines using subject relative pronoun 'who'." },
      { id: "rc_q10", sentence: "Combine: \"This is the book. I borrowed it.\" → This is the book _______ I borrowed.", blanks: ["which"], explanation: "Combines using object relative pronoun 'which' or 'that'." }
    ] as FillBlankQuestion[]
  },
  modals: {
    title: "Modal Auxiliary Verbs",
    keyRule: "Modal verbs do not change form. They are followed by the base infinitive (without 'to').",
    modalsList: [
      { modal: "can", use: "Ability / Permission", example: "I can swim. / You can leave." },
      { modal: "could", use: "Past ability / Polite request", example: "She could run fast. / Could you help?" },
      { modal: "may", use: "Possibility / Permission (formal)", example: "It may rain. / May I come in?" },
      { modal: "might", use: "Less certain possibility", example: "He might be late." },
      { modal: "must", use: "Obligation / Strong certainty", example: "You must study. / She must be tired." },
      { modal: "should", use: "Advice / Recommendation", example: "You should sleep early." },
      { modal: "shall", use: "Offer / Future (formal)", example: "Shall I open the door?" },
      { modal: "will", use: "Future / Willingness", example: "I will call you." },
      { modal: "would", use: "Polite request / Conditional", example: "Would you help me?" },
      { modal: "ought to", use: "Moral obligation", example: "You ought to respect elders." }
    ],
    notes: [
      { term: "mustn't", value: "Indicates prohibition (forbidden)." },
      { term: "don't have to", value: "Indicates absence of obligation (not necessary)." }
    ],
    questions: [
      { id: "md_q1", sentence: "You _______ eat vegetables; they are good for your health. (advice)", blanks: ["should"], explanation: "'should' or 'ought to' is standard for giving advice." },
      { id: "md_q2", sentence: "Students _______ use their phones during the exam. (it is forbidden)", blanks: ["must not"], explanation: "'must not' or 'mustn't' denotes absolute prohibition." },
      { id: "md_q3", sentence: "When I was young, I _______ climb any tree. (past ability)", blanks: ["could"], explanation: "'could' expresses ability in the past." },
      { id: "md_q4", sentence: "It is cloudy. It _______ rain later. (possibility)", blanks: ["might"], explanation: "'might', 'may', or 'could' expresses possibility." },
      { id: "md_q5", sentence: "_______ I help you carry those bags? (offer)", blanks: ["Shall"], explanation: "'Shall' or 'Can' are used to make polite offers." },
      { id: "md_q6", sentence: "All passengers _______ wear a seatbelt. (obligation)", blanks: ["must"], explanation: "'must' or 'have to' denotes strict obligation." },
      { id: "md_q7", sentence: "_______ you please close the window? (polite request)", blanks: ["Could"], explanation: "'Could' or 'Would' are polite forms for request." },
      { id: "md_q8", sentence: "She looks very pale. She _______ be sick. (strong certainty)", blanks: ["must"], explanation: "'must' expresses high logical deduction certainty." },
      { id: "md_q9", sentence: "You _______ respect your parents. (moral obligation)", blanks: ["ought to"], explanation: "'ought to' or 'should' denotes moral duty." },
      { id: "md_q10", sentence: "I _______ speak three languages when I was a child. (past ability)", blanks: ["could"], explanation: "Past ability is denoted by 'could'." }
    ] as FillBlankQuestion[]
  },
  activePassive: {
    title: "Active & Passive Voice",
    keyRule: "Passive = be (correct tense) + past participle (V3). The object of the active sentence becomes the subject of the passive.",
    tenses: [
      { tense: "Present Simple", active: "They clean the room.", passive: "The room is cleaned." },
      { tense: "Past Simple", active: "He wrote a letter.", passive: "A letter was written (by him)." },
      { tense: "Present Continuous", active: "She is making tea.", passive: "Tea is being made." },
      { tense: "Past Continuous", active: "They were building a bridge.", passive: "A bridge was being built." },
      { tense: "Present Perfect", active: "He has finished the work.", passive: "The work has been finished." },
      { tense: "Future (will)", active: "They will plant trees.", passive: "Trees will be planted." },
      { tense: "Modal", active: "She can fix it.", passive: "It can be fixed." }
    ],
    notes: [
      "The agent (doer) is introduced with 'by': The book was written by Chimamanda.",
      "Omit the agent when it is unknown, unimportant, or obvious.",
      "Only transitive verbs (verbs with objects) can be made passive."
    ],
    questions: [
      { id: "ap_q1", sentence: "Active: \"The teacher corrects the homework.\" → Passive: The homework _______ corrected by the teacher.", blanks: ["is"], explanation: "Present Simple passive is 'is/are + V3'." },
      { id: "ap_q2", sentence: "Active: \"Workers built the dam in 1990.\" → Passive: The dam _______ _______ in 1990.", blanks: ["was built"], explanation: "Past Simple passive is 'was/were + V3'." },
      { id: "ap_q3", sentence: "Active: \"They are painting the walls.\" → Passive: The walls _______ _______ painted.", blanks: ["are being"], explanation: "Present Continuous passive is 'is/are + being + V3'." },
      { id: "ap_q4", sentence: "Active: \"She has sent the email.\" → Passive: The email _______ _______ sent by her.", blanks: ["has been"], explanation: "Present Perfect passive is 'has/have + been + V3'." },
      { id: "ap_q5", sentence: "Active: \"The government will build a new school.\" → Passive: A new school _______ _______ built.", blanks: ["will be"], explanation: "Future passive is 'will be + V3'." },
      { id: "ap_q6", sentence: "Passive: \"English is spoken in many countries.\" → Active: Many countries _______ English.", blanks: ["speak"], explanation: "Converts back to Present Simple active." },
      { id: "ap_q7", sentence: "This problem _______ (solve) easily with the right tools. (modal passive)", blanks: ["can be solved"], explanation: "Modal passive is 'modal + be + V3'." },
      { id: "ap_q8", sentence: "Active: \"They were harvesting the crops last month.\" → Passive: The crops _______ _______ harvested last month.", blanks: ["were being"], explanation: "Past Continuous passive is 'was/were + being + V3'." },
      { id: "ap_q9", sentence: "The book _______ (write) by Chinua Achebe in 1958. (fill correct passive)", blanks: ["was written"], explanation: "Action is completed in the past, so Past Simple passive." },
      { id: "ap_q10", sentence: "Active: \"Someone has stolen my wallet.\" (Tricky) → Passive: My wallet _______ _______ stolen.", blanks: ["has been"], explanation: "Since the agent 'someone' is unknown, we omit 'by someone' in passive." }
    ] as FillBlankQuestion[]
  },
  grammarCh1to5: {
    title: "Grammar Ch.1–5 Summary",
    chapters: [
      { name: "CH.1 — Parts of Speech", detail: "Noun (Ethiopia, love), Pronoun (he, she), Verb (run, think), Adjective (beautiful, tall), Adverb (quickly, very), Preposition (in, on), Conjunction (and, but), Interjection (Oh! Wow!)" },
      { name: "CH.2 — Tenses Summary", detail: "Present Simple (habit/fact), Past Simple (finished action), Future (prediction), Present Perfect (past → now), Present Continuous (happening now)" },
      { name: "CH.3 — Articles", detail: "'a' before consonant sounds (a book, a university), 'an' before vowel sounds (an apple, an hour), 'the' for specific items known to both." },
      { name: "CH.4 — Prepositions of Time & Place", detail: "at (at 5 o'clock, at night | at school), on (on Monday, on July 4 | on the wall), in (in June, in the morning | in Addis, in the room)" },
      { name: "CH.5 — Conjunctions & Conditionals", detail: "Coordinating (FANBOYS), Subordinating (because, although, if, unless). Zero Conditional (If you heat water, it boils.), First Conditional (If it rains, I will stay home.), Second Conditional (If I were rich, I would travel.)" }
    ],
    questions: [
      { id: "gr_q1", sentence: "She is _______ honest woman who works hard.", blanks: ["an"], explanation: "'honest' starts with a silent 'h' vowel sound, so use 'an'." },
      { id: "gr_q2", sentence: "I saw _______ dog in the street. _______ dog was barking loudly.", blanks: ["a", "The"], explanation: "Introduce a noun with 'a'; refer back to it with specific 'The'." },
      { id: "gr_q3", sentence: "The exam is _______ Monday _______ 8 o'clock _______ the morning.", blanks: ["on", "at", "in"], explanation: "'on' for days, 'at' for time, 'in' for parts of day." },
      { id: "gr_q4", sentence: "He was born _______ 1999 _______ a small village.", blanks: ["in", "in"], explanation: "'in' for years and small or large places." },
      { id: "gr_q5", sentence: "I wanted to come, _______ I was too tired.", blanks: ["but"], explanation: "'but' shows contrast between wanting to come and being tired." },
      { id: "gr_q6", sentence: "_______ she is young, she is very mature.", blanks: ["Although"], explanation: "'Although' introduces a concession clause." },
      { id: "gr_q7", sentence: "By the time I arrived, they already _______ (leave).", blanks: ["had left"], explanation: "Past Perfect used for an action completed before another past action." },
      { id: "gr_q8", sentence: "She _______ (study) English for three years now.", blanks: ["has been studying"], explanation: "Present Perfect Continuous represents action starting in past continuing to now." },
      { id: "gr_q9", sentence: "If I _______ (be) you, I _______ (apologize) immediately. (2nd conditional)", blanks: ["were", "would apologize"], explanation: "Second conditional uses 'were' and 'would + verb' for hypothetical state." },
      { id: "gr_q10", sentence: "If you study hard, you _______ (pass) the exam. (1st conditional)", blanks: ["will pass"], explanation: "First conditional uses Present Simple + 'will + verb'." },
      { id: "gr_q11", sentence: "Identify parts of speech: \"The tall student runs quickly.\" → tall = adjective, runs = verb, quickly = _______.", blanks: ["adverb"], explanation: "'quickly' is an adverb modifying the verb 'runs'." },
      { id: "gr_q12", sentence: "He failed the exam _______ he did not study. (give reason)", blanks: ["because"], explanation: "'because' introduces the cause/reason." }
    ] as FillBlankQuestion[]
  }
};

// ---------------- EMERGING TECHNOLOGIES ----------------
export const EMERGING_TECH_SECTIONS = {
  unit4: {
    title: "Unit 4: Internet of Things (IoT)",
    summary: "The Internet of Things (IoT) is the network of physical objects embedded with electronics, software, sensors, and connectivity enabling them to collect and exchange data.",
    formula: "IoT = Services + Data + Networks + Sensors",
    features: [
      { name: "AI", desc: "Makes devices 'smart' using data collection + algorithms (e.g., smart fridge)." },
      { name: "Connectivity", desc: "Creates small, affordable networks between devices." },
      { name: "Sensors", desc: "Transforms IoT from passive networks into active real-world systems." },
      { name: "Active Engagement", desc: "Introduces interactive, self-engaging systems." },
      { name: "Small Devices", desc: "Enables precision, scalability, and cheaper hardware." }
    ],
    architecture: [
      { layer: "1. Sensing Layer", desc: "Identifies phenomena and collects real-world data.", tech: "Motion, Environmental, Position Sensors & Actuators (which change physical conditions, e.g., shut off power, adjust airflow)." },
      { layer: "2. Network Layer", desc: "Communication channel to transfer data.", tech: "Wi-Fi, Bluetooth, Zigbee, Z-Wave, LoRa, cellular networks." },
      { layer: "3. Data Processing Layer", desc: "Analyzes data and makes decisions.", tech: "Smartwatches, smart home hubs." },
      { layer: "4. Application Layer", desc: "User-centric presentation & execution.", tech: "Smart transport, smart homes, healthcare apps." }
    ],
    history: [
      { period: "1830s–40s", event: "Telegraph (first landline) — first direct machine communication." },
      { period: "1900", event: "First radio voice transmission ('wireless telegraphy')." },
      { period: "1962", event: "Internet began as DARPA project." },
      { period: "1980s", event: "First IoT example: Coca-Cola machine at Carnegie Mellon connected to internet." },
      { period: "1999", event: "Kevin Ashton officially coined the term 'Internet of Things' (RFID as prerequisite)." },
      { period: "2013", event: "IoT evolved using modern Internet, wireless, and MEMS." }
    ],
    prosCons: {
      advantages: ["Improved Customer Engagement", "Technology Optimization", "Reduced Waste", "Enhanced Data Collection"],
      disadvantages: ["Security risks (hackers)", "System bugs corrupting connected units", "No international compatibility standard", "Managing millions of nodes is challenging"]
    },
    questions: [
      { id: "et_u4_q1", question: "What are the main parts of the IoT system?", answer: "Services + Data + Networks + Sensors." },
      { id: "et_u4_q2", question: "What are the security concerns related to IoT?", answer: "Security risks (hackers can steal data), system bugs that can corrupt connected devices, and lack of universal security standards." },
      { id: "et_u4_q3", question: "What is a smart city regarding IoT?", answer: "An urban area that uses IoT sensors, communication networks, and data analytics to optimize city services (e.g., smart lighting, traffic management, waste bin monitoring)." },
      { id: "et_u4_q4", question: "What is the IoT architecture and functions of each layer?", answer: "1) Sensing Layer (gathers data), 2) Network Layer (transfers data), 3) Data Processing Layer (decision making), and 4) Application Layer (executes tasks for users)." },
      { id: "et_u4_q5", question: "What are the advantages and disadvantages of IoT?", answer: "Advantages: better customer engagement, reduced waste, optimization. Disadvantages: security flaws, bugs spread, complexity." }
    ] as ReviewQuestion[]
  },
  unit5: {
    title: "Unit 5: Augmented Reality (AR)",
    summary: "AR is a live view of a physical real-world environment whose elements are enhanced by adding computer-generated digital info in real-time.",
    comparison: [
      { tech: "Virtual Reality (VR)", immersion: "Fully Immersive", reality: "100% digital/artificial", hardware: "HMD headsets (Oculus Rift, HTC Vive)" },
      { tech: "Augmented Reality (AR)", immersion: "Semi-immersive (digital overlays)", reality: "Real world + digital overlay", hardware: "Smartphone cameras, Google Glass" },
      { tech: "Mixed Reality (MR)", immersion: "Interactive hybrid environment", reality: "Real + virtual elements interact", hardware: "HoloLens, Magic Leap (2000+ USD)" }
    ],
    architecture: [
      { part: "1. Infrastructure Tracker Unit", function: "Collects data from the real world (position, orientation) and sends to Processing Unit." },
      { part: "2. Processing Unit", function: "Mixes virtual content with real content to create the augmented view." },
      { part: "3. Visual Unit", function: "Presents the merged reality (Video See-Through vs. Optical See-Through HMD)." }
    ],
    questions: [
      { id: "et_u5_q1", question: "What is the key distinction between VR, AR, and MR?", answer: "VR is 100% digital (isolated). AR overlays digital content onto the real world. MR overlays digital content that actively interacts with real-world objects in real-time." },
      { id: "et_u5_q2", question: "What is Paul Milgram's Reality-Virtuality Continuum?", answer: "A scale showing the progression from the physical Real Environment → Augmented Reality (AR) → Mixed Reality (MR) → Virtual Reality (VR)." },
      { id: "et_u5_q3", question: "What are the main applications of AR in medicine?", answer: "Describing symptoms (AyeDecide simulation), Nursing Care (AccuVein scanner showing veins), Surgery (Augmedics spine CT overlay), and Diabetes management (glucose monitoring Contact Lenses)." }
    ] as ReviewQuestion[]
  },
  unit6: {
    title: "Unit 6: Ethics of Emerging Tech",
    summary: "Ethics needs to be integrated early in the technology life cycle. As technologies expand, they introduce digital privacy and accountability challenges.",
    principles: ["Integrity", "Objectivity", "Competence & Due Care", "Confidentiality", "Professional Behavior"],
    privacy: [
      { category: "Information Privacy", desc: "Right to determine how personal digital data is collected and used." },
      { category: "Communication Privacy", desc: "Right to communicate digitally with the expectation that messages remain confidential." },
      { category: "Individual Privacy", desc: "Right to exist freely online without unwanted interruptions like spam or viruses." }
    ],
    principlesPrivacy: [
      { name: "Data Minimization", mean: "Collect the minimal amount of information necessary." },
      { name: "Transparency", mean: "Provide clear notice of collection purpose and secure opt-ins." },
      { name: "Accuracy", mean: "Maintain information in an accurate, complete, and timely manner." },
      { name: "Security", mean: "Implement proper physical and IT encryption; destroy expired logs." }
    ],
    questions: [
      { id: "et_u6_q1", question: "Why is ethics critical in emerging tech?", answer: "Because ethical issues are often recognized too late ('ethics tends to arrive too late' when the product is already on the market). It must be integrated early." },
      { id: "et_u6_q2", question: "What is the 'logic of the machine' risk?", answer: "Technology can degrade people's willingness to judge and intervene—making human responsibility subservient to machine decisions." }
    ] as ReviewQuestion[]
  },
  unit7: {
    title: "Unit 7: Other Emerging Technologies",
    summary: "Overview of Nanotechnology, Biotech, Blockchain, Cloud, Quantum, Autonomic Computing, Computer Vision, Embedded Systems, and 3D printing.",
    techs: [
      { name: "Nanotechnology", detail: "Science and engineering conducted at 1–100 nanometers. Father is Richard Feynman (1959 'There's Plenty of Room at the Bottom'). 1 nm = 10^-9 meters." },
      { name: "Biotechnology", detail: "Using living organisms to develop products. Coined by Karl Ereky (1919). Includes Genetic Engineering (modifying DNA traits)." },
      { name: "Blockchain", detail: "Decentralized, immutable ledger linked using cryptographic hashes (SHA-256). 3 Pillars: Decentralization, Transparency, Immutability. No transaction costs, only infrastructure." },
      { name: "Cloud & Quantum", detail: "Cloud (IaaS, PaaS, SaaS). Quantum utilizes qubits and superposition (existing in 0 and 1 states simultaneously)." },
      { name: "Autonomic Computing", detail: "Self-managing model (IBM, 2001). 8 characteristics: Self-Awareness, Self-Configuring, Self-Optimizing, Self-Healing, Self-Protecting, Context-Aware, Open, Anticipatory." },
      { name: "Computer Vision", detail: "Gaining high-level understanding from digital images (Image Segmentation, Object Detection, Facial Recognition, Edge Detection)." },
      { name: "Embedded Systems", detail: "Dedicated controllers. Structure: Sensor → A-D Converter → Processor → D-A Converter → Actuator." }
    ],
    questions: [
      { id: "et_u7_q1", question: "What is the nanoscale measurement?", answer: "1 nanometer is 10^-9 meters (1 billionth of a meter). A newspaper sheet is about 100,000 nm thick." },
      { id: "et_u7_q2", question: "Explain the three pillars of Blockchain.", answer: "1. Decentralization (no single controlling entity), 2. Transparency (addresses are hidden but records are visible), 3. Immutability (records cannot be altered once entered)." },
      { id: "et_u7_q3", question: "What are the 8 characteristics of Autonomic Computing?", answer: "Self-Awareness, Self-Configuring, Self-Optimizing, Self-Healing, Self-Protecting, Context-Aware, Open, and Anticipatory." }
    ] as ReviewQuestion[]
  },
  cheatSheet: {
    title: "★ Exam Cheat Sheet",
    points: [
      "IoT Formula: Services + Data + Networks + Sensors. Kevin Ashton coined in 1999.",
      "IoT Layers: Sensing (1) → Network (2) → Data Processing (3) → Application (4).",
      "VR = 100% digital; AR = real world + digital overlay; MR = interactive overlay.",
      "AR Systems Blocks: Tracker Unit + Processing Unit + Visual Unit.",
      "5 Basic Ethical Principles: Integrity, Objectivity, Competence, Confidentiality, Professional Behavior.",
      "Digital Privacy: Information, Communication, and Individual Privacy.",
      "Nanoscale: 1 nm = 10^-9 m. Richard Feynman = father.",
      "Biotech father: Karl Ereky (1919). Edward Jenner = vaccines, Alexander Fleming = penicillin.",
      "Blockchain Pillars: Decentralization, Transparency, Immutability. Uses SHA-256 hashes.",
      "Qubit: Quantum bit existing in superposition (0, 1, or both simultaneously).",
      "Autonomic Computing: Self-managing initiative by IBM in 2001.",
      "Embedded Systems structure: Sensor → A-D Converter → Processor → D-A Converter → Actuator."
    ]
  }
};

// ---------------- MORAL PHILOSOPHY MOCK TEST ----------------
export const PHILOSOPHY_MOCK_TEST = {
  title: "Moral Philosophy Test I",
  institution: "Hawassa University",
  department: "College of Law and Governance, Department of Civics and Ethics",
  allottedTime: "30 Minutes",
  trueFalse: [
    {
      id: "tf_1",
      question: "For any action to be considered a moral action, there must be a choice to act or not to act.",
      correctAnswer: true,
      explanation: "True. Moral responsibility and moral actions presuppose free will and the existence of a choice between alternatives."
    },
    {
      id: "tf_2",
      question: "According to Aristotle, Excellence (virtue) is a trait that is desirable for its own sake.",
      correctAnswer: true,
      explanation: "True. In Nicomachean Ethics, Aristotle argues that virtue or excellence (arete) is intrinsically valuable and desirable for its own sake as a constituent of Eudaimonia (happiness)."
    },
    {
      id: "tf_3",
      question: "If an action is judged morally right or wrong based on its outcome, the judgment is a teleological judgment.",
      correctAnswer: true,
      explanation: "True. Teleology (or consequentialism) judges the morality of actions purely based on their consequences or outcomes."
    },
    {
      id: "tf_4",
      question: "Metaethics addresses issues such as one's obligation to do or not to do a certain act in a particular situation.",
      correctAnswer: false,
      explanation: "False. This describes normative or applied ethics. Metaethics deals with the fundamental nature, semantics, and metaphysics of moral terms, such as what 'good' or 'right' actually mean."
    },
    {
      id: "tf_5",
      question: "The main feature of moral judgments is that they state what one values in life.",
      correctAnswer: true,
      explanation: "True. Moral judgments are evaluative and directly reflect deep core values regarding what is right, fair, or desirable in human conduct."
    }
  ] as TrueFalseQuestion[],
  multipleChoice: [
    {
      id: "mc_1",
      question: "One of the following types of ethics focuses on promoting desirable qualities such as kindness instead of coming up with certain sets of rules that people should adhere to:",
      options: [
        "A. Metaethics",
        "B. Utilitarian Ethics",
        "" + "C. Virtue Ethics",
        "D. Deontological Ethics"
      ],
      correctOption: "C",
      explanation: "Virtue Ethics (Aristotelian) prioritizes character traits and virtues (like kindness, courage) over moral rules or consequential calculations."
    },
    {
      id: "mc_2",
      question: "An issue is considered to be an issue in applied ethics if:",
      options: [
        "A. There is a consensus with regard to the morally right course of action",
        "B. It describes what kind of moral standards one claims to follow",
        "C. The choice involved is a specifically moral choice",
        "D. None of the above"
      ],
      correctOption: "C",
      explanation: "Applied ethics focuses on resolving controversial, specifically moral choices in real-world scenarios (e.g., bioethics, business ethics)."
    },
    {
      id: "mc_3",
      question: "Among the following, one school argues there is no higher authority than a particular society for what is considered to be morally right/wrong:",
      options: [
        "A. Descriptive Ethics",
        "B. Analytic Ethics",
        "C. Utilitarian Ethics",
        "D. None of the above"
      ],
      correctOption: "D",
      explanation: "The correct school is Cultural Relativism (or Ethical Relativism), which claims morality is relative to society. None of the listed options represents this school."
    },
    {
      id: "mc_4",
      question: "One of the following is not a teleological ethical theory:",
      options: [
        "A. Egoism",
        "B. Altruism",
        "C. Divine Command Theory",
        "D. Utilitarianism"
      ],
      correctOption: "C",
      explanation: "Divine Command Theory is deontological/rule-based, holding that actions are right or wrong simply because God commands them, regardless of outcome."
    },
    {
      id: "mc_5",
      question: "One of the following is not correct concerning Aristotle’s conception of happiness:",
      options: [
        "A. Happiness can only be achieved when actions are performed excellently.",
        "B. Theoretical knowledge has to be guided by practical knowledge for moral virtue to be attained.",
        "C. Practical Knowledge is important in making moral decisions because it allows the agent to find the mean in any action.",
        "D. None of the above"
      ],
      correctOption: "D",
      explanation: "All statements A, B, and C are accurate descriptions of Aristotle's ethics, meaning none of them is incorrect. Hence, 'None of the above' is the correct choice."
    },
    {
      id: "mc_6",
      question: "One of the following is not a branch of normative ethics:",
      options: [
        "A. Virtue ethics",
        "B. Deontological ethics",
        "C. Utilitarian ethics",
        "D. None of the above"
      ],
      correctOption: "D",
      explanation: "Virtue, Deontological, and Utilitarian ethics are the three major pillars of normative ethical theory. Therefore, all of them are branches, so 'None of the above' is the answer."
    },
    {
      id: "mc_7",
      question: "According to deontological ethics, the basis for judgment of the moral rightness/wrongness of an action is:",
      options: [
        "A. The pleasure the agent derives from the action",
        "B. The end result of action",
        "C. The intention of the moral agent",
        "D. None of the above"
      ],
      correctOption: "C",
      explanation: "Deontological ethics (Kant) judges actions based on conformity to duty and the good will or moral intention of the actor, not the consequences."
    },
    {
      id: "mc_8",
      question: "One of the following represents the difference between Mill’s and Bentham’s conceptions of utilitarianism:",
      options: [
        "A. Unlike Mill, Bentham argues there is a difference between quality of pleasure",
        "B. Mill argues pleasure is quantifiable while Bentham disagrees",
        "C. Mill gives priority to pleasures of the mind than bodily pleasures while Bentham makes no distinction based on the quality of pleasure",
        "D. None of the above"
      ],
      correctOption: "C",
      explanation: "John Stuart Mill introduced qualitative distinctions ('higher' intellectual vs 'lower' bodily pleasures), while Jeremy Bentham treated all pleasures as qualitatively equal (quantitative calculus)."
    },
    {
      id: "mc_9",
      question: "One of the following is not a variety of Egoism:",
      options: [
        "A. Deontological egoism",
        "B. Ethical egoism",
        "C. Psychological egoism",
        "D. None of the above"
      ],
      correctOption: "A",
      explanation: "Egoism is inherently consequentialist/teleological. There is no such category as 'Deontological egoism'."
    },
    {
      id: "mc_10",
      question: "Normative ethical theories are characterized by:",
      options: [
        "A. An attempt to instill good qualities in the moral agent",
        "B. Setting up a set of rules that the followers can use as a guide for making a morally right action",
        "C. Its promotion of the four cardinal virtues",
        "D. None of the above"
      ],
      correctOption: "B",
      explanation: "Normative theories are characterized by establishing practical guides, principles, or sets of rules to determine morally right conduct."
    }
  ] as MultiChoiceQuestion[]
};

// ---------------- FRESHMAN GEOGRAPHY ----------------
export const GEOGRAPHY_SECTIONS = {
  unit1: {
    title: "Unit 1: Introduction to Geography",
    notes: [
      { subtitle: "1. Meaning of Geography", body: "Geography is the scientific study of the Earth’s physical environment, human activities, and the relationship between them. It explains spatial patterns, locations, and processes happening on Earth." },
      { subtitle: "2. Branches of Geography", body: "• Physical Geography: Studies natural processes and features (landforms, climate, weather, vegetation, soils, oceans, ecosystems).\n• Human Geography: Studies human activities and spatial patterns (population, settlement, economic activities, culture, transportation).\n• Environmental Geography: Integrates physical and human geography; focuses on challenges like climate change, pollution, and land degradation." },
      { subtitle: "3. Importance of Geography", body: "Helps in planning cities, transportation routes, and agriculture; understanding climate, natural hazards, and resource management; supporting international relations; and protecting the environment." },
      { subtitle: "4. Key Concepts of Geography", body: "• Location: Absolute location (latitude & longitude) vs. relative location (direction from another place).\n• Place: Physical features (climate, mountains) and human features (culture, language, economy).\n• Region: Areas grouped by similarities (e.g., East Africa, Rift Valley system).\n• Movement: Migration of people, transfer of ideas, goods, and diseases.\n• Human–Environment Interaction: How humans depend on, modify, and adapt to the environment." },
      { subtitle: "5. Tools of Geography", body: "Maps (physical, political, thematic), Globe, GIS (stores & analyzes spatial data), GPS (global positioning system), and Remote Sensing (satellite-based observations)." }
    ]
  },
  unit2: {
    title: "Unit 2: The Earth and the Solar System",
    notes: [
      { subtitle: "1. Structure of the Solar System", body: "• Sun at the center.\n• 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.\n• Asteroids, comets, meteoroids, and dwarf planets." },
      { subtitle: "2. Earth's Motions", body: "• Rotation: Spins on its axis; takes 24 hours; causes day & night and time differences.\n• Revolution: Orbits the sun; takes 365.25 days; causes seasons." },
      { subtitle: "3. Earth's Structure", body: "• Crust: Thin outer layer (continental and oceanic).\n• Mantle: Semi-molten rock; causes tectonic plate movement due to convection currents.\n• Core: Outer core (liquid) and inner core (solid); generates Earth's magnetic field." },
      { subtitle: "4. Plate Tectonics", body: "The lithosphere is broken into plates moving due to mantle convection currents. Consequences include: Earthquakes, Volcanoes, Mountain formation, and Rift Valleys (e.g., East African Rift Valley)." },
      { subtitle: "5. Major Landforms", body: "Mountains (e.g., Simien Mountains), Plateaus (e.g., Ethiopian Highlands), Plains (e.g., Awash Basin), Valleys (Rift Valley), and Basins (Danakil Depression)." }
    ]
  },
  unit3: {
    title: "Unit 3: Physical Geography of the Earth",
    notes: [
      { subtitle: "1. Weather and Climate", body: "• Weather: Short-term atmospheric conditions.\n• Climate: Average weather of a place for 30+ years.\n• Elements: Temperature, rainfall, humidity, air pressure, wind, sunshine.\n• Factors affecting climate: Latitude, altitude, distance from sea, ocean currents, winds, and relief features." },
      { subtitle: "2. The Atmosphere", body: "• Layers: Troposphere (where weather occurs), Stratosphere (contains the ozone layer), Mesosphere, Thermosphere, Exosphere.\n• Importance: Protects from UV radiation, enables rainfall/climate, and contains essential breathing gases." },
      { subtitle: "3. The Hydrosphere & Water Cycle", body: "• Includes oceans, rivers, lakes, groundwater, and glaciers.\n• Water Cycle: Evaporation → Condensation → Precipitation → Runoff → Infiltration." },
      { subtitle: "4. Natural Vegetation", body: "Forest, Grassland, Savannah, Desert vegetation, and Mountain vegetation." },
      { subtitle: "5. Soil Formation", body: "• Components: Minerals, organic matter, water, and air.\n• Factors of formation: Parent material, climate, living organisms, relief, and time." },
      { subtitle: "6. Environmental Issues & Solutions", body: "• Issues: Land degradation, soil erosion, deforestation, desertification, climate change, water pollution.\n• Solutions: Afforestation, soil conservation, sustainable land use, renewable energy, and environmental education." }
    ]
  }
};

// ---------------- FRESHMAN MATH ----------------
export const MATH_SECTIONS = {
  title: "Freshman Math Unit 2",
  notes: [
    {
      subtitle: "1. SETS",
      body: "• A set is a group of distinct objects: A = {1, 2, 3}.\n• Subset: A ⊆ B means every element in A is also in B.\n• Union: A ∪ B = elements in A, B, or both.\n• Intersection: A ∩ B = common elements."
    },
    {
      subtitle: "2. FUNCTIONS",
      body: "• Function: Map from input → output, like f(x) = x + 2.\n• Injective (one-to-one): Different inputs give different outputs.\n• Surjective (onto): All potential outputs are mapped to.\n• Bijective: Both injective and surjective (perfect one-to-one mapping)."
    },
    {
      subtitle: "3. SIMPLE PROOFS",
      body: "• Proof 1: Sum of two even numbers is even.\n  Let a = 2m and b = 2n. Then a + b = 2m + 2n = 2(m + n), which is divisible by 2 and therefore even.\n\n• Proof 2: No smallest positive rational number.\n  Assume r is the smallest positive rational. But r/2 is also rational and r/2 < r. Contradiction → no smallest positive rational.\n\n• Proof 3: Arithmetic series formula: 1 + 2 + ... + n = n(n+1)/2.\n  Proven by mathematical induction:\n  - Base Case: n=1: 1 = 1(2)/2 = 1 (Holds).\n  - Inductive step: Assume true for n=k. For n=k+1:\n    (1 + 2 + ... + k) + (k + 1) = k(k+1)/2 + (k+1) = (k+1)(k/2 + 1) = (k+1)(k+2)/2. Formula holds!"
    }
  ]
};
