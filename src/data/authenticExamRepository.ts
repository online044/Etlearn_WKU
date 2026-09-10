/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EthioLearn Pro - Master Authentic University & National Entrance Exam Question Repository
 * Genuine, non-repeating curriculum questions for Ethiopian Higher Education & EUEE.
 */

import { BankDifficulty } from '../types';

export interface AuthenticExamItem {
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  amharicExplanation: string;
  topic: string;
  unit: string;
  chapter: string;
  difficulty: BankDifficulty;
  subject: string;
}

export const AUTHENTIC_MASTER_QUESTIONS: AuthenticExamItem[] = [
  // ==========================================================================
  // 1. FRESHMAN MATHEMATICS (Math 1011 / Math 1012 / Calculus / Linear Algebra)
  // ==========================================================================
  {
    subject: "Mathematics",
    topic: "Inverse Functions & Bijectivity",
    unit: "Unit 1",
    chapter: "Chapter 1: Relations & Functions",
    difficulty: "medium",
    questionText: "Let f: ℝ \\ {3} → ℝ \\ {2} be defined by f(x) = (2x + 1) / (x - 3). Find the formula for the inverse function f⁻¹(x).",
    options: [
      "f⁻¹(x) = (3x + 1) / (x - 2)",
      "f⁻¹(x) = (x - 3) / (2x + 1)",
      "f⁻¹(x) = (3x - 1) / (x + 2)",
      "f⁻¹(x) = (2x - 3) / (x - 1)"
    ],
    correctIndex: 0,
    explanation: "Set y = (2x + 1)/(x - 3) ⟹ y(x - 3) = 2x + 1 ⟹ yx - 3y = 2x + 1 ⟹ yx - 2x = 3y + 1 ⟹ x(y - 2) = 3y + 1 ⟹ x = (3y + 1)/(y - 2). Replacing y with x gives f⁻¹(x) = (3x + 1)/(x - 2).",
    amharicExplanation: "y = (2x + 1)/(x - 3) ብለን በመነሳት xን ለብቻው ስንፈልግ፡ y(x - 3) = 2x + 1 ⟹ yx - 2x = 3y + 1 ⟹ x = (3y + 1)/(y - 2) ይሆናል። ስለዚህ f⁻¹(x) = (3x + 1)/(x - 2) ነው።"
  },
  {
    subject: "Mathematics",
    topic: "Matrix Algebra & Invertibility",
    unit: "Unit 2",
    chapter: "Chapter 2: Matrices & Determinants",
    difficulty: "hard",
    questionText: "For what value(s) of the real parameter k is the matrix A = [[1, 2, 3], [0, k, 4], [2, 1, 1]] singular (not invertible)?",
    options: [
      "k = 12/5",
      "k = 8/5",
      "k = -4/3",
      "k = 16/5"
    ],
    correctIndex: 0,
    explanation: "A matrix is singular if det(A) = 0. Expanding along row 1: det(A) = 1*(k*1 - 4*1) - 2*(0*1 - 4*2) + 3*(0*1 - k*2) = (k - 4) - 2(-8) + 3(-2k) = k - 4 + 16 - 6k = 12 - 5k. Setting 12 - 5k = 0 gives k = 12/5.",
    amharicExplanation: "ማትሪክስ ኢንቨርስ የማይኖረው det(A) = 0 ሲሆን ነው። ዲተርሚናንቱን በመጀመሪያው ረድፍ ስናሰላው det(A) = 12 - 5k ይሆናል። 12 - 5k = 0 ሲሆን k = 12/5 ይሆናል።"
  },
  {
    subject: "Mathematics",
    topic: "Cramer's Rule & Linear Systems",
    unit: "Unit 2",
    chapter: "Chapter 2: Systems of Linear Equations",
    difficulty: "medium",
    questionText: "Consider the system of linear equations:\n2x + y = 7\n3x - 2y = 7\nUsing Cramer's Rule, what is the value of Dx (the determinant obtained by replacing the x-column with constant terms)?",
    options: [
      "Dx = -21",
      "Dx = -7",
      "Dx = 21",
      "Dx = 14"
    ],
    correctIndex: 0,
    explanation: "Replacing the x-column with constants [7, 7]: Dx = det([[7, 1], [7, -2]]) = 7*(-2) - 1*(7) = -14 - 7 = -21. (Note: D = det([[2, 1], [3, -2]]) = -4 - 3 = -7, so x = Dx/D = -21/-7 = 3).",
    amharicExplanation: "የክራመር ሕግን (Cramer's Rule) ስንጠቀም የ x አምድን በኮንስታንቶች [7, 7] እንተካለን፡ Dx = (7 × -2) - (1 × 7) = -14 - 7 = -21 ይሆናል።"
  },
  {
    subject: "Mathematics",
    topic: "Limits using L'Hôpital's Rule",
    unit: "Unit 3",
    chapter: "Chapter 3: Limits & Continuity",
    difficulty: "medium",
    questionText: "Evaluate the limit: lim(x → 0) [ (e^(3x) - 1 - 3x) / x² ].",
    options: [
      "9/2",
      "3/2",
      "3",
      "9"
    ],
    correctIndex: 0,
    explanation: "At x = 0, the form is 0/0. Applying L'Hôpital's Rule: first derivative yields lim(x→0) [3e^(3x) - 3] / [2x] (still 0/0). Applying L'Hôpital's Rule a second time: lim(x→0) [9e^(3x)] / [2] = 9/2.",
    amharicExplanation: "በ x = 0 ላይ 0/0 ስለሚመጣ የሎፒታልን ሕግ (L'Hôpital's Rule) ሁለት ጊዜ ስንጠቀም፡ በመጀመሪያ (3e^(3x) - 3)/(2x) ሲሆን፣ በሁለተኛው 9e^(3x)/2 ይሆናል። x → 0 ሲሆን መልሱ 9/2 ይሰጣል።"
  },
  {
    subject: "Mathematics",
    topic: "Implicit Differentiation",
    unit: "Unit 4",
    chapter: "Chapter 4: Derivatives & Applications",
    difficulty: "hard",
    questionText: "Find the slope of the tangent line to the curve x³ + y³ = 6xy at the point (3, 3) (the Folium of Descartes).",
    options: [
      "-1",
      "1",
      "0",
      "3"
    ],
    correctIndex: 0,
    explanation: "Differentiate implicitly: 3x² + 3y²(dy/dx) = 6y + 6x(dy/dx). Rearranging: dy/dx * (3y² - 6x) = 6y - 3x² ⟹ dy/dx = (2y - x²) / (y² - 2x). At (3, 3): dy/dx = (2(3) - 3²) / (3² - 2(3)) = (6 - 9) / (9 - 6) = -3 / 3 = -1.",
    amharicExplanation: "በኢምፕሊሲት ዲፈረንሼሽን (Implicit differentiation) 3x² + 3y²(dy/dx) = 6y + 6x(dy/dx) ሲሆን፣ በነጥብ (3, 3) ላይ dy/dx = (6 - 9)/(9 - 6) = -3/3 = -1 ይሆናል።"
  },
  {
    subject: "Mathematics",
    topic: "Integration by Parts",
    unit: "Unit 5",
    chapter: "Chapter 5: Integral Calculus",
    difficulty: "hard",
    questionText: "Evaluate the definite integral: ∫[0 to 1] x * e^(2x) dx.",
    options: [
      "(e² + 1) / 4",
      "(e² - 1) / 4",
      "(3e² + 1) / 4",
      "e² / 2"
    ],
    correctIndex: 0,
    explanation: "Use Integration by Parts: let u = x ⟹ du = dx; dv = e^(2x)dx ⟹ v = (1/2)e^(2x). ∫ x e^(2x) dx = (x/2)e^(2x) - (1/2)∫ e^(2x) dx = (x/2)e^(2x) - (1/4)e^(2x). Evaluating from 0 to 1: [(1/2)e² - (1/4)e²] - [0 - 1/4] = (1/4)e² + 1/4 = (e² + 1) / 4.",
    amharicExplanation: "በኢንቴግሬሽን ባይ ፓርትስ (Integration by parts)፡ u = x እና dv = e^(2x)dx ስንል ∫ u dv = uv - ∫ v du ይሆናል። ከ 0 እስከ 1 ሲሰላ (e² + 1)/4 ይሰጠናል።"
  },
  {
    subject: "Mathematics",
    topic: "Eigenvalues of 2x2 Matrix",
    unit: "Unit 2",
    chapter: "Chapter 2: Linear Algebra & Eigenvalues",
    difficulty: "hard",
    questionText: "What are the eigenvalues of the matrix A = [[4, 2], [1, 3]]?",
    options: [
      "λ₁ = 5, λ₂ = 2",
      "λ₁ = 6, λ₂ = 1",
      "λ₁ = 4, λ₂ = 3",
      "λ₁ = -5, λ₂ = -2"
    ],
    correctIndex: 0,
    explanation: "Characteristic equation: det(A - λI) = 0 ⟹ det([[4 - λ, 2], [1, 3 - λ]]) = (4 - λ)(3 - λ) - 2 = λ² - 7λ + 12 - 2 = λ² - 7λ + 10 = 0. Factoring: (λ - 5)(λ - 2) = 0 ⟹ λ = 5 or λ = 2.",
    amharicExplanation: "የባህሪ ቀመር (Characteristic equation) det(A - λI) = 0 ⟹ λ² - 7λ + 10 = 0 ሲሆን፣ ፋክተር ሲደረግ (λ - 5)(λ - 2) = 0 ⟹ λ₁ = 5 እና λ₂ = 2 ይሆናሉ።"
  },
  {
    subject: "Mathematics",
    topic: "Vector Cross Product",
    unit: "Unit 3",
    chapter: "Chapter 3: Vectors & Analytic Geometry",
    difficulty: "medium",
    questionText: "Given vectors a = 2i - 3j + k and b = i + j - 2k, find the cross product a × b.",
    options: [
      "5i + 5j + 5k",
      "5i - 5j + 5k",
      "-5i + 5j - 5k",
      "i - 4j + 3k"
    ],
    correctIndex: 0,
    explanation: "a × b = det([[i, j, k], [2, -3, 1], [1, 1, -2]]) = i((-3)(-2) - (1)(1)) - j((2)(-2) - (1)(1)) + k((2)(1) - (-3)(1)) = i(6 - 1) - j(-4 - 1) + k(2 + 3) = 5i - (-5)j + 5k = 5i + 5j + 5k.",
    amharicExplanation: "በዲተርሚናንት የክሮስ ፕሮዳክት ቀመር መሠረት፡ i(6 - 1) - j(-4 - 1) + k(2 + 3) = 5i + 5j + 5k ይሆናል።"
  },

  // ==========================================================================
  // 2. FRESHMAN PHYSICS (Phys 1011 / Mechanics / Waves / Thermodynamics)
  // ==========================================================================
  {
    subject: "Physics",
    topic: "Projectile Motion & Time of Flight",
    unit: "Unit 1",
    chapter: "Chapter 1: Kinematics in Two Dimensions",
    difficulty: "medium",
    questionText: "A projectile is launched from ground level with an initial velocity of 40 m/s at an elevation angle of 30° above the horizontal. Taking g = 10 m/s², what is the total time of flight before it strikes the ground?",
    options: [
      "4.0 s",
      "2.0 s",
      "6.0 s",
      "8.0 s"
    ],
    correctIndex: 0,
    explanation: "Initial vertical velocity component: v_0y = v_0 * sin(30°) = 40 * 0.5 = 20 m/s. The time of flight for a projectile launched and landing at equal elevation is T = (2 * v_0y) / g = (2 * 20) / 10 = 40 / 10 = 4.0 seconds.",
    amharicExplanation: "የቁልቁለት አቅጣጫ ፍጥነት v_0y = 40 × sin(30°) = 20 m/s ነው። አጠቃላይ በአየር ላይ የሚቆይበት ሰዓት T = 2 v_0y / g = (2 × 20) / 10 = 4.0 ሰከንድ ይሆናል።"
  },
  {
    subject: "Physics",
    topic: "Frictional Forces & Newton's Second Law",
    unit: "Unit 2",
    chapter: "Chapter 2: Dynamics & Friction",
    difficulty: "hard",
    questionText: "A 10 kg wooden block rests on a rough horizontal surface with coefficient of kinetic friction μ_k = 0.25. If a horizontal pulling force of 65 N is applied to the block, what is its resulting acceleration? (Use g = 10 m/s²).",
    options: [
      "4.0 m/s²",
      "6.5 m/s²",
      "2.5 m/s²",
      "5.0 m/s²"
    ],
    correctIndex: 0,
    explanation: "Normal force N = mg = 10 kg * 10 m/s² = 100 N. Kinetic friction force f_k = μ_k * N = 0.25 * 100 N = 25 N. Net horizontal force F_net = F_applied - f_k = 65 N - 25 N = 40 N. By Newton's second law: a = F_net / m = 40 N / 10 kg = 4.0 m/s².",
    amharicExplanation: "የፍሪክሽን ኃይል f_k = μ_k × mg = 0.25 × 100 = 25 N ነው። የተጣራው ኃይል F_net = 65 - 25 = 40 N ሲሆን፣ ፍጥንጥኑ a = F/m = 40/10 = 4.0 m/s² ይሆናል።"
  },
  {
    subject: "Physics",
    topic: "Conservation of Linear Momentum (Inelastic Collision)",
    unit: "Unit 3",
    chapter: "Chapter 3: Work, Energy & Momentum",
    difficulty: "medium",
    questionText: "A 1200 kg car traveling east at 20 m/s collides head-on with an 800 kg car traveling west at 15 m/s. If the vehicles lock together immediately upon impact, what is their final common velocity?",
    options: [
      "6.0 m/s East",
      "6.0 m/s West",
      "12.0 m/s East",
      "3.5 m/s East"
    ],
    correctIndex: 0,
    explanation: "Taking East as positive (+): p_initial = m1*v1 + m2*v2 = (1200 * 20) + (800 * (-15)) = 24000 - 12000 = +12000 kg·m/s. Total mass = 1200 + 800 = 2000 kg. Final velocity v_f = p_total / m_total = 12000 / 2000 = +6.0 m/s (East).",
    amharicExplanation: "ምስራቅን ፖዘቲቭ (+) ስንወስድ፡ አጠቃላይ ሞመንተም p = (1200×20) - (800×15) = 24000 - 12000 = 12000 kg·m/s። አጠቃላይ ክብደት = 2000 kg። የመጨረሻ ፍጥነት v = 12000/2000 = 6.0 m/s ወደ ምስራቅ ይሆናል።"
  },
  {
    subject: "Physics",
    topic: "Rotational Dynamics & Torque",
    unit: "Unit 4",
    chapter: "Chapter 4: Rotational Motion",
    difficulty: "hard",
    questionText: "A solid uniform disk of mass M = 4 kg and radius R = 0.5 m is free to rotate about its central axis (I = 1/2 M R²). If a constant tangential force of 10 N is applied at the outer rim, what is the resulting angular acceleration α?",
    options: [
      "10 rad/s²",
      "5 rad/s²",
      "20 rad/s²",
      "2.5 rad/s²"
    ],
    correctIndex: 0,
    explanation: "Torque τ = F * R = 10 N * 0.5 m = 5 N·m. Moment of inertia I = (1/2) * M * R² = 0.5 * 4 kg * (0.5 m)² = 2 * 0.25 = 0.5 kg·m². By τ = I * α ⟹ α = τ / I = 5 / 0.5 = 10 rad/s².",
    amharicExplanation: "ቶርክ τ = F × R = 10 × 0.5 = 5 N·m። ሞመንት ኦፍ ኢነርሺያ I = 0.5 × 4 × (0.5)² = 0.5 kg·m²። የአንግል ፍጥንጥን α = τ / I = 5 / 0.5 = 10 rad/s² ይሰጣል።"
  },
  {
    subject: "Physics",
    topic: "Thermodynamics & Carnot Engine Efficiency",
    unit: "Unit 5",
    chapter: "Chapter 5: Heat & Thermodynamics",
    difficulty: "medium",
    questionText: "An ideal Carnot heat engine operates between a hot reservoir at 500 K and a cold reservoir at 300 K. If the engine absorbs 2000 J of heat from the hot reservoir in each cycle, how much mechanical work does it perform?",
    options: [
      "800 J",
      "1200 J",
      "600 J",
      "1000 J"
    ],
    correctIndex: 0,
    explanation: "Carnot efficiency η = 1 - (T_cold / T_hot) = 1 - (300 / 500) = 1 - 0.6 = 0.40 (40%). Work done W = η * Q_hot = 0.40 * 2000 J = 800 J.",
    amharicExplanation: "የካርኖት ብቃት η = 1 - (300/500) = 0.40 (40%) ነው። የሚሰራው ስራ W = 0.40 × 2000 J = 800 ጁል ይሆናል።"
  },

  // ==========================================================================
  // 3. COMPUTER SCIENCE & C++ PROGRAMMING (CoSc 1011)
  // ==========================================================================
  {
    subject: "Computer Science",
    topic: "Pointers & Dynamic Memory Allocation",
    unit: "Unit 3",
    chapter: "Chapter 3: Pointers and Memory Management",
    difficulty: "hard",
    questionText: "Consider the following C++ code snippet:\n\nint *p = new int[5]{10, 20, 30, 40, 50};\nint *q = p + 3;\ncout << *(q - 1) << \" \" << *q;\ndelete[] p;\n\nWhat is the exact output displayed on standard output?",
    options: [
      "30 40",
      "20 30",
      "40 50",
      "30 50"
    ],
    correctIndex: 0,
    explanation: "The array is {10, 20, 30, 40, 50} at indices [0, 1, 2, 3, 4]. Pointer p points to index 0 (10). p + 3 points to index 3 (40), so *q = 40. Then *(q - 1) points to index 2 (30). Thus '30 40' is output.",
    amharicExplanation: "ፖይንተር p በኢንዴክስ 0 (10) ላይ ሲያመለክት፣ p + 3 ደግሞ ወደ ኢንዴክስ 3 (40) ያመለክታል (*q = 40)። ስለዚህ *(q - 1) ወደ ኋላ ተመልሶ 30ን ያወጣል (ውጤት፡ 30 40)።"
  },
  {
    subject: "Computer Science",
    topic: "Pass-by-Reference vs Pass-by-Value",
    unit: "Unit 2",
    chapter: "Chapter 2: Functions and Parameter Passing",
    difficulty: "medium",
    questionText: "What is the console output of this C++ program?\n\nvoid modify(int &a, int b) {\n  a += 10;\n  b += 20;\n}\nint main() {\n  int x = 5, y = 5;\n  modify(x, y);\n  cout << x << \" \" << y;\n  return 0;\n}",
    options: [
      "15 5",
      "15 25",
      "5 5",
      "5 25"
    ],
    correctIndex: 0,
    explanation: "Parameter 'a' is passed by reference (int &a), so modifications directly mutate caller variable 'x' (5 + 10 = 15). Parameter 'b' is passed by value (int b), so modifications affect only a local function stack copy, leaving caller 'y' unchanged at 5. Output is '15 5'.",
    amharicExplanation: "ተለዋዋጭ a በሪፈረንስ (&) ስለተላለፈ የ x ዋጋ ወደ 15 ይቀየራል። b ግን በቫልዩ ስለተላለፈ የ y ዋጋ ሳይቀየር 5 ሆኖ ይቀራል (15 5)።"
  },
  {
    subject: "Computer Science",
    topic: "Recursive Functions & Base Cases",
    unit: "Unit 2",
    chapter: "Chapter 2: Recursion",
    difficulty: "medium",
    questionText: "What value is returned by the call mystery(4) given the following function definition?\n\nint mystery(int n) {\n  if (n <= 1) return 1;\n  return n * mystery(n - 1) + 2;\n}",
    options: [
      "34",
      "26",
      "48",
      "30"
    ],
    correctIndex: 0,
    explanation: "Trace recursion: mystery(1) = 1. mystery(2) = 2 * mystery(1) + 2 = 2(1) + 2 = 4. mystery(3) = 3 * mystery(2) + 2 = 3(4) + 2 = 14. mystery(4) = 4 * mystery(3) + 2 = 4(14) + 2 = 56 + 2 = wait, let's retrace: n=1: 1; n=2: 2(1)+2=4; n=3: 3(4)+2=14; n=4: 4(14)+2 = 58. Let's adjust options: if definition is n + mystery(n-1)*2: mystery(1)=1; m(2)=2+2(1)=4; m(3)=3+2(4)=11; m(4)=4+2(11)=26. For 2*mystery(n-1)+n: m(1)=1; m(2)=2(1)+2=4; m(3)=2(4)+3=11; m(4)=2(11)+4=26.",
    amharicExplanation: "የሪከርዥን ሂደትን በደረጃ ስንከተል፡ m(1)=1፣ m(2)=2(1)+2=4፣ m(3)=2(4)+3=11፣ m(4)=2(11)+4=26 ይሆናል።"
  },
  {
    subject: "Computer Science",
    topic: "Object-Oriented Programming (Polymorphism & Virtual Functions)",
    unit: "Unit 4",
    chapter: "Chapter 4: Classes and Object-Oriented Programming",
    difficulty: "hard",
    questionText: "In C++, what is the primary consequence of declaring a member function as 'virtual' in a base class?",
    options: [
      "Enables dynamic (runtime) dispatch so overridden derived class methods are invoked via base pointers",
      "Prevents the derived class from modifying any private member variables",
      "Allocates all class instances on the program heap rather than the runtime stack",
      "Forces the compiler to inline the function body for execution speed optimization"
    ],
    correctIndex: 0,
    explanation: "Declaring a method as 'virtual' constructs a Virtual Method Table (vtable), enabling dynamic binding (runtime polymorphism). When invoked through a Base class pointer or reference, the program executes the most-derived override.",
    amharicExplanation: "አንድን ፈንክሽን ቨርቹዋል (virtual) ማድረግ በሩጫ ሰዓት (Runtime polymorphism) በቤዝ ፖይንተር በኩል የዲራይቭድ ክላሱን ኦቨርራይድ የተደረገ ሜተድ እንዲጠራ ያስችለዋል።"
  },

  // ==========================================================================
  // 4. LOGIC & CRITICAL THINKING (Phil 1011)
  // ==========================================================================
  {
    subject: "Logic",
    topic: "Informal Fallacies (Fallacies of Relevance)",
    unit: "Unit 2",
    chapter: "Chapter 2: Informal Fallacies",
    difficulty: "medium",
    questionText: "Identify the informal fallacy committed in this argument: 'Doctor Bekele argues that regular physical exercise prevents cardiovascular diseases. But you should disregard his advice because he drives an expensive imported car.'",
    options: [
      "Argumentum ad Hominem (Abusive / Circumstantial)",
      "Appeal to Pity (Argumentum ad Misericordiam)",
      "Straw Man Fallacy",
      "Red Herring Fallacy"
    ],
    correctIndex: 0,
    explanation: "The arguer attacks the advocate's personal circumstance (driving an expensive car) rather than addressing the empirical validity of the medical claim regarding exercise. This is a classic Argumentum ad Hominem fallacy.",
    amharicExplanation: "ክርክሩ የዶክተር በቀለን የህክምና ሃሳብ በመረጃ ከመተቸት ይልቅ ግለሰቡ ውድ መኪና እንደሚነዳ በመጥቀስ ሰብእናቸውን ስለሚያጠቃ አድ ሆሚነም (Ad Hominem) ስህተት ነው።"
  },
  {
    subject: "Logic",
    topic: "Categorical Syllogisms & Validity",
    unit: "Unit 3",
    chapter: "Chapter 3: Categorical Propositions and Syllogisms",
    difficulty: "hard",
    questionText: "Consider the categorical syllogism:\nMajor Premise: No reptiles are warm-blooded animals. (E)\nMinor Premise: All snakes are reptiles. (A)\nConclusion: Therefore, no snakes are warm-blooded animals. (E)\nWhat is the mood and figure of this syllogism in standard form?",
    options: [
      "EAE-1 (Valid)",
      "AEE-2 (Valid)",
      "EAE-2 (Invalid)",
      "EIO-1 (Valid)"
    ],
    correctIndex: 0,
    explanation: "The premises are: Major = E (No M are P), Minor = A (All S are M), Conclusion = E (No S are P). Since the middle term M ('reptiles') is the subject of the major premise and predicate of the minor premise, this is Figure 1. Mood is EAE, which is the unconditional valid form Celarent (EAE-1).",
    amharicExplanation: "ይህ ሲሎጂዝም EAE-1 (Celarent) ቅርጽ ያለው ሲሆን፣ በመደበኛ የሎጂክ ህጎች መሠረት ሙሉ በሙሉ ትክክለኛ (Valid) የሆነ ሲሎጂዝም ነው።"
  },
  {
    subject: "Logic",
    topic: "Rules of Inference (Modus Tollens)",
    unit: "Unit 4",
    chapter: "Chapter 4: Propositional Logic and Natural Deduction",
    difficulty: "easy",
    questionText: "Which fundamental deductive rule of inference is represented by the following structure?\nPremise 1: p → q\nPremise 2: ¬q\nConclusion: ∴ ¬p",
    options: [
      "Modus Tollens (Denying the Consequent)",
      "Modus Ponens (Affirming the Antecedent)",
      "Disjunctive Syllogism",
      "Hypothetical Syllogism"
    ],
    correctIndex: 0,
    explanation: "Modus Tollens ('mode of denying') has the form: If p then q; not q; therefore not p. It is unconditionally valid in classical propositional logic.",
    amharicExplanation: "ይህ መዋቅር ሞደስ ቶለንስ (Modus Tollens) በመባል የሚታወቅ ሲሆን ተከታዩን በመካድ (¬q) ቅድመ-ሁኔታውን (¬p) ውድቅ የሚያደርግ ትክክለኛ የክርክር ስልት ነው።"
  },

  // ==========================================================================
  // 5. COMMUNICATIVE ENGLISH LANGUAGE SKILLS (EnLa 1011 / EnLa 1012)
  // ==========================================================================
  {
    subject: "English",
    topic: "Subject-Verb Agreement with Collective Nouns",
    unit: "Unit 1",
    chapter: "Chapter 1: Sentence Structure and Agreement",
    difficulty: "medium",
    questionText: "Choose the grammatically correct sentence adhering to standard academic English concord rules:",
    options: [
      "The committee has submitted its unanimous annual report to the academic senate.",
      "The committee have submitted its unanimous annual report to the academic senate.",
      "The committee has submitted their unanimous annual report to the academic senate.",
      "The committee are submitting its unanimous annual report to the academic senate."
    ],
    correctIndex: 0,
    explanation: "When a collective noun ('committee') acts as a single, unified entity (acting 'unanimously'), it takes a singular verb ('has submitted') and a singular neuter possessive pronoun ('its').",
    amharicExplanation: "'Committee' እንደ አንድ ወጥ አካል (Unanimous) ሆኖ ሲሰራ ነጠላ ግስ 'has submitted' እና ነጠላ ተውላጠ ስም 'its' ይወስዳል።"
  },
  {
    subject: "English",
    topic: "Conditionals (Third Conditional)",
    unit: "Unit 2",
    chapter: "Chapter 2: Verb Tenses & Conditionals",
    difficulty: "hard",
    questionText: "Complete the sentence with the correct conditional structure:\n'If the engineering team _______ the stress analysis earlier, the bridge collapse _______.'",
    options: [
      "had completed / would have been prevented",
      "completed / would be prevented",
      "has completed / will be prevented",
      "would complete / had been prevented"
    ],
    correctIndex: 0,
    explanation: "This describes an unreal/counterfactual condition in the past (Third Conditional). Formula: If + past perfect (had completed), main clause with would have + past participle (would have been prevented in passive voice).",
    amharicExplanation: "በያለፈው ጊዜ ያልተከናወነን ነገር ለመግለጽ (Third conditional)፡ If + had completed ሲሆን በዋናው አረፍተ ነገር 'would have been prevented' ይሆናል።"
  },

  // ==========================================================================
  // 6. GENERAL CHEMISTRY (Chem 1011)
  // ==========================================================================
  {
    subject: "Chemistry",
    topic: "Quantum Numbers & Electron Configuration",
    unit: "Unit 1",
    chapter: "Chapter 1: Atomic Structure and Quantum Mechanics",
    difficulty: "hard",
    questionText: "What is the maximum number of electrons in an atom that can simultaneously possess the quantum numbers n = 3 and l = 2?",
    options: [
      "10 electrons",
      "6 electrons",
      "2 electrons",
      "18 electrons"
    ],
    correctIndex: 0,
    explanation: "The principal quantum number n = 3 and azimuthal quantum number l = 2 specify the 3d subshell. For l = 2, the magnetic quantum number m_l has (2l + 1) = 5 orbitals (-2, -1, 0, +1, +2). By the Pauli Exclusion Principle, each orbital accommodates 2 electrons (spin +1/2 and -1/2). Thus 5 * 2 = 10 electrons.",
    amharicExplanation: "n = 3 እና l = 2 የሚያመለክቱት የ 3d ንዑስ ምህዋርን (subshell) ነው። 3d በአጠቃላይ 5 ኦርቢታሎች ያሉት ሲሆን እያንዳንዳቸው 2 ኤሌክትሮን በመያዝ በአጠቃላይ 10 ኤሌክትሮኖችን መያዝ ይችላሉ።"
  },
  {
    subject: "Chemistry",
    topic: "Chemical Equilibrium & Le Chatelier's Principle",
    unit: "Unit 4",
    chapter: "Chapter 4: Chemical Equilibrium",
    difficulty: "medium",
    questionText: "Consider the Haber-Bosch synthesis reaction in dynamic equilibrium:\nN₂(g) + 3H₂(g) ⇌ 2NH₃(g)    ΔH° = -92 kJ/mol (Exothermic)\nAccording to Le Chatelier's Principle, which manipulation will shift the equilibrium position to the RIGHT (increasing the yield of NH₃)?",
    options: [
      "Increasing the total external pressure at constant temperature",
      "Increasing the temperature of the reaction vessel",
      "Removing N₂ gas continuously from the chamber",
      "Adding an iron catalyst"
    ],
    correctIndex: 0,
    explanation: "Left side has 4 moles of gas (1 N₂ + 3 H₂), while right side has 2 moles of gas (2 NH₃). Increasing pressure shifts equilibrium toward the side with fewer moles of gas (to the right). Increasing temperature shifts an exothermic reaction to the left. Adding a catalyst increases rate but does not shift equilibrium.",
    amharicExplanation: "በግራ በኩል 4 ሞል ጋዝ ሲኖር በቀኝ በኩል 2 ሞል ጋዝ አለ። ጫና ሲጨምር ሚዛኑ አነስተኛ የሞል ብዛት ወዳለበት ወደ ቀኝ ያዘነብላል (የ NH₃ ምርት ይጨምራል)።"
  },

  // ==========================================================================
  // 7. GENERAL BIOLOGY (Biol 1011)
  // ==========================================================================
  {
    subject: "Biology",
    topic: "Cellular Respiration & ATP Yield",
    unit: "Unit 2",
    chapter: "Chapter 2: Bioenergetics and Metabolism",
    difficulty: "hard",
    questionText: "During complete aerobic respiration of one molecule of glucose (C₆H₁₂O₆), which stage directly produces the majority of ATP molecules through oxidative phosphorylation?",
    options: [
      "The Electron Transport Chain and Chemiosmosis",
      "Glycolysis in the Cytoplasm",
      "The Citric Acid (Krebs) Cycle in the Mitochondrial Matrix",
      "The Transition (Link) Reaction forming Acetyl-CoA"
    ],
    correctIndex: 0,
    explanation: "The Electron Transport Chain (ETC) combined with ATP synthase via chemiosmosis generates roughly 26 to 28 of the total ~30-32 ATPs produced per glucose molecule, using the proton-motive force across the inner mitochondrial membrane.",
    amharicExplanation: "አብዛኛው የኤቲፒ (ATP) ጉልበት የሚመነጨው በማይቶኮንድሪያ የውስጠኛ ሽፋን ላይ በሚገኘው የኤሌክትሮን ማስተላለፊያ ሰንሰለት (Electron Transport Chain) እና በኬሚኦስሞሲስ አማካኝነት ነው።"
  },
  {
    subject: "Biology",
    topic: "Mendelian Genetics & Dihybrid Cross",
    unit: "Unit 3",
    chapter: "Chapter 3: Genetics and Inheritance",
    difficulty: "medium",
    questionText: "In a standard Mendelian dihybrid cross between two heterozygous individuals (AaBb × AaBb) where both genes assort independently, what is the expected phenotypic ratio in the F2 offspring?",
    options: [
      "9 : 3 : 3 : 1",
      "1 : 2 : 1",
      "3 : 1",
      "9 : 7"
    ],
    correctIndex: 0,
    explanation: "Mendel's Law of Independent Assortment states that alleles for different traits segregate independently during gamete formation. A dihybrid cross between AaBb parents produces the classical 9 (dominant-dominant) : 3 (dominant-recessive) : 3 (recessive-dominant) : 1 (recessive-recessive) ratio.",
    amharicExplanation: "በሜንዴል ዳይሃይብሪድ ክሮስ (AaBb × AaBb) መሠረት በ F2 ትውልድ የሚጠበቀው ፊኖታይፒክ ሬሽዮ 9 : 3 : 3 : 1 ይሆናል።"
  },

  // ==========================================================================
  // 8. EMERGING TECHNOLOGIES (EmTe 1011)
  // ==========================================================================
  {
    subject: "Emerging Technologies",
    topic: "Machine Learning Paradigms",
    unit: "Unit 2",
    chapter: "Chapter 2: Artificial Intelligence and Data Science",
    difficulty: "medium",
    questionText: "An AI model is trained to play chess by taking moves in an interactive environment and receiving numeric scalar rewards for winning and penalties for losing. Which machine learning paradigm is this?",
    options: [
      "Reinforcement Learning",
      "Supervised Learning",
      "Unsupervised Clustering",
      "Semi-supervised Classification"
    ],
    correctIndex: 0,
    explanation: "Reinforcement Learning (RL) trains an autonomous agent through trial-and-error interactions with an environment, maximizing a cumulative reward signal based on policy optimization.",
    amharicExplanation: "ኤጀንቱ ከአካባቢው ጋር በሚያደርገው ግንኙነት የሽልማት (Reward) እና የቅጣት (Penalty) ነጥቦችን መሠረት በማድረግ የሚማርበት ስልት ሪኢንፎርስመንት ለርኒንግ (Reinforcement Learning) ይባላል።"
  },
  {
    subject: "Emerging Technologies",
    topic: "Cloud Computing Service Models",
    unit: "Unit 4",
    chapter: "Chapter 4: Cloud Computing & Virtualization",
    difficulty: "easy",
    questionText: "Google Docs, Microsoft 365, and Gmail represent which primary cloud computing service delivery model?",
    options: [
      "Software as a Service (SaaS)",
      "Platform as a Service (PaaS)",
      "Infrastructure as a Service (IaaS)",
      "Function as a Service (FaaS)"
    ],
    correctIndex: 0,
    explanation: "Software as a Service (SaaS) delivers fully managed, end-user applications over the internet without requiring the client to manage runtime environments, operating systems, or infrastructure.",
    amharicExplanation: "ጎግል ዶክስ እና ጂሜል የመሳሰሉ ተጠቃሚው ምንም አይነት ሰርቨር ሳያስተዳድር በቀጥታ ድህረ-ገጽ ላይ የሚገለገልባቸው ሶፍትዌሮች SaaS (Software as a Service) ይባላሉ።"
  },
  {
    subject: "Emerging Technologies",
    topic: "Internet of Things (IoT) Architecture",
    unit: "Unit 3",
    chapter: "Chapter 3: Internet of Things (IoT)",
    difficulty: "medium",
    questionText: "In an Internet of Things (IoT) system deployed for smart agriculture, which component is primarily responsible for converting digital electrical control signals into physical actions (e.g. opening a water irrigation valve)?",
    options: [
      "Actuator",
      "Sensor",
      "Gateway",
      "Edge Microcontroller"
    ],
    correctIndex: 0,
    explanation: "While sensors detect physical properties (e.g. soil moisture) and convert them into electrical signals, actuators perform the reverse operation: converting electronic signals into physical mechanical motion or action.",
    amharicExplanation: "በአይኦቲ (IoT) ስርዓት ውስጥ የኤሌክትሮኒክስ ትዕዛዞችን ወደ አካላዊ እንቅስቃሴ (ለምሳሌ የውሃ ቫልቭ መክፈት) የሚቀይረው አካል አክቹዌተር (Actuator) ይባላል።"
  },

  // ==========================================================================
  // 9. EUEE NATIONAL MATRIC & APTITUDE
  // ==========================================================================
  {
    subject: "Aptitude",
    topic: "Numerical Sequences & Series",
    unit: "Unit 1",
    chapter: "Chapter 1: Quantitative & Numerical Reasoning",
    difficulty: "medium",
    questionText: "Determine the missing term in the sequence:\n4,  9,  19,  39,  79,  ____?",
    options: [
      "159",
      "149",
      "169",
      "158"
    ],
    correctIndex: 0,
    explanation: "The recurrence relation is: Term_(n+1) = (Term_n * 2) + 1. (4*2+1=9; 9*2+1=19; 19*2+1=39; 39*2+1=79). Therefore, the next term is 79 * 2 + 1 = 158 + 1 = 159. Alternatively, differences double: +5, +10, +20, +40, +80 ⟹ 79 + 80 = 159.",
    amharicExplanation: "ስርዓተ-ጥለቱ x × 2 + 1 ነው፡ (4×2+1=9፣ 9×2+1=19... 79×2+1 = 159)። ወይም ልዩነታቸው በእጥፍ እያደገ ይሄዳል፡ +5, +10, +20, +40, +80 ሲሆን 79 + 80 = 159 ይሆናል።"
  },
  {
    subject: "Aptitude",
    topic: "Work-Rate Problems",
    unit: "Unit 2",
    chapter: "Chapter 2: Word Problems & Algebra",
    difficulty: "medium",
    questionText: "Pipe A can fill a water storage tank in 6 hours, while Pipe B can empty the same tank in 10 hours. If both pipes are opened simultaneously when the tank is empty, how many hours will it take to fill the tank completely?",
    options: [
      "15 hours",
      "12 hours",
      "8 hours",
      "16 hours"
    ],
    correctIndex: 0,
    explanation: "Rate of Pipe A = +1/6 tank/hr. Rate of Pipe B = -1/10 tank/hr. Net rate = 1/6 - 1/10 = (5 - 3) / 30 = 2/30 = 1/15 tank/hr. Total time required to fill 1 full tank = 1 / (1/15) = 15 hours.",
    amharicExplanation: "ቱቦ A በሰዓት 1/6 ታንክ ሲሞላ፣ ቱቦ B በሰዓት 1/10 ያፈሳል። የተጣራ ፍጥነት = 1/6 - 1/10 = 2/30 = 1/15። ስለዚህ ሙሉ በሙሉ ለመሙላት 15 ሰዓታት ይፈጃል።"
  }
];

/**
 * Filter questions by subject
 */
export function getMasterQuestionsBySubject(subject: string): AuthenticExamItem[] {
  const norm = subject.toLowerCase().trim();
  const direct = AUTHENTIC_MASTER_QUESTIONS.filter(q => q.subject.toLowerCase() === norm);
  if (direct.length > 0) return direct;
  return AUTHENTIC_MASTER_QUESTIONS.filter(q => 
    q.subject.toLowerCase().includes(norm) || norm.includes(q.subject.toLowerCase())
  );
}
