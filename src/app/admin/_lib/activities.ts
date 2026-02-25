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
	},
} as const satisfies ActivityFragment;

export default ADMIN_ACTIVITIES;

export type AdminActivityType = keyof typeof ADMIN_ACTIVITIES.catalog;
