import { CourseRecord, LessonRecord } from '../types';

export interface CurriculumCourseData {
  course: CourseRecord;
  units: {
    unitNumber: number;
    unitTitle: string;
    description: string;
    lessons: LessonRecord[];
  }[];
}

export const INITIAL_CURRICULUM_COURSES: CurriculumCourseData[] = [
  {
    course: {
      id: 'course_emerging_tech',
      title: 'Emerging Technologies (EmTe 1012)',
      description: 'Official Ethiopian university freshman courseware covering Industry 4.0, Artificial Intelligence, IoT, Data Science, Blockchain, and Cybersecurity principles.',
      subject: 'Emerging Technologies',
      level: 'University',
      status: 'published',
      lessonsCount: 6,
      goalDays: 14,
      instructorName: 'Dr. Tadesse Bekele (AAU / Wolkite)',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z'
    },
    units: [
      {
        unitNumber: 1,
        unitTitle: 'Unit 1: Introduction to Emerging Technologies & Industry 4.0',
        description: 'Understand the evolutionary stages of industrial revolutions and the drivers of digital transformation.',
        lessons: [
          {
            id: 'emte_l1',
            courseId: 'course_emerging_tech',
            title: '1.1 The Evolution of Industrial Revolutions (1.0 to 4.0)',
            chapterNumber: 1,
            unitTitle: 'Unit 1: Industrial Revolutions',
            duration: '20 min',
            status: 'published',
            content: `### 🚀 1.1 The Evolution of Industrial Revolutions

The modern technological landscape is shaped by four key industrial transitions:

#### 1. First Industrial Revolution (1IR - late 18th century)
* **Core Drivers:** Steam engine, mechanization, water power.
* **Impact:** Transition from manual handcrafting to steam-powered mechanical factories (textiles, metallurgy).

#### 2. Second Industrial Revolution (2IR - late 19th / early 20th century)
* **Core Drivers:** Electricity, assembly lines, internal combustion engines, telecommunications (telegraph/telephone).
* **Impact:** Mass production of consumer goods and urbanization.

#### 3. Third Industrial Revolution (3IR - late 20th century)
* **Core Drivers:** Semiconductors, personal computing (PC), automated electronics, early Internet.
* **Impact:** Transition from analog electronic and mechanical devices to digital processing.

#### 4. Fourth Industrial Revolution (4IR / Industry 4.0 - 21st Century)
* **Core Drivers:** Cyber-Physical Systems (CPS), Artificial Intelligence, Internet of Things (IoT), Cloud & Edge Computing, Blockchain, Big Data Analytics.
* **Impact:** Fusion of digital, biological, and physical spheres with real-time autonomous decision making.

---

### 🔑 Key Characteristics of 4IR
1. **Velocity:** Exponential pace of innovation outstripping linear human adaptation.
2. **Breadth & Depth:** Transforming entire systems of production, management, and national governance.
3. **Systems Impact:** Integration of smart grids, autonomous vehicles, and personalized medicine.

> 💡 **Exam Tip:** EUEE and university exams frequently test the distinction between 3IR (automation & computers) and 4IR (cyber-physical integration and AI).`,
            resources: [
              { id: 'res_emte_1', title: '4IR Architecture Cheat Sheet (PDF)', type: 'summary', size: '1.2 MB' },
              { id: 'res_emte_2', title: 'Industry 4.0 Key Formulas & Definitions', type: 'cheat_sheet', size: '640 KB' }
            ],
            createdAt: '2026-01-10T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          },
          {
            id: 'emte_l2',
            courseId: 'course_emerging_tech',
            title: '1.2 Role of Data in 4IR: The 5 V\'s of Big Data',
            chapterNumber: 2,
            unitTitle: 'Unit 1: Industrial Revolutions',
            duration: '18 min',
            status: 'published',
            content: `### 📊 1.2 The Role of Big Data in Industry 4.0

Data represents the primary fuel for all modern machine learning models and smart decision systems.

#### The 5 V's of Big Data:
1. **Volume:** Massive scale of data generated every second (terabytes to petabytes from IoT sensors, clickstreams, social feeds).
2. **Velocity:** The blistering speed at which new data is generated, collected, and processed in real time.
3. **Variety:** Structural diversity of data:
   * *Structured:* Relational database tables (SQL).
   * *Semi-Structured:* JSON payloads, XML, server logs.
   * *Unstructured:* Raw video feeds, audio recordings, medical scans.
4. **Veracity:** The trustworthiness, noise levels, and quality of the captured data.
5. **Value:** The actionable insights and business/scientific solutions extracted from raw data.

#### Ethiopian Context & Application:
* **Agriculture:** Telebirr and National ID datasets enabling micro-credit evaluation for farmers based on mobile transaction patterns.
* **Healthcare:** Aggregated epidemiology analytics during malaria seasons across regional clinics.`,
            resources: [
              { id: 'res_emte_3', title: '5Vs of Big Data Summary Diagram', type: 'summary', size: '850 KB' }
            ],
            createdAt: '2026-01-10T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          }
        ]
      },
      {
        unitNumber: 2,
        unitTitle: 'Unit 2: Artificial Intelligence & Machine Learning Architectures',
        description: 'Explore neural networks, computer vision, natural language processing, and ethical AI frameworks.',
        lessons: [
          {
            id: 'emte_l3',
            courseId: 'course_emerging_tech',
            title: '2.1 AI vs Machine Learning vs Deep Learning',
            chapterNumber: 3,
            unitTitle: 'Unit 2: AI & Machine Learning',
            duration: '25 min',
            status: 'published',
            content: `### 🤖 2.1 The Hierarchy of Artificial Intelligence

Understanding the nested relationship:
$$\\text{Artificial Intelligence} \\supset \\text{Machine Learning} \\supset \\text{Deep Learning}$$

#### 1. Artificial Intelligence (AI)
The broad engineering discipline of constructing computer programs and hardware capable of performing tasks that traditionally require human intelligence (problem solving, pattern recognition, linguistic reasoning).

#### 2. Machine Learning (ML)
A specific subfield of AI where algorithms improve their performance on a specific task through empirical data training rather than hard-coded rule-based programming.
* **Supervised Learning:** Labeled data inputs (e.g. Classification of crop diseases from leaf photos).
* **Unsupervised Learning:** Finding hidden patterns in unlabeled data (e.g. Customer clustering).
* **Reinforcement Learning:** Agent learns via trial, error, reward penalties (e.g. Robotics, game playing).

#### 3. Deep Learning (DL)
A specialized subset of ML utilizing multi-layered Artificial Neural Networks (ANNs) inspired by biological brain neurons (Convolutional Neural Networks for vision, Transformers for LLMs).`,
            resources: [
              { id: 'res_emte_4', title: 'ML Algorithms Decision Matrix', type: 'cheat_sheet', size: '920 KB' }
            ],
            createdAt: '2026-01-10T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          },
          {
            id: 'emte_l4',
            courseId: 'course_emerging_tech',
            title: '2.2 Computer Vision, NLP and Ethical AI Principles',
            chapterNumber: 4,
            unitTitle: 'Unit 2: AI & Machine Learning',
            duration: '22 min',
            status: 'published',
            content: `### 👁️ 2.2 Computer Vision, NLP and Ethical Considerations

#### Computer Vision (CV)
Techniques allowing machines to decode and interpret visual inputs from camera sensors.
* *Applications:* Autonomous vehicle road lane detection, agricultural drone crop surveying, facial biometric authentication.

#### Natural Language Processing (NLP)
Computational linguistics enabling computers to parse, translate, and synthesize human language (including low-resource Ge'ez script languages like Amharic, Afaan Oromoo, and Tigrinya).

#### Ethical Pillars of AI:
1. **Fairness & Non-Discrimination:** Mitigating biased training datasets.
2. **Transparency & Explainability:** Avoiding black-box decisions in critical domains (law, medical triage).
3. **Data Privacy & Consent:** Ensuring student and patient identity protection.
4. **Safety & Accountability:** Clear human liability protocols for automated failures.`,
            createdAt: '2026-01-10T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          }
        ]
      },
      {
        unitNumber: 3,
        unitTitle: 'Unit 3: Internet of Things (IoT) & Smart Connected Environments',
        description: 'Sensors, actuators, edge gateways, communication protocols (MQTT/CoAP), and smart grid architectures.',
        lessons: [
          {
            id: 'emte_l5',
            courseId: 'course_emerging_tech',
            title: '3.1 IoT Architecture: Sensors, Gateways & Cloud',
            chapterNumber: 5,
            unitTitle: 'Unit 3: Internet of Things',
            duration: '20 min',
            status: 'published',
            content: `### 📡 3.1 Internet of Things (IoT) Architecture

An IoT system connects everyday physical objects to internet networks to automate data collection and control.

#### 4-Layer IoT Architecture:
1. **Perception / Sensing Layer:** Physical sensors (temperature, humidity, GPS, optical) and actuators (valves, motors).
2. **Network / Transmission Layer:** Protocols transmitting telemetry data (Wi-Fi, 4G/5G, LoRaWAN, Zigbee, Bluetooth BLE).
3. **Data Processing / Middleware Layer:** Aggregates, cleanses, and runs edge/cloud computing analytics.
4. **Application Layer:** User interfaces, smart home apps, automated irrigation consoles.

#### Cloud Computing vs Edge Computing:
* **Cloud Computing:** Centralized servers (AWS, Google Cloud) offering massive storage and computational horsepower at the cost of higher latency.
* **Edge Computing:** Data processing performed locally on gateway nodes or device microcontrollers, slashing latency and operating reliably even during internet outages.`,
            createdAt: '2026-01-10T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          },
          {
            id: 'emte_l6',
            courseId: 'course_emerging_tech',
            title: '3.2 Blockchain Fundamentals & Smart Contracts',
            chapterNumber: 6,
            unitTitle: 'Unit 3: Blockchain & Security',
            duration: '24 min',
            status: 'published',
            content: `### 🔗 3.2 Blockchain & Distributed Ledger Technology (DLT)

A blockchain is a decentralized, cryptographically secured ledger of immutable transactions distributed across independent network peers.

#### Core Cryptographic Mechanics:
1. **Cryptographic Hash Functions (SHA-256):** One-way mathematical hash generating fixed-length string signatures. Any single-bit change drastically alters the resulting hash.
2. **Block Structure:** Each block contains its own hash, transaction data, timestamp, nonce, and the **hash of the previous block**.
3. **Consensus Mechanisms:** Protocols ensuring all nodes agree on ledger truth without central authorities (Proof of Work vs Proof of Stake).
4. **Smart Contracts:** Self-executing code stored on blockchain that automatically enforces contract clauses when pre-defined conditions are fulfilled.`,
            createdAt: '2026-01-10T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          }
        ]
      }
    ]
  },
  {
    course: {
      id: 'course_freshman_math',
      title: 'Freshman Mathematics for Social & Natural Sciences (Math 1011)',
      description: 'Foundational university mathematics: Propositional logic, set theory, complex number algebra, function domains, limits, and derivative applications.',
      subject: 'Mathematics',
      level: 'University',
      status: 'published',
      lessonsCount: 5,
      goalDays: 21,
      instructorName: 'Prof. Kassahun Alemayehu',
      thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
      createdAt: '2026-01-12T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z'
    },
    units: [
      {
        unitNumber: 1,
        unitTitle: 'Unit 1: Propositional Logic and Set Theory',
        description: 'Truth tables, logical connectives, tautologies, valid argument proofs, and set operations.',
        lessons: [
          {
            id: 'math_l1',
            courseId: 'course_freshman_math',
            title: '1.1 Propositions, Truth Tables & Logical Connectives',
            chapterNumber: 1,
            unitTitle: 'Unit 1: Propositional Logic',
            duration: '22 min',
            status: 'published',
            content: `### 📐 1.1 Propositions and Logical Connectives

A **proposition** is a declarative statement that is either strictly True (T) or strictly False (F), but never both simultaneously.

#### Core Connectives & Truth Table Rules:
1. **Negation ($\\neg p$ or $\\sim p$):** Reverses truth value.
2. **Conjunction ($p \\land q$):** True **only** when both $p$ and $q$ are True.
3. **Disjunction ($p \\lor q$):** False **only** when both $p$ and $q$ are False.
4. **Conditional / Implication ($p \\to q$):** False **only** when $p$ is True and $q$ is False (T $\\to$ F is F).
5. **Biconditional ($p \\leftrightarrow q$):** True when both $p$ and $q$ share identical truth values.

#### De Morgan\'s Laws:
$$\\neg (p \\land q) \\equiv \\neg p \\lor \\neg q$$
$$\\neg (p \\lor q) \\equiv \\neg p \\land \\neg q$$

> 💡 **Sample Midterm Problem:** Determine if $(p \\to q) \\equiv (\\neg q \\to \\neg p)$. Yes, this is the **contrapositive** and is always logically equivalent!`,
            resources: [
              { id: 'res_math_1', title: 'Logic Laws & Equivalences PDF', type: 'summary', size: '1.1 MB' }
            ],
            createdAt: '2026-01-12T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          },
          {
            id: 'math_l2',
            courseId: 'course_freshman_math',
            title: '1.2 Set Operations, Cartesian Products & Venn Diagrams',
            chapterNumber: 2,
            unitTitle: 'Unit 1: Propositional Logic',
            duration: '18 min',
            status: 'published',
            content: `### 🔢 1.2 Set Operations & Algebraic Properties

A set is a well-defined collection of distinct objects.

#### Essential Set Operations:
* **Union ($A \\cup B$):** $\\{x \\mid x \\in A \\text{ or } x \\in B\\}$
* **Intersection ($A \\cap B$):** $\\{x \\mid x \\in A \\text{ and } x \\in B\\}$
* **Difference ($A \\setminus B$ or $A - B$):** $\\{x \\mid x \\in A \\text{ and } x \\notin B\\}$
* **Complement ($A^c$ or $A'$):** $\\{x \\in U \\mid x \\notin A\\}$
* **Cartesian Product ($A \\times B$):** $\\{(a, b) \\mid a \\in A, b \\in B\\}$ with cardinality $|A \\times B| = |A| \\cdot |B|$.`,
            createdAt: '2026-01-12T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          }
        ]
      },
      {
        unitNumber: 2,
        unitTitle: 'Unit 2: Real and Complex Number Systems',
        description: 'Complex numbers algebra, Argand diagrams, polar and exponential forms, and De Moivre\'s Theorem.',
        lessons: [
          {
            id: 'math_l3',
            courseId: 'course_freshman_math',
            title: '2.1 Complex Numbers & Polar Coordinates',
            chapterNumber: 3,
            unitTitle: 'Unit 2: Complex Numbers',
            duration: '25 min',
            status: 'published',
            content: `### 🧮 2.1 Complex Numbers in Rectangular and Polar Form

A complex number is defined as $z = a + bi$, where $a, b \\in \\mathbb{R}$ and $i = \\sqrt{-1}$ ($i^2 = -1$).

#### Modulus & Argument:
* **Modulus:** $|z| = r = \\sqrt{a^2 + b^2}$
* **Argument:** $\\theta = \\arg(z) = \\arctan\\left(\\frac{b}{a}\\right)$ (adjusted for quadrant).
* **Polar Representation:** $z = r(\\cos \\theta + i \\sin \\theta) = r e^{i\\theta}$

#### De Moivre\'s Theorem:
For any integer $n$:
$$[r(\\cos \\theta + i \\sin \\theta)]^n = r^n (\\cos(n\\theta) + i \\sin(n\\theta))$$`,
            createdAt: '2026-01-12T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          },
          {
            id: 'math_l4',
            courseId: 'course_freshman_math',
            title: '2.2 Limits, Continuity & Squeeze Theorem',
            chapterNumber: 4,
            unitTitle: 'Unit 3: Calculus Foundations',
            duration: '28 min',
            status: 'published',
            content: `### 📈 2.2 Limit Calculations and Continuity

#### Precise Definition of a Limit:
$\\lim_{x \\to c} f(x) = L$ means for every $\\varepsilon > 0$, there exists $\\delta > 0$ such that if $0 < |x - c| < \\delta$, then $|f(x) - L| < \\varepsilon$.

#### Continuity at a Point $x = c$:
A function $f(x)$ is continuous at $x = c$ if and only if:
1. $f(c)$ is defined.
2. $\\lim_{x \\to c} f(x)$ exists (left-hand limit = right-hand limit).
3. $\\lim_{x \\to c} f(x) = f(c)$.`,
            createdAt: '2026-01-12T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          },
          {
            id: 'math_l5',
            courseId: 'course_freshman_math',
            title: '2.3 Derivative Rules & Chain Rule Applications',
            chapterNumber: 5,
            unitTitle: 'Unit 3: Calculus Foundations',
            duration: '24 min',
            status: 'published',
            content: `### ⚡ 2.3 Derivative Master Rules

* **Power Rule:** $\\frac{d}{dx}[x^n] = n x^{n-1}$
* **Product Rule:** $\\frac{d}{dx}[u \\cdot v] = u' v + u v'$
* **Quotient Rule:** $\\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{u' v - u v'}{v^2}$
* **Chain Rule:** $\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$`,
            createdAt: '2026-01-12T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          }
        ]
      }
    ]
  },
  {
    course: {
      id: 'course_communicative_english',
      title: 'Communicative English Skills (EnLa 1011)',
      description: 'University freshman English mastery: Reported speech transformations, relative clause constructions, academic coherence, and listening strategies.',
      subject: 'Communicative English',
      level: 'Common Courses',
      status: 'published',
      lessonsCount: 4,
      goalDays: 10,
      instructorName: 'Ms. Bethlehem Girma',
      thumbnailUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z'
    },
    units: [
      {
        unitNumber: 1,
        unitTitle: 'Unit 1: Advanced Grammar & Reported Speech',
        description: 'Tense backshifts, reporting verbs, questions, and commands in indirect speech.',
        lessons: [
          {
            id: 'eng_l1',
            courseId: 'course_communicative_english',
            title: '1.1 Rules of Reported Speech & Backshifting',
            chapterNumber: 1,
            unitTitle: 'Unit 1: Advanced Grammar',
            duration: '18 min',
            status: 'published',
            content: `### 🗣️ 1.1 Reported Speech Tense Backshift Rules

When reporting a direct utterance in past tense contexts, the main verbs systematically shift back in time:

| Direct Speech | Reported Speech | Example |
|---|---|---|
| Present Simple | Past Simple | "I study" $\\to$ He said he studied |
| Present Continuous | Past Continuous | "I am reading" $\\to$ She said she was reading |
| Present Perfect | Past Perfect | "I have seen it" $\\to$ He said he had seen it |
| Past Simple | Past Perfect | "We arrived" $\\to$ They said they had arrived |
| Will / Can / May | Would / Could / Might | "I will come" $\\to$ He said he would come |

#### Crucial Time & Place Expressions:
* *now* $\\to$ *then*
* *today* $\\to$ *that day*
* *yesterday* $\\to$ *the day before / previous day*
* *tomorrow* $\\to$ *the following day / next day*
* *here* $\\to$ *there*`,
            createdAt: '2026-01-15T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          },
          {
            id: 'eng_l2',
            courseId: 'course_communicative_english',
            title: '1.2 Defining vs Non-Defining Relative Clauses',
            chapterNumber: 2,
            unitTitle: 'Unit 1: Advanced Grammar',
            duration: '16 min',
            status: 'published',
            content: `### ✍️ 1.2 Defining vs Non-Defining Relative Clauses

Relative clauses add descriptive information about nouns using relative pronouns (*who, whom, whose, which, that, where, when*).

#### 1. Defining Relative Clauses (No Commas)
Provide essential identity information. Without the clause, the sentence meaning is incomplete.
* *Example:* "The student **who scored highest on the exam** received a scholarship."

#### 2. Non-Defining Relative Clauses (Surrounded by Commas)
Provide additional, non-essential background information. Removing the clause leaves a complete, unambiguous sentence.
* *Example:* "Addis Ababa, **which is the diplomatic capital of Africa**, sits at an elevation of 2,355 meters."
* ⚠️ **Golden Rule:** You can **never** use the pronoun **'that'** in a non-defining (comma-separated) clause!`,
            createdAt: '2026-01-15T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          }
        ]
      },
      {
        unitNumber: 2,
        unitTitle: 'Unit 2: Academic Paragraph Writing & Essay Cohesion',
        description: 'Topic sentences, supporting evidence, transition devices, and concluding statements.',
        lessons: [
          {
            id: 'eng_l3',
            courseId: 'course_communicative_english',
            title: '2.1 Paragraph Structure & Topic Sentences',
            chapterNumber: 3,
            unitTitle: 'Unit 2: Academic Writing',
            duration: '20 min',
            status: 'published',
            content: `### 📝 2.1 Anatomy of a High-Scoring Academic Paragraph

A cohesive academic paragraph is structured around three core pillars:

1. **Topic Sentence:** States the single main controlling idea clearly at the very beginning of the paragraph.
2. **Supporting Sentences:** 3-5 sentences presenting concrete evidence, definitions, statistics, logical explanations, or citations.
3. **Concluding / Transition Sentence:** Summarizes the synthesis and establishes a bridge to the subsequent paragraph.`,
            createdAt: '2026-01-15T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          },
          {
            id: 'eng_l4',
            courseId: 'course_communicative_english',
            title: '2.2 Cohesive Devices & Sentence Transitions',
            chapterNumber: 4,
            unitTitle: 'Unit 2: Academic Writing',
            duration: '17 min',
            status: 'published',
            content: `### 🔗 2.2 Cohesive Devices & Academic Transitions

* **Addition:** *Furthermore, moreover, in addition to, additionally.*
* **Contrast:** *However, on the contrary, nevertheless, conversely, whereas.*
* **Cause & Effect:** *Consequently, therefore, thus, as a result, hence.*
* **Exemplification:** *For instance, specifically, namely, to illustrate.*`,
            createdAt: '2026-01-15T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          }
        ]
      }
    ]
  },
  {
    course: {
      id: 'course_grade12_physics',
      title: 'Grade 12 Physics National Matric Masterclass',
      description: 'Complete Ministry of Education national exam curriculum: Two-dimensional kinematics, electromagnetic induction, AC circuits, and quantum physics.',
      subject: 'Physics',
      level: 'Grade 12',
      status: 'published',
      lessonsCount: 4,
      goalDays: 14,
      instructorName: 'Dr. Yared Assefa (NEAEA Board Examiner)',
      thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
      createdAt: '2026-01-18T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z'
    },
    units: [
      {
        unitNumber: 1,
        unitTitle: 'Unit 1: Two-Dimensional Motion & Dynamics',
        description: 'Projectile motion, centripetal acceleration, circular orbits, and torque equilibrium.',
        lessons: [
          {
            id: 'g12_phy_l1',
            courseId: 'course_grade12_physics',
            title: '1.1 Projectile Motion & Trajectory Formulas',
            chapterNumber: 1,
            unitTitle: 'Unit 1: 2D Dynamics',
            duration: '22 min',
            status: 'published',
            content: `### 🚀 1.1 Projectile Motion Calculations

In ideal projectile motion (neglecting air resistance), horizontal motion is uniform ($a_x = 0$), while vertical motion is uniformly accelerated ($a_y = -g = -9.8\\text{ m/s}^2$).

#### Essential Formulas:
* **Time of Flight ($T$):**
  $$T = \\frac{2 v_0 \\sin \\theta}{g}$$
* **Maximum Height ($H_{\\max}$):**
  $$H_{\\max} = \\frac{v_0^2 \\sin^2 \\theta}{2g}$$
* **Horizontal Range ($R$):**
  $$R = \\frac{v_0^2 \\sin(2\\theta)}{g}$$
  * *Note:* Maximum range occurs at launch angle $\\theta = 45^\\circ$.`,
            createdAt: '2026-01-18T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          },
          {
            id: 'g12_phy_l2',
            courseId: 'course_grade12_physics',
            title: '1.2 Electric Fields & Gauss\'s Law',
            chapterNumber: 2,
            unitTitle: 'Unit 2: Electromagnetism',
            duration: '20 min',
            status: 'published',
            content: `### ⚡ 1.2 Electric Fields & Gauss\'s Law

* **Coulomb\'s Law:**
  $$F = \\frac{1}{4\\pi \\varepsilon_0} \\frac{|q_1 q_2|}{r^2}$$
* **Gauss\'s Law:**
  $$\\Phi_E = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{\\text{enclosed}}}{\\varepsilon_0}$$`,
            createdAt: '2026-01-18T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          }
        ]
      },
      {
        unitNumber: 2,
        unitTitle: 'Unit 2: Electromagnetic Induction & Atomic Physics',
        description: 'Faraday\'s law, Lenz\'s law, transformers, and the photoelectric effect.',
        lessons: [
          {
            id: 'g12_phy_l3',
            courseId: 'course_grade12_physics',
            title: '2.1 Faraday\'s Law, Lenz\'s Law & Transformers',
            chapterNumber: 3,
            unitTitle: 'Unit 2: Electromagnetic Induction',
            duration: '24 min',
            status: 'published',
            content: `### 🧲 2.1 Electromagnetic Induction

* **Faraday\'s Law of Induction:**
  $$\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}$$
* **Lenz\'s Law:** An induced current always flows in a direction such that its magnetic field opposes the change in magnetic flux that produced it (evidenced by the negative sign in Faraday\'s law).
* **Transformer Voltage Ratio:**
  $$\\frac{V_s}{V_p} = \\frac{N_s}{N_p} = \\frac{I_p}{I_s}$$`,
            createdAt: '2026-01-18T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          },
          {
            id: 'g12_phy_l4',
            courseId: 'course_grade12_physics',
            title: '2.2 Photoelectric Effect & Einstein\'s Equation',
            chapterNumber: 4,
            unitTitle: 'Unit 3: Quantum Physics',
            duration: '20 min',
            status: 'published',
            content: `### 💡 2.2 Photoelectric Effect & Photon Energy

* **Photon Energy:**
  $$E = h f = \\frac{h c}{\\lambda}$$
  where $h = 6.626 \\times 10^{-34} \\text{ J}\\cdot\\text{s}$.
* **Einstein\'s Photoelectric Equation:**
  $$K_{\\max} = h f - \\Phi = e V_0$$
  where $\\Phi$ is the work function of the metal and $V_0$ is the stopping potential.`,
            createdAt: '2026-01-18T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z'
          }
        ]
      }
    ]
  }
];

export function getCurriculumCourse(courseId: string): CurriculumCourseData | undefined {
  return INITIAL_CURRICULUM_COURSES.find(c => c.course.id === courseId);
}

export function getAllCurriculumCourses(): CourseRecord[] {
  return INITIAL_CURRICULUM_COURSES.map(c => c.course);
}

export function getCurriculumLessonsForCourse(courseId: string): LessonRecord[] {
  const c = getCurriculumCourse(courseId);
  if (!c) return [];
  const lessons: LessonRecord[] = [];
  c.units.forEach(u => {
    lessons.push(...u.lessons);
  });
  return lessons;
}
