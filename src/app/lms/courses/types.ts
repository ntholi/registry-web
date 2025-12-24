export type TextFormat = 0 | 1 | 2 | 4;

export type BooleanNumber = 0 | 1;

export type CourseFormat =
	| 'weeks'
	| 'topics'
	| 'social'
	| 'singleactivity'
	| 'tiles'
	| 'grid'
	| 'onetopic';

export type GroupMode = 0 | 1 | 2;

export type MoodleCourse = {
	id: number;
	shortname: string;
	fullname: string;
	displayname?: string;
	enrolledusercount?: number;
	idnumber: string;
	visible: BooleanNumber;
	summary?: string;
	summaryformat?: TextFormat;
	format?: CourseFormat;
	courseimage?: string;
	showgrades?: BooleanNumber;
	lang: string;
	enablecompletion?: BooleanNumber;
	completionhascriteria?: BooleanNumber;
	completionusertracked?: BooleanNumber;
	category?: number;
	progress?: number | null;
	completed?: BooleanNumber | null;
	startdate?: number;
	enddate?: number;
	marker?: number;
	lastaccess: number | null;
	isfavourite?: BooleanNumber;
	hidden?: BooleanNumber;
	overviewfiles: Array<{
		filename: string;
		filepath: string;
		filesize: number;
		fileurl: string;
		timemodified: number;
		mimetype: string;
		isexternalfile?: BooleanNumber;
		repositorytype?: string;
		icon?: string;
	}>;
	showactivitydates?: BooleanNumber;
	showcompletionconditions?: BooleanNumber;
	timemodified?: number;
};
