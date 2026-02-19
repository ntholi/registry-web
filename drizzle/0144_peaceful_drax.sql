-- Rename feedback_periods → feedback_cycles (skip if already renamed)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedback_periods') THEN
    ALTER TABLE "feedback_periods" RENAME TO "feedback_cycles";
  END IF;
END $$;

-- Rename feedback_passphrases → feedback_cycle_passphrases (skip if already renamed)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedback_passphrases') THEN
    ALTER TABLE "feedback_passphrases" RENAME COLUMN "period_id" TO "cycle_id";
    ALTER TABLE "feedback_passphrases" RENAME TO "feedback_cycle_passphrases";
  END IF;
END $$;

-- Rename indexes (skip if already renamed)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_feedback_passphrases_period_class') THEN
    ALTER INDEX "idx_feedback_passphrases_period_class" RENAME TO "idx_feedback_cycle_passphrases_cycle_class";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_feedback_passphrases_passphrase') THEN
    ALTER INDEX "idx_feedback_passphrases_passphrase" RENAME TO "idx_feedback_cycle_passphrases_passphrase";
  END IF;
END $$;

-- Rename FK constraints (skip if already renamed)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'feedback_passphrases_period_id_feedback_periods_id_fk') THEN
    ALTER TABLE "feedback_cycle_passphrases" RENAME CONSTRAINT "feedback_passphrases_period_id_feedback_periods_id_fk" TO "feedback_cycle_passphrases_cycle_id_feedback_cycles_id_fk";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'feedback_periods_term_id_terms_id_fk') THEN
    ALTER TABLE "feedback_cycles" RENAME CONSTRAINT "feedback_periods_term_id_terms_id_fk" TO "feedback_cycles_term_id_terms_id_fk";
  END IF;
END $$;