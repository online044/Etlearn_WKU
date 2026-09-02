/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Authentic Initial Dataset for Firestore
 * Complete collections of Books, Chapters, Exams, and Questions for Ethiopian Universities & Grade 12.
 */

import { FirestoreBook, FirestoreChapter, FirestoreExam, FirestoreQuestion, Promotion } from '../types';

export const INITIAL_BOOKS: FirestoreBook[] = [
  {
    id: 'book_freshman_math_1011',
    title: 'Freshman Mathematics for Social & Natural Sciences (Math 1011)',
    description: 'The standard Ethiopian national university freshman curriculum textbook. Covers propositional logic, set theory, the real and complex number system, equations, functions, and analytical geometry.',
    university: 'Wolkite University',
    department: 'Freshman Common Courses',
    academicYear: 'Year 1 (Freshman)',
    course: 'Math 1011',
    subject: 'Mathematics',
    unit: 'Modules 1 to 5',
    accessLevel: 'free',
    allowDownload: true,
    status: 'published',
    pageCount: 220,
    fileSize: 4500000,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'book_freshman_emte_1012',
    title: 'Introduction to Emerging Technologies (EmTe 1012)',
    description: 'Official Ethiopian University common course module on Industry 4.0, Artificial Intelligence, Internet of Things (IoT), Big Data 5Vs, Blockchain architectures, Augmented/Virtual Reality, and Cybersecurity.',
    university: 'Wolkite University',
    department: 'Freshman Common Courses',
    academicYear: 'Year 1 (Freshman)',
    course: 'EmTe 1012',
    subject: 'Emerging Technologies',
    unit: 'Chapters 1 to 6',
    accessLevel: 'free',
    allowDownload: true,
    status: 'published',
    pageCount: 185,
    fileSize: 3800000,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'book_freshman_phys_1011',
    title: 'General Physics: Mechanics, Thermodynamics & Optics (Phys 1011)',
    description: 'Comprehensive physics curriculum for Ethiopian higher education students. Covers vector mechanics, Newtonian dynamics, work-energy theorems, fluid statics, harmonic oscillations, and geometric optics.',
    university: 'Wolkite University',
    department: 'Freshman Common Courses',
    academicYear: 'Year 1 (Freshman)',
    course: 'Phys 1011',
    subject: 'Physics',
    unit: 'Units 1 to 6',
    accessLevel: 'pro',
    allowDownload: true,
    status: 'published',
    pageCount: 240,
    fileSize: 5200000,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'book_freshman_flen_1011',
    title: 'Communicative English Skills I (FLEn 1011)',
    description: 'University freshman communicative skills module focusing on study habits, active academic reading, concord, paragraph coherence, grammatical voice, and oral presentations.',
    university: 'Wolkite University',
    department: 'Freshman Common Courses',
    academicYear: 'Year 1 (Freshman)',
    course: 'FLEn 1011',
    subject: 'Communicative English',
    unit: 'Units 1 to 5',
    accessLevel: 'free',
    allowDownload: true,
    status: 'published',
    pageCount: 140,
    fileSize: 2900000,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'book_freshman_logc_1011',
    title: 'Critical Thinking & Logic (LoCT 1011)',
    description: 'National higher education standard guide on propositional logic, informal fallacies, deductive vs. inductive reasoning, categorical syllogisms, and cognitive biases.',
    university: 'Wolkite University',
    department: 'Freshman Common Courses',
    academicYear: 'Year 1 (Freshman)',
    course: 'LoCT 1011',
    subject: 'Critical Thinking',
    unit: 'Chapters 1 to 5',
    accessLevel: 'pro',
    allowDownload: true,
    status: 'published',
    pageCount: 175,
    fileSize: 3400000,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'book_g12_new_economics',
    title: 'Grade 12 Economics (New Curriculum)',
    description: 'Official Ministry of Education Grade 12 curriculum companion. Explores consumer behavior, indifference curves, market structures, macro aggregates, national income determination, and fiscal policy.',
    university: 'All Ethiopian Universities',
    department: 'Economics',
    academicYear: 'Grade 12',
    course: 'Econ G12',
    subject: 'Economics',
    unit: 'Units 1 to 5',
    accessLevel: 'free',
    allowDownload: true,
    status: 'published',
    pageCount: 160,
    fileSize: 3100000,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  }
];

export const INITIAL_CHAPTERS: FirestoreChapter[] = [
  // Math 1011 - Chapter 1
  {
    id: 'chap_math1011_1',
    bookId: 'book_freshman_math_1011',
    chapterNumber: 1,
    title: 'Propositional Logic & Set Theory',
    intro: 'This chapter provides the foundational logical framework for mathematics and computer science. We examine statements, truth values, logical connectives, truth tables, tautologies, set operations, and Cartesian products.',
    sections: [
      {
        title: '1. Propositions and Truth Values',
        body: 'A proposition is a declarative sentence that is either true (T) or false (F), but not both. For example: "Addis Ababa is the capital of Ethiopia" is a True proposition. Questions, commands, and paradoxes are not propositions.'
      },
      {
        title: '2. Logical Connectives & Truth Tables',
        body: 'Compound propositions are constructed using connectives:\n- Negation (~p): Flips truth value.\n- Conjunction (p ∧ q): True only when BOTH p and q are true.\n- Disjunction (p ∨ q): False only when BOTH p and q are false.\n- Conditional (p → q): False only when p is True and q is False (True implies False is False).\n- Biconditional (p ↔ q): True when both propositions have identical truth values.'
      },
      {
        title: '3. Set Theory & Quantifiers',
        body: 'Sets are collections of well-defined distinct objects. Universal quantifier (∀x) asserts a property holds for all elements, while existential quantifier (∃x) asserts there is at least one element satisfying the predicate.'
      }
    ],
    formulas: [
      { name: 'Conditional Equivalence', formula: 'p → q ≡ ~p ∨ q', description: 'Rewrites an implication as a disjunction with negated antecedent.' },
      { name: 'De Morgan\'s Law for Logic', formula: '~(p ∧ q) ≡ ~p ∨ ~q', description: 'The negation of a conjunction is logically equivalent to the disjunction of the negations.' },
      { name: 'Contrapositive Law', formula: 'p → q ≡ ~q → ~p', description: 'An implication is always logically equivalent to its contrapositive.' }
    ],
    asciiDiagram: `
    +-------+-------+---------+---------+-----------+-----------+
    |   p   |   q   |  p ∧ q  |  p ∨ q  |   p → q   |   p ↔ q   |
    +-------+-------+---------+---------+-----------+-----------+
    |   T   |   T   |    T    |    T    |     T     |     T     |
    |   T   |   F   |    F    |    T    |     F     |     F     |
    |   F   |   T   |    F    |    T    |     T     |     F     |
    |   F   |   F   |    F    |    F    |     T     |     T     |
    +-------+-------+---------+---------+-----------+-----------+
    `,
    examAlert: 'MIDTERM ALERT: Remember that the conditional statement p → q is vacuously TRUE whenever the hypothesis p is FALSE, regardless of whether q is True or False!',
    summary: 'Mastering propositions, truth tables, and equivalence laws is essential for direct and indirect mathematical proofs.',
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  // Math 1011 - Chapter 2
  {
    id: 'chap_math1011_2',
    bookId: 'book_freshman_math_1011',
    chapterNumber: 2,
    title: 'The Real & Complex Number Systems',
    intro: 'Explores the hierarchy of real numbers, algebraic properties, intervals, absolute values, the imaginary unit i, complex numbers in rectangular and polar form, and De Moivre\'s theorem.',
    sections: [
      {
        title: '1. Real Number Subsets & Completeness',
        body: 'Real numbers (ℝ) comprise Natural numbers (ℕ), Integers (ℤ), Rational numbers (ℚ, terminating or repeating decimals), and Irrational numbers (e.g. √2, π, e). The Completeness Axiom guarantees every non-empty subset bounded above has a Least Upper Bound (Supremum).'
      },
      {
        title: '2. Complex Numbers & Operations',
        body: 'A complex number is expressed as z = a + bi, where a = Re(z), b = Im(z), and i = √(-1). Addition and multiplication follow standard polynomial rules with i² = -1. The complex conjugate is z̄ = a - bi.'
      },
      {
        title: '3. Polar Form and De Moivre\'s Theorem',
        body: 'Any complex number z can be represented in polar coordinates as z = r(cos θ + i sin θ) = r e^(iθ), where r = |z| = √(a² + b²) and θ = arg(z). By De Moivre\'s Theorem: [r(cos θ + i sin θ)]^n = r^n (cos(nθ) + i sin(nθ)).'
      }
    ],
    formulas: [
      { name: 'Modulus of Complex Number', formula: '|z| = √(a² + b²)', description: 'Euclidean distance from the origin on the Argand plane.' },
      { name: 'De Moivre\'s Theorem', formula: 'z^n = r^n [cos(nθ) + i sin(nθ)]', description: 'Calculates integer and rational powers and roots of complex numbers.' }
    ],
    examAlert: 'UNIVERSITY EXAM TIP: When calculating roots of unity (z^n = 1), roots are evenly spaced along the unit circle at intervals of 2π/n radians.',
    summary: 'The complex plane provides solutions to polynomial equations that have no real roots.',
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  // Emerging Technologies - Chapter 1
  {
    id: 'chap_emte1012_1',
    bookId: 'book_freshman_emte_1012',
    chapterNumber: 1,
    title: 'Introduction to the Fourth Industrial Revolution (4IR)',
    intro: 'Explores the evolution of industrial revolutions from steam power to cyber-physical systems, disruptive emerging technologies, and their socio-economic impact in Ethiopia and Africa.',
    sections: [
      {
        title: '1. Historical Evolution of Industrial Revolutions',
        body: '- 1IR (1784): Steam engine, mechanization of textile manufacturing.\n- 2IR (1870): Electricity, mass production, assembly line, division of labor.\n- 3IR (1969): Electronics, mainframe computing, automation, and the Internet.\n- 4IR (Present): Cyber-Physical Systems, Artificial Intelligence, IoT, Quantum Computing, and fusion of physical, digital, and biological realms.'
      },
      {
        title: '2. Core Pillars of 4IR',
        body: 'The Fourth Industrial Revolution is distinguished by three key factors: Velocity (exponential growth rate), Breadth & Depth (system-level disruption), and Holistic Impact (reshaping entire governance and economic frameworks).'
      },
      {
        title: '3. Smart Infrastructure & Digital Ethiopia',
        body: 'Adoption of 4IR technologies in Ethiopia accelerates digital payment systems (Telebirr, CBE Birr), precision agriculture drones, tele-education, and digital identity registries (Fayda).'
      }
    ],
    formulas: [
      { name: 'Moore\'s Law', formula: 'Transistors_Count ≈ 2^(t/2)', description: 'Empirical observation that microchip transistor count doubles approximately every two years.' }
    ],
    asciiDiagram: `
    1IR: Steam & Mechanical (1780s)
          │
    2IR: Electrical & Mass Production (1870s)
          │
    3IR: Electronics & Computing (1960s)
          │
    4IR: Cyber-Physical & AI Ecosystems (Today)
    `,
    examAlert: 'EXAM ALERT: Questions frequently ask which revolution introduced Cyber-Physical Systems (CPS) — the answer is strictly the 4th Industrial Revolution (4IR).',
    summary: '4IR creates unprecedented opportunities for leapfrogging traditional development obstacles through digital ecosystems.',
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  // Emerging Technologies - Chapter 2
  {
    id: 'chap_emte1012_2',
    bookId: 'book_freshman_emte_1012',
    chapterNumber: 2,
    title: 'Artificial Intelligence & Machine Learning',
    intro: 'Comprehensive breakdown of Artificial Intelligence paradigms, Alan Turing tests, Supervised/Unsupervised/Reinforcement learning, Deep Neural Networks, and Natural Language Processing.',
    sections: [
      {
        title: '1. Artificial Intelligence Categories',
        body: '- Narrow AI (Weak AI): Designed to perform a specific dedicated task (e.g. Asgobnyi tutor, chess engines, facial recognition).\n- General AI (Strong AI / AGI): Human-level cognition capable of generalizing across diverse intellectual domains.\n- Super AI (ASI): Hypothetical intelligence surpassing human cognitive capacity.'
      },
      {
        title: '2. Machine Learning Paradigms',
        body: '- Supervised Learning: Model learns from labeled dataset (Input X -> Target Y), e.g. regression and classification.\n- Unsupervised Learning: Discovers hidden patterns in unlabeled data, e.g. K-Means clustering and PCA.\n- Reinforcement Learning: Agent takes actions in an environment to maximize cumulative numerical rewards.'
      },
      {
        title: '3. Natural Language Processing & Transformers',
        body: 'NLP enables computational interpretation of human language. Transformer neural architectures employ self-attention mechanisms to understand contextual relationships in text.'
      }
    ],
    formulas: [
      { name: 'Perceptron Activation', formula: 'y = σ(∑(w_i * x_i) + b)', description: 'Fundamental mathematical equation of an artificial neuron with weights, inputs, and bias.' }
    ],
    examAlert: 'TEST TIP: Know the difference between Supervised (labeled data) and Unsupervised (unlabeled data) learning cold!',
    summary: 'AI algorithms transform raw data into predictive intelligence across healthcare, education, and finance.',
    createdAt: '2026-01-15T00:00:00.000Z'
  }
];

export const INITIAL_EXAMS: FirestoreExam[] = [
  {
    id: 'exam_freshman_math1011_midterm',
    title: 'Freshman Mathematics Midterm Examination (Math 1011)',
    description: 'Official Ethiopian University freshman midterm exam testing Propositional Logic, Truth Tables, Real & Complex Numbers, and Relations.',
    university: 'Wolkite University',
    department: 'Freshman Common Courses',
    academicYear: 'Year 1 (Freshman)',
    course: 'Math 1011',
    subject: 'Mathematics',
    examType: 'midterm',
    examYear: '2025/2026',
    durationMinutes: 30,
    totalMarks: 30,
    passingScore: 50,
    totalQuestions: 10,
    accessLevel: 'free',
    allowDownload: true,
    status: 'published',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'exam_freshman_emte1012_final',
    title: 'Emerging Technologies Final Exam Paper (EmTe 1012)',
    description: 'Comprehensive university exit and semester exam covering 4IR, Artificial Intelligence, Big Data, IoT protocols, Cloud/Edge computing, and Blockchain.',
    university: 'Wolkite University',
    department: 'Freshman Common Courses',
    academicYear: 'Year 1 (Freshman)',
    course: 'EmTe 1012',
    subject: 'Emerging Technologies',
    examType: 'final',
    examYear: '2025/2026',
    durationMinutes: 25,
    totalMarks: 30,
    passingScore: 60,
    totalQuestions: 10,
    accessLevel: 'free',
    allowDownload: true,
    status: 'published',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'exam_g12_euee_physics',
    title: 'Grade 12 National University Entrance Exam (EUEE) - Physics',
    description: 'Standardized national entrance exam questions covering classical mechanics, thermodynamics, electromagnetism, and atomic physics.',
    university: 'All Ethiopian Universities',
    department: 'Physics',
    academicYear: 'Grade 12',
    course: 'Phys G12',
    subject: 'Physics',
    examType: 'model',
    examYear: '2025/2026',
    durationMinutes: 30,
    totalMarks: 30,
    passingScore: 60,
    totalQuestions: 10,
    accessLevel: 'pro',
    allowDownload: true,
    status: 'published',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'exam_freshman_logic1011',
    title: 'Logic & Critical Thinking Model Examination (LoCT 1011)',
    description: 'University freshman model test covering categorical syllogisms, informal fallacies, deductive validity, and symbolic translations.',
    university: 'Wolkite University',
    department: 'Freshman Common Courses',
    academicYear: 'Year 1 (Freshman)',
    course: 'LoCT 1011',
    subject: 'Critical Thinking',
    examType: 'midterm',
    examYear: '2025/2026',
    durationMinutes: 25,
    totalMarks: 25,
    passingScore: 60,
    totalQuestions: 8,
    accessLevel: 'free',
    allowDownload: true,
    status: 'published',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  }
];

export const INITIAL_QUESTIONS: FirestoreQuestion[] = [
  // Math 1011 Questions
  {
    id: 'q_math1011_1',
    examId: 'exam_freshman_math1011_midterm',
    questionNumber: 1,
    text: 'What is the contrapositive of the conditional statement: "If a function is differentiable at x = c, then it is continuous at x = c"?',
    textAmharic: 'የዚህ ሁኔታዊ አረፍተ ነገር ተቃራኒ (Contrapositive) የቱ ነው: "አንድ ፈንክሽን በ x = c ላይ ተለዋጭ (differentiable) ከሆነ፣ በ x = c ላይ ቀጣይ (continuous) ነው"?',
    options: [
      { id: 'A', text: 'If a function is continuous at x = c, then it is differentiable at x = c.' },
      { id: 'B', text: 'If a function is not continuous at x = c, then it is not differentiable at x = c.' },
      { id: 'C', text: 'If a function is not differentiable at x = c, then it is not continuous at x = c.' },
      { id: 'D', text: 'A function is differentiable if and only if it is continuous.' }
    ],
    correctAnswerId: 'B',
    explanation: 'The contrapositive of p → q is ~q → ~p. Here, p is "differentiable" and q is "continuous". Therefore, ~q → ~p is "If not continuous, then not differentiable". An implication and its contrapositive are always logically equivalent.',
    explanationAmharic: 'የ p → q ተቃራኒ ~q → ~p ነው። ስለዚህ ቀጣይ ካልሆነ ተለዋጭ መሆን አይችልም። ሁለቱም እኩል እውነትነት አላቸው።',
    difficulty: 'medium',
    points: 3,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'q_math1011_2',
    examId: 'exam_freshman_math1011_midterm',
    questionNumber: 2,
    text: 'Under what truth value assignment for propositions p and q is the conditional proposition (p → q) FALSE?',
    textAmharic: 'የሁኔታዊ አረፍተ ነገር (p → q) ውሸት (False) የሚሆነው በየትኛው ሁኔታ ብቻ ነው?',
    options: [
      { id: 'A', text: 'When p is True and q is True' },
      { id: 'B', text: 'When p is False and q is True' },
      { id: 'C', text: 'When p is True and q is False' },
      { id: 'D', text: 'When p is False and q is False' }
    ],
    correctAnswerId: 'C',
    explanation: 'A conditional statement p → q is false in only ONE case: when the hypothesis p is True, but the conclusion q is False. In all other cases, it is True.',
    explanationAmharic: 'p → q ሐሰት የሚሆነው መነሻው (p) እውነት ሆኖ መደምደሚያው (q) ሐሰት ሲሆን ብቻ ነው።',
    difficulty: 'easy',
    points: 3,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'q_math1011_3',
    examId: 'exam_freshman_math1011_midterm',
    questionNumber: 3,
    text: 'Given the complex number z = 3 - 4i, what is the modulus |z| and complex conjugate z̄?',
    textAmharic: 'ለተሰጠው ኮምፕሌክስ ቁጥር z = 3 - 4i፣ ሞዱለስ |z| እና ኮንጁጌት z̄ ስንት ነው?',
    options: [
      { id: 'A', text: '|z| = 5, z̄ = 3 + 4i' },
      { id: 'B', text: '|z| = 25, z̄ = -3 + 4i' },
      { id: 'C', text: '|z| = 7, z̄ = 3 - 4i' },
      { id: 'D', text: '|z| = 5, z̄ = -3 - 4i' }
    ],
    correctAnswerId: 'A',
    explanation: '|z| = √(3² + (-4)²) = √(9 + 16) = √25 = 5. The complex conjugate changes the sign of the imaginary part: z̄ = 3 + 4i.',
    explanationAmharic: '|z| = √(3² + (-4)²) = 5 ሲሆን፣ ኮንጁጌቱ ምናባዊውን ክፍል ምልክት በመቀየር z̄ = 3 + 4i ይሆናል።',
    difficulty: 'easy',
    points: 3,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'q_math1011_4',
    examId: 'exam_freshman_math1011_midterm',
    questionNumber: 4,
    text: 'Which of the following compound propositions is a TAUTOLOGY (always True)?',
    textAmharic: 'ከሚከተሉት ውስጥ ሁልጊዜ እውነት (Tautology) የሆነው የትኛው ነው?',
    options: [
      { id: 'A', text: 'p ∧ ~p' },
      { id: 'B', text: 'p ∨ ~p' },
      { id: 'C', text: 'p → ~p' },
      { id: 'D', text: 'p ↔ ~p' }
    ],
    correctAnswerId: 'B',
    explanation: 'The Law of Excluded Middle states that p ∨ ~p is always True regardless of the truth value of p.',
    explanationAmharic: 'p ∨ ~p ሁልጊዜ እውነት (Tautology) ነው። አንድ አረፍተ ነገር እውነት ነው ወይም ውሸት ነው።',
    difficulty: 'easy',
    points: 3,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'q_math1011_5',
    examId: 'exam_freshman_math1011_midterm',
    questionNumber: 5,
    text: 'Let A = {1, 2, 3} and B = {a, b}. What is the total number of distinct relations from set A to set B?',
    textAmharic: 'A = {1, 2, 3} እና B = {a, b} ቢሰጡ፣ ከ A ወደ B ስንት የተለያዩ ዝምድናዎች (Relations) መፍጠር ይቻላል?',
    options: [
      { id: 'A', text: '6' },
      { id: 'B', text: '12' },
      { id: 'C', text: '32' },
      { id: 'D', text: '64 (2^6)' }
    ],
    correctAnswerId: 'D',
    explanation: 'The Cartesian product A × B has n(A) * n(B) = 3 * 2 = 6 ordered pairs. A relation from A to B is any subset of A × B. Therefore, total relations = 2^6 = 64.',
    explanationAmharic: 'የ A × B አባላት ብዛት 3 × 2 = 6 ነው። ስለዚህ የንዑስ ስብስቦች (ዝምድናዎች) ብዛት 2^6 = 64 ይሆናል።',
    difficulty: 'hard',
    points: 3,
    createdAt: '2026-01-15T00:00:00.000Z'
  },

  // Emerging Technologies Questions
  {
    id: 'q_emte1012_1',
    examId: 'exam_freshman_emte1012_final',
    questionNumber: 1,
    text: 'Which industrial revolution is characterized by Cyber-Physical Systems (CPS), Artificial Intelligence, and the Internet of Things (IoT)?',
    textAmharic: 'ሳይበር-አካላዊ ስርዓቶች (CPS)፣ አርቲፊሻል ኢንተለጀንስ እና IoT መለያው የሆነው የኢንዱስትሪ አብዮት የቱ ነው?',
    options: [
      { id: 'A', text: 'First Industrial Revolution (1IR)' },
      { id: 'B', text: 'Second Industrial Revolution (2IR)' },
      { id: 'C', text: 'Third Industrial Revolution (3IR)' },
      { id: 'D', text: 'Fourth Industrial Revolution (4IR)' }
    ],
    correctAnswerId: 'D',
    explanation: '4IR represents the fusion of digital, biological, and physical systems with autonomous cyber-physical coordination.',
    explanationAmharic: 'አራተኛው የኢንዱስትሪ አብዮት (4IR) ዲጂታል፣ አካላዊ እና ባዮሎጂካል ቴክኖሎጂዎችን የሚያቀናጅ ነው።',
    difficulty: 'easy',
    points: 3,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'q_emte1012_2',
    examId: 'exam_freshman_emte1012_final',
    questionNumber: 2,
    text: 'Which of the following is NOT one of the traditional "Five V\'s" of Big Data?',
    textAmharic: 'ከሚከተሉት ውስጥ ከቢግ ዳታ 5V ባህሪያት ውስጥ የማይካተተው የቱ ነው?',
    options: [
      { id: 'A', text: 'Volume' },
      { id: 'B', text: 'Velocity' },
      { id: 'C', text: 'Virtualization' },
      { id: 'D', text: 'Veracity' }
    ],
    correctAnswerId: 'C',
    explanation: 'The standard Five Vs are Volume, Velocity, Variety, Veracity, and Value. Virtualization is a cloud computing virtualization technique, not a V of Big Data.',
    explanationAmharic: 'የቢግ ዳታ 5V ባህሪያት Volume, Velocity, Variety, Veracity እና Value ናቸው። Virtualization የክላውድ ቴክኒክ ነው።',
    difficulty: 'medium',
    points: 3,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'q_emte1012_3',
    examId: 'exam_freshman_emte1012_final',
    questionNumber: 3,
    text: 'What machine learning paradigm relies on an agent learning through trial, error, reward penalties, and environmental interaction?',
    textAmharic: 'አንድ ኤጀንት ከባቢው ጋር በመገናኘት በሽልማትና ቅጣት (trial and error) የሚማርበት የ Machine Learning ዓይነት የቱ ነው?',
    options: [
      { id: 'A', text: 'Supervised Learning' },
      { id: 'B', text: 'Unsupervised Learning' },
      { id: 'C', text: 'Reinforcement Learning' },
      { id: 'D', text: 'Heuristic Search' }
    ],
    correctAnswerId: 'C',
    explanation: 'Reinforcement Learning uses reward signals to optimize an agent\'s policy over time in dynamic environments.',
    explanationAmharic: 'ሪኢንፎርስመንት ለርኒንግ (Reinforcement Learning) በሽልማት እና በቅጣት ላይ ተመስርቶ የሚሰራ የ AI ስልት ነው።',
    difficulty: 'easy',
    points: 3,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'q_emte1012_4',
    examId: 'exam_freshman_emte1012_final',
    questionNumber: 4,
    text: 'Which lightweight protocol is designed specifically for constrained IoT devices and telemetry sensor communication?',
    textAmharic: 'ለ IoT መሣሪያዎች እና አነፍናፊዎች (sensors) የተዘጋጀው ቀላሉ እና ፈጣኑ ፕሮቶኮል የትኛው ነው?',
    options: [
      { id: 'A', text: 'MQTT (Message Queuing Telemetry Transport)' },
      { id: 'B', text: 'FTP (File Transfer Protocol)' },
      { id: 'C', text: 'SMTP' },
      { id: 'D', text: 'BGP' }
    ],
    correctAnswerId: 'A',
    explanation: 'MQTT is an ultra-lightweight publish/subscribe messaging protocol tailored for remote sensors with minimal power and bandwidth.',
    explanationAmharic: 'MQTT አነስተኛ ባንድዊድዝ እና ባትሪ ለሚጠቀሙ IoT መሣሪያዎች ተመራጭ ፕሮቶኮል ነው።',
    difficulty: 'medium',
    points: 3,
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'q_emte1012_5',
    examId: 'exam_freshman_emte1012_final',
    questionNumber: 5,
    text: 'What technology creates a real-time, highly accurate virtual simulation of a physical asset, engine, or university campus?',
    textAmharic: 'የአንድን እውነተኛ ዕቃ ወይም ተቋም ትክክለኛ ምናባዊ ቅጂ (simulation) የሚፈጥረው ቴክኖሎጂ ምን ይባላል?',
    options: [
      { id: 'A', text: 'Digital Twin' },
      { id: 'B', text: 'Deepfake' },
      { id: 'C', text: 'Quantum Cryptography' },
      { id: 'D', text: 'Metamaterial' }
    ],
    correctAnswerId: 'A',
    explanation: 'A Digital Twin is a software virtual counterpart of a physical asset receiving real-time IoT sensor telemetry.',
    explanationAmharic: 'ዲጂታል ትዊን (Digital Twin) የአካላዊ እቃዎችን በኮምፒውተር ላይ በቀጥታ የሚከታተል ምናባዊ መንታ ነው።',
    difficulty: 'easy',
    points: 3,
    createdAt: '2026-01-15T00:00:00.000Z'
  }
];
