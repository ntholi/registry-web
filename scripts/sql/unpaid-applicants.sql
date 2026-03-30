-- Unpaid applicants with national ID recorded
-- Shows submission status, contact details, and application timeline

SELECT
    a.full_name AS "Full Name",
    a.national_id AS "National ID",
    a.gender AS "Gender",
    a.nationality AS "Nationality",
    a.address AS "Address",
    u.email AS "Email",
    STRING_AGG(DISTINCT ap.phone_number, ', ') AS "Phone Numbers",
    CASE
        WHEN app.status = 'draft' THEN 'Not Submitted'
        ELSE 'Submitted'
    END AS "Submission Status",
    app.payment_status AS "Payment Status",
    a.created_at AS "Applicant Created At",
    app.updated_at AS "Last Updated"
FROM applicants a
JOIN applications app ON app.applicant_id = a.id
LEFT JOIN users u ON u.id = a.user_id
LEFT JOIN applicant_phones ap ON ap.applicant_id = a.id
LEFT JOIN intake_periods ip ON ip.id = app.intake_period_id
WHERE NULLIF(TRIM(a.national_id), '') IS NOT NULL
  AND app.payment_status = 'unpaid'
GROUP BY
    a.id, a.full_name, a.national_id, a.gender, a.nationality, a.address,
    u.email, app.id, app.status, app.payment_status, ip.name,
    a.created_at, app.application_date, app.updated_at
ORDER BY app.status desc, a.nationality, a.full_name;
