import { pgEnum } from 'drizzle-orm/pg-core';

export const employeeStatus = pgEnum('employee_status', [
	'Active',
	'Suspended',
	'Terminated',
	'Resigned',
	'Retired',
	'Deceased',
	'On Leave',
]);

export const employeeType = pgEnum('employee_type', [
	'Full-time',
	'Part-time',
	'Contract',
	'Intern',
]);
