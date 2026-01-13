'use server';

import { auth } from '@/core/auth';
import type { UserPosition, UserRole } from '@/core/database';
import type { NotificationWithRecipients } from './repository';
import { notificationsService as service } from './service';

export type CreateNotificationInput = Omit<
	NotificationWithRecipients,
	'createdBy'
>;

export async function getNotification(id: number) {
	return service.get(id);
}

export async function findAllNotifications(page = 1, search = '') {
	return service.findAll(page, search);
}

export async function createNotification(data: CreateNotificationInput) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}
	return service.create(data as NotificationWithRecipients, session.user.id);
}

export async function updateNotification(
	id: number,
	data: Partial<NotificationWithRecipients>
) {
	return service.update(id, data);
}

export async function deleteNotification(id: number) {
	return service.delete(id);
}

export async function getActiveNotificationsForUser() {
	const session = await auth();
	if (!session?.user?.id) {
		return [];
	}
	return service.getActiveNotificationsForUser(
		session.user.id,
		session.user.role as UserRole,
		session.user.position as UserPosition | null
	);
}

export async function dismissNotification(notificationId: number) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}
	return service.dismissNotification(notificationId, session.user.id);
}

export async function getRecipientUserIds(notificationId: number) {
	return service.getRecipientUserIds(notificationId);
}
