-- Supabase compatibility migration for current backend logic
-- Safe to run multiple times (uses IF NOT EXISTS)

-- 1) files table (used by getTopicFiles; app now has fallback if missing)
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    topic_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_topic_id ON public.files(topic_id);

-- 2) flashcard_study_sessions table (used by study stats/session tracking)
CREATE TABLE IF NOT EXISTS public.flashcard_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    set_id UUID NOT NULL,
    study_mode TEXT NOT NULL,
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    session_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_user_id
    ON public.flashcard_study_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_set_id
    ON public.flashcard_study_sessions(set_id);

CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_session_date
    ON public.flashcard_study_sessions(session_date DESC);
