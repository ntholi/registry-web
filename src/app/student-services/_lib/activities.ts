import type { ActivityFragment } from '@/shared/lib/utils/activities';

const STUDENT_SERVICES_ACTIVITIES = {
	catalog: {
		student_referral_created: {
			label: 'Student Referral Created',
			department: 'student_services',
		},
		student_referral_updated: {
			label: 'Student Referral Updated',
			department: 'student_services',
		},
		student_referral_deleted: {
			label: 'Student Referral Deleted',
			department: 'student_services',
		},
		referral_session_created: {
			label: 'Referral Session Created',
			department: 'student_services',
		},
		referral_session_deleted: {
			label: 'Referral Session Deleted',
			department: 'student_services',
		},
	},
	tableOperationMap: {
		'student_referrals:INSERT': 'student_referral_created',
		'student_referrals:UPDATE': 'student_referral_updated',
		'student_referrals:DELETE': 'student_referral_deleted',
		'referral_sessions:INSERT': 'referral_session_created',
		'referral_sessions:DELETE': 'referral_session_deleted',
	},
} as const satisfies ActivityFragment;

export default STUDENT_SERVICES_ACTIVITIES;
export type StudentServicesActivityType =
	keyof typeof STUDENT_SERVICES_ACTIVITIES.catalog;
