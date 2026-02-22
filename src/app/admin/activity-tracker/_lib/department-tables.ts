import type { DashboardUser } from '@auth/users/_schema/users';

const departmentTables: Record<DashboardUser, string[]> = {
	registry: [
		'students',
		'student_programs',
		'student_semesters',
		'student_modules',
		'registration_requests',
		'clearances',
		'graduation_lists',
	],
	finance: [
		'sponsors',
		'sponsor_allocations',
		'student_sponsors',
		'blocked_students',
		'clearances',
	],
	academic: [
		'modules',
		'semester_modules',
		'assessments',
		'assessment_marks',
		'programs',
		'structure_semesters',
	],
	library: ['loans', 'loan_renewals', 'clearances'],
	resource: ['venues', 'clearances'],
	marketing: ['applications'],
	student_services: ['clearances'],
	admin: [],
	leap: [],
};

const CLEARANCE_DEPARTMENTS: DashboardUser[] = [
	'finance',
	'library',
	'resource',
];

function isClearanceDepartment(dept: string): boolean {
	return CLEARANCE_DEPARTMENTS.includes(dept as DashboardUser);
}

function getTablesForDepartment(dept: DashboardUser): string[] {
	return departmentTables[dept] ?? [];
}

export { CLEARANCE_DEPARTMENTS, getTablesForDepartment, isClearanceDepartment };
