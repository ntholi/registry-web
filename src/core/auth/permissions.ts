export const RESOURCES = [
	'lecturers',
	'assessments',
	'semester-modules',
	'modules',
	'school-structures',
	'feedback-questions',
	'feedback-categories',
	'feedback-cycles',
	'feedback-reports',
	'timetable',
	'venues',
	'gradebook',
	'students',
	'registration',
	'student-statuses',
	'documents',
	'terms-settings',
	'graduation',
	'certificate-reprints',
	'applicants',
	'applications',
	'admissions-payments',
	'admissions-documents',
	'entry-requirements',
	'sponsors',
	'users',
	'permission-presets',
	'tasks',
	'activity-tracker',
	'library',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = [
	'read',
	'create',
	'update',
	'delete',
	'manage',
	'approve',
] as const;

export type Action = (typeof ACTIONS)[number];

export interface PermissionGrant {
	resource: Resource;
	action: Action;
}

export type PermissionRequirement = {
	[R in Resource]?: Action[];
};

export type AuthRequirement =
	| 'all'
	| 'auth'
	| 'dashboard'
	| PermissionRequirement;

export const DASHBOARD_ROLES = [
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'marketing',
	'student_services',
	'admin',
	'leap',
	'human_resource',
] as const;

export type DashboardRole = (typeof DASHBOARD_ROLES)[number];

export const USER_ROLES = ['student', ...DASHBOARD_ROLES] as const;

export type UserRole = (typeof USER_ROLES)[number];
