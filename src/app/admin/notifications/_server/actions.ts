'use server';

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
	return service.createForCurrentUser(data as NotificationWithRecipients);
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
	return service.getActiveNotificationsForCurrentUser();
}

export async function dismissNotification(notificationId: number) {
	return service.dismissNotificationForCurrentUser(notificationId);
}

export async function getRecipientUserIds(notificationId: number) {
	return service.getRecipientUserIds(notificationId);
}
