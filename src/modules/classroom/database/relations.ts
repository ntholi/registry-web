import { relations } from 'drizzle-orm';
import { users } from '@/modules/auth/database/schema/users';
import { coursePosts } from '../features/posts/database/schema/posts';
import { postReplies } from '../features/posts/database/schema/replies';

export const userRelations = relations(users, ({ many }) => ({
	coursePosts: many(coursePosts),
	postReplies: many(postReplies),
}));

export const coursePostsRelations = relations(coursePosts, ({ one, many }) => ({
	user: one(users, {
		fields: [coursePosts.userId],
		references: [users.id],
	}),
	replies: many(postReplies),
}));

export const postRepliesRelations = relations(postReplies, ({ one }) => ({
	post: one(coursePosts, {
		fields: [postReplies.postId],
		references: [coursePosts.id],
	}),
	user: one(users, {
		fields: [postReplies.userId],
		references: [users.id],
	}),
}));
