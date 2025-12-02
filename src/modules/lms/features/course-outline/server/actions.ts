'use server';

import { getCourseSections } from '@lms/material';
import { auth } from '@/core/auth';
import { moodlePost } from '@/core/integrations/moodle';
import type {
	BookChapter,
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

async function findOrCreateCourseOutlineSection(
	courseId: number
): Promise<number> {
	const sections = await getCourseSections(courseId);

	const outlineSection = sections.find(
		(section) =>
			section.name.toLowerCase() === COURSE_OUTLINE_SECTION_NAME.toLowerCase()
	);

	if (outlineSection) {
		return outlineSection.section;
	}

	const result = await moodlePost('local_activity_utils_create_section', {
		courseid: courseId,
		name: COURSE_OUTLINE_SECTION_NAME,
		summary: 'Course outline containing sections and topics',
	});

	if (result && result.sectionnum !== undefined) {
		return result.sectionnum;
	}

	throw new Error('Failed to create Course Outline section');
}

async function findCourseOutlineBook(
	courseId: number
): Promise<{ bookId: number; courseModuleId: number } | null> {
	const sections = await getCourseSections(courseId);

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
	const sectionNum = await findOrCreateCourseOutlineSection(courseId);

	const result = await moodlePost('local_activity_utils_create_book', {
		courseid: courseId,
		name: COURSE_OUTLINE_BOOK_NAME,
		intro:
			'This book contains the course outline including sections and topics covered in the course.',
		section: sectionNum,
		numbering: 1,
		navstyle: 1,
		visible: 1,
	});

	return result as MoodleBookResponse;
}

async function getOrCreateCourseOutlineBook(
	courseId: number
): Promise<CourseOutlineBook | null> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const existingBook = await findCourseOutlineBook(courseId);

	if (existingBook) {
		const bookDetails = await moodlePost('local_activity_utils_get_book', {
			bookid: existingBook.bookId,
		});
		return bookDetails as CourseOutlineBook;
	}

	return null;
}

export async function getCourseOutline(courseId: number): Promise<{
	sections: CourseSection[];
	topics: CourseTopic[];
	bookId: number | null;
}> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

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

export async function createSection(
	params: CreateSectionParams
): Promise<MoodleChapterResponse> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const { courseId, title, content, sectionNumber } = params;

	let existingBook = await findCourseOutlineBook(courseId);

	if (!existingBook) {
		const newBook = await createCourseOutlineBook(courseId);
		existingBook = {
			bookId: newBook.id,
			courseModuleId: newBook.coursemoduleid,
		};
	}

	const result = await moodlePost('local_activity_utils_add_book_chapter', {
		bookid: existingBook.bookId,
		title,
		content,
		subchapter: 0,
		hidden: 0,
		pagenum: sectionNumber,
	});

	return result as MoodleChapterResponse;
}

export async function createTopic(
	params: CreateTopicParams
): Promise<MoodleChapterResponse> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const { courseId, weekNumber, title, description } = params;

	let existingBook = await findCourseOutlineBook(courseId);

	if (!existingBook) {
		const newBook = await createCourseOutlineBook(courseId);
		existingBook = {
			bookId: newBook.id,
			courseModuleId: newBook.coursemoduleid,
		};
	}

	const bookDetails = (await moodlePost('local_activity_utils_get_book', {
		bookid: existingBook.bookId,
	})) as CourseOutlineBook;

	const topicsChapter = bookDetails.chapters.find(
		(ch) => ch.title === TOPICS_CHAPTER_TITLE && ch.subchapter === 0
	);

	if (!topicsChapter) {
		await moodlePost('local_activity_utils_add_book_chapter', {
			bookid: existingBook.bookId,
			title: TOPICS_CHAPTER_TITLE,
			content:
				'<p>This section contains the weekly topics covered in this course.</p>',
			subchapter: 0,
			hidden: 0,
			pagenum: 0,
		});
	}

	const topicTitle = `Week ${weekNumber}: ${title}`;
	const result = await moodlePost('local_activity_utils_add_book_chapter', {
		bookid: existingBook.bookId,
		title: topicTitle,
		content: description,
		subchapter: 1,
		hidden: 0,
		pagenum: 0,
	});

	return result as MoodleChapterResponse;
}

export async function getBookChapter(
	bookId: number,
	chapterId: number
): Promise<BookChapter | null> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const bookDetails = (await moodlePost('local_activity_utils_get_book', {
		bookid: bookId,
	})) as CourseOutlineBook;

	return bookDetails.chapters.find((ch) => ch.id === chapterId) || null;
}
