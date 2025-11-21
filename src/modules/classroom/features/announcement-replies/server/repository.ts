import { and, desc, eq } from 'drizzle-orm';
import BaseRepository from '@/core/platform/BaseRepository';
import { announcementReplies, db } from '@/core/database';

export default class AnnouncementRepliesRepository extends BaseRepository<
	typeof announcementReplies,
	'id'
> {
	constructor() {
		super(announcementReplies, announcementReplies.id);
	}

	async findByAnnouncementId(announcementId: string) {
		return db.query.announcementReplies.findMany({
			where: eq(announcementReplies.announcementId, announcementId),
			orderBy: [desc(announcementReplies.createdAt)],
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
		});
	}

	async countByAnnouncementId(announcementId: string) {
		const replies = await db
			.select()
			.from(announcementReplies)
			.where(eq(announcementReplies.announcementId, announcementId));
		return replies.length;
	}
}

export const announcementRepliesRepository =
	new AnnouncementRepliesRepository();
