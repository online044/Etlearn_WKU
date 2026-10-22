import { AuthenticCurriculumQuestion } from './mathQuestions';

export const AUTHENTIC_BIOLOGY_QUESTIONS_HU_1011: AuthenticCurriculumQuestion[] = [
  // ─── UNIT 1: CELL BIOLOGY & MEMBRANE TRANSPORT ───
  {
    questionText: "Which cellular organelle is responsible for post-translational modification, sorting, and packaging of proteins into secretory vesicles?",
    options: [
      "Golgi Apparatus",
      "Rough Endoplasmic Reticulum",
      "Peroxisome",
      "Lysosome"
    ],
    correctIndex: 0,
    topic: "Organelle Functions & Protein Trafficking",
    unit: "Unit 1",
    chapter: "Chapter 1: Cell Structure & Organelles",
    difficulty: "easy",
    explanation: "The Golgi apparatus modifies proteins received from the rough ER (e.g. glycosylation), sorts them according to molecular destination tags, and packages them into vesicles.",
    amharicExplanation: "ጎልጂ አፓራተስ (Golgi Apparatus) ፕሮቲኖችን በማዘጋጀት፣ በማሸግ እና ወደ ተገቢው ሴል ክፍል በመላክ ኃላፊነት የተሰጠው አካል ነው።"
  },
  {
    questionText: "When human red blood cells (erythrocytes) are placed in a pure hypotonic distilled water solution, what cellular event occurs?",
    options: [
      "Lysis (the cells swell and burst due to osmotic water influx)",
      "Crenation (the cells shrink and shrivel due to water loss)",
      "Plasmolysis of the central vacuole",
      "Active efflux of sodium ions to maintain cell shape"
    ],
    correctIndex: 0,
    topic: "Osmosis & Tonicity in Animal Cells",
    unit: "Unit 1",
    chapter: "Chapter 2: Membrane Transport",
    difficulty: "easy",
    explanation: "In a hypotonic solution, the extracellular solute concentration is lower than intracellular fluids. Water moves down its osmotic gradient into the cells. Lacking rigid cell walls, animal erythrocytes swell and undergo osmotic lysis (bursting).",
    amharicExplanation: "የሰው ልጅ ቀይ የደም ሴሎች በውሃ (Hypotonic) ውስጥ ሲገቡ ውሃ ወደ ውስጥ ስለሚገባ አብጠው ይፈነዳሉ (Lysis)።"
  },

  // ─── UNIT 2: BIOENERGETICS & CELLULAR RESPIRATION ───
  {
    questionText: "During aerobic cellular respiration in eukaryotic cells, in which sub-cellular compartment does the citric acid cycle (Krebs Cycle) take place?",
    options: [
      "Mitochondrial Matrix",
      "Inner Mitochondrial Membrane (cristae)",
      "Cytoplasm (Cytosol)",
      "Mitochondrial Intermembrane Space"
    ],
    correctIndex: 0,
    topic: "Cellular Respiration Stages & Locations",
    unit: "Unit 2",
    chapter: "Chapter 1: Cellular Respiration",
    difficulty: "medium",
    explanation: "Glycolysis occurs in the cytosol. Pyruvate is transported into the mitochondrial matrix, where both pyruvate decarboxylation (link reaction) and the Krebs citric acid cycle occur. The electron transport chain takes place across the inner mitochondrial membrane.",
    amharicExplanation: "ክሬብስ ሳይክል (Krebs cycle) የሚካሄደው በማይቶኮንድሪያ ማትሪክስ (Mitochondrial Matrix) ውስጥ ነው። ግላይኮላይሲስ ግን በሳይቶሶል ውስጥ ነው።"
  },
  {
    questionText: "What is the primary role of molecular oxygen (O₂) in aerobic cellular respiration?",
    options: [
      "Serving as the terminal electron acceptor at Complex IV of the electron transport chain to form water",
      "Directly cleaving glucose into two pyruvate molecules during glycolysis",
      "Activating ATP synthase through oxidative phosphorylation",
      "Transferring acetyl groups into oxaloacetate"
    ],
    correctIndex: 0,
    topic: "Electron Transport Chain & Terminal Acceptors",
    unit: "Unit 2",
    chapter: "Chapter 1: Oxidative Phosphorylation",
    difficulty: "medium",
    explanation: "Oxygen has high electronegativity and serves as the final electron acceptor at the end of the respiratory electron transport chain, binding electrons and protons to form H₂O.",
    amharicExplanation: "ኦክስጅን በኤሌክትሮን ማስተላለፊያ ሰንሰለት መጨረሻ ላይ ኤሌክትሮኖችን በመቀበል ከሃይድሮጅን ጋር ተዋህዶ ውሃ (H₂O) የሚፈጥር የመጨረሻ ተቀባይ ነው።"
  },

  // ─── UNIT 3: PHOTOSYNTHESIS ───
  {
    questionText: "In the Calvin cycle of photosynthesis, which key enzyme catalyzes the initial carbon fixation reaction between CO₂ and ribulose-1,5-bisphosphate (RuBP)?",
    options: [
      "RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase)",
      "ATP Synthase",
      "PEP Carboxylase",
      "Phosphofructokinase"
    ],
    correctIndex: 0,
    topic: "Photosynthetic Carbon Fixation & Calvin Cycle",
    unit: "Unit 3",
    chapter: "Chapter 1: Photosynthesis & Calvin Cycle",
    difficulty: "easy",
    explanation: "RuBisCO is the primary enzyme in the stroma of chloroplasts that fixes inorganic atmospheric CO₂ into an organic intermediate during the first stage of the light-independent Calvin cycle.",
    amharicExplanation: "ሩቢስኮ (RuBisCO) በክሎሮፕላስት ስትሮማ ውስጥ CO₂ ን ከ RuBP ጋር በማዋሃድ ካርቦንን የሚቀይር ዋና ኢንዛይም ነው።"
  },

  // ─── UNIT 4: MOLECULAR GENETICS & CELL DIVISION ───
  {
    questionText: "During which specific sub-phase of Meiosis I does homologous genetic recombination (crossing over) occur?",
    options: [
      "Pachytene stage of Prophase I",
      "Metaphase I",
      "Anaphase I",
      "Telophase I"
    ],
    correctIndex: 0,
    topic: "Meiosis & Genetic Recombination",
    unit: "Unit 4",
    chapter: "Chapter 1: Cell Division & Crossing Over",
    difficulty: "hard",
    explanation: "Synapsis occurs during Zygotene of Prophase I, and non-sister chromatids of homologous chromosomes undergo reciprocal genetic crossing over during the Pachytene stage, resulting in chiasmata visible in Diplotene.",
    amharicExplanation: "ክሮሲንግ ኦቨር (Crossing over) የሚካሄደው በፕሮፌዝ 1 (Prophase I) የፓኪቲን (Pachytene) ንዑስ ደረጃ ላይ ነው።"
  },
  {
    questionText: "If a double-stranded DNA molecule contains 28% Adenine (A), what is the percentage of Cytosine (C) present according to Chargaff's rules?",
    options: [
      "22%",
      "28%",
      "44%",
      "14%"
    ],
    correctIndex: 0,
    topic: "Chargaff's Rules & DNA Base Composition",
    unit: "Unit 4",
    chapter: "Chapter 2: DNA Structure & Replication",
    difficulty: "easy",
    explanation: "By Chargaff's rules, %A = %T = 28%. Total A + T = 56%. The remaining base pairs must be G + C = 100% - 56% = 44%. Because %G = %C, the percentage of Cytosine is 44% / 2 = 22%.",
    amharicExplanation: "በቻርጋፍ ሕግ A = T = 28% (ድምር 56%)። የቀረው G + C = 44% ስለሆነ የሳይቶሲን (C) መጠን 44% / 2 = 22% ይሆናል።"
  },
  {
    questionText: "Which of the following represents the correct sequential order of the phases of mitosis?",
    options: [
      "Prophase → Metaphase → Anaphase → Telophase",
      "Interphase → Anaphase → Metaphase → Telophase",
      "Metaphase → Prophase → Anaphase → Cytokinesis",
      "Prophase → Anaphase → Metaphase → Telophase"
    ],
    correctIndex: 0,
    topic: "Mitosis & Cell Division",
    unit: "Unit 4",
    chapter: "Chapter 1: Cell Cycle & Mitosis",
    difficulty: "easy",
    explanation: "Mitosis proceeds strictly through Prophase (chromatin condensation), Metaphase (equatorial alignment), Anaphase (sister chromatid separation), and Telophase (nuclear envelope reformation).",
    amharicExplanation: "የማይቶሲስ ቅደም ተከተል፡ ፕሮፌዝ → ሜታፌዝ → አናፌዝ → ቴሎፌዝ (PMAT) ነው።"
  },
  {
    questionText: "Which blood group is known as the universal recipient in the ABO blood typing system?",
    options: [
      "Type AB positive (AB+)",
      "Type O negative (O-)",
      "Type A positive (A+)",
      "Type B negative (B-)"
    ],
    correctIndex: 0,
    topic: "Human Blood Groups & Immunology",
    unit: "Unit 5",
    chapter: "Chapter 1: Human Physiology & Blood",
    difficulty: "easy",
    explanation: "Individuals with AB+ blood have both A and B antigens on erythrocytes and lack anti-A, anti-B, and anti-Rh antibodies in plasma, allowing them to receive red cells from any ABO/Rh donor.",
    amharicExplanation: "የደም አይነት AB+ በፕላዝማው ውስጥ ምንም አይነት ፀረ-እንግዳ (Antibodies) ስለሌለው ከማንኛውም የደም አይነት ደም መውሰድ ይችላል (Universal recipient)።"
  },
  {
    questionText: "In human ecology and community dynamics, what type of symbiotic relationship exists between nitrogen-fixing Rhizobium bacteria and leguminous root nodules in Ethiopian agriculture?",
    options: [
      "Mutualism (+/+)",
      "Commensalism (+/0)",
      "Parasitism (+/-)",
      "Amensalism (-/0)"
    ],
    correctIndex: 0,
    topic: "Ecology & Symbiotic Interactions",
    unit: "Unit 5",
    chapter: "Chapter 2: Ecology & Ecosystems",
    difficulty: "easy",
    explanation: "Rhizobium fixes atmospheric nitrogen (N₂) into bioavailable ammonium for the legume, while the plant supplies carbohydrates and a protected anaerobic environment (leghemoglobin). Both organisms benefit (+/+).",
    amharicExplanation: "ራይዞቢየም ለባቄላ እና አተር ናይትሮጅን ሲያቀርብ ተክሉ ደግሞ ምግብና ከለላ ይሰጠዋል፤ ሁለቱም ተጠቃሚ የሚሆኑበት ሙቹዋሊዝም (Mutualism) ነው።"
  },
  {
    questionText: "What is the primary function of the myelin sheath surrounding the axons of vertebrate motor neurons?",
    options: [
      "To accelerate action potential propagation via saltatory conduction",
      "To produce neurotransmitters such as acetylcholine",
      "To absorb mechanical shocks in the synaptic cleft",
      "To synthesize ribosomal RNA for axonal maintenance"
    ],
    correctIndex: 0,
    topic: "Nervous System & Action Potentials",
    unit: "Unit 5",
    chapter: "Chapter 3: Animal Physiology & Neurobiology",
    difficulty: "medium",
    explanation: "Myelin acts as an electrical insulator interrupted at the Nodes of Ranvier, allowing action potentials to jump rapidly from node to node (saltatory conduction), greatly increasing conduction velocity.",
    amharicExplanation: "የማይሊን ሽፋን (Myelin sheath) የነርቭ መልእክት በሳልታቶሪ ኮንዳክሽን (Saltatory conduction) በጣም ፈጣን በሆነ ፍጥነት እንዲተላለፍ ያስችላል።"
  },
  {
    questionText: "Which plant hormone is primarily responsible for promoting apical dominance and phototropism by migrating toward the shaded side of stems?",
    options: [
      "Auxin (Indole-3-acetic acid)",
      "Gibberellin",
      "Ethylene",
      "Abscisic acid (ABA)"
    ],
    correctIndex: 0,
    topic: "Plant Physiology & Phytohormones",
    unit: "Unit 3",
    chapter: "Chapter 2: Plant Growth & Regulation",
    difficulty: "medium",
    explanation: "Auxin is synthesized in apical meristems and undergoes polar transport. In response to unilateral light, auxin relocates to the shaded side, stimulating cell elongation and causing positive phototropic bending toward light.",
    amharicExplanation: "ኦክሲን (Auxin) ወደ ጥላው ክፍል በመሄድ ሴሎች እንዲረዝሙ በማድረግ ግንዱ ወደ ብርሃን እንዲታጠፍ (Phototropism) የሚያደርግ የዕፅዋት ሆርሞን ነው።"
  },
  {
    questionText: "During translation in molecular biology, which codon functions as the universal start codon encoding the amino acid Methionine?",
    options: [
      "AUG",
      "UAA",
      "UAG",
      "UGA"
    ],
    correctIndex: 0,
    topic: "Molecular Biology & Protein Synthesis",
    unit: "Unit 4",
    chapter: "Chapter 3: Gene Expression & Translation",
    difficulty: "easy",
    explanation: "AUG serves as the initiation codon for translation in virtually all organisms, signaling the ribosome to begin protein synthesis and placing N-formylmethionine (prokaryotes) or methionine (eukaryotes).",
    amharicExplanation: "AUG የፕሮቲን ምርት መጀመሪያ ኮዶን (Start codon) ሲሆን ሚቲዮኒን (Methionine) የተባለውን አሚኖ አሲድ ይወክላል።"
  }
];
