-- Rename feedback_cycle_passphrases back to feedback_passphrases
ALTER TABLE "feedback_cycle_passphrases" RENAME TO "feedback_passphrases";

-- Rename indexes
ALTER INDEX "idx_feedback_cycle_passphrases_passphrase" RENAME TO "idx_feedback_passphrases_passphrase";
ALTER INDEX "idx_feedback_cycle_passphrases_cycle_class" RENAME TO "idx_feedback_passphrases_cycle_class";

-- Rename FK constraints
ALTER TABLE "feedback_passphrases" RENAME CONSTRAINT "feedback_cycle_passphrases_cycle_id_feedback_cycles_id_fk" TO "feedback_passphrases_cycle_id_feedback_cycles_id_fk";
ALTER TABLE "feedback_passphrases" RENAME CONSTRAINT "feedback_cycle_passphrases_structure_semester_id_structure_seme" TO "feedback_passphrases_structure_semester_id_structure_semesters_id_fk";
ALTER TABLE "feedback_passphrases" RENAME CONSTRAINT "feedback_cycle_passphrases_passphrase_unique" TO "feedback_passphrases_passphrase_unique";