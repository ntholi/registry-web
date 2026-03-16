'use server';

import { createAction } from '@/shared/lib/actions/actionResult';
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

export const createNotification = createAction(
	async (data: CreateNotificationInput) =>
		service.createForCurrentUser(data as NotificationWithRecipients)
);

export const updateNotification = createAction(
	async (id: number, data: Partial<NotificationWithRecipients>) =>
		service.update(id, data)
);

export const deleteNotification = createAction(async (id: number) =>
	service.delete(id)
);

export async function getActiveNotificationsForUser() {
	return service.getActiveNotificationsForCurrentUser();
}

export const dismissNotification = createAction(
	async (notificationId: number) =>
		service.dismissNotificationForCurrentUser(notificationId)
);

export async function getRecipientUserIds(notificationId: number) {
	return service.getRecipientUserIds(notificationId);
}
