import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const dashboardUsers = pgEnum('dashboard_users', [
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'student_services',
	'admin',
]);
export type DashboardUser = (typeof dashboardUsers.enumValues)[number];

export const userRoles = pgEnum('user_roles', [
	'user',
	'student',
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'student_services',
	'admin',
]);
export type UserRole = (typeof userRoles.enumValues)[number];

export const userPositions = pgEnum('user_positions', [
	'manager',
	'program_leader',
	'principal_lecturer',
	'year_leader',
	'lecturer',
	'admin',
]);
export type UserPosition = (typeof userPositions.enumValues)[number];

export const users = pgTable('users', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text(),
	role: userRoles().notNull().default('user'),
	position: userPositions(),
	email: text().unique(),
	emailVerified: timestamp({ mode: 'date' }),
	image: text(),
	lmsUserId: integer(),
	lmsToken: text(),
});
