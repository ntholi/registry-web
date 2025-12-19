export type TextFormat = 0 | 1 | 2 | 4;

export type BooleanNumber = 0 | 1;

export type GroupMode = 0 | 1 | 2;

export type PageDisplay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ModuleName =
	| 'assign'
	| 'bigbluebuttonbn'
	| 'book'
	| 'chat'
	| 'choice'
	| 'data'
	| 'feedback'
	| 'folder'
	| 'forum'
	| 'glossary'
	| 'h5pactivity'
	| 'imscp'
	| 'label'
	| 'lesson'
	| 'lti'
	| 'page'
	| 'quiz'
	| 'resource'
	| 'scorm'
	| 'survey'
	| 'url'
	| 'wiki'
	| 'workshop';

export type ContentType = 'file' | 'content' | 'url';

export type MoodlePage = {
	id: number;
	coursemodule: number;
	course: number;
	name: string;
	intro: string;
	introformat: TextFormat;
	content: string;
	contentformat: TextFormat;
	legacyfiles: BooleanNumber;
	legacyfileslast: number;
	display: PageDisplay;
	displayoptions: string;
	revision: number;
	timemodified: number;
	section?: number;
	visible?: BooleanNumber;
	groupmode?: GroupMode;
	groupingid?: number;
};

export type MoodleSection = {
	id: number;
	name: string;
	visible: BooleanNumber;
	summary: string;
	summaryformat: TextFormat;
	section: number;
	hiddenbynumsections: BooleanNumber;
	uservisible: boolean;
	modules?: Array<{
		id: number;
		url: string;
		name: string;
		instance: number;
		contextid: number;
		visible: BooleanNumber;
		uservisible: boolean;
		visibleoncoursepage: BooleanNumber;
		modicon: string;
		modname: ModuleName;
		modplural: string;
		indent: number;
		contents?: Array<{
			type: ContentType;
			filename: string;
			fileurl: string;
		}>;
	}>;
};

export type MaterialType = 'file' | 'page' | 'url';

export type CreatePageParams = {
	courseid: number;
	name: string;
	content: string;
};

export type CreateFileParams = {
	courseid: number;
	name: string;
	filename: string;
	filecontent: string;
};

export type CreateUrlParams = {
	courseid: number;
	name: string;
	externalurl: string;
	intro?: string;
};
