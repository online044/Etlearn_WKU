import { AuthenticCurriculumQuestion } from './mathQuestions';

export const AUTHENTIC_CPP_QUESTIONS_WKU_1011: AuthenticCurriculumQuestion[] = [
  // ─── UNIT 1: INTRODUCTION, DATA TYPES & BASICS ───
  {
    questionText: "What is the output of the following valid C++ program snippet?\n\nint a = 17, b = 5;\ncout << a / b << \" \" << a % b;",
    options: [
      "3 2",
      "3.4 2",
      "3 0",
      "3.4 0"
    ],
    correctIndex: 0,
    topic: "Integer Division & Modulus Operators",
    unit: "Unit 1",
    chapter: "Chapter 1: C++ Syntax & Data Types",
    difficulty: "easy",
    explanation: "In C++, dividing two integers performs integer division where the fractional part is truncated: 17 / 5 = 3. The modulo operator % returns the integer remainder: 17 % 5 = 2. Thus the output is '3 2'.",
    amharicExplanation: "በ C++ ሁለት ኢንቲጀሮች ሲካፈሉ ክፍልፋዩ ተትቶ ኢንቲጀር ብቻ ይቀራል (17 / 5 = 3)። የቀሪው ምልክት % ደግሞ ቀሪውን ያወጣል (17 % 5 = 2)። ስለዚህ ውጤቱ '3 2' ነው።"
  },
  {
    questionText: "Which stage of the standard C++ compilation process is responsible for resolving header file directives like #include <iostream> and expanding macros?",
    options: [
      "Preprocessing stage",
      "Compilation (syntax analysis) stage",
      "Assembly stage",
      "Linking stage"
    ],
    correctIndex: 0,
    topic: "C++ Compilation Pipeline",
    unit: "Unit 1",
    chapter: "Chapter 1: Compilation Pipeline",
    difficulty: "easy",
    explanation: "The C++ Preprocessor runs before actual compilation. It processes all lines beginning with '#' such as #include and #define, stripping comments and preparing the raw translation unit.",
    amharicExplanation: "የ C++ ፕሪፕሮሰሰር (Preprocessor) #include እና #define ያሉ ትዕዛዞችን ከትክክለኛው ኮምፓይለር በፊት የሚያከናውን የመጀመሪያ ደረጃ ነው።"
  },
  {
    questionText: "Which of the following variable declarations in C++ represents a valid identifier according to language naming rules?",
    options: [
      "_student_Score2",
      "2nd_semester_grade",
      "float",
      "student-id"
    ],
    correctIndex: 0,
    topic: "Identifier Naming Rules",
    unit: "Unit 1",
    chapter: "Chapter 1: Variables & Constants",
    difficulty: "easy",
    explanation: "Identifiers in C++ can start with an underscore '_' or a letter, but cannot start with a digit (eliminating 2nd_semester_grade), cannot contain hyphens (student-id), and cannot be reserved keywords (float).",
    amharicExplanation: "በ C++ ተለዋዋጭ ስሞች በፊደል ወይም በ '_' ሊጀምሩ ይችላሉ፤ በቁጥር መጀመር ወይም የቋንቋው ቁልፍ ቃላት (እንደ float) መሆን አይችሉም።"
  },

  // ─── UNIT 2: OPERATORS, EXPRESSIONS & PRECEDENCE ───
  {
    questionText: "Given the following C++ code:\n\nint x = 5;\nint y = ++x * 2;\nint z = x++ * 2;\n\nWhat are the values of y and z respectively?",
    options: [
      "y = 12, z = 12",
      "y = 12, z = 14",
      "y = 10, z = 12",
      "y = 10, z = 14"
    ],
    correctIndex: 0,
    topic: "Prefix and Postfix Increment Evaluation",
    unit: "Unit 2",
    chapter: "Chapter 1: Operators & Precedence",
    difficulty: "medium",
    explanation: "Initially x = 5. In '++x * 2', prefix ++ increments x to 6 immediately, so y = 6 * 2 = 12. Then in 'x++ * 2', postfix uses the current value of x (which is 6) for multiplication: z = 6 * 2 = 12, and then x is incremented to 7. Thus both y and z equal 12.",
    amharicExplanation: "መጀመሪያ ++x xን ወዲያው ወደ 6 ያሳድገዋል፣ y = 6 * 2 = 12። በመቀጠል x++ የነበረውን 6 ተጠቅሞ z = 6 * 2 = 12 ያደርጋል፣ ከዚያ በኋላ x ወደ 7 ያድጋል።"
  },
  {
    questionText: "Consider the following expression in C++:\n\nint result = 5 + 3 * 2 > 10 && 4 != 4;\n\nWhat is the boolean evaluation stored in result?",
    options: [
      "0 (false)",
      "1 (true)",
      "11",
      "Compilation syntax error"
    ],
    correctIndex: 0,
    topic: "Operator Precedence & Short-Circuiting",
    unit: "Unit 2",
    chapter: "Chapter 1: Logical Expressions",
    difficulty: "medium",
    explanation: "By operator precedence: multiplication first: 3 * 2 = 6; addition next: 5 + 6 = 11; relational: 11 > 10 is true (1); relational: 4 != 4 is false (0); logical AND: 1 && 0 evaluates to 0 (false).",
    amharicExplanation: "በቅድመ-ተከተል መሠረት፡ ማባዛት (3*2=6)፣ መደመር (5+6=11)፣ 11 > 10 (እውነት)፣ እና 4 != 4 (ሐሰት)። በእውነት እና በሐሰት መካከል ያለው && ውጤቱ 0 (false) ይሆናል።"
  },

  // ─── UNIT 3: CONTROL STRUCTURES & LOOPS ───
  {
    questionText: "What is printed to standard output by the following C++ switch structure?\n\nint grade = 2;\nswitch(grade) {\n    case 1: cout << \"A \";\n    case 2: cout << \"B \";\n    case 3: cout << \"C \";\n    default: cout << \"D \";\n}",
    options: [
      "B C D ",
      "B ",
      "B C ",
      "D "
    ],
    correctIndex: 0,
    topic: "Switch Case Fall-Through Behavior",
    unit: "Unit 3",
    chapter: "Chapter 1: Decision Structures",
    difficulty: "medium",
    explanation: "Because there are no 'break' statements following each case, execution falls through from case 2 all the way down through case 3 and default. Hence 'B ', 'C ', and 'D ' are all printed.",
    amharicExplanation: "በየኬሱ መጨረሻ 'break' ስለሌለ ከ case 2 ጀምሮ ወደ ታች ያሉትን ሁሉ (case 3 እና default) በማለፍ 'B C D ' ያትማል።"
  },
  {
    questionText: "How many times does the following loop body execute?\n\nint count = 10;\ndo {\n    count += 2;\n} while (count < 5);",
    options: [
      "Exactly 1 time",
      "0 times",
      "5 times",
      "Infinite loop"
    ],
    correctIndex: 0,
    topic: "Do-While Loop Execution Guarantees",
    unit: "Unit 3",
    chapter: "Chapter 2: Repetition Structures",
    difficulty: "easy",
    explanation: "A do-while loop is an exit-controlled loop that always executes its body at least once before checking the condition. Count becomes 12, then (12 < 5) evaluates to false, terminating the loop after 1 execution.",
    amharicExplanation: "የ do-while ሉፕ መፈተሻው መጨረሻ ላይ ስለሆነ ሁልጊዜም ቢያንስ 1 ጊዜ ይፈጸማል። 10 ወደ 12 ካደገ በኋላ ሁኔታው (12 < 5) ሐሰት ስለሆነ ወዲያው ይቆማል።"
  },
  {
    questionText: "What is printed by this nested loop snippet?\n\nfor(int i = 0; i < 3; i++) {\n    for(int j = i; j < 3; j++) {\n        cout << \"*\";\n    }\n}",
    options: [
      "****** (6 asterisks)",
      "********* (9 asterisks)",
      "*** (3 asterisks)",
      "***** (5 asterisks)"
    ],
    correctIndex: 0,
    topic: "Nested Loops & Triangular Iterations",
    unit: "Unit 3",
    chapter: "Chapter 2: Nested Loops",
    difficulty: "medium",
    explanation: "When i = 0: j runs from 0 to 2 (3 stars). When i = 1: j runs from 1 to 2 (2 stars). When i = 2: j runs from 2 to 2 (1 star). Total stars = 3 + 2 + 1 = 6.",
    amharicExplanation: "i = 0 ሲሆን 3 ጊዜ፣ i = 1 ሲሆን 2 ጊዜ፣ i = 2 ሲሆን 1 ጊዜ ይሽከረከራል። ድምር = 3 + 2 + 1 = 6 ኮከቦች ይታተማሉ።"
  },

  // ─── UNIT 4: FUNCTIONS & PARAMETER PASSING ───
  {
    questionText: "What will be the output of the following C++ code?\n\nvoid swapValues(int &x, int y) {\n    x += 10;\n    y += 10;\n}\n\nint main() {\n    int a = 5, b = 5;\n    swapValues(a, b);\n    cout << a << \" \" << b;\n    return 0;\n}",
    options: [
      "15 5",
      "15 15",
      "5 5",
      "5 15"
    ],
    correctIndex: 0,
    topic: "Pass-by-Reference vs Pass-by-Value",
    unit: "Unit 4",
    chapter: "Chapter 1: Parameter Passing",
    difficulty: "medium",
    explanation: "Variable 'a' is passed by reference (int &x), meaning changes made to x modify the caller's variable a directly (5 + 10 = 15). Variable 'b' is passed by value (int y), so changes only affect a local copy. Thus a = 15 and b = 5.",
    amharicExplanation: "ተለዋዋጭ 'a' በሪፈረንስ (&x) ስለተላከ ዋጋው ወደ 15 ይቀየራል፤ 'b' ደግሞ በቫልዩ (ኮፒ) ስለተላከ በዋናው ፋንክሽን ውስጥ 5 ሆኖ ይቀራል።"
  },
  {
    questionText: "Which of the following function prototypes demonstrates valid function overloading in C++?",
    options: [
      "double compute(int x); and double compute(double x);",
      "int compute(int x); and double compute(int x);",
      "void compute(int x, int y = 0); and void compute(int x);",
      "int compute(int a); and int compute(int b);"
    ],
    correctIndex: 0,
    topic: "Function Overloading Signature Rules",
    unit: "Unit 4",
    chapter: "Chapter 1: Function Overloading",
    difficulty: "medium",
    explanation: "Function overloading requires a distinct parameter list (different types or number of parameters). Changing only the return type is insufficient. In option A, the parameter type changes from int to double, making it valid.",
    amharicExplanation: "በ C++ ፈንክሽን ኦቨርሎዲንግ ለማድረግ የፓራሜትሮቹ አይነት ወይም ብዛት መለያየት አለበት። የተመላሽ አይነት (Return type) ብቻ መቀየር አይበቃም።"
  },

  // ─── UNIT 5: ARRAYS, POINTERS & STRUCTURES ───
  {
    questionText: "What is the output of the following pointer arithmetic in C++?\n\nint numbers[] = {10, 20, 30, 40, 50};\nint *ptr = numbers + 2;\ncout << *(ptr + 1) << \" \" << *(ptr - 1);",
    options: [
      "40 20",
      "30 20",
      "40 10",
      "50 30"
    ],
    correctIndex: 0,
    topic: "Pointers & Array Arithmetic",
    unit: "Unit 5",
    chapter: "Chapter 1: Pointer Arithmetic",
    difficulty: "hard",
    explanation: "Array 'numbers' decays to pointer to element 0 (10). 'numbers + 2' points to index 2 (30). Then *(ptr + 1) accesses index 3 (40), and *(ptr - 1) accesses index 1 (20). Output is '40 20'.",
    amharicExplanation: "ptr በ numbers + 2 ላይ 30 ን ያሳያል። *(ptr + 1) ወደ ፊት ሄዶ 40ን ሲያገኝ፣ *(ptr - 1) ደግሞ ወደ ኋላ ተመልሶ 20ን ያገኛል (40 20)።"
  },
  {
    questionText: "Which C++ dynamic memory statement correctly deallocates an array of integers previously allocated with: int *arr = new int[50];?",
    options: [
      "delete[] arr;",
      "delete arr;",
      "free(arr[]);",
      "delete[50] arr;"
    ],
    correctIndex: 0,
    topic: "Dynamic Memory Management with new/delete",
    unit: "Unit 5",
    chapter: "Chapter 2: Dynamic Allocation",
    difficulty: "easy",
    explanation: "Memory allocated using array new 'new T[N]' must always be released using array delete 'delete[] pointer;'. Using single 'delete' causes undefined behavior.",
    amharicExplanation: "በ 'new int[50]' የተፈጠረ አሬይ ማህደረ-ትውስታ ሁልጊዜም በ 'delete[] arr;' መለቀቅ አለበት።"
  },
  {
    questionText: "Given the struct definition:\n\nstruct Student {\n    int id;\n    char name[30];\n    double gpa;\n};\nStudent s1 = {101, \"Alemayehu\", 3.85};\nStudent *p = &s1;\n\nHow do you access the student's GPA through the pointer p?",
    options: [
      "p->gpa",
      "p.gpa",
      "*p.gpa",
      "p->*gpa"
    ],
    correctIndex: 0,
    topic: "Structures & Arrow Operator",
    unit: "Unit 5",
    chapter: "Chapter 2: Structs & Pointers",
    difficulty: "easy",
    explanation: "In C++, members of a structure accessed through a pointer use the arrow operator (p->gpa), which is syntactic sugar for (*p).gpa.",
    amharicExplanation: "በፖይንተር በኩል የስትራክት አባላትን (Members) ለማግኘት የአሮው ኦፕሬተር (p->gpa) ጥቅም ላይ ይውላል።"
  },
  {
    questionText: "Which C++ file mode flag appends new data to the end of an existing file without overwriting existing content when using ofstream?",
    options: [
      "ios::app",
      "ios::out",
      "ios::trunc",
      "ios::ate"
    ],
    correctIndex: 0,
    topic: "File Streams & I/O Modes",
    unit: "Unit 5",
    chapter: "Chapter 2: File I/O",
    difficulty: "medium",
    explanation: "ios::app (append mode) positions file writing operations at the end of the file, preserving existing content.",
    amharicExplanation: "ios::app (Append mode) አዳዲስ መረጃዎችን ከነባሩ ፋይል መጨረሻ ላይ ያለምንም መደለዝ ለመጨመር ያገለግላል።"
  },
  {
    questionText: "What is the primary difference between a 'struct' and a 'class' in C++?",
    options: [
      "In a struct, members are public by default; in a class, members are private by default",
      "Structs cannot have member functions or methods, while classes can",
      "Structs are allocated exclusively on the stack, while classes are always on the heap",
      "Structs cannot participate in inheritance hierarchies"
    ],
    correctIndex: 0,
    topic: "Object-Oriented Programming: Struct vs Class",
    unit: "Unit 5",
    chapter: "Chapter 3: Classes & Encapsulation",
    difficulty: "easy",
    explanation: "In C++, the only fundamental distinction between a class and a struct is default access specifier: struct members and base classes are public by default, whereas class members and base classes are private by default.",
    amharicExplanation: "በ C++ ውስጥ በክላስ እና በስትራክት መካከል ያለው ብቸኛው መሰረታዊ ልዩነት፡ በስትራክት ውስጥ አባላት በነባሪነት (Default) public ሲሆኑ፣ በክላስ ውስጥ ግን private ናቸው።"
  },
  {
    questionText: "Which constructor is automatically invoked when an existing object is used to initialize a new object of the same class (e.g. MyClass b = a;)?",
    options: [
      "Copy Constructor",
      "Default Constructor",
      "Parameterized Constructor",
      "Move Assignment Operator"
    ],
    correctIndex: 0,
    topic: "Constructors & Copy Semantics",
    unit: "Unit 5",
    chapter: "Chapter 3: Constructors & Destructors",
    difficulty: "medium",
    explanation: "A copy constructor (having the signature MyClass(const MyClass &other)) is invoked when initializing a new object from an existing instance of the same class.",
    amharicExplanation: "አንድን ነባር ኦብጀክት በመጠቀም አዲስ ኦብጀክት ስናዘጋጅ (Copy initialization) ኮፒ ኮንስትራክተር (Copy Constructor) በራሱ ይጠራል።"
  },
  {
    questionText: "What does the declaration 'const int *ptr;' represent in C++?",
    options: [
      "A pointer to a constant integer (the integer value cannot be changed via ptr, but ptr can point elsewhere)",
      "A constant pointer to an integer (ptr cannot point elsewhere, but the integer can be changed)",
      "A constant pointer to a constant integer (neither can be modified)",
      "A syntax error in modern C++"
    ],
    correctIndex: 0,
    topic: "Pointers & Const Qualifiers",
    unit: "Unit 4",
    chapter: "Chapter 1: Pointers & Modifiers",
    difficulty: "medium",
    explanation: "Read right-to-left: ptr is a pointer to a const int. The value *ptr cannot be modified (*ptr = 10 is illegal), but ptr itself can be reassigned to another address (ptr = &y is legal).",
    amharicExplanation: "'const int *ptr' ማለት ወደ ቋሚ ኢንቲጀር የሚያመለክት ፖይንተር ሲሆን፣ የኢንቲጀሩን ዋጋ በፖይንተሩ መቀየር አይቻልም፤ ፖይንተሩን ግን ወደ ሌላ አድራሻ ማዞር ይቻላል።"
  },
  {
    questionText: "What is the time complexity of searching for an element in a sorted array of size N using binary search?",
    options: [
      "O(log N)",
      "O(N)",
      "O(N log N)",
      "O(1)"
    ],
    correctIndex: 0,
    topic: "Algorithms & Search Complexity",
    unit: "Unit 4",
    chapter: "Chapter 2: Arrays & Searching",
    difficulty: "easy",
    explanation: "Binary search repeatedly divides the sorted search space in half. The maximum number of comparisons required for N elements is log₂(N), giving logarithmic time complexity O(log N).",
    amharicExplanation: "ባይነሪ ሰርች (Binary search) በተደረደረ አሬይ ውስጥ በየደረጃው የፍለጋ ቦታውን በግማሽ ስለሚከፍለው የጊዜ ውስብስብነቱ O(log N) ይሆናል።"
  }
];
