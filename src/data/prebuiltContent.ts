/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flashcard, Deck } from '../types';

export interface PrebuiltStudyNote {
  id: string;
  subject: string;
  title: string;
  intro: string;
  definition: string;
  explanation: string;
  diagram: string; // ASCII diagram
  summaryTable: { header: string[]; rows: string[][] };
  mnemonics: string;
  color: string;
}

const createCard = (id: string, question: string, answer: string, explanation: string): Flashcard => ({
  id,
  question,
  answer,
  explanation,
  interval: 0,
  repetition: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString()
});

export const PREBUILT_DECKS: Deck[] = [
  {
    id: "deck_emerging_tech",
    title: "Emerging Technologies",
    subject: "Emerging Technologies",
    cards: [
      createCard("et_1", "What is the Internet of Things (IoT)?", "The network of physical objects ('things') embedded with sensors, software, and other technologies for exchanging data with other devices over the internet.", "Example: Smart coffee makers or thermostats tracking utility metrics automatically."),
      createCard("et_2", "Explain AR (Augmented Reality) vs. VR (Virtual Reality).", "AR overlays digital information on the real physical world. VR creates a fully simulated digital environment that completely isolates the user from the real world.", "AR: Pokémon Go, Google Glass. VR: Custom training simulators using headsets like Oculus Rift."),
      createCard("et_3", "What is the key difference between AI and Machine Learning?", "AI is the broad concept of creating machines capable of mimicking human intelligence. ML is a subset of AI that enables machines to learn from data without explicit programming.", "ML is the method we use to achieve AI (e.g., using neural networks)."),
      createCard("et_4", "What is Blockchain?", "A decentralized, distributed ledger technology that securely records transactions across a network of computers in a tamper-proof block structure.", "Once a record is written block-by-block, it cannot be altered without altering all subsequent blocks."),
      createCard("et_5", "What is Cloud Computing?", "The on-demand delivery of IT resources (databases, storage, compute power) over the internet with pay-as-you-go pricing.", "Instead of buying physical servers, you rent them virtually from providers like AWS or GCP."),
      createCard("et_6", "What is Cybersecurity?", "The practice of protecting systems, networks, and programs from digital attacks, theft, unauthorized access, and damage.", "Relies on three pillars: confidentiality, integrity, and availability (CIA Triad)."),
      createCard("et_7", "Define 5G Technology.", "The fifth-generation mobile network, designed to deliver peak data rates up to 20 Gbps, ultra-low latency, and massive device connectivity capacity.", "Key driver for autonomous cars and massive smart city grids."),
      createCard("et_8", "What is Edge Computing?", "A distributed computing paradigm that brings computation and data storage closer to the sources of data (the edge of the network) rather than relying solely on central clouds.", "Reduces latency and bandwidth use for immediate applications like localized industrial sensors."),
      createCard("et_9", "What is a Digital Twin?", "A highly accurate virtual replica of a physical asset, process, system, or environment designed to run simulations, monitor health, and optimize performance.", "Examples include virtual engine models used in aviation or structural grids in smart construction."),
      createCard("et_10", "What are Smart Cities?", "Urban areas that use IoT sensors, communication networks, and data analytics to optimize city services, manage resources sustainably, and improve residents' quality of life.", "Provides intelligent traffic lights, smart waste bins, and automated lighting."),
      createCard("et_11", "Define Autonomous Vehicles.", "Self-driving cars or trucks that use computer vision, radar, LIDAR, and AI algorithms to perceive their surroundings and navigate without human intervention.", "Operate in a high-density, real-time edge processing environment."),
      createCard("et_12", "What is Natural Language Processing (NLP)?", "A subfield of AI concerned with the interactions between computers and human language, permitting machines to read, decode, and interpret speech.", "Underpins systems like translation engines, chatbots, and Voice Assistants."),
      createCard("et_13", "What is Computer Vision?", "A field of artificial intelligence that trains computers to interpret, understand, and extract meaningful information from digital images and videos.", "Used in medical CT scans, face unlocking, and automated surveillance."),
      createCard("et_14", "What is Quantum Computing?", "A computing paradigm that utilizes subatomic particles (qubits) and quantum mechanics (superposition and entanglement) to solve highly complex mathematical problems.", "Can process complex calculations in minutes that take standard supercomputers millennia."),
      createCard("et_15", "Explain the concept of 'Ethical AI'.", "The set of guidelines that govern the design, deployment, and operation of AI models to ensure fairness, transparency, accountability, and privacy.", "Guards against algorithmic bias, privacy invasion, and mass disinformation."),
      createCard("et_16", "What are Deepfakes?", "Synthetic media in which a person in an existing image or video is replaced with someone else's likeness using deep generative neural networks.", "A key ethical concern in modern AI-augmented cyber threat spheres."),
      createCard("et_17", "What is Big Data?", "Extremely large, complex datasets that cannot be processed efficiently by traditional relational database engines.", "Characterized by the Five Vs: Volume, Velocity, Variety, Veracity, and Value."),
      createCard("et_18", "What is additive manufacturing commonly called?", "3D Printing.", "The process of creating a physical object from a three-dimensional digital model by laying down successive layers of material."),
      createCard("et_19", "Define Robotic Process Automation (RPA).", "Software technology that makes it easy to build, deploy, and manage software robots that emulate humans interacting with digital systems.", "Often used to automate clerical data entry tasks and report generation."),
      createCard("et_20", "What is the Metaverse?", "A collective, collaborative virtual shared space created by the convergence of virtually enhanced physical reality and physically persistent virtual space.", "Typically accessed through AR, VR headsets, and standard browsers.")
    ]
  },
  {
    id: "deck_economics",
    title: "Introduction to Economics",
    subject: "Introduction to Economics",
    cards: [
      createCard("ec_1", "What is the Law of Demand?", "The principle stating that, ceteris paribus (all other things being equal), as the price of a good falls, the quantity demanded rises, and vice-versa.", "Represents an inverse relationship between price and quantity demanded."),
      createCard("ec_2", "What is the Law of Supply?", "The principle stating that, ceteris paribus, as the price of a good increases, the quantity supplied increases, and vice-versa.", "Represents a direct, positive correlation between price and quantity supplied."),
      createCard("ec_3", "Define Elasticity of Demand.", "A measure of how responsive the quantity demanded of a service or good is to a change in its price.", "PD > 1 is elastic; PD < 1 is inelastic; PD = 1 is unit elastic."),
      createCard("ec_4", "What is Gross Domestic Product (GDP)?", "The total monetary value of all finished goods and services produced within a country's borders in a specific time period.", "Formula style: GDP = C + I + G + (X - M)."),
      createCard("ec_5", "What is Inflation?", "The general, gradual increase in price levels and a subsequent fall in the purchasing power of money over a period of time.", "Can be caused by demand-pull (high demand) or cost-push (rising production costs)."),
      createCard("ec_6", "Identify the 4 main types of Market Structures.", "Perfect Competition, Monopolistic Competition, Oligopoly, and Monopoly.", "A monopoly has 1 seller, while perfect competition has infinite buyers and sellers with identical goods."),
      createCard("ec_7", "Define Opportunity Cost.", "The value of the next best alternative given up (forgone) when making a choice.", "Example: Studying for an exam instead of going out means the opportunity cost is the entertainment forgone."),
      createCard("ec_8", "What is Comparative Advantage?", "The ability of an economic agent to produce a good or service at a lower opportunity cost than its competitors.", "The fundamental justification for free international trade partnerships."),
      createCard("ec_9", "Describe Fiscal Policy.", "The use of government spending and taxation to influence the level of economic activity and aggregate demand.", "Controlled by the Ministry of Finance / national government."),
      createCard("ec_10", "Describe Monetary Policy.", "The management of interest rates and the money supply by a central bank to control inflation, stabilize currency value, and support employment.", "Controlled in Ethiopia by the National Bank of Ethiopia (NBE)."),
      createCard("ec_11", "What is Consumer Surplus?", "The difference between the maximum price a consumer is willing to pay and the actual price they pay.", "Visually, it is the area below the demand curve and above the market price."),
      createCard("ec_12", "What is a Nash Equilibrium?", "A situation in game theory where no player can benefit by unilaterally changing their chosen strategy, assuming other players' strategies remain constant.", "Pioneered by John Nash."),
      createCard("ec_13", "Define Microeconomics.", "The branch of economics that studies the behavior of individual households, firms, and industries in allocating scarce resources.", "Focuses on individual market pricing and choices."),
      createCard("ec_14", "Define Macroeconomics.", "The study of the behavior of a national or global economy as a whole, focusing on indices like GDP, unemployment, and interest policies.", "Analyses collective aggregate indicators."),
      createCard("ec_15", "What is scarcity?", "The basic economic problem of satisfying unlimited human wants and needs with limited (scarce) resources.", "The very reason why economics exists as a field of study."),
      createCard("ec_16", "What is Command Economy vs Market Economy?", "A command economy is controlled entirely by a central government (prices and production are set). A market economy relies on supply, demand, and free enterprising.", "Ethiopia historically shifted from command (Derg era) to more market-liberalizing policies in recent decades."),
      createCard("ec_17", "What is a Giffen Good?", "An inferior good for which demand increases as the price increases, violating the general Law of Demand.", "Usually happens because the price increase leaves less income for superior foods (e.g., staple teff or potatoes)."),
      createCard("ec_18", "Define stagflation.", "A combination of slow economic growth (stagnation), high unemployment, and high inflation.", "A difficult policy paradox for central banks to tackle."),
      createCard("ec_19", "What is economic utility?", "The total satisfaction or value received by a consumer from consuming a good or service.", "Utilized in measuring consumer choice and equilibrium graphs."),
      createCard("ec_20", "What are tariffs?", "Taxes or duties imposed by a government on imported goods and services from other countries.", "Used as protective measures for local industries or to generate revenue.")
    ]
  },
  {
    id: "deck_biology",
    title: "General Biology",
    subject: "General Biology",
    cards: [
      createCard("bi_1", "What are the two major stages of Photosynthesis?", "The Light-Dependent Reactions (happening in the thylakoid membrane) and the Light-Independent Reactions / Calvin Cycle (occurring in the stroma).", "Inputs: Carbon Dioxide, Water, Sunlight. Outputs: Glucose and Oxygen."),
      createCard("bi_2", "How is ATP synthesized during cellular respiration?", "Through Chemiosmosis and Oxidative Phosphorylation, where protons flow down their gradient through the enzyme ATP Synthase.", "Yields the majority of ATP in aerobic respiration (approx. 32-34 ATPs per glucose molecule)."),
      createCard("bi_3", "Explain the lock-and-key model of enzyme activity.", "An enzyme's active site acts as a rigid lock, and only a substrate with a highly specific, matching shape (the key) can bind to and activate it.", "Later refined into the 'induced fit' model where active sites mold slightly around substrates."),
      createCard("bi_4", "Identify the three main processes of Cellular Respiration.", "Glycolysis (cytoplasm), Krebs Cycle / Citric Acid Cycle (mitochondrial matrix), and the Electron Transport Chain (inner mitochondrial membrane).", "Glycolysis is anaerobic (does not require oxygen), whereas the remaining steps require oxygen."),
      createCard("bi_5", "What is the Krebs Cycle?", "A series of chemical reactions in the mitochondria that oxidizes acetyl-CoA to produce NADH, FADH2, and ATP (GTP) while releasing carbon dioxide as waste.", "Discovered by Hans Krebs."),
      createCard("bi_6", "Briefly outline DNA Replication.", "The semi-conservative process where DNA helicase unwinds the double helix, and DNA polymerase synthesizes two new complementary strands using old strands as templates.", "Ensures exact genetic duplication before cell division."),
      createCard("bi_7", "Contrast Mitosis vs Meiosis.", "Mitosis produces 2 identical diploid daughter cells for body growth and repair. Meiosis produces 4 genetically unique haploid gamete (sex) cells for reproduction.", "Mitosis has 1 division stage; Meiosis has 2 consecutive division stages."),
      createCard("bi_8", "Identify the steps in Protein Synthesis.", "Transcription (rewriting DNA into mRNA in the nucleus) and Translation (ribosomes reading mRNA to construct a specific amino acid polypeptide chain in cytoplasm).", "Underpins the 'Central Dogma' of biology (DNA -> RNA -> Protein)."),
      createCard("bi_9", "Name 5 key cell organelles and their primary functions.", "Nucleus (genetic control), Mitochondria (ATP generator), Ribosome (protein synthesis), Endoplasmic Reticulum (molecule transport/folding), Golgi Apparatus (sorting/shipping).", "Plants also have Chloroplasts (photosynthesis) and a cell wall."),
      createCard("bi_10", "What is Active vs Passive Transport across cell membranes?", "Active transport moves substances against their concentration gradient and requires cellular energy (ATP). Passive transport moves substances down their gradient without energy.", "Active: Sodium-potassium pump. Passive: Diffusion, Osmosis."),
      createCard("bi_11", "What is the role of Enzymes in metabolic pathways?", "Enzymes act as biological catalysts, dramatically speeding up chemical reactions by lowering the activation energy barrier.", "Enzymes remain completely unchanged after a chemical reaction."),
      createCard("bi_12", "Define Homeostasis.", "The state of steady internal, physical, and chemical conditions maintained by living systems, regardless of changes in outer env.", "Controls core registers like body temperature, blood pH, and glucose concentrations."),
      createCard("bi_13", "Explain the difference between Prokaryotes and Eukaryotes.", "Prokaryotes lack a distinct membrane-bound nucleus and organelles (e.g. bacteria). Eukaryotes have a true nucleus enclosing DNA and membrane organelles (e.g. plants, animals).", "Eukaryotes are structurally much larger and more complex."),
      createCard("bi_14", "What is cell theory?", "A scientific theory asserting that all living things are composed of cells, the cell is the basic structural and functional unit of life, and all cells come from pre-existing cells.", "The foundation of modern biology."),
      createCard("bi_15", "Define Osmosis.", "The passive diffusion of water molecules through a selectively permeable membrane from an area of higher water potential to lower water potential.", "Crucial for plant turgor pressure and animal blood cell stability."),
      createCard("bi_16", "What is cellular metabolism?", "The sum of all physical and chemical processes in an organism by which material is produced, maintained, and energy made available.", "Divided into anabolism (building up) and catabolism (breaking down)."),
      createCard("bi_17", "What are helper T cells in human biology?", "White blood cells that play an indispensable role in adaptive immunity, coordinating responses by activating other immune cells.", "Primary target of HIV, leading to AIDS if unchecked."),
      createCard("bi_18", "Define biodiversity.", "The spatial and systemic variety of life on Earth, encompassing genetic diversity, ecosystem diversity, and species diversity.", "Ethiopia is famous for being a hotspot of biodiversity (e.g., endemic gelada baboons, walia ibex)."),
      createCard("bi_19", "What is fermentation?", "An anaerobic pathway that breaks down glucose to produce ATP in the absence of oxygen, generating lactic acid or ethanol as byproducts.", "Used in traditional Ethiopian injera batter fermentation via wild yeasts (ersho)."),
      createCard("bi_20", "What is the function of Lysosomes?", "Acidic membrane-bound vesicles containing digestive enzymes that break down waste materials, worn-out organelles, and foreign invaders.", "Referred to as the 'garbage disposal' of the animal cell.")
    ]
  },
  {
    id: "deck_english",
    title: "English Grammar",
    subject: "Communicative English",
    cards: [
      createCard("eg_1", "What are the rules for turning Direct Speech into Reported Speech?", "Shift tenses back (Present -> Past, Past -> Past Perfect), adjust pronouns (I -> he/she), and update time markers (today -> that day, yesterday -> the day before).", "Example: 'I am studying' becomes 'He said he was studying'."),
      createCard("eg_2", "Explain defining vs. non-defining Relative Clauses.", "Defining clauses give essential information to identify a noun (uses 'who' or 'which/that' without commas). Non-defining clauses offer extra, optional detail (uses commas, cannot use 'that').", "Defining: 'The student who scored A got the medal.' Non-defining: 'Abebe, who loves biology, won the medal.'"),
      createCard("eg_3", "Contrast 'must (obligation)' with 'should (advice)'.", "Must indicates a strict, administrative, or personal necessity / rule. Should is used to provide recommendations, opinions, or advice.", "Must: 'Students must register by Wednesday.' Should: 'You should study biology notes first.'"),
      createCard("eg_4", "How is a Passive Voice sentence formed?", "Move the object of the action to the subject position, add the auxiliary verb 'to be' in the matching tense, and join the main verb's Past Participle.", "Active: 'Tilahun wrote the essay.' Passive: 'The essay was written by Tilahun.'"),
      createCard("eg_5", "What is the structure of the Third Conditional?", "If + Past Perfect, would have + Past Participle. Highlights hypothetical situations in the past that did not happen.", "Example: 'If I had studied harder, I would have passed the final exam.'"),
      createCard("eg_6", "Identify the difference between 'since' and 'for' with Present Perfect.", "'Since' is used to specify a particular starting point in time. 'For' is used to measure a duration or block of time.", "Since: 'since 2018 / since July'. For: 'for 5 years / for 10 hours'."),
      createCard("eg_7", "What is a gerund vs. an infinitive?", "A gerund is a verb ending in '-ing' acting as a noun. An infinitive is the base form of a verb preceded by 'to'.", "Gerund: 'Studying is useful.' Infinitive: 'I want to study.' Some verbs only accept one or the other."),
      createCard("eg_8", "Define the Present Perfect Continuous.", "Used to show an action started in the past, continuing to the present moment, emphasizing the process.", "Active style: Subject + have/has + been + verb-ing. 'We have been discussing IoT for two hours.'"),
      createCard("eg_9", "Explain the use of 'used to' for past habits.", "Indicates actions or states that were repeated habits or true in the past but are no longer active in the present.", "Example: 'She used to teach economics, but now she works at the central bank.'"),
      createCard("eg_10", "What are modal verbs of deduction?", "'Must be' (100% sure true), 'Might/May/Could be' (possible but unsure), and 'Can't be' (100% sure impossible).", "Example: 'He scored 100 on the exam, he must be extremely smart.'"),
      createCard("eg_11", "Define active subject-verb agreement.", "Singular subjects require singular verbs, while plural subjects require plural verbs in the present tense.", "Example: 'The list of books is (not are) on the table.' 'Each student receives a card.'"),
      createCard("eg_12", "What is the difference between 'affect' and 'effect'?", "'Affect' is typically a verb meaning to influence. 'Effect' is typically a noun meaning the result or outcome.", "Example: 'The government spending cuts will affect (v) the GDP. The main effect (n) was inflation.'"),
      createCard("eg_13", "Define the First Conditional.", "If + Present Simple, will + base verb. Describes real and possible future situations.", "Example: 'If you complete the prep exam, you will score a top grade.'"),
      createCard("eg_14", "Define the Second Conditional.", "If + Past Simple, would + base verb. Standard structure for imaginary or hypothetical present/future states.", "Example: 'If I had a faster computer, I would run quantum models.' (Uses 'were' for all subjects in formal style: 'If I were you...')"),
      createCard("eg_15", "Explain the difference between 'few' and 'a few'.", "'Few' has a negative, restrictive connotation meaning 'scarcely any'. 'A few' has a positive connotation meaning 'some'.", "Few: 'There are few books, which is bad.' A few: 'There are a few books, which is enough to study.'"),
      createCard("eg_16", "What is a coordinating conjunction?", "Conjunctions used to connect words, phrases, or independent clauses of equal rank.", "Mnemonic: FANBOYS (For, And, Nor, But, Or, Yet, So)."),
      createCard("eg_17", "What is a dangling participle?", "An adjective modifier that is not logically or grammatically attached to the intended subject of the sentence.", "Example of error: 'Walking down the street, the leaf fell.' (The leaf wasn't walking!)"),
      createCard("eg_18", "What is the difference between transitive and intransitive verbs?", "Transitive verbs require a direct object to complete their meaning. Intransitive verbs do not take an object.", "Transitive: 'He bought teff.' Intransitive: 'She laughed.'"),
      createCard("eg_19", "Define the Past Perfect tense.", "Shows an action that was completed before another event in the past happened.", "Structure: had + past participle. 'Before the exam began, she had summarized the study notes.'"),
      createCard("eg_20", "What is a relative pronoun?", "A pronoun used to connect a clause or phrase to a noun or pronoun (who, whom, whose, which, that).", "Provides vital or non-vital qualifying info for the noun.")
    ]
  },
  {
    id: "deck_moral_civic",
    title: "Moral & Civic Education",
    subject: "Moral and Civic Education",
    cards: [
      createCard("mc_1", "What are the core pillars of the Ethiopian Constitution (1995)?", "Underpins key values: Sovereign power of nations, nationalities and peoples; supremacy of the constitution; protection of democratic rights; and federal structure.", "Composed of 106 articles. Drafted following the transitional period in December 1994."),
      createCard("mc_2", "Identify the three main categories of Human Rights.", "Civil and political rights (first-generation), economic, social and cultural rights (second-generation), and solidarity/collective rights (third-generation).", "Broadly protected under Chapter Three of the Ethiopian Constitution."),
      createCard("mc_3", "Name the major stages of Democratization.", "Transition (collapse of authoritarian regime), Consolidation (stable democratic institutions take root), and Deepening (democratic norms are fully integrated into civic society).", "Requires active voter lists, local rule of law, and free media infrastructure."),
      createCard("mc_4", "Explain Federalism, detailing symmetric vs asymmetric types.", "Federalism is a system where power is divided between a central government and regional constituent units. Symmetric federalism gives identical powers to all regions. Asymmetric federalism gives specific extra powers or protections to certain states.", "Ethiopia is a prominent example of multinational (ethnic) federalism with 11+ regional states."),
      createCard("mc_5", "What is the difference between civic duties and civic rights?", "Civic rights are protections and freedoms guaranteed to citizens by law (e.g. freedom of assembly). Civic duties are responsibilities citizens are expected to perform (e.g. paying taxes, obeying laws).", "A balanced society requires citizens to respect both rights and duties."),
      createCard("mc_6", "Explain Utilitarianism (ethical theory).", "The consequentialist theory that the morally right action is the one that produces the greatest amount of good / happiness for the greatest number of people.", "Associated with Jeremy Bentham and John Stuart Mill."),
      createCard("mc_7", "Explain Deontology / Kantian ethics.", "The duty-based ethical theory asserting that actions are inherently right or wrong, regardless of their consequences, based on universal moral laws (Categorical Imperative).", "Formulated by Immanuel Kant."),
      createCard("mc_8", "Explain Virtue Ethics.", "An ethical approach that emphasizes an individual's character and virtues (like honesty, courage, compassion) rather than rules or consequences as the foundation for ethical behaviour.", "Traces back to Aristotle."),
      createCard("mc_9", "Define Rule of Law.", "The principle that all people, institutions, and entities (including governments) are accountable to laws that are publicly promulgated, equally enforced, and independently adjudicated.", "No individual should be above the law in a democratic society."),
      createCard("mc_10", "What is political tolerance?", "The willingness to extend basic human rights, constitutional protections, and political freedoms to individuals and groups whose viewpoints, beliefs, and values differ from your own.", "Vital for the peaceful reconciliation of diverse communities in multinational states."),
      createCard("mc_11", "Define pluralism.", "A condition or system in which two or more states, groups, principles, or sources of authority coexist and have a voice, preventing monolithic administrative capture.", "Underpins robust, multi-perspective democratic discourse."),
      createCard("mc_12", "What is active civic participation?", "The active involvement of citizens in public life, community decision-making, voting, and civic organizations to influence local and national governance.", "Goes beyond simple voting to include grassroots organizing."),
      createCard("mc_13", "What is the legislative, executive, and judicial separation of powers?", "Legislative branch makes laws (parliament), Executive enforces laws (prime minister, cabinet), and Judicial interprets laws (Supreme Court).", "In Ethiopia, the HPR (House of Peoples' Representatives) serves as the primary legislative body."),
      createCard("mc_14", "What are traditional dispute resolution mechanisms in Ethiopia?", "Indigenous systems used by various ethnic communities to resolve conflicts amicably without resorting to formal courts.", "Examples include the Gadaa system (Oromo), Shimgelina (Amhara/national), and custom councils (Gurage, Sidama)."),
      createCard("mc_15", "Define Patriotism.", "The emotional attachment and dedication of a citizen to their country, centered on values of social justice, collective growth, and peaceful coexistence.", "Should be constructive and promote unity in diversity."),
      createCard("mc_16", "What is administrative corruption?", "The abuse of public office and administrative power for private financial gain, nepotism, or cronyism.", "Subverts economic development and erodes state trust."),
      createCard("mc_17", "Identify a key feature of the House of Federation (HoF) in Ethiopia.", "It is the upper house of parliament, with the primary unique mandate to interpret the national constitution and resolve regional boundary dispute resolutions.", "Represents the diverse nations, nationalities, and peoples of Ethiopia."),
      createCard("mc_18", "What is environmental ethics?", "The branch of ethics that studies the moral relationship of human beings to, and also the value and moral status of, the environment and non-human contents.", "Particularly important for sustainability and agricultural survival in East Africa."),
      createCard("mc_19", "Define sovereignty.", "The supreme, absolute, and uncontrollable power by which an independent state is governed, free from external administrative mandate.", "In Ethiopia, sovereignty resides in the Nations, Nationalities and Peoples of Ethiopia according to Article 8."),
      createCard("mc_20", "Explain professional ethics.", "The specialized set of standards and codes of conduct that govern the behavior of individuals in fields like medicine, engineering, law, and education.", "Builds public confidence and keeps practitioners accountable for client safety.")
    ]
  }
];

export const PREBUILT_STUDY_NOTES: PrebuiltStudyNote[] = [
  {
    id: "note_et",
    subject: "Emerging Technologies",
    title: "Core Mechanics of IoT & Industry 4.0",
    intro: "Emerging Technologies represent the structural backbone of physical-digital convergence in modern civilization. The fundamental engine of this transformation is the Internet of Things (IoT), transforming simple nodes into smart interconnected objects.",
    definition: "The Internet of Things (IoT) is a widespread mesh of physical devices ('things') equipped with sensors, local chips, and network protocols to stream, aggregate, and act upon environmental data without human intervention.",
    explanation: "At the core of an IoT ecosystem are four functional steps:\n1. Sensors/Devices: Node sensors gather localized parameters (e.g., temperature changes, speed spikes, light levels).\n2. Connectivity: Data is streamed to cloud platforms via 5G, Wi-Fi, or LoRaWAN protocols.\n3. Data Processing: Analytical servers or edge models aggregate and analyze incoming telemetries of nodes.\n4. User Interface: Alarms are triggered, dashboards updated, or actuators automatically adjust operational loads.",
    diagram: "[Sensor Nodes] ---📡---> [Edge Gateways] ---☁️---> [Cloud Analytical Engine] ---> [Actuation / Alerts]",
    summaryTable: {
      header: ["Pillar Layer", "Core Function", "Primary Standard / Protocol"],
      rows: [
        ["Perception Layer", "Gathers physical variables via hardware setups", "Sensors, RFID, GPS modules"],
        ["Network Layer", "Streams raw records to analytical hosts", "5G, Wi-Fi, MQTT, CoAP"],
        ["Support Layer", "Processes, aggregates, and organizes datasets", "Cloud compute, database clustering"],
        ["Application Layer", "Exposes actionable controls to end-users", "Dashboards, automated switches, APIs"]
      ]
    },
    mnemonics: "Remember 'P-N-S-A' to map out the IoT layers from physical ground to browser screen: Perception, Network, Support, Application.",
    color: "amber"
  },
  {
    id: "note_ec",
    subject: "Introduction to Economics",
    title: "The Law of Demand, Supply & Market Equilibrium",
    intro: "Economics is fundamentally the study of structural choices in a world of limited resources. Understanding how market prices reach their baseline balances is key to evaluating macro policies.",
    definition: "Market Equilibrium is the specific price-point where the quantity demanded by consumers exactly matches the quantity supplied by producers, eliminating local deficits and surpluses.",
    explanation: "The demand-supply cycle behaves as follows:\n- Law of Demand: Ceteris paribus, price and quantity demanded maintain an inverse relationship (downward sloping curve).\n- Law of Supply: Ceteris paribus, price and quantity supplied maintain a positive correlation (upward sloping curve).\n- Shifting forces: While a price change moves molecules *along* the curve, changes in variables like consumer tastes, input costs, and raw materials *shift* the entire curve, establishing a new equilibrium.",
    diagram: " Price 💰|\n   P*  | \`'--.  /  <- Supply (S)\n       |     X\n       |    / \`'--. <- Demand (D)\n       +-------------\n            Q*      Quantity 📦",
    summaryTable: {
      header: ["Market State", "Price Context", "Immediate Effect", "Economic Resolution"],
      rows: [
        ["Surplus", "Price is set above equilibrium", "Quantity supplied exceeds demanded", "Producers lower prices to clear excess inventory"],
        ["Shortage", "Price is set below equilibrium", "Quantity demanded exceeds supplied", "Consumers bid up prices, boosting factory volumes"],
        ["Equilibrium", "Price is set exactly at intersection", "Demand equals supply perfectly", "Market is cleared; price remains stable"]
      ]
    },
    mnemonics: "When thinking of shifts: Left leaves demand/supply LESS (decreases). Right represents MORE (increases).",
    color: "blue"
  },
  {
    id: "note_bi",
    subject: "General Biology",
    title: "Understanding Photosynthesis Energy Pathways",
    intro: "All organic energetic currencies derive from biological carbon fixation. Photosynthesis is the primary bridge converting solar radiation into chemical energy locked in sugar structures.",
    definition: "Photosynthesis is the metabolic pathway by which plants, algae, and some bacteria synthesize high-energy glucose molecules from carbon dioxide and water using light radiation as the activation engine.",
    explanation: "Photosynthesis is neatly divided into two distinct metabolic stages:\n1. Light-Dependent Reactions: Occur inside the thylakoid membranes of chloroplasts. Sunlight splits water molecules (photolysis), liberating oxygen waste, and charging electrons to synthesize ATP and NADPH.\n2. Light-Independent Reactions / Calvin Cycle: Takes place within the chloroplast stroma. Does not need direct light. Uses the synthesized ATP and NADPH from stage 1 to fix carbon dioxide into three-carbon sugars, eventually generating organic glucose.",
    diagram: "  [Sunlight] + [Water] 💧 ---> (Thylakoids: Light Rx) ---> [ATP + NADPH] ---> (Stroma: Calvin Cycle) -> [Glucose] 🍭\n                                    ↓                                           ↑\n                               [Oxygen] 🌬️                                  [CO2] 💨",
    summaryTable: {
      header: ["Process Phase", "Spatial Location", "Crucial Input Parameters", "Resulting End Products"],
      rows: [
        ["Light Reactions", "Thylakoid membranes", "Sunlight, H2O, NADP+, ADP", "Oxygen, ATP, NADPH"],
        ["Calvin Cycle", "Chloroplast stroma", "Carbon dioxide, ATP, NADPH", "G3P Sugars, NADP+, ADP"]
      ]
    },
    mnemonics: "Remember: 'L-ig-h-t' yields O2 in Thylakoids, 'C-a-l-v-i-n' cooks CO2 into Glucose in Stroma.",
    color: "emerald"
  },
  {
    id: "note_eg",
    subject: "Communicative English",
    title: "Reported Speech & Conditional Clauses Matrix",
    intro: "Advanced communication in English requires systematic mastery of reported speech formatting and conditional truth tables.",
    definition: "Reported Speech (Indirect Speech) is the linguistic system of conveying what someone said without writing their exact literal words, requiring systematic backshifts of tenses, pronouns, and time-markers.",
    explanation: "Two core structural rules to study for national exams:\n\n1. Reported Speech Tense Backshifts:\n- Simple Present -> Simple Past ('I study' -> 'He said he studied')\n- Present Continuous -> Past Continuous ('I am studying' -> 'She said she was studying')\n- Simple Past / Present Perfect -> Past Perfect ('I studied' -> 'He said he had studied')\n\n2. Conditional Clauses Matrix:\n- Zero Conditional: Facts and absolute truths. [If + Present, Present]\n- First Conditional: Real, highly possible futures. [If + Present, Will + Verb]\n- Second Conditional: Imaginary or highly hypothetical situations. [If + Past, Would + Verb]\n- Third Conditional: Unchangeable past regrets or hypothetical history. [If + Past Perfect, Would Have + Past Participle]",
    diagram: "[Direct Speech] --- (Backshift Tense + Shift Pronoun) ---> [Reported Speech Form]",
    summaryTable: {
      header: ["Direct Time Phrase", "Reported Counterpart", "Direct Verb Tense", "Reported Verb Tense"],
      rows: [
        ["today", "that day", "is studying", "was studying"],
        ["tomorrow", "the next day", "completed", "had completed"],
        ["yesterday", "the day before", "will study", "would study"]
      ]
    },
    mnemonics: "When reporting from the past: move one tense back in time. Present goes past; simple past slips into past perfect.",
    color: "indigo"
  },
  {
    id: "note_mc",
    subject: "Moral and Civic Education",
    title: "The Ethiopian Constitutional System & Civic Duties",
    intro: "Civic education builds responsible, knowledgeable community leaders. The ultimate framework guiding civic engagement in Ethiopia is the national constitution, detailing state structures and citizen duties.",
    definition: "Human Rights are fundamental, inalienable moral claims which all individuals possess by virtue of their common humanity, recognized and protected legally under the supreme rule of law.",
    explanation: "The Constitutional Federal System of Ethiopia (1995 Federal Constitution):\n- Sovereign Authority: Article 8 vests all state sovereignty in the Nations, Nationalities and Peoples of Ethiopia.\n- Separation of Duties: Governed under the Trias Politica, split between: HPR (legislative Hanes), Prime Minister (Executive command), and the Federal Courts (Judiciary checks).\n- Regional Autonomy: Under geographic structural federalism, regions manage local budgets, maintain native languages, and run state assemblies while respecting federal parameters.",
    diagram: "           [FEDERAL CONSTITUTION] (Supreme Law)\n                     /\n     +---------------+------------+ \n     ↓                            ↓\n [Human Rights] (Article 14-28)   [Democratic Rights] (Article 29-44)",
    summaryTable: {
      header: ["Constitutional Chapter", "Core Articles Covered", "Major Guarantee / Standard", "Practical Citizen Effect"],
      rows: [
        ["Chapter One", "Articles 1 - 7", "Nomenclature, state shape, secular status", "Specifies federalism limits"],
        ["Chapter Two", "Articles 8 - 12", "Sovereignty of peoples, rule of law", "Guarantees public accountability"],
        ["Chapter Three", "Articles 14 - 44", "Human Rights & Democratic Rights", "Protects free speech and assembly"]
      ]
    },
    mnemonics: "Think of Chapters One, Two, and Three as defining: Our State Identity, Our Sovereign Trust, and Our Inalienable Human Freedoms.",
    color: "rose"
  },
  {
    id: "note_ma",
    subject: "Mathematics",
    title: "Differential Calculus & The Power Rule",
    intro: "Calculus is the mathematical language of change. Differential calculus enables us to calculate precise instantaneous rates of change and find gradients of curves at single points.",
    definition: "The Derivative of a function f(x) measures how fast the output f(x) changes with respect to small changes in the input x.",
    explanation: "Core techniques for standard curriculum examinations:\n- The Power Rule: For any real power n, the derivative of x^n with respect to x is n * x^(n-1).\n- Product Rule: Used when two functions are multiplied: d/dx [u*v] = u'v + uv'.\n- Quotient Rule: Used when functions are divided: d/dx [u/v] = (u'v - uv') / v^2.\n- Chain Rule: Used for composite functions: dy/dx = dy/du * du/dx.",
    diagram: "  Gradient (m) = lim [f(x + h) - f(x)] / h as h -> 0\n  Curve: f(x) = x^2   ==>   Tangent line at x=2 has slope m = 4",
    summaryTable: {
      header: ["Function f(x)", "Derivative f'(x)", "Rule Name", "Example Application"],
      rows: [
        ["c (constant)", "0", "Constant Rule", "d/dx (5) = 0"],
        ["x^n", "n * x^(n-1)", "Power Rule", "d/dx (x^3) = 3x^2"],
        ["sin(x)", "cos(x)", "Trig Rule", "d/dx (2 sin(x)) = 2 cos(x)"],
        ["e^x", "e^x", "Exponential", "d/dx (e^(3x)) = 3e^(3x)"]
      ]
    },
    mnemonics: "Power Rule: 'Bring the exponent to the front, then subtract one from the power!'",
    color: "blue"
  },
  {
    id: "note_ie",
    subject: "Inclusive Education",
    title: "Universal Design for Learning (UDL) Framework",
    intro: "Inclusive education is founded on the conviction that every student has a fundamental right to a supportive, adaptive learning environment that removes historical instructional barriers.",
    definition: "Universal Design for Learning (UDL) is an educational framework that guides the development of flexible learning environments to accommodate individual learning differences.",
    explanation: "UDL is structured around three core brain-network principles:\n1. Multiple Means of Engagement (The 'Why' of learning): Recruiting student interest, sustaining effort, and fostering self-regulation.\n2. Multiple Means of Representation (The 'What' of learning): Presenting information and content in varied formats (text, audio, graphics, hands-on activity).\n3. Multiple Means of Action & Expression (The 'How' of learning): Giving learners alternative ways to demonstrate what they know through customizable assessments.",
    diagram: "     [UDL Framework] ===> [Engagement] (Why) / [Representation] (What) / [Action] (How)",
    summaryTable: {
      header: ["UDL Principle", "Brain Network", "Instructional Strategy", "Real-world Example"],
      rows: [
        ["Engagement", "Affective Network", "Fostering collaboration, offering choices", "Group projects with flexible roles"],
        ["Representation", "Recognition Network", "Offering visual & auditory alternatives", "E-textbooks with built-in text-to-speech"],
        ["Action & Expression", "Strategic Network", "Providing diverse media options for feedback", "Allowing a podcast or essay submission"]
      ]
    },
    mnemonics: "Think of the brain's 3 networks: Feel it (Engagement), See/Hear it (Representation), and Do it (Expression).",
    color: "emerald"
  },
  {
    id: "note_ge",
    subject: "Geography",
    title: "Ethiopia's Physical Topography & River Basins",
    intro: "Ethiopia possesses a highly diverse and dramatic topography. Understanding the rift system and water resource networks is crucial for studying East African physical geography.",
    definition: "The East African Rift System is a continuous active continental rift zone that bisects the Ethiopian highlands, shaping the country's lakes and major drainage systems.",
    explanation: "Ethiopia is divided into three major topographical regions:\n1. The Western Highlands and Lowlands: Includes high peaks like Ras Dashen. Drained by the Blue Nile (Abbay), Tekeze, and Baro rivers.\n2. The Eastern Highlands and Lowlands: Separated by the Rift Valley. Features the Bale and Arsi mountain chains, drained by the Wabi Shebelle and Genale-Dawa rivers.\n3. The Ethiopian Rift Valley: A graben containing numerous lakes (e.g., Langano, Abaya, Chamo) and the endorheic Awash River Basin.",
    diagram: " Western Highlands <--- [ Great Rift Valley ] ---> Eastern Highlands\n Drained by Abbay         (Chain of Lakes)          Drained by Wabi Shebelle",
    summaryTable: {
      header: ["Drainage Basin", "Main Rivers Included", "Flow Destination", "Major Characteristics"],
      rows: [
        ["Western (Mediterranean)", "Abbay, Tekeze, Baro", "Mediterranean Sea (via Nile)", "High surface runoff volume, deep gorges"],
        ["Southeastern (Indian Ocean)", "Wabi Shebelle, Genale", "Indian Ocean", "Longest river courses, arid lower basin"],
        ["Internal (Rift Valley)", "Awash, Omo", "Endorheic Lakes (Abaya, Turkana)", "High evaporation rates, intense irrigation use"]
      ]
    },
    mnemonics: "Mediterranean-bound rivers move West; Indian-bound rivers move Southeast; Rift Valley rivers stay Internal.",
    color: "teal"
  },
  {
    id: "note_lo",
    subject: "Logic and Critical Thinking",
    title: "Identifying Common Informal Fallacies",
    intro: "Critical thinking is the primary armor against manipulative rhetoric. Recognizing informal fallacies ensures soundness and validity in philosophical and daily arguments.",
    definition: "An Informal Fallacy is an error in reasoning that occurs in the content, context, or language of an argument, rather than its formal algebraic structure.",
    explanation: "Common categories of informal fallacies:\n- Fallacies of Relevance: The premises are logically irrelevant to the conclusion. Examples include Ad Hominem (attacking the speaker) and Straw Man (misrepresenting the opponent's argument).\n- Fallacies of Weak Induction: The premises support the conclusion, but not strongly enough. Examples include Hasty Generalization and Appeal to Ignorance.\n- Fallacies of Presumption: The premises assume what they are supposed to prove. Example: Begging the Question (circular reasoning).",
    diagram: "  [Premise] --- (Weak, irrelevant, or circular connection) -X-> [Conclusion]",
    summaryTable: {
      header: ["Fallacy Name", "Logical Error", "Classic Example", "Detection Tip"],
      rows: [
        ["Ad Hominem", "Attacks the individual's character instead of the argument", "Disregarding a scientist's findings because of their personality", "Look for personal insults"],
        ["Straw Man", "Distorts the opponent's position to make it easier to attack", "Claiming that wanting more school funding means you hate the military", "Check original argument"],
        ["Slippery Slope", "Claims an initial step will inevitably lead to an extreme disaster", "Asserting that if we let students choose seats, schools will burn down", "Identify unproven claims"]
      ]
    },
    mnemonics: "Straw Man = building a fake scarecrow to kick down. Ad Hominem = throwing stones at the person.",
    color: "indigo"
  },
  {
    id: "note_hi",
    subject: "History",
    title: "The Battle of Adwa (1896) & Its Global Legacy",
    intro: "The Battle of Adwa remains a monumental event in global history, representing a decisive victory for African sovereignty against European colonial aggression.",
    definition: "The Battle of Adwa was fought on March 1, 1896, between the Ethiopian Empire under Emperor Menelik II and the Kingdom of Italy, securing Ethiopian independence.",
    explanation: "Key strategic phases of the conflict:\n- The Treaty of Wuchale (1889): Article 17 had a discrepancy. The Amharic version offered Ethiopia optional diplomatic assistance, while the Italian version made Ethiopia a protectorate. This led to conflict.\n- National Mobilization: Empress Taytu Betul urged resistance. Menelik II mobilized over 100,000 unified troops across diverse regions.\n- Tactical Victory: Italian generals were lured into rugged, unfamiliar terrain at Adwa, leading to their decisive encirclement and defeat.",
    diagram: "   [Treaty Discrepancy] ---> [National Mobilization] ---> [Battle of Adwa Victory]",
    summaryTable: {
      header: ["Historical Milestone", "Key Characters", "Primary Cause / Event", "Global Impact"],
      rows: [
        ["Treaty of Wuchale", "Menelik II, Antonelli", "Article 17 translation dispute", "Shattered diplomatic trust"],
        ["Battle of Adwa", "Empress Taytu, Menelik II", "Defensive action on March 1, 1896", "Preserved national sovereignty"],
        ["Treaty of Addis Ababa", "Ethiopian and Italian envoys", "Italy recognized absolute independence", "Inspirer of Pan-Africanism"]
      ]
    },
    mnemonics: "Adwa: A - African triumph, D - Decisive victory, W - Wuchale rejected, A - Absolute independence.",
    color: "red"
  },
  {
    id: "note_ch",
    subject: "Chemistry",
    title: "Chemical Bonding and Molecular Geometry",
    intro: "Chemical bonding explains how atoms organize themselves into molecules and lattices. The valence shell structure determines the type of bond and resulting geometry.",
    definition: "A Chemical Bond is the lasting attractive force between atoms, ions, or molecules that enables the formation of chemical compounds.",
    explanation: "The three primary types of chemical bonds are:\n1. Ionic Bonds: Complete transfer of valence electrons from a metal to a non-metal, creating electrostatic attraction (e.g., NaCl).\n2. Covalent Bonds: Sharing of electron pairs between non-metal atoms. Can be polar (unequal sharing) or non-polar (equal sharing).\n3. Metallic Bonds: Attraction between a lattice of positive metal cations and a delocalized sea of valence electrons.",
    diagram: "  Ionic: [Na]+  [Cl]-   (Transfer)   |   Covalent: H - O - H  (Sharing)",
    summaryTable: {
      header: ["Bond Type", "Electron Behavior", "Typical Elements", "Key Physical Properties"],
      rows: [
        ["Ionic", "Transferred from metal to non-metal", "Metal + Non-metal", "High melting points, conducts in water"],
        ["Covalent", "Shared between atoms", "Non-metal + Non-metal", "Lower melting points, poor conductors"],
        ["Metallic", "Delocalized sea of electrons", "Metals only", "Excellent thermal/electrical conductivity, malleable"]
      ]
    },
    mnemonics: "Ionic = I transfer (stealing). Covalent = CO-operating (sharing). Metallic = Mobile sea.",
    color: "cyan"
  },
  {
    id: "note_ap",
    subject: "Aptitude",
    title: "Solving Work and Time Equations",
    intro: "Work and time problems are staples of quantitative aptitude and logical reasoning exams. Learning the rate-based formulation makes solving these complex problems straightforward.",
    definition: "Work-Rate is the reciprocal of the time taken to complete a job, representing the fraction of the job completed in one unit of time.",
    explanation: "Key concepts to solve Work and Time problems:\n- Work Done = Rate of Work * Time Taken. (W = R * T).\n- Combined Work Rate: If Person A takes 'a' hours and Person B takes 'b' hours, their combined rate per hour is (1/a) + (1/b). The time taken together is the reciprocal: (a * b) / (a + b).\n- Inverse Variation: If the number of workers increases, the time taken to complete the same work decreases proportionally: M1 * D1 * H1 = M2 * D2 * H2.",
    diagram: "  [Worker A: 1/6 job/hr] + [Worker B: 1/12 job/hr] ===> [Combined: 1/4 job/hr] (Takes 4 hours)",
    summaryTable: {
      header: ["Scenario", "Formula to Apply", "Variable Meanings", "Sample Calculation"],
      rows: [
        ["Two Workers Together", "Time = (a * b) / (a + b)", "a, b = individual times", "6 and 3 hrs -> (6*3)/(6+3) = 2 hrs"],
        ["Group of Workers", "M1 * D1 = M2 * D2", "M = Men, D = Days", "10 men in 4 days -> 5 men in 8 days"],
        ["Efficiency Comparison", "Rate1 / Rate2 = Eff1 / Eff2", "Eff = efficiency ratio", "A is twice as fast -> Rate A = 2 * Rate B"]
      ]
    },
    mnemonics: "Think of work rate as speed. Speed up by adding individual rates together!",
    color: "violet"
  },
  {
    id: "note_ph",
    subject: "General Physics",
    title: "Newton's Three Laws of Motion",
    intro: "Dynamics is the branch of mechanics concerned with the forces that cause motion. Sir Isaac Newton's three laws form the foundation of classical mechanics.",
    definition: "Force is a vector quantity that represents any interaction which, when unopposed, will change the motion of an object.",
    explanation: "Newton's three core principles:\n1. First Law (Law of Inertia): An object remains at rest or in uniform motion unless acted upon by a net external force.\n2. Second Law (Law of Acceleration): The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass: F_net = m * a.\n3. Third Law (Action-Reaction): For every action, there is an equal and opposite reaction.",
    diagram: "  Force = Mass * Acceleration  [ Box m ] ===> Force (F)  ===>  Acceleration (a = F/m)",
    summaryTable: {
      header: ["Newton's Law", "Core Principle", "Mathematical Form", "Everyday Example"],
      rows: [
        ["First Law", "Inertia (resistance to change)", "If F_net = 0, v = constant", "Passengers jerk forward when a car brakes"],
        ["Second Law", "Acceleration is proportional to force", "F = m * a", "Pushing an empty cart vs. a loaded heavy cart"],
        ["Third Law", "Forces always occur in matched pairs", "F_AB = -F_BA", "A rocket launching upwards by pushing exhaust gas down"]
      ]
    },
    mnemonics: "Inertia holds it back, Force speeds it up, Opposites push back!",
    color: "purple"
  },
  {
    id: "note_en",
    subject: "Entrepreneurship",
    title: "The Business Model Canvas Framework",
    intro: "Starting a business venture requires systematic planning. The Business Model Canvas allows entrepreneurs to visualize, design, and pivot their business model on a single page.",
    definition: "A Business Model Canvas is a strategic management template for developing new or documenting existing business models.",
    explanation: "The canvas comprises nine essential building blocks:\n1. Customer Segments: The target audience/users.\n2. Value Propositions: The unique products or services solving customer problems.\n3. Channels: How the value proposition is delivered.\n4. Customer Relationships: The types of interaction established.\n5. Revenue Streams: How the business makes money.\n6. Key Resources: Crucial assets needed to make the model work.\n7. Key Activities: Critical actions to deliver value.\n8. Key Partnerships: External networks/allies.\n9. Cost Structure: Major operational costs.",
    diagram: "  [ Partners ] -> [ Activities ] -> [ Value Prop ] -> [ Relationships ] -> [ Customers ]\n                    [ Resources ] -> [  Channels  ]\n         [ Cost Structure ]       ========>        [ Revenue Streams ]",
    summaryTable: {
      header: ["Canvas Pillar", "Primary Focus", "Key Question to Ask", "Example Strategy"],
      rows: [
        ["Value Proposition", "The product/service offering", "What value do we deliver to the customer?", "On-demand educational prep materials"],
        ["Customer Segments", "Target consumer groups", "For whom are we creating value?", "Ethiopian high school & university students"],
        ["Revenue Streams", "Financial cash inflows", "How will the business capture value?", "Freemium subscription, study book sales"]
      ]
    },
    mnemonics: "Think of the canvas as: Who (Customers), What (Value), How (Activities/Partners), and How Much (Cost/Revenue).",
    color: "amber"
  },
  {
    id: "note_sa",
    subject: "Social Anthropology",
    title: "Understanding Cultural Relativism",
    intro: "Anthropology is the holistic study of humanity. Cultural relativism is the foundational theoretical paradigm used to study diverse human societies objectively.",
    definition: "Cultural Relativism is the principle of understanding an individual's beliefs and activities in terms of that individual's own culture, rather than judging them by external standards.",
    explanation: "Key dimensions of the anthropological approach:\n- Ethnocentrism (The Opposite): The tendency to view one's own culture as superior and use its values as a benchmark to judge foreign cultures.\n- Methodological Relativism: A scientific tool to suspend moral judgment temporarily to understand the logic behind unfamiliar practices.\n- Ethnography: The primary fieldwork method involving participant observation, where the anthropologist lives within the community to gain an emic (insider) perspective.",
    diagram: "  Your Culture (Standards) -X-> Ethnocentrism (Bias) -> [ foreign Culture ]\n  foreign Culture <--- Cultural Relativism (Understanding) ---> foreign Culture Context",
    summaryTable: {
      header: ["Concept Name", "Core Perspective", "Scientific Goal", "Potential Pitfall"],
      rows: [
        ["Ethnocentrism", "Own culture is the gold standard", "Fosters group cohesion but breeds bias", "Cultural intolerance"],
        ["Cultural Relativism", "Evaluate within local context", "Objective cultural analysis", "Can lead to moral paralysis"],
        ["Emic Perspective", "Insider point-of-view", "Understand local logic", "Loss of analytical distance"]
      ]
    },
    mnemonics: "Relativism means: 'Compare culture to its own context, not your own backyard!'",
    color: "rose"
  },
  {
    id: "note_cpp",
    subject: "C++ Programming",
    title: "Pointers and Dynamic Memory Management",
    intro: "C++ is a powerful language that gives developers direct access to computer memory. Mastering pointers and dynamic allocation is essential for professional programming.",
    definition: "A Pointer is a variable that stores the direct memory address of another variable, rather than holding a direct data value.",
    explanation: "Core memory operations in C++:\n- Reference Operator (&): Retrieves the memory address of a variable (e.g., `int* p = &x`).\n- Dereference Operator (*): Accesses the value stored at the address pointed to by a pointer.\n- Heap Allocation (`new`): Dynamically allocates memory on the system heap at runtime.\n- Deallocation (`delete`): Releases dynamically allocated heap memory back to the operating system to prevent memory leaks.",
    diagram: "  Pointer variable 'p' (Address: 0x7ffd) ---> Value: 0x1004 (Address of x) ===> [ Variable x: Value 42 ]",
    summaryTable: {
      header: ["Operator / Keyword", "Syntax Example", "Core Operation", "Critical Precaution"],
      rows: [
        ["Address-Of (&)", "p = &myVar;", "Gets variable memory address", "Ensure pointer matches variable type"],
        ["Dereference (*)", "int val = *p;", "Gets value at pointed address", "Never dereference a null/wild pointer"],
        ["new operator", "int* arr = new int[5];", "Allocates heap memory block", "Always pair with delete to prevent leaks"],
        ["delete operator", "delete[] arr;", "Frees dynamic memory block", "Avoid double-delete; set pointer to nullptr"]
      ]
    },
    mnemonics: "Ampersand (&) asks 'Where is it?', Asterisk (*) asks 'What is inside it?', delete cleans it up!",
    color: "blue"
  }
];

