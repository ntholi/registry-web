import { relations } from 'drizzle-orm';
import { users } from '@/core/database';
import {
	notificationDismissals,
	notificationRecipients,
	notifications,
} from './notifications';

export const notificationsRelations = relations(
	notifications,
	({ many, one }) => ({
		creator: one(users, {
			fields: [notifications.createdBy],
			references: [users.id],
		}),
		recipients: many(notificationRecipients),
		dismissals: many(notificationDismissals),
	})
);

export const notificationRecipientsRelations = relations(
	notificationRecipients,
	({ one }) => ({
		notification: one(notifications, {
			fields: [notificationRecipients.notificationId],
			references: [notifications.id],
		}),
		user: one(users, {
			fields: [notificationRecipients.userId],
			references: [users.id],
		}),
	})
);

export const notificationDismissalsRelations = relations(
	notificationDismissals,
	({ one }) => ({
		notification: one(notifications, {
			fields: [notificationDismissals.notificationId],
			references: [notifications.id],
		}),
		user: one(users, {
			fields: [notificationDismissals.userId],
			references: [users.id],
		}),
	})
);
