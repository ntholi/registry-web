-- Normalize nationality values in applicants table
UPDATE applicants SET nationality = 'Lesotho'
WHERE LOWER(TRIM(nationality)) IN ('lesotho', 'mosotho', 'basotho', 'sotho');

UPDATE applicants SET nationality = 'Eswatini'
WHERE LOWER(TRIM(nationality)) IN ('eswatini', 'swazi', 'swaziland', 'liswati');

UPDATE applicants SET nationality = 'South Africa'
WHERE LOWER(TRIM(nationality)) IN ('south africa', 'south african', 'rsa');

UPDATE applicants SET nationality = 'Malaysia'
WHERE LOWER(TRIM(nationality)) IN ('malaysia', 'malaysian');

UPDATE applicants SET nationality = 'Maldives'
WHERE LOWER(TRIM(nationality)) IN ('maldives', 'maldivian');

UPDATE applicants SET nationality = 'Tajikistan'
WHERE LOWER(TRIM(nationality)) IN ('tajikistan', 'tajik');

UPDATE applicants SET nationality = NULL
WHERE TRIM(nationality) !~ '^[A-Za-z\s\-]+$';

-- Normalize nationality values in students table
UPDATE students SET nationality = 'Lesotho'
WHERE LOWER(TRIM(nationality)) IN ('lesotho', 'mosotho', 'basotho', 'sotho');

UPDATE students SET nationality = 'Eswatini'
WHERE LOWER(TRIM(nationality)) IN ('eswatini', 'swazi', 'swaziland', 'liswati');

UPDATE students SET nationality = 'South Africa'
WHERE LOWER(TRIM(nationality)) IN ('south africa', 'south african', 'rsa');

UPDATE students SET nationality = 'Ghana'
WHERE LOWER(TRIM(nationality)) IN ('ghana', 'ghanaian');

UPDATE students SET nationality = 'Zimbabwe'
WHERE LOWER(TRIM(nationality)) IN ('zimbabwe', 'zimbabwean');

UPDATE students SET nationality = 'Pakistan'
WHERE LOWER(TRIM(nationality)) IN ('pakistan', 'pakistani');

UPDATE students SET nationality = 'Palau'
WHERE LOWER(TRIM(nationality)) IN ('palau', 'palauan');

UPDATE students SET nationality = 'Peru'
WHERE LOWER(TRIM(nationality)) IN ('peru', 'peruvian');

UPDATE students SET nationality = 'India'
WHERE LOWER(TRIM(nationality)) IN ('india', 'indian');

UPDATE students SET nationality = 'Japan'
WHERE LOWER(TRIM(nationality)) IN ('japan', 'japanese');

UPDATE students SET nationality = 'South Korea'
WHERE LOWER(TRIM(nationality)) IN ('south korea', 'south korean');

UPDATE students SET nationality = 'Lebanon'
WHERE LOWER(TRIM(nationality)) IN ('lebanon', 'lebanese');

UPDATE students SET nationality = 'Norway'
WHERE LOWER(TRIM(nationality)) IN ('norway', 'norwegian');

UPDATE students SET nationality = 'Oman'
WHERE LOWER(TRIM(nationality)) IN ('oman', 'omani');

UPDATE students SET nationality = 'Romania'
WHERE LOWER(TRIM(nationality)) IN ('romania', 'romanian');

UPDATE students SET nationality = 'Saint Lucia'
WHERE LOWER(TRIM(nationality)) IN ('saint lucia', 'saint lucian');

UPDATE students SET nationality = 'Afghanistan'
WHERE LOWER(TRIM(nationality)) IN ('afghanistan', 'afghan');

UPDATE students SET nationality = 'Australia'
WHERE LOWER(TRIM(nationality)) IN ('australia', 'norfuk');