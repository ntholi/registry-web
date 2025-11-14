import { pgEnum } from 'drizzle-orm/pg-core';

export const fortinetLevel = pgEnum('fortinet_level', [
	'nse1',
	'nse2',
	'nse3',
	'nse4',
	'nse5',
	'nse6',
	'nse7',
	'nse8',
]);

export const fortinetRegistrationStatus = pgEnum(
	'fortinet_registration_status',
	['pending', 'approved', 'rejected', 'completed']
);

export const taskStatus = pgEnum('task_status', [
	'scheduled',
	'active',
	'in_progress',
	'completed',
	'cancelled',
]);
export type TaskStatus = (typeof taskStatus.enumValues)[number];

export const taskPriority = pgEnum('task_priority', [
	'low',
	'medium',
	'high',
	'urgent',
]);
export type TaskPriority = (typeof taskPriority.enumValues)[number];
