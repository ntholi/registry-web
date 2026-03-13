import type { PermissionGrant } from '@/core/auth/permissions';
import {
	type Action,
	DASHBOARD_ROLES,
	type DashboardRole,
	type Resource,
} from '@/core/auth/permissions';

type PresetPosition =
	| 'manager'
	| 'program_leader'
	| 'principal_lecturer'
	| 'year_leader'
	| 'lecturer'
	| 'admin'
	| null;

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

export interface LegacyPresetMapping {
	role: DashboardRole;
	position: PresetPosition;
	presetName: string;
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
const taskCrud = ['read', 'create', 'update', 'delete'] as const;

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
		],
	},
	{
		label: 'Registry',
		resources: [
			'students',
			'registration',
			'student-statuses',
			'documents',
			'terms-settings',
			'graduation',
			'certificate-reprints',
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
		],
	},
	{
		label: 'Finance',
		resources: ['sponsors'],
	},
	{
		label: 'Admin',
		resources: ['users', 'tasks', 'activity-tracker'],
	},
	{
		label: 'Library',
		resources: ['library'],
	},
];

export const PRESET_ROLES = DASHBOARD_ROLES;

export const PERMISSION_PRESET_SEEDS: readonly PermissionPresetSeed[] = [
	{
		name: 'Academic Manager',
		role: 'academic',
		description: 'Full academic department management',
		permissions: mergeGrants(
			grant('lecturers', ['read', 'manage']),
			grant('assessments', fullCrud),
			grant('feedback-questions', fullCrud),
			grant('feedback-categories', fullCrud),
			grant('feedback-cycles', fullCrud),
			grant('feedback-reports', ['read', 'manage']),
			grant('school-structures', ['read', 'update', 'delete']),
			grant('timetable', fullCrud),
			grant('venues', fullCrud),
			grant('students', ['read']),
			grant('registration', ['read', 'update']),
			grant('graduation', ['read', 'manage']),
			grant('activity-tracker', ['read']),
			grant('tasks', taskCrud),
			grant('gradebook', ['read', 'update', 'approve'])
		),
	},
	{
		name: 'Academic Program Leader',
		role: 'academic',
		description: 'Program-level academic management',
		permissions: mergeGrants(
			grant('lecturers', ['read', 'manage']),
			grant('feedback-questions', fullCrud),
			grant('feedback-categories', fullCrud),
			grant('school-structures', ['read', 'update']),
			grant('registration', ['read', 'update']),
			grant('timetable', ['read']),
			grant('students', ['read']),
			grant('gradebook', ['read', 'update', 'approve'])
		),
	},
	{
		name: 'Academic Year Leader',
		role: 'academic',
		description: 'Year-level academic oversight',
		permissions: mergeGrants(
			grant('feedback-cycles', ['read']),
			grant('registration', ['read']),
			grant('students', ['read']),
			grant('timetable', ['read'])
		),
	},
	{
		name: 'Academic Lecturer',
		role: 'academic',
		description: 'Teaching staff access',
		permissions: mergeGrants(
			grant('assessments', fullCrud),
			grant('gradebook', ['read', 'update']),
			grant('feedback-reports', ['read']),
			grant('timetable', ['read'])
		),
	},
	{
		name: 'Academic Principal Lecturer',
		role: 'academic',
		description: 'Senior teaching staff access',
		permissions: mergeGrants(
			grant('assessments', fullCrud),
			grant('gradebook', ['read', 'update', 'approve']),
			grant('feedback-reports', ['read']),
			grant('timetable', ['read'])
		),
	},
	{
		name: 'Academic Admin',
		role: 'academic',
		description: 'Academic administrative support',
		permissions: mergeGrants(
			grant('assessments', fullCrud),
			grant('feedback-questions', fullCrud),
			grant('feedback-categories', fullCrud),
			grant('feedback-cycles', fullCrud),
			grant('timetable', ['read'])
		),
	},
	{
		name: 'Registry Staff',
		role: 'registry',
		description: 'Standard registry operations',
		permissions: mergeGrants(
			grant('students', ['read', 'update', 'manage']),
			grant('registration', fullCrud),
			grant('documents', ['read', 'create']),
			grant('student-statuses', fullCrud),
			grant('terms-settings', ['read', 'update']),
			grant('certificate-reprints', fullCrud),
			grant('modules', ['create']),
			grant('semester-modules', ['create', 'update']),
			grant('venues', ['create', 'update', 'delete']),
			grant('graduation', ['read'])
		),
	},
	{
		name: 'Registry Manager',
		role: 'registry',
		description: 'Registry department management',
		permissions: mergeGrants(
			grant('students', ['read', 'update', 'manage']),
			grant('registration', fullCrud),
			grant('documents', ['read', 'create']),
			grant('student-statuses', fullCrud),
			grant('terms-settings', ['read', 'update']),
			grant('certificate-reprints', fullCrud),
			grant('modules', ['create']),
			grant('semester-modules', ['create', 'update']),
			grant('venues', ['create', 'update', 'delete']),
			grant('graduation', ['read']),
			grant('activity-tracker', ['read']),
			grant('tasks', taskCrud),
			grant('school-structures', ['update'])
		),
	},
	{
		name: 'Finance Staff',
		role: 'finance',
		description: 'Standard finance operations',
		permissions: mergeGrants(
			grant('sponsors', ['read', 'manage']),
			grant('admissions-payments', ['read', 'update']),
			grant('student-statuses', ['read']),
			grant('graduation', ['read']),
			grant('students', ['read'])
		),
	},
	{
		name: 'Finance Manager',
		role: 'finance',
		description: 'Finance department management',
		permissions: mergeGrants(
			grant('sponsors', ['read', 'manage']),
			grant('admissions-payments', ['read', 'update']),
			grant('student-statuses', ['read']),
			grant('graduation', ['read']),
			grant('students', ['read']),
			grant('activity-tracker', ['read']),
			grant('tasks', taskCrud)
		),
	},
	{
		name: 'Library Staff',
		role: 'library',
		description: 'Library operations',
		permissions: mergeGrants(
			grant('library', fullCrud),
			grant('students', ['read'])
		),
	},
	{
		name: 'Marketing Staff',
		role: 'marketing',
		description: 'Marketing and admissions outreach',
		permissions: mergeGrants(
			grant('applicants', fullCrud),
			grant('applications', fullCrud),
			grant('entry-requirements', fullCrud),
			grant('admissions-payments', ['read']),
			grant('admissions-documents', ['read'])
		),
	},
	{
		name: 'Student Services Staff',
		role: 'student_services',
		description: 'Student services operations',
		permissions: mergeGrants(
			grant('students', ['read', 'update']),
			grant('registration', ['read', 'update']),
			grant('documents', ['read', 'create']),
			grant('student-statuses', ['read', 'create', 'update'])
		),
	},
	{
		name: 'LEAP Staff',
		role: 'leap',
		description: 'LEAP program operations',
		permissions: mergeGrants(
			grant('assessments', fullCrud),
			grant('registration', ['read', 'update']),
			grant('students', ['read'])
		),
	},
	{
		name: 'Human Resource Staff',
		role: 'human_resource',
		description: 'HR access',
		permissions: grant('feedback-reports', ['read']),
	},
	{
		name: 'Resource Staff',
		role: 'resource',
		description: 'Resource department operations',
		permissions: mergeGrants(
			grant('timetable', ['read']),
			grant('venues', ['read'])
		),
	},
];

export const LEGACY_PRESET_MAPPINGS: readonly LegacyPresetMapping[] = [
	{ role: 'academic', position: 'manager', presetName: 'Academic Manager' },
	{
		role: 'academic',
		position: 'program_leader',
		presetName: 'Academic Program Leader',
	},
	{
		role: 'academic',
		position: 'year_leader',
		presetName: 'Academic Year Leader',
	},
	{ role: 'academic', position: 'lecturer', presetName: 'Academic Lecturer' },
	{
		role: 'academic',
		position: 'principal_lecturer',
		presetName: 'Academic Principal Lecturer',
	},
	{ role: 'academic', position: 'admin', presetName: 'Academic Admin' },
	{ role: 'academic', position: null, presetName: 'Academic Lecturer' },
	{ role: 'registry', position: null, presetName: 'Registry Staff' },
	{ role: 'registry', position: 'manager', presetName: 'Registry Manager' },
	{ role: 'finance', position: null, presetName: 'Finance Staff' },
	{ role: 'finance', position: 'manager', presetName: 'Finance Manager' },
	{ role: 'library', position: null, presetName: 'Library Staff' },
	{ role: 'marketing', position: null, presetName: 'Marketing Staff' },
	{
		role: 'student_services',
		position: null,
		presetName: 'Student Services Staff',
	},
	{ role: 'leap', position: null, presetName: 'LEAP Staff' },
	{
		role: 'human_resource',
		position: null,
		presetName: 'Human Resource Staff',
	},
	{ role: 'resource', position: null, presetName: 'Resource Staff' },
];
