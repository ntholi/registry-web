'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { NotificationWithRecipients } from './repository';
import { notificationsService as service } from './service';

export type CreateNotificationInput = Omit<
	NotificationWithRecipients,
	'createdBy'
>;

export const getNotification = createAction(async (id: number) => {
	return service.get(id);
});

export const findAllNotifications = createAction(
	async (page: number = 1, search: string = '') => {
		return service.findAll(page, search);
	}
);

export const createNotification = createAction(
	async (data: CreateNotificationInput) => {
		return service.createForCurrentUser(data as NotificationWithRecipients);
	}
);

export const updateNotification = createAction(
	async (id: number, data: Partial<NotificationWithRecipients>) => {
		return service.update(id, data);
	}
);

export const deleteNotification = createAction(async (id: number) => {
	return service.delete(id);
});

export const getActiveNotificationsForUser = createAction(async () => {
	return service.getActiveNotificationsForCurrentUser();
});

export const dismissNotification = createAction(
	async (notificationId: number) => {
		return service.dismissNotificationForCurrentUser(notificationId);
	}
);

export const getRecipientUserIds = createAction(
	async (notificationId: number) => {
		return service.getRecipientUserIds(notificationId);
	}
);
