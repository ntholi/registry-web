import { users } from '@auth/users/_schema/users';
import { sql } from 'drizzle-orm';
import {
	bigint,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const gender = pgEnum('gender', ['Male', 'Female', 'Unknown']);

export const maritalStatusEnum = pgEnum('marital_status', [
	'Single',
	'Married',
	'Divorced',
	'Windowed',
	'Other',
]);

export const studentStatus = pgEnum('student_status', [
	'Active',
	'Applied',
	'Deceased',
	'Deleted',
	'Graduated',
	'Suspended',
	'Terminated',
	'Withdrawn',
]);

export const students = pgTable(
	'students',
	{
		stdNo: bigint({ mode: 'number' }).primaryKey(),
		name: text().notNull(),
		nationalId: text().notNull(),
		status: studentStatus().notNull().default('Active'),
		dateOfBirth: timestamp({ mode: 'date' }),
		phone1: text(),
		phone2: text(),
		gender: gender(),
		maritalStatus: maritalStatusEnum(),
		country: text(),
		race: text(),
		nationality: text(),
		birthPlace: text(),
		religion: text(),
		userId: text().references(() => users.id, { onDelete: 'set null' }),
		zohoContactId: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		nameTrigramIdx: index('idx_students_name_trgm').using(
			'gin',
			sql`${table.name} gin_trgm_ops`
		),
		userIdIdx: index('fk_students_user_id').on(table.userId),
	})
);
