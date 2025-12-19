export type TextFormat = 0 | 1 | 2 | 4;

export type BooleanNumber = 0 | 1;

export type BigBlueButtonType = 0 | 1 | 2 | 3;

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

export type BigBlueButtonSession = {
	id: number;
	coursemoduleid: number;
	meetingid: string;
	name: string;
	intro?: string;
	type?: BigBlueButtonType;
	welcome?: string;
	voicebridge?: number;
	wait?: BooleanNumber;
	userlimit?: number;
	record?: BooleanNumber;
	muteonstart?: BooleanNumber;
	openingtime?: number;
	closingtime?: number;
};

export type CreateBigBlueButtonParams = {
	courseid: number;
	name: string;
	intro?: string;
	type?: BigBlueButtonType;
	welcome?: string;
	wait?: BooleanNumber;
	userlimit?: number;
	record?: BooleanNumber;
	muteonstart?: BooleanNumber;
	openingtime?: number;
	closingtime?: number;
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
	}>;
};
