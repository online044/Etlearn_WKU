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

-- 2. STUDENT PROFILES TABLE
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
