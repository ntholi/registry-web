import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import { sql } from 'drizzle-orm';
import { bigint, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { studentStatuses } from '../../student-statuses/_schema/studentStatuses';
import { letterTemplates } from './letterTemplates';

export const letters = pgTable('letters', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	serialNumber: text('serial_number')
		.notNull()
		.unique()
		.default(sql`generate_letter_serial()`),
	templateId: text('template_id').references(() => letterTemplates.id, {
		onDelete: 'set null',
	}),
	stdNo: bigint({ mode: 'number' })
		.references(() => students.stdNo, { onDelete: 'cascade' })
		.notNull(),
	content: text().notNull(),
	statusId: text('status_id').references(() => studentStatuses.id, {
		onDelete: 'set null',
	}),
	createdBy: text('created_by').references(() => users.id, {
		onDelete: 'set null',
	}),
	createdAt: timestamp().defaultNow(),
});
