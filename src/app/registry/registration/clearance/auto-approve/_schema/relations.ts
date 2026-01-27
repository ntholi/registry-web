import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { autoApprovals } from './autoApprovals';

export const autoApprovalsRelations = relations(autoApprovals, ({ one }) => ({
	term: one(terms, {
		fields: [autoApprovals.termId],
		references: [terms.id],
	}),
	student: one(students, {
		fields: [autoApprovals.stdNo],
		references: [students.stdNo],
	}),
	createdByUser: one(users, {
		fields: [autoApprovals.createdBy],
		references: [users.id],
	}),
}));
