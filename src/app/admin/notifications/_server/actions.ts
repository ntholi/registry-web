'use server';

import { triggerNotificationEmail } from '@mail/_server/trigger-service';
import { getSession } from '@/core/platform/withPermission';
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
	async (data: CreateNotificationInput) => {
		const result = await service.createForCurrentUser(
			data as NotificationWithRecipients
		);

		if (data.recipientUserIds?.length) {
			const session = await getSession();
			void triggerNotificationEmail({
				notificationId: result.id,
				title: data.title,
				message: data.message,
				link: data.link ?? undefined,
				senderName: session?.user?.name ?? undefined,
				recipientUserIds: data.recipientUserIds,
			}).catch(() => {});
		}

		return result;
	}
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
