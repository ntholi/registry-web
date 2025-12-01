'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type {
	AddChapterResponse,
	BookInfo,
	CourseSection,
	CourseTopic,
	CreateBookResponse,
	SectionFormData,
	TopicFormData,
} from '../types';

const COURSE_OUTLINE_SECTION_NAME = 'Course Outline';
const COURSE_OUTLINE_BOOK_NAME = 'Course Outline';
const TOPICS_CHAPTER_TITLE = 'Topics';

type MoodleCourseSection = {
	id: number;
	name: string;
	section: number;
	modules?: Array<{
		id: number;
		instance: number;
		name: string;
		modname: string;
	}>;
};

type MoodleBook = {
	id: number;
	coursemodule: number;
	course: number;
	name: string;
	intro: string;
	introformat: number;
	numbering: number;
	navstyle: number;
	customtitles: number;
	revision: number;
	timecreated: number;
	timemodified: number;
	section: number;
};

type MoodleBookChapter = {
	id: number;
	bookid: number;
	pagenum: number;
	subchapter: string;
	title: string;
	content: string;
	contentformat: number;
	hidden: string;
	timecreated: number;
	timemodified: number;
};

async function getCourseSections(
	courseId: number
): Promise<MoodleCourseSection[]> {
	const result = await moodleGet('core_course_get_contents', {
		courseid: courseId,
	});
	return result as MoodleCourseSection[];
}

async function findCourseOutlineSection(
	courseId: number
): Promise<MoodleCourseSection | null> {
	const sections = await getCourseSections(courseId);
	return (
		sections.find(
			(s) => s.name.toLowerCase() === COURSE_OUTLINE_SECTION_NAME.toLowerCase()
		) || null
	);
}

async function createCourseOutlineSection(courseId: number): Promise<number> {
	const result = await moodlePost('local_activity_utils_create_section', {
		courseid: courseId,
		name: COURSE_OUTLINE_SECTION_NAME,
		summary: '<p>Course outline and structure</p>',
	});

	if (result && result.sectionnum !== undefined) {
		return result.sectionnum;
	}

	throw new Error('Failed to create Course Outline section');
}

async function findCourseOutlineBook(
	courseId: number
): Promise<BookInfo | null> {
	const result = await moodleGet('mod_book_get_books_by_courses', {
		'courseids[0]': courseId,
	});

	if (!result || !result.books || result.books.length === 0) {
		return null;
	}

	const books = result.books as MoodleBook[];
	const outlineBook = books.find(
		(b) => b.name.toLowerCase() === COURSE_OUTLINE_BOOK_NAME.toLowerCase()
	);

	if (!outlineBook) {
		return null;
	}

	return {
		id: outlineBook.id,
		coursemoduleid: outlineBook.coursemodule,
		name: outlineBook.name,
		sectionId: outlineBook.section,
		sectionNum: outlineBook.section,
	};
}

async function createCourseOutlineBook(
	courseId: number,
	sectionNum: number
): Promise<BookInfo> {
	const result = (await moodlePost('local_activity_utils_create_book', {
		courseid: courseId,
		name: COURSE_OUTLINE_BOOK_NAME,
		intro: '<p>Course outline containing sections and topics</p>',
		section: sectionNum,
		numbering: 1,
		navstyle: 1,
		'chapters[0][title]': TOPICS_CHAPTER_TITLE,
		'chapters[0][content]': '<p>Weekly topics for this course</p>',
		'chapters[0][subchapter]': 0,
	})) as CreateBookResponse;

	if (!result || !result.success) {
		throw new Error('Failed to create Course Outline book');
	}

	return {
		id: result.id,
		coursemoduleid: result.coursemoduleid,
		name: result.name,
		sectionId: sectionNum,
		sectionNum: sectionNum,
	};
}

export async function getOrCreateCourseOutlineBook(
	courseId: number
): Promise<BookInfo> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	let bookInfo = await findCourseOutlineBook(courseId);
	if (bookInfo) {
		return bookInfo;
	}

	const outlineSection = await findCourseOutlineSection(courseId);
	let sectionNum: number;

	if (outlineSection) {
		sectionNum = outlineSection.section;
	} else {
		sectionNum = await createCourseOutlineSection(courseId);
	}

	bookInfo = await createCourseOutlineBook(courseId, sectionNum);
	return bookInfo;
}

export async function getBookChapters(
	courseId: number
): Promise<MoodleBookChapter[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const bookInfo = await findCourseOutlineBook(courseId);
	if (!bookInfo) {
		return [];
	}

	const result = await moodleGet('mod_book_get_books_by_courses', {
		'courseids[0]': courseId,
	});

	if (!result || !result.books) {
		return [];
	}

	const book = result.books.find(
		(b: MoodleBook) =>
			b.name.toLowerCase() === COURSE_OUTLINE_BOOK_NAME.toLowerCase()
	);

	if (!book) {
		return [];
	}

	await moodleGet('mod_book_view_book', {
		bookid: book.id,
	});

	const contentResult = await moodleGet('core_course_get_contents', {
		courseid: courseId,
		'options[0][name]': 'modid',
		'options[0][value]': book.coursemodule,
	});

	if (!contentResult || !Array.isArray(contentResult)) {
		return [];
	}

	for (const section of contentResult) {
		if (section.modules) {
			for (const mod of section.modules) {
				if (mod.instance === book.id && mod.modname === 'book') {
					if (mod.contents) {
						return mod.contents
							.filter((c: { type: string }) => c.type === 'content')
							.map(
								(c: {
									content: string;
									filename: string;
									timemodified: number;
								}) => ({
									id: 0,
									bookid: book.id,
									pagenum: 0,
									subchapter: '0',
									title: c.filename || '',
									content: c.content || '',
									contentformat: 1,
									hidden: '0',
									timecreated: c.timemodified,
									timemodified: c.timemodified,
								})
							);
					}
				}
			}
		}
	}

	return [];
}

export async function getCourseSectionsData(
	courseId: number
): Promise<CourseSection[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const bookInfo = await findCourseOutlineBook(courseId);
	if (!bookInfo) {
		return [];
	}

	const result = await moodleGet('mod_book_get_books_by_courses', {
		'courseids[0]': courseId,
	});

	if (!result || !result.books) {
		return [];
	}

	const book = result.books.find(
		(b: MoodleBook) =>
			b.name.toLowerCase() === COURSE_OUTLINE_BOOK_NAME.toLowerCase()
	);

	if (!book) {
		return [];
	}

	await moodleGet('mod_book_view_book', {
		bookid: book.id,
	});

	const contentResult = await moodleGet('core_course_get_contents', {
		courseid: courseId,
	});

	if (!contentResult || !Array.isArray(contentResult)) {
		return [];
	}

	for (const section of contentResult) {
		if (section.modules) {
			for (const mod of section.modules) {
				if (mod.instance === book.id && mod.modname === 'book') {
					if (mod.contentsinfo?.chapters) {
						const chapters = mod.contentsinfo.chapters as MoodleBookChapter[];
						return chapters
							.filter(
								(ch) =>
									ch.subchapter === '0' &&
									ch.title.toLowerCase() !== TOPICS_CHAPTER_TITLE.toLowerCase()
							)
							.map((ch) => ({
								id: ch.id,
								pagenum: ch.pagenum,
								title: ch.title,
								content: ch.content || '',
							}));
					}
				}
			}
		}
	}

	return [];
}

export async function getCourseTopicsData(
	courseId: number
): Promise<CourseTopic[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const bookInfo = await findCourseOutlineBook(courseId);
	if (!bookInfo) {
		return [];
	}

	const result = await moodleGet('mod_book_get_books_by_courses', {
		'courseids[0]': courseId,
	});

	if (!result || !result.books) {
		return [];
	}

	const book = result.books.find(
		(b: MoodleBook) =>
			b.name.toLowerCase() === COURSE_OUTLINE_BOOK_NAME.toLowerCase()
	);

	if (!book) {
		return [];
	}

	await moodleGet('mod_book_view_book', {
		bookid: book.id,
	});

	const contentResult = await moodleGet('core_course_get_contents', {
		courseid: courseId,
	});

	if (!contentResult || !Array.isArray(contentResult)) {
		return [];
	}

	for (const section of contentResult) {
		if (section.modules) {
			for (const mod of section.modules) {
				if (mod.instance === book.id && mod.modname === 'book') {
					if (mod.contentsinfo?.chapters) {
						const chapters = mod.contentsinfo.chapters as MoodleBookChapter[];

						const topicsChapterIndex = chapters.findIndex(
							(ch) =>
								ch.title.toLowerCase() === TOPICS_CHAPTER_TITLE.toLowerCase() &&
								ch.subchapter === '0'
						);

						if (topicsChapterIndex === -1) {
							return [];
						}

						const topics: CourseTopic[] = [];
						let weekNumber = 1;

						for (let i = topicsChapterIndex + 1; i < chapters.length; i++) {
							const ch = chapters[i];
							if (ch.subchapter === '0') {
								break;
							}
							topics.push({
								id: ch.id,
								pagenum: ch.pagenum,
								weekNumber: weekNumber++,
								title: ch.title,
								description: ch.content || '',
							});
						}

						return topics;
					}
				}
			}
		}
	}

	return [];
}

export async function addCourseSection(
	courseId: number,
	data: SectionFormData
): Promise<AddChapterResponse> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const bookInfo = await getOrCreateCourseOutlineBook(courseId);

	const result = (await moodlePost('local_activity_utils_add_book_chapter', {
		bookid: bookInfo.id,
		title: data.title,
		content: data.content,
		subchapter: 0,
		pagenum: data.pagenum > 0 ? data.pagenum : 0,
	})) as AddChapterResponse;

	if (!result || !result.success) {
		throw new Error('Failed to add course section');
	}

	return result;
}

export async function addCourseTopic(
	courseId: number,
	data: TopicFormData
): Promise<AddChapterResponse> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const bookInfo = await getOrCreateCourseOutlineBook(courseId);

	const result = (await moodlePost('local_activity_utils_add_book_chapter', {
		bookid: bookInfo.id,
		title: `Week ${data.weekNumber}: ${data.title}`,
		content: data.description,
		subchapter: 1,
		pagenum: 0,
	})) as AddChapterResponse;

	if (!result || !result.success) {
		throw new Error('Failed to add course topic');
	}

	return result;
}

export async function initializeCourseOutline(courseId: number): Promise<{
	bookInfo: BookInfo;
	sections: CourseSection[];
	topics: CourseTopic[];
}> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const bookInfo = await getOrCreateCourseOutlineBook(courseId);
	const sections = await getCourseSectionsData(courseId);
	const topics = await getCourseTopicsData(courseId);

	return { bookInfo, sections, topics };
}
