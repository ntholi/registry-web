export type TextFormat = 0 | 1 | 2 | 4;

export type BooleanNumber = 0 | 1;

export type BookNumbering = 0 | 1 | 2 | 3;

export type BookNavStyle = 0 | 1 | 2;

export type CourseOutlineBook = {
	id: number;
	coursemoduleid: number;
	courseid: number;
	name: string;
	intro: string;
	introformat: TextFormat;
	numbering: BookNumbering;
	navstyle: BookNavStyle;
	customtitles: BooleanNumber;
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
	subchapter: BooleanNumber;
	title: string;
	content: string;
	contentformat: TextFormat;
	hidden: BooleanNumber;
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
		subchapter: BooleanNumber;
	}>;
	success: boolean;
	message: string;
};

export type MoodleChapterResponse = {
	id: number;
	bookid: number;
	pagenum: number;
	title: string;
	subchapter: BooleanNumber;
	success: boolean;
	message: string;
};
