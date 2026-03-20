import type { ActivityFragment } from '@/shared/lib/utils/activities';

const MAIL_ACTIVITIES = {
	catalog: {
		mail_account_authorized: {
			label: 'Mail Account Authorized',
			department: 'mail',
		},
		mail_account_updated: {
			label: 'Mail Account Updated',
			department: 'mail',
		},
		mail_account_revoked: {
			label: 'Mail Account Revoked',
			department: 'mail',
		},
		mail_assignment_created: {
			label: 'Mail Assignment Created',
			department: 'mail',
		},
		mail_assignment_removed: {
			label: 'Mail Assignment Removed',
			department: 'mail',
		},
		mail_primary_changed: {
			label: 'Mail Primary Changed',
			department: 'mail',
		},
		mail_queue_retried: {
			label: 'Mail Queue Retried',
			department: 'mail',
		},
		mail_queue_cancelled: {
			label: 'Mail Queue Cancelled',
			department: 'mail',
		},
	},
	tableOperationMap: {
		'mail_accounts:INSERT': 'mail_account_authorized',
		'mail_accounts:UPDATE': 'mail_account_updated',
		'mail_accounts:DELETE': 'mail_account_revoked',
		'mail_account_assignments:INSERT': 'mail_assignment_created',
		'mail_account_assignments:DELETE': 'mail_assignment_removed',
	},
} as const satisfies ActivityFragment;

export default MAIL_ACTIVITIES;

export type MailActivityType = keyof typeof MAIL_ACTIVITIES.catalog;
