export const PLACEHOLDERS = [
	{ token: 'studentName', label: 'Student Name' },
	{ token: 'stdNo', label: 'Student Number' },
	{ token: 'nationalId', label: 'National ID' },
	{ token: 'dateOfBirth', label: 'Date of Birth' },
	{ token: 'nationality', label: 'Nationality' },
	{ token: 'programName', label: 'Program Name' },
	{ token: 'schoolName', label: 'School Name' },
	{ token: 'yearOfStudy', label: 'Year of Study' },
	{ token: 'semester', label: 'Semester' },
	{ token: 'currentDate', label: 'Current Date' },
	{ token: 'gender', label: 'He/She' },
	{ token: 'genderPossessive', label: 'His/Her' },
	{ token: 'graduationDate', label: 'Graduation Date' },
] as const;

export type PlaceholderToken = (typeof PLACEHOLDERS)[number]['token'];
