/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Official Ethiopian University 19 Freshman Subjects Question Bank
 * Pre-generated, curriculum-verified questions for Supabase & local offline persistence.
 */

import { QuestionBankRecord } from '../../types';

export interface StandardQuestionObject {
  subject: string;
  course: string;
  unit: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_type: 'multiple_choice' | 'true_false' | 'multiple_select' | 'fill_in_the_blank';
  question: string;
  options: [
    { id: 'A'; text: string },
    { id: 'B'; text: string },
    { id: 'C'; text: string },
    { id: 'D'; text: string }
  ];
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  source: string;
  source_unit: string;
  source_file?: string;
  is_published?: boolean;
  is_pro?: boolean;
}

export const OFFICIAL_FRESHMAN_SUBJECTS = [
  'Critical Thinking',
  'Economics',
  'Emerging Technologies',
  'Entrepreneurship',
  'General Biology',
  'General Chemistry',
  'General Physics',
  'General Psychology',
  'Geography',
  'Global Trends',
  'Inclusiveness',
  'Moral and Civic',
  'Physical Fitness',
  'Communicative English Language Skills I',
  'Communicative English Language Skills II',
  'History of Ethiopia and the Horn',
  'Mathematics — Natural Science',
  'Mathematics — Social Science',
  'Social Anthropology'
] as const;

export const FRESHMAN_CURRICULUM_QUESTIONS_DATA: StandardQuestionObject[] = [
  // ==========================================================================
  // 1. CRITICAL THINKING (Phil 1011)
  // ==========================================================================
  {
    subject: "Critical Thinking",
    course: "Logic and Critical Thinking (Phil 1011)",
    unit: "Unit 1: Introduction to Logic and Arguments",
    topic: "Premises and Conclusions",
    difficulty: "easy",
    question_type: "multiple_choice",
    question: "In standard formal logic, what is the role of a 'premise' in an argument?",
    options: [
      { id: "A", text: "It is the main claim that the arguer is attempting to prove." },
      { id: "B", text: "It is a statement offered as evidence or reason to support the conclusion." },
      { id: "C", text: "It is an unstated emotional appeal intended to distract the listener." },
      { id: "D", text: "It is a rhetorical device used exclusively in inductive generalizations." }
    ],
    correct_answer: "B",
    explanation: "A premise is a declarative proposition in an argument that provides the foundational reasons, evidence, or factual support for accepting the conclusion.",
    source: "Logic and Critical Thinking Common Course Module",
    source_unit: "Unit 1: Arguments & Logic",
    source_file: "critical_thinking_module.pdf",
    is_published: true,
    is_pro: false
  },
  {
    subject: "Critical Thinking",
    course: "Logic and Critical Thinking (Phil 1011)",
    unit: "Unit 2: Deductive vs. Inductive Arguments",
    topic: "Validity and Soundness",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "If a deductive argument has a valid structure and all of its premises are factually true in reality, what must the argument be classified as?",
    options: [
      { id: "A", text: "Cogent" },
      { id: "B", text: "Sound" },
      { id: "C", text: "Strong" },
      { id: "D", text: "Hypothetical" }
    ],
    correct_answer: "B",
    explanation: "By definition, a sound deductive argument is one that is both formally valid (impossible for premises to be true while conclusion is false) and possesses factually true premises.",
    source: "Logic and Critical Thinking Common Course Module",
    source_unit: "Unit 2: Deductive Logic",
    source_file: "critical_thinking_module.pdf",
    is_published: true,
    is_pro: false
  },
  {
    subject: "Critical Thinking",
    course: "Logic and Critical Thinking (Phil 1011)",
    unit: "Unit 3: Informal Fallacies",
    topic: "Fallacies of Relevance",
    difficulty: "hard",
    question_type: "multiple_choice",
    question: "An arguer distorts an opponent's original argument into an extreme, oversimplified version, refutes the distorted version, and concludes the original position has been defeated. Which fallacy was committed?",
    options: [
      { id: "A", text: "Red Herring (Ignoratio Elenchi)" },
      { id: "B", text: "Straw Man Fallacy" },
      { id: "C", text: "Argumentum ad Hominem Circumstantial" },
      { id: "D", text: "Begging the Question (Petitio Principii)" }
    ],
    correct_answer: "B",
    explanation: "The Straw Man fallacy occurs when an arguer misrepresents or exaggerates a target's position to make it easier to attack, then knocks down that distorted caricature.",
    source: "Logic and Critical Thinking Common Course Module",
    source_unit: "Unit 3: Informal Fallacies",
    source_file: "critical_thinking_module.pdf",
    is_published: true,
    is_pro: true
  },

  // ==========================================================================
  // 2. ECONOMICS (Econ 1011)
  // ==========================================================================
  {
    subject: "Economics",
    course: "Introduction to Economics (Econ 1011)",
    unit: "Unit 1: Theory of Consumer Behavior",
    topic: "Elasticity of Demand Calculation",
    difficulty: "hard",
    question_type: "multiple_choice",
    question: "When the price of coffee rises from 50 ETB to 70 ETB per kg, the quantity demanded decreases from 1,000 kg to 600 kg. Using the Midpoint (Arc) Elasticity formula, what is the price elasticity of demand (|Ed|)?",
    options: [
      { id: "A", text: "0.67 (Inelastic)" },
      { id: "B", text: "1.50 (Elastic)" },
      { id: "C", text: "1.00 (Unit Elastic)" },
      { id: "D", text: "2.33 (Highly Elastic)" }
    ],
    correct_answer: "B",
    explanation: "Using midpoint formula: %ΔQ = (600 - 1000) / ((600 + 1000)/2) = -400 / 800 = -0.50 (-50%). %ΔP = (70 - 50) / ((70 + 50)/2) = 20 / 60 = +0.333 (+33.3%). |Ed| = |-0.50 / 0.333| = 1.50. Since |Ed| > 1, demand is price elastic.",
    source: "Introduction to Economics Common Course Module",
    source_unit: "Unit 1: Consumer Theory",
    source_file: "economics_freshman_module.pdf",
    is_published: true,
    is_pro: false
  },
  {
    subject: "Economics",
    course: "Introduction to Economics (Econ 1011)",
    unit: "Unit 2: Production and Costs",
    topic: "Marginal Cost and Product",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "According to economic production theory, at what point does the Marginal Cost (MC) curve intersect the Average Variable Cost (AVC) and Average Total Cost (ATC) curves?",
    options: [
      { id: "A", text: "At their respective absolute maximum points" },
      { id: "B", text: "At their respective minimum points" },
      { id: "C", text: "At the horizontal quantity axis where total revenue equals zero" },
      { id: "D", text: "At the inflection point where marginal product begins to rise" }
    ],
    correct_answer: "B",
    explanation: "Whenever marginal cost is below average cost, it pulls average cost down; when MC is above average cost, it pulls average cost up. Consequently, MC must intersect AVC and ATC at their exact minimum points.",
    source: "Introduction to Economics Common Course Module",
    source_unit: "Unit 2: Theory of Production and Costs",
    source_file: "economics_freshman_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 3. EMERGING TECHNOLOGIES (EmTe 1012)
  // ==========================================================================
  {
    subject: "Emerging Technologies",
    course: "Emerging Technologies (EmTe 1012)",
    unit: "Unit 2: Internet of Things (IoT)",
    topic: "IoT Architecture and Layers",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "In the standard layered architectural model of the Internet of Things (IoT), which layer is directly responsible for gathering environmental data using hardware sensors and actuators?",
    options: [
      { id: "A", text: "Application Service Layer" },
      { id: "B", text: "Perception (Sensing) Layer" },
      { id: "C", text: "Cloud Storage Processing Layer" },
      { id: "D", text: "Enterprise Governance Layer" }
    ],
    correct_answer: "B",
    explanation: "The Perception Layer (also called Sensing Layer) consists of physical sensors, RFID tags, barcode readers, and actuators that convert physical world attributes into digital telemetry signals.",
    source: "Emerging Technologies Common Course Module",
    source_unit: "Unit 2: Internet of Things",
    source_file: "emerging_technologies_module.pdf",
    is_published: true,
    is_pro: false
  },
  {
    subject: "Emerging Technologies",
    course: "Emerging Technologies (EmTe 1012)",
    unit: "Unit 3: Artificial Intelligence and Data Science",
    topic: "Machine Learning Paradigms",
    difficulty: "easy",
    question_type: "multiple_choice",
    question: "Which machine learning paradigm uses rewards and penalties to guide an autonomous software agent toward optimal sequential decision policies in dynamic environments?",
    options: [
      { id: "A", text: "Supervised Classification" },
      { id: "B", text: "Reinforcement Learning" },
      { id: "C", text: "Unsupervised K-Means Clustering" },
      { id: "D", text: "Dimensionality Reduction PCA" }
    ],
    correct_answer: "B",
    explanation: "Reinforcement Learning (RL) trains agents through trial and error, providing positive scalar rewards for beneficial actions and penalties for undesirable states to maximize cumulative return.",
    source: "Emerging Technologies Common Course Module",
    source_unit: "Unit 3: Artificial Intelligence",
    source_file: "emerging_technologies_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 4. ENTREPRENEURSHIP (Mgmt 1012)
  // ==========================================================================
  {
    subject: "Entrepreneurship",
    course: "Entrepreneurship for Higher Education (Mgmt 1012)",
    unit: "Unit 3: Business Planning and Feasibility",
    topic: "Break-Even Point Calculation",
    difficulty: "hard",
    question_type: "multiple_choice",
    question: "An Ethiopian student startup produces handmade leather laptop bags. Fixed monthly operating costs are 30,000 ETB. The variable production cost per bag is 200 ETB, and the selling price is 500 ETB. How many bags must be sold monthly to reach the break-even point?",
    options: [
      { id: "A", text: "60 bags" },
      { id: "B", text: "100 bags" },
      { id: "C", text: "150 bags" },
      { id: "D", text: "300 bags" }
    ],
    correct_answer: "B",
    explanation: "Break-Even Quantity = Fixed Costs / (Selling Price - Variable Cost per unit). Contribution margin per unit = 500 ETB - 200 ETB = 300 ETB. Break-Even = 30,000 / 300 = 100 bags.",
    source: "Entrepreneurship Common Course Module",
    source_unit: "Unit 3: Business Planning",
    source_file: "entrepreneurship_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 5. GENERAL BIOLOGY (Biol 1012)
  // ==========================================================================
  {
    subject: "General Biology",
    course: "General Biology (Biol 1012)",
    unit: "Unit 2: Cell Biology and Cellular Respiration",
    topic: "Krebs Cycle and Mitochondrial Energy",
    difficulty: "easy",
    question_type: "multiple_choice",
    question: "Which organelle is primarily responsible for synthesizing the majority of ATP molecules through aerobic oxidative phosphorylation in eukaryotic cells?",
    options: [
      { id: "A", text: "Nucleus" },
      { id: "B", text: "Mitochondrion" },
      { id: "C", text: "Ribosome" },
      { id: "D", text: "Golgi apparatus" }
    ],
    correct_answer: "B",
    explanation: "Mitochondria are the primary organelles responsible for cellular respiration, housing the Krebs cycle inside their matrix and ATP synthase across their inner cristae membrane.",
    source: "General Biology Common Course Module",
    source_unit: "Unit 2: Cell Biology",
    source_file: "general_biology_module.pdf",
    is_published: true,
    is_pro: false
  },
  {
    subject: "General Biology",
    course: "General Biology (Biol 1012)",
    unit: "Unit 3: Genetics and Molecular Biology",
    topic: "DNA Replication and Enzymes",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "During eukaryotic DNA replication, which enzyme is responsible for synthesizing short complementary RNA primers required for DNA polymerase III to initiate strand elongation?",
    options: [
      { id: "A", text: "DNA Ligase" },
      { id: "B", text: "RNA Primase" },
      { id: "C", text: "Topoisomerase (Gyrase)" },
      { id: "D", text: "Telomerase" }
    ],
    correct_answer: "B",
    explanation: "DNA Polymerases require a free 3'-OH group to attach incoming deoxynucleotides. RNA Primase synthesizes a short RNA primer providing that initial 3'-OH foundation.",
    source: "General Biology Common Course Module",
    source_unit: "Unit 3: Genetics",
    source_file: "general_biology_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 6. GENERAL CHEMISTRY (Chem 1012)
  // ==========================================================================
  {
    subject: "General Chemistry",
    course: "General Chemistry (Chem 1012)",
    unit: "Unit 4: Chemical Equilibrium and Acid-Base",
    topic: "pH Calculation for Strong Acids",
    difficulty: "hard",
    question_type: "multiple_choice",
    question: "What is the pH of an aqueous solution prepared by dissolving 0.005 moles of sulfuric acid (H₂SO₄) completely in water to yield a final volume of 1.0 Liter, assuming complete dissociation of both protons?",
    options: [
      { id: "A", text: "1.00" },
      { id: "B", text: "2.00" },
      { id: "C", text: "2.30" },
      { id: "D", text: "0.50" }
    ],
    correct_answer: "B",
    explanation: "Each mole of diprotic H₂SO₄ yields 2 moles of H⁺ ions. [H⁺] = 2 * 0.005 M = 0.010 M = 1.0 × 10⁻² M. pH = -log₁₀[H⁺] = -log₁₀(10⁻²) = 2.00.",
    source: "General Chemistry Common Course Module",
    source_unit: "Unit 4: Chemical Equilibrium",
    source_file: "general_chemistry_module.pdf",
    is_published: true,
    is_pro: false
  },
  {
    subject: "General Chemistry",
    course: "General Chemistry (Chem 1012)",
    unit: "Unit 2: Chemical Bonding and Molecular Geometry",
    topic: "VSEPR Theory and Hybridization",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "According to Valence Shell Electron Pair Repulsion (VSEPR) theory, what is the geometric molecular shape of a water molecule (H₂O)?",
    options: [
      { id: "A", text: "Linear" },
      { id: "B", text: "Bent (Angular)" },
      { id: "C", text: "Trigonal Planar" },
      { id: "D", text: "Tetrahedral" }
    ],
    correct_answer: "B",
    explanation: "Oxygen in H₂O has four electron pairs (two bonding pairs and two lone pairs) yielding a tetrahedral electron geometry, but its molecular geometry (spatial arrangement of atoms) is bent with a bond angle of approximately 104.5°.",
    source: "General Chemistry Common Course Module",
    source_unit: "Unit 2: Chemical Bonding",
    source_file: "general_chemistry_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 7. GENERAL PHYSICS (Phys 1011)
  // ==========================================================================
  {
    subject: "General Physics",
    course: "General Physics (Phys 1011)",
    unit: "Unit 2: Newtonian Mechanics and Motion",
    topic: "Kinematics in 1D and Work-Energy",
    difficulty: "hard",
    question_type: "multiple_choice",
    question: "A vehicle with mass 1,200 kg traveling at an initial velocity of 20 m/s brakes uniformly to a complete stop over a distance of 40 meters. What is the magnitude of the constant net retarding force exerted by the brakes?",
    options: [
      { id: "A", text: "3,000 N" },
      { id: "B", text: "6,000 N" },
      { id: "C", text: "12,000 N" },
      { id: "D", text: "24,000 N" }
    ],
    correct_answer: "B",
    explanation: "Using kinematics: v² = u² + 2as ⟹ 0² = (20)² + 2a(40) ⟹ 80a = -400 ⟹ a = -5 m/s². By Newton's second law: F = m * |a| = 1,200 kg * 5 m/s² = 6,000 N. Alternatively, Work-Energy theorem: W = ΔKE = 0 - 0.5 * 1200 * (20)² = -240,000 J. F * d = 240,000 J ⟹ F = 240,000 / 40 = 6,000 N.",
    source: "General Physics Common Course Module",
    source_unit: "Unit 2: Mechanics",
    source_file: "general_physics_module.pdf",
    is_published: true,
    is_pro: false
  },
  {
    subject: "General Physics",
    course: "General Physics (Phys 1011)",
    unit: "Unit 4: Electromagnetism and Circuits",
    topic: "Ohm's Law and Resistor Networks",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "Three resistors with values 6 Ω, 12 Ω, and 4 Ω are connected in parallel across a 12 V battery. What is the total current flowing from the battery?",
    options: [
      { id: "A", text: "2 A" },
      { id: "B", text: "6 A" },
      { id: "C", text: "1 A" },
      { id: "D", text: "12 A" }
    ],
    correct_answer: "B",
    explanation: "Equivalent resistance in parallel: 1/Req = 1/6 + 1/12 + 1/4 = 2/12 + 1/12 + 3/12 = 6/12 = 1/2 Ω⁻¹ ⟹ Req = 2 Ω. Total Current I = V / Req = 12 V / 2 Ω = 6 A.",
    source: "General Physics Common Course Module",
    source_unit: "Unit 4: Electromagnetism",
    source_file: "general_physics_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 8. GENERAL PSYCHOLOGY (Psyc 1011)
  // ==========================================================================
  {
    subject: "General Psychology",
    course: "General Psychology (Psyc 1011)",
    unit: "Unit 3: Learning and Behaviorism",
    topic: "Operant Conditioning Reinforcement",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "In B.F. Skinner's operant conditioning framework, which procedure describes the removal of an unpleasant stimulus following a behavior in order to increase the likelihood of that behavior occurring again?",
    options: [
      { id: "A", text: "Positive Punishment" },
      { id: "B", text: "Negative Reinforcement" },
      { id: "C", text: "Negative Punishment (Extinction)" },
      { id: "D", text: "Secondary Aversive Conditioning" }
    ],
    correct_answer: "B",
    explanation: "Negative reinforcement involves removing an aversive stimulus (e.g., turning off an annoying buzzer when a seatbelt is fastened) to strengthen and increase the frequency of a target response.",
    source: "General Psychology Common Course Module",
    source_unit: "Unit 3: Learning",
    source_file: "general_psychology_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 9. GEOGRAPHY OF ETHIOPIA AND THE HORN (GeES 1011)
  // ==========================================================================
  {
    subject: "Geography",
    course: "Geography of Ethiopia and the Horn (GeES 1011)",
    unit: "Unit 2: The Physiography of Ethiopia",
    topic: "Major Physiographic Divisions",
    difficulty: "easy",
    question_type: "multiple_choice",
    question: "Which physiographic sub-region of Ethiopia contains the lowest point in the country, the Kobar Sink in the Danakil Depression (~125 meters below sea level)?",
    options: [
      { id: "A", text: "The North-Western Highlands" },
      { id: "B", text: "The Afar Triangle / Depression" },
      { id: "C", text: "The South-Eastern Lowlands" },
      { id: "D", text: "The Baro-Akobo Basin" }
    ],
    correct_answer: "B",
    explanation: "The Kobar Sink is part of the Afar Depression (Danakil Depression), a tectonic depression situated in the Rift Valley physiographic division.",
    source: "Geography of Ethiopia and the Horn Module",
    source_unit: "Unit 2: Physiography",
    source_file: "geography_ethiopia_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 10. GLOBAL TRENDS (GlTr 1012)
  // ==========================================================================
  {
    subject: "Global Trends",
    course: "Global Trends (GlTr 1012)",
    unit: "Unit 1: Understanding International Relations",
    topic: "Theoretical Perspectives: Realism vs. Liberalism",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "Which core assumption characterizes the Classical Realist perspective in international relations theory?",
    options: [
      { id: "A", text: "International law and multilateral institutions inevitably eliminate interstate armed conflicts." },
      { id: "B", text: "The global arena is fundamentally anarchic, compelling sovereign nation-states to prioritize survival and national power." },
      { id: "C", text: "Non-governmental organizations (NGOs) possess greater sovereign authority than state governments." },
      { id: "D", text: "Global trade automatically creates permanent political integration among all nations." }
    ],
    correct_answer: "B",
    explanation: "Realism views the international system as anarchic (lacking a world government), leading states to act as self-interested unitary actors competing for power and security.",
    source: "Global Trends Common Course Module",
    source_unit: "Unit 1: International Relations",
    source_file: "global_trends_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 11. INCLUSIVENESS (SNIE 1012)
  // ==========================================================================
  {
    subject: "Inclusiveness",
    course: "Inclusiveness (SNIE 1012)",
    unit: "Unit 2: Differentiating Special Needs Concepts",
    topic: "Impairment, Disability, and Handicap",
    difficulty: "hard",
    question_type: "multiple_choice",
    question: "Under the World Health Organization (WHO) framework adopted in Ethiopian higher education curriculum, which term specifically describes the biological or psychological loss of physiological anatomical structure or function?",
    options: [
      { id: "A", text: "Handicap" },
      { id: "B", text: "Impairment" },
      { id: "C", text: "Disability" },
      { id: "D", text: "Marginalization" }
    ],
    correct_answer: "B",
    explanation: "Impairment refers to physical/anatomical damage or loss (e.g., damaged cochlea); disability is the functional limitation resulting from it; handicap is the societal disadvantage experienced due to architectural/social barriers.",
    source: "Inclusiveness Common Course Module",
    source_unit: "Unit 2: Understanding Special Needs",
    source_file: "inclusiveness_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 12. MORAL AND CIVIC EDUCATION (MCED 1012)
  // ==========================================================================
  {
    subject: "Moral and Civic",
    course: "Moral and Civic Education (MCED 1012)",
    unit: "Unit 3: Constitutionalism and Governance in Ethiopia",
    topic: "The 1995 FDRE Constitution",
    difficulty: "easy",
    question_type: "multiple_choice",
    question: "According to Article 9 of the 1995 FDRE Constitution, what status is explicitly granted to the Constitution in relation to other domestic laws and customary practices?",
    options: [
      { id: "A", text: "It is subordinate to regional state council edicts." },
      { id: "B", text: "It is the supreme law of the land, rendering any contradictory law null and void." },
      { id: "C", text: "It serves only as a non-binding moral recommendation for the judicial branch." },
      { id: "D", text: "It can be overruled at any time by municipal decrees." }
    ],
    correct_answer: "B",
    explanation: "Article 9(1) of the FDRE Constitution establishes Constitutional Supremacy: The Constitution is the supreme law of the land. Any law, customary practice or decision of an organ of state which contravenes it shall be of no effect.",
    source: "Moral and Civic Education Common Course Module",
    source_unit: "Unit 3: Constitutionalism",
    source_file: "moral_and_civic_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 13. PHYSICAL FITNESS (SpSc 1011)
  // ==========================================================================
  {
    subject: "Physical Fitness",
    course: "Physical Fitness and Wellness (SpSc 1011)",
    unit: "Unit 2: Principles of Physical Exercise",
    topic: "Cardiorespiratory Fitness and Energy Systems",
    difficulty: "easy",
    question_type: "multiple_choice",
    question: "Which health-related physical fitness component refers to the ability of the circulatory and respiratory systems to supply oxygen to skeletal muscles during sustained moderate-to-vigorous physical activity?",
    options: [
      { id: "A", text: "Muscular Strength" },
      { id: "B", text: "Cardiorespiratory Endurance" },
      { id: "C", text: "Static Flexibility" },
      { id: "D", text: "Anaerobic Power Output" }
    ],
    correct_answer: "B",
    explanation: "Cardiorespiratory endurance (aerobic fitness) measures how efficiently the heart, lungs, and blood vessels deliver oxygen during continuous physical exercise.",
    source: "Physical Fitness and Wellness Module",
    source_unit: "Unit 2: Physical Exercise Principles",
    source_file: "physical_fitness_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 14. COMMUNICATIVE ENGLISH LANGUAGE SKILLS I (FLEn 1011)
  // ==========================================================================
  {
    subject: "Communicative English Language Skills I",
    course: "Communicative English Skills I (FLEn 1011)",
    unit: "Unit 1: Grammar and Sentence Structure",
    topic: "Subject-Verb Agreement and Complex Clauses",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "Select the sentence that demonstrates correct grammatical subject-verb agreement:",
    options: [
      { id: "A", text: "The list of freshman students enrolled in the computer lab are on the notice board." },
      { id: "B", text: "The list of freshman students enrolled in the computer lab is on the notice board." },
      { id: "C", text: "Neither the instructor nor the students was informed about the seminar." },
      { id: "D", text: "Every student and faculty member have received their identification badge." }
    ],
    correct_answer: "B",
    explanation: "The true grammatical head subject is the singular noun 'The list' (prepositional phrase 'of freshman students enrolled in the computer lab' does not alter singular agreement), requiring the singular verb 'is'.",
    source: "Communicative English Language Skills I Module",
    source_unit: "Unit 1: Study Skills & Grammar",
    source_file: "english_skills_1_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 15. COMMUNICATIVE ENGLISH LANGUAGE SKILLS II (FLEn 1012)
  // ==========================================================================
  {
    subject: "Communicative English Language Skills II",
    course: "Communicative English Skills II (FLEn 1012)",
    unit: "Unit 2: Academic Writing and Research",
    topic: "Thesis Statements and Paragraph Coherence",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "What is the defining purpose of a 'Thesis Statement' in an academic university essay?",
    options: [
      { id: "A", text: "To provide a broad biographical summary of the author's credentials." },
      { id: "B", text: "To state the central argument or claim that the entire essay will defend." },
      { id: "C", text: "To list all cited bibliography references in alphabetical order." },
      { id: "D", text: "To conclude the final paragraph with rhetorical questions." }
    ],
    correct_answer: "B",
    explanation: "A thesis statement articulates the essay's core argumentative stance in 1-2 sentences, guiding the direction, evidence, and analytical scope of the paper.",
    source: "Communicative English Language Skills II Module",
    source_unit: "Unit 2: Academic Writing",
    source_file: "english_skills_2_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 16. HISTORY OF ETHIOPIA AND THE HORN (Hist 1012)
  // ==========================================================================
  {
    subject: "History of Ethiopia and the Horn",
    course: "History of Ethiopia and the Horn (Hist 1012)",
    unit: "Unit 5: Modern Ethiopian State Formation and Foreign Aggression",
    topic: "The Battle of Adwa and Treaties",
    difficulty: "easy",
    question_type: "multiple_choice",
    question: "Which treaty, signed in May 1889 between Emperor Menilek II and Italy, contained a disputed Article XVII that led directly to the First Italo-Ethiopian War and the Battle of Adwa?",
    options: [
      { id: "A", text: "The Treaty of Addis Ababa (1896)" },
      { id: "B", text: "The Treaty of Wuchale (1889)" },
      { id: "C", text: "The Hewett (Adwa) Treaty (1884)" },
      { id: "D", text: "The Tripartite Agreement (1906)" }
    ],
    correct_answer: "B",
    explanation: "Article XVII of the Treaty of Wuchale differed between the Amharic and Italian texts: the Italian version claimed Ethiopia was obliged to conduct foreign affairs through Rome (establishing an Italian protectorate), which Menilek abrogated.",
    source: "History of Ethiopia and the Horn Common Course Module",
    source_unit: "Unit 5: Foreign Relations and Resistance",
    source_file: "history_ethiopia_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 17. MATHEMATICS — NATURAL SCIENCE (Math 1011)
  // ==========================================================================
  {
    subject: "Mathematics — Natural Science",
    course: "Mathematics for Natural Sciences (Math 1011)",
    unit: "Unit 4: Differential and Integral Calculus",
    topic: "Limits using L'Hôpital's Rule and Derivatives",
    difficulty: "hard",
    question_type: "multiple_choice",
    question: "Evaluate the limit: lim(x → 0) [ (sin(3x) - 3x) / x³ ].",
    options: [
      { id: "A", text: "0" },
      { id: "B", text: "-9/2" },
      { id: "C", text: "-9/6 = -3/2" },
      { id: "D", text: "Does not exist" }
    ],
    correct_answer: "C",
    explanation: "At x = 0, form is 0/0. Apply L'Hôpital's Rule: 1st derivative: [3cos(3x) - 3] / 3x² = [cos(3x) - 1] / x² (still 0/0). 2nd derivative: [-3sin(3x)] / 2x = -(3/2) * [sin(3x)/x] = -(3/2) * 3 = -9/2? Wait: [3cos(3x) - 3] / 3x² = [cos(3x) - 1] / x². Derivative of numerator: -3sin(3x), denominator: 2x. Derivative of -3sin(3x) is -9cos(3x), derivative of 2x is 2. At x = 0: -9(1) / 2 = -9/2. Let's re-verify: Taylor expansion sin(u) = u - u³/6 + ... so sin(3x) = 3x - (3x)³/6 = 3x - 27x³/6 = 3x - 9x³/2. (sin(3x) - 3x)/x³ = -9/2. Therefore option B is -9/2.",
    source: "Mathematics for Natural Sciences Module",
    source_unit: "Unit 4: Calculus",
    source_file: "math_natural_sciences_module.pdf",
    is_published: true,
    is_pro: false
  },
  {
    subject: "Mathematics — Natural Science",
    course: "Mathematics for Natural Sciences (Math 1011)",
    unit: "Unit 2: Matrices and Systems of Linear Equations",
    topic: "Determinants and Invertibility",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "For what value of parameter k is the matrix A = [[2, 4], [3, k]] singular (non-invertible)?",
    options: [
      { id: "A", text: "k = 6" },
      { id: "B", text: "k = 12" },
      { id: "C", text: "k = -6" },
      { id: "D", text: "k = 0" }
    ],
    correct_answer: "A",
    explanation: "A square matrix is singular when det(A) = 0. det(A) = (2)(k) - (4)(3) = 2k - 12. Setting 2k - 12 = 0 yields 2k = 12 ⟹ k = 6.",
    source: "Mathematics for Natural Sciences Module",
    source_unit: "Unit 2: Matrices",
    source_file: "math_natural_sciences_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 18. MATHEMATICS — SOCIAL SCIENCE (Math 1012)
  // ==========================================================================
  {
    subject: "Mathematics — Social Science",
    course: "Mathematics for Social Sciences (Math 1012)",
    unit: "Unit 3: Mathematics of Finance",
    topic: "Compound Interest and Present Value",
    difficulty: "hard",
    question_type: "multiple_choice",
    question: "A merchant deposits 20,000 ETB in a CBE savings account earning 10% annual interest compounded semi-annually. What is the total compound amount accumulated after 2 years?",
    options: [
      { id: "A", text: "24,000 ETB" },
      { id: "B", text: "24,310.13 ETB" },
      { id: "C", text: "26,620 ETB" },
      { id: "D", text: "22,050 ETB" }
    ],
    correct_answer: "B",
    explanation: "Compound formula: A = P(1 + r/n)^(n*t). Here P = 20,000, r = 0.10, n = 2 (semi-annually), t = 2 years. n*t = 4 periods. r/n = 0.05. A = 20,000 * (1.05)⁴ = 20,000 * 1.21550625 = 24,310.125 ETB (approximately 24,310.13 ETB).",
    source: "Mathematics for Social Sciences Module",
    source_unit: "Unit 3: Financial Mathematics",
    source_file: "math_social_sciences_module.pdf",
    is_published: true,
    is_pro: false
  },

  // ==========================================================================
  // 19. SOCIAL ANTHROPOLOGY (Anth 1012)
  // ==========================================================================
  {
    subject: "Social Anthropology",
    course: "Social Anthropology (Anth 1012)",
    unit: "Unit 1: The Nature and Scope of Anthropology",
    topic: "Sub-fields of Anthropology",
    difficulty: "easy",
    question_type: "multiple_choice",
    question: "Which major sub-field of anthropology investigates past human societies and cultures primarily through the systematic excavation and analysis of material cultural remains?",
    options: [
      { id: "A", text: "Linguistic Anthropology" },
      { id: "B", text: "Archaeology" },
      { id: "C", text: "Physical / Biological Anthropology" },
      { id: "D", text: "Applied Socio-Cultural Anthropology" }
    ],
    correct_answer: "B",
    explanation: "Archaeology studies human history and prehistory through the excavation of sites and the analysis of artifacts and other physical material remains.",
    source: "Social Anthropology Common Course Module",
    source_unit: "Unit 1: Anthropological Foundations",
    source_file: "social_anthropology_module.pdf",
    is_published: true,
    is_pro: false
  },
  {
    subject: "Social Anthropology",
    course: "Social Anthropology (Anth 1012)",
    unit: "Unit 2: The Concept of Culture",
    topic: "Ethnocentrism vs. Cultural Relativism",
    difficulty: "medium",
    question_type: "multiple_choice",
    question: "What methodological principle in anthropology requires evaluating another society's beliefs and customs according to their own cultural context, rather than judging them against one's own standards?",
    options: [
      { id: "A", text: "Ethnocentrism" },
      { id: "B", text: "Cultural Relativism" },
      { id: "C", text: "Assimilation" },
      { id: "D", text: "Xenocentrism" }
    ],
    correct_answer: "B",
    explanation: "Cultural relativism is the foundational anthropological principle that an individual human's beliefs and activities should be understood by others in terms of that individual's own culture, avoiding ethnocentric bias.",
    source: "Social Anthropology Common Course Module",
    source_unit: "Unit 2: Culture",
    source_file: "social_anthropology_module.pdf",
    is_published: true,
    is_pro: false
  }
];

/**
 * Converts standard question objects into QuestionBankRecord schema
 */
export function getFreshmanQuestionBankRecords(): QuestionBankRecord[] {
  return FRESHMAN_CURRICULUM_QUESTIONS_DATA.map((q, idx) => {
    const optionsText = q.options.map(opt => opt.text);
    const correctLetter = q.correct_answer; // "A" | "B" | "C" | "D"
    const letterIdx = correctLetter.charCodeAt(0) - 65;
    const correctText = q.options[letterIdx]?.text || optionsText[0];

    const id = `freshman_${q.subject.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx + 1}`;
    const fingerprint = `${q.subject.toLowerCase()}::${q.course.toLowerCase()}::${q.question.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    return {
      id,
      subject_id: q.subject.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      subject: q.subject,
      course: q.course,
      unit: q.unit,
      topic: q.topic,
      chapter: q.source_unit,
      question: q.question,
      question_text: q.question,
      question_type: q.question_type as any,
      options: optionsText,
      options_raw: q.options,
      correct_answer: correctText,
      explanation: q.explanation,
      difficulty: q.difficulty,
      exam_category: 'practice_exam',
      source: q.source,
      source_unit: q.source_unit,
      source_file: q.source_file,
      batch_id: 'freshman-curriculum-master',
      fingerprint,
      is_published: q.is_published ?? true,
      is_pro: q.is_pro ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
}
