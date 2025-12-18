import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { users } from '@/modules/auth/database';

export const notificationTargetType = pgEnum('notification_target_type', [
	'all',
	'role',
	'users',
]);

export const notifications = pgTable('notifications', {
	id: serial().primaryKey(),
	title: text().notNull(),
	message: text().notNull(),
	targetType: notificationTargetType().notNull().default('all'),
	targetRoles: text().array(),
	targetPositions: text().array(),
	visibleFrom: timestamp({ mode: 'date' }).notNull(),
	visibleUntil: timestamp({ mode: 'date' }).notNull(),
	isActive: boolean().notNull().default(true),
	createdBy: text()
		.notNull()
		.references(() => users.id),
	createdAt: timestamp({ mode: 'date' }).defaultNow(),
	updatedAt: timestamp({ mode: 'date' }).defaultNow(),
});

export const notificationRecipients = pgTable('notification_recipients', {
	id: serial().primaryKey(),
	notificationId: integer()
		.notNull()
		.references(() => notifications.id, { onDelete: 'cascade' }),
	userId: text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
});

export const notificationDismissals = pgTable('notification_dismissals', {
	id: serial().primaryKey(),
	notificationId: integer()
		.notNull()
		.references(() => notifications.id, { onDelete: 'cascade' }),
	userId: text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	dismissedAt: timestamp({ mode: 'date' }).defaultNow(),
});
