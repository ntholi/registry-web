import type { UserPosition, UserRole } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import NotificationRepository, {
	type NotificationWithRecipients,
} from './repository';

class NotificationService {
	private repository: NotificationRepository;

	constructor() {
		this.repository = new NotificationRepository();
	}

	async get(id: number) {
		return withAuth(() => this.repository.findById(id), ['dashboard']);
	}

	async findAll(page = 1, search = '') {
		return withAuth(
			() => this.repository.findAllWithCreator(page, search),
			['admin']
		);
	}

	async create(data: NotificationWithRecipients, createdBy: string) {
		return withAuth(
			(session) =>
				this.repository.create(
					{ ...data, createdBy },
					{
						userId: session!.user!.id!,
						role: session!.user!.role!,
						activityType: 'notification_created',
					}
				),
			['admin']
		);
	}

	async update(id: number, data: Partial<NotificationWithRecipients>) {
		return withAuth(
			(session) =>
				this.repository.update(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'notification_updated',
				}),
			['admin']
		);
	}

	async delete(id: number) {
		return withAuth(
			async (session) => {
				const notification = await this.repository.findById(id);
				await this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'notification_deleted',
				});
				return notification;
			},
			['admin']
		);
	}

	async getActiveNotificationsForUser(
		userId: string,
		userRole: UserRole,
		userPosition?: UserPosition | null
	) {
		return withAuth(
			() =>
				this.repository.getActiveNotificationsForUser(
					userId,
					userRole,
					userPosition
				),
			['all']
		);
	}

	async dismissNotification(notificationId: number, userId: string) {
		return withAuth(
			() => this.repository.dismissNotification(notificationId, userId),
			['all']
		);
	}

	async getRecipientUserIds(notificationId: number) {
		return withAuth(
			() => this.repository.getRecipientUserIds(notificationId),
			['admin']
		);
	}
}

export const notificationsService = serviceWrapper(
	NotificationService,
	'NotificationsService'
);
