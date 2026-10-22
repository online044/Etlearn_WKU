import { AuthenticCurriculumQuestion } from './mathQuestions';

export const AUTHENTIC_ENGLISH_QUESTIONS_FLEn_1011: AuthenticCurriculumQuestion[] = [
  // ─── UNIT 1: ACADEMIC READING & VOCABULARY ───
  {
    questionText: "Which transitional cohesive device best completes the academic sentence to show an unexpected contrast?\n'The preliminary lab results indicated promising antibacterial efficacy; _______, subsequent clinical trials failed to replicate those findings under physiological conditions.'",
    options: [
      "however",
      "furthermore",
      "consequently",
      "likewise"
    ],
    correctIndex: 0,
    topic: "Cohesive Devices & Discourse Markers",
    unit: "Unit 1",
    chapter: "Chapter 1: Academic Reading",
    difficulty: "easy",
    explanation: "'However' signals a concession or contrast between the promising preliminary lab results and the disappointing clinical outcomes. 'Furthermore' would indicate addition, and 'consequently' indicates a cause-and-effect relationship.",
    amharicExplanation: "'However' (ሆኖም ግን) በሁለት ተቃራኒ ሃሳቦች መካከል ያለውን ልዩነት ለማሳየት የሚያገለግል የኮሂዥን ማያያዣ ቃል ነው።"
  },
  {
    questionText: "Based on academic morphological analysis, what is the meaning of the prefix 'epi-' in the academic term 'epigenetics'?",
    options: [
      "Upon, over, or above",
      "Under or deficient",
      "Against or opposite",
      "Between or among"
    ],
    correctIndex: 0,
    topic: "Morphology & Affixes in Academic English",
    unit: "Unit 1",
    chapter: "Chapter 2: Vocabulary Acquisition",
    difficulty: "medium",
    explanation: "The Greek prefix 'epi-' denotes 'upon', 'above', or 'in addition to'. In genetics, epigenetics refers to heritable phenotypic changes above or on top of alterations to the DNA sequence itself.",
    amharicExplanation: "የግሪክ ቅጥያ 'epi-' ትርጉሙ 'በላይ' (Upon, over, above) ማለት ሲሆን፣ በሳይንሳዊ ቃላት ላይ በብዛት ይገኛል።"
  },

  // ─── UNIT 2: GRAMMAR & SUBJECT-VERB AGREEMENT ───
  {
    questionText: "Select the sentence with impeccable subject-verb agreement for formal university publications:",
    options: [
      "Neither the department dean nor the faculty professors were present at the international symposium.",
      "Neither the department dean nor the faculty professors was present at the international symposium.",
      "The committee have decided to postpone all final examinations indefinitely.",
      "Every one of the submitted laboratory reports are missing standard citations."
    ],
    correctIndex: 0,
    topic: "Subject-Verb Agreement with Correlative Conjunctions",
    unit: "Unit 2",
    chapter: "Chapter 1: Subject-Verb Agreement",
    difficulty: "medium",
    explanation: "When subjects are joined by 'neither... nor', the verb must agree in number with the closer subject. Here 'professors' is plural and adjacent to the verb, requiring the plural verb 'were'. In option D, 'Every one' is singular and requires 'is missing'.",
    amharicExplanation: "በ 'Neither... nor' አረፍተ-ነገር ግሱ ከቅርቡ ባለቤት ጋር መስማማት አለበት። 'professors' ብዙ ቁጥር ስለሆነ 'were' ትክክለኛው ነው።"
  },
  {
    questionText: "Choose the grammatically correct sentence using a collective noun in standard Ethiopian academic English:",
    options: [
      "The Wolkite University research team has published its annual findings in the journal.",
      "The Wolkite University research team have published their annual findings in the journal.",
      "The faculty were unanimous in its decision to introduce modern AI modules.",
      "The jury are ready to announce its final verdict to the court."
    ],
    correctIndex: 0,
    topic: "Collective Nouns & Pronoun Agreement",
    unit: "Unit 2",
    chapter: "Chapter 1: Agreement Rules",
    difficulty: "medium",
    explanation: "When a collective noun ('team') acts as a single unified entity, it takes a singular verb ('has published') and a consistent singular possessive pronoun ('its').",
    amharicExplanation: "የምርምር ቡድኑ (Team) እንደ አንድ አካል ሲታይ ነጠላ ግስ ('has') እና ነጠላ ተውላጠ ስም ('its') ይወስዳል።"
  },

  // ─── UNIT 3: ACTIVE & PASSIVE VOICE IN ACADEMIC WRITING ───
  {
    questionText: "Transform the active sentence into the preferred formal academic passive voice for a scientific methodology report:\n'The graduate students calibrated the spectrophotometer before each measurement series.'",
    options: [
      "The spectrophotometer was calibrated before each measurement series.",
      "The spectrophotometer had been calibrated by the graduate students before.",
      "Calibrating the spectrophotometer was done by graduate students.",
      "The graduate students were calibrating spectrophotometers."
    ],
    correctIndex: 0,
    topic: "Passive Voice in Academic Methodology",
    unit: "Unit 3",
    chapter: "Chapter 1: Academic Voice & Register",
    difficulty: "easy",
    explanation: "In scientific writing, the passive voice emphasizes the experimental procedure ('was calibrated') rather than the specific individuals who performed it, maintaining an objective tone.",
    amharicExplanation: "በሳይንሳዊ የምርምር ጽሁፍ ላይ ከሰዎች ይልቅ ለተከናወነው ተግባር ቅድሚያ በመስጠት 'The spectrophotometer was calibrated...' ይመረጣል።"
  },

  // ─── UNIT 4: CONDITIONAL SENTENCES & MODALITY ───
  {
    questionText: "Complete the sentence with the correct Third Conditional form:\n'If the engineering team _______ the geotechnical core samples earlier, they _______ the embankment collapse.'",
    options: [
      "had examined / would have prevented",
      "examined / would prevent",
      "would have examined / had prevented",
      "had examined / will prevent"
    ],
    correctIndex: 0,
    topic: "Third Conditional: Unreal Past",
    unit: "Unit 4",
    chapter: "Chapter 1: Conditionals & Modals",
    difficulty: "hard",
    explanation: "The Third Conditional expresses an unreal past condition and its hypothetical past consequence. Formula: If + past perfect (had examined), would have + past participle (would have prevented).",
    amharicExplanation: "በ 3ኛው ኮንዲሽናል (ባለፈው ጊዜ ያልተከሰተ ሁኔታ)፡ 'If + had examined, would have prevented' ትክክለኛው የሰዋሰው መዋቅር ነው።"
  },

  // ─── UNIT 5: ACADEMIC ESSAY WRITING & CITATION ───
  {
    questionText: "In academic essay structure, what is the primary role of a 'thesis statement' in the introductory paragraph?",
    options: [
      "To state the central controlling argument or claim of the paper in a single concise assertion",
      "To provide a broad background narrative of world history",
      "To list all references and bibliography in alphabetical order",
      "To summarize all counterarguments without taking a stance"
    ],
    correctIndex: 0,
    topic: "Academic Essay Writing & Thesis Formulation",
    unit: "Unit 5",
    chapter: "Chapter 1: Academic Essays",
    difficulty: "easy",
    explanation: "A thesis statement succinctly articulates the main claim, controlling idea, or argument of an essay, guiding the organization of the subsequent body paragraphs.",
    amharicExplanation: "ቴሲስ ስቴትመንት (Thesis Statement) በጽሁፉ መግቢያ መጨረሻ ላይ የተቀመጠ የሙሉውን ጽሁፍ ዋና ሃሳብና አቋም በአጭሩ የሚገልጽ ነው።"
  }
];

// ─── HAWASSA UNIVERSITY COMMUNICATIVE ENGLISH (HU FLEn 1011) ───
export const AUTHENTIC_ENGLISH_QUESTIONS_HU_1011: AuthenticCurriculumQuestion[] = [
  {
    questionText: "Identify the sentence that contains a comma splice error:",
    options: [
      "The semester exam was challenging, many students studied in the library until midnight.",
      "The semester exam was challenging; however, many students passed with distinction.",
      "Although the semester exam was challenging, many students achieved high marks.",
      "The semester exam was challenging, so students formed weekend study circles."
    ],
    correctIndex: 0,
    topic: "Sentence Mechanics: Comma Splices & Run-ons",
    unit: "Unit 1",
    chapter: "Chapter 1: Sentence Structure",
    difficulty: "medium",
    explanation: "A comma splice occurs when two independent clauses are joined by only a comma without an accompanying coordinating conjunction (FANBOYS). Sentence A incorrectly joins two full clauses with just a comma.",
    amharicExplanation: "ኮማ ስፕላይስ (Comma Splice) ሁለት ራሳቸውን የቻሉ አረፍተ-ነገሮችን ያለ አስተሳሳሪ ቃል በኮማ ብቻ የማያያዝ ስህተት ነው። በምርጫ A ላይ 'challenging,' በኋላ አዲስ ራሱን የቻለ አረፍተ-ነገር መጥቷል።"
  },
  {
    questionText: "Which transitional word or phrase is most appropriate for introducing an illustration or practical case study in an academic paragraph?",
    options: [
      "For instance",
      "Consequently",
      "In contrast",
      "Furthermore"
    ],
    correctIndex: 0,
    topic: "Cohesion & Transitional Devices",
    unit: "Unit 2",
    chapter: "Chapter 1: Paragraph Cohesion",
    difficulty: "easy",
    explanation: "'For instance' and 'For example' serve specifically to introduce illustrative evidence. 'Consequently' introduces a result, 'In contrast' introduces divergence, and 'Furthermore' introduces additional supporting claims.",
    amharicExplanation: "'For instance' (ለምሳሌ ያህል) በማብራሪያ ጽሁፎች ውስጥ ማሳያዎችን እና ተጨባጭ ምሳሌዎችን ለማስተዋወቅ የሚያገለግል የማስተሳሰሪያ ቃል ነው።"
  },
  {
    questionText: "Select the sentence with correct subject-verb agreement:",
    options: [
      "The committee of university deans has submitted its final curriculum review.",
      "The committee of university deans have submitted their final curriculum review.",
      "Neither the lecturer nor the students was present in the auditorium.",
      "Every one of the laboratory samples were contaminated."
    ],
    correctIndex: 0,
    topic: "Subject-Verb Agreement with Collective Nouns",
    unit: "Unit 3",
    chapter: "Chapter 1: Subject-Verb Concord",
    difficulty: "medium",
    explanation: "In standard formal academic English, collective nouns acting as a single unit ('The committee') take singular verbs ('has submitted', 'its'). In option C, proximity rule requires 'were present' (closest to 'students'). In D, 'Every one' is singular ('was contaminated').",
    amharicExplanation: "የጋራ ስም (Collective noun) እንደ አንድ አካል ሲሰራ 'The committee ... has submitted its' ትክክለኛ የሰዋሰው ስምምነት (Subject-Verb agreement) ነው።"
  },
  {
    questionText: "Which sentence correctly converts the direct quote into reported (indirect) speech?\nDirect: Aster said, 'I have completed my research paper today.'",
    options: [
      "Aster said that she had completed her research paper that day.",
      "Aster said that she has completed her research paper today.",
      "Aster said that she completed her research paper today.",
      "Aster said that she would complete her research paper that day."
    ],
    correctIndex: 0,
    topic: "Reported Speech & Backshifting",
    unit: "Unit 4",
    chapter: "Chapter 1: Direct & Indirect Speech",
    difficulty: "medium",
    explanation: "When reporting past speech, present perfect ('have completed') backshifts to past perfect ('had completed'), pronoun 'I' changes to 'she', possessive 'my' changes to 'her', and time adverb 'today' changes to 'that day'.",
    amharicExplanation: "በቀጥታ ንግግር ውስጥ ያለን አረፍተ-ነገር ወደ ተዘዋዋሪ ስንቀይር፡ 'have completed' ወደ 'had completed' ሲቀየር 'today' ደግሞ ወደ 'that day' ይቀየራል።"
  },
  {
    questionText: "Identify the sentence that correctly uses a non-defining (non-restrictive) relative clause with proper punctuation:",
    options: [
      "Wolkite University, which was founded in 2011, has established modern engineering laboratories.",
      "Wolkite University that was founded in 2011 has established modern engineering laboratories.",
      "Wolkite University which was founded in 2011 has established modern engineering laboratories.",
      "Wolkite University, that was founded in 2011, has established modern engineering laboratories."
    ],
    correctIndex: 0,
    topic: "Relative Clauses & Punctuation",
    unit: "Unit 4",
    chapter: "Chapter 2: Relative Pronouns & Clauses",
    difficulty: "medium",
    explanation: "Non-defining relative clauses provide additional, non-essential parenthetical information and must be enclosed in commas and use 'which' (never 'that').",
    amharicExplanation: "ተጨማሪ መረጃን የሚያስተላልፉ አንጻራዊ ሀረጎች (Non-defining relative clauses) በኮማ የሚለዩ ሲሆን 'that' ሳይሆን 'which' ይጠቀማሉ።"
  },
  {
    questionText: "Which modal verb phrase best expresses a logical conclusion or deduction about a past event with high certainty?\n'The lecture hall lights are off and the doors are locked. The professor _______ left already.'",
    options: [
      "must have",
      "should have",
      "might have",
      "could have"
    ],
    correctIndex: 0,
    topic: "Modals of Deduction & Past Certainty",
    unit: "Unit 3",
    chapter: "Chapter 2: Modal Auxiliaries",
    difficulty: "easy",
    explanation: "'Must have + past participle' is used to express a logical conclusion or deduction about the past based on strong circumstantial evidence.",
    amharicExplanation: "ባለፈው ጊዜ አንድ ነገር በእርግጠኝነት መከሰቱን በመረጃ ላይ ተመስርቶ ለመደምደም 'must have' ጥቅም ላይ ይውላል።"
  }
];

