DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status_enum') THEN
    CREATE TYPE public.document_status_enum AS ENUM ('draft', 'pending', 'published', 'rejected');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status_enum') THEN
    CREATE TYPE public.approval_status_enum AS ENUM ('approved', 'rejected');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel_enum') THEN
    CREATE TYPE public.notification_channel_enum AS ENUM ('email');
  END IF;
END $$;

ALTER TABLE public.documents
  ALTER COLUMN status DROP DEFAULT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'status'
      AND udt_name <> 'document_status_enum'
  ) THEN
    ALTER TABLE public.documents
      ALTER COLUMN status TYPE public.document_status_enum
      USING CASE
        WHEN LOWER(COALESCE(status::text, 'draft')) IN ('draft','pending','published','rejected')
          THEN LOWER(status::text)::public.document_status_enum
        ELSE 'draft'::public.document_status_enum
      END;
  END IF;
END $$;

ALTER TABLE public.documents
  ALTER COLUMN status SET DEFAULT 'draft'::public.document_status_enum;

ALTER TABLE public.approval_history
  ALTER COLUMN status TYPE public.approval_status_enum
  USING CASE WHEN LOWER(status::text) = 'approved' THEN 'approved'::public.approval_status_enum ELSE 'rejected'::public.approval_status_enum END;

ALTER TABLE public.approval_history
  DROP CONSTRAINT IF EXISTS approval_history_rejected_reason_required,
  ADD CONSTRAINT approval_history_rejected_reason_required
  CHECK (
    status <> 'rejected'::public.approval_status_enum
    OR (reason IS NOT NULL AND length(btrim(reason)) > 0)
  );

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS document_id integer,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_sent boolean DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='notifications' AND column_name='channel' AND udt_name <> 'notification_channel_enum'
  ) THEN
    ALTER TABLE public.notifications
      ALTER COLUMN channel TYPE public.notification_channel_enum
      USING 'email'::public.notification_channel_enum;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_approval_history_document_time ON public.approval_history(document_id, approved_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_sent_at ON public.notifications(user_id, sent_at);

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_document_fk FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE SET NULL;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_public_read_published ON public.documents;
CREATE POLICY documents_public_read_published ON public.documents
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS documents_student_crud_editable ON public.documents;
CREATE POLICY documents_student_crud_editable ON public.documents
  FOR ALL USING (
    auth.uid()::text = user_id::text AND status IN ('draft', 'rejected', 'pending', 'published')
  ) WITH CHECK (
    auth.uid()::text = user_id::text AND status IN ('draft', 'rejected', 'pending')
  );

DROP POLICY IF EXISTS documents_teacher_review ON public.documents;
CREATE POLICY documents_teacher_review ON public.documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id::text = auth.uid()::text AND u.role::text IN ('teacher', 'admin')
    ) AND status = 'pending'
  ) WITH CHECK (status IN ('published', 'rejected'));