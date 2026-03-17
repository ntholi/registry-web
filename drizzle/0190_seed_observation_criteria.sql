-- Seed observation categories and criteria from PRL form

-- Section 1: Teaching Observation — Categories
INSERT INTO "observation_categories" ("id", "name", "section", "sort_order") VALUES
  ('cat_learn_obj',  'Learning Objectives and Goals',    'teaching_observation', 0),
  ('cat_instr_del',  'Instructional Delivery',           'teaching_observation', 1),
  ('cat_teach_meth', 'Teaching Methods and Strategies',  'teaching_observation', 2),
  ('cat_stud_part',  'Student Participation and Interaction', 'teaching_observation', 3),
  ('cat_class_mgmt', 'Classroom Management',             'teaching_observation', 4),
  ('cat_res_tech',   'Use of Resources and Technology',  'teaching_observation', 5),
  ('cat_stud_und',   'Student Understanding and Learning', 'teaching_observation', 6),
  ('cat_prof_att',   'Professionalism and Attitude',     'teaching_observation', 7),
  ('cat_assess',     'Assessments',                      'assessments', 0),
  ('cat_other',      'Other',                            'other', 0)
ON CONFLICT ("id") DO NOTHING;

-- Section 1: Teaching Observation — Criteria

-- Learning Objectives and Goals
INSERT INTO "observation_criteria" ("id", "category_id", "text", "description", "sort_order") VALUES
  ('crit_lo_1', 'cat_learn_obj', 'Clarity: Are the learning objectives clearly stated and communicated to students?', NULL, 0),
  ('crit_lo_2', 'cat_learn_obj', 'Alignment: Do the teaching activities align with the stated objectives?', NULL, 1)
ON CONFLICT ("id") DO NOTHING;

-- Instructional Delivery
INSERT INTO "observation_criteria" ("id", "category_id", "text", "description", "sort_order") VALUES
  ('crit_id_1', 'cat_instr_del', 'Engagement: Does the lecturer engage students actively through questioning, discussions, or interactive activities?', 'The lecturer asks open-ended questions; Encourages critical thinking; Provides constructive feedback; Incorporates group activities; Provides positive feedback; Offers positive reinforcement; Encourages peer feedback', 0),
  ('crit_id_2', 'cat_instr_del', 'Clarity and Organization: Is the content presented in a logical, clear, and organized manner?', 'Expertly defines complex concepts in simple terms; Lecturer emphasizes and summarizes key points clearly; Uses real world examples to illustrate key points; Speaks confidently, varying pace, tone, and pitch for emphasis; Uses visual aids, props, or integrates technology to enhance clarity and engagement where necessary', 1),
  ('crit_id_3', 'cat_instr_del', 'Pacing: Is the pace of the lesson appropriate for the students'' understanding?', 'Balanced content coverage: lecturer covers necessary material without rushing or dragging; Clear time allocation: lecturer allocates sufficient time for each activity; Teacher flexibility: teacher adjusts pace in response to student needs or questions; The pace of talk is appropriate, not too fast, and not dragged', 2)
ON CONFLICT ("id") DO NOTHING;

-- Teaching Methods and Strategies
INSERT INTO "observation_criteria" ("id", "category_id", "text", "description", "sort_order") VALUES
  ('crit_tm_1', 'cat_teach_meth', 'Variety: Are a variety of teaching methods used (e.g., lectures, group work, multimedia, case studies, presentations)?', NULL, 0),
  ('crit_tm_2', 'cat_teach_meth', 'Appropriateness: Are the methods and strategies suitable for the content and the students'' learning styles?', 'Use of questions (open-ended and close ended-questions); Discussions (whole class discussions/small-group discussions/think-pair-share); Visual aids (diagrams/charts/graphs/videos); Hands-on activities (experiments/simulations/role-playing)', 1)
ON CONFLICT ("id") DO NOTHING;

-- Student Participation and Interaction
INSERT INTO "observation_criteria" ("id", "category_id", "text", "description", "sort_order") VALUES
  ('crit_sp_1', 'cat_stud_part', 'Inclusivity: Are all students given opportunities to participate?', 'Lecturer provides regular opportunities for participation with clear expectations; Lecturer acknowledges and values diverse perspectives and uses them constructively; Lecturer uses innovative strategies to engage quiet students', 0),
  ('crit_sp_2', 'cat_stud_part', 'Feedback: How does the lecturer provide feedback during activities or discussions?', 'Provide constructive feedback; Offers positive reinforcement; Encourages peer feedback; The lecturer checks understanding and effectively uses student mistakes constructively to facilitate learning', 1)
ON CONFLICT ("id") DO NOTHING;

-- Classroom Management
INSERT INTO "observation_criteria" ("id", "category_id", "text", "description", "sort_order") VALUES
  ('crit_cm_1', 'cat_class_mgmt', 'Behavior: How does the lecturer handle disruptions or manage classroom behavior?', 'The lecturer keeps distractions to a minimum by handling any disruptive students; Students appear engaged in the classroom', 0)
ON CONFLICT ("id") DO NOTHING;

-- Use of Resources and Technology
INSERT INTO "observation_criteria" ("id", "category_id", "text", "description", "sort_order") VALUES
  ('crit_rt_1', 'cat_res_tech', 'Integration: How effectively does the lecturer integrate resources and technology into the lesson?', 'The classroom and learning resources are used effectively (e.g. writing on the whiteboard is clearly set out, presentation slides are clear and appropriate, using of projectors, use of computers)', 0)
ON CONFLICT ("id") DO NOTHING;

-- Student Understanding and Learning
INSERT INTO "observation_criteria" ("id", "category_id", "text", "description", "sort_order") VALUES
  ('crit_su_1', 'cat_stud_und', 'Checking for Understanding: Does the lecturer use methods to check for student understanding throughout the lesson?', 'The lecturer continually provides time for questions throughout the lecture; The lecturer responds to questions with patience and understanding; The lecturer uses examples and/or illustrations to explain content; Lecturer responds to learners'' questions with clarity and conciseness', 0),
  ('crit_su_2', 'cat_stud_und', 'Adaptability: How does the lecturer adjust their teaching based on student feedback or understanding?', 'The Lecturer frequently assesses students understanding, and modifies teaching strategies as necessary to increase effectiveness in achieving learning outcomes', 1)
ON CONFLICT ("id") DO NOTHING;

-- Professionalism and Attitude
INSERT INTO "observation_criteria" ("id", "category_id", "text", "description", "sort_order") VALUES
  ('crit_pa_1', 'cat_prof_att', 'Enthusiasm: Does the lecturer show enthusiasm and passion for the subject matter?', 'Maintains eye-contact with students throughout the lessons; Uses expressive voice, appropriate pauses, varying tone and pitch to convey the message and emphasis on important points; Maintains a good posture and a welcoming facial expression; Actively and steadily moves around the room to interact with students', 0),
  ('crit_pa_2', 'cat_prof_att', 'Respect: Is there mutual respect between the lecturer and students?', 'Uses appropriate language to foster respect for all; Reprimands disrespectful behavior', 1)
ON CONFLICT ("id") DO NOTHING;

-- Section 2: Assessments
INSERT INTO "observation_criteria" ("id", "category_id", "text", "description", "sort_order") VALUES
  ('crit_as_1', 'cat_assess', 'Sets appropriate student assessments and issues them on time', NULL, 0),
  ('crit_as_2', 'cat_assess', 'Analyzes student''s progress records, monitors and takes remedial measures', NULL, 1),
  ('crit_as_3', 'cat_assess', 'Gives students feedback on time', NULL, 2)
ON CONFLICT ("id") DO NOTHING;

-- Section 3: Other
INSERT INTO "observation_criteria" ("id", "category_id", "text", "description", "sort_order") VALUES
  ('crit_ot_1', 'cat_other', 'Lecturer has complete course files', NULL, 0)
ON CONFLICT ("id") DO NOTHING;