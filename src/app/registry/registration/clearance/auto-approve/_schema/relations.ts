import { users } from '@auth/users/_schema/users';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { autoApprovalRules } from './autoApprovalRules';

export const autoApprovalRulesRelations = relations(
	autoApprovalRules,
	({ one }) => ({
		term: one(terms, {
			fields: [autoApprovalRules.termId],
			references: [terms.id],
		}),
		createdByUser: one(users, {
			fields: [autoApprovalRules.createdBy],
			references: [users.id],
		}),
	})
);
