import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
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
