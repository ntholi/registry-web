import { dashboardUsers } from '@auth/_database';
import {
	bigint,
	index,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { blockedStudentStatusEnum } from './enums';
import { students } from './students';

export const blockedStudents = pgTable(
	'blocked_students',
	{
		id: serial().primaryKey(),
		status: blockedStudentStatusEnum().notNull().default('blocked'),
		reason: text().notNull(),
		byDepartment: dashboardUsers().notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_blocked_students_std_no').on(table.stdNo),
	})
);

export const documents = pgTable(
	'documents',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		fileName: text().notNull(),
		type: text(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_documents_std_no').on(table.stdNo),
	})
);
