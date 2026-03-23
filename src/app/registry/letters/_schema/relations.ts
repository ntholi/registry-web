import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { letterTemplates } from './letterTemplates';

export const letterTemplatesRelations = relations(
	letterTemplates,
	({ one }) => ({
		creator: one(users, {
			fields: [letterTemplates.createdBy],
			references: [users.id],
		}),
	})
);
