import { permissionPresets } from '@auth/permission-presets/_schema/permissionPresets';
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

const dashboardUserValues = [
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'marketing',
	'student_services',
	'admin',
	'leap',
	'human_resource',
] as const;
export const dashboardUsers = { enumValues: dashboardUserValues } as const;
export type DashboardUser = (typeof dashboardUserValues)[number];

const userRoleValues = [
	'user',
	'applicant',
	'student',
	'finance',
	'registry',
	'library',
	'resource',
	'academic',
	'marketing',
	'student_services',
	'admin',
	'leap',
	'human_resource',
] as const;
export const userRoles = { enumValues: userRoleValues } as const;
export type UserRole = (typeof userRoleValues)[number];

const userPositionValues = [
	'manager',
	'program_leader',
	'principal_lecturer',
	'year_leader',
	'lecturer',
	'admin',
] as const;
export const userPositions = { enumValues: userPositionValues } as const;
export type UserPosition = (typeof userPositionValues)[number];

export const users = pgTable(
	'users',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		name: text().notNull(),
		role: text().$type<UserRole>().notNull().default('user'),
		position: text().$type<UserPosition | null>(),
		email: text().notNull().unique(),
		emailVerified: boolean().notNull().default(false),
		image: text(),
		presetId: text('preset_id').references(() => permissionPresets.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		banned: boolean().default(false),
		banReason: text('ban_reason'),
		banExpires: timestamp('ban_expires'),
	},
	(table) => ({
		presetIdIdx: index('users_preset_id_idx').on(table.presetId),
	})
);
