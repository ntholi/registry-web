-- Seed letter templates and default recipients --

-- 1. Confirmation of Studentship
INSERT INTO letter_templates (id, name, subject, salutation, content, sign_off_name, sign_off_title, role, is_active, created_at, updated_at)
VALUES (
  'tpl_confirmation_student',
  'Confirmation of Studentship',
  'CONFIRMATION OF STUDENTSHIP – {{studentName}}',
  'Dear Sir/Madam,',
  '<p>This is to confirm that {{studentName}} is currently a bonafide student at Limkokwing University of Creative Technology. {{gender}} is pursuing {{programName}}. {{studentName}} is in {{semesterName}} of {{genderPossessive}} studies. {{genderPossessive}} conduct is generally acceptable.</p>
<p>In my capacity as the Registrar, I assure your office that {{studentName}} is currently a genuine student in this institution and {{genderPossessive}} student number is {{stdNo}}.</p>
<p>I kindly request that you assist {{genderPossessive}} with the services {{gender}} may require from your organization as {{gender}} is an authentic student in the institution.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 2. Change of Programme
(
  'tpl_change_programme',
  'Change of Programme',
  'CHANGE OF PROGRAMME – {{studentName}}',
  'Dear Madam,',
  '<p>My office notifies the Director that {{studentName}} ({{stdNo}}), a student who was admitted into {{programName}}, has been allowed by the Academic Management to change from this programme to a new programme. This change is possible because {{studentName}} qualifies in both programmes.</p>
<p>Please assist {{studentName}} with transfer documents so that problems will not be encountered when continuing in the new programme.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 3. Completion of Qualification
(
  'tpl_completion_qual',
  'Completion of Qualification',
  'CONFIRMATION OF QUALIFICATION – {{studentName}}',
  'Dear Sir/Madam,',
  '<p>This is an attestation that {{programName}} was conferred upon {{studentName}} ({{stdNo}}) after having satisfied all the requirements. The qualification was officially conferred on {{graduationDate}}. It is further confirmed that the qualification is authentic and accredited by the Council on Higher Education for the Kingdom of Lesotho.</p>
<p>Kindly take note that, Lesotho Qualifications Framework (LQF) reflects developments and trends to transform the provision of qualifications into coherent country frameworks that are consistent worldwide. The revision of the LQF aligns qualifications provision with countries in the Southern African Development Community (SADC) and beyond, thus allowing qualifications to be compared, and the mobility of learners to be enhanced. Limkokwing University of Creative Technology, where the qualification was obtained, is a private university established in terms of Higher Education Act, 2004 of the Kingdom of Lesotho.</p>
<p>Should you need any further information with regard to this particular student, please contact the Head of Academics at Limkokwing University of Creative Technology.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 4. Good Conduct Reference
(
  'tpl_good_conduct',
  'Good Conduct Reference',
  'CONFIRMATION OF GOOD CONDUCT – {{studentName}}',
  'Dear Sir/Madam,',
  '<p>This reference of conduct is made on behalf of {{studentName}} ({{stdNo}}) who is keen to pursue further studies at your institution. The applicant currently holds {{programName}}, which {{gender}} obtained from Limkokwing University of Creative Technology.</p>
<p>In viewing {{genderPossessive}} role as a student, {{gender}} has sincerely prepared to serve as a high calibre future professional. I would rate {{genderPossessive}} high on several scores. {{gender}} has demonstrated intelligence, eagerness to learn, and is consistently a hard worker.</p>
<p>{{studentName}} is sociable, honest and upright in {{genderPossessive}} dealings with people, and can always be relied upon to carry out {{genderPossessive}} studies in an exemplary and diligent way. Undoubtedly, with some experience in the higher education system in Lesotho, {{gender}} has a wealth of knowledge and skills to meet the demands of post-graduate studies. Accordingly, I vouch for {{genderPossessive}} ability and confidence to meet the demands and challenges of higher learning post-graduate studies. I strongly recommend {{studentName}} for admission into the proposed programme in your institution.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 5. Industry/Project Request
(
  'tpl_industry_request',
  'Industry/Project Request',
  'REQUEST TO ALLOW LIMKOKWING STUDENTS TO CARRY OUT A PROJECT',
  'Dear Sir/Madam,',
  '<p>I humbly request your office to allow Limkokwing University of Creative Technology students to carry out a project at your premises. The project is part of the requirements for the students to complete their studies in {{programName}}. The students are in {{semesterName}} of study.</p>
<p>My office confirms that the project is strictly for academic purposes and will not be used for any other purpose outside of the LUCT course structures.</p>
<p>The University is grateful for the support and assistance that your organization continuously provides to the students of the institution.</p>',
  'Dr. Lelingoana Lerotholi',
  'DIRECTOR – ACADEMIC MANAGEMENT',
  NULL, true, NOW(), NOW()
),

-- 6. English Proficiency Attestation
(
  'tpl_english_proficiency',
  'English Proficiency Attestation',
  NULL,
  'To Whom It May Concern,',
  '<p><strong>Attestation of English Proficiency by Home Institution</strong></p>
<p>I hereby state that {{studentName}} ({{stdNo}}) has studied for {{programName}} at Limkokwing University of Creative Technology, Lesotho Campus. {{studentName}} has the full support of the university to spend a period of study or for any other reason at your institution or organization.</p>
<p>{{studentName}} has acquired adequate English language proficiency to successfully participate in {{genderPossessive}} proposed programme. I fully attest that {{gender}} can successfully function well using verbal and non-verbal communication at your reputable institution.</p>
<p>Kindly be notified that this qualification was obtained from the institution where the medium of instructions, the examinations and all forms of communication were done in English. Qualifications or any other academic documents obtained from Limkokwing University of Creative Technology do not include any explicit information about the rankings achieved by graduates. The university grades are rather interpreted by means of CGPA (Cumulative Grade Point Average) to demonstrate academic achievement of graduates. The transcripts obtained from the university also provide interpretations of the very CGPA system. We firmly believe that this attestation will provide more insights for your information requirements about the university.</p>',
  'Dr. Lelingoana Lerotholi',
  'DIRECTOR – ACADEMIC MANAGEMENT',
  NULL, true, NOW(), NOW()
),

-- 7. Deferment of Studies
(
  'tpl_deferment',
  'Deferment of Studies',
  'DEFERMENT OF STUDIES – {{studentName}}',
  'Dear Sir/Madam,',
  '<p>My office notifies you that {{studentName}}, Student number {{stdNo}}, had enrolled in {{programName}}. {{gender}} is in {{semesterName}} of studies. {{studentName}} is officially allowed to defer studies.</p>
<p>Please assist {{genderPossessive}} with deferment procedures so that {{gender}} does not encounter problems when {{gender}} resumes studies.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 8. Exit from Studies
(
  'tpl_exit_studies',
  'Exit from Studies',
  'EXIT FROM STUDIES – {{studentName}}',
  'Dear Sir/Madam,',
  '<p>My office notifies you that {{studentName}}, Student number {{stdNo}}, had enrolled for {{programName}}. {{studentName}} is in {{semesterName}} of studies. {{studentName}} has been granted the official exit from studies.</p>
<p>Please assist {{genderPossessive}} with exit procedures.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 9. Identity Card Request
(
  'tpl_identity_card',
  'Identity Card Request',
  'URGENT APPLICATION FOR NATIONAL IDENTITY CARD: {{studentName}}',
  'Dear Sir/Madam,',
  '<p>My office confirms to the Director that {{studentName}} is a {{semesterName}} student in the {{schoolName}} at Limkokwing University of Creative Technology. {{genderPossessive}} student number is {{stdNo}}. {{studentName}} requires an identity document. {{genderPossessive}} national ID number is {{nationalId}} and date of birth is {{dateOfBirth}}.</p>
<p>The University is grateful for the assistance that the Director continually gives students and the community of Limkokwing University.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 10. Passport Request
(
  'tpl_passport',
  'Passport Request',
  'URGENT APPLICATION FOR NATIONAL PASSPORT: {{studentName}}',
  'Dear Sir/Madam,',
  '<p>My office confirms to the Director Emergency Passport that {{studentName}} is a {{semesterName}} student in the {{schoolName}} at Limkokwing University of Creative Technology. {{genderPossessive}} student number is {{stdNo}}. {{studentName}} requires an urgent travel document. {{genderPossessive}} nationality is {{nationality}} and date of birth is {{dateOfBirth}}.</p>
<p>The University is grateful for the assistance that the Director Emergency Passport constantly gives students and the community of Limkokwing University.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 11. Reference Letter
(
  'tpl_reference',
  'Reference Letter',
  'REFERENCE – {{studentName}}',
  'Dear Sir/Madam,',
  '<p>This reference is made on behalf of {{studentName}} ({{stdNo}}) who is keen to pursue post-graduate studies in your prestigious university. The applicant currently holds {{programName}}, obtained from Limkokwing University of Creative Technology, Lesotho campus.</p>
<p>In viewing {{genderPossessive}} role as a student, {{gender}} has sincerely prepared to serve as a high calibre professional. I would rate {{genderPossessive}} high on several scores. {{gender}} has demonstrated intelligence, eagerness to learn, and is consistently a hard worker. English language is used as a medium of instructions in the context of Lesotho.</p>
<p>{{studentName}} is sociable, honest and upright in {{genderPossessive}} dealings with people, and can always be relied upon to carry out {{genderPossessive}} studies in an exemplary and diligent way. Undoubtedly, with some experience in the higher education system, {{gender}} has essential knowledge and skills to meet the demands of post-graduate studies. Accordingly, I vouch for {{genderPossessive}} ability and confidence to meet the demands and challenges of higher learning post-graduate studies. I strongly recommend {{studentName}} for admission into the proposed programme.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 12. Reinstatement
(
  'tpl_reinstatement',
  'Reinstatement',
  'REINSTATEMENT INTO STUDIES – {{studentName}}',
  'Dear Sir/Madam,',
  '<p>My office notifies you that {{studentName}} ({{stdNo}}) has been reinstated into {{programName}}. {{gender}} is reinstating into {{semesterName}} of study.</p>
<p>{{gender}} is reinstating as per the scheduled academic calendar.</p>
<p>Kindly assist {{genderPossessive}} with reinstatement procedures so that {{gender}} does not encounter any hindrance.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 13. Visa Request
(
  'tpl_visa',
  'Visa Request',
  'URGENT APPLICATION FOR VISA FOR TRAVELING: {{studentName}}',
  'Dear Sir/Madam,',
  '<p>My office confirms that {{studentName}} is a {{semesterName}} student in the {{schoolName}} at Limkokwing University of Creative Technology. {{genderPossessive}} student number is {{stdNo}}. {{genderPossessive}} nationality is {{nationality}} and date of birth is {{dateOfBirth}}.</p>
<p>In my capacity as the Registrar, I assure your office that {{studentName}} is a genuine student in this institution.</p>
<p>The University is grateful for the assistance that your department continually provides to students and the community of Limkokwing University.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 14. Withdrawal from Studies
(
  'tpl_withdrawal',
  'Withdrawal from Studies',
  'WITHDRAWAL FROM STUDIES – {{studentName}}',
  'Dear Sir/Madam,',
  '<p>My office notifies you that {{studentName}}, Student number {{stdNo}}, had registered for {{programName}}. {{studentName}} is in {{semesterName}} of studies. {{gender}} is officially being granted withdrawal from studies.</p>
<p>Please assist {{genderPossessive}} with withdrawal procedures so that {{gender}} does not encounter problems.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
),

-- 15. Bank/Loan Request
(
  'tpl_bank_request',
  'Bank/Loan Request',
  'REQUEST FOR STUDENT ASSISTANCE – {{studentName}}',
  'Dear Sir/Madam,',
  '<p>My office requests that you assist {{studentName}} who is currently a bonafide student in the {{schoolName}} at Limkokwing University of Creative Technology. {{genderPossessive}} student number is {{stdNo}}. {{gender}} does not have bursary assistance for {{genderPossessive}} studies and therefore requires a student loan.</p>
<p>Please assist {{genderPossessive}} with the required services so that {{gender}} may be able to proceed without hindrance in {{genderPossessive}} studies.</p>',
  '''MATEBOHO MOOROSI (Mrs.)',
  'REGISTRAR',
  NULL, true, NOW(), NOW()
)
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- Seed default recipients for templates that commonly address specific orgs --

-- NMDS recipients for deferment, exit, reinstatement, change of programme, withdrawal
INSERT INTO letter_recipients (id, template_id, title, org, address, city, popularity)
VALUES
  ('rcpt_nmds_defer', 'tpl_deferment', 'The Director', 'N.M.D.S.', 'Box 517', 'MASERU', 10),
  ('rcpt_nmds_exit', 'tpl_exit_studies', 'The Director', 'N.M.D.S.', 'Box 517', 'MASERU', 10),
  ('rcpt_nmds_reinst', 'tpl_reinstatement', 'The Director', 'N.M.D.S.', 'Box 517', 'MASERU', 10),
  ('rcpt_nmds_change', 'tpl_change_programme', 'The Director', 'N.M.D.S.', 'Box 517', 'MASERU', 10),
  ('rcpt_nmds_withdraw', 'tpl_withdrawal', 'The Director', 'N.M.D.S.', 'Box 517', 'MASERU', 10),

  -- Econet data letter recipient for studentship confirmation
  ('rcpt_econet', 'tpl_confirmation_student', 'Directing Manager', 'Econet Telecom Lesotho', NULL, 'Maseru 100', 5),

  -- Passport director recipient
  ('rcpt_passport_dir', 'tpl_passport', 'The Director', 'Emergency Passport', NULL, 'MASERU', 5),

  -- Identity card director recipient
  ('rcpt_id_dir', 'tpl_identity_card', 'The Director', 'National Identity & Civil Registry', NULL, 'MASERU', 5)
ON CONFLICT (id) DO NOTHING;