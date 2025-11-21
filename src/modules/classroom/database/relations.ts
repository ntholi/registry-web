import { relations } from 'drizzle-orm';
import { users } from '@/modules/auth/database/schema';
import { announcementReplies } from './schema/announcement-replies';

export const announcementRepliesRelations = relations(
	announcementReplies,
	({ one }) => ({
		user: one(users, {
			fields: [announcementReplies.userId],
			references: [users.id],
		}),
	})
);
