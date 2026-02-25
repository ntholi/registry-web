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
		feedback_cycle_created: {
			label: 'Feedback Cycle Created',
			department: 'academic',
		},
		feedback_cycle_updated: {
			label: 'Feedback Cycle Updated',
			department: 'academic',
		},
		feedback_cycle_deleted: {
			label: 'Feedback Cycle Deleted',
			department: 'academic',
		},
		feedback_category_created: {
			label: 'Feedback Category Created',
			department: 'academic',
		},
		feedback_category_updated: {
			label: 'Feedback Category Updated',
			department: 'academic',
		},
		feedback_category_deleted: {
			label: 'Feedback Category Deleted',
			department: 'academic',
		},
		feedback_question_created: {
			label: 'Feedback Question Created',
			department: 'academic',
		},
		feedback_question_updated: {
			label: 'Feedback Question Updated',
			department: 'academic',
		},
		feedback_question_deleted: {
			label: 'Feedback Question Deleted',
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
		'feedback_cycles:INSERT': 'feedback_cycle_created',
		'feedback_cycles:UPDATE': 'feedback_cycle_updated',
		'feedback_cycles:DELETE': 'feedback_cycle_deleted',
		'feedback_categories:INSERT': 'feedback_category_created',
		'feedback_categories:UPDATE': 'feedback_category_updated',
		'feedback_categories:DELETE': 'feedback_category_deleted',
		'feedback_questions:INSERT': 'feedback_question_created',
		'feedback_questions:UPDATE': 'feedback_question_updated',
		'feedback_questions:DELETE': 'feedback_question_deleted',
	},
} as const satisfies ActivityFragment;

export default ACADEMIC_ACTIVITIES;

export type AcademicActivityType = keyof typeof ACADEMIC_ACTIVITIES.catalog;
