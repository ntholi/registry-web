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

const admissionsCrud = mergeGrants(
	grant('applicants', fullCrud),
	grant('applications', fullCrud),
	grant('entry-requirements', fullCrud),
	grant('recognized-schools', fullCrud),
	grant('intake-periods', fullCrud),
	grant('certificate-types', fullCrud),
	grant('subjects', fullCrud)
);

const admissionsDocActions = [
	'read',
	'create',
	'update',
	'delete',
	'approve',
	'reject',
] as const;

export const PERMISSION_RESOURCE_GROUPS: readonly PermissionResourceGroup[] = [
	{
		label: 'Academic',
		resources: [
			'lecturers',
			'assessments',
			'semester-modules',
			'modules',
			'school-structures',
			'timetable',
			'venues',
			'gradebook',
			'attendance',
			'assigned-modules',
		],
	},
	{
		label: 'Appraisals',
		resources: [
			'student-feedback-questions',
			'student-feedback-categories',
			'feedback-cycles',
			'student-feedback-reports',
			'teaching-observations',
			'teaching-observation-criteria',
			'teaching-observation-reports',
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
			'letter-templates',
			'letters',
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
		resources: ['sponsors', 'sponsored-students', 'zoho'],
	},
	{
		label: 'Admin',
		resources: ['users', 'tasks', 'activity-tracker', 'notifications', 'mails'],
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
			grant('student-feedback-questions', fullCrud),
			grant('student-feedback-categories', fullCrud),
			grant('feedback-cycles', ['read', 'create', 'update']),
			grant('student-feedback-reports', ['read', 'update']),
			grant('teaching-observations', ['read', 'update']),
			grant('teaching-observation-criteria', fullCrud),
			grant('teaching-observation-reports', ['read']),
			grant('school-structures', ['read', 'update', 'delete']),
			grant('timetable', fullCrud),
			grant('venues', fullCrud),
			grant('students', ['read']),
			grant('registration', ['read', 'update']),
			grant('registration-clearance', ['read']),
			grant('graduation', ['read', 'approve']),
			grant('graduation-clearance', ['read', 'approve', 'reject']),
			grant('student-statuses', ['read', 'approve']),
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
			grant('reports-graduation', ['read']),
			grant('mails', ['read']),
			grant('users', ['read']),
			grant('letter-templates', ['read']),
			grant('letters', fullCrud)
		),
	},
	{
		name: 'Program Leader',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('lecturers', fullCrud),
			grant('student-feedback-questions', fullCrud),
			grant('student-feedback-categories', fullCrud),
			grant('teaching-observations', fullCrud),
			grant('teaching-observation-criteria', ['read']),
			grant('teaching-observation-reports', ['read']),
			grant('school-structures', ['read', 'update']),
			grant('registration', ['read', 'update']),
			grant('registration-clearance', ['read']),
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
			grant('reports-graduation', ['read']),
			grant('mails', ['read']),
			grant('users', ['read'])
		),
	},
	{
		name: 'Year Leader',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('feedback-cycles', ['read']),
			grant('teaching-observations', ['read']),
			grant('registration', ['read']),
			grant('registration-clearance', ['read']),
			grant('students', ['read']),
			grant('student-statuses', ['approve']),
			grant('timetable', ['read']),
			grant('attendance', ['read']),
			grant('tasks', fullCrud),
			grant('reports-attendance', ['read']),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read']),
			grant('mails', ['read'])
		),
	},
	{
		name: 'Lecturer',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('registration', ['read']),
			grant('registration-clearance', ['read']),
			grant('students', ['read']),
			grant('assessments', fullCrud),
			grant('gradebook', ['read', 'update']),
			grant('student-feedback-reports', ['read']),
			grant('teaching-observations', ['read']),
			grant('timetable', ['read']),
			grant('attendance', ['read', 'create', 'update']),
			grant('assigned-modules', ['read']),
			grant('tasks', fullCrud),
			grant('reports-attendance', ['read']),
			grant('reports-course-summary', ['read']),
			grant('mails', ['read'])
		),
	},
	{
		name: 'Principal Lecturer',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('registration', ['read']),
			grant('registration-clearance', ['read']),
			grant('students', ['read']),
			grant('assessments', fullCrud),
			grant('gradebook', ['read', 'update', 'approve']),
			grant('student-feedback-reports', ['read']),
			grant('teaching-observations', fullCrud),
			grant('teaching-observation-criteria', ['read']),
			grant('teaching-observation-reports', ['read']),
			grant('timetable', ['read']),
			grant('attendance', ['read', 'create', 'update']),
			grant('assigned-modules', ['read']),
			grant('users', ['read']),
			grant('tasks', fullCrud),
			grant('reports-attendance', ['read']),
			grant('reports-course-summary', ['read']),
			grant('mails', ['read'])
		),
	},
	{
		name: 'Academic Admin',
		role: 'academic',
		description: '',
		permissions: mergeGrants(
			grant('registration', ['read']),
			grant('registration-clearance', ['read']),
			grant('students', ['read']),
			grant('student-feedback-questions', ['read']),
			grant('student-feedback-categories', fullCrud),
			grant('student-feedback-reports', ['read']),
			grant('feedback-cycles', ['read', 'create', 'update']),
			grant('teaching-observations', ['read']),
			grant('teaching-observation-criteria', ['read']),
			grant('teaching-observation-reports', ['read']),
			grant('school-structures', ['read']),
			grant('student-statuses', ['read']),
			grant('timetable', ['read']),
			grant('tasks', fullCrud),
			grant('mails', ['read']),
			grant('letter-templates', ['read']),
			grant('letters', fullCrud),
			grant('reports-attendance', ['read']),
			grant('reports-boe', ['read']),
			grant('reports-enrollments', ['read']),
			grant('reports-graduation', ['read'])
		),
	},
	{
		name: 'Registry Staff',
		role: 'registry',
		description: '',
		permissions: mergeGrants(
			admissionsCrud,
			grant('admissions-documents', admissionsDocActions),
			grant('students', ['read', 'update', 'delete']),
			grant('sponsored-students', fullCrud),
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
			grant('letter-templates', ['read']),
			grant('letters', ['read', 'create']),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read']),
			grant('reports-attendance', ['read']),
			grant('mails', ['read'])
		),
	},
	{
		name: 'Registry Manager',
		role: 'registry',
		description: '',
		permissions: mergeGrants(
			admissionsCrud,
			grant('admissions-documents', admissionsDocActions),
			grant('students', ['read', 'update', 'delete']),
			grant('sponsors', fullCrud),
			grant('sponsored-students', fullCrud),
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
			grant('blocked-students', ['read', 'create', 'update']),
			grant('letter-templates', fullCrud),
			grant('letters', fullCrud),
			grant('notifications', ['read']),
			grant('mails', ['read']),
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
			grant('sponsored-students', fullCrud),
			grant('zoho', fullCrud),
			grant('admissions-payments', ['read', 'update']),
			grant('student-statuses', ['read', 'approve']),
			grant('graduation', ['read']),
			grant('students', ['read']),
			grant('registration', ['read']),
			grant('registration-clearance', ['read', 'approve', 'reject']),
			grant('graduation-clearance', ['read', 'approve', 'reject']),
			grant('blocked-students', ['read', 'create', 'update']),
			grant('auto-approvals', fullCrud),
			grant('tasks', fullCrud),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read']),
			grant('reports-graduation', ['read']),
			grant('reports-sponsored-students', ['read']),
			grant('mails', ['read'])
		),
	},
	{
		name: 'Finance Manager',
		role: 'finance',
		description: '',
		permissions: mergeGrants(
			grant('sponsors', fullCrud),
			grant('sponsored-students', fullCrud),
			grant('zoho', fullCrud),
			grant('admissions-payments', ['read', 'update']),
			grant('student-statuses', ['read', 'approve']),
			grant('graduation', ['read']),
			grant('students', ['read']),
			grant('registration', ['read']),
			grant('registration-clearance', ['read', 'approve', 'reject']),
			grant('graduation-clearance', ['read', 'approve', 'reject']),
			grant('blocked-students', ['read', 'create', 'update']),
			grant('auto-approvals', fullCrud),
			grant('activity-tracker', ['read']),
			grant('tasks', fullCrud),
			grant('reports-enrollments', ['read']),
			grant('reports-progression', ['read']),
			grant('reports-distribution', ['read']),
			grant('reports-graduation', ['read']),
			grant('reports-sponsored-students', ['read']),
			grant('mails', ['read'])
		),
	},
	{
		name: 'Library Staff',
		role: 'library',
		description: '',
		permissions: mergeGrants(
			grant('library', fullCrud),
			grant('students', ['read']),
			grant('registration', ['read']),
			grant('tasks', fullCrud),
			grant('mails', ['read'])
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
			grant('admissions-documents', ['read', 'update', 'approve', 'reject']),
			grant('recognized-schools', fullCrud),
			grant('intake-periods', fullCrud),
			grant('certificate-types', fullCrud),
			grant('tasks', fullCrud),
			grant('subjects', fullCrud),
			grant('mails', ['read'])
		),
	},
	{
		name: 'Student Services Staff',
		role: 'student_services',
		description: '',
		permissions: mergeGrants(
			grant('students', ['read', 'update']),
			grant('registration', ['read', 'update']),
			grant('registration-clearance', ['read']),
			grant('documents', ['read', 'create']),
			grant('student-statuses', ['read', 'create', 'update', 'approve']),
			grant('tasks', fullCrud),
			grant('student-notes', fullCrud),
			grant('mails', ['read'])
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
			grant('reports-distribution', ['read']),
			grant('mails', ['read'])
		),
	},
	{
		name: 'Human Resource Staff',
		role: 'human_resource',
		description: '',
		permissions: mergeGrants(
			grant('student-feedback-questions', fullCrud),
			grant('student-feedback-categories', fullCrud),
			grant('feedback-cycles', ['read', 'create', 'update']),
			grant('student-feedback-reports', ['read', 'update']),
			grant('teaching-observations', ['read']),
			grant('teaching-observation-criteria', fullCrud),
			grant('teaching-observation-reports', ['read']),
			grant('users', ['read']),
			grant('tasks', fullCrud),
			grant('employees', fullCrud),
			grant('mails', ['read'])
		),
	},
	{
		name: 'Resource Staff',
		role: 'resource',
		description: '',
		permissions: mergeGrants(
			grant('timetable', ['read']),
			grant('venues', ['read']),
			grant('registration', ['read']),
			grant('tasks', fullCrud),
			grant('mails', ['read'])
		),
	},
];
