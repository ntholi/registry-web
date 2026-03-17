import type { ActivityFragment } from '@/shared/lib/utils/activities';

const APPRAISALS_ACTIVITIES = {
	catalog: {
		feedback_cycle_created: {
			label: 'Student Feedback Cycle Created',
			department: 'academic',
		},
		feedback_cycle_updated: {
			label: 'Student Feedback Cycle Updated',
			department: 'academic',
		},
		feedback_cycle_deleted: {
			label: 'Student Feedback Cycle Deleted',
			department: 'academic',
		},
		student_feedback_category_created: {
			label: 'Student Feedback Category Created',
			department: 'academic',
		},
		student_feedback_category_updated: {
			label: 'Student Feedback Category Updated',
			department: 'academic',
		},
		student_feedback_category_deleted: {
			label: 'Student Feedback Category Deleted',
			department: 'academic',
		},
		student_feedback_question_created: {
			label: 'Student Feedback Question Created',
			department: 'academic',
		},
		student_feedback_question_updated: {
			label: 'Student Feedback Question Updated',
			department: 'academic',
		},
		student_feedback_question_deleted: {
			label: 'Student Feedback Question Deleted',
			department: 'academic',
		},
	},
	tableOperationMap: {
		'feedback_cycles:INSERT': 'feedback_cycle_created',
		'feedback_cycles:UPDATE': 'feedback_cycle_updated',
		'feedback_cycles:DELETE': 'feedback_cycle_deleted',
		'feedback_categories:INSERT': 'student_feedback_category_created',
		'feedback_categories:UPDATE': 'student_feedback_category_updated',
		'feedback_categories:DELETE': 'student_feedback_category_deleted',
		'feedback_questions:INSERT': 'student_feedback_question_created',
		'feedback_questions:UPDATE': 'student_feedback_question_updated',
		'feedback_questions:DELETE': 'student_feedback_question_deleted',
	},
} as const satisfies ActivityFragment;

export default APPRAISALS_ACTIVITIES;

export type AppraisalsActivityType = keyof typeof APPRAISALS_ACTIVITIES.catalog;
