import { relations } from 'drizzle-orm';
import { students, users } from '@/core/database';
import { certificateReprints } from './certificateReprints';

export const certificateReprintsRelations = relations(
	certificateReprints,
	({ one }) => ({
		student: one(students, {
			fields: [certificateReprints.stdNo],
			references: [students.stdNo],
		}),
		createdByUser: one(users, {
			fields: [certificateReprints.createdBy],
			references: [users.id],
		}),
	})
);
