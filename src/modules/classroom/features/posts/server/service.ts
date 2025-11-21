import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { postRepository, replyRepository } from './repository';
import { auth } from '@/core/auth';
import type { coursePosts, postReplies } from '@/core/database';

class PostService extends BaseService<typeof coursePosts, 'id'> {
	constructor() {
		super(postRepository, {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
		});
	}

	async getByCourseId(courseId: string) {
		return withAuth(
			async () => postRepository.findByCourseId(courseId),
			['dashboard']
		);
	}

	async getWithReplies(id: number) {
		return withAuth(
			async () => postRepository.findByIdWithReplies(id),
			['dashboard']
		);
	}

	async createPost(data: Omit<typeof coursePosts.$inferInsert, 'userId'>) {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error('Unauthorized');
		}

		return withAuth(
			async () =>
				postRepository.create({
					...data,
					userId: session.user.id,
				}),
			['dashboard']
		);
	}
}

class ReplyService extends BaseService<typeof postReplies, 'id'> {
	constructor() {
		super(replyRepository, {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
		});
	}

	async getByPostId(postId: number) {
		return withAuth(
			async () => replyRepository.findByPostId(postId),
			['dashboard']
		);
	}

	async createReply(data: Omit<typeof postReplies.$inferInsert, 'userId'>) {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error('Unauthorized');
		}

		return withAuth(
			async () =>
				replyRepository.create({
					...data,
					userId: session.user.id,
				}),
			['dashboard']
		);
	}
}

export const postService = serviceWrapper(PostService, 'PostService');
export const replyService = serviceWrapper(ReplyService, 'ReplyService');
