import type { ActivityFragment } from '@/shared/lib/utils/activities';

const ACADEMIC_ACTIVITIES = {
	catalog: {
		assessment_created: {
			label: 'Assessment Created',
			department: 'academic',
		},
		assessment_updated: {
			label: 'Assessment Updated',
			department: 'academic',
		},
		assessment_deleted: {
			label: 'Assessment Deleted',
			department: 'academic',
		},
		mark_entered: { label: 'Mark Entered', department: 'academic' },
		mark_updated: { label: 'Mark Updated', department: 'academic' },
		mark_deleted: { label: 'Mark Deleted', department: 'academic' },
		module_assigned: { label: 'Module Assigned', department: 'academic' },
		module_unassigned: {
			label: 'Module Unassigned',
			department: 'academic',
		},
		attendance_recorded: {
			label: 'Attendance Recorded',
			department: 'academic',
		},
		attendance_updated: {
			label: 'Attendance Updated',
			department: 'academic',
		},
		module_created: { label: 'Module Created', department: 'academic' },
		module_updated: { label: 'Module Updated', department: 'academic' },
		semester_module_created: {
			label: 'Semester Module Created',
			department: 'academic',
		},
		semester_module_updated: {
			label: 'Semester Module Updated',
			department: 'academic',
		},
		semester_module_deleted: {
			label: 'Semester Module Deleted',
			department: 'academic',
		},
		program_created: { label: 'Program Created', department: 'academic' },
		program_updated: { label: 'Program Updated', department: 'academic' },
		structure_created: {
			label: 'Structure Created',
			department: 'academic',
		},
		structure_updated: {
			label: 'Structure Updated',
			department: 'academic',
		},
		structure_semester_created: {
			label: 'Structure Semester Created',
			department: 'academic',
		},
		structure_semester_updated: {
			label: 'Structure Semester Updated',
			department: 'academic',
		},
	},
	tableOperationMap: {
		'assessments:INSERT': 'assessment_created',
		'assessments:UPDATE': 'assessment_updated',
		'assessments:DELETE': 'assessment_deleted',
		'assessment_marks:INSERT': 'mark_entered',
		'assessment_marks:UPDATE': 'mark_updated',
		'assessment_marks:DELETE': 'mark_deleted',
		'assigned_modules:INSERT': 'module_assigned',
		'assigned_modules:DELETE': 'module_unassigned',
		'attendance:INSERT': 'attendance_recorded',
		'attendance:UPDATE': 'attendance_updated',
		'modules:INSERT': 'module_created',
		'modules:UPDATE': 'module_updated',
		'modules:DELETE': 'module_deleted',
		'semester_modules:INSERT': 'semester_module_created',
		'semester_modules:UPDATE': 'semester_module_updated',
		'semester_modules:DELETE': 'semester_module_deleted',
		'programs:INSERT': 'program_created',
		'programs:UPDATE': 'program_updated',
		'structures:INSERT': 'structure_created',
		'structures:UPDATE': 'structure_updated',
		'structure_semesters:INSERT': 'structure_semester_created',
		'structure_semesters:UPDATE': 'structure_semester_updated',
	},
} as const satisfies ActivityFragment;

export default ACADEMIC_ACTIVITIES;

export type AcademicActivityType = keyof typeof ACADEMIC_ACTIVITIES.catalog;
