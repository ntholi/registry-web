import type { AdminActivityType } from '@admin/_lib/activities';
import type { UserRole } from '@/core/auth/permissions';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import NotificationRepository, {
	type NotificationWithRecipients,
} from './repository';

class NotificationService {
	private repository: NotificationRepository;

	constructor() {
		this.repository = new NotificationRepository();
	}

	async get(id: number) {
		return withPermission(() => this.repository.findById(id), {
			notifications: ['read'],
		});
	}

	async findAll(page = 1, search = '') {
		return withPermission(
			() => this.repository.findAllWithCreator(page, search),
			{ notifications: ['read'] }
		);
	}

	async create(data: NotificationWithRecipients, createdBy: string) {
		return withPermission(
			(session) =>
				this.repository.create(
					{ ...data, createdBy },
					{
						userId: session!.user!.id!,
						role: session!.user!.role!,
						activityType: 'notification_created',
					}
				),
			{ notifications: ['create'] }
		);
	}

	async createForCurrentUser(data: NotificationWithRecipients) {
		return withPermission(async (session) => {
			if (!session?.user?.id) {
				throw new Error('Unauthorized');
			}

			return this.create(data, session.user.id);
		}, 'auth');
	}

	async update(id: number, data: Partial<NotificationWithRecipients>) {
		return withPermission(
			(session) => {
				const activityType = resolveNotificationUpdateIntent(data);
				return this.repository.update(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType,
				});
			},
			{ notifications: ['update'] }
		);
	}

	async delete(id: number) {
		return withPermission(
			async (session) => {
				const notification = await this.repository.findById(id);
				await this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'notification_deleted',
				});
				return notification;
			},
			{ notifications: ['delete'] }
		);
	}

	async getActiveNotificationsForUser(
		userId: string,
		userRole: UserRole,
		presetId?: string | null
	) {
		return withPermission(
			() =>
				this.repository.getActiveNotificationsForUser(
					userId,
					userRole,
					presetId
				),
			'auth'
		);
	}

	async getActiveNotificationsForCurrentUser() {
		return withPermission(async (session) => {
			if (!session?.user?.id) {
				return [];
			}

			return this.getActiveNotificationsForUser(
				session.user.id,
				session.user.role as UserRole,
				session.user.presetId
			);
		}, 'auth');
	}

	async dismissNotification(notificationId: number, userId: string) {
		return withPermission(
			() => this.repository.dismissNotification(notificationId, userId),
			'auth'
		);
	}

	async dismissNotificationForCurrentUser(notificationId: number) {
		return withPermission(async (session) => {
			if (!session?.user?.id) {
				throw new Error('Unauthorized');
			}

			return this.dismissNotification(notificationId, session.user.id);
		}, 'auth');
	}

	async getRecipientUserIds(notificationId: number) {
		return withPermission(
			() => this.repository.getRecipientUserIds(notificationId),
			{ notifications: ['read'] }
		);
	}
}

export const notificationsService = serviceWrapper(
	NotificationService,
	'NotificationsService'
);

const VISIBILITY_KEYS: (keyof NotificationWithRecipients)[] = [
	'targetType',
	'targetRoles',
	'targetPositions',
	'visibleFrom',
	'visibleUntil',
	'isActive',
];

function resolveNotificationUpdateIntent(
	data: Partial<NotificationWithRecipients>
): AdminActivityType {
	if (data.recipientUserIds !== undefined)
		return 'notification_recipients_changed';
	if (VISIBILITY_KEYS.some((k) => k in data))
		return 'notification_visibility_changed';
	return 'notification_updated';
}
