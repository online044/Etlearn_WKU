/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Official Ethiopian University General Biology Question Bank
 * Exact Schema: id, module_id, module_name, difficulty, chapter, question, options (object), correct_answer, explanation
 */

export interface GeneralBiologyQuestion {
  id: number;
  module_id: number;
  module_name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  chapter: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  is_published?: boolean;
  is_pro?: boolean;
}

export const GENERAL_BIOLOGY_QUESTIONS: GeneralBiologyQuestion[] = [
  // ─── CHAPTER 1: CELL BIOLOGY ───
  {
    id: 1,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "easy",
    chapter: "Cell Biology",
    question: "Which cellular organelle is primarily responsible for ATP synthesis via aerobic cellular respiration?",
    options: {
      A: "Ribosome",
      B: "Mitochondrion",
      C: "Golgi apparatus",
      D: "Lysosome"
    },
    correct_answer: "B",
    explanation: "Mitochondria are the powerhouses of eukaryotic cells, generating most of the chemical energy needed to power the biochemical reactions through aerobic ATP synthesis."
  },
  {
    id: 2,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "easy",
    chapter: "Cell Biology",
    question: "Which organelle is responsible for post-translational modification, sorting, and packaging of proteins into secretory vesicles?",
    options: {
      A: "Golgi Apparatus",
      B: "Rough Endoplasmic Reticulum",
      C: "Peroxisome",
      D: "Centrosome"
    },
    correct_answer: "A",
    explanation: "The Golgi apparatus modifies proteins received from the rough endoplasmic reticulum (such as glycosylation), sorts them according to molecular tags, and packages them into membrane-bound vesicles."
  },
  {
    id: 3,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "easy",
    chapter: "Cell Biology",
    question: "When human red blood cells (erythrocytes) are placed in a pure hypotonic distilled water solution, what cellular event occurs?",
    options: {
      A: "Osmotic lysis (cells swell and burst due to net water influx)",
      B: "Crenation (cells shrink and shrivel due to water loss)",
      C: "Plasmolysis of the large central vacuole",
      D: "Immediate formation of a protective peptidoglycan wall"
    },
    correct_answer: "A",
    explanation: "In a hypotonic solution, solute concentration outside the cell is lower than inside. Water enters the cell by osmosis down its water potential gradient, causing animal erythrocytes to swell and lyse because they lack rigid cell walls."
  },
  {
    id: 4,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "medium",
    chapter: "Cell Biology",
    question: "According to the Singer-Nicolson Fluid Mosaic Model of the plasma membrane, which component creates the primary hydrophobic permeability barrier?",
    options: {
      A: "Peripheral surface glycoproteins",
      B: "Phospholipid bilayer fatty acid hydrocarbon tails",
      C: "Cholesterol polar hydroxyl groups",
      D: "Transmembrane channel alpha-helices"
    },
    correct_answer: "B",
    explanation: "The phospholipid bilayer is amphipathic: the interior core is formed by nonpolar, hydrophobic hydrocarbon tails of fatty acids, creating an impermeable barrier to water-soluble ions and large polar molecules."
  },
  {
    id: 5,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "hard",
    chapter: "Cell Biology",
    question: "Which primary active transport mechanism in mammalian cells pumps 3 sodium ions outward while importing 2 potassium ions per ATP hydrolyzed?",
    options: {
      A: "Proton-motive ATP Synthase",
      B: "Na+/K+ ATPase Pump",
      C: "Calcium Uniporter",
      D: "SGLT1 Sodium-Glucose Cotransporter"
    },
    correct_answer: "B",
    explanation: "The Na+/K+ ATPase pump utilizes the energy of 1 ATP molecule to export 3 Na+ ions out of the cytoplasm and import 2 K+ ions inward, establishing resting membrane potential and electrochemical gradients."
  },

  // ─── CHAPTER 2: BIOENERGETICS & CELLULAR RESPIRATION ───
  {
    id: 6,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "medium",
    chapter: "Bioenergetics & Cellular Respiration",
    question: "During aerobic cellular respiration in eukaryotic cells, where does the citric acid cycle (Krebs cycle) take place?",
    options: {
      A: "Mitochondrial matrix",
      B: "Inner mitochondrial membrane cristae",
      C: "Cytosol",
      D: "Mitochondrial intermembrane space"
    },
    correct_answer: "A",
    explanation: "Glycolysis occurs in the cytosol, but pyruvate enters the mitochondrial matrix where the transition link reaction and the Krebs citric acid cycle take place."
  },
  {
    id: 7,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "medium",
    chapter: "Bioenergetics & Cellular Respiration",
    question: "What is the primary physiological role of molecular oxygen (O2) in aerobic cellular respiration?",
    options: {
      A: "Serving as the terminal electron acceptor at Complex IV of the electron transport chain to form water",
      B: "Directly oxidizing glucose into two pyruvate molecules during glycolysis",
      C: "Phosphorylating ADP directly into ATP in the cytoplasm",
      D: "Carrying acetyl groups into oxaloacetate"
    },
    correct_answer: "A",
    explanation: "Molecular oxygen acts as the final electron acceptor at cytochrome c oxidase (Complex IV) of the respiratory chain. It combines with protons to produce metabolic water, maintaining the electron transport flow."
  },
  {
    id: 8,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "hard",
    chapter: "Bioenergetics & Cellular Respiration",
    question: "What directly drives the rotational catalytic subunit of ATP synthase during oxidative phosphorylation?",
    options: {
      A: "Direct substrate-level phosphorylation from phosphoenolpyruvate",
      B: "Proton motive force (electrochemical gradient across the inner mitochondrial membrane)",
      C: "Cleavage of high-energy thioester bonds in acetyl-CoA",
      D: "Active oxidation of FADH2 in the mitochondrial intermembrane space"
    },
    correct_answer: "B",
    explanation: "Protons pumped into the intermembrane space flow back down their electrochemical proton gradient into the matrix through the Fo channel of ATP synthase, driving rotational conformational changes in the F1 catalytic head."
  },

  // ─── CHAPTER 3: PHOTOSYNTHESIS & PLANT PHYSIOLOGY ───
  {
    id: 9,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "easy",
    chapter: "Photosynthesis & Plant Physiology",
    question: "In the light-independent Calvin cycle of photosynthesis, which enzyme catalyzes the initial carbon fixation of CO2 with RuBP?",
    options: {
      A: "RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase)",
      B: "Phosphofructokinase",
      C: "PEP Carboxylase",
      D: "DNA Polymerase III"
    },
    correct_answer: "A",
    explanation: "RuBisCO is the primary carbon-fixing enzyme located in the chloroplast stroma that incorporates CO2 into ribulose-1,5-bisphosphate, producing 3-phosphoglycerate."
  },
  {
    id: 10,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "medium",
    chapter: "Photosynthesis & Plant Physiology",
    question: "What is the primary source of electrons that replace those excited in chlorophyll a of Photosystem II (P680) during oxygenic photosynthesis?",
    options: {
      A: "Photolysis of water molecules (H2O)",
      B: "Oxidation of NADPH",
      C: "Hydrolysis of ATP in the stroma",
      D: "Reduction of Carbon dioxide"
    },
    correct_answer: "A",
    explanation: "The oxygen-evolving complex of Photosystem II splits water molecules into electrons, protons (H+), and molecular oxygen (2 H2O -> 4 H+ + 4 e- + O2). These electrons replace photoexcited electrons in P680."
  },
  {
    id: 11,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "medium",
    chapter: "Photosynthesis & Plant Physiology",
    question: "Which plant hormone promotes positive phototropism and apical dominance by migrating to the shaded side of shoots?",
    options: {
      A: "Auxin (Indole-3-acetic acid)",
      B: "Gibberellin",
      C: "Abscisic acid (ABA)",
      D: "Ethylene"
    },
    correct_answer: "A",
    explanation: "Auxin moves basipetally and relocates to the shaded side of plant stems upon unilateral illumination. Higher auxin concentration on the shaded side stimulates cell elongation, bending the shoot toward light."
  },

  // ─── CHAPTER 4: GENETICS & MOLECULAR BIOLOGY ───
  {
    id: 12,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "easy",
    chapter: "Genetics & Molecular Biology",
    question: "If a double-stranded DNA molecule contains 28% Adenine (A), what percentage of Cytosine (C) is present according to Chargaff's rules?",
    options: {
      A: "22%",
      B: "28%",
      C: "44%",
      D: "14%"
    },
    correct_answer: "A",
    explanation: "By Chargaff's rules, %A = %T = 28%, giving 56% A+T. The remaining bases are G+C = 100% - 56% = 44%. Because %G = %C, the percentage of Cytosine is 44% / 2 = 22%."
  },
  {
    id: 13,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "easy",
    chapter: "Genetics & Molecular Biology",
    question: "Which triplet codon serves as the universal translation initiation (start) codon encoding Methionine in eukaryotes?",
    options: {
      A: "AUG",
      B: "UAA",
      C: "UAG",
      D: "UGA"
    },
    correct_answer: "A",
    explanation: "AUG is the universal start codon on mRNA that codes for the amino acid methionine and sets the reading frame for protein translation."
  },
  {
    id: 14,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "hard",
    chapter: "Genetics & Molecular Biology",
    question: "During which specific sub-stage of Prophase I in Meiosis does crossing over (homologous genetic recombination) occur?",
    options: {
      A: "Pachytene",
      B: "Leptotene",
      C: "Zygotene",
      D: "Diakinesis"
    },
    correct_answer: "A",
    explanation: "Homologous chromosomes pair (synapsis) during Zygotene, and reciprocal non-sister chromatid exchange (crossing over) takes place during the Pachytene stage of Prophase I."
  },
  {
    id: 15,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "medium",
    chapter: "Genetics & Molecular Biology",
    question: "In a monohybrid cross between two heterozygous pea plants (Bb x Bb) where purple flowers (B) are dominant over white (b), what is the expected phenotypic ratio of offspring?",
    options: {
      A: "3 Purple : 1 White",
      B: "1 Purple : 2 Intermediate : 1 White",
      C: "1 Purple : 1 White",
      D: "4 Purple : 0 White"
    },
    correct_answer: "A",
    explanation: "The genotypic ratio is 1 BB : 2 Bb : 1 bb. Since both BB and Bb express the dominant purple phenotype, 3/4 (75%) will be purple and 1/4 (25%) will be white, yielding a 3:1 phenotypic ratio."
  },

  // ─── CHAPTER 5: HUMAN PHYSIOLOGY & IMMUNOLOGY ───
  {
    id: 16,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "easy",
    chapter: "Human Physiology & Immunology",
    question: "Which human blood group is classified as the universal recipient in the ABO and Rh blood typing systems?",
    options: {
      A: "AB positive (AB+)",
      B: "O negative (O-)",
      C: "A positive (A+)",
      D: "B negative (B-)"
    },
    correct_answer: "A",
    explanation: "Individuals with AB+ blood have both A and B antigens as well as the Rh antigen on their red blood cells, and have neither anti-A, anti-B, nor anti-Rh antibodies in their serum, allowing safe transfusion of any ABO/Rh blood type."
  },
  {
    id: 17,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "medium",
    chapter: "Human Physiology & Immunology",
    question: "What is the primary function of the myelin sheath produced by Schwann cells and oligodendrocytes along vertebrate neuronal axons?",
    options: {
      A: "Accelerating action potential velocity via saltatory conduction",
      B: "Synthesizing and releasing acetylcholine neurotransmitter molecules",
      C: "Anchoring dendrites to adjacent postsynaptic densities",
      D: "Buffering calcium ions in synaptic vesicles"
    },
    correct_answer: "A",
    explanation: "Myelin is a lipid-rich insulating layer interrupted at the Nodes of Ranvier. It forces the depolarizing electrical current to jump from one node to the next (saltatory conduction), accelerating neural conduction velocity up to 100-fold."
  },
  {
    id: 18,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "hard",
    chapter: "Human Physiology & Immunology",
    question: "Which class of immunoglobulins is the most abundant in human blood serum and uniquely capable of crossing the maternal placenta to provide passive immunity to the fetus?",
    options: {
      A: "IgG",
      B: "IgM",
      C: "IgA",
      D: "IgE"
    },
    correct_answer: "A",
    explanation: "IgG constitutes about 75-80% of total human antibodies in serum and is the only antibody isotype capable of crossing the placenta via FcRn receptors to protect newborns."
  },

  // ─── CHAPTER 6: ECOLOGY & ECOSYSTEMS ───
  {
    id: 19,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "easy",
    chapter: "Ecology & Ecosystems",
    question: "In community ecology, what symbiotic interaction exists between nitrogen-fixing Rhizobium bacteria and the root nodules of leguminous crop plants?",
    options: {
      A: "Mutualism (+/+)",
      B: "Commensalism (+/0)",
      C: "Parasitism (+/-)",
      D: "Amensalism (-/0)"
    },
    correct_answer: "A",
    explanation: "Mutualism is an interaction where both species benefit. Rhizobium fixes atmospheric dinitrogen into ammonium for the plant, while the legume provides carbohydrates and an anaerobic shelter."
  },
  {
    id: 20,
    module_id: 5,
    module_name: "General Biology",
    difficulty: "medium",
    chapter: "Ecology & Ecosystems",
    question: "According to Lindeman's Ten Percent Law in trophic ecology, approximately what percentage of energy is transferred from one trophic level to the next higher level?",
    options: {
      A: "10%",
      B: "50%",
      C: "90%",
      D: "1%"
    },
    correct_answer: "A",
    explanation: "Only about 10% of the chemical energy captured at one trophic level is converted into new biomass at the next trophic level; the remaining 90% is lost through metabolic heat, respiration, and unconsumed waste."
  }
];
