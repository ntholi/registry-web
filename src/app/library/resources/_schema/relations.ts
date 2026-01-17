import { relations } from 'drizzle-orm';
import { users } from '@/core/database';
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
