/**
 * Detailed chapter contents for Grade 12 New Curriculum books and prebuilt modules
 * used by the in-app textbook viewer.
 */

export interface ChapterTextContent {
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
  keyTerms: { term: string; definition: string; amharic?: string }[];
  formulas?: { name: string; formula: string; description: string }[];
  examAlert?: string;
  asciiDiagram?: string;
}

export const TEXTBOOK_CHAPTERS: Record<string, Record<string, ChapterTextContent>> = {
  // Economics (New Curriculum)
  'g12_new_economics': {
    'Chapter 1: Theory of Consumer Behavior': {
      title: 'Chapter 1: Theory of Consumer Behavior',
      intro: 'In this chapter, we explore how individual consumers allocate their limited income to purchase combinations of goods and services that maximize their satisfaction (utility).',
      sections: [
        {
          title: '1. Cardinal vs. Ordinal Utility Approaches',
          body: 'The cardinal approach suggests utility can be measured quantitatively in absolute units called "utils." Modern economics, however, prefers the ordinal utility approach, which states that satisfaction cannot be measured numerically but only ranked or ordered dynamically (First, Second, Third) using Indifference Curves.'
        },
        {
          title: '2. The Law of Diminishing Marginal Utility (LDMU)',
          body: 'As a consumer consumes more and more of a specific good (e.g., cups of traditional coffee or slices of injera), the additional satisfaction or "Marginal Utility" (MU) gained from each successive unit decreases. Mathematically, marginal utility is given by MU = ΔTU / ΔQ.'
        },
        {
          title: '3. Consumer Equilibrium Condition',
          body: 'A consumer maximizes utility when the ratio of the marginal utility of each good to its price is equal across all purchased commodities: MU_x / P_x = MU_y / P_y, subject to the budget constraint: I = P_x * Q_x + P_y * Q_y.'
        }
      ],
      formulas: [
        { name: 'Marginal Utility (MU)', formula: 'MU = d(TU) / dQ  or  (TU_2 - TU_1) / (Q_2 - Q_1)', description: 'Measures the rate of change in total utility resulting from a one-unit change in consumption volume.' },
        { name: 'Equilibrium Condition', formula: 'MU_x / P_x = MU_y / P_y', description: 'Represents the equal marginal utility per dollar spent condition ensuring optimal satisfaction.' }
      ],
      keyTerms: [
        { term: 'Utility (ጥቅም)', definition: 'The capacity of a commodity or service to satisfy human wants.', amharic: 'ጥቅም' },
        { term: 'Marginal Utility (ተጨማሪ ጥቅም)', definition: 'The additional satisfaction from consuming one extra unit of a good.', amharic: 'ተጨማሪ ጥቅም' },
        { term: 'Indifference Curve (አድሏዊ ያልሆነ ኩርባ)', definition: 'A curve showing combination points of two goods that give the consumer equal satisfaction.', amharic: 'ገለልተኛ ኩርባ' }
      ],
      asciiDiagram: `
     Consumer Indifference Curve & Budget Line:
     
     Quantity Y
         |  \\
      I1 |...\\*  <- Optimal Consumer Choice (Equilibrium)
         |   .\\
         |    .\\  U_High (Indifference Curve)
         |_____\\________________ Quantity X
               Budget Line
      `,
      examAlert: 'MATRIC ALERT: At consumer equilibrium, the slope of the indifference curve (Marginal Rate of Substitution, MRS) is exactly equal to the slope of the budget line (Price Ratio, P_x / P_y). Prepare for multiple-choice questions testing this intersection!'
    },
    'Chapter 2: Market Structure and Perfect Competition': {
      title: 'Chapter 2: Market Structure and Perfect Competition',
      intro: 'This chapter analyses perfect competition—a highly idealized market structure with homogenous goods, price-taking behavior, and complete information.',
      sections: [
        {
          title: '1. Conditions of Perfect Competition',
          body: 'Perfect competition requires four main assumptions:\n- Large number of buyers and sellers;\n- Homogenous (identical) products;\n- Free entry and exit of firms;\n- Perfect knowledge of market price profiles.'
        },
        {
          title: '2. Short-Run vs Long-Run Equilibrium',
          body: 'In the short-run, competitive firms can earn abnormal profits, normal profits, or incur losses. In the long-run, because of free entry and exit, abnormal profits attract competitors, driving price down to the minimum average cost, resulting in only Normal Profit (P = MC = Minimum ATC).'
        }
      ],
      formulas: [
        { name: 'Marginal Revenue (MR)', formula: 'MR = d(TR) / dQ', description: 'The change in total revenue from selling one more unit. For perfect competition, P = MR = AR.' }
      ],
      keyTerms: [
        { term: 'Price Taker (ዋጋ ተቀባይ)', definition: 'A firm that must accept the prevailing market price because it lacks market power to set it.', amharic: 'ዋጋ ተቀባይ' }
      ]
    }
  },

  // Geography (New Curriculum)
  'g12_new_geography': {
    'Chapter 1: Geological Structure and Landforms of Ethiopia': {
      title: 'Chapter 1: Geological Structure and Landforms of Ethiopia',
      intro: 'An analysis of plates tectonics, volcanic eruptions, and geological epochs that formed the rugged highland plateaus and beautiful rift valley basins of Ethiopia.',
      sections: [
        {
          title: '1. Geological Eras and Epochs',
          body: 'Ethiopia\'s landscape is built from rocks ranging from Pre-Cambrian crystalline basement complex rocks (found in Tigray, Gojjam, and Southern regions) to Mesozoic marine sedimentary rocks (limestone, sandstone), and Cenozoic volcanic trap series (basalt over Rift Valley margins).'
        },
        {
          title: '2. Plate Tectonics and the Great East African Rift Valley',
          body: 'The rifting of the African plate into the Nubian and Somalian sub-plates created the Great East African Rift Valley. This zone is characterised by high geological activity, active volcanoes (such as Erta Ale), hot springs, and tectonic lakes.'
        }
      ],
      keyTerms: [
        { term: 'Basement Complex (መሠረታዊ ድንጋይ)', definition: 'The oldest, highly metamorphosed crystalline rocks forming the foundation of Ethiopian soil geology.', amharic: 'መሠረተ ድንጋይ' },
        { term: 'Rifting (ስንጥቃት)', definition: 'The process of lithospheric stretching and breaking under tectonic pull factors.', amharic: 'መሰንጠቅ' }
      ],
      asciiDiagram: `
     Ethiopian Rift Valley Cross-section:
     
      Western Highlands                          Eastern Highlands
         (Gojjam/Shewa)                            (Bale/Arsi)
           \\________                                ________/
                    \\      Rift Valley Basin       /
                     \\     (Tectonic Lakes, e.g.) /
                      \\______[ Erta Ale ]_________/
                            Crust Stretching
      `,
      examAlert: 'TRAP GUIDE: Basement complex rocks are mineral-rich but mostly ancient metamorphic formations. Sedimentary layers from the Mesozoic era host major water reservoirs and construction materials.'
    }
  },

  // History (New Curriculum)
  'g12_new_history': {
    'Chapter 1: Human Beginnings & Stone Age Cultures in the Horn': {
      title: 'Chapter 1: Human Beginnings and Stone Age Cultures in the Horn',
      intro: 'East Africa and the Horn of Ethiopia are universally recognized as the "Cradle of humankind" due to revolutionary fossil discoveries spanning millions of years.',
      sections: [
        {
          title: '1. Paleoanthropological Fossil Discoveries',
          body: 'World-famous hominid fossils including "Lucy" (Dinknesh, Australopithecus afarensis, 3.2 million years old) discovered in Hadar (Afar), "Ardi" (Ardipithecus ramidus, 4.4 million years old), and "Selam" confirm the Great Rift Valley as a central hub for early hominid bipedal evolution.'
        },
        {
          title: '2. Stone Age Technologies',
          body: 'Early humans in Ethiopia transitioned from the Oldowan tool culture (choppers and simple flakes) to the Acheulean hand-axes, eventually developing sophisticated microliths during the Late Stone Age.'
        }
      ],
      keyTerms: [
        { term: 'Australopithecus (አውስትራሎፒተከስ)', definition: 'An extinct genus of bipedal hominids that lived in East Africa millions of years ago.', amharic: 'ድንቅነሽ' },
        { term: 'Microliths (ጥቃቅን የድንጋይ መሣሪያዎች)', definition: 'Small, highly precise stone tools constructed for spear heads and hunting.', amharic: 'ጥቃቅን የድንጋይ መሣሪያዎች' }
      ]
    },
    'Chapter 2: State Formations, Trade and Religions (Axum, Lalibela)': {
      title: 'Chapter 2: State Formations, Trade and Religions',
      intro: 'This chapter explores ancient civilizations, monumental architecture, and trade dynamics of Axum and the Zagwe dynasty.',
      sections: [
        {
          title: '1. The Kingdom of Axum',
          body: 'Centred in Northern Ethiopia, Axum controlled major Red Sea trade routes via its port Adulis. Axum minted its own gold coins, developed the Ge\'ez script, and adopted Christianity under King Ezana in the 4th century AD.'
        },
        {
          title: '2. The Zagwe Dynasty and Lalibela',
          body: 'Following Axum\'s decline, the center of power shifted south to Lalibela. King Lalibela supervised the construction of 11 monolithic, rock-hewn churches carved out of single basalt blocks, showcasing architectural genius.'
        }
      ],
      keyTerms: [
        { term: 'Adulis (አዱሊስ)', definition: 'The essential international Red Sea port city of ancient Axum controlling trade to Rome and India.', amharic: 'አዱሊስ' },
        { term: 'Monolithic (አንድ ወጥ ድንጋይ)', definition: 'Structures carved out from a single contiguous block of solid volcanic stone.', amharic: 'አንድ ወጥ' }
      ]
    }
  },

  // Information Technology (New Curriculum)
  'g12_new_it': {
    'Chapter 3: Web Development Fundamentals (HTML, CSS, JS)': {
      title: 'Chapter 3: Web Development Fundamentals (HTML, CSS, JS)',
      intro: 'This chapter teaches the core programming pillars of modern Web Authoring systems.',
      sections: [
        {
          title: '1. HTML (Hypertext Markup Language)',
          body: 'HTML represents the structure of web documents. Elements are enclosed in tags like <header>, <div>, and <a>. Example: <p id="target">Hello World</p> is a paragraph tag.'
        },
        {
          title: '2. CSS (Cascading Style Sheets)',
          body: 'CSS manages visual presentations, margins, layouts, and colors. Tailwind CSS, which we use, compiles direct utilities into compiled style arrays.'
        },
        {
          title: '3. JavaScript Dynamic Logic',
          body: 'JavaScript handles user interactions, click events, states, API fetches, and dynamic operations.'
        }
      ],
      keyTerms: [
        { term: 'HTML DOM (ዶም)', definition: "Document Object Model, the structural representation of the HTML document tree.", amharic: "ዶም" },
        { term: 'Asynchronous (አሲንክሮነስ)', definition: "Programming model that handles operations running in the background without blocking the execution thread.", amharic: "አሲንክሮነስ" }
      ],
      asciiDiagram: `
     Standard Web 3-Tier Client Flow:
     
     [ HTML Structure ]  <-- Bone structure elements
            ||
     [ CSS Presentation ] <-- Visual margins/Colors (Vibrant layouts)
            ||
     [ Dynamic JS Actions ] <-- State logic, user click chime, API requests
      `
    }
  },

  // Math (Grade 12 Prebuilt)
  'g12_math': {
    'Chapter 1: Sequences and Series': {
      title: 'Chapter 1: Sequences and Series',
      intro: 'Explore mathematical sequences, arithmetic progressions, geometric ratios, and mathematical induction techniques used in national entrance exams.',
      sections: [
        {
          title: '1. Arithmetic Progressions (AP)',
          body: 'A sequence where the difference between consecutive terms is constant (d). The n-th term is given by a_n = a_1 + (n - 1)d.'
        },
        {
          title: '2. Geometric Progressions (GP)',
          body: 'A sequence where each term is found by multiplying the previous term by a constant ratio (r). The n-th term is given by g_n = g_1 * r^(n-1).'
        }
      ],
      formulas: [
        { name: 'n-th term of AP', formula: 'a_n = a_1 + (n - 1)d', description: 'Calculates specific values in arithmetic intervals.' },
        { name: 'Sum of Infinite GP', formula: 'S_inf = a_1 / (1 - r)  where |r| < 1', description: 'Resolves continuous fractional steps summation.' }
      ],
      keyTerms: [
        { term: 'Sequence (ቅደም ተከተል)', definition: 'An ordered list of numbers following a clear mathematical rule.', amharic: 'ቅደም ተከተል' }
      ]
    }
  },
  'g12_civics': {
    'Chapter 1: Building a Democratic System': {
      title: 'Chapter 1: Building a Democratic System',
      intro: 'This chapter outlines the structures and procedures of democratic federalism in Ethiopia, highlighting constitutional development and democratic principles.',
      sections: [
        {
          title: '1. Defining Democratic Principles',
          body: 'Democracy requires sovereign power to reside in the citizens, implemented through representative or direct participation. Human and democratic rights must be codified and protected.'
        },
        {
          title: '2. The Ethiopian Federal Model',
          body: 'Ethiopia employs an ethnic-linguistic federal system aimed at accommodating diversity while fostering national unity. Powers are split between the federal government and regional states.'
        }
      ],
      keyTerms: [
        { term: 'Democracy (ዲሞክራሲ)', definition: 'A system of government where power is vested in the people.', amharic: 'ዲሞክራሲ' },
        { term: 'Federalism (ፌዴራሊዝም)', definition: 'A political organization dividing power between local and national governments.', amharic: 'ፌዴራሊዝም' }
      ]
    }
  },
  'uni_civics': {
    'Chapter 1: Understanding Civics, Morality, and Ethics': {
      title: 'Chapter 1: Understanding Civics, Morality, and Ethics',
      intro: 'An academic exploration of the ethical theories, moral obligations, and constitutional rights that govern relationships between citizens and the state.',
      sections: [
        {
          title: '1. Theories of Morality and Ethics',
          body: 'Philosophers distinguish between Deontological (duty-based) and Teleological/Utilitarian (consequence-based) moral frameworks. Professional ethics require impartiality and civic virtue.'
        }
      ],
      keyTerms: [
        { term: 'Ethics (ስነ-ምግባር)', definition: 'Systematic concepts of right and wrong behaviors.', amharic: 'ስነ-ምግባር' }
      ]
    }
  },
  'uni_emerging_tech': {
    'Chapter 1: Introduction to Industry 4.0 & Digital Transformation': {
      title: 'Chapter 1: Introduction to Industry 4.0 & Digital Transformation',
      intro: 'Explore the fourth industrial revolution (4IR) and how advanced physical-cyber systems are revolutionizing modern industry, agriculture, and communication.',
      sections: [
        {
          title: '1. What is Industry 4.0?',
          body: 'Industry 4.0 integrates cyber-physical systems, IoT, real-time edge computing, cloud storage, and AI to automate manufacturing and optimize supply chains.'
        }
      ],
      keyTerms: [
        { term: 'Cyber-Physical Systems', definition: 'Mechanisms controlled or monitored by computer-based algorithms closely integrated with internet layers.' }
      ]
    }
  },
  'g12_amharic': {
    'Chapter 1: ስነ-ጽሁፍ እና ባህል (Literature & Culture)': {
      title: 'Chapter 1: ስነ-ጽሁፍ እና ባህል (Literature & Culture)',
      intro: 'ይህ ምዕራፍ ስለ አማርኛ ስነ-ጽሁፍ ታሪክ፣ ስለ ተለያዩ የስነ-ጽሁፍ ዘውጎች እና ከማህበረሰባዊ ባህል ጋር ስላላቸው ትስስር ያብራራል።',
      sections: [
        {
          title: '1. የስነ-ጽሁፍ ምንነትና አይነቶች',
          body: 'ስነ-ጽሁፍ በሰዎች አስተሳሰብ፣ ስሜትና ውበት ላይ ተመስርቶ በቃላት ጥበብ የሚገለጽ ጥበብ ነው። በሁለት ዋና ዋና ክፍሎች ይከፈላል፡ የፈጠራ ስራዎች (ልብ-ወለድ፣ ግጥም፣ ተውኔት) እና ታሪካዊ/አጠቃላይ ስራዎች።'
        },
        {
          title: '2. ባህልና ስነ-ጽሁፍ',
          body: 'የአንድ ማህበረሰብ ባህል፣ እምነት፣ ወግ እና ስነ-ምግባር በስነ-ጽሁፍ ውስጥ ይንጸባረቃሉ። ለምሳሌ የኢትዮጵያ ባህላዊ እሴቶች በሀገረሰብ ግጥሞች እና ተረቶች ውስጥ በሰፊው ይገኛሉ።'
        }
      ],
      keyTerms: [
        { term: 'ስነ-ጽሁፍ (Literature)', definition: 'በቃላት ውበትና ጥበብ ላይ ተመስርቶ ስሜትንና ሃሳብን የሚገልጽበት ጥበብ ነው።', amharic: 'ስነ-ጽሁፍ' },
        { term: 'ዘውግ (Genre)', definition: 'የስነ-ጽሁፍ ስራዎች የሚከፈሉበት ወይም የሚመደቡበት ዘይቤ (ልብ-ወለድ፣ ግጥም፣ ወዘተ)።', amharic: 'ዘውግ' }
      ],
      examAlert: 'ለማትሪክ ፈተና፡ የስነ-ጽሁፍ ዘውጎችን መለየት እና ባህላዊ ግጥሞችን መተንተን በፈተና ላይ በብዛት ይጠየቃሉ።'
    }
  }
};

/**
 * Returns detailed chapter information, falling back to a beautiful generic lesson plan
 * if specific content is not pre-populated.
 */
export function getChapterContent(moduleId: string, chapterTitle: string, contentJson?: string): ChapterTextContent {
  const fileKey = moduleId;

  if (contentJson) {
    try {
      const parsed = JSON.parse(contentJson);
      // Let's check both case versions of parsed key, or direct matches
      if (parsed[chapterTitle]) {
        return parsed[chapterTitle];
      }
      // If we have keys like "Chapter 1" instead of the full title, check partial matches
      const matchedKey = Object.keys(parsed).find(k => chapterTitle.toLowerCase().startsWith(k.toLowerCase()) || k.toLowerCase().startsWith(chapterTitle.toLowerCase()));
      if (matchedKey && parsed[matchedKey]) {
        return parsed[matchedKey];
      }
    } catch (e) {
      console.warn("Could not parse dynamic textbook content_json:", e);
    }
  }
  
  if (TEXTBOOK_CHAPTERS[fileKey] && TEXTBOOK_CHAPTERS[fileKey][chapterTitle]) {
    return TEXTBOOK_CHAPTERS[fileKey][chapterTitle];
  }

  // Fallback to a highly sophisticated academic dynamic lesson content generator
  const subjectName = moduleId.replace('g12_new_', '').replace('g12_', '').replace('uni_', '').toUpperCase();
  
  return {
    title: chapterTitle,
    intro: `Welcome to high-fidelity EdTech companion notes for "${chapterTitle}". This segment corresponds to the latest academic syllabus approved by the Ministry of Education.`,
    sections: [
      {
        title: `1. Core Overview of ${chapterTitle}`,
        body: `This text segment analyzes the foundational laws, frameworks, and scientific principles dictating this academic core topic. Review this section block-by-block with your AI Tutor to extract critical matric question targets.`
      },
      {
        title: "2. Strategic High Value Notes",
        body: "Ensure that you draft a summary table listing primary features, differences, or sub-topics. Focus heavily on experimental traps and mathematical steps discussed in class lectures."
      }
    ],
    keyTerms: [
      { term: 'Syllabus (ካሪኩለም)', definition: 'The official course blueprint summarizing topics, lessons, and academic thresholds.', amharic: 'ሲላበስ' },
      { term: 'Analysis (ትንተና)', definition: 'Deconstructing complex concepts into bite-sized systems for rigorous understanding.', amharic: 'ትንተና' }
    ],
    asciiDiagram: `
     ===========================================
     |           ETHIOLEARN ACADEMIC STUDY-PAD  |
     |           Chapter Module Under Review     |
     ===========================================
     |  [ Concept ] ====> [ Synthesis ] ==> OK  |
     ===========================================
    `,
    examAlert: `QUICK NOTE: This chapter is heavily tested in national examinations. Write mock questions or press the "Custom Exam" button on the side to create an interactive MCQ quiz for this topic!`
  };
}
