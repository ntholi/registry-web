import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import {
	bigint,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const noteVisibility = pgEnum('note_visibility', [
	'role',
	'self',
	'everyone',
]);

export type NoteVisibility = (typeof noteVisibility.enumValues)[number];

export const studentNotes = pgTable(
	'student_notes',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		content: text().notNull(),
		visibility: noteVisibility().notNull().default('role'),
		creatorRole: text('creator_role').notNull(),
		createdBy: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow().notNull(),
		updatedAt: timestamp()
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		stdNoIdx: index('idx_student_notes_std_no').on(table.stdNo),
		createdByIdx: index('idx_student_notes_created_by').on(table.createdBy),
	})
);
