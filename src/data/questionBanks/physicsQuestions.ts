import { AuthenticCurriculumQuestion } from './mathQuestions';

export const AUTHENTIC_PHYSICS_QUESTIONS_WKU_1011: AuthenticCurriculumQuestion[] = [
  // ─── UNIT 1: VECTORS & DIMENSIONAL ANALYSIS ───
  {
    questionText: "What are the base SI dimensions of the universal gravitational constant G in the formula F = G(m₁m₂) / r²?",
    options: [
      "[M⁻¹ L³ T⁻²]",
      "[M L² T⁻²]",
      "[M⁻² L² T⁻¹]",
      "[M L³ T⁻²]"
    ],
    correctIndex: 0,
    topic: "Dimensional Analysis & Physical Constants",
    unit: "Unit 1",
    chapter: "Chapter 1: Units & Dimensional Analysis",
    difficulty: "medium",
    explanation: "Rearranging F = G m₁m₂ / r² gives G = F r² / (m₁ m₂). Dimensions of force F = [M L T⁻²], r² = [L²], and mass product = [M²]. Thus [G] = [M L T⁻²][L²] / [M²] = [M⁻¹ L³ T⁻²].",
    amharicExplanation: "G = F r² / (m₁ m₂) ሲሆን፣ [F] = [M L T⁻²]፣ [r²] = [L²]፣ [m²] = [M²] ስለሆነ፤ [G] = [M⁻¹ L³ T⁻²] ይሆናል።"
  },
  {
    questionText: "Two vectors A and B have magnitudes of 6 units and 8 units respectively. If their scalar dot product A · B is 24√3, what is the angle θ between them?",
    options: [
      "30°",
      "45°",
      "60°",
      "90°"
    ],
    correctIndex: 0,
    topic: "Vector Dot Product & Angle",
    unit: "Unit 1",
    chapter: "Chapter 2: Vectors & Coordinate Systems",
    difficulty: "easy",
    explanation: "A · B = |A| |B| cos θ ⟹ 24√3 = (6)(8) cos θ = 48 cos θ ⟹ cos θ = (24√3) / 48 = √3 / 2. Therefore θ = 30° (or π/6 radians).",
    amharicExplanation: "A · B = |A| |B| cos θ መሠረት፡ 24√3 = 48 cos θ ⟹ cos θ = √3 / 2 ሲሆን አንግሉ 30° ይሆናል።"
  },
  {
    questionText: "If vector A = 3i - 2j + k and vector B = 2i + j - 3k, calculate the cross product A × B.",
    options: [
      "5i + 11j + 7k",
      "5i - 11j + 7k",
      "-5i + 11j - 7k",
      "1i + 7j + 5k"
    ],
    correctIndex: 0,
    topic: "Vector Cross Product & Determinant",
    unit: "Unit 1",
    chapter: "Chapter 2: Vector Cross Products",
    difficulty: "medium",
    explanation: "Expand determinant of [[i, j, k], [3, -2, 1], [2, 1, -3]]: i((-2)(-3) - (1)(1)) - j((3)(-3) - (1)(2)) + k((3)(1) - (-2)(2)) = i(6 - 1) - j(-9 - 2) + k(3 + 4) = 5i + 11j + 7k.",
    amharicExplanation: "በዲተርሚናንት ዘዴ፡ i(6 - 1) - j(-9 - 2) + k(3 + 4) = 5i + 11j + 7k ይሆናል።"
  },

  // ─── UNIT 2: 1D & 2D KINEMATICS ───
  {
    questionText: "A stone is thrown vertically upward with an initial velocity of 20 m/s from the top edge of a 25-meter cliff. Taking g = 10 m/s², how long does it take to reach the bottom of the cliff?",
    options: [
      "5.0 seconds",
      "4.0 seconds",
      "2.5 seconds",
      "6.2 seconds"
    ],
    correctIndex: 0,
    topic: "Vertical Projectiles & Kinematic Equations",
    unit: "Unit 2",
    chapter: "Chapter 1: Motion in One Dimension",
    difficulty: "medium",
    explanation: "Taking upward as positive: y₀ = 0, y = -25 m, v₀ = +20 m/s, a = -10 m/s². Equation: y = v₀ t + 0.5 a t² ⟹ -25 = 20t - 5t² ⟹ 5t² - 20t - 25 = 0 ⟹ t² - 4t - 5 = 0 ⟹ (t - 5)(t + 1) = 0. Physical time t = 5.0 seconds.",
    amharicExplanation: "-25 = 20t - 5t² ወደ 5t² - 20t - 25 = 0 ሲቀየር (t - 5)(t + 1) = 0 ይሰጣል። ትክክለኛው ሰዓት t = 5 ሰከንድ ነው።"
  },
  {
    questionText: "In projectile motion on a flat horizontal plane ignoring air drag, what is the ratio of maximum height H_max to horizontal range R when launched at angle θ = 45°?",
    options: [
      "1 / 4",
      "1 / 2",
      "1",
      "1 / √2"
    ],
    correctIndex: 0,
    topic: "Projectile Trajectory & Range Relations",
    unit: "Unit 2",
    chapter: "Chapter 2: Two-Dimensional Motion",
    difficulty: "medium",
    explanation: "H_max = (v₀² sin² θ) / (2g) and R = (v₀² sin 2θ) / g = (2 v₀² sin θ cos θ) / g. Dividing gives H_max / R = tan θ / 4. For θ = 45°, tan(45°) = 1, giving H_max / R = 1/4.",
    amharicExplanation: "H_max / R = tan θ / 4 ሲሆን፣ ለ 45° አንግል tan(45°) = 1 ስለሆነ ጥምርታው 1/4 ይሆናል።"
  },

  // ─── UNIT 3: NEWTON'S LAWS & DYNAMICS ───
  {
    questionText: "An Atwood machine consists of two masses m₁ = 3 kg and m₂ = 5 kg connected by a light string over a frictionless pulley. What is the acceleration of the system (take g = 10 m/s²)?",
    options: [
      "2.5 m/s²",
      "1.25 m/s²",
      "5.0 m/s²",
      "10.0 m/s²"
    ],
    correctIndex: 0,
    topic: "Atwood Machine & Connected Bodies",
    unit: "Unit 3",
    chapter: "Chapter 1: Newton's Laws of Motion",
    difficulty: "easy",
    explanation: "For an Atwood machine: a = (m₂ - m₁) g / (m₁ + m₂) = (5 - 3)(10) / (3 + 5) = 20 / 8 = 2.5 m/s².",
    amharicExplanation: "በአትዉድ ማሽን ቀመር a = (m₂ - m₁)g / (m₁ + m₂) = (2 × 10) / 8 = 2.5 m/s² ይሆናል።"
  },
  {
    questionText: "A 10 kg crate rests on an incline of 30°. The coefficient of static friction is μs = 0.6. Will the crate slide down spontaneously (g = 10 m/s²)?",
    options: [
      "No, because the critical angle of repose is θ_c = arctan(0.6) ≈ 31° > 30°",
      "Yes, because the gravitational component along the incline exceeds static friction",
      "Yes, because any incline over 25° causes spontaneous sliding",
      "No, because normal force cancels all motion indefinitely"
    ],
    correctIndex: 0,
    topic: "Friction on Inclined Planes & Angle of Repose",
    unit: "Unit 3",
    chapter: "Chapter 2: Friction & Circular Motion",
    difficulty: "medium",
    explanation: "The condition for impending sliding on an incline is tan θ ≥ μs. Here tan(30°) = 1/√3 ≈ 0.577. Since 0.577 < 0.6, static friction fs,max exceeds the downslope gravity component, keeping the crate at rest.",
    amharicExplanation: "የማንሸራተቻው ወሰን tan θ = μs ሲሆን፣ tan(30°) = 0.577 ከ 0.6 ስለሚያንስ እቃው አይንሸራተትም (አርፎ ይቆያል)።"
  },

  // ─── UNIT 4: WORK, ENERGY & MOMENTUM ───
  {
    questionText: "A spring with spring constant k = 400 N/m is compressed by 0.2 m. It is released to project a 0.5 kg ball horizontally across a frictionless surface. What is the launch speed of the ball?",
    options: [
      "5.66 m/s (4√2 m/s)",
      "4.0 m/s",
      "8.0 m/s",
      "2.83 m/s"
    ],
    correctIndex: 0,
    topic: "Conservation of Mechanical Energy & Springs",
    unit: "Unit 4",
    chapter: "Chapter 1: Work & Energy",
    difficulty: "medium",
    explanation: "By conservation of energy: (1/2) k x² = (1/2) m v² ⟹ v = x √(k / m) = 0.2 √(400 / 0.5) = 0.2 √800 = 0.2 * 20√2 = 4√2 ≈ 5.66 m/s.",
    amharicExplanation: "በሃይል ጥበቃ ሕግ (Conservation of Energy)፡ (1/2) k x² = (1/2) m v² ⟹ v = 0.2 √(800) = 4√2 ≈ 5.66 m/s ይሆናል።"
  },
  {
    questionText: "A 2 kg sphere moving at 6 m/s collides head-on and elastically with a stationary 4 kg sphere. What is the velocity of the 2 kg sphere immediately after the collision?",
    options: [
      "-2 m/s (rebounds backward)",
      "+2 m/s (continues forward)",
      "0 m/s (stops dead)",
      "-4 m/s"
    ],
    correctIndex: 0,
    topic: "Elastic Collisions in One Dimension",
    unit: "Unit 4",
    chapter: "Chapter 2: Momentum & Collisions",
    difficulty: "hard",
    explanation: "For a 1D elastic collision with m₂ at rest: v₁f = (m₁ - m₂) v₁i / (m₁ + m₂) = (2 - 4)(6) / (2 + 4) = (-2 * 6) / 6 = -2 m/s.",
    amharicExplanation: "በኢላስቲክ ግጭት ቀመር v₁f = (m₁ - m₂)v₁ / (m₁ + m₂) = (2 - 4)(6) / 6 = -2 m/s (ወደ ኋላ ይመለሳል)።"
  },

  // ─── UNIT 5: ROTATION, FLUIDS & THERMODYNAMICS ───
  {
    questionText: "A solid cylinder (I = 1/2 MR²) and a thin hollow hoop (I = MR²) of equal mass and radius roll down an inclined plane from rest without slipping. Which reaches the bottom first?",
    options: [
      "The solid cylinder reaches the bottom first because it has a smaller moment of inertia",
      "The hollow hoop reaches the bottom first",
      "Both reach the bottom at the exact same instant",
      "It depends on the mass M of the objects"
    ],
    correctIndex: 0,
    topic: "Rotational Dynamics & Rolling Motion",
    unit: "Unit 5",
    chapter: "Chapter 1: Rotational Dynamics",
    difficulty: "medium",
    explanation: "Acceleration for a rolling object is a = g sin θ / (1 + I / (MR²)). For the cylinder, I / (MR²) = 1/2 ⟹ a = (2/3) g sin θ. For the hoop, I / (MR²) = 1 ⟹ a = (1/2) g sin θ. The cylinder experiences greater acceleration and arrives first.",
    amharicExplanation: "የሲሊንደሩ ሞመንት ኦፍ ኢነርሺያ አነስተኛ ስለሆነ የመሽከርከር ማጣደፉ (Acceleration) ይበልጣል፤ ስለዚህ ቀድሞ ይደርሳል።"
  },
  {
    questionText: "An ideal Carnot heat engine operates between a hot reservoir at 600 K and a cold reservoir at 300 K. What is the maximum theoretical efficiency of this engine?",
    options: [
      "50%",
      "33.3%",
      "66.7%",
      "100%"
    ],
    correctIndex: 0,
    topic: "Carnot Efficiency & Second Law of Thermodynamics",
    unit: "Unit 5",
    chapter: "Chapter 2: Thermodynamics",
    difficulty: "easy",
    explanation: "Carnot efficiency η = 1 - (T_cold / T_hot) = 1 - (300 / 600) = 1 - 0.5 = 0.5 or 50%.",
    amharicExplanation: "የካርኖት ሞተር ብቃት η = 1 - (T_cold / T_hot) = 1 - (300 / 600) = 0.5 (50%) ነው።"
  },
  {
    questionText: "Water flows through a horizontal pipe whose diameter narrows from 10 cm to 5 cm. If the flow speed in the wide section is 2 m/s, what is the flow speed in the narrow section?",
    options: [
      "8 m/s",
      "4 m/s",
      "1 m/s",
      "16 m/s"
    ],
    correctIndex: 0,
    topic: "Equation of Continuity & Fluid Dynamics",
    unit: "Unit 5",
    chapter: "Chapter 2: Fluid Dynamics",
    difficulty: "medium",
    explanation: "By the continuity equation for incompressible fluids: A₁ v₁ = A₂ v₂ ⟹ (π r₁²) v₁ = (π r₂²) v₂ ⟹ v₂ = v₁ (d₁ / d₂)² = 2 * (10 / 5)² = 2 * (2)² = 8 m/s.",
    amharicExplanation: "በኮንቲኒዩቲ ቀመር A₁ v₁ = A₂ v₂ መሠረት የዲያሜትሩ ጥምርታ በስኩዌር ስለሚባዛ፡ v₂ = 2 × (10/5)² = 2 × 4 = 8 m/s ይሆናል።"
  }
];

// ─── ASTU PHYSICS 1011 (WAVES, OSCILLATIONS & THERMODYNAMICS) ───
export const AUTHENTIC_PHYSICS_QUESTIONS_ASTU_1011: AuthenticCurriculumQuestion[] = [
  {
    questionText: "A mass-spring harmonic oscillator has an oscillation period of T = 2.0 seconds on Earth. If the mass attached to the spring is quadrupled (multiplied by 4), what is the new period of oscillation?",
    options: [
      "4.0 seconds",
      "8.0 seconds",
      "1.0 second",
      "2.0 seconds (independent of mass)"
    ],
    correctIndex: 0,
    topic: "Simple Harmonic Motion & Spring Period",
    unit: "Unit 1",
    chapter: "Chapter 1: Oscillations & SHM",
    difficulty: "easy",
    explanation: "Period of a mass-spring system: T = 2π √(m / k). If m becomes 4m, T' = 2π √(4m / k) = 2 * (2π √(m/k)) = 2 * T = 2 * 2.0 s = 4.0 s.",
    amharicExplanation: "የስፕሪንግ ፒሪየድ T = 2π √(m/k) ነው። ክብደቱ በ 4 እጥፍ ሲያድግ፣ በስኩዌር ሩት ውስጥ ስለሆነ ፒሪየዱ በ 2 እጥፍ በማደግ 4 ሰከንድ ይሆናል።"
  },
  {
    questionText: "A police siren emits sound at a frequency of 900 Hz. If the police car moves toward a stationary pedestrian in Wolkite at 34 m/s on a day when sound speed in air is 340 m/s, what frequency does the pedestrian perceive?",
    options: [
      "1000 Hz",
      "810 Hz",
      "990 Hz",
      "1100 Hz"
    ],
    correctIndex: 0,
    topic: "Doppler Effect for Sound Waves",
    unit: "Unit 2",
    chapter: "Chapter 1: Mechanical Waves & Sound",
    difficulty: "medium",
    explanation: "Observed frequency f' = f * [ v / (v - v_s) ] = 900 * [ 340 / (340 - 34) ] = 900 * [ 340 / 306 ] = 900 * (10 / 9) = 1000 Hz.",
    amharicExplanation: "በዶፕለር ኢፌክት ቀመር f' = f [v / (v - v_s)] = 900 × (340 / 306) = 900 × (10/9) = 1000 Hz ይሆናል።"
  },
  {
    questionText: "An ideal monoatomic gas undergoes an isothermal expansion from volume V to 3V at temperature T = 300 K. What is the change in internal energy ΔU of the gas?",
    options: [
      "ΔU = 0 J",
      "ΔU = n R T ln(3)",
      "ΔU = -n R T ln(3)",
      "ΔU = (3/2) n R T"
    ],
    correctIndex: 0,
    topic: "First Law of Thermodynamics & Isothermal Processes",
    unit: "Unit 3",
    chapter: "Chapter 1: Thermodynamic Processes",
    difficulty: "easy",
    explanation: "For an ideal gas, internal energy depends solely on temperature: U = (3/2) nRT. In an isothermal process, temperature remains strictly constant (ΔT = 0), which means ΔU = 0 J.",
    amharicExplanation: "በአይሶተርማል (Isothermal) ሂደት ውስጥ ሙቀት ቋሚ ስለሆነ የውስጥ ሃይል ለውጡ ΔU = 0 ጁል ይሆናል።"
  }
];

// ─── JIMMA PHYSICS 1011 (ELECTROMAGNETISM & MODERN PHYSICS) ───
export const AUTHENTIC_PHYSICS_QUESTIONS_JU_1011: AuthenticCurriculumQuestion[] = [
  {
    questionText: "Two point charges +4 μC and -4 μC are separated by a distance of 0.2 meters in vacuum. What is the magnitude of the electrostatic force between them (Coulomb constant k = 9 x 10⁹ N·m²/C²)?",
    options: [
      "3.6 N (attractive)",
      "3.6 N (repulsive)",
      "1.8 N (attractive)",
      "7.2 N (repulsive)"
    ],
    correctIndex: 0,
    topic: "Coulomb's Law & Electrostatic Force",
    unit: "Unit 1",
    chapter: "Chapter 1: Electric Charges & Coulomb's Law",
    difficulty: "easy",
    explanation: "F = k |q₁ q₂| / r² = (9 x 10⁹)(4 x 10⁻⁶)(4 x 10⁻⁶) / (0.2)² = (9 x 10⁹)(16 x 10⁻¹²) / 0.04 = 0.144 / 0.04 = 3.6 N. Opposite charges attract.",
    amharicExplanation: "በኩሎምብ ሕግ F = k |q₁ q₂| / r² = (9×10⁹ × 16×10⁻¹²) / 0.04 = 3.6 ኒውተን ሲሆን ተቃራኒ ስለሆኑ ይሳሳባሉ (Attractive)።"
  },
  {
    questionText: "A long straight wire carries an electric current of 5.0 Amperes. What is the magnetic field B at a perpendicular distance of 0.1 meters from the wire (permeability μ₀ = 4π x 10⁻⁷ T·m/A)?",
    options: [
      "1.0 x 10⁻⁵ Tesla",
      "2.0 x 10⁻⁵ Tesla",
      "5.0 x 10⁻⁶ Tesla",
      "3.14 x 10⁻⁵ Tesla"
    ],
    correctIndex: 0,
    topic: "Biot-Savart Law & Magnetic Field of Current",
    unit: "Unit 2",
    chapter: "Chapter 1: Magnetic Fields",
    difficulty: "medium",
    explanation: "For an infinitely long wire: B = (μ₀ I) / (2π r) = (4π x 10⁻⁷ * 5.0) / (2π * 0.1) = (2 x 10⁻⁷ * 5.0) / 0.1 = (10 x 10⁻⁷) / 0.1 = 1.0 x 10⁻⁵ Tesla.",
    amharicExplanation: "በቀጥታ ሽቦ ዙሪያ ያለው የማግኔቲክ ፊልድ B = (μ₀ I) / (2π r) = (4π×10⁻⁷ × 5) / (2π × 0.1) = 1.0 × 10⁻⁵ ቴስላ ይሆናል።"
  }
];

// ─── GRADE 12 EUEE NATIONAL MATRIC EXAM (PHYSICS) ───
export const AUTHENTIC_PHYSICS_QUESTIONS_EUEE_2016: AuthenticCurriculumQuestion[] = [
  {
    questionText: "A light ray passes from crown glass (refractive index n₁ = 1.50) into water (refractive index n₂ = 1.33). What is the critical angle θ_c for total internal reflection to occur?",
    options: [
      "62.5° (arcsin(1.33 / 1.50))",
      "48.8°",
      "41.8°",
      "Total internal reflection cannot occur from glass to water"
    ],
    correctIndex: 0,
    topic: "Optics: Snell's Law & Total Internal Reflection",
    unit: "Unit 1",
    chapter: "Chapter 1: Geometric Optics & Refraction",
    difficulty: "medium",
    explanation: "Total internal reflection occurs when traveling from denser (n₁=1.50) to rarer medium (n₂=1.33). Critical angle sin θ_c = n₂ / n₁ = 1.33 / 1.50 ≈ 0.8867 ⟹ θ_c = arcsin(0.8867) ≈ 62.5°.",
    amharicExplanation: "ብርሃን ከወፍራሙ መካነ-ብርሃን (መስታወት) ወደ ቀላው (ውሃ) ሲያልፍ ወሳኙ አንግል sin θ_c = n₂ / n₁ = 1.33 / 1.50 ሲሆን 62.5° ይሆናል።"
  },
  {
    questionText: "In the photoelectric effect experiment, if the work function of a potassium emitter is Φ = 2.30 eV and it is illuminated with ultraviolet photons of energy E = 4.50 eV, what is the maximum kinetic energy K_max of the emitted photoelectrons?",
    options: [
      "2.20 eV",
      "6.80 eV",
      "4.50 eV",
      "1.15 eV"
    ],
    correctIndex: 0,
    topic: "Modern Physics: Photoelectric Effect",
    unit: "Unit 2",
    chapter: "Chapter 1: Quantum & Atomic Physics",
    difficulty: "easy",
    explanation: "By Einstein's Photoelectric Equation: K_max = hf - Φ = E_photon - Φ = 4.50 eV - 2.30 eV = 2.20 eV.",
    amharicExplanation: "በአይንስታይን የፎቶኤሌክትሪክ ቀመር K_max = E - Φ = 4.50 eV - 2.30 eV = 2.20 eV የካይኔቲክ ኢነርጂ ይኖራቸዋል።"
  }
];

