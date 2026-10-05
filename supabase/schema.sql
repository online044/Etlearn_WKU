-- ====================================================================
-- ETHIOLEARN PRO - PRODUCTION HARDENED DATABASE SCHEMA & ZERO-TRUST RLS
-- ====================================================================

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'pro_monthly', 'exam_season_pass', 'subject_bundle');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'pending', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_provider AS ENUM ('telebirr', 'cbe_birr', 'chapa', 'santim_pay', 'manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. USER PROFILES TABLE (Linked with Firebase Authentication UID)
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON public.profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2b. STUDENT PROFILES TABLE (Legacy & Campus Progress Backup)
CREATE TABLE IF NOT EXISTS public.student_profiles (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    university TEXT DEFAULT 'Wolkite University',
    year TEXT DEFAULT 'Freshman',
    subjects JSONB DEFAULT '[]'::jsonb,
    is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    user_role TEXT NOT NULL DEFAULT 'student' CHECK (user_role IN ('student', 'instructor', 'admin', 'super_admin')),
    referral_code TEXT,
    profile_data JSONB,
    notes_data JSONB,
    study_sessions JSONB,
    performance_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'University',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    lessons_count INT NOT NULL DEFAULT 0,
    goal_days INT NOT NULL DEFAULT 14,
    instructor_id TEXT,
    instructor_name TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    chapter_number INT NOT NULL DEFAULT 1,
    content TEXT,
    duration TEXT DEFAULT '15m',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_course_lesson_chapter UNIQUE (course_id, chapter_number)
);

-- 5. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    discount_percentage INT NOT NULL DEFAULT 20,
    fixed_discount_etb NUMERIC(10, 2) DEFAULT 0,
    max_uses INT NOT NULL DEFAULT 100,
    used_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    badge_text TEXT DEFAULT 'Notice',
    is_important BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. BOOKS TABLE
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT NOT NULL DEFAULT 'Grade 12',
    description TEXT,
    pdf_url TEXT,
    chapters JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ETHIOLEARN SYNC TABLE
CREATE TABLE IF NOT EXISTS public.ethiolearn_sync (
    email TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT,
    tier subscription_tier NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    subject_bundle_id TEXT,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    payment_method payment_provider DEFAULT 'telebirr',
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    provider payment_provider NOT NULL DEFAULT 'telebirr',
    provider_transaction_id TEXT UNIQUE NOT NULL,
    sender_name TEXT NOT NULL,
    sender_phone TEXT,
    status payment_status NOT NULL DEFAULT 'pending',
    receipt_url TEXT,
    raw_webhook_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. FEATURE USAGE TRACKER TABLE
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    feature_type TEXT NOT NULL,
    count INT NOT NULL DEFAULT 0,
    reset_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_feature UNIQUE (user_id, feature_type)
);

-- 12. INDEXES
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_level ON public.courses(level);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_txn ON public.payments(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_role ON public.student_profiles(user_role);

-- 13. AUTOMATED UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 14. AUTHORIZATION HELPER FUNCTIONS
-- ====================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = 'ezrat2116@gmail.com' OR
        EXISTS (
            SELECT 1 FROM public.student_profiles
            WHERE email = auth.jwt() ->> 'email'
              AND user_role IN ('admin', 'super_admin')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 15. ZERO-TRUST ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- 15.1 Courses RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins full access to courses" ON public.courses;
DROP POLICY IF EXISTS "courses_select" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_all" ON public.courses;

CREATE POLICY "courses_select"
    ON public.courses FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "courses_admin_insert"
    ON public.courses FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "courses_admin_update"
    ON public.courses FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "courses_admin_delete"
    ON public.courses FOR DELETE
    USING (public.is_admin());

-- 15.2 Lessons RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins full access to lessons" ON public.lessons;
DROP POLICY IF EXISTS "lessons_select" ON public.lessons;
DROP POLICY IF EXISTS "lessons_admin_insert" ON public.lessons;
DROP POLICY IF EXISTS "lessons_admin_update" ON public.lessons;
DROP POLICY IF EXISTS "lessons_admin_delete" ON public.lessons;

CREATE POLICY "lessons_select"
    ON public.lessons FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "lessons_admin_insert"
    ON public.lessons FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "lessons_admin_update"
    ON public.lessons FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "lessons_admin_delete"
    ON public.lessons FOR DELETE
    USING (public.is_admin());

-- 15.3 Student Profiles RLS (Strict Owner & Admin only - NO public snooping)
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read of student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Allow profile upserts" ON public.student_profiles;
DROP POLICY IF EXISTS "student_profiles_select" ON public.student_profiles;
DROP POLICY IF EXISTS "student_profiles_insert" ON public.student_profiles;
DROP POLICY IF EXISTS "student_profiles_update" ON public.student_profiles;
DROP POLICY IF EXISTS "student_profiles_delete" ON public.student_profiles;

CREATE POLICY "student_profiles_select"
    ON public.student_profiles FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = email OR
        auth.uid()::text = email OR
        public.is_admin()
    );

CREATE POLICY "student_profiles_insert"
    ON public.student_profiles FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        (
            (auth.jwt() ->> 'email' = email OR auth.uid()::text = email)
            AND user_role = 'student'
            AND is_pro = FALSE
        ) OR
        public.is_admin()
    );

CREATE POLICY "student_profiles_update"
    ON public.student_profiles FOR UPDATE
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = email OR
        auth.uid()::text = email OR
        public.is_admin()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        public.is_admin() OR
        (
            -- Normal users can update non-privilege profile fields but CANNOT change role or is_pro
            (auth.jwt() ->> 'email' = email OR auth.uid()::text = email)
            AND user_role = (SELECT user_role FROM public.student_profiles WHERE email = student_profiles.email)
            AND is_pro = (SELECT is_pro FROM public.student_profiles WHERE email = student_profiles.email)
        )
    );

CREATE POLICY "student_profiles_delete"
    ON public.student_profiles FOR DELETE
    USING (public.is_admin());

-- 15.3b User Profiles (Firebase Auth UID Linked) RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

CREATE POLICY "profiles_select"
    ON public.profiles FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        auth.role() = 'anon' OR
        auth.jwt() ->> 'email' = email OR
        auth.uid()::text = firebase_uid OR
        public.is_admin()
    );

CREATE POLICY "profiles_insert"
    ON public.profiles FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        auth.role() = 'anon' OR
        public.is_admin()
    );

CREATE POLICY "profiles_update"
    ON public.profiles FOR UPDATE
    USING (
        auth.role() = 'service_role' OR
        auth.role() = 'anon' OR
        auth.jwt() ->> 'email' = email OR
        auth.uid()::text = firebase_uid OR
        public.is_admin()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        auth.role() = 'anon' OR
        public.is_admin()
    );

CREATE POLICY "profiles_delete"
    ON public.profiles FOR DELETE
    USING (public.is_admin() OR auth.role() = 'service_role');

-- 15.4 Payments RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow payments access" ON public.payments;
DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_update" ON public.payments;
DROP POLICY IF EXISTS "payments_delete" ON public.payments;

CREATE POLICY "payments_select"
    ON public.payments FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = user_id OR
        auth.uid()::text = user_id OR
        public.is_admin()
    );

CREATE POLICY "payments_insert"
    ON public.payments FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = user_id OR
        auth.uid()::text = user_id OR
        public.is_admin()
    );

CREATE POLICY "payments_update"
    ON public.payments FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "payments_delete"
    ON public.payments FOR DELETE
    USING (public.is_admin());

-- 15.5 Coupons RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow coupons access" ON public.coupons;
DROP POLICY IF EXISTS "coupons_select" ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_all" ON public.coupons;

CREATE POLICY "coupons_select"
    ON public.coupons FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "coupons_admin_insert"
    ON public.coupons FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "coupons_admin_update"
    ON public.coupons FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "coupons_admin_delete"
    ON public.coupons FOR DELETE
    USING (public.is_admin());

-- 15.6 Announcements RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
DROP POLICY IF EXISTS "announcements_admin_insert" ON public.announcements;
DROP POLICY IF EXISTS "announcements_admin_update" ON public.announcements;
DROP POLICY IF EXISTS "announcements_admin_delete" ON public.announcements;

CREATE POLICY "announcements_select"
    ON public.announcements FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "announcements_admin_insert"
    ON public.announcements FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "announcements_admin_update"
    ON public.announcements FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "announcements_admin_delete"
    ON public.announcements FOR DELETE
    USING (public.is_admin());

-- 15.7 Books RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read and write books" ON public.books;
DROP POLICY IF EXISTS "books_select" ON public.books;
DROP POLICY IF EXISTS "books_admin_insert" ON public.books;
DROP POLICY IF EXISTS "books_admin_update" ON public.books;
DROP POLICY IF EXISTS "books_admin_delete" ON public.books;

CREATE POLICY "books_select"
    ON public.books FOR SELECT
    USING (TRUE);

CREATE POLICY "books_admin_insert"
    ON public.books FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "books_admin_update"
    ON public.books FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "books_admin_delete"
    ON public.books FOR DELETE
    USING (public.is_admin());

-- 15.8 Ethiolearn Sync (Backup Snapshot Table) RLS
ALTER TABLE public.ethiolearn_sync ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public sync access" ON public.ethiolearn_sync;
DROP POLICY IF EXISTS "sync_select" ON public.ethiolearn_sync;
DROP POLICY IF EXISTS "sync_insert" ON public.ethiolearn_sync;
DROP POLICY IF EXISTS "sync_update" ON public.ethiolearn_sync;
DROP POLICY IF EXISTS "sync_delete" ON public.ethiolearn_sync;

CREATE POLICY "sync_select"
    ON public.ethiolearn_sync FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = email OR
        public.is_admin()
    );

CREATE POLICY "sync_insert"
    ON public.ethiolearn_sync FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = email OR
        public.is_admin()
    );

CREATE POLICY "sync_update"
    ON public.ethiolearn_sync FOR UPDATE
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = email OR
        public.is_admin()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = email OR
        public.is_admin()
    );

CREATE POLICY "sync_delete"
    ON public.ethiolearn_sync FOR DELETE
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = email OR
        public.is_admin()
    );

-- 15.9 Subscriptions RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_insert" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_update" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_delete" ON public.subscriptions;

CREATE POLICY "subscriptions_select"
    ON public.subscriptions FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = email OR
        auth.uid() = user_id OR
        public.is_admin()
    );

CREATE POLICY "subscriptions_admin_insert"
    ON public.subscriptions FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "subscriptions_admin_update"
    ON public.subscriptions FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "subscriptions_admin_delete"
    ON public.subscriptions FOR DELETE
    USING (public.is_admin());

-- ====================================================================
-- 16. CENTRAL QUESTION BANK & SUBJECTS TABLES (10,000+ Questions Scale)
-- ====================================================================

-- 16.1 SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    department TEXT DEFAULT 'Common Freshman Courses',
    year TEXT DEFAULT 'Year 1',
    semester TEXT DEFAULT 'Semester 1 & 2',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_active ON public.subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON public.subjects(name);

-- Seed standard 19 Ethiopian University Freshman subjects
INSERT INTO public.subjects (id, name, code, department, year, semester, description, is_active)
VALUES 
    ('subj_critical_thinking', 'Critical Thinking', 'PHIL 1011', 'Freshman Common', 'Year 1', 'Semester 1', 'Logic, reasoning, and critical inquiry module', TRUE),
    ('subj_economics', 'Economics', 'ECON 1011', 'Freshman Common', 'Year 1', 'Semester 2', 'Microeconomics and Macroeconomics principles', TRUE),
    ('subj_emerging_technologies', 'Emerging Technologies', 'EMTE 1011', 'Freshman Common', 'Year 1', 'Semester 2', 'AI, IoT, Cloud, Blockchain and Industry 4.0', TRUE),
    ('subj_entrepreneurship', 'Entrepreneurship', 'MGMT 1012', 'Freshman Common', 'Year 1', 'Semester 2', 'Business innovation, venture creation and mindset', TRUE),
    ('subj_general_biology', 'General Biology', 'BIOL 1011', 'Natural Science', 'Year 1', 'Semester 1', 'Cell biology, genetics, ecology, and human biology', TRUE),
    ('subj_general_chemistry', 'General Chemistry', 'CHEM 1011', 'Natural Science', 'Year 1', 'Semester 1', 'Atomic theory, chemical bonding, equilibria, kinetics', TRUE),
    ('subj_general_physics', 'General Physics', 'PHYS 1011', 'Natural Science', 'Year 1', 'Semester 1', 'Mechanics, thermodynamics, electricity, magnetism', TRUE),
    ('subj_general_psychology', 'General Psychology', 'PSYC 1011', 'Freshman Common', 'Year 1', 'Semester 1', 'Human cognition, behavior, learning, and memory', TRUE),
    ('subj_geography', 'Geography', 'GEOG 1011', 'Social Science & Common', 'Year 1', 'Semester 1', 'Geography of Ethiopia and the Horn', TRUE),
    ('subj_global_trends', 'Global Trends', 'GLTR 1012', 'Freshman Common', 'Year 1', 'Semester 2', 'International relations, geopolitics and globalization', TRUE),
    ('subj_inclusiveness', 'Inclusiveness', 'SNIE 1012', 'Freshman Common', 'Year 1', 'Semester 2', 'Special needs and inclusive education in Ethiopia', TRUE),
    ('subj_moral_and_civic', 'Moral and Civic', 'MCED 1011', 'Freshman Common', 'Year 1', 'Semester 1', 'Ethics, democracy, constitutional law and rights', TRUE),
    ('subj_physical_fitness', 'Physical Fitness', 'SpSc 1011', 'Freshman Common', 'Year 1', 'Semester 1', 'Exercise physiology, wellness and health promotion', TRUE),
    ('subj_english_1', 'Communicative English Language Skills I', 'FLEn 1011', 'Freshman Common', 'Year 1', 'Semester 1', 'Grammar, reading comprehension, vocabulary and discourse', TRUE),
    ('subj_english_2', 'Communicative English Language Skills II', 'FLEn 1012', 'Freshman Common', 'Year 1', 'Semester 2', 'Academic writing, formal presentations and debate', TRUE),
    ('subj_history', 'History of Ethiopia and the Horn', 'HIST 1012', 'Freshman Common', 'Year 1', 'Semester 2', 'Ancient civilizations to modern Ethiopian statehood', TRUE),
    ('subj_math_natural', 'Mathematics — Natural Science', 'MATH 1011', 'Natural Science', 'Year 1', 'Semester 1', 'Precalculus, vectors, limits, derivatives, integrals', TRUE),
    ('subj_math_social', 'Mathematics — Social Science', 'MATH 1012', 'Social Science', 'Year 1', 'Semester 1', 'Linear algebra, matrices, probability, business math', TRUE),
    ('subj_social_anthropology', 'Social Anthropology', 'ANTH 1012', 'Freshman Common', 'Year 1', 'Semester 2', 'Cultural diversity, ethnography, kinship in the Horn', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 16.2 CENTRAL QUESTIONS TABLE (Can scale to 10,000+ items)
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY,
    subject_id TEXT,
    subject TEXT NOT NULL DEFAULT 'General Biology',
    course TEXT NOT NULL DEFAULT 'General Biology',
    unit TEXT NOT NULL DEFAULT 'Unit 1',
    topic TEXT NOT NULL DEFAULT 'General Topic',
    module_id INT DEFAULT 5,
    module_name TEXT NOT NULL DEFAULT 'General Biology',
    chapter TEXT NOT NULL DEFAULT 'Unit 1',
    question TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'multiple_choice',
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    source TEXT DEFAULT 'Curriculum Module',
    source_unit TEXT,
    source_file TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sync module_name & chapter triggers to ensure 100% interoperability across both schemas
CREATE OR REPLACE FUNCTION public.sync_question_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subject IS NULL OR NEW.subject = '' THEN
        NEW.subject := COALESCE(NEW.module_name, 'General Biology');
    END IF;
    IF NEW.course IS NULL OR NEW.course = '' THEN
        NEW.course := NEW.subject;
    END IF;
    IF NEW.unit IS NULL OR NEW.unit = '' THEN
        NEW.unit := COALESCE(NEW.chapter, 'Unit 1');
    END IF;
    IF NEW.topic IS NULL OR NEW.topic = '' THEN
        NEW.topic := NEW.unit;
    END IF;
    IF NEW.module_name IS NULL OR NEW.module_name = '' THEN
        NEW.module_name := NEW.subject;
    END IF;
    IF NEW.chapter IS NULL OR NEW.chapter = '' THEN
        NEW.chapter := NEW.unit;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_question_columns ON public.questions;
CREATE TRIGGER trg_sync_question_columns
    BEFORE INSERT OR UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.sync_question_columns();

-- High-performance indexes requested:
-- subject, course, unit, topic, difficulty, question_type, is_published, is_pro
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_course ON public.questions(course);
CREATE INDEX IF NOT EXISTS idx_questions_unit ON public.questions(unit);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_module_id ON public.questions(module_id);
CREATE INDEX IF NOT EXISTS idx_questions_module_name ON public.questions(module_name);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON public.questions(chapter);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_is_published ON public.questions(is_published);
CREATE INDEX IF NOT EXISTS idx_questions_is_pro ON public.questions(is_pro);
CREATE INDEX IF NOT EXISTS idx_questions_subject_published ON public.questions(subject, is_published);

-- Prevent duplicate questions where practical (unique subject + question text hash)
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_prevent_duplicate 
    ON public.questions (subject, MD5(LOWER(TRIM(question))));

-- Updated_at trigger for questions
DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16.3 QUESTION PROGRESS TABLE (Student attempts & accuracy)
CREATE TABLE IF NOT EXISTS public.question_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 1,
    correct_attempts INT NOT NULL DEFAULT 0,
    incorrect_attempts INT NOT NULL DEFAULT 0,
    last_answer TEXT,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_question_progress UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_qprog_user ON public.question_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_qprog_question ON public.question_progress(question_id);

-- 16.4 QUESTION BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.question_bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_question_bookmark UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_qbm_user ON public.question_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_qbm_question ON public.question_bookmarks(question_id);

-- 16.5 EXAM PRESETS TABLE (Exam Mode: Timed Mock Exams)
CREATE TABLE IF NOT EXISTS public.question_exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration_minutes INT NOT NULL DEFAULT 60,
    total_questions INT NOT NULL DEFAULT 50,
    passing_score INT NOT NULL DEFAULT 50,
    is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 17. ZERO-TRUST RLS POLICIES FOR QUESTIONS & SUBJECTS
-- ====================================================================

-- 17.1 Subjects RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subjects_select" ON public.subjects;
DROP POLICY IF EXISTS "subjects_admin_insert" ON public.subjects;
DROP POLICY IF EXISTS "subjects_admin_update" ON public.subjects;
DROP POLICY IF EXISTS "subjects_admin_delete" ON public.subjects;

CREATE POLICY "subjects_select"
    ON public.subjects FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "subjects_admin_insert"
    ON public.subjects FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "subjects_admin_update"
    ON public.subjects FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "subjects_admin_delete"
    ON public.subjects FOR DELETE
    USING (public.is_admin());

-- 17.2 Questions RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_select" ON public.questions;
DROP POLICY IF EXISTS "questions_admin_insert" ON public.questions;
DROP POLICY IF EXISTS "questions_admin_update" ON public.questions;
DROP POLICY IF EXISTS "questions_admin_delete" ON public.questions;

-- Students can read published questions; admins can read all
CREATE POLICY "questions_select"
    ON public.questions FOR SELECT
    USING (is_published = TRUE OR public.is_admin());

CREATE POLICY "questions_admin_insert"
    ON public.questions FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "questions_admin_update"
    ON public.questions FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "questions_admin_delete"
    ON public.questions FOR DELETE
    USING (public.is_admin());

-- 17.3 Question Progress RLS
ALTER TABLE public.question_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qprog_select" ON public.question_progress;
DROP POLICY IF EXISTS "qprog_insert" ON public.question_progress;
DROP POLICY IF EXISTS "qprog_update" ON public.question_progress;
DROP POLICY IF EXISTS "qprog_delete" ON public.question_progress;

CREATE POLICY "qprog_select"
    ON public.question_progress FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = user_id OR
        auth.uid()::text = user_id OR
        public.is_admin()
    );

CREATE POLICY "qprog_insert"
    ON public.question_progress FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = user_id OR
        auth.uid()::text = user_id OR
        public.is_admin()
    );

CREATE POLICY "qprog_update"
    ON public.question_progress FOR UPDATE
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = user_id OR
        auth.uid()::text = user_id OR
        public.is_admin()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = user_id OR
        auth.uid()::text = user_id OR
        public.is_admin()
    );

CREATE POLICY "qprog_delete"
    ON public.question_progress FOR DELETE
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = user_id OR
        auth.uid()::text = user_id OR
        public.is_admin()
    );

-- 17.4 Question Bookmarks RLS
ALTER TABLE public.question_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qbm_select" ON public.question_bookmarks;
DROP POLICY IF EXISTS "qbm_insert" ON public.question_bookmarks;
DROP POLICY IF EXISTS "qbm_delete" ON public.question_bookmarks;

CREATE POLICY "qbm_select"
    ON public.question_bookmarks FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = user_id OR
        auth.uid()::text = user_id OR
        public.is_admin()
    );

CREATE POLICY "qbm_insert"
    ON public.question_bookmarks FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = user_id OR
        auth.uid()::text = user_id OR
        public.is_admin()
    );

CREATE POLICY "qbm_delete"
    ON public.question_bookmarks FOR DELETE
    USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = user_id OR
        auth.uid()::text = user_id OR
        public.is_admin()
    );
