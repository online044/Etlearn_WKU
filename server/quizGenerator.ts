/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Pro-Grade Academic Quiz Generator
 * Generates verified, subject-specific multiple choice questions aligned with Ethiopian University
 * and National Entrance Examination (EUEE) standards.
 */

import { GoogleGenAI } from '@google/genai';
import { getMasterApiKey } from './ai';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizGenerationParams {
  subject: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  qCount?: number;
  customNeeds?: string;
  language?: 'en' | 'am';
}

/**
 * Curated offline fallback bank organized STRICTLY by subject.
 * Under NO circumstances should questions from different subjects be mixed together.
 */
export const SUBJECT_CURATED_BANKS: Record<string, QuizQuestion[]> = {
  "Mathematics": [
    {
      question: "What is the derivative of f(x) = 3x^4 - 5x^2 + 7 with respect to x?",
      options: ["12x^3 - 10x", "12x^3 - 5x + 7", "7x^3 - 10x", "12x^4 - 10x^2"],
      correctAnswer: "12x^3 - 10x",
      explanation: "Using the power rule d/dx(x^n) = n*x^(n-1): d/dx(3x^4) = 12x^3, d/dx(-5x^2) = -10x, and the derivative of a constant (7) is 0."
    },
    {
      question: "Evaluate the limit: lim(x -> 0) [sin(5x) / x].",
      options: ["5", "1", "0", "Does not exist"],
      correctAnswer: "5",
      explanation: "Using the standard limit theorem lim(u -> 0) [sin(u)/u] = 1, lim(x -> 0) [sin(5x)/x] = 5 * lim(x -> 0) [sin(5x)/(5x)] = 5 * 1 = 5."
    },
    {
      question: "In linear algebra, if matrix A has a determinant det(A) = 0, which statement is always true?",
      options: ["Matrix A is singular and non-invertible", "Matrix A is symmetric", "Matrix A is an identity matrix", "The eigenvalues of A are all equal to 1"],
      correctAnswer: "Matrix A is singular and non-invertible",
      explanation: "A square matrix is invertible if and only if its determinant is non-zero. When det(A) = 0, the matrix is singular and has no multiplicative inverse."
    },
    {
      question: "What is the integral ∫ (2x + 3)^4 dx?",
      options: ["(1/10)(2x + 3)^5 + C", "(1/5)(2x + 3)^5 + C", "(2/5)(2x + 3)^5 + C", "(1/8)(2x + 3)^4 + C"],
      correctAnswer: "(1/10)(2x + 3)^5 + C",
      explanation: "Let u = 2x + 3, then du = 2 dx or dx = du/2. The integral becomes (1/2) ∫ u^4 du = (1/2) * (u^5 / 5) + C = (1/10)(2x + 3)^5 + C."
    },
    {
      question: "What are the eigenvalues of the 2x2 matrix [[2, 0], [0, 5]]?",
      options: ["2 and 5", "0 and 7", "10 and 1", "-2 and -5"],
      correctAnswer: "2 and 5",
      explanation: "For any diagonal or triangular matrix, the eigenvalues are simply the entries along the main diagonal, which are 2 and 5."
    }
  ],
  "General Biology": [
    {
      question: "What primary chemical organelle hosts the aerobic Krebs (Citric Acid) Cycle within eukaryotic cells?",
      options: ["The inner mitochondrial matrix", "Cytosolic ribosomes", "Nucleolar envelope membranes", "Lysosome digestion vesicles"],
      correctAnswer: "The inner mitochondrial matrix",
      explanation: "While glycolysis happens in the cytoplasm, the Citric Acid Cycle occurs inside the mitochondrial matrix to synthesize NADH, FADH2, and ATP precursors."
    },
    {
      question: "Which cellular cycle phase replicates genomic DNA to prepare cells for mitotic division?",
      options: ["S (Synthesis) phase of Interphase", "G0 stagnant resting stage", "Prophase spindle convergence", "Telophase cytokinesis split"],
      correctAnswer: "S (Synthesis) phase of Interphase",
      explanation: "DNA replication is carried out during the S-phase (Synthesis phase) of the cell cycle, ensuring each resulting daughter cell inherits a complete duplicate genome."
    },
    {
      question: "During light-dependent photosynthetic reactions in chloroplasts, where is molecular oxygen (O2) derived from?",
      options: ["The photolysis (splitting) of water molecules", "Carbon dioxide fixation in the Calvin cycle", "The degradation of glucose monomers", "ATP synthase catalytic activity"],
      correctAnswer: "The photolysis (splitting) of water molecules",
      explanation: "Light energy absorbed by Photosystem II oxidizes and splits water (H2O) into protons, electrons, and O2 gas as a byproduct."
    },
    {
      question: "Which enzyme is responsible for synthesizing mRNA from a DNA template during transcription?",
      options: ["RNA Polymerase II", "DNA Ligase", "DNA Polymerase III", "Peptidyl Transferase"],
      correctAnswer: "RNA Polymerase II",
      explanation: "RNA Polymerase binds to the gene promoter region and transcribes the DNA sequence into messenger RNA (mRNA)."
    },
    {
      question: "In Mendelian genetics, what is the expected phenotypic ratio in the F2 generation of a monohybrid cross with complete dominance?",
      options: ["3:1", "1:2:1", "9:3:3:1", "1:1"],
      correctAnswer: "3:1",
      explanation: "Crossing two heterozygous parents (Aa x Aa) yields 1 AA, 2 Aa, and 1 aa, resulting in a 3:1 ratio of dominant to recessive phenotypes."
    }
  ],
  "Emerging Technologies": [
    {
      question: "Which technology acts as the underlying decentralized ledger enabling verifiable trust without central intermediaries?",
      options: ["Blockchain distributed ledgers", "Centralized relational databases", "Quantum supercomputing nodes", "Edge mesh radios"],
      correctAnswer: "Blockchain distributed ledgers",
      explanation: "Blockchain technology employs decentralized cryptographic consensus mechanisms (PoW/PoS) to secure ledgers without relying on centralized banks or authorities."
    },
    {
      question: "What is the primary operational advantage of implementing Edge Computing in IoT sensor networks?",
      options: ["Reduced latency by processing data closer to local source devices", "Higher centralization in distant global cloud hubs", "Increased long-haul bandwidth consumption", "Lower computational requirements on microcontrollers"],
      correctAnswer: "Reduced latency by processing data closer to local source devices",
      explanation: "Edge processing analyzes data directly at or near the collection node, cutting transmission latency to distant cloud servers and saving precious network bandwidth."
    },
    {
      question: "In Machine Learning, what type of learning paradigm trains algorithms using explicitly labeled input-output pairs?",
      options: ["Supervised Learning", "Unsupervised Clustering", "Reinforcement Learning", "Self-Organizing Heuristic Learning"],
      correctAnswer: "Supervised Learning",
      explanation: "Supervised learning algorithms are provided with pairs of inputs and corresponding ground-truth targets (labels) to learn a mapping function."
    },
    {
      question: "What is the primary purpose of a Smart Contract deployed on the Ethereum virtual machine?",
      options: ["To automatically execute contractual agreements when predefined conditions are satisfied", "To physically secure hardware mining rigs", "To generate GPU clock speed profiles", "To compress video files for distributed streaming"],
      correctAnswer: "To automatically execute contractual agreements when predefined conditions are satisfied",
      explanation: "Smart contracts are autonomous, self-executing code blocks living on a blockchain that execute logic automatically without third-party arbitration."
    },
    {
      question: "Which foundational technology provides the physical connectivity and sensory perception layer for Industry 4.0 smart factories?",
      options: ["Internet of Things (IoT) sensors and actuators", "Centralized punch-card mainframes", "Analog radio broadcast towers", "Floppy disk magnetic storage"],
      correctAnswer: "Internet of Things (IoT) sensors and actuators",
      explanation: "IoT sensors, microcontrollers, and actuators collect operational metrics in real-time to automate and monitor industrial processes."
    }
  ],
  "Introduction to Economics": [
    {
      question: "Which state of a competitive market represents the stable price level where quantity demanded equals quantity supplied?",
      options: ["Equilibrium price level", "Inflationary gap", "Deadweight monopoly surplus", "Mercantile deficit"],
      correctAnswer: "Equilibrium price level",
      explanation: "Market equilibrium occurs at the intersection of supply and demand curves, where no excess supply or unmet demand exerts pressure on prices."
    },
    {
      question: "What does the concept of 'Opportunity Cost' measure in economic decision-making?",
      options: ["The value of the next best alternative forgone when a choice is made", "The total monetary expenditure incurred during production", "The historical sunk cost that cannot be recovered", "The profit margin earned after deducting taxes"],
      correctAnswer: "The value of the next best alternative forgone when a choice is made",
      explanation: "Opportunity cost represents the highest-valued alternative sacrificed whenever resources are allocated to one specific choice over another."
    },
    {
      question: "If the cross-price elasticity of demand between good X and good Y is positive, what is the economic relationship between them?",
      options: ["They are substitute goods", "They are complementary goods", "They are inferior goods", "They are luxury Giffen goods"],
      correctAnswer: "They are substitute goods",
      explanation: "A positive cross-price elasticity means that an increase in the price of one good causes an increase in demand for the other, indicating they can substitute for each other."
    },
    {
      question: "Which macroeconomic indicator calculates the total market value of all final goods and services produced within a country's borders in a given year?",
      options: ["Gross Domestic Product (GDP)", "Gross National Product (GNP)", "Net National Disposable Income", "Consumer Price Index (CPI)"],
      correctAnswer: "Gross Domestic Product (GDP)",
      explanation: "GDP measures the monetary value of all finished goods and services produced domestically over a specified period."
    },
    {
      question: "According to the Law of Diminishing Marginal Utility, as consumption of a good increases:",
      options: ["The additional satisfaction gained from each extra unit declines", "The total satisfaction falls to zero immediately", "The consumer's total utility remains permanently constant", "The marginal cost of purchasing falls to negative values"],
      correctAnswer: "The additional satisfaction gained from each extra unit declines",
      explanation: "Diminishing marginal utility states that while total utility may rise, the marginal utility gained from consuming consecutive additional units decreases."
    }
  ],
  "Communicative English": [
    {
      question: "Choose the correct reported speech form: 'I am preparing for the midterm exam now,' said Abebe.",
      options: [
        "Abebe said that he was preparing for the midterm exam then.",
        "Abebe said that he is preparing for the midterm exam now.",
        "Abebe told that he will prepare for the midterm exam then.",
        "Abebe said he had been preparing for the midterm exam today."
      ],
      correctAnswer: "Abebe said that he was preparing for the midterm exam then.",
      explanation: "In reported speech with a past reporting verb ('said'), present continuous ('am preparing') shifts to past continuous ('was preparing') and 'now' shifts to 'then'."
    },
    {
      question: "Identify the grammatically correct sentence with proper subject-verb agreement:",
      options: [
        "The professor, along with her graduate assistants, has published a groundbreaking paper.",
        "The professor, along with her graduate assistants, have published a groundbreaking paper.",
        "Neither the students nor the instructor were present at the auditorium.",
        "A bouquet of fresh yellow roses were placed on the podium."
      ],
      correctAnswer: "The professor, along with her graduate assistants, has published a groundbreaking paper.",
      explanation: "Parenthetical phrases introduced by 'along with', 'as well as', or 'together with' do not change the number of the singular subject ('The professor' -> 'has published')."
    },
    {
      question: "Choose the correct third conditional sentence representing an unreal past scenario:",
      options: [
        "If she had studied the lecture notes thoroughly, she would have passed the exam.",
        "If she studied the lecture notes thoroughly, she will pass the exam.",
        "If she has studied the lecture notes, she would pass the exam.",
        "If she had studied the lecture notes, she will have passed the exam."
      ],
      correctAnswer: "If she had studied the lecture notes thoroughly, she would have passed the exam.",
      explanation: "The third conditional structure is: If + past perfect (had + V3), would have + past participle (would have + V3)."
    },
    {
      question: "Which transitional signal indicates contrast between two consecutive academic paragraphs?",
      options: ["Conversely", "Furthermore", "Consequently", "Simultaneously"],
      correctAnswer: "Conversely",
      explanation: "'Conversely' or 'However' indicates a direct contrast or counter-argument, whereas 'Furthermore' adds information and 'Consequently' indicates cause and effect."
    },
    {
      question: "In formal essay writing, which of the following expressions should be avoided?",
      options: ["A lot of stuff was done by the team", "Extensive empirical research was conducted", "The statistical findings indicate a strong correlation", "Preliminary observations suggest consistent outcomes"],
      correctAnswer: "A lot of stuff was done by the team",
      explanation: "Informal, vague idioms like 'a lot of stuff' undermine academic formality and precision in university research papers."
    }
  ],
  "Moral and Civic Education": [
    {
      question: "Which supreme legal document serves as the foundational framework for governance and human rights in modern Ethiopia?",
      options: ["The 1995 FDRE Constitution", "The 1931 Imperial Constitution", "The 1987 PDRE Constitution", "The Fetha Nagast historical code"],
      correctAnswer: "The 1995 FDRE Constitution",
      explanation: "The 1995 Constitution of the Federal Democratic Republic of Ethiopia establishes the federal state structure, separation of powers, and human and democratic rights."
    },
    {
      question: "In philosophical ethics, which normative theory asserts that the morality of an action depends solely on the greatest overall happiness it produces?",
      options: ["Utilitarianism (Consequentialism)", "Kantian Deontology", "Virtue Ethics", "Ethical Egoism"],
      correctAnswer: "Utilitarianism (Consequentialism)",
      explanation: "Utilitarianism, established by Jeremy Bentham and John Stuart Mill, judges actions based on their consequences, seeking the greatest good for the greatest number."
    },
    {
      question: "What is the primary role of the House of Federation (HoF) under the Ethiopian constitutional framework?",
      options: ["Interpreting the Federal Constitution and deciding on constitutional disputes", "Drafting and enacting national commercial legislation", "Leading national defense forces as Commander-in-Chief", "Appointing regional state governors directly"],
      correctAnswer: "Interpreting the Federal Constitution and deciding on constitutional disputes",
      explanation: "Under Article 62 of the 1995 FDRE Constitution, the House of Federation is uniquely empowered to interpret the Constitution with advice from the Council of Constitutional Inquiry."
    },
    {
      question: "Which of the following is an essential pillar of constitutional democracy?",
      options: ["The Rule of Law and institutional accountability", "Concentration of absolute executive authority", "Elimination of judicial independence", "Indefinite suspension of national elections"],
      correctAnswer: "The Rule of Law and institutional accountability",
      explanation: "The Rule of Law ensures that no individual or authority is above the law, with transparent accountability safeguarding citizen rights."
    },
    {
      question: "In ethical decision making, what characterizes Deontological ethics?",
      options: ["Adherence to moral duties, obligations, and universal rules regardless of outcome", "Maximizing net monetary profit for stakeholders", "Following popular cultural trends blindly", "Evaluating only the final emotional impact"],
      correctAnswer: "Adherence to moral duties, obligations, and universal rules regardless of outcome",
      explanation: "Deontology (associated with Immanuel Kant) holds that actions are inherently right or wrong based on whether they conform to duty, rather than their outcomes."
    }
  ],
  "General Physics": [
    {
      question: "A constant force of 20 N acts upon a 4 kg mass initially at rest. What is the acceleration produced?",
      options: ["5 m/s²", "80 m/s²", "16 m/s²", "0.2 m/s²"],
      correctAnswer: "5 m/s²",
      explanation: "By Newton's Second Law of Motion: F = m * a. Therefore, a = F / m = 20 N / 4 kg = 5 m/s²."
    },
    {
      question: "What is the work done when an object is moved 6 meters along a horizontal floor by a force of 15 N applied parallel to the displacement?",
      options: ["90 Joules", "2.5 Joules", "21 Joules", "45 Joules"],
      correctAnswer: "90 Joules",
      explanation: "Work = Force * displacement * cos(θ). Here θ = 0°, so Work = 15 N * 6 m * cos(0°) = 90 Joules."
    },
    {
      question: "According to the Law of Conservation of Energy, in an isolated frictionless pendulum system, at the lowest point of its swing:",
      options: ["Kinetic energy is at a maximum and potential energy is at a minimum", "Potential energy is at a maximum and kinetic energy is zero", "Total mechanical energy is zero", "Both potential and kinetic energy are zero"],
      correctAnswer: "Kinetic energy is at a maximum and potential energy is at a minimum",
      explanation: "As the pendulum descends, gravitational potential energy is converted entirely into kinetic energy, reaching peak velocity and kinetic energy at the nadir."
    },
    {
      question: "What is the equivalent resistance of two 6-ohm resistors connected in parallel across an ideal voltage source?",
      options: ["3 ohms", "12 ohms", "1.5 ohms", "36 ohms"],
      correctAnswer: "3 ohms",
      explanation: "For parallel resistors: 1/R_eq = 1/R1 + 1/R2 = 1/6 + 1/6 = 2/6 = 1/3. Hence, R_eq = 3 ohms."
    },
    {
      question: "What physical quantity does the area under a Velocity-Time graph represent?",
      options: ["Displacement", "Instantaneous acceleration", "Kinetic momentum", "Jerk"],
      correctAnswer: "Displacement",
      explanation: "The definite integral of velocity with respect to time (∫ v(t) dt) calculates the displacement of the moving body."
    }
  ],
  "Chemistry": [
    {
      question: "What is the pH of a 0.001 M hydrochloric acid (HCl) aqueous solution at 25°C?",
      options: ["3.0", "1.0", "11.0", "7.0"],
      correctAnswer: "3.0",
      explanation: "HCl is a strong monoprotic acid that dissociates completely: [H+] = 0.001 M = 10^-3 M. pH = -log10([H+]) = -log10(10^-3) = 3.0."
    },
    {
      question: "According to the Bronsted-Lowry acid-base definition, what is a base?",
      options: ["A proton (H+) acceptor", "A proton (H+) donor", "An electron pair donor only", "A substance that produces OH- ions in nonpolar solvents"],
      correctAnswer: "A proton (H+) acceptor",
      explanation: "In Bronsted-Lowry theory, an acid is a proton donor and a base is a proton acceptor."
    },
    {
      question: "Which quantum number determines the primary three-dimensional spatial orientation of an atomic orbital?",
      options: ["Magnetic quantum number (m_l)", "Principal quantum number (n)", "Angular momentum quantum number (l)", "Electron spin quantum number (m_s)"],
      correctAnswer: "Magnetic quantum number (m_l)",
      explanation: "The principal quantum number n defines energy level, l defines orbital shape, and m_l defines spatial orientation."
    },
    {
      question: "According to Le Chatelier's principle, what happens to an exothermic equilibrium reaction: N2(g) + 3H2(g) ⇌ 2NH3(g) + Heat, if the temperature is increased?",
      options: ["The equilibrium shifts to the left (towards reactants)", "The equilibrium shifts to the right (towards products)", "No change in equilibrium position occurs", "The total pressure of the vessel drops to zero"],
      correctAnswer: "The equilibrium shifts to the left (towards reactants)",
      explanation: "In an exothermic reaction, heat acts as a product. Raising the temperature causes the system to consume heat by shifting towards the reactants (left)."
    },
    {
      question: "What type of chemical bond is formed by the electrostatic attraction between oppositely charged ions?",
      options: ["Ionic bond", "Covalent bond", "Hydrogen bond", "Coordinate dative bond"],
      correctAnswer: "Ionic bond",
      explanation: "An ionic bond forms when electrons are transferred from a metal to a nonmetal, creating cations and anions held together by electrostatic forces."
    }
  ],
  "General Psychology": [
    {
      question: "Which school of thought in psychology, founded by John B. Watson and expanded by B.F. Skinner, emphasizes observable actions over internal mental states?",
      options: ["Behaviorism", "Structuralism", "Psychoanalysis", "Gestalt Psychology"],
      correctAnswer: "Behaviorism",
      explanation: "Behaviorism asserts that psychology should objectively investigate observable behaviors shaped by environmental stimuli and reinforcement, rather than subjective consciousness."
    },
    {
      question: "According to Sigmund Freud's structural model of the psyche, which component operates strictly on the 'reality principle'?",
      options: ["Ego", "Id", "Superego", "Unconscious archetype"],
      correctAnswer: "Ego",
      explanation: "The Ego functions as the realistic mediator between the instinctual desires of the Id and the moralistic constraints of the Superego, governed by the reality principle."
    },
    {
      question: "In classical conditioning demonstrated by Ivan Pavlov, what was the meat powder before conditioning took place?",
      options: ["Unconditioned Stimulus (UCS)", "Conditioned Stimulus (CS)", "Unconditioned Response (UCR)", "Neutral Operant"],
      correctAnswer: "Unconditioned Stimulus (UCS)",
      explanation: "The meat powder naturally and automatically triggered salivation in dogs without prior learning, defining it as an Unconditioned Stimulus (UCS)."
    },
    {
      question: "What is the typical capacity of human short-term memory (working memory) as identified by George Miller's classic study?",
      options: ["7 ± 2 items (5 to 9 chunks)", "Unlimited capacity", "3 ± 1 items", "15 ± 3 items"],
      correctAnswer: "7 ± 2 items (5 to 9 chunks)",
      explanation: "Miller's Law (1956) demonstrated that immediate human working memory can hold approximately 7 plus or minus 2 meaningful chunks of information."
    }
  ],
  "Geography of Ethiopia": [
    {
      question: "Which physiographic division encompasses the highest point in Ethiopia, Ras Dejen (4,550 meters)?",
      options: ["The Northwestern Highlands (Simien Mountains)", "The Southeastern Highlands (Bale Mountains)", "The Rift Valley Depression (Afar Triangle)", "The Western Lowlands"],
      correctAnswer: "The Northwestern Highlands (Simien Mountains)",
      explanation: "Ras Dejen, Ethiopia's highest peak at 4,550m, is located in the Simien Mountain massif within the Northwestern Highlands."
    },
    {
      question: "What is the primary factor responsible for the climatic classification of the 'Dega' agro-ecological zone in Ethiopia?",
      options: ["High elevation between 2,300 and 3,200 meters above sea level", "Direct proximity to the Indian Ocean", "Sub-surface tectonic thermal vents", "Location below sea level in the Afar depression"],
      correctAnswer: "High elevation between 2,300 and 3,200 meters above sea level",
      explanation: "In the Ethiopian traditional agro-ecological classification, 'Dega' designates cool highlands located between 2,300m and 3,200m altitude."
    },
    {
      question: "Which river basin in Ethiopia contributes the largest volume of water to the Main Nile river?",
      options: ["The Abbay (Blue Nile) River Basin", "The Awash River Basin", "The Omo-Gibe River Basin", "The Genale-Dawa River Basin"],
      correctAnswer: "The Abbay (Blue Nile) River Basin",
      explanation: "The Abbay (Blue Nile) River originates from Lake Tana in the Ethiopian highlands and provides over 60% of the total water reaching the downstream Nile."
    },
    {
      question: "The Afar Depression (Danakil) lies along which major geological structural system?",
      options: ["The East African Rift System (EARS)", "The Mid-Atlantic Ridge", "The Ring of Fire", "The Alpine-Himalayan Orogenic Belt"],
      correctAnswer: "The East African Rift System (EARS)",
      explanation: "The Afar Triple Junction is a prominent continental rifting zone where the Nubian, Somalian, and Arabian tectonic plates are pulling apart along the East African Rift System."
    }
  ],
  "History of Ethiopia": [
    {
      question: "Which ancient Ethiopian kingdom was renowned for minting its own coins, monumental stone stelae, and trading across the Red Sea?",
      options: ["The Kingdom of Aksum", "The Zagwe Dynasty", "The Damot Kingdom", "The Sultanate of Adal"],
      correctAnswer: "The Kingdom of Aksum",
      explanation: "The Aksumite Empire (1st to 8th century AD) minted gold, silver, and bronze coinage, erected monumental granite stelae, and was recognized as one of the four great powers of the ancient world."
    },
    {
      question: "King Lalibela of the Zagwe Dynasty is celebrated in world architectural history for constructing:",
      options: ["11 monolithic rock-hewn churches in Roha (Lalibela)", "The royal stone castles of Gondar (Fasil Ghebbi)", "The stone defensive wall of Jugol in Harar", "The obelisks of Tiya"],
      correctAnswer: "11 monolithic rock-hewn churches in Roha (Lalibela)",
      explanation: "In the 12th-13th centuries, King Gebre Mesqel Lalibela oversaw the carving of 11 monolithic and semi-monolithic churches out of living volcanic tuff."
    },
    {
      question: "On March 1, 1896, Ethiopian forces led by Emperor Menelik II and Empress Taytu Betul decisively defeated European colonial invasion at the Battle of:",
      options: ["Adwa", "Metemma", "Gura", "Maychew"],
      correctAnswer: "Adwa",
      explanation: "The Battle of Adwa in 1896 resulted in a historic victory of Ethiopian forces against the Italian army, safeguarding Ethiopian sovereignty and inspiring Pan-African resistance."
    },
    {
      question: "What historic document or legal code served as the supreme traditional constitution and religious legal basis for Christian Ethiopia from the 15th to 20th centuries?",
      options: ["Fetha Nagast (The Law of the Kings)", "Kebra Nagast (Glory of the Kings)", "Serata Gebr", "The 1931 Written Constitution"],
      correctAnswer: "Fetha Nagast (The Law of the Kings)",
      explanation: "The Fetha Nagast was compiled and translated into Ge'ez under Emperor Zara Yaqob in the 15th century, serving as civil and penal legal authority."
    }
  ],
  "Logic and Critical Thinking": [
    {
      question: "In formal deductive logic, if all premises are true and the argument structure guarantees that the conclusion must also be true, the argument is:",
      options: ["Sound", "Invalid", "Cogent", "Inductively strong"],
      correctAnswer: "Sound",
      explanation: "A deductive argument is 'sound' if and only if it is both valid (flawless logical structure) and all of its constituent premises are factually true."
    },
    {
      question: "Which informal fallacy is committed when someone attacks their opponent's personal background or character instead of addressing the substantive argument?",
      options: ["Argumentum ad Hominem", "Straw Man Fallacy", "Petitio Principii (Begging the Question)", "Appeal to Ignorance (Ad Ignorantiam)"],
      correctAnswer: "Argumentum ad Hominem",
      explanation: "Ad Hominem ('against the man') commits a fallacy by dismissing an argument based on personal attributes of the person asserting it rather than examining the logic."
    },
    {
      question: "What is the logical contrapositive of the conditional statement: 'If it rains (P), then the ground is wet (Q)'?",
      options: ["If the ground is not wet (~Q), then it does not rain (~P)", "If the ground is wet (Q), then it rains (P)", "If it does not rain (~P), then the ground is not wet (~Q)", "It rains and the ground is not wet"],
      correctAnswer: "If the ground is not wet (~Q), then it does not rain (~P)",
      explanation: "The contrapositive of 'P -> Q' is '~Q -> ~P', and it is logically equivalent in truth value to the original conditional statement."
    }
  ],
  "C++ Programming": [
    {
      question: "In C++, which OOP principle allows a derived class to provide a specific implementation of a method already defined in its base class using dynamic binding?",
      options: ["Polymorphism (using virtual functions)", "Data encapsulation", "Preprocessor macro expansion", "Namespace isolation"],
      correctAnswer: "Polymorphism (using virtual functions)",
      explanation: "Virtual functions enable runtime (dynamic) polymorphism in C++, allowing pointer/reference calls to resolve to derived class implementations."
    },
    {
      question: "What is the operator used in C++ to dynamically deallocate a single object from heap memory allocated with 'new'?",
      options: ["delete", "free()", "dispose", "drop"],
      correctAnswer: "delete",
      explanation: "In C++, 'delete' frees memory allocated by 'new', calling the destructor. For arrays allocated with 'new[]', 'delete[]' must be used."
    },
    {
      question: "What is the purpose of a Copy Constructor in a C++ class that manages raw pointer resources?",
      options: ["To perform a deep copy so both objects do not point to and double-free the same heap memory", "To convert integers into float representations", "To initialize static member variables at compile time", "To override standard arithmetic operators"],
      correctAnswer: "To perform a deep copy so both objects do not point to and double-free the same heap memory",
      explanation: "A custom copy constructor prevents shallow copying (pointer duplication), which causes segmentation faults and double-free errors upon destruction."
    }
  ]
};

/**
 * Normalizes subject names to map to curated banks or standard curriculum codes.
 */
export function normalizeSubjectKey(raw: string): string {
  if (!raw) return "Mathematics";
  const s = raw.trim().toLowerCase();
  if (s.includes('math') || s.includes('calculus') || s.includes('algebra')) return "Mathematics";
  if (s.includes('bio') || s.includes('living')) return "General Biology";
  if (s.includes('tech') || s.includes('emerging') || s.includes('blockchain') || s.includes('ai') || s.includes('cloud')) return "Emerging Technologies";
  if (s.includes('econ') || s.includes('business') || s.includes('micro') || s.includes('macro')) return "Introduction to Economics";
  if (s.includes('eng') || s.includes('communicat') || s.includes('grammar') || s.includes('writing')) return "Communicative English";
  if (s.includes('civic') || s.includes('moral') || s.includes('ethic')) return "Moral and Civic Education";
  if (s.includes('physic') || s.includes('mechanic') || s.includes('wave')) return "General Physics";
  if (s.includes('chem') || s.includes('organic')) return "Chemistry";
  if (s.includes('psych') || s.includes('behavior')) return "General Psychology";
  if (s.includes('geograph') || s.includes('horn of africa')) return "Geography of Ethiopia";
  if (s.includes('histor') || s.includes('axum') || s.includes('lalibela') || s.includes('adwa')) return "History of Ethiopia";
  if (s.includes('logic') || s.includes('critical think') || s.includes('fallacy')) return "Logic and Critical Thinking";
  if (s.includes('c++') || s.includes('program') || s.includes('oop') || s.includes('code')) return "C++ Programming";
  return raw.trim();
}

/**
 * Main Quiz Generation function.
 * Uses Gemini AI with pro Ethiopian academic prompting, with graceful fallback to subject-pure curated banks.
 */
export async function generateAcademicQuiz(params: QuizGenerationParams): Promise<QuizQuestion[]> {
  const {
    subject,
    topic,
    difficulty = 'medium',
    qCount = 5,
    customNeeds,
    language = 'en'
  } = params;

  const targetCount = Math.min(Math.max(qCount, 3), 20);
  const normalizedSub = normalizeSubjectKey(subject);

  // 1. Attempt AI Generation with Google GenAI SDK if API key is present
  const resolvedApiKey = getMasterApiKey((params as any).apiKey);
  if (resolvedApiKey) {
    const ai = new GoogleGenAI({ apiKey: resolvedApiKey });
    // Prioritize high-availability and lite models during high-demand periods, falling back cleanly
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

    const promptMessage = `You are an official Senior Board Examiner for Ethiopian University Academic Registrars and the National Educational Assessment and Examinations Agency (NEAEA/EUEE).
Compile an authentic, high-quality, professional academic practice exam of exactly ${targetCount} multiple-choice questions STRICTLY for:
Subject: "${subject}"
Specific Topic / Chapter Focus: "${topic || customNeeds || 'Core Curriculum Chapters'}"
Difficulty Level: ${difficulty}
Language: ${language === 'am' ? 'Bilingual (English questions with detailed Amharic explanations where helpful)' : 'English with clear academic phrasing'}

CRITICAL MANDATORY RULES:
1. SUBJECT INTEGRITY: Every single question must be 100% relevant to "${subject}". NEVER mix questions from other fields (for example, if the subject is Mathematics, do NOT include Biology or Economics questions).
2. NO FAKE INFO OR PLACEHOLDERS: All questions, answers, options, and explanations must be factually and mathematically accurate. Never output generic template strings or placeholder labels.
3. REAL ACADEMIC RIGOR: Write authentic questions formatted like real Ethiopian freshman/midterm/final university exams or national EUEE entrance papers.
4. If the subject involves formulas (Math, Physics, Chemistry), include clear, accurate notation and SI units.
5. Each question must have exactly 4 plausible, unambiguous options.
6. Provide a detailed, step-by-step authoritative explanation for why the correct answer is right.
7. The "correctAnswer" field MUST exactly match one of the elements in the "options" array.
8. Return a clean JSON array of objects. Each object must have:
   - "question": string
   - "options": [string, string, string, string]
   - "correctAnswer": string
   - "explanation": string`;

    for (const modelName of modelsToTry) {
      try {
        // Run with a 12-second timeout to prevent stalling during high-demand surges
        const apiPromise = ai.models.generateContent({
          model: modelName,
          contents: promptMessage,
          config: {
            responseMimeType: 'application/json',
            systemInstruction: 'You are a senior Ethiopian university professor and examination board compiler. Always return valid JSON arrays of quiz question objects without any markdown formatting.'
          }
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timeout')), 12000)
        );

        const response: any = await Promise.race([apiPromise, timeoutPromise]);

        const rawText = response?.text ? response.text.trim() : '';
        if (rawText) {
          let cleanJson = rawText;
          if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
          if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
          if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);

          const parsed = JSON.parse(cleanJson.trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validate structure
            const validQuestions: QuizQuestion[] = parsed.filter(q => 
              typeof q.question === 'string' &&
              Array.isArray(q.options) &&
              q.options.length >= 2 &&
              typeof q.correctAnswer === 'string'
            ).map(q => {
              // Ensure correctAnswer is within options
              let opts = q.options.map((o: any) => String(o).trim());
              let correct = String(q.correctAnswer).trim();
              if (!opts.includes(correct)) {
                // If it starts with letter like "A) ...", find match
                const letterMatch = correct.match(/^[A-D]\)?/i);
                if (letterMatch) {
                  const prefix = letterMatch[0].toUpperCase();
                  const found = opts.find(o => o.toUpperCase().startsWith(prefix));
                  if (found) correct = found;
                  else opts[0] = correct;
                } else {
                  opts.unshift(correct);
                  opts = opts.slice(0, 4);
                }
              }
              return {
                question: q.question.trim(),
                options: opts.slice(0, 4),
                correctAnswer: correct,
                explanation: q.explanation ? String(q.explanation).trim() : `Verified solution for ${subject}.`
              };
            });

            if (validQuestions.length >= 3) {
              return validQuestions.slice(0, targetCount);
            }
          }
        }
      } catch (err: any) {
        // Gracefully log transient API issues (503 high demand spikes, rate limits, timeouts) without dumping raw stack traces
        const statusOrCode = err?.status || err?.code || (err?.message?.includes('503') ? 503 : 'transient_issue');
        console.log(`[Quiz Generator] Model ${modelName} encountered (${statusOrCode}). Gracefully falling back...`);
        // Continue to try next model or fallback
      }
    }
  }

  // 2. Curated Subject-Pure Fallback
  // NEVER mix subjects. Get questions from the dedicated bank for this subject only.
  let subjectBank = SUBJECT_CURATED_BANKS[normalizedSub] || SUBJECT_CURATED_BANKS[subject];
  
  // If not exact match, search for partial key matches
  if (!subjectBank || subjectBank.length === 0) {
    const matchedKey = Object.keys(SUBJECT_CURATED_BANKS).find(k => 
      k.toLowerCase().includes(subject.toLowerCase()) || 
      subject.toLowerCase().includes(k.toLowerCase())
    );
    if (matchedKey) {
      subjectBank = SUBJECT_CURATED_BANKS[matchedKey];
    }
  }

  if (subjectBank && subjectBank.length > 0) {
    const shuffled = [...subjectBank].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));
    
    // If user requested more than available, duplicate with different order
    if (selected.length < targetCount) {
      const needed = targetCount - selected.length;
      for (let i = 0; i < needed; i++) {
        const base = subjectBank[i % subjectBank.length];
        selected.push({
          question: base.question,
          options: [...base.options].reverse(),
          correctAnswer: base.correctAnswer,
          explanation: base.explanation
        });
      }
    }
    return selected;
  }

  // 3. Fallback for custom user subjects not in pre-built banks
  // Synthesizes clear, academically grounded questions for THAT subject
  const customQuestions: QuizQuestion[] = [];
  const focusAspects = [
    {
      concept: "Foundational Definitions & Scope",
      question: `In university-level studies of ${subject}, which definition best characterizes the core objective of ${topic || subject}?`,
      correct: `A systematic study analyzing core structures, governing principles, and practical applications within ${subject}`,
      distractors: [
        `An informal collection of unrelated descriptive observations without analytical frameworks`,
        `A purely historical chronicle that excludes contemporary methodologies and problem-solving`,
        `A speculative methodology that rejects formal validation and verifiable standards`
      ]
    },
    {
      concept: "Methodology & Analysis",
      question: `When conducting rigorous academic evaluation in ${subject} regarding "${topic || 'fundamental concepts'}", what is standard practice?`,
      correct: `Formulating hypotheses, evaluating quantitative or conceptual evidence, and verifying consistency against recognized standards`,
      distractors: [
        `Relying exclusively on anecdotal impressions without objective verification`,
        `Disregarding standard terminology and established academic literature`,
        `Accepting initial assumptions without testing alternative explanations or boundary conditions`
      ]
    },
    {
      concept: "Application & Problem Solving",
      question: `In applied contexts of ${subject}, how are theoretical models of "${topic || subject}" typically validated?`,
      correct: `Through systematic experimentation, case studies, or empirical testing against real-world observations`,
      distractors: [
        `By assuming theoretical models are infallible without testing against observed reality`,
        `Through arbitrary consensus without reference to empirical or mathematical data`,
        `By ignoring discrepancies between theoretical predictions and experimental results`
      ]
    }
  ];

  for (let i = 0; i < targetCount; i++) {
    const aspect = focusAspects[i % focusAspects.length];
    const allOptions = [aspect.correct, ...aspect.distractors].sort(() => 0.5 - Math.random());
    customQuestions.push({
      question: aspect.question,
      options: allOptions,
      correctAnswer: aspect.correct,
      explanation: `In the Ethiopian university curriculum for ${subject}, mastery of ${topic || 'this course'} requires rigorous methodology: ${aspect.correct.toLowerCase()}.`
    });
  }

  return customQuestions;
}
