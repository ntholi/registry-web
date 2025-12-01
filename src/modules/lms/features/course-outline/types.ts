export type CourseSection = {
	id: number;
	coursemoduleId: number;
	name: string;
	content: string;
};

export type CourseTopic = {
	id: number;
	coursemoduleId: number;
	weekNumber: number;
	name: string;
	description: string;
};

export type CreateSectionParams = {
	courseId: number;
	name: string;
	content: string;
};

export type CreateTopicParams = {
	courseId: number;
	weekNumber: number;
	name: string;
	description: string;
};

export type MoodlePageResponse = {
	id: number;
	coursemoduleid: number;
	name: string;
	success: boolean;
	message: string;
};

export type MoodleSectionResponse = {
	id: number;
	sectionnum: number;
	name: string;
	success: boolean;
	message: string;
};

export type MoodleSubsectionResponse = {
	id: number;
	sectionnum: number;
	coursemoduleid: number;
	parentsection: number;
	name: string;
	success: boolean;
	message: string;
};
