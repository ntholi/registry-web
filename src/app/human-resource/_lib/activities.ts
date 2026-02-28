import type { ActivityFragment } from '@/shared/lib/utils/activities';

const HUMAN_RESOURCE_ACTIVITIES = {
	catalog: {
		employee_creation: {
			label: 'Employee Created',
			department: 'human_resource',
		},
		employee_update: {
			label: 'Employee Updated',
			department: 'human_resource',
		},
		employee_delete: {
			label: 'Employee Deleted',
			department: 'human_resource',
		},
		employee_card_print: {
			label: 'Employee Card Printed',
			department: 'human_resource',
		},
	},
	tableOperationMap: {
		'employees:INSERT': 'employee_creation',
		'employees:UPDATE': 'employee_update',
		'employees:DELETE': 'employee_delete',
	},
} as const satisfies ActivityFragment;

export default HUMAN_RESOURCE_ACTIVITIES;

export type HumanResourceActivityType =
	keyof typeof HUMAN_RESOURCE_ACTIVITIES.catalog;
