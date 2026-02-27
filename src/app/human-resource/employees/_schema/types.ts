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

export const employeeDepartment = pgEnum('employee_department', [
	'Academic',
	'Finance',
	'Registry',
	'Library',
	'Marketing',
	'Student Services',
	'LEAP',
	'Human Resources',
	'Operations and Resources',
]);
