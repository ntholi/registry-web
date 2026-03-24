type Placeholder = { token: string; label: string };

type PlaceholderGroup = {
	group: string;
	items: readonly Placeholder[];
};

export const PLACEHOLDER_GROUPS: readonly PlaceholderGroup[] = [
	{
		group: 'Student',
		items: [
			{ token: 'studentName', label: 'Full Name' },
			{ token: 'stdNo', label: 'Student Number' },
			{ token: 'nationalId', label: 'National ID' },
			{ token: 'dateOfBirth', label: 'Date of Birth' },
			{ token: 'nationality', label: 'Nationality' },
			{ token: 'gender', label: 'He/She' },
			{ token: 'genderPossessive', label: 'His/Her' },
		],
	},
	{
		group: 'Academic',
		items: [
			{ token: 'programName', label: 'Program Name' },
			{ token: 'schoolName', label: 'School Name' },
			{ token: 'semesterName', label: 'Semester Name' },
			{ token: 'yearOfStudy', label: 'Year of Study' },
			{ token: 'graduationDate', label: 'Graduation Date' },
		],
	},
	{
		group: 'General',
		items: [{ token: 'currentDate', label: 'Current Date' }],
	},
] as const;

export const PLACEHOLDERS = PLACEHOLDER_GROUPS.flatMap((g) => g.items);

export type PlaceholderToken = (typeof PLACEHOLDERS)[number]['token'];
