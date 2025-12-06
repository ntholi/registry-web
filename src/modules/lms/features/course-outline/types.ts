export type CourseOutlineBook = {
	id: number;
	coursemoduleid: number;
	courseid: number;
	name: string;
	intro: string;
	introformat: number;
	numbering: number;
	navstyle: number;
	customtitles: number;
	revision: number;
	timecreated: number;
	timemodified: number;
	chapters: BookChapter[];
	success: boolean;
	message: string;
};

export type BookChapter = {
	id: number;
	pagenum: number;
	subchapter: 0 | 1;
	title: string;
	content: string;
	contentformat: number;
	hidden: number;
	timecreated: number;
	timemodified: number;
	importsrc: string;
	tags: string[];
};

export type CourseSection = {
	id: number;
	pagenum: number;
	title: string;
	content: string;
};

export type CourseTopic = {
	id: number;
	pagenum: number;
	weekNumber: number;
	title: string;
	description: string;
};

export type CreateSectionParams = {
	courseId: number;
	title: string;
	content: string;
	sectionNumber: number;
};

export type CreateTopicParams = {
	courseId: number;
	weekNumber: number;
	title: string;
	description: string;
};

export type MoodleBookResponse = {
	id: number;
	coursemoduleid: number;
	name: string;
	chaptercount: number;
	chapters: Array<{
		id: number;
		pagenum: number;
		title: string;
		subchapter: 0 | 1;
	}>;
	success: boolean;
	message: string;
};

export type MoodleChapterResponse = {
	id: number;
	bookid: number;
	pagenum: number;
	title: string;
	subchapter: 0 | 1;
	success: boolean;
	message: string;
};
