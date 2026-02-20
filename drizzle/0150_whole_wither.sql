-- Seed feedback categories and questions from Student Appraisal Form --

-- Clear existing test data (responses first, then questions, then categories)
DELETE FROM "feedback_responses";
DELETE FROM "feedback_questions";
DELETE FROM "feedback_categories";

-- Insert categories
INSERT INTO "feedback_categories" ("id", "name") VALUES
  ('cat_general', 'General'),
  ('cat_teaching', 'Teaching & Class Conduct'),
  ('cat_support', 'Support & Assistance'),
  ('cat_feedback', 'Feedback & Work Reliability'),
  ('cat_overall', 'Overall');

-- Insert questions
INSERT INTO "feedback_questions" ("id", "category_id", "text") VALUES
  -- General
  ('q_01', 'cat_general', 'The Presenter comes to class prepared for each class session.'),
  ('q_02', 'cat_general', 'The Presenter covers the syllabus with impact.'),
  ('q_03', 'cat_general', 'The lecturer is well prepared for assignments and solutions, dates etc clearly.'),
  -- Teaching & Class Conduct
  ('q_04', 'cat_teaching', 'The Presenting style makes the students think.'),
  ('q_05', 'cat_teaching', 'The assignments motivate & encourage student participation and independent thought.'),
  ('q_06', 'cat_teaching', 'The lecturer is proficient in English.'),
  ('q_07', 'cat_teaching', 'The lecturer provides proficient & useful teaching skill.'),
  -- Support & Assistance
  ('q_08', 'cat_support', 'The lecturer is concerned whether students understand the class.'),
  ('q_09', 'cat_support', 'The lecturer is available to assist students outside of class hours.'),
  -- Feedback & Work Reliability
  ('q_10', 'cat_feedback', 'The course provides immediate feedback regarding the work.'),
  ('q_11', 'cat_feedback', 'The course materials/notes are available at all times.'),
  -- Overall
  ('q_12', 'cat_overall', 'Overall performance.'),
  ('q_13', 'cat_overall', 'Overall, how would you grade your lecturer?');