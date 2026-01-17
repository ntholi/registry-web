import { relations } from 'drizzle-orm';
import { students } from '@/core/database';
import { documents } from './documents';

export const documentsRelations = relations(documents, ({ one }) => ({
	student: one(students, {
		fields: [documents.stdNo],
		references: [students.stdNo],
	}),
}));
