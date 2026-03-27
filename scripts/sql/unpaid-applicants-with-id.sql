WITH latest_applications AS (
	SELECT
		a.*,
		ROW_NUMBER() OVER (
			PARTITION BY a.applicant_id
			ORDER BY a.application_date DESC NULLS LAST, a.updated_at DESC NULLS LAST, a.id DESC
		) AS rn
	FROM applications a
),
first_submissions AS (
	SELECT
		ash.application_id,
		MIN(ash.changed_at) AS submitted_at
	FROM application_status_history ash
	WHERE ash.to_status = 'submitted'
	GROUP BY ash.application_id
),
applicant_phone_list AS (
	SELECT
		ap.applicant_id,
		string_agg(DISTINCT ap.phone_number, ', ' ORDER BY ap.phone_number) AS applicant_phone_numbers
	FROM applicant_phones ap
	GROUP BY ap.applicant_id
),
guardian_phone_list AS (
	SELECT
		gp.guardian_id,
		string_agg(DISTINCT gp.phone_number, ', ' ORDER BY gp.phone_number) AS guardian_phone_numbers
	FROM guardian_phones gp
	GROUP BY gp.guardian_id
),
guardian_contact_list AS (
	SELECT
		g.applicant_id,
		jsonb_agg(
			jsonb_build_object(
				'name', g.name,
				'relationship', g.relationship,
				'address', g.address,
				'occupation', g.occupation,
				'companyName', g.company_name,
				'phoneNumbers', COALESCE(gpl.guardian_phone_numbers, '')
			)
			ORDER BY g.created_at, g.id
		) AS guardian_contacts
	FROM guardians g
	LEFT JOIN guardian_phone_list gpl ON gpl.guardian_id = g.id
	GROUP BY g.applicant_id
),
payment_flags AS (
	SELECT
		a.id AS application_id,
		EXISTS (
			SELECT 1
			FROM bank_deposits bd
			WHERE bd.application_id = a.id
				AND bd.status = 'verified'
		) AS has_verified_bank_deposit,
		EXISTS (
			SELECT 1
			FROM mobile_deposits md
			WHERE md.application_id = a.id
				AND md.status = 'verified'
		) AS has_verified_mobile_deposit
	FROM applications a
)
SELECT
	a.id AS applicant_id,
	a.full_name AS applicant_name,
	u.email AS applicant_email,
	a.national_id,
	a.gender,
	a.date_of_birth,
	a.nationality,
	a.birth_place,
	a.religion,
	a.address,
	al.country,
	al.city,
	al.district,
	apl.applicant_phone_numbers,
	gcl.guardian_contacts,
	a.created_at AS applicant_created_at,
	la.id AS application_id,
	ip.name AS intake_period_name,
	p1.code AS first_choice_program_code,
	p1.name AS first_choice_program_name,
	p2.code AS second_choice_program_code,
	p2.name AS second_choice_program_name,
	CASE
		WHEN la.id IS NULL OR la.status = 'draft' THEN 'Not Submitted'
		ELSE 'Submitted'
	END AS submission_status,
	la.status AS application_status,
	CASE
		WHEN la.id IS NULL THEN 'unpaid'
		ELSE la.payment_status::text
	END AS payment_status,
	la.application_date AS application_created_at,
	COALESCE(
		fs.submitted_at,
		CASE
			WHEN la.id IS NOT NULL AND la.status <> 'draft' THEN la.application_date
			ELSE NULL
		END
	) AS submitted_at
FROM applicants a
LEFT JOIN users u ON u.id = a.user_id
LEFT JOIN applicant_locations al ON al.applicant_id = a.id
LEFT JOIN applicant_phone_list apl ON apl.applicant_id = a.id
LEFT JOIN guardian_contact_list gcl ON gcl.applicant_id = a.id
LEFT JOIN latest_applications la ON la.applicant_id = a.id AND la.rn = 1
LEFT JOIN payment_flags pf ON pf.application_id = la.id
LEFT JOIN first_submissions fs ON fs.application_id = la.id
LEFT JOIN intake_periods ip ON ip.id = la.intake_period_id
LEFT JOIN programs p1 ON p1.id = la.first_choice_program_id
LEFT JOIN programs p2 ON p2.id = la.second_choice_program_id
WHERE a.national_id IS NOT NULL
	AND btrim(a.national_id) <> ''
	AND (
		la.id IS NULL
		OR (
			la.payment_status = 'unpaid'
			AND COALESCE(pf.has_verified_bank_deposit, FALSE) = FALSE
			AND COALESCE(pf.has_verified_mobile_deposit, FALSE) = FALSE
		)
	)
ORDER BY
	CASE
		WHEN la.id IS NULL OR la.status = 'draft' THEN 0
		ELSE 1
	END,
	COALESCE(fs.submitted_at, la.application_date, a.created_at) DESC,
	a.full_name;