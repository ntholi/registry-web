import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { documents } from './documents';

export const documentsRelations = relations(documents, ({ one }) => ({
	student: one(students, {
		fields: [documents.stdNo],
		references: [students.stdNo],
	}),
}));
