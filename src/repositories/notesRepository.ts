import { getSupabase } from '../utils/supabaseClient';
import { safeStorage } from '../utils/safeStorage';
import {
  Subject,
  Chapter,
  Note,
  NoteListItem,
  UserNoteState,
  Highlight,
  ReaderSettings,
  SearchResult,
  AdjacentNotes
} from '../types/notes';
import {
  cacheFullNoteLocally,
  getCachedNoteLocally,
  deleteCachedNoteLocally,
  cacheSubjectsLocally,
  getCachedSubjectsLocally,
  cacheChaptersLocally,
  getCachedChaptersLocally,
  cacheUserStateLocally,
  getCachedUserStateLocally,
  getCachedUserStatesMapLocally,
  cacheReaderSettingsLocally,
  getCachedReaderSettingsLocally,
  cacheHighlightsLocally,
  getCachedHighlightsLocally,
  cacheNotesListLocally,
  getCachedNotesListLocally,
  enqueueSyncAction,
  getSyncQueue,
  removeSyncAction
} from '../utils/notesOfflineSync';

function safeGenerateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── CURATED SEED FALLBACK DATA (Ethiopian University Curriculum) ──────────────
const SAMPLE_CHAPTER_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f12';
const SAMPLE_NOTE_1_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';
const SAMPLE_NOTE_2_ID = 'b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e';
const SAMPLE_NOTE_3_ID = 'c3d4e5f6-a1b2-4c3d-8e4f-5a6b7c8d9e0f';

export const BIO_SUBJECT_ID = 'subj_general_biology';
export const CHEM_SUBJECT_ID = 'subj_general_chemistry';
export const SAMPLE_SUBJECT_ID = 'subj_critical_thinking';
export const PHYS_SUBJECT_ID = 'subj_general_physics';
export const TECH_SUBJECT_ID = 'subj_emerging_technologies';
export const MATH_SUBJECT_ID = 'subj_math_natural';
export const ECON_SUBJECT_ID = 'subj_economics';
export const ANTHRO_SUBJECT_ID = 'subj_social_anthropology';
export const INCLUSIVENESS_SUBJECT_ID = 'subj_inclusiveness';
export const PSYCH_SUBJECT_ID = 'subj_general_psychology';
export const GEOG_SUBJECT_ID = 'subj_geography';
export const CIVICS_SUBJECT_ID = 'subj_moral_and_civic';
export const ENGLISH_SUBJECT_ID = 'subj_english_1';
export const HISTORY_SUBJECT_ID = 'subj_history';

// Backward compatibility map for legacy UUIDs stored in student sessions
export const LEGACY_SUBJECT_ID_MAP: Record<string, string> = {
  'e7b1a234-8c6e-4a0b-9d12-1f3a5b7c9e10': BIO_SUBJECT_ID,
  'e7b1a234-8c6e-4a0b-9d12-1f3a5b7c9e20': CHEM_SUBJECT_ID,
  'e7b1a234-8c6e-4a0b-9d12-1f3a5b7c9e01': SAMPLE_SUBJECT_ID,
  'e7b1a234-8c6e-4a0b-9d12-1f3a5b7c9e02': PHYS_SUBJECT_ID,
  'e7b1a234-8c6e-4a0b-9d12-1f3a5b7c9e03': TECH_SUBJECT_ID,
  'e7b1a234-8c6e-4a0b-9d12-1f3a5b7c9e05': MATH_SUBJECT_ID,
  'e7b1a234-8c6e-4a0b-9d12-1f3a5b7c9e04': ECON_SUBJECT_ID,
  'e7b1a234-8c6e-4a0b-9d12-1f3a5b7c9e08': ANTHRO_SUBJECT_ID,
};

export function canonicalSubjectId(idOrName?: string | null): string {
  if (!idOrName) return BIO_SUBJECT_ID;
  if (LEGACY_SUBJECT_ID_MAP[idOrName]) return LEGACY_SUBJECT_ID_MAP[idOrName];
  const s = idOrName.toLowerCase().trim();

  // Check Anthropology explicitly first so 'biological anthropology' or 'cultural' doesn't misroute to Biology
  if (s.includes('anthro') || s.includes('anthropology') || s.includes('anth 1012') || s === 'anthro' || s === 'anth') {
    return ANTHRO_SUBJECT_ID;
  }
  if (s.includes('bio') || s.includes('biol')) {
    return BIO_SUBJECT_ID;
  }
  if (s.includes('chem')) {
    return CHEM_SUBJECT_ID;
  }
  if (s.includes('logic') || s.includes('critical') || s.includes('phil') || s.includes('philosophy')) {
    return SAMPLE_SUBJECT_ID;
  }
  if (s.includes('phys')) {
    return PHYS_SUBJECT_ID;
  }
  if (s.includes('tech') || s.includes('emerging') || s.includes('emte')) {
    return TECH_SUBJECT_ID;
  }
  if (s.includes('math') || s.includes('precalculus')) {
    return MATH_SUBJECT_ID;
  }
  if (s.includes('econ')) {
    return ECON_SUBJECT_ID;
  }
  if (s.includes('inclusive') || s.includes('snie')) {
    return INCLUSIVENESS_SUBJECT_ID;
  }
  if (s.includes('psych')) {
    return PSYCH_SUBJECT_ID;
  }
  if (s.includes('geog') || s.includes('geography')) {
    return GEOG_SUBJECT_ID;
  }
  if (s.includes('civic') || s.includes('moral') || s.includes('ethics')) {
    return CIVICS_SUBJECT_ID;
  }
  if (s.includes('english') || s.includes('communicat') || s.includes('flen')) {
    return ENGLISH_SUBJECT_ID;
  }
  if (s.includes('hist') || s.includes('history')) {
    return HISTORY_SUBJECT_ID;
  }

  return idOrName;
}

export const SEED_SUBJECTS: Subject[] = [
  {
    id: BIO_SUBJECT_ID,
    name: 'General Biology (Biol 1011)',
    color: '#10B981', // Emerald Green
    sort_order: 1
  },
  {
    id: CHEM_SUBJECT_ID,
    name: 'General Chemistry (Chem 1011)',
    color: '#06B6D4', // Cyan
    sort_order: 2
  },
  {
    id: SAMPLE_SUBJECT_ID,
    name: 'Critical Thinking & Logic (Phil 1011)',
    color: '#D97706', // Warm Amber
    sort_order: 3
  },
  {
    id: PHYS_SUBJECT_ID,
    name: 'General Physics (Phys 1011)',
    color: '#3B82F6', // Blue
    sort_order: 4
  },
  {
    id: TECH_SUBJECT_ID,
    name: 'Emerging Technologies (EmTe 1012)',
    color: '#8B5CF6', // Purple
    sort_order: 5
  },
  {
    id: MATH_SUBJECT_ID,
    name: 'Freshman Mathematics (Math 1011)',
    color: '#EC4899', // Pink
    sort_order: 6
  },
  {
    id: ECON_SUBJECT_ID,
    name: 'Economics for Engineers (Econ 1011)',
    color: '#F59E0B', // Gold
    sort_order: 7
  },
  {
    id: ANTHRO_SUBJECT_ID,
    name: 'Social Anthropology (Anth 1012)',
    color: '#F43F5E', // Rose
    sort_order: 8
  }
];

export const BIO_CH1_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f21';
export const BIO_CH2_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f22';
export const CHEM_CH1_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f31';
export const CHEM_CH2_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f32';
export const PHYS_CH1_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f14';
export const TECH_CH1_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f41';
export const MATH_CH1_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f51';
export const ECON_CH1_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f61';
export const ANTHRO_CH1_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f81';
export const ANTHRO_CH2_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f82';
export const ENGL_CH1_ID = 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f91';

export const SEED_CHAPTERS: Chapter[] = [
  // Biology Chapters
  {
    id: BIO_CH1_ID,
    subject_id: BIO_SUBJECT_ID,
    title: 'Unit 1: The Nature of Biology & The Cellular Basis of Life',
    sort_order: 1
  },
  {
    id: BIO_CH2_ID,
    subject_id: BIO_SUBJECT_ID,
    title: 'Unit 2: Cellular Respiration, Photosynthesis & Genetics',
    sort_order: 2
  },
  // Chemistry Chapters
  {
    id: CHEM_CH1_ID,
    subject_id: CHEM_SUBJECT_ID,
    title: 'Unit 1: Atomic Structure and Periodic Properties',
    sort_order: 1
  },
  {
    id: CHEM_CH2_ID,
    subject_id: CHEM_SUBJECT_ID,
    title: 'Unit 2: Chemical Bonding and Molecular Geometry',
    sort_order: 2
  },
  // Logic Chapters
  {
    id: SAMPLE_CHAPTER_ID,
    subject_id: SAMPLE_SUBJECT_ID,
    title: 'Chapter 1: Logic and Arguments',
    sort_order: 1
  },
  {
    id: 'f8c2b345-9d7f-4b1c-8e23-2a4b6c8d0f13',
    subject_id: SAMPLE_SUBJECT_ID,
    title: 'Chapter 2: Formal and Informal Fallacies',
    sort_order: 2
  },
  // Physics Chapters
  {
    id: PHYS_CH1_ID,
    subject_id: PHYS_SUBJECT_ID,
    title: "Chapter 1: Vectors, Kinematics & Newton's Laws",
    sort_order: 1
  },
  // Emerging Technologies
  {
    id: TECH_CH1_ID,
    subject_id: TECH_SUBJECT_ID,
    title: 'Chapter 1: Industry 4.0, Artificial Intelligence & IoT',
    sort_order: 1
  },
  // Mathematics
  {
    id: MATH_CH1_ID,
    subject_id: MATH_SUBJECT_ID,
    title: 'Module 1: Propositional Logic & Quantifiers',
    sort_order: 1
  },
  // Economics
  {
    id: ECON_CH1_ID,
    subject_id: ECON_SUBJECT_ID,
    title: 'Unit 1: Fundamentals of Microeconomics & Market Dynamics',
    sort_order: 1
  },
  // Social Anthropology
  {
    id: ANTHRO_CH1_ID,
    subject_id: ANTHRO_SUBJECT_ID,
    title: 'Unit 1: Introducing Social Anthropology & Its Sub-Fields',
    sort_order: 1
  },
  {
    id: ANTHRO_CH2_ID,
    subject_id: ANTHRO_SUBJECT_ID,
    title: 'Unit 2: Culture, Marriage, Kinship & Customary Systems in Ethiopia',
    sort_order: 2
  },
  // Communicative English
  {
    id: ENGL_CH1_ID,
    subject_id: ENGLISH_SUBJECT_ID,
    title: 'Unit 1: Academic Reading Comprehension & Discourse Markers',
    sort_order: 1
  }
];

export const BIO_NOTE1_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c11';
export const BIO_NOTE2_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c12';
export const CHEM_NOTE1_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c21';
export const CHEM_NOTE2_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c22';

export const SEED_NOTES: Note[] = [
  // ─── BIOLOGY NOTES ────────────────────────────────────────────────────────
  {
    id: BIO_NOTE1_ID,
    chapter_id: BIO_CH1_ID,
    title: '1.1 The Chemical Basis of Life: Water & Biomolecules',
    read_time_min: 7,
    sort_order: 1,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.1 The Chemical Basis of Life: Water & Biomolecules

Welcome to **Biol 1011: General Biology**. Life is fundamentally an organized chemical system driven by aqueous biochemistry.

:::definition
**Water as the Universal Solvent**: Due to its polar covalent O-H bonds and bent geometry, water molecules form dynamic hydrogen-bonding networks that provide thermal buffering, high surface tension, and cohesion.
:::

## 1. The Four Biological Macromolecules

| Macromolecule | Monomeric Subunit | Key Linkage Bond | Primary Biological Function |
| :--- | :--- | :--- | :--- |
| **Carbohydrates** | Monosaccharides (Glucose, Fructose) | Glycosidic bond | Short-term energy storage & cell wall structural support |
| **Lipids** | Fatty acids + Glycerol | Ester bond | Long-term energy density, membrane bilayers & signaling |
| **Proteins** | Amino acids (20 standard) | Peptide bond | Enzymatic catalysis, structural support, immune response |
| **Nucleic Acids** | Nucleotides (A, T, G, C, U) | Phosphodiester bond | Genetic information storage (DNA) & expression (RNA) |

:::key-point
**Enzyme Catalysis**: Enzymes lower the **activation energy ($E_a$)** of biochemical reactions without altering the standard free energy change ($\Delta G$) or chemical equilibrium!
:::
`
  },
  {
    id: BIO_NOTE2_ID,
    chapter_id: BIO_CH1_ID,
    title: '1.2 Cell Structure & Function: Prokaryotes vs. Eukaryotes',
    read_time_min: 6,
    sort_order: 2,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.2 Cell Structure & Function: Prokaryotes vs. Eukaryotes

The cell is the basic structural, physiological, and organizational unit of all known living organisms.

## 1. Comparing Cellular Architectures

* **Prokaryotes (Bacteria & Archaea)**:
  - No membrane-bound nucleus; DNA concentrated in a **nucleoid** region
  - Circular chromosomes, often with accessory **plasmids**
  - Ribosomes: 70S (50S + 30S subunits)
  - Peptidoglycan cell wall in eubacteria

* **Eukaryotes (Protists, Fungi, Plants, Animals)**:
  - Membrane-enclosed nucleus containing linear chromatin
  - Endomembrane system: Endoplasmic Reticulum (ER), Golgi apparatus, Lysosomes, Vacuoles
  - Energy organelles: **Mitochondria** (cellular respiration) and **Chloroplasts** (photosynthesis)
  - Ribosomes: 80S (60S + 40S subunits)
`
  },

  // ─── CHEMISTRY NOTES ──────────────────────────────────────────────────────
  {
    id: CHEM_NOTE1_ID,
    chapter_id: CHEM_CH1_ID,
    title: '1.1 Modern Atomic Theory & Quantum Mechanical Orbitals',
    read_time_min: 7,
    sort_order: 1,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.1 Modern Atomic Theory & Quantum Mechanical Orbitals

Welcome to **Chem 1011: General Chemistry**. The physical and chemical behavior of matter is governed by electron configurations.

## 1. The Four Quantum Numbers

| Symbol | Name | Allowed Values | Physical Meaning |
| :--- | :--- | :--- | :--- |
| **$n$** | Principal | $1, 2, 3, 4, \\dots$ | Main energy level (shell) & orbital size |
| **$l$** | Azimuthal (Angular momentum) | $0, 1, \\dots, (n-1)$ | Orbital shape ($0=s, 1=p, 2=d, 3=f$) |
| **$m_l$** | Magnetic | $-l, \\dots, 0, \\dots, +l$ | Spatial orientation of orbital in 3D |
| **$m_s$** | Spin | $+\\frac{1}{2}, -\\frac{1}{2}$ | Intrinsic spin angular momentum direction |

:::definition
**Pauli Exclusion Principle**: No two electrons in the same atom can have an identical set of all four quantum numbers. A single orbital can hold a maximum of 2 electrons with opposite spins!
:::
`
  },
  {
    id: CHEM_NOTE2_ID,
    chapter_id: CHEM_CH1_ID,
    title: '1.2 Periodic Trends: Atomic Radii, Ionization Energy & Electronegativity',
    read_time_min: 6,
    sort_order: 2,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.2 Periodic Trends: Atomic Radii, Ionization Energy & Electronegativity

Periodic trends stem directly from **Effective Nuclear Charge ($Z_{\\text{eff}}$)** and electron shielding.

## 1. Summary of Directional Trends

* **Atomic Radius**:
  - Decreases across a period (left to right) due to increasing $Z_{\\text{eff}}$ pulling electrons closer.
  - Increases down a group as principal quantum number $n$ increases with additional shells.

* **First Ionization Energy ($IE_1$)**:
  - Increases across a period (more energy required to remove valence electron).
  - Decreases down a group (outer electron is farther from nucleus and screened).

* **Electronegativity (Pauling Scale)**:
  - Fluorine ($F = 4.0$) is the most electronegative element.
  - Increases across a period, decreases down a group.
`
  },

  // ─── CRITICAL THINKING & LOGIC NOTES ───────────────────────────────────────
  {
    id: SAMPLE_NOTE_1_ID,
    chapter_id: SAMPLE_CHAPTER_ID,
    title: '1.1 Introduction to Arguments, Premises & Conclusions',
    read_time_min: 7,
    sort_order: 1,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    content: `# 1.1 Introduction to Arguments, Premises & Conclusions

Welcome to the foundational chapter of **Phil 1011: Logic and Critical Thinking**. In university academic discourse, developing the rigor to evaluate claims is essential for scholarship.

:::definition
**An Argument**: A structured group of statements consisting of one or more **premises**, which are claimed to provide evidential support for, or reasons to believe, a single overarching **conclusion**.
:::

---

## 1. Recognizing Premises and Conclusions

Every valid argument must have at least one premise and exactly one conclusion statement. 

### Common Indicator Words

| Logical Role | English Indicators | Ge'ez / Amharic Equivalents |
| :--- | :--- | :--- |
| **Premise Indicators** | Since, because, given that, for the reason that | ምክንያቱም, በመሆኑም, ከዚህ አኳያ |
| **Conclusion Indicators** | Therefore, thus, consequently, so, it follows that | ስለዚህ, በመሆኑም, በመጨረሻም |

:::key-point
Remember that indicator words are helpful road signs, but they are not infallible. You must always examine the **inferential relationship** between claims.
:::

---

## 2. Deductive vs. Inductive Arguments

Logic classifies arguments into two broad families based on the strength of the claimed inferential link:

1. **Deductive Arguments**: Claim that the truth of the premises strictly guarantees the truth of the conclusion.
2. **Inductive Arguments**: Claim that the premises establish a probable, likely, or plausible conclusion.

:::example
**Deductive Syllogism Example**:
- Premise 1: All Ethiopian federal universities are governed by the Ministry of Education.
- Premise 2: Wolkite University (WKU) is an Ethiopian federal university.
- Conclusion: Therefore, Wolkite University is governed by the Ministry of Education.
:::

:::warning
Never confuse **Validity** with **Truth**! An argument can have completely false premises and still be structurally valid if the conclusion follows inescapably from those premises.
:::

---

## 3. Mathematical & Logical Modeling

In modern formal logic, we evaluate propositional structures symbolically:

$$P \\implies Q \\quad \\text{and} \\quad P \\vdash Q$$

Let us examine the law of detachment (Modus Ponens):

$$\\frac{P \\to Q, \\quad P}{\\therefore Q}$$

For probabilistic inductive inferences:

$$P(C \\mid E_1 \\land E_2) = \\frac{P(E_1 \\land E_2 \\mid C) \\cdot P(C)}{P(E_1 \\land E_2)}$$

---

## 4. Algorithmic Truth Table Verification

Here is how automated reasoning engines parse logical propositions in Python:

\`\`\`python
# Simple Truth Table Evaluator for Modus Ponens
def evaluate_modus_ponens(p: bool, p_implies_q: bool) -> bool:
    """Returns True if the conclusion Q is guaranteed."""
    if p and p_implies_q:
        return True
    return False

# Test cases
print(evaluate_modus_ponens(True, True))  # Output: True
\`\`\`

:::formula
**Standard Syllogistic Validity Rule**:
$$\\text{Soundness} = \\text{Validity} + \\text{All True Premises}$$
An argument is **Sound** if and only if it is deductively valid AND every premise is empirically true in the real world.
:::

---

## 5. Summary & Self-Check

Before proceeding to Section 1.2 on Deductive Validity, test yourself:
- Can you identify the conclusion when indicators are omitted?
- What distinguishes an argument from a non-argumentative explanation?`
  },
  {
    id: SAMPLE_NOTE_2_ID,
    chapter_id: SAMPLE_CHAPTER_ID,
    title: '1.2 Deductive Validity, Soundness & Cognitive Cogency',
    read_time_min: 6,
    sort_order: 2,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    content: `# 1.2 Deductive Validity, Soundness & Cognitive Cogency

In this section, we study the gold standards of logical evaluation: **Validity** and **Soundness** for deduction, and **Strength** and **Cogency** for induction.

:::definition
**Deductive Validity**: An argument is valid if and only if it is impossible for all premises to be true and the conclusion to be false at the same time.
:::

## Key Relationships

| Argument Type | Structural Form | Real World Truth | Final Assessment |
| :--- | :--- | :--- | :--- |
| Deductive | Valid | All Premises True | **Sound** |
| Deductive | Valid | At least 1 False Premise | **Unsound** |
| Deductive | Invalid | Any | **Unsound** |

:::key-point
A valid argument can never lead from genuine truth to falsehood.
:::

$$Valid + All\\ True\\ Premises = Sound$$`
  },
  {
    id: SAMPLE_NOTE_3_ID,
    chapter_id: SAMPLE_CHAPTER_ID,
    title: '1.3 Non-Argumentative Passages & Explanations',
    read_time_min: 5,
    sort_order: 3,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.3 Non-Argumentative Passages & Explanations

Not all paragraphs encountered in university textbooks contain arguments. Distinguishing arguments from mere reports, illustrations, or explanations is vital.

:::definition
**Explanadum vs Explanans**:
- **Explanandum**: The accepted fact or phenomenon being explained.
- **Explanans**: The group of statements that shows *why* or *how* it happened.
:::

:::warning
In an argument, the conclusion is contested. In an explanation, the fact is usually already accepted, and the author is explaining its cause.
:::
`
  },

  // ─── GENERAL PHYSICS NOTES ────────────────────────────────────────────────
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c31',
    chapter_id: PHYS_CH1_ID,
    title: "1.1 Vectors, Kinematics & Newton's Laws of Motion",
    read_time_min: 7,
    sort_order: 1,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.1 Vectors, Kinematics & Newton's Laws of Motion

Welcome to **Phys 1011: General Physics**. Classical mechanics investigates the motion of physical bodies under the influence of force fields.

:::definition
**Vector vs. Scalar**:
- **Scalar**: Magnitude only ($m$, $T$, $E$, $t$).
- **Vector**: Magnitude AND direction ($\\vec{r}$, $\\vec{v}$, $\\vec{a}$, $\\vec{F}$, $\\vec{p}$).
:::

## 1. Kinematic Equations (Constant Acceleration)

For linear motion with constant $\\vec{a}$:

1. $v = v_0 + at$
2. $x - x_0 = v_0 t + \\frac{1}{2} a t^2$
3. $v^2 = v_0^2 + 2a(x - x_0)$
4. $x - x_0 = \\left(\\frac{v_0 + v}{2}\\right) t$

:::key-point
**Newton's Second Law**: $\\sum \\vec{F} = \\frac{d\\vec{p}}{dt} = m \\vec{a}$ (for constant mass). The net external force directly determines the acceleration of the center of mass.
:::
`
  },

  // ─── EMERGING TECHNOLOGIES NOTES ──────────────────────────────────────────
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c41',
    chapter_id: TECH_CH1_ID,
    title: '1.1 Industry 4.0, Artificial Intelligence & IoT Ecosystems',
    read_time_min: 6,
    sort_order: 1,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.1 Industry 4.0, Artificial Intelligence & IoT Ecosystems

Welcome to **EmTe 1012: Emerging Technologies**. This course surveys the transformative technological waves of the Fourth Industrial Revolution (4IR).

:::definition
**Cyber-Physical Systems (CPS)**: Systems that integrate computational algorithms, physical sensor networks, and human operators through closed-loop feedback and edge computing.
:::

## 1. The Core Machine Learning Paradigms

1. **Supervised Learning**: Mapping inputs to known labels using regression or classification.
2. **Unsupervised Learning**: Discovering intrinsic latent patterns, clusters, and dimensionality reduction.
3. **Reinforcement Learning**: Goal-seeking agent optimizing a reward signal via policy gradients.

:::example
**Smart Agriculture in Ethiopia**: IoT soil moisture sensors paired with edge ML infer optimal drip irrigation schedules across the Rift Valley basin.
:::
`
  },

  // ─── FRESHMAN MATHEMATICS NOTES ───────────────────────────────────────────
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c51',
    chapter_id: MATH_CH1_ID,
    title: '1.1 Propositional Logic, Truth Tables & Quantifiers',
    read_time_min: 7,
    sort_order: 1,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.1 Propositional Logic, Truth Tables & Quantifiers

Welcome to **Math 1011: Freshman Mathematics**. Rigorous logical reasoning provides the formal language of mathematical deduction and computer science.

:::definition
**Proposition**: A declarative assertion that is unambiguously either True ($T$) or False ($F$), never both simultaneously.
:::

## 1. Fundamental Logical Operators

| Operator | Symbol | Truth Condition |
| :--- | :--- | :--- |
| **Conjunction** | $P \\land Q$ | True if and only if both $P$ and $Q$ are True |
| **Disjunction** | $P \\lor Q$ | False if and only if both $P$ and $Q$ are False |
| **Implication** | $P \\implies Q$ | False ONLY when $P$ is True and $Q$ is False |
| **Biconditional** | $P \\iff Q$ | True when $P$ and $Q$ share the same truth value |

:::key-point
**Contrapositive Law**: $P \\implies Q \\equiv \\neg Q \\implies \\neg P$. This equivalence is widely used in mathematical proofs by contraposition!
:::
`
  },

  // ─── ECONOMICS NOTES ──────────────────────────────────────────────────────
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c61',
    chapter_id: ECON_CH1_ID,
    title: '1.1 Fundamentals of Microeconomics & Market Dynamics',
    read_time_min: 6,
    sort_order: 1,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.1 Fundamentals of Microeconomics & Market Dynamics

Welcome to **Econ 1011: Economics for Engineers**. Economics is the scientific study of how society allocates scarce resources among competing productive ends.

:::definition
**Opportunity Cost**: The value of the next best alternative forgone when a choice is made. In engineering economics, every capital allocation has an opportunity cost!
:::

## 1. Supply, Demand & Market Equilibrium

- **Law of Demand**: As the price of a good increases, quantity demanded decreases ($P \\uparrow \\implies Q_d \\downarrow$), ceteris paribus.
- **Law of Supply**: As price increases, quantity supplied increases ($P \\uparrow \\implies Q_s \\uparrow$).
- **Equilibrium**: The price point $P^*$ where $Q_d(P^*) = Q_s(P^*)$, clearing the market without surplus or shortage.

:::formula
**Price Elasticity of Demand ($E_d$)**:
$$E_d = \\frac{\\% \\Delta Q_d}{\\% \\Delta P} = \\frac{\\Delta Q / Q}{\\Delta P / P}$$
When $|E_d| > 1$, demand is price-elastic.
:::
`
  },

  // ─── SOCIAL ANTHROPOLOGY NOTES ────────────────────────────────────────────
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c81',
    chapter_id: ANTHRO_CH1_ID,
    title: '1.1 Introduction to Social Anthropology & Its Sub-Fields',
    read_time_min: 7,
    sort_order: 1,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.1 Introduction to Social Anthropology & Its Sub-Fields

Welcome to **Anth 1012: Social Anthropology**. Anthropology is the comparative, holistic, and empirical study of human diversity across space and time.

:::definition
**Cultural Relativism**: The foundational methodological principle requiring researchers to evaluate cultural practices, beliefs, and customs within their own local socio-cultural matrix rather than judging them through foreign ethnocentric standards.
:::

## 1. The Four Major Sub-Fields of Anthropology

| Sub-Field | Focus Area | Key Methodologies |
| :--- | :--- | :--- |
| **Socio-Cultural Anthropology** | Living human societies, kinship, rituals, and belief systems | Long-term Ethnographic Fieldwork & Participant Observation |
| **Archaeology** | Past human societies through material culture and artifacts | Stratigraphic Excavation & Radiocarbon Dating |
| **Linguistic Anthropology** | Structure, evolution, and social context of human languages | Discourse Analysis & Sociolinguistics |
| **Biological / Physical Anthropology** | Human biological variation, paleoanthropology, and genetics | Fossil Analysis, Osteology & Primatology |

:::key-point
**Ethnography vs Ethnology**: Ethnography is the detailed descriptive account of a specific community based on fieldwork. Ethnology is the cross-cultural comparative analysis of ethnographic data across multiple societies.
:::
`
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c82',
    chapter_id: ANTHRO_CH2_ID,
    title: '2.1 Kinship, Marriage & Customary Systems in Ethiopia',
    read_time_min: 6,
    sort_order: 2,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 2.1 Kinship, Marriage & Customary Systems in Ethiopia

In social anthropology, kinship systems structure social organization, inheritance, marriage alliances, and community leadership.

:::definition
**Rules of Descent**:
- **Patrilineal Descent**: Lineage traced exclusively through the father's male ancestors.
- **Matrilineal Descent**: Lineage traced exclusively through the mother's female ancestors.
- **Bilateral Descent**: Lineage traced equally through both maternal and paternal kin.
:::

## 1. Marriage & Alliance Rules

- **Exogamy**: Rule requiring individuals to marry outside their specific clan or descent group.
- **Endogamy**: Rule requiring individuals to marry within their specific socio-cultural group.
- **Bridewealth (Brideprice)**: Transfer of goods/livestock from the groom's family to the bride's kin group to legitimize marriage alliances.
`
  },

  // ─── COMMUNICATIVE ENGLISH NOTES ──────────────────────────────────────────
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c91',
    chapter_id: ENGL_CH1_ID,
    title: '1.1 Academic Reading Comprehension & Discourse Markers',
    read_time_min: 6,
    sort_order: 1,
    is_published: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    content: `# 1.1 Academic Reading Comprehension & Discourse Markers

Welcome to **FLEn 1011: Communicative English Language Skills I**. Mastery of academic English requires efficient reading strategies and precise signal transitions.

:::definition
**Skimming vs Scanning**:
- **Skimming**: Reading rapidly to identify the main central thesis or macro-structure.
- **Scanning**: Searching targeted text for specific facts, numbers, or technical terminology.
:::

## 1. Key Discourse Transition Markers

| Function | Transition Signals | Example Usage |
| :--- | :--- | :--- |
| **Exemplification** | *For instance, Specifically, Namely* | "Many renewable energy sources, specifically solar, are abundant in Ethiopia." |
| **Contradiction / Contrast** | *However, Conversely, Nevertheless* | "The hypothesis seemed plausible; nevertheless, experimental data disproved it." |
| **Causation** | *Consequently, Therefore, As a result* | "The sample exceeded boiling point; consequently, pressure rose sharply." |
`
  }
];

export const PHYS_NOTE1_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c31';
export const TECH_NOTE1_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c41';
export const MATH_NOTE1_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c51';
export const ECON_NOTE1_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c61';
export const ANTHRO_NOTE1_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c81';
export const ENGL_NOTE1_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c91';

// ─── REPOSITORY IMPLEMENTATION ─────────────────────────────────────────────

export class NotesRepository {
  constructor() {
    try {
      const existingSub = getCachedSubjectsLocally();
      if (!existingSub || existingSub.length === 0) cacheSubjectsLocally(SEED_SUBJECTS);
      const existingCh = getCachedChaptersLocally();
      if (!existingCh || existingCh.length === 0) cacheChaptersLocally(SEED_CHAPTERS);
      const existingNotes = getCachedNotesListLocally();
      if (!existingNotes || existingNotes.length === 0) {
        const seedItems: NoteListItem[] = SEED_NOTES.map((n, idx) => ({
          id: n.id,
          chapter_id: n.chapter_id,
          title: n.title,
          read_time_min: n.read_time_min,
          sort_order: typeof n.sort_order === 'number' ? n.sort_order : idx + 1,
          is_published: true,
          created_at: n.created_at,
          updated_at: n.updated_at,
          subject_id: n.subject_id,
          subject: n.subject,
          course: n.course
        }));
        cacheNotesListLocally(seedItems);
        SEED_NOTES.forEach((note) => cacheFullNoteLocally(note));
      }
    } catch {}
  }

  /**
   * Background revalidation for subjects without blocking UI
   */
  private async backgroundRevalidateSubjects() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const formattedMap = new Map<string, Subject>();
        data.forEach((s: any, idx: number) => {
          const id = canonicalSubjectId(s.id);
          if (!formattedMap.has(id)) {
            formattedMap.set(id, {
              id,
              name: s.name || s.title || 'Untitled Subject',
              color: s.color || '#D97706',
              sort_order: typeof s.sort_order === 'number' ? s.sort_order : idx + 1
            });
          }
        });
        cacheSubjectsLocally(Array.from(formattedMap.values()));
      }
    } catch {}
  }

  /**
   * Fetches all published subjects (Instant Cache-First: 0ms load, then background sync)
   */
  async fetchSubjects(): Promise<Subject[]> {
    // 1. Instant Cache-First Check: return cached subjects immediately
    const cached = getCachedSubjectsLocally();
    if (cached && cached.length > 0) {
      const cachedMap = new Map<string, Subject>();
      cached.forEach(s => {
        const id = canonicalSubjectId(s.id);
        if (!cachedMap.has(id)) {
          cachedMap.set(id, { ...s, id });
        }
      });
      this.backgroundRevalidateSubjects();
      return Array.from(cachedMap.values());
    }

    // 2. Instant Seed Fallback
    cacheSubjectsLocally(SEED_SUBJECTS);
    this.backgroundRevalidateSubjects();
    return SEED_SUBJECTS;
  }

  /**
   * Background revalidation for chapters without blocking UI
   */
  private async backgroundRevalidateChapters(subjectId?: string) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const canonicalTargetId = subjectId ? canonicalSubjectId(subjectId) : undefined;
      let query = supabase.from('chapters').select('*');
      if (subjectId) {
        query = query.or(`subject_id.eq.${subjectId},subject_id.eq.${canonicalTargetId}`);
      }

      const { data, error } = await query.order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        const formatted: Chapter[] = data.map((c: any, idx: number) => ({
          id: String(c.id),
          subject_id: canonicalSubjectId(c.subject_id),
          title: c.title || 'Untitled Chapter',
          sort_order: typeof c.sort_order === 'number' ? c.sort_order : idx + 1
        }));
        cacheChaptersLocally(formatted);
      }
    } catch {}
  }

  /**
   * Fetches chapters, optionally filtered by subjectId (Instant 0ms Cache-First)
   */
  async fetchChapters(subjectId?: string): Promise<Chapter[]> {
    const canonicalTargetId = subjectId ? canonicalSubjectId(subjectId) : undefined;
    const cached = getCachedChaptersLocally();
    if (cached && cached.length > 0) {
      this.backgroundRevalidateChapters(subjectId);
      return canonicalTargetId ? cached.filter((c) => c.subject_id === canonicalTargetId) : cached;
    }

    cacheChaptersLocally(SEED_CHAPTERS);
    this.backgroundRevalidateChapters(subjectId);
    return canonicalTargetId ? SEED_CHAPTERS.filter((c) => c.subject_id === canonicalTargetId) : SEED_CHAPTERS;
  }

  /**
   * Background revalidation for notes list without blocking UI
   */
  private backgroundRevalidateNotesList(chapterId?: string) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const supabase = getSupabase();
    if (!supabase) return;

    Promise.allSettled([
      supabase.from('notes_list').select('*'),
      supabase.from('notes').select('*')
    ]).then(([listRes, notesRes]) => {
      let rawList: any[] = [];
      let rawNotes: any[] = [];
      if (listRes.status === 'fulfilled' && !listRes.value.error && listRes.value.data) {
        rawList = listRes.value.data;
      }
      if (notesRes.status === 'fulfilled' && !notesRes.value.error && notesRes.value.data) {
        rawNotes = notesRes.value.data;
      }

      const combinedMap = new Map<string, any>();
      for (const item of rawList) {
        const id = String(item.id || item.note_id || item.uuid || '');
        if (id) combinedMap.set(id, { ...item, id });
      }
      for (const item of rawNotes) {
        const id = String(item.id || item.note_id || item.uuid || '');
        if (id) {
          const existing = combinedMap.get(id) || {};
          combinedMap.set(id, { ...existing, ...item, id });
        }
      }

      const mergedData = Array.from(combinedMap.values());
      if (mergedData.length > 0) {
        const formatted: NoteListItem[] = mergedData.map((n: any, idx: number) => {
          const contentStr = n.content || n.body || n.text || '';
          const rawReadTime = typeof n.read_time_min === 'number'
            ? n.read_time_min
            : (contentStr ? Math.max(1, Math.round(contentStr.split(/\s+/).length / 180)) : 5);
          return {
            id: String(n.id),
            chapter_id: n.chapter_id ? String(n.chapter_id) : `virtual_${n.subject_id || n.subject || 'general'}`,
            title: n.title || n.name || 'Untitled Note',
            read_time_min: rawReadTime,
            sort_order: typeof n.sort_order === 'number' ? n.sort_order : (idx + 1),
            is_published: n.is_published !== false,
            created_at: n.created_at || new Date().toISOString(),
            updated_at: n.updated_at || new Date().toISOString(),
            subject_id: n.subject_id ? String(n.subject_id) : undefined,
            subject: n.subject ? String(n.subject) : undefined,
            course: n.course ? String(n.course) : undefined
          };
        });
        formatted.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (a.title || '').localeCompare(b.title || '', undefined, { numeric: true, sensitivity: 'base' }));
        cacheNotesListLocally(formatted);
      }
    }).catch(() => {});
  }

  /**
   * Fetches notes list without heavy `content` column (Instant 0ms Cache-First)
   */
  async fetchNotesList(chapterId?: string, includeUnpublished = false): Promise<NoteListItem[]> {
    const cached = getCachedNotesListLocally();
    if (cached && cached.length > 0) {
      this.backgroundRevalidateNotesList(chapterId);
      return chapterId ? cached.filter((n) => n.chapter_id === chapterId) : cached;
    }

    const seedFallback: NoteListItem[] = SEED_NOTES.map((n, idx) => ({
      id: n.id,
      chapter_id: n.chapter_id,
      title: n.title,
      read_time_min: n.read_time_min,
      sort_order: typeof n.sort_order === 'number' ? n.sort_order : idx + 1,
      is_published: true,
      created_at: n.created_at,
      updated_at: n.updated_at,
      subject_id: n.subject_id,
      subject: n.subject,
      course: n.course
    }));
    cacheNotesListLocally(seedFallback);
    SEED_NOTES.forEach((note) => cacheFullNoteLocally(note));
    this.backgroundRevalidateNotesList(chapterId);
    return chapterId ? seedFallback.filter((n) => n.chapter_id === chapterId) : seedFallback;
  }

  /**
   * Fetches notes where the chapter's subject_id matches the target (e.g. 'phil_1011')
   */
  async fetchNotesBySubjectId(
    subjectId: string
  ): Promise<{ id: string; title: string; read_time_min: number; chapter_id: string }[]> {
    const chapters = await this.fetchChapters(subjectId);
    const chapterIds = new Set(chapters.map((c) => c.id));
    const allNotes = await this.fetchNotesList();
    return allNotes
      .filter((n) => chapterIds.has(n.chapter_id))
      .map((n) => ({
        id: n.id,
        title: n.title,
        read_time_min: n.read_time_min,
        chapter_id: n.chapter_id
      }));
  }

  /**
   * Background revalidation for a single note
   */
  private backgroundRevalidateNote(noteId: string) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const supabase = getSupabase();
    if (!supabase) return;

    Promise.allSettled([
      supabase.from('notes').select('*').or(`id.eq.${noteId},note_id.eq.${noteId}`),
      supabase.from('notes_list').select('*').or(`id.eq.${noteId},note_id.eq.${noteId}`)
    ]).then(([notesRes, listRes]) => {
      let noteObj: any = {};
      if (notesRes.status === 'fulfilled' && !notesRes.value.error && notesRes.value.data?.[0]) {
        noteObj = { ...notesRes.value.data[0] };
      }
      if (listRes.status === 'fulfilled' && !listRes.value.error && listRes.value.data?.[0]) {
        noteObj = { ...listRes.value.data[0], ...noteObj };
      }

      if (noteObj && (noteObj.id || noteObj.note_id)) {
        const id = String(noteObj.id || noteObj.note_id || noteId);
        const content = String(noteObj.content || noteObj.body || noteObj.text || '');
        if (content) {
          const formattedNote: Note = {
            id,
            chapter_id: noteObj.chapter_id ? String(noteObj.chapter_id) : `virtual_${noteObj.subject_id || noteObj.subject || 'general'}`,
            title: noteObj.title || noteObj.name || 'Untitled Note',
            content,
            read_time_min: typeof noteObj.read_time_min === 'number'
              ? noteObj.read_time_min
              : Math.max(1, Math.round(content.split(/\s+/).length / 180)),
            sort_order: typeof noteObj.sort_order === 'number' ? noteObj.sort_order : 1,
            is_published: noteObj.is_published !== false,
            created_at: noteObj.created_at || new Date().toISOString(),
            updated_at: noteObj.updated_at || new Date().toISOString(),
            subject_id: noteObj.subject_id ? String(noteObj.subject_id) : undefined,
            subject: noteObj.subject ? String(noteObj.subject) : undefined,
            course: noteObj.course ? String(noteObj.course) : undefined
          };
          cacheFullNoteLocally(formattedNote);
        }
      }
    }).catch(() => {});
  }

  /**
   * Fetches a full single note by ID (Instant 0ms Cache-First Check: 0ms load)
   */
  async fetchNoteById(noteId: string): Promise<Note | null> {
    // 1. Instant Cache-First: return from local storage immediately if available
    const cached = getCachedNoteLocally(noteId);
    if (cached && cached.content) {
      this.backgroundRevalidateNote(noteId);
      return cached;
    }

    // 2. Instant Seed Fallback: check preloaded seed notes
    const seed = SEED_NOTES.find((n) => n.id === noteId);
    if (seed && seed.content) {
      cacheFullNoteLocally(seed);
      this.backgroundRevalidateNote(noteId);
      return seed;
    }

    // 3. Fallback: Network fetch if missing from cache
    const supabase = getSupabase();
    if (supabase) {
      try {
        const [notesRes, listRes] = await Promise.allSettled([
          supabase.from('notes').select('*').or(`id.eq.${noteId},note_id.eq.${noteId}`),
          supabase.from('notes_list').select('*').or(`id.eq.${noteId},note_id.eq.${noteId}`)
        ]);

        let noteObj: any = {};
        if (notesRes.status === 'fulfilled' && !notesRes.value.error && notesRes.value.data?.[0]) {
          noteObj = { ...notesRes.value.data[0] };
        }
        if (listRes.status === 'fulfilled' && !listRes.value.error && listRes.value.data?.[0]) {
          noteObj = { ...listRes.value.data[0], ...noteObj };
        }

        if (noteObj && (noteObj.id || noteObj.note_id)) {
          const id = String(noteObj.id || noteObj.note_id || noteId);
          const content = String(noteObj.content || noteObj.body || noteObj.text || '');
          const formattedNote: Note = {
            id,
            chapter_id: noteObj.chapter_id ? String(noteObj.chapter_id) : `virtual_${noteObj.subject_id || noteObj.subject || 'general'}`,
            title: noteObj.title || noteObj.name || 'Untitled Note',
            content,
            read_time_min: typeof noteObj.read_time_min === 'number'
              ? noteObj.read_time_min
              : (content ? Math.max(1, Math.round(content.split(/\s+/).length / 180)) : 5),
            sort_order: typeof noteObj.sort_order === 'number' ? noteObj.sort_order : 1,
            is_published: noteObj.is_published !== false,
            created_at: noteObj.created_at || new Date().toISOString(),
            updated_at: noteObj.updated_at || new Date().toISOString(),
            subject_id: noteObj.subject_id ? String(noteObj.subject_id) : undefined,
            subject: noteObj.subject ? String(noteObj.subject) : undefined,
            course: noteObj.course ? String(noteObj.course) : undefined
          };

          cacheFullNoteLocally(formattedNote);
          return formattedNote;
        }
      } catch (err) {
        console.warn('[notesRepository] Supabase fetchNoteById error:', err);
      }
    }

    return null;
  }

  /**
   * Fetches all user note states (progress, bookmark, last_read_at) for the current student
   */
  async fetchUserNoteStates(userId: string): Promise<Record<string, UserNoteState>> {
    const statesMap: Record<string, UserNoteState> = { ...getCachedUserStatesMapLocally() };

    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('user_note_state')
          .select('*')
          .eq('user_id', userId);

        if (!error && data) {
          for (const item of data) {
            statesMap[item.note_id] = item as UserNoteState;
            cacheUserStateLocally(item as UserNoteState);
          }
        }
      } catch (err) {
        console.warn('[notesRepository] Supabase fetchUserNoteStates error:', err);
      }
    }

    return statesMap;
  }

  /**
   * Upserts user note reading state (progress %, scroll position, bookmarked, last_read_at)
   * Debounced and queued for offline synchronization
   */
  async upsertUserNoteState(
    params: Partial<UserNoteState> & { user_id: string; note_id: string }
  ): Promise<UserNoteState> {
    const existing = getCachedUserStateLocally(params.note_id) || {
      user_id: params.user_id,
      note_id: params.note_id,
      progress: 0,
      scroll_position: 0,
      bookmarked: false,
      last_read_at: new Date().toISOString()
    };

    const updated: UserNoteState = {
      ...existing,
      ...params,
      last_read_at: params.last_read_at || new Date().toISOString()
    };

    // 1. Immediately update local storage so UI is snappy & offline-ready
    cacheUserStateLocally(updated);

    // 2. Queue for offline sync if disconnected
    if (!navigator.onLine) {
      enqueueSyncAction({
        type: 'UPSERT_NOTE_STATE',
        payload: updated
      });
      return updated;
    }

    // 3. Persist to Supabase
    const supabase = getSupabase();
    if (supabase && params.user_id) {
      try {
        const { error } = await supabase
          .from('user_note_state')
          .upsert(updated, { onConflict: 'user_id,note_id' });

        if (error) {
          console.warn('[notesRepository] upsertUserNoteState error, enqueuing for sync:', error.message);
          enqueueSyncAction({ type: 'UPSERT_NOTE_STATE', payload: updated });
        }
      } catch (err) {
        enqueueSyncAction({ type: 'UPSERT_NOTE_STATE', payload: updated });
      }
    }

    return updated;
  }

  /**
   * Fetches reader settings (font size, theme, etc.)
   */
  async fetchReaderSettings(userId: string): Promise<ReaderSettings> {
    const defaultSettings: ReaderSettings = {
      user_id: userId,
      font_size: 17,
      line_height: 1.7,
      font_family: 'system',
      theme: 'dark'
    };

    const cached = getCachedReaderSettingsLocally();
    if (cached) return { ...defaultSettings, ...cached, user_id: userId };

    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('reader_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          cacheReaderSettingsLocally(data as ReaderSettings);
          return data as ReaderSettings;
        }
      } catch {}
    }

    return defaultSettings;
  }

  /**
   * Upserts reader settings to Supabase and caches locally
   */
  async upsertReaderSettings(settings: ReaderSettings): Promise<ReaderSettings> {
    cacheReaderSettingsLocally(settings);

    if (!navigator.onLine) {
      enqueueSyncAction({ type: 'UPSERT_READER_SETTINGS', payload: settings });
      return settings;
    }

    const supabase = getSupabase();
    if (supabase && settings.user_id) {
      try {
        await supabase
          .from('reader_settings')
          .upsert(settings, { onConflict: 'user_id' });
      } catch {
        enqueueSyncAction({ type: 'UPSERT_READER_SETTINGS', payload: settings });
      }
    }

    return settings;
  }

  /**
   * Fetches highlights for a specific note
   */
  async fetchHighlights(userId: string, noteId: string): Promise<Highlight[]> {
    const cached = getCachedHighlightsLocally(noteId);

    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('highlights')
          .select('*')
          .eq('user_id', userId)
          .eq('note_id', noteId)
          .order('start_offset', { ascending: true });

        if (!error && data) {
          cacheHighlightsLocally(noteId, data as Highlight[]);
          return data as Highlight[];
        }
      } catch {}
    }

    return cached;
  }

  /**
   * Adds a new highlight
   */
  async addHighlight(params: {
    user_id: string;
    note_id: string;
    start_offset: number;
    end_offset: number;
    color: 'yellow' | 'green' | 'blue' | 'pink' | 'amber';
    comment?: string | null;
    selected_text?: string;
  }): Promise<Highlight> {
    const newHighlight: Highlight = {
      id: `hl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: params.user_id,
      note_id: params.note_id,
      start_offset: params.start_offset,
      end_offset: params.end_offset,
      color: params.color,
      comment: params.comment || null,
      selected_text: params.selected_text || '',
      created_at: new Date().toISOString()
    };

    const existing = getCachedHighlightsLocally(params.note_id);
    const updated = [...existing, newHighlight];
    cacheHighlightsLocally(params.note_id, updated);

    if (!navigator.onLine) {
      enqueueSyncAction({ type: 'ADD_HIGHLIGHT', payload: newHighlight });
      return newHighlight;
    }

    const supabase = getSupabase();
    if (supabase && params.user_id) {
      try {
        const { data, error } = await supabase
          .from('highlights')
          .insert({
            user_id: params.user_id,
            note_id: params.note_id,
            start_offset: params.start_offset,
            end_offset: params.end_offset,
            color: params.color,
            comment: params.comment || null
          })
          .select()
          .maybeSingle();

        if (!error && data) {
          return { ...newHighlight, id: data.id };
        }
      } catch {
        enqueueSyncAction({ type: 'ADD_HIGHLIGHT', payload: newHighlight });
      }
    }

    return newHighlight;
  }

  /**
   * Deletes a highlight
   */
  async deleteHighlight(userId: string, noteId: string, highlightId: string): Promise<boolean> {
    const existing = getCachedHighlightsLocally(noteId);
    const updated = existing.filter((h) => h.id !== highlightId);
    cacheHighlightsLocally(noteId, updated);

    if (!navigator.onLine) {
      enqueueSyncAction({ type: 'DELETE_HIGHLIGHT', payload: { id: highlightId } });
      return true;
    }

    const supabase = getSupabase();
    if (supabase && userId) {
      try {
        await supabase.from('highlights').delete().eq('id', highlightId).eq('user_id', userId);
      } catch {
        enqueueSyncAction({ type: 'DELETE_HIGHLIGHT', payload: { id: highlightId } });
      }
    }

    return true;
  }

  /**
   * Performs full-text search with highlighted snippets (Instant offline search with online RPC fallback)
   */
  async searchNotes(query: string): Promise<SearchResult[]> {
    const cleanQ = query.trim();
    if (!cleanQ) return [];

    const lowerQ = cleanQ.toLowerCase();
    const results: SearchResult[] = [];
    const seenIds = new Set<string>();

    // 1. Instant local search across cached & seed notes
    const allSearchableNotes: Note[] = [...SEED_NOTES];
    try {
      const cachedNotesMap = JSON.parse(safeStorage.getItem('ethiolearn_cached_notes') || '{}');
      Object.values(cachedNotesMap).forEach((n: any) => {
        if (n && n.id && !allSearchableNotes.some(s => s.id === n.id)) {
          allSearchableNotes.push(n);
        }
      });
    } catch {}

    for (const note of allSearchableNotes) {
      if (seenIds.has(note.id)) continue;
      const titleMatch = (note.title || '').toLowerCase().includes(lowerQ);
      const contentIndex = (note.content || '').toLowerCase().indexOf(lowerQ);

      if (titleMatch || contentIndex !== -1) {
        seenIds.add(note.id);
        let snippet = '';
        if (contentIndex !== -1) {
          const start = Math.max(0, contentIndex - 40);
          const end = Math.min(note.content.length, contentIndex + cleanQ.length + 40);
          const rawSnip = note.content.substring(start, end).replace(/\n/g, ' ');
          const regex = new RegExp(`(${cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          snippet = (start > 0 ? '...' : '') + rawSnip.replace(regex, '<mark>$1</mark>') + (end < note.content.length ? '...' : '');
        } else {
          snippet = (note.content || '').substring(0, 100).replace(/\n/g, ' ') + '...';
        }

        results.push({
          id: note.id,
          title: note.title,
          snippet,
          rank: titleMatch ? 1.0 : 0.5
        });
      }
    }

    // 2. If online and Supabase is configured, augment with RPC results
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase.rpc('search_notes', { q: cleanQ });
          if (!error && data && data.length > 0) {
            for (const r of data as SearchResult[]) {
              if (!seenIds.has(r.id)) {
                results.push(r);
                seenIds.add(r.id);
              }
            }
          }
        } catch {}
      }
    }

    return results;
  }

  /**
   * Retrieves previous and next notes within the same chapter based on sort_order
   */
  async getAdjacentNotes(chapterId: string, currentSortOrder: number): Promise<AdjacentNotes> {
    const notes = await this.fetchNotesList(chapterId);
    notes.sort((a, b) => a.sort_order - b.sort_order);

    const currentIndex = notes.findIndex((n) => n.sort_order === currentSortOrder);

    return {
      prev: currentIndex > 0 ? notes[currentIndex - 1] : null,
      next: currentIndex >= 0 && currentIndex < notes.length - 1 ? notes[currentIndex + 1] : null
    };
  }

  /**
   * Flushes offline sync queue to Supabase when reconnected
   */
  async processSyncQueue(): Promise<number> {
    const queue = getSyncQueue();
    if (queue.length === 0 || !navigator.onLine) return 0;

    const supabase = getSupabase();
    if (!supabase) return 0;

    let processedCount = 0;

    for (const item of queue) {
      try {
        if (item.type === 'UPSERT_NOTE_STATE') {
          await supabase.from('user_note_state').upsert(item.payload, { onConflict: 'user_id,note_id' });
          removeSyncAction(item.id);
          processedCount++;
        } else if (item.type === 'ADD_HIGHLIGHT') {
          await supabase.from('highlights').insert({
            user_id: item.payload.user_id,
            note_id: item.payload.note_id,
            start_offset: item.payload.start_offset,
            end_offset: item.payload.end_offset,
            color: item.payload.color,
            comment: item.payload.comment || null
          });
          removeSyncAction(item.id);
          processedCount++;
        } else if (item.type === 'DELETE_HIGHLIGHT') {
          await supabase.from('highlights').delete().eq('id', item.payload.id);
          removeSyncAction(item.id);
          processedCount++;
        } else if (item.type === 'UPSERT_READER_SETTINGS') {
          await supabase.from('reader_settings').upsert(item.payload, { onConflict: 'user_id' });
          removeSyncAction(item.id);
          processedCount++;
        }
      } catch (e) {
        console.warn('[Sync Queue] Processing item failed, keeping in queue:', e);
      }
    }

    return processedCount;
  }

  // ─── ADMIN OPERATIONS (SUBJECTS, CHAPTERS, MARKDOWN NOTES) ─────────────────

  /**
   * Admin: Create or update a subject in Supabase & local cache
   */
  async adminSaveSubject(subject: Partial<Subject>): Promise<Subject> {
    const id = subject.id || safeGenerateUUID();
    const item: Subject = {
      id,
      name: subject.name || 'New Subject',
      color: subject.color || '#D97706',
      sort_order: subject.sort_order ?? 0
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        // Check if subject with this name already exists in Supabase to prevent duplicate key error
        const { data: existingByName } = await supabase
          .from('subjects')
          .select('id, name')
          .ilike('name', item.name.trim())
          .maybeSingle();

        if (existingByName && existingByName.id) {
          item.id = String(existingByName.id);
        }

        const fullPayload: Record<string, any> = {
          id: item.id,
          name: item.name,
          color: item.color,
          sort_order: item.sort_order,
          is_active: true
        };

        let { error } = await supabase.from('subjects').upsert(fullPayload);

        // Fallback 1: If is_active column is missing
        if (error && error.message?.includes('is_active')) {
          delete fullPayload.is_active;
          const fallback1 = await supabase.from('subjects').upsert(fullPayload);
          error = fallback1.error;
        }

        // Fallback 2: If color or sort_order columns are missing
        if (error && (error.message?.includes('color') || error.message?.includes('sort_order'))) {
          delete fullPayload.color;
          delete fullPayload.sort_order;
          const fallback2 = await supabase.from('subjects').upsert(fullPayload);
          error = fallback2.error;
        }

        // Fallback 3: If any other schema/column error occurs, try minimal id and name payload
        if (error && (error.message?.includes('column') || error.message?.includes('schema cache'))) {
          const fallback3 = await supabase.from('subjects').upsert({
            id: item.id,
            name: item.name
          });
          error = fallback3.error;
        }

        if (error) {
          console.warn('[NotesRepository] adminSaveSubject Supabase notice:', error.message);
          // Still save locally so user action succeeds even if Supabase schema has strict column constraints
        }
      } catch (err: any) {
        console.warn('[NotesRepository] adminSaveSubject fallback error:', err);
      }
    }

    // Update local cache
    const existing = getCachedSubjectsLocally() || [];
    const idx = existing.findIndex(s => s.id === item.id);
    if (idx >= 0) existing[idx] = item;
    else existing.push(item);
    cacheSubjectsLocally(existing);

    return item;
  }

  /**
   * Admin: Delete subject
   */
  async adminDeleteSubject(subjectId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
        if (error) {
          console.error('[NotesRepository] adminDeleteSubject error:', error.message);
          throw new Error(`Failed to delete subject: ${error.message}`);
        }
      } catch (err: any) {
        console.error('[NotesRepository] adminDeleteSubject error:', err);
        throw err;
      }
    }

    const existing = getCachedSubjectsLocally() || [];
    cacheSubjectsLocally(existing.filter(s => s.id !== subjectId));
    return true;
  }

  /**
   * Admin: Create or update a chapter in Supabase & local cache
   */
  async adminSaveChapter(chapter: Partial<Chapter>): Promise<Chapter> {
    const id = chapter.id || safeGenerateUUID();
    const item: Chapter = {
      id,
      subject_id: chapter.subject_id!,
      title: chapter.title || 'Untitled Chapter',
      sort_order: chapter.sort_order ?? 0
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        let { error } = await supabase.from('chapters').upsert({
          id: item.id,
          subject_id: item.subject_id,
          title: item.title,
          sort_order: item.sort_order
        });

        if (error && error.message?.includes('sort_order')) {
          const res = await supabase.from('chapters').upsert({
            id: item.id,
            subject_id: item.subject_id,
            title: item.title
          });
          error = res.error;
        }

        if (error) {
          console.warn('[NotesRepository] adminSaveChapter Supabase notice:', error.message);
        }
      } catch (err: any) {
        console.warn('[NotesRepository] adminSaveChapter fallback error:', err);
      }
    }

    const existing = getCachedChaptersLocally() || [];
    const idx = existing.findIndex(c => c.id === item.id);
    if (idx >= 0) existing[idx] = item;
    else existing.push(item);
    cacheChaptersLocally(existing);

    return item;
  }

  /**
   * Admin: Delete chapter
   */
  async adminDeleteChapter(chapterId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
        if (error) {
          console.warn('[NotesRepository] adminDeleteChapter notice:', error.message);
        }
      } catch (err: any) {
        console.warn('[NotesRepository] adminDeleteChapter error:', err);
      }
    }

    const existing = getCachedChaptersLocally() || [];
    cacheChaptersLocally(existing.filter(c => c.id !== chapterId));
    return true;
  }

  /**
   * Admin: Create or update a Markdown note in Supabase & local cache
   */
  async adminSaveNote(note: Partial<Note>): Promise<Note> {
    const id = note.id || safeGenerateUUID();
    const item: Note = {
      id,
      chapter_id: note.chapter_id!,
      title: note.title || 'Untitled Note',
      content: note.content || '',
      read_time_min: note.read_time_min || 5,
      sort_order: note.sort_order ?? 0,
      is_published: note.is_published ?? true,
      created_at: note.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        let { error } = await supabase.from('notes').upsert({
          id: item.id,
          chapter_id: item.chapter_id,
          title: item.title,
          content: item.content,
          read_time_min: item.read_time_min,
          sort_order: item.sort_order,
          is_published: item.is_published,
          updated_at: item.updated_at
        });

        if (error && (error.message?.includes('read_time_min') || error.message?.includes('sort_order') || error.message?.includes('is_published') || error.message?.includes('updated_at'))) {
          const res = await supabase.from('notes').upsert({
            id: item.id,
            chapter_id: item.chapter_id,
            title: item.title,
            content: item.content
          });
          error = res.error;
        }

        if (error) {
          console.warn('[NotesRepository] adminSaveNote Supabase notice:', error.message);
        }
      } catch (err: any) {
        console.warn('[NotesRepository] adminSaveNote error:', err);
      }
    }

    // Cache note locally
    cacheFullNoteLocally(item);
    return item;
  }

  /**
   * Admin: Delete note
   */
  async adminDeleteNote(noteId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('notes').delete().eq('id', noteId);
        if (error) {
          console.error('[NotesRepository] adminDeleteNote error:', error.message);
          throw new Error(`Failed to delete note: ${error.message}`);
        }
      } catch (err: any) {
        console.error('[NotesRepository] adminDeleteNote error:', err);
        throw err;
      }
    }

    // Remove from local cache
    deleteCachedNoteLocally(noteId);
    return true;
  }

  /**
   * Admin: One-click Seed full academic curriculum into Supabase
   */
  async adminSeedAllCurriculumData(): Promise<{ subjectsCount: number; chaptersCount: number; notesCount: number }> {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase is not connected. Please enter your Supabase Project URL and Anon Key in Database Settings first.');
    }

    let sCount = 0;
    let cCount = 0;
    let nCount = 0;

    // Track ID mappings so chapters and notes link to real parent IDs in Supabase
    const subjectIdMap = new Map<string, string>();
    const chapterIdMap = new Map<string, string>();

    // 1. Seed Subjects
    for (const sub of SEED_SUBJECTS) {
      const saved = await this.adminSaveSubject(sub);
      subjectIdMap.set(sub.id, saved.id);
      sCount++;
    }

    // 2. Seed Chapters
    for (const ch of SEED_CHAPTERS) {
      const realSubjectId = subjectIdMap.get(ch.subject_id) || ch.subject_id;
      const saved = await this.adminSaveChapter({ ...ch, subject_id: realSubjectId });
      chapterIdMap.set(ch.id, saved.id);
      cCount++;
    }

    // 3. Seed Notes
    for (const n of SEED_NOTES) {
      const realChapterId = chapterIdMap.get(n.chapter_id) || n.chapter_id;
      await this.adminSaveNote({ ...n, chapter_id: realChapterId });
      nCount++;
    }

    return { subjectsCount: sCount, chaptersCount: cCount, notesCount: nCount };
  }
}

export const notesRepository = new NotesRepository();
