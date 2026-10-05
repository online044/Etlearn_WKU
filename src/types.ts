/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_semester' | 'pro_annual' | 'exam_season_pass' | 'subject_bundle';
export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'none';
export type PaymentProvider = 'telebirr' | 'cbe_birr' | 'chapa' | 'santim_pay' | 'manual';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface SubscriptionRecord {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  subjectBundleId?: string;
  startDate: string;
  endDate?: string;
  paymentMethod: PaymentProvider;
  autoRenew: boolean;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  originalAmount?: number;
  couponCode?: string;
  discountETB?: number;
  currency: string;
  provider: PaymentProvider;
  providerTxnId: string;
  senderName: string;
  senderPhone?: string;
  receiptImage?: string; // Base64 data URL or image preview URL of receipt
  agreedToTerms?: boolean;
  status: PaymentStatus;
  createdAt: string;
}

export interface FeatureUsageRecord {
  userId: string;
  featureType: 'ai_tutor_queries' | 'quiz_attempts' | 'pdf_downloads';
  count: number;
  resetAt: string; // ISO Date String
}

export interface AccountInfo {
  email?: string;
  phone?: string;
  passwordEncrypted: string;
  rememberMe: boolean;
  profile: StudentProfile;
  lastSignInAt?: string;
  lastSignOutAt?: string;
}

export interface AuthSessionRecord {
  id: string;
  type: 'signin' | 'signout';
  email: string;
  name?: string;
  userId?: string;
  timestamp: string; // ISO String
  formattedTime: string; // Human readable
  ethDate: string; // Ethiopian calendar date
  device?: string;
  durationMinutes?: number;
}

export interface SupabaseProfileRecord {
  id?: string;
  firebase_uid: string;
  full_name: string;
  email: string;
  phone?: string;
  university?: string;
  department?: string;
  year_level?: string;
  profile_photo?: string;
  subscription_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentProfile {
  id?: string;
  name: string;
  email?: string;
  university: string;
  year: string;
  grade?: string;
  stream?: string;
  subjects: string[];
  claudeApiKey: string;
  dailyGoalHours: number;
  theme: 'dark' | 'light' | 'auto';
  language: 'en' | 'am' | 'both';
  textSize?: 'normal' | 'moderate' | 'large' | 'xlarge';
  avatar?: string; // Preset name or Base64 string of student photo
  phone?: string;
  isRegistered?: boolean;
  unregisteredAICredits?: number;
  // Premium subscription details
  isPro?: boolean;
  tier?: SubscriptionTier;
  proStatus?: 'none' | 'trial' | 'pending' | 'active' | 'expired';
  subscription_status?: string;
  proPaymentTxn?: string;
  proPaymentDate?: string;
  proStartDate?: string;
  proEndDate?: string;
  purchasedBundles?: string[]; // Array of subject bundle IDs purchased
  senderName?: string;
  proPaymentPhone?: string;
  paymentMethod?: PaymentProvider;
  proReceiptImage?: string; // Base64 data string or image URL of payment receipt
  agreedToTerms?: boolean;
  agreedToTermsDate?: string;
  telegramId?: string;
  telegramUsername?: string;
  department?: string;
  firebaseUid?: string;
  emailVerified?: boolean;
  targetGpa?: string;
  bio?: string;
  idCardTheme?: 'gold' | 'emerald' | 'navy' | 'purple';
  referralCode?: string;
  referredBy?: string;
  userRole?: 'student' | 'instructor' | 'admin' | 'super_admin';
  // Profile View Customization Preferences
  profilePreferences?: ProfileCustomizationPreferences;
  // Session audit trail - Never forget when students sign in and sign out
  lastSignInAt?: string;
  lastSignOutAt?: string;
  firstSignInAt?: string;
  signInCount?: number;
  lastSessionDurationMinutes?: number;
}

export type ProfileCardLayoutStyle = 'compact' | 'detailed';
export type ProfileAccentTheme = 'gold' | 'emerald' | 'blue' | 'purple' | 'rose' | 'amber';
export type ProfileRenderMode = 'system' | 'dark' | 'light';
export type ModulesDisplayMode = 'cloud' | 'list' | 'grid';
export type ProfileSectionKey = 'academic' | 'modules' | 'analytics' | 'billing' | 'security';
export type ProfileQuickActionKey = 'academic' | 'analytics' | 'billing' | 'security';

export interface ProfileCustomizationPreferences {
  cardLayout: ProfileCardLayoutStyle;
  coverBannerUrl?: string; // Preset key or custom data URL / image URL
  accentColor: ProfileAccentTheme;
  renderMode: ProfileRenderMode;
  selectedBadgeTitle?: string; // Custom or tier-based chosen badge
  visibleFields: {
    email: boolean;
    institution: boolean;
    department: boolean;
    targetGpa: boolean;
    bio: boolean;
  };
  sectionOrder: ProfileSectionKey[];
  sectionVisibility: Record<ProfileSectionKey, boolean>;
  collapsedSections: Record<string, boolean>; // section id -> collapsed
  modulesDisplayMode: ModulesDisplayMode;
  pinnedModules: string[]; // Subject names pinned to top
  quickActionsOrder: ProfileQuickActionKey[];
  quickActionsVisibility: Record<ProfileQuickActionKey, boolean>;
}

export interface CouponCode {
  code: string;
  discountPercentage: number;
  fixedDiscountETB?: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  description?: string;
}

export interface Promotion {
  id?: string;
  code: string;
  title?: string;
  description?: string;
  discountPercentage: number;
  fixedDiscountETB?: number;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: string;
  isActive: boolean;
  applicableTiers?: SubscriptionTier[];
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  date: string;
  badgeText?: string;
  isImportant?: boolean;
  status?: 'draft' | 'published' | 'archived';
  createdAt?: string;
}

export type CourseStatus = 'draft' | 'published' | 'archived';

export interface CourseRecord {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: 'Grade 12' | 'University' | 'Grade 12 New Curriculum' | 'Common Courses';
  status: CourseStatus;
  lessonsCount: number;
  goalDays: number;
  instructorId?: string;
  instructorName?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonRecord {
  id: string;
  courseId: string;
  title: string;
  chapterNumber: number;
  content: string;
  duration: string;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LessonResource {
  id: string;
  title: string;
  type: 'pdf' | 'summary' | 'cheat_sheet' | 'exercise';
  url?: string;
  size?: string;
}

export interface LessonRecord {
  id: string;
  courseId: string;
  title: string;
  chapterNumber: number;
  unitTitle?: string;
  content: string;
  duration: string;
  videoUrl?: string;
  audioUrl?: string;
  resources?: LessonResource[];
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentCourseProgress {
  courseId: string;
  completedLessonIds: string[];
  lastAccessedLessonId?: string;
  progressPercentage: number;
  totalLessons: number;
  completedLessonsCount: number;
  lastUpdated: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer';

export interface ExamQuestion {
  id: number | string;
  question?: string;
  text?: string;
  questionNumber?: number;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject?: string;
  topic?: string;
  subjectTopic?: string;
  unitName?: string;
  questionType?: QuestionType;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ExamPaper {
  id: string;
  title: string;
  subject: string;
  level: 'University' | 'Grade 12' | 'Common Courses';
  university?: string;
  year?: string;
  durationMinutes: number;
  totalQuestions: number;
  passingPercentage?: number;
  passingScore?: number;
  instructions?: string;
  questions: ExamQuestion[];
  status?: 'published' | 'draft' | 'archived';
  description?: string;
}

export interface ExamAttemptRecord {
  id: string;
  userId?: string;
  examId: string;
  examTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  isPassed: boolean;
  timeSpentSeconds: number;
  userAnswers: { [questionId: string]: string };
  flaggedQuestions: (string | number)[];
  date: string;
  weakTopics: string[];
  incorrectQuestions?: Array<{
    id: string | number;
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    explanation: string;
    subjectTopic?: string;
  }>;
}

export type AITeacherMode = 'teaching' | 'quiz' | 'exam_feedback' | 'chat' | 'free_chat';

export interface AITeacherContext {
  mode: AITeacherMode;
  courseTitle?: string;
  lessonTitle?: string;
  lessonContent?: string;
  subject?: string;
  examErrors?: Array<{
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    explanation: string;
    subjectTopic?: string;
  }>;
}

export interface SavedChatSession {
  id: string;
  title: string;
  subject: string;
  mode: AITeacherMode;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    attachment?: {
      name?: string;
      mimeType: string;
      data: string;
    };
    fileData?: {
      name?: string;
      mimeType: string;
      data: string;
    };
    timestamp?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  modelUsed?: string;
  summary?: string;
}

export interface AdminDashboardStats {
  totalStudents: number;
  publishedCourses: number;
  draftCourses: number;
  totalLessons: number;
  publishedBooks?: number;
  draftBooks?: number;
  publishedExams?: number;
  draftExams?: number;
  totalRevenueETB: number;
  pendingPaymentsCount: number;
  totalPaymentsCount: number;
  activeAnnouncementsCount: number;
  activeCouponsCount: number;
  recentActivity: {
    id: string;
    type: 'user_registered' | 'course_published' | 'course_created' | 'payment_received' | 'announcement_posted' | 'book_published' | 'exam_published';
    title: string;
    description: string;
    timestamp: string;
  }[];
}

export type ContentAccessLevel = 'free' | 'pro';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type ExamType = 'midterm' | 'final' | 'model' | 'quiz' | 'exit_exam';

export interface BookRecord {
  id: string;
  title: string;
  description: string;
  university: string;
  department: string;
  academicYear: string;
  course: string;
  subject: string;
  unit: string;
  accessLevel: ContentAccessLevel;
  allowDownload: boolean;
  status: ContentStatus;
  pdfUrl?: string;
  pdfStoragePath?: string;
  coverUrl?: string;
  coverStoragePath?: string;
  fileSize?: number;
  pageCount?: number;
  downloadsCount?: number;
  viewsCount?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type FirestoreBook = BookRecord;

export interface FirestoreChapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  intro?: string;
  sections: Array<{ title: string; body: string }>;
  asciiDiagram?: string;
  formulas?: Array<{ name: string; formula: string; description: string }>;
  examAlert?: string;
  summary?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FirestoreExam {
  id: string;
  title: string;
  description?: string;
  university: string;
  department: string;
  academicYear: string;
  course: string;
  subject: string;
  examType: ExamType;
  examYear: string;
  durationMinutes: number;
  totalMarks?: number;
  passingScore: number;
  totalQuestions: number;
  accessLevel: ContentAccessLevel;
  allowDownload: boolean;
  status: ContentStatus;
  pdfUrl?: string;
  pdfStoragePath?: string;
  fileSize?: number;
  pageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  textAmharic?: string;
}

export interface FirestoreQuestion {
  id: string;
  examId: string;
  subject?: string;
  questionNumber: number;
  text: string;
  textAmharic?: string;
  options: QuestionOption[];
  correctAnswerId: string;
  explanation: string;
  explanationAmharic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  createdAt: string;
}

export interface FirestoreResult {
  id: string;
  userId: string;
  examId: string;
  examTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctAnswers?: number;
  percentage: number;
  passed?: boolean;
  isPassed?: boolean;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  timeSpentSeconds: number;
  answers?: { [questionId: string]: string };
  userAnswers?: { [questionId: string]: string };
  flaggedQuestions?: string[];
  weakTopics?: string[];
  incorrectQuestions?: any[];
  completedAt?: string;
  createdAt: string;
}

export interface FirestoreUser {
  id: string;
  email?: string;
  name: string;
  university: string;
  department: string;
  year: string;
  subjects: string[];
  studyStreak: number;
  totalStudyMinutes: number;
  isPro: boolean;
  theme?: 'dark' | 'light' | 'auto';
  language?: 'en' | 'am' | 'both';
  createdAt: string;
  updatedAt: string;
}

export interface ExamSheetRecord {
  id: string;
  title: string;
  description: string;
  university: string;
  department: string;
  academicYear: string;
  course: string;
  subject: string;
  examType: ExamType;
  examYear: string;
  accessLevel: ContentAccessLevel;
  allowDownload: boolean;
  status: ContentStatus;
  pdfUrl: string;
  pdfStoragePath?: string;
  fileSize?: number;
  pageCount?: number;
  downloadsCount?: number;
  viewsCount?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteRecord {
  id: string;
  title: string;
  description: string;
  university: string;
  department: string;
  academicYear: string;
  course: string;
  subject: string;
  unit: string;
  content: string;
  accessLevel: ContentAccessLevel;
  allowDownload: boolean;
  status: ContentStatus;
  pdfUrl?: string;
  pdfStoragePath?: string;
  fileSize?: number;
  tags?: string[];
  author?: string;
  downloadsCount?: number;
  viewsCount?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type FirestoreStudyNote = NoteRecord;

export interface NoteFilters {
  university?: string;
  department?: string;
  academicYear?: string;
  course?: string;
  subject?: string;
  accessLevel?: string;
  search?: string;
  status?: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty?: string;
  explanation?: string;
  // SM-2 Spaced Repetition Fields
  interval: number; // in days
  repetition: number;
  easeFactor: number;
  dueDate: string; // ISO string
}

export interface Deck {
  id: string;
  title: string;
  subject: string;
  cards: Flashcard[];
}

export interface CustomNote {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags?: string[];
  color: string; // Tailwind bg color class
  createdAt?: string;
  date?: string;
}

export interface ExamSession {
  id: string;
  subject: string;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionsCount: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  weakAreas: string[];
}

export interface StudySession {
  id: string;
  subject: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
}

export interface FlashcardReviewLog {
  date: string; // YYYY-MM-DD
  reviewedCount: number;
  correctCount: number;
}

export interface StudyTask {
  id: string;
  userId?: string;
  title: string;
  subject?: string;
  courseTitle?: string;
  durationMinutes?: number;
  duration?: string;
  isCompleted: boolean;
  type?: 'review' | 'quiz' | 'lesson' | 'reading';
  dueDate?: string;
  createdAt?: string;
}

export interface AppState {
  currentPage: string;
  profile: StudentProfile | null;
  streak: {
    current: number;
    highest: number;
    lastActiveDate: string | null;
  };
  customNotes: CustomNote[];
  examSessions: ExamSession[];
  studySessions: StudySession[];
  flashcardLogs: FlashcardReviewLog[];
  decksState: { [deckId: string]: Flashcard[] }; // Overrides / stores review state of cards in a deck
}

// ============================================================================
// QUESTION BANK SYSTEM TYPES (Supabase Pre-Generated & Central Question Storage)
// ============================================================================

export type BankQuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_the_blank';
export type BankDifficulty = 'easy' | 'medium' | 'hard';
export type BankExamCategory = 'practice_exam' | 'university_exam' | 'mock_exam' | 'quiz' | 'exit_exam';
export type BankQuestionSource = 'imported' | 'verified_past_paper' | 'faculty_authored' | 'sample_test';

export interface QuestionOptionItem {
  id: string;
  text: string;
}

export interface QuestionBankRecord {
  id: string;
  subject_id?: string;
  subject: string;
  course: string;
  unit: string;
  topic?: string;
  chapter?: string;
  module_id?: number;
  module_name?: string;
  question?: string; // alias to question_text
  question_text: string;
  question_type: BankQuestionType;
  options: string[];
  options_raw?: QuestionOptionItem[];
  correct_answer: string;
  explanation?: string;
  difficulty: BankDifficulty;
  exam_category: BankExamCategory;
  source?: string;
  source_unit?: string;
  source_file?: string;
  university?: string;
  department?: string;
  academic_year?: string;
  semester?: string;
  is_verified_official?: boolean;
  batch_id: string;
  fingerprint?: string;
  is_published: boolean;
  is_pro?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QuestionProgressRecord {
  id: string;
  user_id: string;
  question_id: string;
  attempts: number;
  correct_attempts: number;
  incorrect_attempts: number;
  last_answer?: string;
  is_bookmarked?: boolean;
  last_attempt_at: string;
}

export interface QuestionValidationIssue {
  index: number;
  question_text?: string;
  issue: string;
  severity: 'error' | 'warning';
}

export interface QuestionValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  readyToImport: QuestionBankRecord[];
  invalidDetails: QuestionValidationIssue[];
  duplicateDetails: Array<{ index: number; question_text: string; reason: string }>;
}

export interface QuestionBankStats {
  totalQuestions: number;
  publishedQuestions: number;
  unpublishedQuestions: number;
  batchCount: number;
  byCourse: { [course: string]: number };
  bySubject?: { [subject: string]: number };
  byUnit: { [unit: string]: number };
  byDifficulty: { easy: number; medium: number; hard: number };
  byType: {
    multiple_choice: number;
    true_false: number;
    short_answer: number;
    fill_in_the_blank: number;
  };
  byExamCategory: {
    practice_exam: number;
    university_exam: number;
    mock_exam: number;
    quiz: number;
  };
  byUniversity?: { [uni: string]: number };
}

export interface QuestionBankFilter {
  course?: string;
  subject?: string;
  unit?: string;
  difficulty?: string;
  questionType?: string;
  examCategory?: string;
  isPublished?: boolean | 'all';
  batchId?: string;
  isVerifiedOfficial?: boolean | 'all';
  search?: string;
  university?: string;
}

export interface UniversityQuestionItem {
  id: number;
  qText: string;
  choices: string[];
  correctIndex: number;
  subjectTopic?: string;
  explanation?: string;
  explanationAmharic?: string;
  amharicExplanation?: string;
  solutionProof?: string;
  sourceType?: 'official_past_exam' | 'ai_generated';
  year?: string;
  unit?: string;
  chapter?: string;
  difficulty?: string;
}

export interface ExamPaperSheet {
  id: string;
  title: string;
  university: string;
  year: string;
  subject: string;
  department?: string;
  durationMinutes: number;
  questions: any[];
}

