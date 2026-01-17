import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { digitalResources } from './digitalResources';

export const digitalResourcesRelations = relations(
	digitalResources,
	({ one }) => ({
		uploadedByUser: one(users, {
			fields: [digitalResources.uploadedBy],
			references: [users.id],
		}),
	})
);
