import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { auth } from '@/core/auth';
import AnnouncementRepliesRepository from './repository';

class AnnouncementRepliesService {
	constructor(
		private readonly repository = new AnnouncementRepliesRepository()
	) {}

	async createReply(data: {
		announcementId: string;
		courseId: string;
		text: string;
	}) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.id) {
				throw new Error('Unauthorized');
			}

			return this.repository.create({
				announcementId: data.announcementId,
				courseId: data.courseId,
				userId: session.user.id,
				text: data.text,
			});
		}, ['dashboard']);
	}

	async getRepliesByAnnouncementId(announcementId: string) {
		return withAuth(
			async () => this.repository.findByAnnouncementId(announcementId),
			['dashboard']
		);
	}

	async getReplyCount(announcementId: string) {
		return withAuth(
			async () => this.repository.countByAnnouncementId(announcementId),
			['dashboard']
		);
	}
}

export const announcementRepliesService = serviceWrapper(
	AnnouncementRepliesService,
	'AnnouncementRepliesService'
);
