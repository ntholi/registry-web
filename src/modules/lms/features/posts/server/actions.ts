'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type {
	CreatePostParams,
	MoodleDiscussion,
	MoodleForum,
	MoodlePost,
	PostType,
} from '../types';

const ANNOUNCEMENTS_FORUM_NAME = 'Announcements';
const DISCUSSIONS_FORUM_NAME = 'Discussions';

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

async function findOrCreateForum(
	courseId: number,
	forumName: string,
	forumType: 'news' | 'general'
): Promise<MoodleForum> {
	const forums = await getCourseForums(courseId);

	let forum = forums.find(
		(f) => f.name.toLowerCase() === forumName.toLowerCase()
	);

	if (!forum) {
		await moodlePost('local_activity_utils_create_forum', {
			courseid: courseId,
			name: forumName,
			intro: `${forumName} for the course`,
			type: forumType,
			section: 0,
		});

		const updatedForums = await getCourseForums(courseId);
		forum = updatedForums.find(
			(f) => f.name.toLowerCase() === forumName.toLowerCase()
		);

		if (!forum) {
			throw new Error(`Failed to create ${forumName} forum`);
		}
	}

	return forum;
}

async function getForumForPostType(
	courseId: number,
	postType: PostType
): Promise<MoodleForum> {
	if (postType === 'announcement') {
		return findOrCreateForum(courseId, ANNOUNCEMENTS_FORUM_NAME, 'news');
	}
	return findOrCreateForum(courseId, DISCUSSIONS_FORUM_NAME, 'general');
}

export async function createPost(params: CreatePostParams) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	if (!params.subject?.trim()) {
		throw new Error('Subject is required');
	}

	if (!params.message?.trim()) {
		throw new Error('Message is required');
	}

	const forum = await getForumForPostType(params.courseId, params.postType);

	const result = await moodlePost('mod_forum_add_discussion', {
		forumid: forum.id,
		subject: params.subject.trim(),
		message: params.message.trim(),
	});

	return result;
}

export async function getAnnouncementsForum(
	courseId: number
): Promise<MoodleForum | null> {
	const forums = await getCourseForums(courseId);
	return (
		forums.find(
			(f) => f.name.toLowerCase() === ANNOUNCEMENTS_FORUM_NAME.toLowerCase()
		) ||
		forums.find((f) => f.type === 'news') ||
		null
	);
}

export async function getDiscussionsForum(
	courseId: number
): Promise<MoodleForum | null> {
	const forums = await getCourseForums(courseId);
	return (
		forums.find(
			(f) => f.name.toLowerCase() === DISCUSSIONS_FORUM_NAME.toLowerCase()
		) ||
		forums.find((f) => f.type === 'general') ||
		null
	);
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

export async function getAllPosts(courseId: number): Promise<{
	announcements: MoodleDiscussion[];
	discussions: MoodleDiscussion[];
}> {
	const [announcementsForum, discussionsForum] = await Promise.all([
		getAnnouncementsForum(courseId),
		getDiscussionsForum(courseId),
	]);

	const [announcements, discussions] = await Promise.all([
		announcementsForum
			? getForumDiscussions(announcementsForum.id)
			: Promise.resolve([]),
		discussionsForum
			? getForumDiscussions(discussionsForum.id)
			: Promise.resolve([]),
	]);

	return { announcements, discussions };
}

export async function getDiscussionPosts(
	discussionId: number
): Promise<MoodlePost[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('mod_forum_get_discussion_posts', {
		discussionid: discussionId,
		sortby: 'created',
		sortdirection: 'ASC',
	});

	if (!result || !result.posts) {
		return [];
	}

	const posts = result.posts as Array<{
		id: number;
		subject: string;
		message: string;
		author: {
			id: number;
			fullname: string;
			urls: { profileimage?: string };
		};
		timecreated: number;
		parent: number;
	}>;

	return posts.map((p) => ({
		...p,
		created: p.timecreated,
		userfullname: p.author.fullname,
		userpictureurl: p.author.urls.profileimage || '',
	})) as MoodlePost[];
}

export async function deletePost(discussionId: number) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	try {
		await moodlePost('mod_forum_delete_discussion', {
			discussionid: discussionId,
		});
	} catch (error) {
		console.error('Error deleting post:', error);
		throw new Error('Unable to delete post');
	}
}
