'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import { lmsAuthRepository } from '@/modules/lms/features/auth/server/repository';
import type {
	CreateDiscussionParams,
	MoodleDiscussion,
	MoodleForum,
} from '../types';

export async function getCourseForums(
	courseId: number
): Promise<MoodleForum[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('mod_forum_get_forums_by_courses', {
		'courseids[0]': courseId,
	});

	return result as MoodleForum[];
}

export async function getForumDiscussions(
	forumId: number
): Promise<MoodleDiscussion[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('mod_forum_get_forum_discussions', {
		forumid: forumId,
		sortorder: -1,
	});

	if (!result || !result.discussions) {
		return [];
	}

	return result.discussions as MoodleDiscussion[];
}

export async function createForumDiscussion(params: CreateDiscussionParams) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const lmsUserId = await lmsAuthRepository.getLmsUserId(session.user.id);
	if (!lmsUserId) {
		throw new Error('User is not linked to a Moodle account');
	}

	if (!params.subject?.trim()) {
		throw new Error('Subject is required');
	}

	if (!params.message?.trim()) {
		throw new Error('Message is required');
	}

	const result = await moodlePost('mod_forum_add_discussion', {
		forumid: params.forumid,
		subject: params.subject.trim(),
		message: params.message.trim(),
		messageformat: 1,
		groupid: -1,
	});

	return result;
}

export async function getMainForum(
	courseId: number
): Promise<MoodleForum | null> {
	const forums = await getCourseForums(courseId);

	const newsForums = forums.filter((f) => f.type === 'news');
	if (newsForums.length > 0) {
		return newsForums[0];
	}

	return forums.length > 0 ? forums[0] : null;
}
