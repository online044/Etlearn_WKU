import { AuthenticCurriculumQuestion } from './mathQuestions';

// ============================================================================
// 🇪🇹 MOE NATIONAL UNIVERSITY EXIT EXAM (የከፍተኛ ትምህርት ተቋማት ሀገር አቀፍ መውጫ ፈተና)
// Real Examination Series - Ministry of Education (MoE) 2016 E.C. (2024 G.C.)
// ============================================================================

export const AUTHENTIC_EXIT_EXAM_CS_2016: AuthenticCurriculumQuestion[] = [
  // ─── DOMAIN 1: DATA STRUCTURES & ALGORITHM ANALYSIS ───
  {
    questionText: "In asymptotic algorithm analysis, what is the tight worst-case time complexity of finding an element in a self-balancing AVL binary search tree containing N nodes?",
    options: [
      "O(log N)",
      "O(N)",
      "O(N log N)",
      "O(1)"
    ],
    correctIndex: 0,
    topic: "AVL Trees & Asymptotic Analysis",
    unit: "Unit 1",
    chapter: "Chapter 1: Advanced Data Structures",
    difficulty: "medium",
    explanation: "AVL trees strictly maintain a height-balance property where the heights of the two child subtrees of any node differ by at most one. Therefore, the maximum tree height is strictly bounded by approximately 1.44 * log2(N), guaranteeing O(log N) worst-case search, insertion, and deletion time.",
    amharicExplanation: "በ AVL ዛፍ (AVL Tree) ውስጥ የእያንዳንዱ ኖድ ቁመት ልዩነት (Balance Factor) ከ 1 በላይ ስለማይሆን፣ የዛፉ ቁመት ሁልጊዜ O(log N) ሆኖ ይጠበቃል። ስለዚህ በመጥፎ ሁኔታም (Worst-case) መፈለጊያ ጊዜው O(log N) ነው።"
  },
  {
    questionText: "Which sorting algorithm is NOT stable by default and exhibits an O(N²) worst-case time complexity, but offers an average-case performance of O(N log N) with minimal in-place memory overhead?",
    options: [
      "Quick Sort",
      "Merge Sort",
      "Bubble Sort",
      "Counting Sort"
    ],
    correctIndex: 0,
    topic: "Sorting Algorithms & Stability",
    unit: "Unit 1",
    chapter: "Chapter 2: Sorting and Searching",
    difficulty: "medium",
    explanation: "Quick Sort partitions in-place around a pivot. When partitions are highly unbalanced (e.g., sorted arrays with first-element pivot), it degrades to O(N²), but averages O(N log N). Because equal elements can swap across the pivot, it is not stable by default.",
    amharicExplanation: "ኩዊክ ሶርት (Quick Sort) በተለምዶ ኢን-ፕሌስ (in-place) የሚሰራ ሲሆን፣ በአማካይ O(N log N)፣ በመጥፎ ሁኔታ ደግሞ O(N²) ይወስዳል። እኩል ዋጋ ያላቸውን አካላት ቅደም ተከተል ስለማይጠብቅ ስቴብል (Stable) አይደለም።"
  },
  {
    questionText: "What is the primary operational characteristic of Dijkstra's single-source shortest path algorithm on weighted graphs?",
    options: [
      "It requires all edge weights to be non-negative",
      "It successfully detects negative weight cycles like Bellman-Ford",
      "It only functions on Directed Acyclic Graphs (DAGs)",
      "It calculates all-pairs shortest paths in O(V) time"
    ],
    correctIndex: 0,
    topic: "Graph Algorithms & Shortest Paths",
    unit: "Unit 1",
    chapter: "Chapter 3: Graph Theory",
    difficulty: "hard",
    explanation: "Dijkstra's greedy algorithm assumes that adding an edge to a path always increases its total cost. Negative edge weights violate this invariant, causing the algorithm to make suboptimal decisions. For negative edges, the Bellman-Ford algorithm must be used.",
    amharicExplanation: "የዳይክስትራ አልጎሪዝም (Dijkstra's Algorithm) የሚሰራው ሁሉም የግራፍ መስመሮች ክብደት (Edge Weights) አወንታዊ (non-negative) ሲሆኑ ብቻ ነው። አሉታዊ ቁጥሮች ካሉ የቤልማን-ፎርድ አልጎሪዝም ያስፈልጋል።"
  },

  // ─── DOMAIN 2: DATABASE SYSTEMS & TRANSACTION MANAGEMENT ───
  {
    questionText: "In relational database design, a table is said to be in Third Normal Form (3NF) if and only if:",
    options: [
      "It is in 2NF and has no transitive functional dependencies between non-prime attributes",
      "It has no composite primary keys",
      "Every determinant is a candidate key (BCNF condition)",
      "All repeating groups and multi-valued attributes have been eliminated"
    ],
    correctIndex: 0,
    topic: "Relational Normalization (3NF)",
    unit: "Unit 2",
    chapter: "Chapter 4: Relational Database Design",
    difficulty: "medium",
    explanation: "A relation is in 3NF if it satisfies 2NF (no partial dependency of non-prime attributes on candidate keys) and no non-prime attribute is transitively dependent on any candidate key (X → Y where neither is a candidate key).",
    amharicExplanation: "አንድ የዳታቤዝ ሰንጠረዥ በ 3ኛ ኖርማል ፎርም (3NF) ውስጥ የሚሆነው፡ 2NFን አሟልቶ በዋና ቁልፍ ባልሆኑ አምዶች (non-prime attributes) መካከል ምንም ዓይነት ተሻጋሪ ጥገኝነት (transitive dependency) ሳይኖር ሲቀር ነው።"
  },
  {
    questionText: "Which ACID property guarantees that once a database transaction commits, its state modifications will survive system crashes, power failures, or server restarts?",
    options: [
      "Durability",
      "Atomicity",
      "Consistency",
      "Isolation"
    ],
    correctIndex: 0,
    topic: "ACID Properties & Crash Recovery",
    unit: "Unit 2",
    chapter: "Chapter 5: Transaction Processing",
    difficulty: "easy",
    explanation: "Durability guarantees that completed transactions are recorded in persistent non-volatile storage (via write-ahead logging - WAL), so changes persist even after unexpected system failures or power outages.",
    amharicExplanation: "ዲውራቢሊቲ (Durability) አንድ ግብይት (Transaction) አንዴ ኮሚት ከተደረገ በኋላ ሲስተሙ ቢቋረጥ ወይም መብራት ቢጠፋ እንኳ መረጃው እንዳይጠፋ ዋስትና ይሰጣል።"
  },

  // ─── DOMAIN 3: OPERATING SYSTEMS & CONCURRENCY ───
  {
    questionText: "Which of the following conditions is NOT one of the four necessary Coffman conditions required for a system deadlock to occur?",
    options: [
      "Preemptive resource scheduling",
      "Mutual exclusion",
      "Hold and wait",
      "Circular wait"
    ],
    correctIndex: 0,
    topic: "Operating Systems & Deadlock Invariants",
    unit: "Unit 3",
    chapter: "Chapter 6: Process Synchronization",
    difficulty: "hard",
    explanation: "The four Coffman conditions are: 1) Mutual exclusion, 2) Hold and wait, 3) No preemption (resources cannot be forcibly taken away), and 4) Circular wait. If resources can be preempted, deadlocks can be resolved or prevented.",
    amharicExplanation: "የኮፍማን 4ቱ የሞተ-መቆለፍ (Deadlock) ቅድመ-ሁኔታዎች፡ Mutual exclusion, Hold and wait, No preemption (መነጠቅ አለመቻል) እና Circular wait ናቸው። Preemptive መሆን ዴድሎክን ይከላከላል እንጂ አያስከትልም።"
  },
  {
    questionText: "In virtual memory paging systems, what phenomenon occurs when the operating system spends more time swapping pages in and out of disk than executing useful CPU instructions?",
    options: [
      "Thrashing",
      "Belady's Anomaly",
      "External fragmentation",
      "Starvation"
    ],
    correctIndex: 0,
    topic: "Virtual Memory & Paging",
    unit: "Unit 3",
    chapter: "Chapter 7: Memory Management",
    difficulty: "medium",
    explanation: "Thrashing occurs when the collective working set of active processes exceeds the available physical RAM. The OS continuously incurs page faults and disk I/O, driving CPU utilization down to near zero.",
    amharicExplanation: "ትራሺንግ (Thrashing) ማለት ሲፒዩ ስራ ከመስራት ይልቅ ፔጆችን ከሃርድ ዲስክ ወደ ራም በማመላለስ ብዙ ጊዜ የሚያባክንበትና ኮምፒዩተሩ በጣም የሚቀዘቅዝበት ሁኔታ ነው።"
  },

  // ─── DOMAIN 4: COMPUTER NETWORKS & CYBERSECURITY ───
  {
    questionText: "During the standard TCP 3-way handshake to establish a reliable transport connection, what is the exact packet exchange sequence between client (C) and server (S)?",
    options: [
      "C sends SYN → S replies with SYN-ACK → C replies with ACK",
      "C sends ACK → S replies with SYN → C replies with FIN",
      "C sends SYN → S replies with ACK → C sends DATA",
      "C sends PING → S replies with PONG → C sends ACK"
    ],
    correctIndex: 0,
    topic: "Transport Layer & TCP Handshake",
    unit: "Unit 4",
    chapter: "Chapter 8: Computer Networks",
    difficulty: "easy",
    explanation: "The TCP 3-way handshake begins when the client sends a SYN (synchronize sequence numbers) segment. The server responds with SYN-ACK acknowledging the client's SEQ and sending its own. Finally, the client replies with ACK.",
    amharicExplanation: "በ TCP የ 3-ደረጃ ግንኙነት (3-way handshake) ውስጥ፡ ደንበኛው SYN ይልካል ⟹ ሰርቨሩ SYN-ACK ይመልሳል ⟹ በመጨረሻም ደንበኛው ACK ልኮ ግንኙነቱ ይጀምራል።"
  },
  {
    questionText: "In symmetric-key vs asymmetric-key cryptography, which algorithm utilizes a pair of mathematically linked public and private keys based on the integer factorization problem?",
    options: [
      "RSA (Rivest-Shamir-Adleman)",
      "AES (Advanced Encryption Standard)",
      "DES (Data Encryption Standard)",
      "ChaCha20"
    ],
    correctIndex: 0,
    topic: "Network Security & Cryptography",
    unit: "Unit 4",
    chapter: "Chapter 9: Information Security",
    difficulty: "medium",
    explanation: "RSA is an asymmetric cryptographic system whose security rests on the practical difficulty of factoring the product of two large prime numbers. AES and DES are symmetric block ciphers using a single shared secret key.",
    amharicExplanation: "አር ኤስ ኤ (RSA) የህዝብና የግል ቁልፍ (Public & Private keys) ጥንዶችን የሚጠቀም አሲሜትሪክ ሲስተም ሲሆን፣ ደህንነቱ የተመሰረተው ትልልቅ ፕራይም ቁጥሮችን ማባዛትና መበተን አዳጋች በመሆኑ ላይ ነው።"
  },

  // ─── DOMAIN 5: SOFTWARE ENGINEERING & OOP DESIGN ───
  {
    questionText: "According to the SOLID object-oriented design principles, the 'L' stands for Liskov Substitution Principle (LSP), which asserts that:",
    options: [
      "Objects of a superclass should be replaceable with objects of a subclass without altering the correctness of the program",
      "Classes should be open for extension but closed for modification",
      "Clients should not be forced to depend on interfaces they do not use",
      "High-level modules should not depend on low-level modules"
    ],
    correctIndex: 0,
    topic: "SOLID Principles & OOP Architecture",
    unit: "Unit 5",
    chapter: "Chapter 10: Software Engineering",
    difficulty: "hard",
    explanation: "Barbara Liskov's Substitution Principle mandates that derived sub-types must be substitutable for their base types without altering program correctness or violating pre/post-conditions.",
    amharicExplanation: "የሊስኮቭ ምትክ መርህ (LSP)፡ ማንኛውም የወላጅ ክፍል (Superclass) አካል በልጅ ክፍል (Subclass) አካል ያለምንም ስህተት መተካት መቻል እንዳለበት የሚያዝዝ የ SOLID መርህ ነው።"
  }
];

export const AUTHENTIC_EXIT_EXAM_ACCOUNTING_2016: AuthenticCurriculumQuestion[] = [
  // ─── DOMAIN 1: FINANCIAL ACCOUNTING & IFRS ───
  {
    questionText: "Under International Financial Reporting Standards (IFRS) and the IASB Conceptual Framework, what are the five fundamental elements of financial statements?",
    options: [
      "Assets, Liabilities, Equity, Income, and Expenses",
      "Assets, Debits, Credits, Net Profit, and Retained Earnings",
      "Current Assets, Fixed Assets, Current Liabilities, Long-term Debt, and Equity",
      "Cash Inflow, Cash Outflow, Depreciation, Inventory, and Goodwill"
    ],
    correctIndex: 0,
    topic: "IFRS Conceptual Framework",
    unit: "Unit 1",
    chapter: "Chapter 1: Financial Reporting Framework",
    difficulty: "easy",
    explanation: "The Conceptual Framework for Financial Reporting identifies exactly five elements: Assets, Liabilities, Equity (which relate to the financial position on the balance sheet), and Income and Expenses (which relate to financial performance).",
    amharicExplanation: "በ IFRS ማዕቀፍ መሠረት የፋይናንስ መግለጫዎች 5ቱ መሠረታዊ አካላት፡ ሀብት (Assets)፣ ዕዳ (Liabilities)፣ የተጣራ ካፒታል (Equity)፣ ገቢ (Income) እና ወጪ (Expenses) ናቸው።"
  },
  {
    questionText: "According to IAS 2 (Inventories), inventory must be measured at the end of each reporting period at the:",
    options: [
      "Lower of cost and net realizable value (NRV)",
      "Higher of replacement cost and historical cost",
      "Fair market value minus liquidation expenses",
      "Original invoice price plus inflation index adjustments"
    ],
    correctIndex: 0,
    topic: "IAS 2 Inventory Valuation",
    unit: "Unit 1",
    chapter: "Chapter 2: Asset Valuation",
    difficulty: "medium",
    explanation: "IAS 2 prescribes that inventories must be carried at the lower of cost and net realizable value (NRV = estimated selling price in the ordinary course of business minus estimated completion and selling costs).",
    amharicExplanation: "በ IAS 2 መመሪያ መሠረት የዕቃ ክምችት (Inventory) በሪፖርት ጊዜ መጨረሻ መመዝገብ ያለበት በግዢ ዋጋው (Cost) ወይም በተጣራ ሊገኝ በሚችለው ዋጋ (NRV) መካከል ዝቅተኛ በሆነው ነው።"
  },
  {
    questionText: "Under Ethiopian Proclamation No. 979/2016 (Federal Income Tax Proclamation), employment income tax is classified under which schedule of taxable revenue?",
    options: [
      "Schedule 'A' Income",
      "Schedule 'B' Income (Rental Income)",
      "Schedule 'C' Income (Business Profit Tax)",
      "Schedule 'D' Income (Other Incomes / Royalties)"
    ],
    correctIndex: 0,
    topic: "Ethiopian Tax Law & Schedules",
    unit: "Unit 2",
    chapter: "Chapter 3: Ethiopian Taxation",
    difficulty: "medium",
    explanation: "Under Ethiopian tax law, Schedule 'A' covers employment income, Schedule 'B' covers rental of buildings, Schedule 'C' covers business profits, and Schedule 'D' covers other miscellaneous income such as dividends and royalties.",
    amharicExplanation: "በኢትዮጵያ የታክስ አዋጅ መሠረት የሰራተኞች የደመወዝ ገቢ ግብር የሚመደበው በሰንጠረዥ 'ሀ' (Schedule A) ስር ነው። ሰንጠረዥ 'ለ' የኪራይ ገቢ ሲሆን 'ሐ' ደግሞ የንግድ ትርፍ ግብር ነው።"
  },
  {
    questionText: "In auditing, what type of audit opinion is issued when the auditor concludes that the financial statements are prepared, in all material respects, in accordance with the applicable financial reporting framework?",
    options: [
      "Unmodified (Clean) Opinion",
      "Qualified Opinion",
      "Adverse Opinion",
      "Disclaimer of Opinion"
    ],
    correctIndex: 0,
    topic: "Auditing Standards & Auditor's Report",
    unit: "Unit 3",
    chapter: "Chapter 4: Auditing & Assurance",
    difficulty: "easy",
    explanation: "An unmodified (clean) opinion indicates that the financial statements present fairly, in all material respects, the financial position and results of the entity in compliance with IFRS/GAAP.",
    amharicExplanation: "ኦዲተሩ የድርጅቱ የሂሳብ መግለጫዎች ምንም አይነት ጎልቶ የሚታይ ስህተት (Material misstatement) የሌለባቸውና ህግን ያከበሩ መሆናቸውን ሲያረጋግጥ ያልተለወጠ ንጹህ አስተያየት (Unmodified/Clean Opinion) ይሰጣል።"
  },
  {
    questionText: "In cost and management accounting, what is the formula to calculate the Break-Even Point in units?",
    options: [
      "Total Fixed Costs / Contribution Margin per Unit",
      "Total Variable Costs / Sales Price per Unit",
      "Total Revenue - Total Fixed Costs",
      "Contribution Margin Ratio * Total Fixed Costs"
    ],
    correctIndex: 0,
    topic: "Cost-Volume-Profit (CVP) Analysis",
    unit: "Unit 4",
    chapter: "Chapter 5: Cost Accounting",
    difficulty: "easy",
    explanation: "Break-even occurs where Total Revenue equals Total Costs. At this point, Fixed Costs / (Selling Price per unit - Variable Cost per unit) = Fixed Costs / Unit Contribution Margin.",
    amharicExplanation: "ኪሳራም ሆነ ትርፍ የማይገኝበት ነጥብ (Break-Even Point) የሚሰላው፡ ጠቅላላ ቋሚ ወጪዎችን (Total Fixed Costs) በአንድ እቃ አስተዋጽኦ ህዳግ (Contribution Margin per Unit) በማካፈል ነው።"
  }
];

export const AUTHENTIC_EXIT_EXAM_ECE_2016: AuthenticCurriculumQuestion[] = [
  // ─── DOMAIN 1: CIRCUIT ANALYSIS & ELECTROMAGNETICS ───
  {
    questionText: "According to Thevenin's Theorem, any linear bilateral electrical circuit connected between two terminals can be replaced by an equivalent circuit consisting of:",
    options: [
      "A single voltage source (Vth) in series with a single resistor (Rth)",
      "A single current source (In) in parallel with a single resistor (Rn)",
      "An ideal capacitor in series with an inductor",
      "A dependent voltage source in parallel with an open circuit"
    ],
    correctIndex: 0,
    topic: "Circuit Theorems & Thevenin Equivalence",
    unit: "Unit 1",
    chapter: "Chapter 1: Network Analysis",
    difficulty: "easy",
    explanation: "Thevenin's theorem states that any two-terminal linear DC circuit can be reduced to an open-circuit voltage source (Vth) in series with an equivalent input resistance (Rth). Its dual is Norton's theorem.",
    amharicExplanation: "የቴቨኒን ቲዎረም (Thevenin's Theorem)፡ ማንኛውንም መስመራዊ የኤሌክትሪክ ሰርኪውት በአንድ የቮልቴጅ ምንጭ (Vth) እና በተከታታይ በተያያዘ ተከላካይ (Rth) መተካት እንደሚቻል ያረጋግጣል።"
  },
  {
    questionText: "In digital electronics and Boolean algebra, which universal logic gate can be configured to implement ANY other Boolean logic function (AND, OR, NOT, XOR)?",
    options: [
      "NAND gate (or NOR gate)",
      "AND gate",
      "OR gate",
      "XOR gate"
    ],
    correctIndex: 0,
    topic: "Digital Logic Design & Universal Gates",
    unit: "Unit 2",
    chapter: "Chapter 2: Digital Systems",
    difficulty: "easy",
    explanation: "NAND and NOR gates are classified as universal gates because combinations of either gate alone can construct the basic NOT, AND, and OR operations, and by extension any combinatorial circuit.",
    amharicExplanation: "ናንድ (NAND) እና ኖር (NOR) ጌቶች ዩኒቨርሳል ጌት ይባላሉ፤ ምክንያቱም እነሱን ብቻ በመጠቀም ማንኛውንም የዲጂታል ሎጂክ ሰርኪውት (AND, OR, NOT) መስራት ይቻላል።"
  },
  {
    questionText: "In continuous-time signal processing, what condition does the Nyquist-Shannon Sampling Theorem dictate to avoid signal aliasing during analog-to-digital conversion?",
    options: [
      "The sampling frequency (fs) must be at least twice the maximum signal frequency (fs ≥ 2 * fmax)",
      "The sampling frequency must equal exactly the fundamental carrier frequency",
      "The sampling frequency must be half the bandwidth of the lowest harmonic",
      "The signal must be strictly quantized using 8-bit registers"
    ],
    correctIndex: 0,
    topic: "Signals and Systems & Nyquist Criterion",
    unit: "Unit 3",
    chapter: "Chapter 3: Signal Processing",
    difficulty: "medium",
    explanation: "The Nyquist-Shannon theorem requires the sampling rate fs to be strictly greater than twice the highest frequency component (fmax) present in the bandlimited signal to reconstruct it without spectral overlap (aliasing).",
    amharicExplanation: "የናይክዊስት ቲዎረም (Nyquist Theorem)፡ የአናሎግ ድምፅ ወይም ሲግናል ወደ ዲጂታል ሲቀየር መረጃው እንዳይዛባ የናሙና ድግግሞሹ (fs) ከከፍተኛው ሲግናል ፍሪኩዌንሲ ቢያንስ እጥፍ (fs ≥ 2 * fmax) መሆን አለበት።"
  }
];
