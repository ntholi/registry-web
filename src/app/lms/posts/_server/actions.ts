'use server';

import { getLmsCredentials } from '@auth/auth-providers/_server/repository';
import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import type {
	CreatePostParams,
	MoodleDiscussion,
	MoodleForum,
	MoodlePost,
	PostType,
} from '../types';

const ANNOUNCEMENTS_FORUM_NAME = 'Announcements';
const DISCUSSIONS_FORUM_NAME = 'Discussions';

async function getLmsToken() {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const creds = await getLmsCredentials(session.user.id);
	return creds?.lmsToken ?? undefined;
}

export const getCourseForums = createAction(async (courseId: number) => {
	const lmsToken = await getLmsToken();

	const result = await moodleGet(
		'mod_forum_get_forums_by_courses',
		{
			'courseids[0]': courseId,
		},
		lmsToken
	);

	return result as MoodleForum[];
});

export const getForumDiscussions = createAction(async (forumId: number) => {
	const lmsToken = await getLmsToken();

	const result = await moodleGet(
		'mod_forum_get_forum_discussions',
		{
			forumid: forumId,
			sortorder: -1,
		},
		lmsToken
	);

	if (!result || !result.discussions) {
		return [];
	}

	return result.discussions as MoodleDiscussion[];
});

async function findOrCreateForum(
	courseId: number,
	forumName: string,
	forumType: 'news' | 'general',
	lmsToken?: string
): Promise<MoodleForum> {
	const forums = await moodleGet(
		'mod_forum_get_forums_by_courses',
		{
			'courseids[0]': courseId,
		},
		lmsToken
	);

	let forum = (forums as MoodleForum[]).find(
		(f) => f.name.toLowerCase() === forumName.toLowerCase()
	);

	if (!forum) {
		await moodlePost(
			'local_activity_utils_create_forum',
			{
				courseid: courseId,
				name: forumName,
				intro: `${forumName} for the course`,
				type: forumType,
				section: 0,
			},
			lmsToken
		);

		const updatedForums = (await moodleGet(
			'mod_forum_get_forums_by_courses',
			{
				'courseids[0]': courseId,
			},
			lmsToken
		)) as MoodleForum[];
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
	postType: PostType,
	lmsToken?: string
): Promise<MoodleForum> {
	if (postType === 'announcement') {
		return findOrCreateForum(
			courseId,
			ANNOUNCEMENTS_FORUM_NAME,
			'news',
			lmsToken
		);
	}
	return findOrCreateForum(
		courseId,
		DISCUSSIONS_FORUM_NAME,
		'general',
		lmsToken
	);
}

export const createPost = createAction(async (params: CreatePostParams) => {
	const lmsToken = await getLmsToken();

	if (!params.subject?.trim()) {
		throw new Error('Subject is required');
	}

	if (!params.message?.trim()) {
		throw new Error('Message is required');
	}

	const forum = await getForumForPostType(
		params.courseId,
		params.postType,
		lmsToken
	);

	const result = await moodlePost(
		'mod_forum_add_discussion',
		{
			forumid: forum.id,
			subject: params.subject.trim(),
			message: params.message.trim(),
		},
		lmsToken
	);

	return result;
});

export const getAnnouncementsForum = createAction(async (courseId: number) => {
	const forums = unwrap(await getCourseForums(courseId));
	return (
		forums.find(
			(f) => f.name.toLowerCase() === ANNOUNCEMENTS_FORUM_NAME.toLowerCase()
		) ||
		forums.find((f) => f.type === 'news') ||
		null
	);
});

export const getDiscussionsForum = createAction(async (courseId: number) => {
	const forums = unwrap(await getCourseForums(courseId));
	return (
		forums.find(
			(f) => f.name.toLowerCase() === DISCUSSIONS_FORUM_NAME.toLowerCase()
		) ||
		forums.find((f) => f.type === 'general') ||
		null
	);
});

export const getAllPosts = createAction(async (courseId: number) => {
	const [announcementsForum, discussionsForum] = await Promise.all([
		getAnnouncementsForum(courseId).then(unwrap),
		getDiscussionsForum(courseId).then(unwrap),
	]);

	const [announcements, discussions] = await Promise.all([
		announcementsForum
			? getForumDiscussions(announcementsForum.id).then(unwrap)
			: Promise.resolve([]),
		discussionsForum
			? getForumDiscussions(discussionsForum.id).then(unwrap)
			: Promise.resolve([]),
	]);

	return { announcements, discussions };
});

export const getDiscussionPosts = createAction(async (discussionId: number) => {
	const lmsToken = await getLmsToken();

	const result = await moodleGet(
		'mod_forum_get_discussion_posts',
		{
			discussionid: discussionId,
			sortby: 'created',
			sortdirection: 'ASC',
		},
		lmsToken
	);

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
});

export const deletePost = createAction(async (discussionId: number) => {
	const lmsToken = await getLmsToken();

	try {
		await moodlePost(
			'mod_forum_delete_discussion',
			{
				discussionid: discussionId,
			},
			lmsToken
		);
	} catch (error) {
		console.error('Error deleting post:', error);
		throw new Error('Unable to delete post');
	}
});
