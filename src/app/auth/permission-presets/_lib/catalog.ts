import type { PermissionGrant } from '@/core/auth/permissions';
import {
	type Action,
	DASHBOARD_ROLES,
	type DashboardRole,
	type Resource,
} from '@/core/auth/permissions';

export interface PermissionResourceGroup {
	label: string;
	resources: readonly Resource[];
}

export interface PermissionPresetSeed {
	name: string;
	role: DashboardRole;
	description: string;
	permissions: readonly PermissionGrant[];
}

function grant(
	resource: Resource,
	actions: readonly Action[]
): PermissionGrant[] {
	return actions.map((action) => ({ resource, action }));
}

function mergeGrants(
	...grants: readonly PermissionGrant[][]
): PermissionGrant[] {
	return grants.flat();
}

const fullCrud = ['read', 'create', 'update', 'delete'] as const;

export const PERMISSION_RESOURCE_GROUPS: readonly PermissionResourceGroup[] = [
	{
		label: 'Academic',
		resources: [
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
			'attendance',
			'assigned-modules',
		],
	},
	{
		label: 'Registry',
		resources: [
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
		],
	},
	{
		label: 'Admissions',
		resources: [
			'applicants',
			'applications',
			'admissions-payments',
			'admissions-documents',
			'entry-requirements',
			'recognized-schools',
			'intake-periods',
			'certificate-types',
			'subjects',
		],
	},
	{
		label: 'Finance',
		resources: ['sponsors'],
	},
	{
		label: 'Admin',
		resources: ['users', 'tasks', 'activity-tracker', 'notifications'],
	},
	{
		label: 'Library',
		resources: ['library'],
	},
	{
		label: 'HR',
		resources: ['employees'],
	},
	{
		label: 'Reports',
		resources: [
			'reports-attendance',
			'reports-course-summary',
			'reports-boe',
			'reports-enrollments',
			'reports-progression',
			'reports-distribution',
			'reports-graduation',
			'reports-sponsored-students',
		],
	},
];

export const PRESET_ROLES = DASHBOARD_ROLES;

export const PERMISSION_PRESET_SEEDS: readonly PermissionPresetSeed[] = [
	{
		name: 'Academic Manager',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('lecturers', fullCrud),
			grant('assessments', fullCrud),
			grant('feedback-questions', fullCrud),
			grant('feedback-categories', fullCrud),
			grant('feedback-cycles', fullCrud),
			grant('feedback-reports', ['read', 'update']),
			grant('school-structures', ['read', 'update', 'delete']),
			grant('timetable', fullCrud),
			grant('venues', fullCrud),
			grant('students', ['read']),
			grant('registration', ['read', 'update']),
			grant('graduation', ['read', 'approve']),
			grant('graduation-clearance', ['read', 'approve', 'reject']),
			grant('student-statuses', ['approve']),
			grant('activity-tracker', ['read']),
			grant('tasks', fullCrud),
			grant('gradebook', ['read', 'update', 'approve']),
			grant('attendance', fullCrud),
			grant('assigned-modules', ['read', 'create', 'delete']),
			grant('reports-attendance', ['read']),
			grant('reports-course-summary', ['read']),
			grant('reports-boe', ['read']),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read']),
			grant('reports-graduation', ['read'])
		),
	},
	{
		name: 'Academic Program Leader',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('lecturers', fullCrud),
			grant('feedback-questions', fullCrud),
			grant('feedback-categories', fullCrud),
			grant('school-structures', ['read', 'update']),
			grant('registration', ['read', 'update']),
			grant('student-statuses', ['approve']),
			grant('timetable', ['read']),
			grant('students', ['read']),
			grant('gradebook', ['read', 'update', 'approve']),
			grant('attendance', ['read']),
			grant('assigned-modules', ['read', 'create', 'delete']),
			grant('tasks', fullCrud),
			grant('reports-attendance', ['read']),
			grant('reports-course-summary', ['read']),
			grant('reports-boe', ['read']),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read']),
			grant('reports-graduation', ['read'])
		),
	},
	{
		name: 'Academic Year Leader',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('feedback-cycles', ['read']),
			grant('registration', ['read']),
			grant('student-statuses', ['approve']),
			grant('students', ['read']),
			grant('timetable', ['read']),
			grant('attendance', ['read']),
			grant('tasks', fullCrud),
			grant('reports-attendance', ['read']),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read'])
		),
	},
	{
		name: 'Academic Lecturer',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('assessments', fullCrud),
			grant('gradebook', ['read', 'update']),
			grant('feedback-reports', ['read']),
			grant('timetable', ['read']),
			grant('attendance', ['read', 'create', 'update']),
			grant('assigned-modules', ['read']),
			grant('tasks', fullCrud),
			grant('reports-attendance', ['read']),
			grant('reports-course-summary', ['read'])
		),
	},
	{
		name: 'Academic Principal Lecturer',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('assessments', fullCrud),
			grant('gradebook', ['read', 'update', 'approve']),
			grant('feedback-reports', ['read']),
			grant('timetable', ['read']),
			grant('attendance', ['read', 'create', 'update']),
			grant('assigned-modules', ['read']),
			grant('tasks', fullCrud),
			grant('reports-attendance', ['read']),
			grant('reports-course-summary', ['read'])
		),
	},
	{
		name: 'Academic Admin',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('assessments', fullCrud),
			grant('feedback-questions', fullCrud),
			grant('feedback-categories', fullCrud),
			grant('feedback-cycles', fullCrud),
			grant('timetable', ['read']),
			grant('tasks', fullCrud),
			grant('attendance', ['read'])
		),
	},
	{
		name: 'Registry Staff',
		role: 'registry',
		description: '',
		permissions: mergeGrants(
			grant('students', ['read', 'update', 'delete']),
			grant('sponsors', fullCrud),
			grant('registration', fullCrud),
			grant('registration-clearance', ['read']),
			grant('documents', ['read', 'create']),
			grant('student-statuses', fullCrud),
			grant('terms-settings', ['read', 'update']),
			grant('certificate-reprints', fullCrud),
			grant('modules', ['create']),
			grant('semester-modules', ['create', 'update']),
			grant('venues', ['create', 'update', 'delete']),
			grant('graduation', ['read']),
			grant('tasks', fullCrud),
			grant('student-notes', fullCrud),
			grant('blocked-students', ['read', 'create', 'update']),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read']),
			grant('reports-attendance', ['read'])
		),
	},
	{
		name: 'Registry Manager',
		role: 'registry',
		description: '',
		permissions: mergeGrants(
			grant('students', ['read', 'update', 'delete']),
			grant('sponsors', fullCrud),
			grant('registration', fullCrud),
			grant('registration-clearance', ['read']),
			grant('documents', ['read', 'create']),
			grant('student-statuses', fullCrud),
			grant('terms-settings', ['read', 'update']),
			grant('certificate-reprints', fullCrud),
			grant('modules', ['create']),
			grant('semester-modules', ['create', 'update']),
			grant('venues', ['create', 'update', 'delete']),
			grant('graduation', ['read']),
			grant('activity-tracker', ['read']),
			grant('tasks', fullCrud),
			grant('school-structures', ['update']),
			grant('student-notes', fullCrud),
			grant('blocked-students', fullCrud),
			grant('notifications', ['read']),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read']),
			grant('reports-attendance', ['read']),
			grant('reports-graduation', ['read'])
		),
	},
	{
		name: 'Finance Staff',
		role: 'finance',
		description: '',
		permissions: mergeGrants(
			grant('sponsors', fullCrud),
			grant('admissions-payments', ['read', 'update']),
			grant('student-statuses', ['read', 'approve']),
			grant('graduation', ['read']),
			grant('students', ['read']),
			grant('registration-clearance', ['read', 'approve', 'reject']),
			grant('graduation-clearance', ['read', 'approve', 'reject']),
			grant('blocked-students', ['read', 'create', 'update']),
			grant('tasks', fullCrud),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read']),
			grant('reports-graduation', ['read']),
			grant('reports-sponsored-students', ['read'])
		),
	},
	{
		name: 'Finance Manager',
		role: 'finance',
		description: '',
		permissions: mergeGrants(
			grant('sponsors', fullCrud),
			grant('admissions-payments', ['read', 'update']),
			grant('student-statuses', ['read', 'approve']),
			grant('graduation', ['read']),
			grant('students', ['read']),
			grant('registration-clearance', ['read', 'approve', 'reject']),
			grant('graduation-clearance', ['read', 'approve', 'reject']),
			grant('blocked-students', fullCrud),
			grant('auto-approvals', fullCrud),
			grant('activity-tracker', ['read']),
			grant('tasks', fullCrud),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read']),
			grant('reports-graduation', ['read']),
			grant('reports-sponsored-students', ['read'])
		),
	},
	{
		name: 'Library Staff',
		role: 'library',
		description: '',
		permissions: mergeGrants(
			grant('library', fullCrud),
			grant('students', ['read']),
			grant('registration-clearance', ['read', 'approve', 'reject']),
			grant('graduation-clearance', ['read', 'approve', 'reject']),
			grant('blocked-students', ['read', 'create', 'update']),
			grant('tasks', fullCrud),
			grant('auto-approvals', fullCrud)
		),
	},
	{
		name: 'Marketing Staff',
		role: 'marketing',
		description: '',
		permissions: mergeGrants(
			grant('applicants', fullCrud),
			grant('applications', fullCrud),
			grant('entry-requirements', fullCrud),
			grant('admissions-payments', ['read']),
			grant('admissions-documents', ['read']),
			grant('recognized-schools', fullCrud),
			grant('intake-periods', fullCrud),
			grant('certificate-types', fullCrud),
			grant('tasks', fullCrud),
			grant('subjects', fullCrud)
		),
	},
	{
		name: 'Student Services Staff',
		role: 'student_services',
		description: '',
		permissions: mergeGrants(
			grant('students', ['read', 'update']),
			grant('registration', ['read', 'update']),
			grant('documents', ['read', 'create']),
			grant('student-statuses', ['read', 'create', 'update', 'approve']),
			grant('tasks', fullCrud),
			grant('student-notes', fullCrud)
		),
	},
	{
		name: 'LEAP Staff',
		role: 'leap',
		description: '',
		permissions: mergeGrants(
			grant('assessments', fullCrud),
			grant('registration', ['read', 'update']),
			grant('registration-clearance', ['read']),
			grant('students', ['read']),
			grant('attendance', ['read', 'create', 'update']),
			grant('assigned-modules', ['read']),
			grant('tasks', fullCrud),
			grant('reports-attendance', ['read']),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read'])
		),
	},
	{
		name: 'Human Resource Staff',
		role: 'human_resource',
		description: '',
		permissions: mergeGrants(
			grant('feedback-reports', ['read']),
			grant('tasks', fullCrud),
			grant('employees', fullCrud)
		),
	},
	{
		name: 'Resource Staff',
		role: 'resource',
		description: '',
		permissions: mergeGrants(
			grant('timetable', ['read']),
			grant('venues', ['read']),
			grant('registration-clearance', ['read', 'approve', 'reject']),
			grant('tasks', fullCrud),
			grant('auto-approvals', fullCrud)
		),
	},
];
