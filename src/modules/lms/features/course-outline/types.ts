export type BookChapter = {
	id: number;
	bookid: number;
	pagenum: number;
	subchapter: number;
	title: string;
	content: string;
	contentformat: number;
	hidden: number;
	timecreated: number;
	timemodified: number;
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

export type BookInfo = {
	id: number;
	coursemoduleid: number;
	name: string;
	sectionId: number;
	sectionNum: number;
};

export type CreateBookResponse = {
	id: number;
	coursemoduleid: number;
	name: string;
	chaptercount: number;
	chapters: Array<{
		id: number;
		pagenum: number;
		title: string;
		subchapter: number;
	}>;
	success: boolean;
	message: string;
};

export type AddChapterResponse = {
	id: number;
	bookid: number;
	pagenum: number;
	title: string;
	subchapter: number;
	success: boolean;
	message: string;
};

export type SectionFormData = {
	title: string;
	content: string;
	pagenum: number;
};

export type TopicFormData = {
	weekNumber: number;
	title: string;
	description: string;
};
