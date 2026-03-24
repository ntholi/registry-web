-- Seed letter templates from docs/letters/data samples --

INSERT INTO letter_templates (id, name, content, role, is_active, created_at, updated_at)
VALUES
-- 1. Confirmation of Studentship
(
  'tpl_confirmation_student',
  'Confirmation of Studentship',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: CONFIRMATION OF STUDENTSHIP – {{studentName}}</strong></p>
<p>This is to confirm that {{studentName}} is currently a bonafide student at Limkokwing University of Creative Technology. {{gender}} is pursuing {{programName}} under the {{schoolName}}. {{studentName}} is in Year {{yearOfStudy}} Semester {{semester}} of {{genderPossessive}} studies. {{genderPossessive}} conduct is generally acceptable.</p>
<p>In my capacity as the Registrar, I assure your office that {{studentName}} is currently a genuine student in this institution and {{genderPossessive}} student number is {{stdNo}}.</p>
<p>I kindly request that you assist {{genderPossessive}} with the services {{gender}} may require from your organization as {{gender}} is an authentic student in the institution.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 2. Change of Programme
(
  'tpl_change_programme',
  'Change of Programme',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: CHANGE OF PROGRAMME – {{studentName}}</strong></p>
<p>My office notifies you that {{studentName}} ({{stdNo}}), a student who was admitted into {{programName}}, has been allowed by the Academic Management to change from this programme to a new programme. This change is possible because the student qualifies in both programmes.</p>
<p>Please assist {{studentName}} with transfer documents so that problems will not be encountered when continuing in the new programme.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 3. Completion of Qualification
(
  'tpl_completion_qual',
  'Completion of Qualification',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: CONFIRMATION OF QUALIFICATION – {{studentName}}</strong></p>
<p>This is an attestation that {{programName}} was conferred upon {{studentName}} ({{stdNo}}) after having satisfied all the requirements. The qualification was officially conferred on {{graduationDate}}.</p>
<p>It is further confirmed that the qualification is authentic and accredited by the Council on Higher Education for the Kingdom of Lesotho.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 4. Good Conduct Reference
(
  'tpl_good_conduct',
  'Good Conduct Reference',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: CONFIRMATION OF GOOD CONDUCT – {{studentName}}</strong></p>
<p>This reference of conduct is made on behalf of {{studentName}} ({{stdNo}}) who is keen to pursue further studies at your institution. The applicant currently holds {{programName}}, which {{gender}} obtained from Limkokwing University of Creative Technology.</p>
<p>In viewing {{genderPossessive}} role as a student, {{gender}} has sincerely prepared to serve as a high calibre future professional. {{gender}} has demonstrated intelligence, eagerness to learn, and is consistently a hard worker.</p>
<p>{{studentName}} is sociable, honest and upright in {{genderPossessive}} dealings with people, and can always be relied upon to carry out {{genderPossessive}} studies in an exemplary manner.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 5. Industry/Project Request
(
  'tpl_industry_request',
  'Industry/Project Request',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: REQUEST TO ALLOW LIMKOKWING STUDENTS TO CARRY OUT A PROJECT</strong></p>
<p>I humbly request your office to allow Limkokwing University of Creative Technology students to carry out a project at your premises. The project is part of the requirements for the students to complete studies in {{programName}}. The students are in Year {{yearOfStudy}} of study.</p>
<p>My office confirms that the project is strictly for academic purposes.</p>
<p>The University is grateful for the support and assistance that your organization continuously provides to the students of the institution.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 6. English Proficiency Attestation
(
  'tpl_english_proficiency',
  'English Proficiency Attestation',
  '<p>{{currentDate}}</p>
<p><strong>Attestation of English Proficiency by Home Institution</strong></p>
<p>I hereby state that {{studentName}} ({{stdNo}}) has studied for {{programName}} at Limkokwing University of Creative Technology, Lesotho Campus.</p>
<p>{{studentName}} has the full support of the university to spend a period of study or for any other reason at your institution or organization.</p>
<p>{{studentName}} has acquired adequate English language proficiency to successfully participate in {{genderPossessive}} proposed programme. I fully attest that {{gender}} can successfully function well using verbal and non-verbal communication at your reputable institution.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 7. Deferment of Studies
(
  'tpl_deferment',
  'Deferment of Studies',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: DEFERMENT OF STUDIES – {{studentName}}</strong></p>
<p>This is to confirm that {{studentName}} ({{stdNo}}), a student pursuing {{programName}} at Limkokwing University of Creative Technology, has been granted a deferment of studies.</p>
<p>{{gender}} was in Year {{yearOfStudy}} Semester {{semester}} at the time of deferment. {{gender}} is expected to resume {{genderPossessive}} studies at the beginning of the next applicable semester.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 8. Exit from Studies
(
  'tpl_exit_studies',
  'Exit from Studies',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: EXIT FROM STUDIES – {{studentName}}</strong></p>
<p>This is to confirm that {{studentName}} ({{stdNo}}) has exited from {{programName}} at Limkokwing University of Creative Technology.</p>
<p>{{gender}} was in Year {{yearOfStudy}} Semester {{semester}} at the time of exit. {{genderPossessive}} student number is {{stdNo}}.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 9. Identity Card Request
(
  'tpl_identity_card',
  'Identity Card Request',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: IDENTITY CARD REQUEST – {{studentName}}</strong></p>
<p>This is to confirm that {{studentName}} ({{stdNo}}) is a bonafide student at Limkokwing University of Creative Technology, pursuing {{programName}}. {{gender}} is currently in Year {{yearOfStudy}} Semester {{semester}}.</p>
<p>{{studentName}} requires an identity card for personal identification purposes. {{genderPossessive}} national ID number is {{nationalId}} and date of birth is {{dateOfBirth}}.</p>
<p>Kindly assist {{genderPossessive}} with the necessary services.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 10. Passport Request
(
  'tpl_passport',
  'Passport Request',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: PASSPORT REQUEST – {{studentName}}</strong></p>
<p>This is to confirm that {{studentName}} ({{stdNo}}) is a bonafide student at Limkokwing University of Creative Technology, pursuing {{programName}}. {{gender}} is currently in Year {{yearOfStudy}} Semester {{semester}}.</p>
<p>{{studentName}} requires a passport for travel purposes related to {{genderPossessive}} academic programme. {{genderPossessive}} national ID number is {{nationalId}}, nationality is {{nationality}}, and date of birth is {{dateOfBirth}}.</p>
<p>Kindly assist {{genderPossessive}} with the passport application process.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 11. Reference Letter
(
  'tpl_reference',
  'Reference Letter',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: REFERENCE LETTER – {{studentName}}</strong></p>
<p>This reference is made on behalf of {{studentName}} ({{stdNo}}) who is a student at Limkokwing University of Creative Technology pursuing {{programName}} under the {{schoolName}}.</p>
<p>{{gender}} is in Year {{yearOfStudy}} Semester {{semester}} and {{genderPossessive}} conduct has been generally acceptable throughout {{genderPossessive}} period of study.</p>
<p>I recommend {{studentName}} for any opportunity and trust that {{gender}} will prove to be a valuable asset.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 12. Reinstatement
(
  'tpl_reinstatement',
  'Reinstatement',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: REINSTATEMENT – {{studentName}}</strong></p>
<p>This is to confirm that {{studentName}} ({{stdNo}}) has been reinstated as a student at Limkokwing University of Creative Technology. {{gender}} is pursuing {{programName}} and has been readmitted into Year {{yearOfStudy}} Semester {{semester}}.</p>
<p>Kindly update your records accordingly.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 13. Visa Request
(
  'tpl_visa',
  'Visa Request',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: VISA REQUEST – {{studentName}}</strong></p>
<p>This is to confirm that {{studentName}} ({{stdNo}}) is a bonafide student at Limkokwing University of Creative Technology, pursuing {{programName}}. {{gender}} is currently in Year {{yearOfStudy}} Semester {{semester}}.</p>
<p>{{studentName}} requires a visa for travel purposes. {{genderPossessive}} nationality is {{nationality}}, national ID number is {{nationalId}}, and date of birth is {{dateOfBirth}}.</p>
<p>In my capacity as the Registrar, I assure your office that {{studentName}} is a genuine student in this institution.</p>
<p>Kindly assist {{genderPossessive}} with the visa application process.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
),

-- 14. Withdrawal from Studies
(
  'tpl_withdrawal',
  'Withdrawal from Studies',
  '<p>{{currentDate}}</p>
<p>Dear Sir/Madam,</p>
<p><strong>Re: WITHDRAWAL FROM STUDIES – {{studentName}}</strong></p>
<p>This is to confirm that {{studentName}} ({{stdNo}}) has officially withdrawn from {{programName}} at Limkokwing University of Creative Technology.</p>
<p>{{gender}} was in Year {{yearOfStudy}} Semester {{semester}} at the time of withdrawal.</p>
<p>Kindly update your records accordingly.</p>
',
  NULL,
  true,
  NOW(),
  NOW()
)

ON CONFLICT (id) DO NOTHING;