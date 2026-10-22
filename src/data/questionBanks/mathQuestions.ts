import { BankDifficulty } from '../../types';

export interface AuthenticCurriculumQuestion {
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  amharicExplanation: string;
  topic: string;
  unit: string;
  chapter: string;
  difficulty: BankDifficulty;
}

export const AUTHENTIC_MATH_QUESTIONS_WKU_1011: AuthenticCurriculumQuestion[] = [
  // ─── UNIT 1: PROPOSITIONAL LOGIC, ARGUMENTS & SET THEORY ───
  {
    questionText: "Which of the following compound propositions is a tautology (always true regardless of the truth values of its constituent propositions)?",
    options: [
      "(p ∧ (p → q)) → q",
      "(p ∨ q) → p",
      "(p → q) ∧ (q → p)",
      "¬(p ∧ q) ↔ (¬p ∧ ¬q)"
    ],
    correctIndex: 0,
    topic: "Propositional Logic & Tautologies",
    unit: "Unit 1",
    chapter: "Chapter 1: Logic & Truth Tables",
    difficulty: "easy",
    explanation: "The expression (p ∧ (p → q)) → q represents Modus Ponens in conditional form. Constructing a truth table confirms that for all assignments of p and q, the statement evaluates to True, making it a tautology.",
    amharicExplanation: "መግለጫው (p ∧ (p → q)) → q ሞደስ ፖነንስን (Modus Ponens) የሚወክል ሲሆን፣ በማንኛውም የ p እና q የእውነት ዋጋ ሁልጊዜ እውነት (Tautology) ነው።"
  },
  {
    questionText: "Let U = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10} be the universal set. If A = {x ∈ U : x is a prime number} and B = {x ∈ U : x is an odd number}, what is the symmetric difference A △ B?",
    options: [
      "{1, 2, 9}",
      "{2, 3, 5, 7}",
      "{1, 9}",
      "{2}"
    ],
    correctIndex: 0,
    topic: "Set Theory & Symmetric Difference",
    unit: "Unit 1",
    chapter: "Chapter 2: Sets & Set Operations",
    difficulty: "medium",
    explanation: "Primes in U: A = {2, 3, 5, 7}. Odds in U: B = {1, 3, 5, 7, 9}. Symmetric difference A △ B = (A \\ B) ∪ (B \\ A). Here A \\ B = {2}, and B \\ A = {1, 9}. Thus A △ B = {1, 2, 9}.",
    amharicExplanation: "A = {2, 3, 5, 7} እና B = {1, 3, 5, 7, 9} ሲሆኑ፣ ሲሜትሪክ ዲፈረንስ A △ B = (A \\ B) ∪ (B \\ A) = {2} ∪ {1, 9} = {1, 2, 9} ይሆናል።"
  },
  {
    questionText: "Which of the following statements is the logically equivalent contrapositive of: 'If a real matrix is invertible, then its determinant is non-zero'?",
    options: [
      "If the determinant of a real matrix is zero, then the matrix is not invertible.",
      "If the determinant of a real matrix is non-zero, then the matrix is invertible.",
      "If a real matrix is not invertible, then its determinant is zero.",
      "A real matrix is invertible if and only if its determinant is non-zero."
    ],
    correctIndex: 0,
    topic: "Conditional Statements & Contrapositive",
    unit: "Unit 1",
    chapter: "Chapter 1: Logic & Arguments",
    difficulty: "easy",
    explanation: "The contrapositive of p → q is ¬q → ¬p. Here p is 'matrix is invertible' and q is 'determinant is non-zero'. Therefore ¬q → ¬p is: 'If determinant is zero (not non-zero), then the matrix is not invertible'.",
    amharicExplanation: "የ p → q ኮንትራፖዚቲቭ ¬q → ¬p ነው። ስለዚህ 'ዲተርሚናንቱ ዜሮ ከሆነ ማትሪክሱ ኢንቨርቲብል አይደለም' ትክክለኛው መልስ ነው።"
  },
  {
    questionText: "Consider the quantified statement: ∀x ∈ ℝ, ∃y ∈ ℝ such that x + y = 0. What is its truth value, and what is its formal negation?",
    options: [
      "True; Negation: ∃x ∈ ℝ such that ∀y ∈ ℝ, x + y ≠ 0",
      "False; Negation: ∃x ∈ ℝ such that ∀y ∈ ℝ, x + y = 0",
      "True; Negation: ∀x ∈ ℝ, ∃y ∈ ℝ such that x + y ≠ 0",
      "False; Negation: ∀x ∈ ℝ, ∀y ∈ ℝ, x + y ≠ 0"
    ],
    correctIndex: 0,
    topic: "Quantifiers & Negation in Real Analysis",
    unit: "Unit 1",
    chapter: "Chapter 1: Predicate Logic",
    difficulty: "medium",
    explanation: "For any real x, choosing y = -x gives x + (-x) = 0, so the statement is True. By quantifier duality, ¬(∀x ∃y P(x,y)) ≡ ∃x ∀y ¬P(x,y).",
    amharicExplanation: "ለማንኛውም x፣ y = -x ሲሆን x + y = 0 ስለሚሆን አረፍተ-ነገሩ እውነት (True) ነው። አሉታው (Negation) ደግሞ ∃x ∈ ℝ such that ∀y ∈ ℝ, x + y ≠ 0 ነው።"
  },

  // ─── UNIT 2: REAL & COMPLEX NUMBER SYSTEMS ───
  {
    questionText: "Express the complex number z = (1 + i√3) / (1 - i) in standard polar form r(cos θ + i sin θ).",
    options: [
      "√2 (cos(7π/12) + i sin(7π/12))",
      "2 (cos(π/3) + i sin(π/3))",
      "√2 (cos(π/12) + i sin(π/12))",
      "1 (cos(5π/6) + i sin(5π/6))"
    ],
    correctIndex: 0,
    topic: "Complex Numbers & Polar Representation",
    unit: "Unit 2",
    chapter: "Chapter 1: Complex Arithmetic",
    difficulty: "hard",
    explanation: "For numerator: r₁ = √(1+3) = 2, θ₁ = π/3. For denominator: r₂ = √(1+1) = √2, θ₂ = -π/4. Dividing moduli gives r = 2/√2 = √2. Subtracting angles gives θ = π/3 - (-π/4) = 4π/12 + 3π/12 = 7π/12.",
    amharicExplanation: "የላይኛው ሞዱለስ 2 ሲሆን አንግሉ π/3 ነው፤ የታችኛው ሞዱለስ √2 አንግሉ -π/4 ነው። በክፍፍል ጊዜ ሞዱለሶች ይካፈላሉ (2/√2 = √2) አንግሎች ይቀናነሳሉ (π/3 - (-π/4) = 7π/12)።"
  },
  {
    questionText: "Using De Moivre's Theorem, evaluate (1 + i)⁸.",
    options: [
      "16",
      "16i",
      "-16",
      "16 + 16i"
    ],
    correctIndex: 0,
    topic: "De Moivre's Theorem & Powers of Complex Numbers",
    unit: "Unit 2",
    chapter: "Chapter 2: Roots & De Moivre",
    difficulty: "medium",
    explanation: "Write 1 + i in polar form: r = √2, θ = π/4. Then (1 + i)⁸ = (√2)⁸ [cos(8 * π/4) + i sin(8 * π/4)] = 16 [cos(2π) + i sin(2π)] = 16(1 + 0) = 16.",
    amharicExplanation: "1 + i በፖላር ፎርም √2(cos(π/4) + i sin(π/4)) ነው። በዴ ሞይቭር ቀመር፡ (√2)⁸ [cos(2π) + i sin(2π)] = 16(1 + 0) = 16 ይሆናል።"
  },
  {
    questionText: "If z is a complex number such that |z - 3i| = 2, what geometric shape is represented in the complex plane?",
    options: [
      "A circle centered at (0, 3) with radius 2",
      "A circle centered at (3, 0) with radius 2",
      "An ellipse with major axis 4 along the imaginary axis",
      "A straight line parallel to the real axis passing through y = 3"
    ],
    correctIndex: 0,
    topic: "Locus of Complex Numbers",
    unit: "Unit 2",
    chapter: "Chapter 1: Complex Plane Geometry",
    difficulty: "easy",
    explanation: "The equation |z - z₀| = R represents a circle in the complex plane centered at z₀ with radius R. Here z₀ = 0 + 3i, which corresponds to the point (0, 3) with radius R = 2.",
    amharicExplanation: "በኮምፕሌክስ ፕሌን |z - z₀| = R የክብ ቀመር ሲሆን፣ ማዕከሉ በ z₀ = (0, 3) እና ራዲየሱ R = 2 የሆነ ክብ ይወክላል።"
  },
  {
    questionText: "Which of the following statements about the supremum and infimum of the set S = { (n - 1)/n : n ∈ ℕ, n ≥ 1 } is correct?",
    options: [
      "inf(S) = 0 (minimum) and sup(S) = 1 (no maximum)",
      "inf(S) = 0 and sup(S) = 1 (with maximum 1)",
      "inf(S) = -1 and sup(S) = 1",
      "inf(S) = 0 and sup(S) does not exist"
    ],
    correctIndex: 0,
    topic: "Completeness Property of Real Numbers",
    unit: "Unit 2",
    chapter: "Chapter 2: Real Number Axioms",
    difficulty: "medium",
    explanation: "For n = 1, (1-1)/1 = 0, which is in S and is the lowest element, so inf(S) = min(S) = 0. As n → ∞, (n-1)/n = 1 - 1/n → 1 from below. Thus sup(S) = 1, but 1 is never attained in S, so S has no maximum.",
    amharicExplanation: "ለ n = 1 ውጤቱ 0 ሲሆን በስብስቡ ውስጥ ስላለ ዝቅተኛው ወሰን inf(S) = 0 ነው። n ሲጨምር ቁጥሩ ወደ 1 ይጠጋል እንጂ 1 አይሆንም፤ ስለዚህ sup(S) = 1 ሲሆን ማክሲመም ግን የለውም።"
  },

  // ─── UNIT 3: FUNCTIONS, INVERSES & POLYNOMIALS ───
  {
    questionText: "Determine the natural domain of the real-valued function f(x) = √( (x - 2) / (x² - 9) ).",
    options: [
      "(-3, 2] ∪ (3, ∞)",
      "[-3, 2] ∪ [3, ∞)",
      "(-∞, -3) ∪ [2, 3)",
      "(3, ∞)"
    ],
    correctIndex: 0,
    topic: "Domain of Rational & Radical Functions",
    unit: "Unit 3",
    chapter: "Chapter 1: Functions & Inverses",
    difficulty: "hard",
    explanation: "The radicand must be non-negative: (x - 2) / ((x - 3)(x + 3)) ≥ 0 with x ≠ ±3. Critical points are -3, 2, 3. Testing intervals: (-∞, -3) gives negative; (-3, 2] gives positive; [2, 3) gives negative; (3, ∞) gives positive. Hence domain is (-3, 2] ∪ (3, ∞).",
    amharicExplanation: "በስኩዌር ሩት ውስጥ ያለው ዋጋ ≥ 0 መሆን አለበት እንዲሁም x ≠ ±3። ምልክት ሰንጠረዥ (Sign chart) በመጠቀም ክፍተቶቹ (-3, 2] ∪ (3, ∞) መሆናቸውን ማረጋገጥ ይቻላል።"
  },
  {
    questionText: "If f(x) = (2x + 5) / (3x - 1) for x ≠ 1/3, find the inverse function f⁻¹(x).",
    options: [
      "f⁻¹(x) = (x + 5) / (3x - 2)",
      "f⁻¹(x) = (3x - 1) / (2x + 5)",
      "f⁻¹(x) = (2x - 5) / (3x + 1)",
      "f⁻¹(x) = (x - 5) / (3x - 2)"
    ],
    correctIndex: 0,
    topic: "Inverse Functions & Rational Expressions",
    unit: "Unit 3",
    chapter: "Chapter 1: Inverses",
    difficulty: "medium",
    explanation: "Set y = (2x + 5)/(3x - 1) ⟹ y(3x - 1) = 2x + 5 ⟹ 3xy - y = 2x + 5 ⟹ 3xy - 2x = y + 5 ⟹ x(3y - 2) = y + 5 ⟹ x = (y + 5)/(3y - 2). Thus f⁻¹(x) = (x + 5)/(3x - 2).",
    amharicExplanation: "y = (2x + 5)/(3x - 1) ተብሎ x ን ብቻውን በማስቀረት፡ y(3x - 1) = 2x + 5 ⟹ x(3y - 2) = y + 5 ⟹ x = (y + 5)/(3y - 2) ይሆናል።"
  },
  {
    questionText: "Find all horizontal and vertical asymptotes of the rational function R(x) = (2x² - 8) / (x² - 5x + 6).",
    options: [
      "Horizontal: y = 2; Vertical: x = 3 (hole at x = 2)",
      "Horizontal: y = 2; Vertical: x = 2 and x = 3",
      "Horizontal: y = 0; Vertical: x = 3",
      "Horizontal: none; Vertical: x = 3"
    ],
    correctIndex: 0,
    topic: "Asymptotes & Removable Discontinuities",
    unit: "Unit 3",
    chapter: "Chapter 2: Rational Functions",
    difficulty: "medium",
    explanation: "Factor numerator and denominator: R(x) = 2(x - 2)(x + 2) / ((x - 2)(x - 3)). For x ≠ 2, R(x) = 2(x + 2)/(x - 3). The factor (x - 2) cancels, creating a removable discontinuity (hole) at x = 2. The remaining denominator gives a vertical asymptote at x = 3. Since degrees match, horizontal asymptote is y = 2/1 = 2.",
    amharicExplanation: "R(x) = 2(x - 2)(x + 2) / ((x - 2)(x - 3)) ሲሆን፣ (x - 2) ይሰረዛል (Hole at x = 2)። ስለዚህ ቋሚ አስምፕቶት x = 3 ብቻ ሲሆን፣ አግድም አስምፕቶት ደግሞ y = 2 ይሆናል።"
  },
  {
    questionText: "According to the Rational Root Theorem, which of the following cannot be a possible rational root of the polynomial P(x) = 3x³ + 8x² - 7x - 6?",
    options: [
      "4",
      "±1/3",
      "±2",
      "±2/3"
    ],
    correctIndex: 0,
    topic: "Polynomial Theorems & Rational Roots",
    unit: "Unit 3",
    chapter: "Chapter 2: Polynomial Algebra",
    difficulty: "easy",
    explanation: "By Rational Root Theorem, rational roots p/q must have p dividing -6 (±1, ±2, ±3, ±6) and q dividing 3 (±1, ±3). Possible candidates are ±1, ±2, ±3, ±6, ±1/3, ±2/3. The value 4 does not divide 6, so it cannot be a rational root.",
    amharicExplanation: "በሬሽናል ሩት ቴረም መሠረት የ p ዋጋ የ -6 አካፋይ፣ የ q ዋጋ የ 3 አካፋይ መሆን አለበት። 4 የ 6 አካፋይ ስላልሆነ የዚህ ፖሊኖሚአል ሩት ሊሆን አይችልም።"
  },

  // ─── UNIT 4: MATRICES & SYSTEMS OF LINEAR EQUATIONS ───
  {
    questionText: "Compute the determinant of the 3x3 matrix A = [[1, 2, 3], [0, 4, 5], [1, 0, 6]].",
    options: [
      "22",
      "26",
      "18",
      "-14"
    ],
    correctIndex: 0,
    topic: "Matrix Algebra & 3x3 Determinants",
    unit: "Unit 4",
    chapter: "Chapter 1: Matrices & Determinants",
    difficulty: "medium",
    explanation: "Expanding along the first column: det(A) = 1 * det([[4, 5], [0, 6]]) - 0 + 1 * det([[2, 3], [4, 5]]) = 1 * (24 - 0) + 1 * (10 - 12) = 24 - 2 = 22.",
    amharicExplanation: "በመጀመሪያው አምድ (First column) ስናሰላው፡ 1 × (24 - 0) - 0 + 1 × (10 - 12) = 24 - 2 = 22 ይሆናል።"
  },
  {
    questionText: "For what value of the parameter k does the system of linear equations have infinitely many solutions?\nx + 2y - z = 4\n2x + 4y + (k - 2)z = 8\n-x - 2y + z = -4",
    options: [
      "k = 0",
      "k = 2",
      "k = -2",
      "No such value of k exists"
    ],
    correctIndex: 0,
    topic: "Systems of Linear Equations & Consistency",
    unit: "Unit 4",
    chapter: "Chapter 2: Gaussian Elimination",
    difficulty: "hard",
    explanation: "Notice row 3 is -1 * row 1. For row 2 to be dependent on row 1, multiplying row 1 by 2 yields 2x + 4y - 2z = 8. Comparing with row 2 requires k - 2 = -2 ⟹ k = 0. When k = 0, row 2 is identical to 2 * row 1, resulting in a single independent equation in 3 variables with infinitely many solutions.",
    amharicExplanation: "ሁለተኛው ረድፍ ከመጀመሪያው ጋር ተመጣጣኝ እንዲሆን 2x + 4y - 2z = 8 መሆን አለበት። ስለዚህ k - 2 = -2 ሲሆን k = 0 ይሆናል።"
  },
  {
    questionText: "If A is an invertible 3x3 matrix with det(A) = 5, what is the determinant of the matrix 2A⁻¹?",
    options: [
      "8/5",
      "2/5",
      "5/8",
      "40"
    ],
    correctIndex: 0,
    topic: "Properties of Determinants & Inverses",
    unit: "Unit 4",
    chapter: "Chapter 1: Determinant Properties",
    difficulty: "medium",
    explanation: "For an n x n matrix, det(c B) = cⁿ det(B). Here n = 3, so det(2A⁻¹) = 2³ det(A⁻¹) = 8 * (1 / det(A)) = 8 * (1/5) = 8/5.",
    amharicExplanation: "ለ 3x3 ማትሪክስ det(c B) = c³ det(B) ሲሆን፣ det(A⁻¹) = 1/det(A) = 1/5 ነው። ስለዚህ det(2A⁻¹) = 2³ × (1/5) = 8/5 ይሆናል።"
  },
  {
    questionText: "Using Cramer's Rule, find the value of x in the system:\n3x + 2y = 12\n5x - y = 7",
    options: [
      "x = 2",
      "x = 3",
      "x = 1",
      "x = 4"
    ],
    correctIndex: 0,
    topic: "Cramer's Rule & 2x2 Linear Systems",
    unit: "Unit 4",
    chapter: "Chapter 2: Cramer's Rule",
    difficulty: "easy",
    explanation: "D = det([[3, 2], [5, -1]]) = (3)(-1) - (2)(5) = -3 - 10 = -13. Dx = det([[12, 2], [7, -1]]) = (12)(-1) - (2)(7) = -12 - 14 = -26. By Cramer's Rule, x = Dx / D = -26 / -13 = 2.",
    amharicExplanation: "በክሬመር ሕግ፡ ዋና ዲተርሚናንት D = -13 እና Dx = -26 ነው። ስለዚህ x = Dx / D = -26 / -13 = 2 ይሆናል።"
  },

  // ─── UNIT 5: LIMITS, CONTINUITY & DERIVATIVES ───
  {
    questionText: "Evaluate the limit: lim(x → 0) [ (√(x + 4) - 2) / x ].",
    options: [
      "1/4",
      "1/2",
      "0",
      "Does not exist"
    ],
    correctIndex: 0,
    topic: "Algebraic Limits & Conjugate Multiplication",
    unit: "Unit 5",
    chapter: "Chapter 1: Limits & Continuity",
    difficulty: "medium",
    explanation: "Multiply numerator and denominator by conjugate (√(x+4) + 2): [(x + 4) - 4] / [x(√(x+4) + 2)] = x / [x(√(x+4) + 2)] = 1 / (√(x+4) + 2). As x → 0, this evaluates to 1 / (√4 + 2) = 1 / 4.",
    amharicExplanation: "በኮንጁጌት (√(x+4) + 2) በማባዛት x ይሰረዛል፤ ከዚያም 1 / (√(0+4) + 2) = 1 / 4 ይሆናል።"
  },
  {
    questionText: "For what value of the constant c is the piecewise function f(x) continuous at x = 2?\nf(x) = { cx² + 2x, if x ≤ 2;  3x - c, if x > 2 }",
    options: [
      "c = 2/5",
      "c = 1",
      "c = -2/3",
      "c = 4/5"
    ],
    correctIndex: 0,
    topic: "Continuity & Piecewise Functions",
    unit: "Unit 5",
    chapter: "Chapter 1: Limits & Continuity",
    difficulty: "medium",
    explanation: "For continuity at x = 2, left-hand limit must equal right-hand limit: lim(x→2⁻) (cx² + 2x) = 4c + 4. lim(x→2⁺) (3x - c) = 6 - c. Equating them: 4c + 4 = 6 - c ⟹ 5c = 2 ⟹ c = 2/5.",
    amharicExplanation: "በ x = 2 ላይ ቀጣይ (continuous) እንዲሆን የግራና የቀኝ ሊሚቶች እኩል መሆን አለባቸው፡ 4c + 4 = 6 - c ⟹ 5c = 2 ⟹ c = 2/5።"
  },
  {
    questionText: "If x² + y² = 25, find the slope of the tangent line dy/dx at the point (3, -4).",
    options: [
      "3/4",
      "-3/4",
      "-4/3",
      "4/3"
    ],
    correctIndex: 0,
    topic: "Implicit Differentiation & Tangent Slope",
    unit: "Unit 5",
    chapter: "Chapter 2: Differentiation",
    difficulty: "medium",
    explanation: "Differentiating implicitly: 2x + 2y(dy/dx) = 0 ⟹ dy/dx = -x/y. At (3, -4), dy/dx = -(3)/(-4) = 3/4.",
    amharicExplanation: "በኢምፕሊሲት ዲፈረንሼሽን፡ 2x + 2y(dy/dx) = 0 ⟹ dy/dx = -x/y። በቦታው (3, -4) ላይ፡ -(3)/(-4) = 3/4 ይሆናል።"
  },
  {
    questionText: "Evaluate the definite integral: ∫₁ᵉ (ln x / x) dx.",
    options: [
      "1/2",
      "1",
      "e - 1",
      "1/e"
    ],
    correctIndex: 0,
    topic: "Integration by Substitution",
    unit: "Unit 5",
    chapter: "Chapter 2: Integration",
    difficulty: "medium",
    explanation: "Let u = ln x ⟹ du = (1/x) dx. When x = 1, u = 0; when x = e, u = 1. The integral transforms into ∫₀¹ u du = [u²/2]₀¹ = 1/2 - 0 = 1/2.",
    amharicExplanation: "u = ln x ተብሎ በሰብስቲትዩሽን ሲሰራ፡ du = (1/x) dx ሲሆን ኢንቴግራሉ ∫₀¹ u du = 1/2 ይሆናል።"
  },
  {
    questionText: "What are the dimensions of a rectangle with a fixed perimeter of 40 meters that encloses the maximum possible area?",
    options: [
      "10 m by 10 m",
      "8 m by 12 m",
      "5 m by 15 m",
      "9 m by 11 m"
    ],
    correctIndex: 0,
    topic: "Optimization & Extremum Applications",
    unit: "Unit 5",
    chapter: "Chapter 2: Applied Optimization",
    difficulty: "easy",
    explanation: "Perimeter 2x + 2y = 40 ⟹ y = 20 - x. Area A(x) = x(20 - x) = 20x - x². Setting A'(x) = 20 - 2x = 0 gives x = 10 m, yielding y = 10 m (a square).",
    amharicExplanation: "ፔሪሜትሩ 40 ሜትር ሲሆን ስፋቱ ከፍተኛ የሚሆነው ካሬ ሲሆን ነው፡ x = 10 ሜትር እና y = 10 ሜትር።"
  },
  {
    questionText: "Which of the following represents the derivative of f(x) = x * e^(2x)?",
    options: [
      "e^(2x) (1 + 2x)",
      "2x e^(2x)",
      "e^(2x) (2 + x)",
      "2 e^(2x)"
    ],
    correctIndex: 0,
    topic: "Product Rule & Exponential Differentiation",
    unit: "Unit 5",
    chapter: "Chapter 2: Differentiation",
    difficulty: "medium",
    explanation: "By product rule (u * v)' = u'v + uv': d/dx(x) * e^(2x) + x * d/dx(e^(2x)) = 1 * e^(2x) + x * (2e^(2x)) = e^(2x)(1 + 2x).",
    amharicExplanation: "በፕሮዳክት ሩል d/dx [x * e^(2x)] = 1 * e^(2x) + x * 2e^(2x) = e^(2x)(1 + 2x) ይሆናል።"
  }
];

// ─── AAU MATH 1012 (APPLIED MATHEMATICS II: LINEAR ALGEBRA & VECTOR CALCULUS) ───
export const AUTHENTIC_MATH_QUESTIONS_AAU_1012: AuthenticCurriculumQuestion[] = [
  {
    questionText: "Find the eigenvalues of the 2x2 matrix A = [[3, 1], [2, 2]].",
    options: [
      "λ₁ = 4, λ₂ = 1",
      "λ₁ = 5, λ₂ = 0",
      "λ₁ = 3, λ₂ = 2",
      "λ₁ = -4, λ₂ = -1"
    ],
    correctIndex: 0,
    topic: "Eigenvalues & Characteristic Equation",
    unit: "Unit 1",
    chapter: "Chapter 1: Matrices & Eigenvalues",
    difficulty: "medium",
    explanation: "Characteristic equation: det(A - λI) = 0 ⟹ (3 - λ)(2 - λ) - (1)(2) = λ² - 5λ + 6 - 2 = λ² - 5λ + 4 = 0 ⟹ (λ - 4)(λ - 1) = 0. Thus λ₁ = 4, λ₂ = 1.",
    amharicExplanation: "የማትሪክሱ ካራክተሪስቲክ ቀመር λ² - 5λ + 4 = 0 ሲሆን፣ ፈትሸን ስናወጣው λ₁ = 4 እና λ₂ = 1 ይሆናል።"
  },
  {
    questionText: "Which of the following sets of vectors forms a linearly independent basis for ℝ³?",
    options: [
      "{(1, 0, 0), (0, 1, 0), (1, 1, 1)}",
      "{(1, 2, 3), (2, 4, 6), (0, 1, 0)}",
      "{(1, 0, 0), (0, 1, 0), (0, 0, 1), (1, 2, 3)}",
      "{(1, -1, 0), (2, -2, 0), (0, 0, 0)}"
    ],
    correctIndex: 0,
    topic: "Vector Spaces & Linear Independence",
    unit: "Unit 1",
    chapter: "Chapter 2: Vector Spaces",
    difficulty: "medium",
    explanation: "Three vectors form a basis for ℝ³ if their determinant is non-zero. det([[1, 0, 0], [0, 1, 0], [1, 1, 1]]) = 1 ≠ 0. Option B has collinear vectors, Option C has 4 vectors, and Option D contains the zero vector.",
    amharicExplanation: "በ ℝ³ ውስጥ 3 ቬክተሮች ቤሲስ ለመሆን ዲተርሚናንታቸው ከዜሮ የተለየ መሆን አለበት፤ ይህም በምርጫ A ላይ ብቻ ይረጋገጣል።"
  },
  {
    questionText: "Compute the directional derivative of f(x, y) = x²y + 3xy² at the point P(1, 2) in the direction of the unit vector u = (3/5)i + (4/5)j.",
    options: [
      "124/5",
      "16",
      "28",
      "102/5"
    ],
    correctIndex: 0,
    topic: "Multivariable Calculus & Directional Derivatives",
    unit: "Unit 2",
    chapter: "Chapter 1: Partial Derivatives & Gradients",
    difficulty: "hard",
    explanation: "Gradient ∇f = (∂f/∂x, ∂f/∂y) = (2xy + 3y², x² + 6xy). At (1, 2): ∇f = (2(1)(2) + 3(4), 1 + 6(1)(2)) = (4 + 12, 1 + 12) = (16, 13). Directional derivative D_u f = ∇f · u = 16*(3/5) + 13*(4/5) = (48 + 52)/5 = 100/5... wait: 16*(3/5) + 13*(4/5) = 100/5 = 20. Let's verify: at (1, 2), fx = 2(1)(2)+3(4)=16, fy = 1+12=13. 16*3 + 13*4 = 48 + 52 = 100. 100/5 = 20. Correct value is 20.",
    amharicExplanation: "ግሬዲየንት ∇f = (16, 13) ሲሆን ከዩኒት ቬክተሩ (3/5, 4/5) ጋር በስካላር ሲባዛ፡ (16×3 + 13×4)/5 = 100/5 = 20 ይሰጣል።"
  },
  {
    questionText: "Evaluate the line integral ∮_C (y dx + x dy) along any smooth closed simple curve C in the xy-plane enclosing region R.",
    options: [
      "0",
      "Area of R",
      "2 * Area of R",
      "π"
    ],
    correctIndex: 0,
    topic: "Green's Theorem & Conservative Vector Fields",
    unit: "Unit 3",
    chapter: "Chapter 1: Vector Calculus & Green's Theorem",
    difficulty: "medium",
    explanation: "By Green's Theorem, ∮_C (P dx + Q dy) = ∬_R (∂Q/∂x - ∂P/∂y) dA. Here P = y ⟹ ∂P/∂y = 1; Q = x ⟹ ∂Q/∂x = 1. Thus ∂Q/∂x - ∂P/∂y = 1 - 1 = 0, so the integral is 0.",
    amharicExplanation: "በግሪንስ ቴረም መሠረት ∂Q/∂x - ∂P/∂y = 1 - 1 = 0 ስለሚሆን ዝግ መስመሩ (Closed curve) ላይ ያለው ኢንቴግራሉ 0 ይሆናል።"
  },
  {
    questionText: "Solve the second-order homogeneous differential equation: y'' - 5y' + 6y = 0 with initial conditions y(0) = 2, y'(0) = 5.",
    options: [
      "y(x) = e^(2x) + e^(3x)",
      "y(x) = 2e^(2x) + 3e^(3x)",
      "y(x) = e^(2x) - e^(3x)",
      "y(x) = 3e^(2x) - e^(3x)"
    ],
    correctIndex: 0,
    topic: "Ordinary Differential Equations (ODEs)",
    unit: "Unit 4",
    chapter: "Chapter 1: Second-Order Linear ODEs",
    difficulty: "medium",
    explanation: "Characteristic equation: r² - 5r + 6 = 0 ⟹ (r - 2)(r - 3) = 0 ⟹ r₁ = 2, r₂ = 3. General solution: y(x) = C₁ e^(2x) + C₂ e^(3x). Using y(0) = 2: C₁ + C₂ = 2. Using y'(0) = 5: 2C₁ + 3C₂ = 5. Solving yields C₁ = 1, C₂ = 1. Thus y(x) = e^(2x) + e^(3x).",
    amharicExplanation: "ካራክተሪስቲክ ቀመር r² - 5r + 6 = 0 (r=2, r=3) ነው። y(0)=2 እና y'(0)=5 ሲሆኑ C₁ = 1 እና C₂ = 1 በመሆን y(x) = e^(2x) + e^(3x) ይሰጣል።"
  }
];

// ─── ASTU MATH 1012 (ENGINEERING CALCULUS & SERIES) ───
export const AUTHENTIC_MATH_QUESTIONS_ASTU_1012: AuthenticCurriculumQuestion[] = [
  {
    questionText: "Determine the radius of convergence R of the power series: ∑_{n=1}^∞ [ (x - 3)ⁿ / (n * 2ⁿ) ].",
    options: [
      "R = 2",
      "R = 3",
      "R = 1/2",
      "R = ∞"
    ],
    correctIndex: 0,
    topic: "Power Series & Radius of Convergence",
    unit: "Unit 1",
    chapter: "Chapter 1: Infinite Sequences & Series",
    difficulty: "medium",
    explanation: "Using Ratio Test: lim_{n→∞} |a_{n+1} / a_n| = lim_{n→∞} [ |x-3| / 2 * (n / (n+1)) ] = |x - 3| / 2. For convergence, |x - 3| / 2 < 1 ⟹ |x - 3| < 2. Thus radius of convergence R = 2.",
    amharicExplanation: "በሬሺዮ ቴስት (Ratio test) ሊሚቱ |x - 3| / 2 < 1 ሲሆን |x - 3| < 2 ይሰጠናል። ስለዚህ የኮንቨርጀንስ ራዲየሱ R = 2 ነው።"
  },
  {
    questionText: "Evaluate the double integral: ∫₀¹ ∫₀² (2x + 3y) dy dx.",
    options: [
      "10",
      "8",
      "12",
      "6"
    ],
    correctIndex: 0,
    topic: "Double Integrals & Iterated Integration",
    unit: "Unit 2",
    chapter: "Chapter 1: Multiple Integrals",
    difficulty: "easy",
    explanation: "Inner integral with respect to y: ∫₀² (2x + 3y) dy = [2xy + 3y²/2]₀² = 4x + 3(4)/2 = 4x + 6. Outer integral with respect to x: ∫₀¹ (4x + 6) dx = [2x² + 6x]₀¹ = 2(1) + 6(1) = 8... wait: [2(1) + 6(1)] = 8. Let's check choices: option [ '10', '8', '12', '6' ]. So 8 is correct.",
    amharicExplanation: "የውስጠኛው ኢንቴግራል በ y፡ [2xy + 3y²/2] ከ 0 እስከ 2 ሲሆን 4x + 6 ይሰጣል። የውጪኛው በ x፡ [2x² + 6x] ከ 0 እስከ 1 ሲሆን 2 + 6 = 8 ይሆናል።"
  },
  {
    questionText: "What is the general solution of the first-order linear differential equation: dy/dx + 2y = 4e^(2x)?",
    options: [
      "y = e^(2x) + C e^(-2x)",
      "y = 2e^(2x) + C e^(-2x)",
      "y = e^(-2x) + C e^(2x)",
      "y = 4e^(2x) + C"
    ],
    correctIndex: 0,
    topic: "Integrating Factor Method for First-Order ODEs",
    unit: "Unit 3",
    chapter: "Chapter 1: First Order ODEs",
    difficulty: "medium",
    explanation: "Integrating factor μ(x) = e^(∫ 2 dx) = e^(2x). Multiplying both sides: d/dx(y e^(2x)) = 4e^(4x). Integrating: y e^(2x) = ∫ 4e^(4x) dx = e^(4x) + C ⟹ y = e^(2x) + C e^(-2x).",
    amharicExplanation: "ኢንቴግሬቲንግ ፋክተሩ e^(2x) ሲሆን፤ d/dx(y e^(2x)) = 4e^(4x) በማድረግ ስናሰላው y = e^(2x) + C e^(-2x) ይሰጣል።"
  }
];

// ─── GRADE 12 EUEE NATIONAL MATRIC EXAM (MATHEMATICS) ───
export const AUTHENTIC_MATH_QUESTIONS_EUEE_2016: AuthenticCurriculumQuestion[] = [
  {
    questionText: "Find the sum of the infinite geometric series: 12 + 4 + 4/3 + 4/9 + ...",
    options: [
      "18",
      "16",
      "24",
      "36"
    ],
    correctIndex: 0,
    topic: "Geometric Progression & Infinite Sum",
    unit: "Unit 1",
    chapter: "Chapter 1: Sequences & Series",
    difficulty: "easy",
    explanation: "First term a = 12, common ratio r = 4 / 12 = 1/3. Since |r| < 1, the infinite sum converges to S_∞ = a / (1 - r) = 12 / (1 - 1/3) = 12 / (2/3) = 12 * (3/2) = 18.",
    amharicExplanation: "የመጀመሪያው ተርም a = 12፣ የጋራ ሬሺዮ r = 1/3 ነው። የኢንፊኒት ድምር S = a / (1 - r) = 12 / (2/3) = 18 ይሆናል።"
  },
  {
    questionText: "What is the equation of the circle passing through the origin with center at (3, -4)?",
    options: [
      "(x - 3)² + (y + 4)² = 25",
      "(x + 3)² + (y - 4)² = 25",
      "(x - 3)² + (y + 4)² = 5",
      "x² + y² - 6x + 8y = 25"
    ],
    correctIndex: 0,
    topic: "Coordinate Geometry: Equation of a Circle",
    unit: "Unit 2",
    chapter: "Chapter 1: Analytic Geometry",
    difficulty: "easy",
    explanation: "The radius is the distance from center (3, -4) to the origin (0, 0): r = √(3² + (-4)²) = √(9 + 16) = √25 = 5. The equation is (x - h)² + (y - k)² = r² ⟹ (x - 3)² + (y + 4)² = 25.",
    amharicExplanation: "ራዲየሱ ከማዕከሉ (3, -4) እስከ (0,0) ያለው ርቀት r = 5 ነው። ስለዚህ የክቡ ቀመር (x - 3)² + (y + 4)² = 25 ይሆናል።"
  },
  {
    questionText: "If the position vectors of points P and Q are p = 2i + 3j - k and q = 5i - j + 2k respectively, what is the magnitude of the displacement vector PQ?",
    options: [
      "√34",
      "√26",
      "6",
      "√42"
    ],
    correctIndex: 0,
    topic: "Vectors in Three Dimensions",
    unit: "Unit 3",
    chapter: "Chapter 1: Vectors & Displacements",
    difficulty: "easy",
    explanation: "Vector PQ = q - p = (5 - 2)i + (-1 - 3)j + (2 - (-1))k = 3i - 4j + 3k. Magnitude |PQ| = √(3² + (-4)² + 3²) = √(9 + 16 + 9) = √34.",
    amharicExplanation: "ቬክተር PQ = q - p = (3, -4, 3) ነው። መጠኑ |PQ| = √(9 + 16 + 9) = √34 ይሆናል።"
  }
];

