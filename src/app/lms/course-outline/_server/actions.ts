'use server';

import { getLmsCredentials } from '@auth/auth-providers/_server/repository';
import { getCourseSections, getOrReuseSection } from '@lms/_shared/utils';
import { auth } from '@/core/auth';
import { moodlePost } from '@/core/integrations/moodle';
import { createAction } from '@/shared/lib/actions/actionResult';
import type {
	CourseOutlineBook,
	CourseSection,
	CourseTopic,
	CreateSectionParams,
	CreateTopicParams,
	MoodleBookResponse,
	MoodleChapterResponse,
} from '../types';

const COURSE_OUTLINE_SECTION_NAME = 'Course Outline';
const COURSE_OUTLINE_BOOK_NAME = 'Course Outline';
const TOPICS_CHAPTER_TITLE = 'Topics';

async function getLmsToken() {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const creds = await getLmsCredentials(session.user.id);
	return creds?.lmsToken ?? undefined;
}

async function findCourseOutlineBook(
	courseId: number
): Promise<{ bookId: number; courseModuleId: number } | null> {
	const lmsToken = await getLmsToken();
	const sections = await getCourseSections(courseId, lmsToken);

	for (const section of sections) {
		if (!section.modules) continue;

		const bookModule = section.modules.find(
			(mod) =>
				mod.modname === 'book' &&
				mod.name.toLowerCase() === COURSE_OUTLINE_BOOK_NAME.toLowerCase()
		);

		if (bookModule) {
			return {
				bookId: bookModule.instance,
				courseModuleId: bookModule.id,
			};
		}
	}

	return null;
}

async function createCourseOutlineBook(
	courseId: number
): Promise<MoodleBookResponse> {
	const lmsToken = await getLmsToken();
	const sectionNum = await getOrReuseSection({
		courseId,
		sectionName: COURSE_OUTLINE_SECTION_NAME,
		summary: 'Course outline containing sections and topics',
		lmsToken,
	});

	const result = await moodlePost(
		'local_activity_utils_create_book',
		{
			courseid: courseId,
			name: COURSE_OUTLINE_BOOK_NAME,
			intro:
				'This book contains the course outline including sections and topics covered in the course.',
			section: sectionNum,
			numbering: 1,
			navstyle: 1,
			visible: 1,
		},
		lmsToken
	);

	return result as MoodleBookResponse;
}

async function getOrCreateCourseOutlineBook(
	courseId: number
): Promise<CourseOutlineBook | null> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}
	const lmsToken = await getLmsCredentials(session.user.id);

	const existingBook = await findCourseOutlineBook(courseId);

	if (existingBook) {
		const bookDetails = await moodlePost(
			'local_activity_utils_get_book',
			{
				bookid: existingBook.bookId,
			},
			lmsToken?.lmsToken ?? undefined
		);
		return bookDetails as CourseOutlineBook;
	}

	return null;
}

export async function getCourseOutline(courseId: number): Promise<{
	sections: CourseSection[];
	topics: CourseTopic[];
	bookId: number | null;
}> {
	const book = await getOrCreateCourseOutlineBook(courseId);

	if (!book) {
		return {
			sections: [],
			topics: [],
			bookId: null,
		};
	}

	const sections: CourseSection[] = [];
	const topics: CourseTopic[] = [];

	let isInTopicsChapter = false;

	for (const chapter of book.chapters) {
		if (chapter.title === TOPICS_CHAPTER_TITLE && chapter.subchapter === 0) {
			isInTopicsChapter = true;
			continue;
		}

		if (chapter.subchapter === 0) {
			isInTopicsChapter = false;
			sections.push({
				id: chapter.id,
				pagenum: chapter.pagenum,
				title: chapter.title,
				content: chapter.content,
			});
		} else if (isInTopicsChapter && chapter.subchapter === 1) {
			const weekMatch = chapter.title.match(/^Week\s+(\d+):\s*(.+)$/i);
			const weekNumber = weekMatch ? Number.parseInt(weekMatch[1], 10) : 0;
			const topicTitle = weekMatch ? weekMatch[2] : chapter.title;

			topics.push({
				id: chapter.id,
				pagenum: chapter.pagenum,
				weekNumber,
				title: topicTitle,
				description: chapter.content,
			});
		}
	}

	return {
		sections,
		topics,
		bookId: book.id,
	};
}

export const createSection = createAction(
	async (params: CreateSectionParams): Promise<MoodleChapterResponse> => {
		const lmsToken = await getLmsToken();

		const { courseId, title, content, sectionNumber } = params;

		let existingBook = await findCourseOutlineBook(courseId);

		if (!existingBook) {
			const newBook = await createCourseOutlineBook(courseId);
			existingBook = {
				bookId: newBook.id,
				courseModuleId: newBook.coursemoduleid,
			};
		}

		const result = await moodlePost(
			'local_activity_utils_add_book_chapter',
			{
				bookid: existingBook.bookId,
				title,
				content,
				subchapter: 0,
				hidden: 0,
				pagenum: sectionNumber,
			},
			lmsToken
		);

		return result as MoodleChapterResponse;
	}
);

export const createTopic = createAction(
	async (params: CreateTopicParams): Promise<MoodleChapterResponse> => {
		const lmsToken = await getLmsToken();

		const { courseId, weekNumber, title, description } = params;

		let existingBook = await findCourseOutlineBook(courseId);

		if (!existingBook) {
			const newBook = await createCourseOutlineBook(courseId);
			existingBook = {
				bookId: newBook.id,
				courseModuleId: newBook.coursemoduleid,
			};
		}

		const bookDetails = (await moodlePost(
			'local_activity_utils_get_book',
			{
				bookid: existingBook.bookId,
			},
			lmsToken
		)) as CourseOutlineBook;

		const topicsChapter = bookDetails.chapters.find(
			(ch) => ch.title === TOPICS_CHAPTER_TITLE && ch.subchapter === 0
		);

		if (!topicsChapter) {
			await moodlePost(
				'local_activity_utils_add_book_chapter',
				{
					bookid: existingBook.bookId,
					title: TOPICS_CHAPTER_TITLE,
					content:
						'<p>This section contains the weekly topics covered in this course.</p>',
					subchapter: 0,
					hidden: 0,
					pagenum: 0,
				},
				lmsToken
			);
		}

		const topicTitle = `Week ${weekNumber}: ${title}`;
		const result = await moodlePost(
			'local_activity_utils_add_book_chapter',
			{
				bookid: existingBook.bookId,
				title: topicTitle,
				content: description,
				subchapter: 1,
				hidden: 0,
				pagenum: 0,
			},
			lmsToken
		);

		return result as MoodleChapterResponse;
	}
);
