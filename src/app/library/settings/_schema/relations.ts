import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { librarySettings } from './librarySettings';

export const librarySettingsRelations = relations(
	librarySettings,
	({ one }) => ({
		creator: one(users, {
			fields: [librarySettings.createdBy],
			references: [users.id],
		}),
		updator: one(users, {
			fields: [librarySettings.updatedBy],
			references: [users.id],
		}),
	})
);
