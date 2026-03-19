import type { ActivityFragment } from '@/shared/lib/utils/activities';

const ADMIN_ACTIVITIES = {
	catalog: {
		user_created: { label: 'User Created', department: 'admin' },
		user_updated: { label: 'User Updated', department: 'admin' },
		user_deleted: { label: 'User Deleted', department: 'admin' },
		task_created: { label: 'Task Created', department: 'admin' },
		task_updated: { label: 'Task Updated', department: 'admin' },
		task_deleted: { label: 'Task Deleted', department: 'admin' },
		task_status_changed: {
			label: 'Task Status Changed',
			department: 'admin',
		},
		task_assignees_changed: {
			label: 'Task Assignees Changed',
			department: 'admin',
		},
		task_students_changed: {
			label: 'Task Students Changed',
			department: 'admin',
		},
		task_due_date_changed: {
			label: 'Task Due Date Changed',
			department: 'admin',
		},
		task_priority_changed: {
			label: 'Task Priority Changed',
			department: 'admin',
		},
		notification_created: {
			label: 'Notification Created',
			department: 'admin',
		},
		notification_updated: {
			label: 'Notification Updated',
			department: 'admin',
		},
		notification_deleted: {
			label: 'Notification Deleted',
			department: 'admin',
		},
		notification_recipients_changed: {
			label: 'Notification Recipients Changed',
			department: 'admin',
		},
		notification_visibility_changed: {
			label: 'Notification Visibility Changed',
			department: 'admin',
		},
		preset_created: {
			label: 'Permission Preset Created',
			department: 'admin',
		},
		preset_updated: {
			label: 'Permission Preset Updated',
			department: 'admin',
		},
		preset_deleted: {
			label: 'Permission Preset Deleted',
			department: 'admin',
		},
		mail_account_authorized: {
			label: 'Mail Account Authorized',
			department: 'admin',
		},
		mail_account_updated: {
			label: 'Mail Account Updated',
			department: 'admin',
		},
		mail_account_revoked: {
			label: 'Mail Account Revoked',
			department: 'admin',
		},
		mail_assignment_created: {
			label: 'Mail Assignment Created',
			department: 'admin',
		},
		mail_assignment_removed: {
			label: 'Mail Assignment Removed',
			department: 'admin',
		},
		mail_primary_changed: {
			label: 'Mail Primary Changed',
			department: 'admin',
		},
	},
	tableOperationMap: {
		'users:INSERT': 'user_created',
		'users:UPDATE': 'user_updated',
		'users:DELETE': 'user_deleted',
		'tasks:INSERT': 'task_created',
		'tasks:UPDATE': 'task_updated',
		'tasks:DELETE': 'task_deleted',
		'notifications:INSERT': 'notification_created',
		'notifications:UPDATE': 'notification_updated',
		'notifications:DELETE': 'notification_deleted',
		'permission_presets:INSERT': 'preset_created',
		'permission_presets:UPDATE': 'preset_updated',
		'permission_presets:DELETE': 'preset_deleted',
		'mail_accounts:INSERT': 'mail_account_authorized',
		'mail_accounts:UPDATE': 'mail_account_updated',
		'mail_accounts:DELETE': 'mail_account_revoked',
		'mail_account_assignments:INSERT': 'mail_assignment_created',
		'mail_account_assignments:DELETE': 'mail_assignment_removed',
	},
} as const satisfies ActivityFragment;

export default ADMIN_ACTIVITIES;

export type AdminActivityType = keyof typeof ADMIN_ACTIVITIES.catalog;
