interface SystemField {
	key: string;
	label: string;
	group: 'student' | 'kin' | 'ignore';
}

export const SYSTEM_FIELDS: SystemField[] = [
	{ key: 'name', label: 'Full Name', group: 'student' },
	{ key: 'nationalId', label: 'National ID', group: 'student' },
	{ key: 'gender', label: 'Gender', group: 'student' },
	{ key: 'dateOfBirth', label: 'Date of Birth', group: 'student' },
	{ key: 'phone1', label: 'Phone 1', group: 'student' },
	{ key: 'phone2', label: 'Phone 2', group: 'student' },
	{ key: 'country', label: 'Country', group: 'student' },
	{ key: 'nationality', label: 'Nationality', group: 'student' },
	{ key: 'birthPlace', label: 'Birth Place', group: 'student' },
	{ key: 'religion', label: 'Religion', group: 'student' },
	{ key: 'race', label: 'Race', group: 'student' },
	{ key: 'maritalStatus', label: 'Marital Status', group: 'student' },
	{ key: 'courseOfStudy', label: 'Course of Study', group: 'student' },
	{ key: 'kinName', label: 'Guardian/Next of Kin Name', group: 'kin' },
	{ key: 'kinPhone', label: 'Guardian/Next of Kin Phone', group: 'kin' },
	{ key: '_skip', label: '— Skip this column —', group: 'ignore' },
];

export const FIELD_SELECT_DATA = SYSTEM_FIELDS.map((f) => ({
	value: f.key,
	label: f.label,
	group:
		f.group === 'student'
			? 'Student'
			: f.group === 'kin'
				? 'Next of Kin'
				: 'Other',
}));

export type ColumnMapping = Record<number, string>;

export interface ParsedStudent {
	name: string;
	nationalId: string;
	gender: string;
	dateOfBirth: string;
	phone1: string;
	phone2: string;
	country: string;
	nationality: string;
	birthPlace: string;
	religion: string;
	race: string;
	maritalStatus: string;
	courseOfStudy: string;
	kinName: string;
	kinPhone: string;
}

export interface ImportProgress {
	total: number;
	completed: number;
	succeeded: number;
	failed: number;
	results: ImportResult[];
}

export interface ImportResult {
	row: number;
	name: string;
	stdNo?: number;
	error?: string;
}

export const HEADER_SYNONYMS: Record<string, string[]> = {
	name: [
		'full name',
		'fullname',
		'name',
		'student name',
		'names',
		'full names',
		'name and surname',
	],
	nationalId: [
		'national id',
		'id number',
		'national id number',
		'id no',
		'id',
		'passport',
	],
	gender: ['gender', 'sex'],
	dateOfBirth: [
		'date of birth',
		'dob',
		'birth date',
		'birthdate',
		'date_of_birth',
	],
	phone1: [
		'phone',
		'phone 1',
		'phone1',
		'primary phone',
		'cell',
		'mobile',
		'primary phone number',
		'telephone',
	],
	phone2: [
		'phone 2',
		'phone2',
		'secondary phone',
		'secondary phone number',
		'alt phone',
		'other phone',
	],
	country: ['country'],
	nationality: ['nationality'],
	birthPlace: ['birth place', 'birthplace', 'place of birth', 'birth_place'],
	religion: ['religion', 'faith'],
	race: ['race', 'ethnicity'],
	maritalStatus: [
		'marital status',
		'marital_status',
		'status',
		'marital',
		'married',
	],
	courseOfStudy: [
		'course',
		'course of study',
		'program',
		'programme',
		'course_of_study',
		'qualification',
	],
	kinName: [
		'guardian',
		'next of kin',
		'kin name',
		'guardian name',
		'names of guardian',
		'parent',
		'parent name',
	],
	kinPhone: [
		'guardian phone',
		'guardian contact',
		'contacts of guardian',
		'kin phone',
		'parent phone',
		'guardian tel',
	],
};
