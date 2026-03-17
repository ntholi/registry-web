export const RESOURCES = [
	'lecturers',
	'assessments',
	'semester-modules',
	'modules',
	'school-structures',
	'student-feedback-questions',
	'student-feedback-categories',
	'feedback-cycles',
	'student-feedback-reports',
	'teaching-observations',
	'teaching-observation-criteria',
	'teaching-observation-reports',
	'timetable',
	'venues',
	'gradebook',
	'attendance',
	'assigned-modules',
	'students',
	'registration',
	'registration-clearance',
	'student-statuses',
	'documents',
	'terms-settings',
	'graduation',
	'graduation-clearance',
	'certificate-reprints',
	'student-notes',
	'blocked-students',
	'auto-approvals',
	'applicants',
	'applications',
	'admissions-payments',
	'admissions-documents',
	'entry-requirements',
	'recognized-schools',
	'intake-periods',
	'certificate-types',
	'subjects',
	'sponsors',
	'sponsored-students',
	'zoho',
	'users',
	'permission-presets',
	'tasks',
	'activity-tracker',
	'notifications',
	'library',
	'employees',
	'reports-attendance',
	'reports-course-summary',
	'reports-boe',
	'reports-enrollments',
	'reports-progression',
	'reports-distribution',
	'reports-graduation',
	'reports-sponsored-students',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = [
	'read',
	'create',
	'update',
	'delete',
	'approve',
	'reject',
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

export function hasPermission(
	permissions: readonly PermissionGrant[],
	requirement: PermissionRequirement
) {
	for (const [resource, actions] of Object.entries(requirement)) {
		for (const action of actions) {
			const granted = permissions.some(
				(permission) =>
					permission.resource === resource && permission.action === action
			);

			if (!granted) {
				return false;
			}
		}
	}

	return true;
}

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

export const USER_ROLES = [
	'user',
	'applicant',
	'student',
	...DASHBOARD_ROLES,
] as const;

export type UserRole = (typeof USER_ROLES)[number];
