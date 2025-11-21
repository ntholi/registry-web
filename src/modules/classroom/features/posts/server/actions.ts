'use server';

import { postService, replyService } from './service';
import type { coursePosts, postReplies } from '@/core/database';

export async function getCoursePosts(courseId: string) {
	return postService.getByCourseId(courseId);
}

export async function getPostWithReplies(id: number) {
	return postService.getWithReplies(id);
}

export async function createPost(
	data: Omit<typeof coursePosts.$inferInsert, 'userId'>
) {
	return postService.createPost(data);
}

export async function updatePost(
	id: number,
	data: Partial<Omit<typeof coursePosts.$inferInsert, 'userId'>>
) {
	return postService.update(id, data);
}

export async function deletePost(id: number) {
	return postService.delete(id);
}

export async function getRepliesByPostId(postId: number) {
	return replyService.getByPostId(postId);
}

export async function createReply(
	data: Omit<typeof postReplies.$inferInsert, 'userId'>
) {
	return replyService.createReply(data);
}

export async function updateReply(
	id: number,
	data: Partial<Omit<typeof postReplies.$inferInsert, 'userId'>>
) {
	return replyService.update(id, data);
}

export async function deleteReply(id: number) {
	return replyService.delete(id);
}
