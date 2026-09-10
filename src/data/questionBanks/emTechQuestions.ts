import { AuthenticCurriculumQuestion } from './mathQuestions';

export const AUTHENTIC_EMTECH_QUESTIONS_WKU_1011: AuthenticCurriculumQuestion[] = [
  // ─── UNIT 1: INDUSTRIAL REVOLUTIONS & INDUSTRY 4.0 ───
  {
    questionText: "Which core technological breakthrough uniquely distinguishes the Fourth Industrial Revolution (Industry 4.0) from the Third Industrial Revolution?",
    options: [
      "The fusion of cyber-physical systems, IoT, and autonomous cognitive computing",
      "The introduction of programmable logic controllers (PLCs) and mainframe computers",
      "The widespread adoption of electrical power grids and assembly lines",
      "The invention of the steam engine and mechanized textile looms"
    ],
    correctIndex: 0,
    topic: "Evolution of Industrial Revolutions",
    unit: "Unit 1",
    chapter: "Chapter 1: Industry 4.0 Foundations",
    difficulty: "easy",
    explanation: "Industry 3.0 brought electronics, IT, and basic automation. Industry 4.0 builds upon this with cyber-physical systems, where digital networks, physical assets, and AI-driven intelligence interact seamlessly in real-time.",
    amharicExplanation: "3ኛው የኢንዱስትሪ አብዮት ኮምፒውተሮችንና አውቶሜሽን ሲያስተዋውቅ፣ 4ኛው ግን ዲጂታልን፣ አካላዊን እና ባዮሎጂካል ዓለምን የሚያገናኝ ሳይበር-ፊዚካል ሲስተምስ ነው።"
  },
  {
    questionText: "According to the World Economic Forum (WEF), which of the following is considered one of the primary physical drivers of Industry 4.0?",
    options: [
      "Autonomous vehicles, advanced robotics, and 3D printing (additive manufacturing)",
      "Centralized relational database management systems (RDBMS)",
      "Traditional analog telecommunication switching",
      "Monolithic client-server software architectures"
    ],
    correctIndex: 0,
    topic: "Physical & Digital Drivers of Industry 4.0",
    unit: "Unit 1",
    chapter: "Chapter 1: Industry 4.0 Drivers",
    difficulty: "medium",
    explanation: "The physical pillars of Industry 4.0 comprise autonomous vehicles, 3D printing, advanced robotics, and new smart nanomaterials.",
    amharicExplanation: "የ 4ኛው የኢንዱስትሪ አብዮት አካላዊ (Physical) አንቀሳቃሾች ራስ-ገዝ ተሽከርካሪዎች፣ 3D ህትመት እና የላቁ ሮቦቲክሶች ናቸው።"
  },

  // ─── UNIT 2: ARTIFICIAL INTELLIGENCE & MACHINE LEARNING ───
  {
    questionText: "In Machine Learning, what is the fundamental difference between Supervised Learning and Unsupervised Learning?",
    options: [
      "Supervised learning trains models on labeled input-output pairs, whereas unsupervised learning identifies patterns in unlabeled data",
      "Supervised learning uses neural networks while unsupervised learning only uses linear equations",
      "Supervised learning requires no training phase, while unsupervised learning requires labeled datasets",
      "Supervised learning is only used for speech recognition, while unsupervised learning is for numbers"
    ],
    correctIndex: 0,
    topic: "Supervised vs Unsupervised Machine Learning",
    unit: "Unit 2",
    chapter: "Chapter 1: Machine Learning Paradigms",
    difficulty: "easy",
    explanation: "Supervised learning relies on ground-truth labeled training data (features + labels) to learn a mapping function. Unsupervised learning discovers latent clustering, associations, or structure without pre-assigned target labels.",
    amharicExplanation: "ሱፐርቫይዝድ ለርኒንግ በመረጃና በውጤት (Labeled data) ሲያሰለጥን፣ አንሱፐርቫይዝድ ግን ያልተሰየመ መረጃን (Unlabeled data) ውስጣዊ ቅርጽና ስብስብ ይመረምራል።"
  },
  {
    questionText: "When an Artificial Neural Network achieves near-zero error on the training dataset but performs poorly with high error on unseen validation data, what phenomenon is occurring?",
    options: [
      "Overfitting (high variance)",
      "Underfitting (high bias)",
      "Vanishing gradient problem",
      "Catastrophic forgetting"
    ],
    correctIndex: 0,
    topic: "Model Evaluation & Generalization",
    unit: "Unit 2",
    chapter: "Chapter 2: Deep Learning & Neural Networks",
    difficulty: "medium",
    explanation: "Overfitting occurs when a model memorizes noise and specific peculiarities of the training data rather than generalizing the underlying concept, leading to high training accuracy but poor validation accuracy.",
    amharicExplanation: "ኦቨርፊቲንግ (Overfitting) ሞዴሉ የማሰልጠኛ ዳታውን ቃርሞ በማስታወስ በእውነተኛ አዲስ መረጃ ላይ ደካማ አፈጻጸም ሲያሳይ የሚፈጠር ችግር ነው።"
  },
  {
    questionText: "Which mathematical activation function is widely favored in deep convolutional hidden layers because it avoids the vanishing gradient problem for positive activations?",
    options: [
      "Rectified Linear Unit (ReLU: f(x) = max(0, x))",
      "Sigmoid (f(x) = 1 / (1 + e⁻ˣ))",
      "Hyperbolic Tangent (tanh)",
      "Binary Step function"
    ],
    correctIndex: 0,
    topic: "Activation Functions in Deep Learning",
    unit: "Unit 2",
    chapter: "Chapter 2: Neural Network Architectures",
    difficulty: "medium",
    explanation: "ReLU outputs x for x > 0 and 0 otherwise. Its derivative is a constant 1 for positive inputs, which prevents gradient values from diminishing exponentially through many layers.",
    amharicExplanation: "ሬሉ (ReLU: max(0, x)) አዎንታዊ ግብዓቶች ላይ ግሬዲየንቱ 1 ሆኖ ስለሚቆይ የቫኒሺንግ ግሬዲየንት (Vanishing gradient) ችግርን ይከላከላል።"
  },

  // ─── UNIT 3: INTERNET OF THINGS (IoT) ───
  {
    questionText: "In the standard 3-layer architecture of an Internet of Things (IoT) system, what is the primary role of the Perception (Sensing) Layer?",
    options: [
      "Collecting environmental parameters through physical sensors, RFID tags, and actuators",
      "Routing data packets across long-range cellular and satellite networks",
      "Providing user-facing dashboards and business intelligence analytics",
      "Managing database backups and relational SQL schemas"
    ],
    correctIndex: 0,
    topic: "IoT 3-Layer Architecture",
    unit: "Unit 3",
    chapter: "Chapter 1: IoT Architecture & Sensors",
    difficulty: "easy",
    explanation: "The Perception layer sits at the physical bottom of the IoT stack. It uses hardware sensors to collect physical measurements (temperature, moisture, motion) and converts them into digital signals.",
    amharicExplanation: "የፐርሰፕሽን (Perception) ንብርብር አካባቢያዊ መረጃዎችን በሴንሰሮች (እንደ ሙቀት፣ እርጥበት፣ እንቅስቃሴ) በመሰብሰብ ወደ ዲጂታል የሚቀይር የመጀመሪያው ክፍል ነው።"
  },
  {
    questionText: "Why is the lightweight MQTT (Message Queuing Telemetry Transport) protocol preferred over standard HTTP for battery-powered agricultural IoT nodes in rural Ethiopia?",
    options: [
      "MQTT uses a publish/subscribe model with low network overhead and minimal bandwidth consumption",
      "MQTT requires synchronous XML document validation for every payload",
      "HTTP cannot transmit integer sensor readings",
      "MQTT operates exclusively without an Internet connection"
    ],
    correctIndex: 0,
    topic: "IoT Communication Protocols",
    unit: "Unit 3",
    chapter: "Chapter 2: IoT Protocols & Applications",
    difficulty: "medium",
    explanation: "MQTT is designed for constrained devices with limited CPU, battery, and flaky network connections. Its 2-byte header and pub/sub model drastically reduce battery drain and cellular data usage compared to verbose HTTP request/response headers.",
    amharicExplanation: "MQTT አነስተኛ ባንድዊድዝ እና ባትሪ የሚጠቀም ቀላል የኮሙኒኬሽን ፕሮቶኮል በመሆኑ በገጠር የእርሻ ሴንሰሮች ላይ ከ HTTP እጅግ ይመረጣል።"
  },

  // ─── UNIT 4: BIG DATA & DATA SCIENCE ───
  {
    questionText: "Which of the '5 V's of Big Data' describes the trustworthiness, accuracy, and noise level present in data collected from disparate online and physical sources?",
    options: [
      "Veracity",
      "Velocity",
      "Volume",
      "Variety"
    ],
    correctIndex: 0,
    topic: "Characteristics of Big Data (5 V's)",
    unit: "Unit 4",
    chapter: "Chapter 1: Big Data Fundamentals",
    difficulty: "easy",
    explanation: "Veracity refers to the quality, credibility, and reliability of data. High veracity means data is clean and accurate; low veracity indicates biases, noise, and inaccuracies.",
    amharicExplanation: "ቬራሲቲ (Veracity) የተሰበሰበው መረጃ ትክክለኛነት፣ ተአማኒነት እና ከስህተት የጸዳ መሆኑን የሚገልጽ የቢግ ዳታ ባህሪ ነው።"
  },
  {
    questionText: "How does Apache Spark achieve significantly faster big-data processing speeds compared to classical Apache Hadoop MapReduce?",
    options: [
      "By executing in-memory resilient distributed dataset (RDD) computations rather than repeatedly writing intermediate results to physical disks",
      "By executing single-threaded linear scripts",
      "By eliminating the need for any cluster nodes",
      "By converting all unstructured audio files into plain text"
    ],
    correctIndex: 0,
    topic: "Distributed Big Data Processing Frameworks",
    unit: "Unit 4",
    chapter: "Chapter 2: Big Data Tools & Analytics",
    difficulty: "hard",
    explanation: "Hadoop MapReduce writes intermediate calculation steps to disk (HDFS) between map and reduce phases. Apache Spark keeps intermediate datasets in RAM (memory), reducing I/O latency by up to 100x.",
    amharicExplanation: "አፓቼ ስፓርክ (Spark) መረጃዎችን በሃርድ ዲስክ ፈንታ በራም (In-memory) ላይ ስለሚያሰላ ከሃዱፕ ማፕ-ሪዲዩስ በብዙ እጥፍ ፈጣን ነው።"
  },

  // ─── UNIT 5: BLOCKCHAIN, CLOUD & CYBERSECURITY ───
  {
    questionText: "In a decentralized blockchain network, what computational property ensures that once a transaction block is confirmed and linked, it cannot be tampered with retroactively?",
    options: [
      "Each block contains the cryptographic hash of the preceding block, creating an unbroken tamper-evident chain",
      "Blocks are stored in a private centralized MySQL database",
      "Transactions are verified by government central banks exclusively",
      "Block data is wiped from all nodes every 24 hours"
    ],
    correctIndex: 0,
    topic: "Blockchain Immutability & Cryptographic Hashing",
    unit: "Unit 5",
    chapter: "Chapter 1: Blockchain Technology",
    difficulty: "medium",
    explanation: "Each block references the cryptographic hash (e.g. SHA-256) of the previous block header. Altering a past transaction alters that block's hash, which invalidates all subsequent block headers throughout the distributed network.",
    amharicExplanation: "እያንዳንዱ ብሎክ የቀዳሚውን ብሎክ ክሪፕቶግራፊክ ሃሽ (Cryptographic Hash) ስለሚይዝ፣ አንድም መረጃ ቢቀየር ሰንሰለቱ በሙሉ ውድቅ ይሆናል (የማይቀለበስ መዝገብ)።"
  },
  {
    questionText: "Which cloud service model provides the customer with raw computing infrastructure (virtual machines, storage, and software-defined networks), leaving OS management and application runtime to the customer?",
    options: [
      "Infrastructure as a Service (IaaS)",
      "Platform as a Service (PaaS)",
      "Software as a Service (SaaS)",
      "Function as a Service (FaaS)"
    ],
    correctIndex: 0,
    topic: "Cloud Computing Service Models",
    unit: "Unit 5",
    chapter: "Chapter 2: Cloud Computing Models",
    difficulty: "easy",
    explanation: "In IaaS (e.g. AWS EC2, Google Compute Engine), the cloud provider supplies physical/virtual servers, storage, and networking, while the consumer manages the operating system, middleware, and applications.",
    amharicExplanation: "በ IaaS ሞዴል ደንበኛው ቨርቹዋል ማሽንና ኔትዎርክ ሲሰጠው፣ ኦፕሬቲንግ ሲስተሙንና ሶፍትዌሩን ራሱ ደንበኛው ያስተዳድራል።"
  },
  {
    questionText: "Under the Information Security CIA Triad, which pillar is violated when an unauthorized attacker intercepts and modifies bank balance records in transit?",
    options: [
      "Integrity",
      "Confidentiality",
      "Availability",
      "Non-repudiation"
    ],
    correctIndex: 0,
    topic: "Cybersecurity CIA Triad",
    unit: "Unit 5",
    chapter: "Chapter 2: Cybersecurity Fundamentals",
    difficulty: "easy",
    explanation: "Integrity guarantees that data remains accurate, complete, and uncorrupted by unauthorized modification. Altering bank records directly violates integrity.",
    amharicExplanation: "መረጃው በሌላ ሰው መለወጡና መበላሸቱ የኢንፎርሜሽን ደህንነትን 'Integrity' (ትክክለኛነትና ሙሉነት) የሚጥስ ድርጊት ነው።"
  },
  {
    questionText: "Which lightweight publish/subscribe messaging protocol is specifically optimized for constrained IoT devices and low-bandwidth, high-latency wireless networks?",
    options: [
      "MQTT (Message Queuing Telemetry Transport)",
      "HTTP/1.1",
      "FTP (File Transfer Protocol)",
      "SMTP (Simple Mail Transfer Protocol)"
    ],
    correctIndex: 0,
    topic: "IoT Communication Protocols",
    unit: "Unit 3",
    chapter: "Chapter 2: IoT Protocols & Architecture",
    difficulty: "easy",
    explanation: "MQTT is an extremely lightweight binary publish/subscribe messaging transport protocol designed for battery-constrained devices and unreliable networks, featuring tiny packet overhead.",
    amharicExplanation: "MQTT አነስተኛ ባንድዊድዝ እና ሃይል ለሚጠቀሙ የአይኦቲ (IoT) እቃዎች የተዘጋጀ በጣም ቀለል ያለ የመልዕክት ማስተላለፊያ ፕሮቶኮል ነው።"
  },
  {
    questionText: "In Big Data analytics, which of the '5 Vs' refers specifically to data trustworthiness, authenticity, noise level, and accuracy?",
    options: [
      "Veracity",
      "Velocity",
      "Volume",
      "Variety"
    ],
    correctIndex: 0,
    topic: "Big Data Characteristics (The 5 Vs)",
    unit: "Unit 4",
    chapter: "Chapter 1: Big Data Fundamentals",
    difficulty: "easy",
    explanation: "Veracity addresses data quality, integrity, bias, and trustworthiness. Volume relates to scale, Velocity to processing speed, and Variety to diverse data formats.",
    amharicExplanation: "ቬራሲቲ (Veracity) የሚያመለክተው የመረጃውን አስተማማኝነት፣ ትክክለኛነትና ከብክለት የጸዳ መሆኑን ነው።"
  },
  {
    questionText: "What is a 'Smart Contract' in the context of Ethereum and distributed blockchain systems?",
    options: [
      "A self-executing computerized protocol that automatically executes agreement terms when predefined conditions are met",
      "A legally binding PDF document signed using digital biometric signatures",
      "An encrypted cloud database stored in centralized servers",
      "A machine learning algorithm that predicts cryptocurrency price fluctuations"
    ],
    correctIndex: 0,
    topic: "Blockchain Smart Contracts & Decentralized Logic",
    unit: "Unit 5",
    chapter: "Chapter 1: Smart Contracts",
    difficulty: "medium",
    explanation: "Smart contracts are autonomous software programs deployed directly on blockchain ledgers that execute transactions automatically when predetermined conditions (if/then rules) are verified across network nodes.",
    amharicExplanation: "ስማርት ኮንትራት (Smart contract) በብሎክቼይን ላይ የተጻፈ እና የተወሰኑ ቅድመ-ሁኔታዎች ሲሟሉ በራሱ የሚፈጸም የኮምፒዩተር ፕሮግራም ነው።"
  },
  {
    questionText: "In public-key (asymmetric) cryptography, which key is used to decrypt a message that was encrypted using the recipient's public key?",
    options: [
      "The recipient's private key",
      "The sender's public key",
      "The sender's private key",
      "A shared symmetric session key"
    ],
    correctIndex: 0,
    topic: "Cybersecurity & Asymmetric Cryptography",
    unit: "Unit 5",
    chapter: "Chapter 2: Cryptography & Encryption",
    difficulty: "medium",
    explanation: "Asymmetric cryptography utilizes mathematically linked keypairs. A message encrypted with the recipient's public key can only be decrypted by the matching private key, which is kept secret by the recipient.",
    amharicExplanation: "በአሲሜትሪክ ክሪፕቶግራፊ በተቀባዩ የህዝብ ቁልፍ (Public key) የተቆለፈን መልእክት መክፈት የሚችለው የተቀባዩ ሚስጥራዊ ቁልፍ (Private key) ብቻ ነው።"
  }
];
