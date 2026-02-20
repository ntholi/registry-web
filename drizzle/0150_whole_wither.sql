ALTER TABLE "feedback_categories" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_questions" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint

-- Seed feedback categories and questions from Student Appraisal Form --

-- Clear existing test data (responses first, then questions, then categories)
DELETE FROM "feedback_responses";
DELETE FROM "feedback_questions";
DELETE FROM "feedback_categories";

-- Insert categories
INSERT INTO "feedback_categories" ("id", "name", "sort_order") VALUES
  ('cat_general', 'General', 1),
  ('cat_class_prep', 'Class Preparation', 2),
  ('cat_delivery', 'Delivery & Class Conduct', 3),
  ('cat_support', 'Support & Assistance', 4),
  ('cat_feedback', 'Feedback & Work Evaluation', 5),
  ('cat_overall', 'Overall', 6);

-- Insert questions
INSERT INTO "feedback_questions" ("id", "category_id", "text", "sort_order") VALUES
  -- General
  ('q_01', 'cat_general', 'The lecturer comes to class on time.', 1),
  ('q_02', 'cat_general', 'The lecturer treats the students with respect.', 2),
  -- Class Preparation
  ('q_03', 'cat_class_prep', 'The lecturer was prepared and organised for each class session.', 3),
  ('q_04', 'cat_class_prep', 'Criteria for grading of assignments and submission dates are clearly communicated.', 4),
  -- Delivery & Class Conduct
  ('q_05', 'cat_delivery', 'The presenting style makes the students think.', 5),
  ('q_06', 'cat_delivery', 'The assignments motivate & encourage students'' participation and independent thought.', 6),
  ('q_07', 'cat_delivery', 'The lecturer is proficient in English.', 7),
  ('q_08', 'cat_delivery', 'The lecturer uses interactive & useful teaching aid.', 8),
  -- Support & Assistance
  ('q_09', 'cat_support', 'The lecturer is concerned whether students understand the class.', 9),
  ('q_10', 'cat_support', 'The lecturer is available to assist students outside of class hours.', 10),
  -- Feedback & Work Evaluation
  ('q_11', 'cat_feedback', 'The lecturer provides immediate & useful feedback regarding the student''s performance.', 11),
  -- Overall
  ('q_12', 'cat_overall', 'Overall, how would you grade your lecturer?', 12);