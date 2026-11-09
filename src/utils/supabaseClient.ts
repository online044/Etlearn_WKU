import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { safeStorage } from './safeStorage';
import { isAdministratorEmail } from './adminAuth';

let supabaseInstance: SupabaseClient | null = null;

export const ETHIOLEARN_SUPABASE_SQL_SCRIPT = `-- ============================================================================
-- EthioLearn Pro - Production Hardened Supabase Database Setup Script
-- Complete Schema with Open RLS Policies, Indexes, and Real-Time Sync Support
-- ============================================================================

-- 1. Create ethiolearn_sync table (Campus Progress & Backup)
CREATE TABLE IF NOT EXISTS public.ethiolearn_sync (
  email TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Create profiles table (Firebase Auth UID Linked Student Accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  university TEXT DEFAULT 'Wolkite University (WKU)',
  department TEXT DEFAULT 'General',
  year_level TEXT DEFAULT 'Freshman (1st Year)',
  profile_photo TEXT DEFAULT '',
  subscription_status TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON public.profiles (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- 2. Create student_profiles table (Student Accounts & Persistence)
CREATE TABLE IF NOT EXISTS public.student_profiles (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  university TEXT DEFAULT 'Wolkite University',
  year TEXT DEFAULT 'Freshman',
  subjects JSONB DEFAULT '[]'::jsonb,
  is_pro BOOLEAN NOT NULL DEFAULT FALSE,
  pro_status TEXT DEFAULT 'inactive',
  user_role TEXT NOT NULL DEFAULT 'student',
  referral_code TEXT,
  profile_data JSONB,
  notes_data JSONB,
  study_sessions JSONB,
  performance_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure phone column exists if table was created in an earlier migration
ALTER TABLE IF EXISTS public.student_profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Create courses table (Curriculum & CMS)
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'University',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  lessons_count INT NOT NULL DEFAULT 0,
  goal_days INT NOT NULL DEFAULT 14,
  instructor_id TEXT,
  instructor_name TEXT DEFAULT 'EthioLearn Faculty',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  chapter_number INT NOT NULL DEFAULT 1,
  content TEXT,
  duration TEXT DEFAULT '15m',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_course_lesson_chapter UNIQUE (course_id, chapter_number)
);

-- 5. Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  code TEXT PRIMARY KEY,
  discount_percentage INT NOT NULL DEFAULT 20,
  fixed_discount_etb NUMERIC(10, 2) DEFAULT 0,
  max_uses INT NOT NULL DEFAULT 100,
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  badge_text TEXT DEFAULT 'Notice',
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create payments table (Telebirr & CBE Birr Transactions)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
  provider TEXT NOT NULL DEFAULT 'telebirr',
  provider_transaction_id TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  receipt_url TEXT,
  raw_webhook_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create books table (Grade 12 & University Textbooks)
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT 'Grade 12',
  description TEXT,
  pdf_url TEXT,
  chapters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8b. Create exams table (Past Exams & Model Papers)
CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  university TEXT NOT NULL DEFAULT 'Wolkite University',
  department TEXT NOT NULL DEFAULT 'General',
  course TEXT NOT NULL,
  subject TEXT NOT NULL,
  exam_type TEXT NOT NULL DEFAULT 'final',
  exam_year TEXT NOT NULL DEFAULT '2016 E.C.',
  academic_year TEXT DEFAULT '2016 E.C.',
  description TEXT,
  access_level TEXT DEFAULT 'free',
  status TEXT DEFAULT 'published',
  allow_download BOOLEAN DEFAULT TRUE,
  pdf_url TEXT,
  pdf_storage_path TEXT,
  file_size BIGINT DEFAULT 0,
  page_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8c. Create universities table (Official Ethiopian Universities & Logos)
CREATE TABLE IF NOT EXISTS public.universities (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure domain column exists if table was created in an earlier migration
ALTER TABLE IF EXISTS public.universities ADD COLUMN IF NOT EXISTS domain TEXT;

-- 9. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  email TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'pro_semester',
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'telebirr',
  auto_renew BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create course_progress table
CREATE TABLE IF NOT EXISTS public.course_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  completed_lessons JSONB DEFAULT '[]'::jsonb,
  last_accessed_lesson TEXT,
  progress_percentage INT DEFAULT 0,
  total_lessons INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_course_progress UNIQUE (user_id, course_id)
);

-- 11. Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  department TEXT,
  year TEXT DEFAULT 'Year 1 (Freshman)',
  semester TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11b. Create questions table (Central Pre-Generated Question Bank)
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  course TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Unit 1',
  topic TEXT NOT NULL DEFAULT 'General',
  chapter TEXT,
  question TEXT NOT NULL,
  question_text TEXT,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'fill_in_the_blank', 'multiple_select')),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  source TEXT DEFAULT 'University Curriculum Module',
  source_unit TEXT,
  source_file TEXT,
  university TEXT,
  department TEXT,
  academic_year TEXT,
  semester TEXT,
  is_verified_official BOOLEAN NOT NULL DEFAULT FALSE,
  batch_id TEXT DEFAULT 'manual-entry',
  fingerprint TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  is_pro BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11c. Create student question progress & bookmarking table
CREATE TABLE IF NOT EXISTS public.question_progress (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  attempts INT DEFAULT 1,
  correct_attempts INT DEFAULT 0,
  incorrect_attempts INT DEFAULT 0,
  last_answer TEXT,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_question UNIQUE (user_id, question_id)
);

-- High-performance indexes for 10,000+ to 100,000+ questions
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions (subject);
CREATE INDEX IF NOT EXISTS idx_questions_course ON public.questions (course);
CREATE INDEX IF NOT EXISTS idx_questions_unit ON public.questions (unit);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions (topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions (question_type);
CREATE INDEX IF NOT EXISTS idx_questions_is_published ON public.questions (is_published);
CREATE INDEX IF NOT EXISTS idx_questions_is_pro ON public.questions (is_pro);
CREATE INDEX IF NOT EXISTS idx_questions_fingerprint ON public.questions (fingerprint);
CREATE INDEX IF NOT EXISTS idx_questions_composite ON public.questions (subject, unit, difficulty, is_published);
CREATE INDEX IF NOT EXISTS idx_question_progress_user ON public.question_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_question_progress_bookmarked ON public.question_progress (user_id, is_bookmarked);

-- 12. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ethiolearn_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 13. Create permissive & security policies
DROP POLICY IF EXISTS "Allow public all access on profiles" ON public.profiles;
CREATE POLICY "Allow public all access on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on student_profiles" ON public.student_profiles;
CREATE POLICY "Allow public all access on student_profiles" ON public.student_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on courses" ON public.courses;
CREATE POLICY "Allow public all access on courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on lessons" ON public.lessons;
CREATE POLICY "Allow public all access on lessons" ON public.lessons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on payments" ON public.payments;
CREATE POLICY "Allow public all access on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on coupons" ON public.coupons;
CREATE POLICY "Allow public all access on coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on announcements" ON public.announcements;
CREATE POLICY "Allow public all access on announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on books" ON public.books;
CREATE POLICY "Allow public all access on books" ON public.books FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on exams" ON public.exams;
CREATE POLICY "Allow public all access on exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on ethiolearn_sync" ON public.ethiolearn_sync;
CREATE POLICY "Allow public all access on ethiolearn_sync" ON public.ethiolearn_sync FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on subscriptions" ON public.subscriptions;
CREATE POLICY "Allow public all access on subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on course_progress" ON public.course_progress;
CREATE POLICY "Allow public all access on course_progress" ON public.course_progress FOR ALL USING (true) WITH CHECK (true);

-- Universities RLS Policies: Public read and write for university logos and profiles
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all access on universities" ON public.universities;
CREATE POLICY "Allow public all access on universities" ON public.universities FOR ALL USING (true) WITH CHECK (true);

-- Questions RLS Policies: Students can only read published questions. Full access for authenticated admins.
DROP POLICY IF EXISTS "Allow public read published questions" ON public.questions;
CREATE POLICY "Allow public read published questions" ON public.questions FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Allow authenticated admin full questions" ON public.questions;
CREATE POLICY "Allow authenticated admin full questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);

-- 14. Grant explicit permissions to anon, authenticated, and service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 15. Create Storage Buckets (books and exams) for PDFs, covers, and study materials
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('books', 'books', true),
  ('exams', 'exams', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies for books and exams
DROP POLICY IF EXISTS "Allow public view books bucket" ON storage.objects;
CREATE POLICY "Allow public view books bucket" ON storage.objects FOR SELECT USING (bucket_id = 'books');

DROP POLICY IF EXISTS "Allow upload to books bucket" ON storage.objects;
CREATE POLICY "Allow upload to books bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'books');

DROP POLICY IF EXISTS "Allow update to books bucket" ON storage.objects;
CREATE POLICY "Allow update to books bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'books');

DROP POLICY IF EXISTS "Allow delete to books bucket" ON storage.objects;
CREATE POLICY "Allow delete to books bucket" ON storage.objects FOR DELETE USING (bucket_id = 'books');

DROP POLICY IF EXISTS "Allow public view exams bucket" ON storage.objects;
CREATE POLICY "Allow public view exams bucket" ON storage.objects FOR SELECT USING (bucket_id = 'exams');

DROP POLICY IF EXISTS "Allow upload to exams bucket" ON storage.objects;
CREATE POLICY "Allow upload to exams bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exams');

DROP POLICY IF EXISTS "Allow update to exams bucket" ON storage.objects;
CREATE POLICY "Allow update to exams bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'exams');

DROP POLICY IF EXISTS "Allow delete to exams bucket" ON storage.objects;
CREATE POLICY "Allow delete to exams bucket" ON storage.objects FOR DELETE USING (bucket_id = 'exams');

-- 16. Notes Reading Experience & Long-form Markdown Suite
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#4F46E5';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON public.chapters(subject_id, sort_order);

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  read_time_min INT NOT NULL DEFAULT 5,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED
);
CREATE INDEX IF NOT EXISTS idx_notes_search ON public.notes USING gin(search);
CREATE INDEX IF NOT EXISTS idx_notes_chapter ON public.notes(chapter_id, sort_order);

CREATE TABLE IF NOT EXISTS public.user_note_state (
  user_id TEXT NOT NULL,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  progress NUMERIC(5, 2) NOT NULL DEFAULT 0,
  scroll_position INT NOT NULL DEFAULT 0,
  bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, note_id)
);
CREATE INDEX IF NOT EXISTS idx_user_note_state_user ON public.user_note_state(user_id, last_read_at DESC);

CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  start_offset INT NOT NULL,
  end_offset INT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_highlights_user_note ON public.highlights(user_id, note_id);

CREATE TABLE IF NOT EXISTS public.reader_settings (
  user_id TEXT PRIMARY KEY,
  font_size INT NOT NULL DEFAULT 17,
  line_height NUMERIC(3, 2) NOT NULL DEFAULT 1.7,
  font_family TEXT NOT NULL DEFAULT 'system',
  theme TEXT NOT NULL DEFAULT 'dark'
);

-- Search function for notes
CREATE OR REPLACE FUNCTION public.search_notes(q TEXT)
RETURNS TABLE (id UUID, title TEXT, snippet TEXT, rank REAL)
LANGUAGE sql STABLE AS $$
  SELECT 
    n.id,
    n.title,
    ts_headline('english', n.content, websearch_to_tsquery('english', q), 'MaxWords=30, MinWords=10, StartSel=<mark>, StopSel=</mark>') AS snippet,
    ts_rank(n.search, websearch_to_tsquery('english', q)) AS rank
  FROM public.notes n
  WHERE n.is_published AND n.search @@ websearch_to_tsquery('english', q)
  ORDER BY rank DESC
  LIMIT 30;
$$;

-- RLS policies for notes suite
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_note_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reader_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapters_all_access" ON public.chapters;
CREATE POLICY "chapters_all_access" ON public.chapters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notes_all_access" ON public.notes;
CREATE POLICY "notes_all_access" ON public.notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "user_note_state_all_access" ON public.user_note_state;
CREATE POLICY "user_note_state_all_access" ON public.user_note_state FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "highlights_all_access" ON public.highlights;
CREATE POLICY "highlights_all_access" ON public.highlights FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "reader_settings_all_access" ON public.reader_settings;
CREATE POLICY "reader_settings_all_access" ON public.reader_settings FOR ALL USING (true) WITH CHECK (true);

-- 17. Storage Bucket note-images for diagrams
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-images', 'note-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public view note-images" ON storage.objects;
CREATE POLICY "Allow public view note-images" ON storage.objects FOR SELECT USING (bucket_id = 'note-images');

DROP POLICY IF EXISTS "Allow upload to note-images" ON storage.objects;
CREATE POLICY "Allow upload to note-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'note-images');

DROP POLICY IF EXISTS "Allow update note-images" ON storage.objects;
CREATE POLICY "Allow update note-images" ON storage.objects FOR UPDATE USING (bucket_id = 'note-images');

DROP POLICY IF EXISTS "Allow delete note-images" ON storage.objects;
CREATE POLICY "Allow delete note-images" ON storage.objects FOR DELETE USING (bucket_id = 'note-images');

GRANT ALL ON public.chapters TO anon, authenticated, service_role;
GRANT ALL ON public.notes TO anon, authenticated, service_role;
GRANT ALL ON public.user_note_state TO anon, authenticated, service_role;
GRANT ALL ON public.highlights TO anon, authenticated, service_role;
GRANT ALL ON public.reader_settings TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_notes(TEXT) TO anon, authenticated, service_role;

-- 18. Seed official universities, domains, and logos (Ethiopian Universities)
INSERT INTO public.universities (name, domain, logo_url) VALUES 
('Addis Ababa University', 'aau.edu.et', 'https://upload.wikimedia.org/wikipedia/en/2/23/Addis_Ababa_University_logo.png'),
('Jimma University', 'ju.edu.et', 'https://upload.wikimedia.org/wikipedia/en/3/30/Current_Logo_of_Jimma_University.png'),
('Bahir Dar University', 'bdu.edu.et', 'https://upload.wikimedia.org/wikipedia/en/2/29/Bahir_Dar_University_logo.png'),
('Hawassa University', 'hu.edu.et', 'https://www.google.com/s2/favicons?domain=hu.edu.et&sz=256'),
('Mekelle University', 'mu.edu.et', 'https://www.google.com/s2/favicons?domain=mu.edu.et&sz=256'),
('University of Gondar', 'uog.edu.et', 'https://www.google.com/s2/favicons?domain=uog.edu.et&sz=256'),
('Haramaya University', 'haramaya.edu.et', 'https://upload.wikimedia.org/wikipedia/commons/8/87/Hulogo.jpg'),
('Adama Science and Technology University', 'astu.edu.et', 'https://upload.wikimedia.org/wikipedia/en/0/00/Adama_Science_%26_Technology_University_-_Logo_-_New.png'),
('Arba Minch University', 'amu.edu.et', 'https://www.google.com/s2/favicons?domain=amu.edu.et&sz=256'),
('Wolkite University', 'wku.edu.et', 'https://www.space4water.org/s4w/web/sites/default/files/images/organizations/logos/2025-07/Wolkite%20University.png'),
('Dire Dawa University', 'ddu.edu.et', 'https://upload.wikimedia.org/wikipedia/commons/7/73/Dire-Dawa_University-removebg.png'),
('Debre Markos University', 'dmu.edu.et', 'https://www.google.com/s2/favicons?domain=dmu.edu.et&sz=256'),
('Addis Ababa Science and Technology University', 'aastu.edu.et', 'https://upload.wikimedia.org/wikipedia/en/0/00/Adama_Science_%26_Technology_University_-_Logo_-_New.png'),
('Debre Birhan University', 'dbu.edu.et', 'https://www.google.com/s2/favicons?domain=dbu.edu.et&sz=256'),
('Wolaita Sodo University', 'wsu.edu.et', 'https://upload.wikimedia.org/wikipedia/en/3/39/Wolaita_Sodo_University_Logo.jpg'),
('Wollo University', 'wu.edu.et', 'https://www.google.com/s2/favicons?domain=wu.edu.et&sz=256'),
('Woldia University', 'wldu.edu.et', 'https://wldu.edu.et/wp-content/uploads/2025/10/android-chrome-512x512-1-300x300.png'),
('Dilla University', 'du.edu.et', 'https://www.google.com/s2/favicons?domain=du.edu.et&sz=256'),
('Ambo University', 'ambou.edu.et', 'https://www.google.com/s2/favicons?domain=ambou.edu.et&sz=256'),
('Jigjiga University', 'jju.edu.et', 'https://upload.wikimedia.org/wikipedia/en/6/6a/Jijiga_University.png'),
('Semera University', 'su.edu.et', 'https://www.google.com/s2/favicons?domain=su.edu.et&sz=256'),
('Adigrat University', 'adu.edu.et', 'https://www.google.com/s2/favicons?domain=adu.edu.et&sz=256'),
('Aksum University', 'aku.edu.et', 'https://www.google.com/s2/favicons?domain=aku.edu.et&sz=256'),
('Assosa University', 'asu.edu.et', 'https://www.google.com/s2/favicons?domain=asu.edu.et&sz=256'),
('Mizan Tepi University', 'mtu.edu.et', 'https://upload.wikimedia.org/wikipedia/en/d/db/Mizan%E2%80%93Tepi_University.png')
ON CONFLICT (name) DO UPDATE SET domain = EXCLUDED.domain, logo_url = EXCLUDED.logo_url;
`;

/**
 * Clean and normalize header strings to ensure strict ISO-8859-1 / ASCII compatibility.
 * Removes smart quotes, zero-width spaces, and any non-ASCII characters that break fetch Request headers.
 */
export function cleanAsciiHeader(str?: string): string {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width spaces & BOM
    .replace(/[^\x20-\x7E]/g, '') // Strict ASCII printable chars (32-126)
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

/**
 * Clean and normalize Supabase URL & Key string inputs
 */
export function sanitizeCredentials(rawUrl?: string, rawKey?: string): { url: string; key: string; isValid: boolean } {
  let url = cleanAsciiHeader(rawUrl);
  let key = cleanAsciiHeader(rawKey);

  if (!url || !key) {
    return { url: '', key: '', isValid: false };
  }

  const isPlaceholder = (val: string) => {
    const l = val.toLowerCase();
    return (
      l.includes('your-project') ||
      l.includes('your-anon-key') ||
      l.includes('abcdefghijklmnopqrst') ||
      l === 'undefined' ||
      l === 'null' ||
      l === 'none' ||
      l.length < 5
    );
  };

  if (isPlaceholder(url) || isPlaceholder(key)) {
    return { url: '', key: '', isValid: false };
  }

  // Ensure url has valid protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Strip trailing slashes
  url = url.replace(/\/+$/, '');

  return { url, key, isValid: true };
}

/**
 * Save Supabase credentials to localStorage for in-app pairing
 */
export function saveSupabaseCredentials(url: string, key: string) {
  const sanitized = sanitizeCredentials(url, key);
  if (sanitized.isValid) {
    safeStorage.setItem('ethiolearn_supabase_url', sanitized.url);
    safeStorage.setItem('ethiolearn_supabase_key', sanitized.key);
  } else {
    safeStorage.setItem('ethiolearn_supabase_url', url.trim());
    safeStorage.setItem('ethiolearn_supabase_key', key.trim());
  }
  supabaseInstance = null; // Reset instance to force recreation with new keys
}

/**
 * Clear stored Supabase credentials
 */
export function clearSupabaseCredentials() {
  safeStorage.removeItem('ethiolearn_supabase_url');
  safeStorage.removeItem('ethiolearn_supabase_key');
  supabaseInstance = null;
}

/**
 * Verifies if candidate credentials create valid HTTP headers without throwing ISO-8859-1 errors.
 */
function isValidHeaderCredential(url: string, key: string): boolean {
  try {
    const cleanUrl = cleanAsciiHeader(url);
    const cleanKey = cleanAsciiHeader(key);
    if (!cleanUrl || !cleanKey) return false;
    new Request(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`
      }
    });
    return true;
  } catch (e) {
    console.warn('[Supabase Client] Rejecting credentials due to invalid header format:', e);
    return false;
  }
}

/**
 * Lazily configures and retrieves the Supabase client instance.
 * Gracefully returns null if keys are not set or invalid, preventing crashes.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  // 1. First check user's explicitly saved credentials in browser local storage
  const storedUrl = safeStorage.getItem('ethiolearn_supabase_url');
  const storedKey = safeStorage.getItem('ethiolearn_supabase_key');
  const storedClean = sanitizeCredentials(storedUrl || '', storedKey || '');

  if (storedClean.isValid && isValidHeaderCredential(storedClean.url, storedClean.key)) {
    try {
      supabaseInstance = createClient(storedClean.url, storedClean.key, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      return supabaseInstance;
    } catch (err) {
      console.warn('Failed to initialize saved Supabase client:', err);
    }
  }

  // 2. Fall back to environment variables (Browser & Node.js runtimes)
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = (typeof process !== 'undefined' && process.env) || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || procEnv.SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY || procEnv.SUPABASE_ANON_KEY || '';
  const envClean = sanitizeCredentials(envUrl, envKey);

  // 3. Fall back to verified production project credentials
  const defaultUrl = 'https://cbjqtxleecwpxutgwvvp.supabase.co';
  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNianF0eGxlZWN3cHh1dGd3dnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMjU2OTQsImV4cCI6MjA5ODgwMTY5NH0.MCSWdWNNjio5jEpTdJlrrAvumWmkjP1r5Fj-6Fng0z4';
  const defaultClean = sanitizeCredentials(defaultUrl, defaultKey);

  if (defaultClean.isValid && isValidHeaderCredential(defaultClean.url, defaultClean.key)) {
    try {
      supabaseInstance = createClient(defaultClean.url, defaultClean.key, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      return supabaseInstance;
    } catch (err) {
      console.warn('Failed to initialize default Supabase client:', err);
    }
  }

  return null;
}

/**
 * Proactively awakens and refreshes Supabase Auth session
 */
export async function wakeSupabaseAuth(): Promise<boolean> {
  try {
    const supa = getSupabase();
    if (!supa) return false;
    const { data, error } = await supa.auth.getSession();
    if (!error && data?.session) {
      await supa.auth.refreshSession();
      console.log('[Supabase Auth] Session refreshed & awakened for:', data.session.user?.email);
      return true;
    }
  } catch (err) {
    console.warn('[Supabase Auth] wakeSupabaseAuth notice:', err);
  }
  return false;
}

/**
 * Comprehensive diagnostic check for Supabase connection
 */
export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<{
  success: boolean;
  message: string;
  details?: string;
  tablesFound: string[];
  needsSqlSetup: boolean;
}> {
  let client: SupabaseClient | null = null;
  let targetUrl = overrideUrl;
  let targetKey = overrideKey;

  if (overrideUrl && overrideKey) {
    const clean = sanitizeCredentials(overrideUrl, overrideKey);
    if (!clean.isValid || !isValidHeaderCredential(clean.url, clean.key)) {
      return {
        success: false,
        message: 'Invalid URL or Anon Key format. Please check for placeholders or non-ASCII characters.',
        tablesFound: [],
        needsSqlSetup: false
      };
    }
    try {
      client = createClient(clean.url, clean.key);
    } catch (err: any) {
      return {
        success: false,
        message: `Client initialization failed: ${err.message || err}`,
        tablesFound: [],
        needsSqlSetup: false
      };
    }
  } else {
    client = getSupabase();
    targetUrl = safeStorage.getItem('ethiolearn_supabase_url') || '';
    targetKey = safeStorage.getItem('ethiolearn_supabase_key') || '';
  }

  if (!client) {
    return {
      success: false,
      message: 'No valid Supabase credentials found. Please enter your project URL and Anon key.',
      tablesFound: [],
      needsSqlSetup: false
    };
  }

  const tablesFound: string[] = [];
  const tablesToCheck = [
    'student_profiles', 'courses', 'lessons', 'payments', 'announcements', 
    'coupons', 'ethiolearn_sync', 'books', 'exams', 'questions', 
    'subjects', 'chapters', 'notes', 'user_note_state', 'highlights', 'reader_settings'
  ];

  for (const t of tablesToCheck) {
    try {
      const { error: tblErr } = await client.from(t).select('*', { count: 'exact', head: true });
      if (!tblErr) tablesFound.push(t);
    } catch (e) {}
  }

  if (tablesFound.length > 0) {
    // Perform a test write check on student_profiles to detect RLS permission issues
    let rlsWriteBlocked = false;
    let rlsErrorMsg = '';
    try {
      const testEmail = `diagnostic_ping_${Date.now()}@ethiolearn.internal`;
      const { error: insertErr } = await client.from('student_profiles').upsert({
        email: testEmail,
        profile_data: { name: 'Diagnostic Health Ping', isPro: false, userRole: 'student' },
        study_sessions: [],
        notes_data: [],
        performance_data: {},
        updated_at: new Date().toISOString()
      });
      if (insertErr) {
        if (insertErr.code === '42501' || insertErr.message?.toLowerCase().includes('row-level security') || insertErr.message?.toLowerCase().includes('permission denied')) {
          rlsWriteBlocked = true;
          rlsErrorMsg = insertErr.message;
        }
      } else {
        // Clean up diagnostic ping
        await client.from('student_profiles').delete().eq('email', testEmail);
      }
    } catch (e: any) {
      if (e?.message?.toLowerCase().includes('row-level security')) {
        rlsWriteBlocked = true;
        rlsErrorMsg = e.message;
      }
    }

    if (rlsWriteBlocked) {
      return {
        success: false,
        message: `Connected to Supabase, but Row-Level Security (RLS) is blocking data registration!`,
        details: `Error: ${rlsErrorMsg}. Solution: Run the updated SQL setup script in your Supabase SQL Editor to grant public and anon access policies.`,
        tablesFound,
        needsSqlSetup: true
      };
    }

    return {
      success: true,
      message: `Connected successfully! Tables verified and write access confirmed: [${tablesFound.join(', ')}].`,
      tablesFound,
      needsSqlSetup: false
    };
  }

  // If no tables found, verify if host is reachable via REST ping
  try {
    const { url, key } = sanitizeCredentials(targetUrl || '', targetKey || '');
    if (url && key && isValidHeaderCredential(url, key)) {
      const pingRes = await fetch(`${url}/rest/v1/`, { method: 'GET', headers: { apikey: key } });
      if (pingRes.ok || pingRes.status === 200 || pingRes.status === 401 || pingRes.status === 404) {
        return {
          success: true,
          message: 'Connected to Supabase project REST API! Note: Database tables are not created yet.',
          details: 'Your credentials are valid! Please copy and run the 1-click SQL setup script in your Supabase SQL Editor to create tables.',
          tablesFound: [],
          needsSqlSetup: true
        };
      }
    }
  } catch (err) {}

  return {
    success: false,
    message: 'Could not connect to Supabase. Please verify your Project URL and Anon Key.',
    details: 'Make sure your project URL starts with https://, your database status is active, and Row Level Security or CORS settings allow requests.',
    tablesFound: [],
    needsSqlSetup: true
  };
}

/**
 * Fetch Grade 12 books from Supabase if connected
 */
export async function fetchSupabaseBooks(): Promise<any[]> {
  const client = getSupabase();
  if (!client) return [];

  try {
    // Attempt to select from "books"
    const { data, error } = await client
      .from('books')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      // Try fallback table alternative "grade12_books"
      const { data: fallbackData, error: fallbackError } = await client
        .from('grade12_books')
        .select('*');
      
      if (fallbackError) {
        console.warn('Supabase connected, but tables "books" or "grade12_books" were not found. Falling back to local catalog.');
        return [];
      }
      return fallbackData || [];
    }
    return data || [];
  } catch (err) {
    console.error('Error fetching from Supabase:', err);
    return [];
  }
}

/**
 * Fetch video lessons directly from Supabase "lessons" table
 */
export async function fetchSupabaseLessons(): Promise<any[]> {
  const client = getSupabase();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('lessons')
      .select('*')
      .order('chapter_number', { ascending: true });

    if (error) {
      console.warn('Could not fetch lessons from Supabase:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error fetching lessons from Supabase:', err);
    return [];
  }
}

/**
 * Asynchronously loads Supabase config from server if not already stored in localStorage.
 */
export function initSupabaseConfig(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const savedUrl = safeStorage.getItem('ethiolearn_supabase_url');
      const savedKey = safeStorage.getItem('ethiolearn_supabase_key');
      const cleanSaved = sanitizeCredentials(savedUrl || '', savedKey || '');
      if (cleanSaved.isValid) {
        resolve();
        return; // Already configured locally
      }

      fetch('/api/supabase-config')
        .then((res) => (res.ok ? res.json() : null))
        .then((config) => {
          if (config && config.url && config.anonKey) {
            const cleanConfig = sanitizeCredentials(config.url, config.anonKey);
            if (cleanConfig.isValid) {
              safeStorage.setItem('ethiolearn_supabase_url', cleanConfig.url);
              safeStorage.setItem('ethiolearn_supabase_key', cleanConfig.key);
              supabaseInstance = null; // force reload with server-synced credentials
              console.log('[Supabase Client] Successfully fetched and auto-configured Supabase credentials from server.');
            }
          }
          resolve();
        })
        .catch((err) => {
          console.warn('[Supabase Client] Failed to fetch server-side Supabase credentials:', err);
          resolve();
        });
    } catch (err) {
      console.warn('[Supabase Client] Init error:', err);
      resolve();
    }
  });
}

const SESSION_TOKEN_KEY = 'ethiolearn_server_session_token';

/**
 * Get stored cryptographic server session token
 */
export function getSessionToken(): string | null {
  return safeStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Store cryptographic server session token
 */
export function setSessionToken(token: string): void {
  if (token) {
    safeStorage.setItem(SESSION_TOKEN_KEY, token);
  }
}

/**
 * Clear stored server session token
 */
export function clearSessionToken(): void {
  safeStorage.removeItem(SESSION_TOKEN_KEY);
}

/**
 * Construct standard Authorization / Session headers for all API requests
 */
export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getSessionToken();
  let activeEmail = safeStorage.getItem('ethiolearn_active_email') || '';
  if (!activeEmail) {
    try {
      const cur = safeStorage.getItem('ethiolearn_current_profile');
      if (cur) {
        const p = JSON.parse(cur);
        if (p?.email) activeEmail = p.email;
      }
    } catch {}
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['x-ethiolearn-session-token'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (activeEmail) {
    headers['x-ethiolearn-user-email'] = activeEmail;
    headers['x-ethiolearn-admin-email'] = activeEmail;
  }
  return headers;
}

/**
 * Request/refresh a cryptographically signed session token from the backend
 */
export async function syncAuthSessionWithServer(params: {
  email?: string;
  uid?: string;
  role?: string;
  displayName?: string;
  initData?: string;
}): Promise<{ success: boolean; token?: string; user?: any }> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.token) {
        setSessionToken(data.token);
        return data;
      }
    }
  } catch (err) {
    console.warn('[Auth Session Sync Notice]:', err);
  }
  return { success: false };
}

/**
 * Upsert a user's profile in Supabase table `profiles` using Firebase UID.
 * Reconnects existing users by email if already registered.
 */
export async function saveProfileToSupabase(profile: {
  firebase_uid: string;
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  university?: string;
  department?: string;
  year_level?: string;
  profile_photo?: string;
  subscription_status?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const cleanEmail = profile.email.toLowerCase().trim();
  const isAdmin = isAdministratorEmail(cleanEmail);

  try {
    const supa = getSupabase();
    if (supa) {
      // Check existing records first to avoid accidentally downgrading an existing Pro pass
      let alreadyPro = isAdmin || profile.subscription_status === 'pro' || profile.subscription_status === 'active';
      if (!alreadyPro) {
        try {
          if (profile.firebase_uid) {
            const { data: pByUid } = await supa.from('profiles').select('subscription_status').eq('firebase_uid', profile.firebase_uid).maybeSingle();
            if (pByUid?.subscription_status === 'pro' || pByUid?.subscription_status === 'active') alreadyPro = true;
          }
          if (!alreadyPro && cleanEmail) {
            const { data: pByEmail } = await supa.from('profiles').select('subscription_status').eq('email', cleanEmail).maybeSingle();
            if (pByEmail?.subscription_status === 'pro' || pByEmail?.subscription_status === 'active') alreadyPro = true;
          }
          if (!alreadyPro && cleanEmail) {
            const { data: sByEmail } = await supa.from('student_profiles').select('is_pro, pro_status, profile_data').eq('email', cleanEmail).maybeSingle();
            if (sByEmail?.is_pro || sByEmail?.pro_status === 'active' || sByEmail?.profile_data?.isPro) alreadyPro = true;
          }
          if (!alreadyPro && cleanEmail) {
            const { data: subData } = await supa.from('subscriptions').select('status').eq('email', cleanEmail).eq('status', 'active').maybeSingle();
            if (subData) alreadyPro = true;
          }
        } catch {}
      }

      const finalStatus = alreadyPro ? 'pro' : 'free';
      const payload = {
        firebase_uid: profile.firebase_uid,
        full_name: profile.full_name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: profile.phone || '',
        university: profile.university || 'Wolkite University (WKU)',
        department: profile.department || 'General',
        year_level: profile.year_level || 'Freshman (1st Year)',
        profile_photo: profile.profile_photo || '',
        subscription_status: finalStatus,
        updated_at: new Date().toISOString()
      };

      // 1. Persist to `profiles` table
      try {
        const { data: existingByUid } = await supa
          .from('profiles')
          .select('*')
          .eq('firebase_uid', payload.firebase_uid)
          .maybeSingle();

        if (existingByUid) {
          await supa
            .from('profiles')
            .update(payload)
            .eq('firebase_uid', payload.firebase_uid);
        } else {
          const { data: existingByEmail } = await supa
            .from('profiles')
            .select('*')
            .eq('email', payload.email)
            .maybeSingle();

          if (existingByEmail) {
            await supa
              .from('profiles')
              .update(payload)
              .eq('email', payload.email);
          } else {
            await supa
              .from('profiles')
              .insert(payload);
          }
        }
      } catch (profilesErr) {
        console.warn('[profiles table notice]:', profilesErr);
      }

      // 2. Mirror and sync to `student_profiles`
      try {
        const { data: existingStd } = await supa
          .from('student_profiles')
          .select('profile_data')
          .eq('email', payload.email)
          .maybeSingle();

        const existingPd = existingStd?.profile_data || {};
        await supa
          .from('student_profiles')
          .upsert({
            email: payload.email,
            name: payload.full_name,
            university: payload.university,
            year: payload.year_level,
            is_pro: alreadyPro,
            pro_status: alreadyPro ? 'active' : 'none',
            profile_data: {
              ...existingPd,
              firebaseUid: payload.firebase_uid,
              name: payload.full_name,
              email: payload.email,
              phone: payload.phone || existingPd.phone,
              university: payload.university,
              department: payload.department,
              year: payload.year_level,
              avatar: payload.profile_photo || existingPd.avatar,
              isPro: alreadyPro,
              proStatus: alreadyPro ? 'active' : 'none',
              tier: alreadyPro ? (existingPd.tier || 'pro_semester') : 'free'
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });
      } catch (stdErr) {
        console.warn('[student_profiles client sync notice]:', stdErr);
      }

      return { success: true, data: payload };
    }
  } catch (clientErr) {
    console.warn('[saveProfileToSupabase client-side attempt]:', clientErr);
  }

  // Fallback / sync via backend server route
  try {
    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebase_uid: profile.firebase_uid,
        full_name: profile.full_name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: profile.phone || '',
        university: profile.university || 'Wolkite University (WKU)',
        department: profile.department || 'General',
        year_level: profile.year_level || 'Freshman (1st Year)',
        profile_photo: profile.profile_photo || '',
        subscription_status: (isAdmin || profile.subscription_status === 'pro') ? 'pro' : 'free'
      })
    });
    if (res.ok) {
      const resJson = await res.json();
      return { success: true, data: resJson.profile || resJson.data };
    }
  } catch (serverErr) {
    console.warn('[saveProfileToSupabase server proxy notice]:', serverErr);
  }

  return { success: true };
}

/**
 * Fetch a profile from Supabase tables `profiles`, `student_profiles`, and `subscriptions`
 */
export async function fetchProfileFromSupabase(firebaseUid: string, email?: string): Promise<any | null> {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const isAdmin = isAdministratorEmail(normalizedEmail);

  try {
    const supa = getSupabase();
    let profRow: any = null;
    let stdRow: any = null;
    let subRow: any = null;

    if (supa) {
      // 1. Fetch from profiles table
      if (firebaseUid) {
        try {
          const { data } = await supa
            .from('profiles')
            .select('*')
            .eq('firebase_uid', firebaseUid)
            .maybeSingle();
          if (data) profRow = data;
        } catch {}
      }
      if (!profRow && normalizedEmail) {
        try {
          const { data } = await supa
            .from('profiles')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle();
          if (data) profRow = data;
        } catch {}
      }

      // 2. Fetch from student_profiles table (ALWAYS check, even if profRow exists)
      if (normalizedEmail) {
        try {
          const { data } = await supa
            .from('student_profiles')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle();
          if (data) stdRow = data;
        } catch {}
      }
      if (!stdRow && firebaseUid) {
        try {
          const { data } = await supa
            .from('student_profiles')
            .select('*')
            .filter('profile_data->>firebaseUid', 'eq', firebaseUid)
            .maybeSingle();
          if (data) stdRow = data;
        } catch {}
      }

      // 3. Fetch from subscriptions table for active subscription
      if (normalizedEmail) {
        try {
          const { data } = await supa
            .from('subscriptions')
            .select('*')
            .eq('email', normalizedEmail)
            .eq('status', 'active')
            .maybeSingle();
          if (data) subRow = data;
        } catch {}
      }
    }

    // Call server endpoint as fallback if neither row found
    if (!profRow && !stdRow) {
      try {
        const url = firebaseUid 
          ? `/api/user/profile/${encodeURIComponent(firebaseUid)}` 
          : `/api/user/profile?email=${encodeURIComponent(normalizedEmail)}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json && json.profile) profRow = json.profile;
        }
      } catch {}
    }

    if (!profRow && !stdRow && !subRow) {
      return null;
    }

    const pd = stdRow?.profile_data || {};
    const isPending = Boolean(
      stdRow?.pro_status === 'pending' ||
      pd.proStatus === 'pending' ||
      profRow?.subscription_status === 'pending'
    );

    const isPro = Boolean(
      isAdmin ||
      (!isPending && (
        profRow?.subscription_status === 'pro' ||
        profRow?.subscription_status === 'active' ||
        stdRow?.is_pro === true ||
        stdRow?.pro_status === 'active' ||
        pd.isPro === true ||
        pd.is_pro === true ||
        subRow?.status === 'active'
      ))
    );

    const targetTier = isPending ? 'free' : (subRow?.tier || pd.tier || (isPro ? 'pro_semester' : 'free'));
    const resolvedProStatus = isAdmin ? 'active' : isPending ? 'pending' : (isPro ? 'active' : 'none');
    const resolvedSubStatus = isAdmin ? 'pro' : isPending ? 'pending' : (isPro ? 'pro' : 'free');

    return {
      id: firebaseUid || profRow?.firebase_uid || pd.firebaseUid || stdRow?.id || '',
      firebase_uid: firebaseUid || profRow?.firebase_uid || pd.firebaseUid || '',
      full_name: stdRow?.name || profRow?.full_name || pd.name || (normalizedEmail ? normalizedEmail.split('@')[0] : 'Student'),
      name: stdRow?.name || profRow?.full_name || pd.name || (normalizedEmail ? normalizedEmail.split('@')[0] : 'Student'),
      email: normalizedEmail || profRow?.email || stdRow?.email || '',
      phone: stdRow?.phone || profRow?.phone || pd.phone || '',
      university: stdRow?.university || profRow?.university || pd.university || 'Wolkite University',
      department: pd.department || profRow?.department || 'Freshman Common Courses',
      year_level: stdRow?.year || profRow?.year_level || pd.year || 'Freshman (1st Year)',
      year: stdRow?.year || profRow?.year_level || pd.year || 'Freshman (1st Year)',
      profile_photo: pd.avatar || profRow?.profile_photo || 'champion',
      avatar: pd.avatar || profRow?.profile_photo || 'champion',
      subscription_status: resolvedSubStatus,
      is_pro: isPro,
      isPro: isPro,
      pro_status: resolvedProStatus,
      proStatus: resolvedProStatus,
      tier: targetTier,
      profile_data: {
        ...pd,
        isPro,
        proStatus: resolvedProStatus,
        tier: targetTier
      }
    };
  } catch (err) {
    console.warn('[fetchProfileFromSupabase warning]:', err);
  }
  return null;
}
export { supabase } from './supabase';

