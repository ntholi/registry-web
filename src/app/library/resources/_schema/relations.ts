import { users } from '@auth/users/_schema/users';
import { documents } from '@registry/documents/_schema/documents';
import { relations } from 'drizzle-orm';
import { libraryResources } from './libraryResources';

export const libraryResourcesRelations = relations(
	libraryResources,
	({ one }) => ({
		document: one(documents, {
			fields: [libraryResources.documentId],
			references: [documents.id],
		}),
		uploadedByUser: one(users, {
			fields: [libraryResources.uploadedBy],
			references: [users.id],
		}),
	})
);
