import { eq, desc } from 'drizzle-orm';
import { db } from '@/core/database';
import { coursePosts, postReplies } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

class PostRepository extends BaseRepository<typeof coursePosts, 'id'> {
	constructor() {
		super(coursePosts, coursePosts.id);
	}

	async findByCourseId(courseId: string) {
		return db.query.coursePosts.findMany({
			where: eq(coursePosts.courseId, courseId),
			orderBy: [desc(coursePosts.createdAt)],
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						image: true,
					},
				},
				replies: {
					orderBy: [desc(postReplies.createdAt)],
					with: {
						user: {
							columns: {
								id: true,
								name: true,
								image: true,
							},
						},
					},
				},
			},
		});
	}

	async findByIdWithReplies(id: number) {
		return db.query.coursePosts.findFirst({
			where: eq(coursePosts.id, id),
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						image: true,
					},
				},
				replies: {
					orderBy: [desc(postReplies.createdAt)],
					with: {
						user: {
							columns: {
								id: true,
								name: true,
								image: true,
							},
						},
					},
				},
			},
		});
	}
}

class ReplyRepository extends BaseRepository<typeof postReplies, 'id'> {
	constructor() {
		super(postReplies, postReplies.id);
	}

	async findByPostId(postId: number) {
		return db.query.postReplies.findMany({
			where: eq(postReplies.postId, postId),
			orderBy: [desc(postReplies.createdAt)],
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
}

export const postRepository = new PostRepository();
export const replyRepository = new ReplyRepository();
