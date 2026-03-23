export const PLACEHOLDERS = [
	{ token: 'studentName', label: 'Student Name' },
	{ token: 'stdNo', label: 'Student Number' },
	{ token: 'nationalId', label: 'National ID' },
	{ token: 'programName', label: 'Program Name' },
	{ token: 'schoolName', label: 'School Name' },
	{ token: 'currentDate', label: 'Current Date' },
	{ token: 'gender', label: 'He/She' },
	{ token: 'genderPossessive', label: 'His/Her' },
	{ token: 'statusType', label: 'Status Type' },
	{ token: 'termCode', label: 'Term Code' },
	{ token: 'semester', label: 'Semester' },
	{ token: 'serialNumber', label: 'Serial Number' },
	{ token: 'graduationDate', label: 'Graduation Date' },
] as const;

export type PlaceholderToken = (typeof PLACEHOLDERS)[number]['token'];
