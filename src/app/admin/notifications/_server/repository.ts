import type { UserPosition, UserRole } from '@auth/_database';
import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm';
import {
	db,
	notificationDismissals,
	notificationRecipients,
	notifications,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';

export type NotificationInsert = typeof notifications.$inferInsert;
export type NotificationSelect = typeof notifications.$inferSelect;

export type NotificationWithRecipients = NotificationInsert & {
	recipientUserIds?: string[];
};

export default class NotificationRepository extends BaseRepository<
	typeof notifications,
	'id'
> {
	constructor() {
		super(notifications, notifications.id);
	}

	async findAllWithCreator(page = 1, search = '', pageSize = 20) {
		const offset = (page - 1) * pageSize;

		const where = search
			? or(
					sql`${notifications.title} ILIKE ${`%${search}%`}`,
					sql`${notifications.message} ILIKE ${`%${search}%`}`
				)
			: undefined;

		const [items, countResult] = await Promise.all([
			db.query.notifications.findMany({
				where,
				with: { creator: true },
				orderBy: [desc(notifications.createdAt)],
				limit: pageSize,
				offset,
			}),
			db
				.select({ count: sql<number>`count(*)` })
				.from(notifications)
				.where(where),
		]);

		return {
			items,
			totalPages: Math.ceil((countResult[0]?.count || 0) / pageSize),
		};
	}

	async findById(id: number) {
		return db.query.notifications.findFirst({
			where: eq(notifications.id, id),
			with: {
				creator: true,
				recipients: {
					with: { user: true },
				},
			},
		});
	}

	async create(data: NotificationWithRecipients, audit?: AuditOptions) {
		const { recipientUserIds, ...notificationData } = data;

		return db.transaction(async (tx) => {
			const [created] = await tx
				.insert(notifications)
				.values(notificationData)
				.returning();

			if (recipientUserIds && recipientUserIds.length > 0) {
				await tx.insert(notificationRecipients).values(
					recipientUserIds.map((userId) => ({
						notificationId: created.id,
						userId,
					}))
				);
			}

			if (audit) {
				await this.writeAuditLog(
					tx,
					'INSERT',
					String(created.id),
					null,
					created,
					audit
				);
			}

			return created;
		});
	}

	async update(
		id: number,
		data: Partial<NotificationWithRecipients>,
		audit?: AuditOptions
	) {
		const { recipientUserIds, ...notificationData } = data;

		return db.transaction(async (tx) => {
			const existing = audit
				? await tx
						.select()
						.from(notifications)
						.where(eq(notifications.id, id))
						.then((r) => r[0])
				: undefined;

			const [updated] = await tx
				.update(notifications)
				.set({ ...notificationData, updatedAt: new Date() })
				.where(eq(notifications.id, id))
				.returning();

			if (recipientUserIds !== undefined) {
				await tx
					.delete(notificationRecipients)
					.where(eq(notificationRecipients.notificationId, id));

				if (recipientUserIds.length > 0) {
					await tx.insert(notificationRecipients).values(
						recipientUserIds.map((userId) => ({
							notificationId: id,
							userId,
						}))
					);
				}
			}

			if (audit && existing) {
				await this.writeAuditLog(
					tx,
					'UPDATE',
					String(id),
					existing,
					updated,
					audit
				);
			}

			return updated;
		});
	}

	async getActiveNotificationsForUser(
		userId: string,
		userRole: UserRole,
		userPosition?: UserPosition | null
	) {
		const now = new Date();

		const baseConditions = and(
			eq(notifications.isActive, true),
			lte(notifications.visibleFrom, now),
			gte(notifications.visibleUntil, now)
		);

		const allNotifications = await db.query.notifications.findMany({
			where: baseConditions,
			with: {
				recipients: true,
				dismissals: {
					where: eq(notificationDismissals.userId, userId),
				},
			},
			orderBy: [desc(notifications.createdAt)],
		});

		return allNotifications.filter((notification) => {
			if (notification.dismissals.length > 0) {
				return false;
			}

			if (notification.targetType === 'all') {
				return true;
			}

			if (notification.targetType === 'users') {
				return notification.recipients.some((r) => r.userId === userId);
			}

			if (notification.targetType === 'role') {
				const matchesRole =
					!notification.targetRoles ||
					notification.targetRoles.length === 0 ||
					notification.targetRoles.includes(userRole);

				const matchesPosition =
					!notification.targetPositions ||
					notification.targetPositions.length === 0 ||
					(userPosition && notification.targetPositions.includes(userPosition));

				if (
					notification.targetRoles?.length &&
					notification.targetPositions?.length
				) {
					return matchesRole && matchesPosition;
				}
				if (notification.targetRoles?.length) {
					return matchesRole;
				}
				if (notification.targetPositions?.length) {
					return matchesPosition;
				}
				return true;
			}

			return false;
		});
	}

	async dismissNotification(notificationId: number, userId: string) {
		const existing = await db.query.notificationDismissals.findFirst({
			where: and(
				eq(notificationDismissals.notificationId, notificationId),
				eq(notificationDismissals.userId, userId)
			),
		});

		if (!existing) {
			await db.insert(notificationDismissals).values({
				notificationId,
				userId,
			});
		}
	}

	async getRecipientUserIds(notificationId: number) {
		const recipients = await db.query.notificationRecipients.findMany({
			where: eq(notificationRecipients.notificationId, notificationId),
		});
		return recipients.map((r) => r.userId);
	}
}
