export type BigBlueButtonSession = {
	id: number;
	coursemoduleid: number;
	meetingid: string;
	name: string;
	intro?: string;
	type?: number;
	welcome?: string;
	voicebridge?: number;
	wait?: number;
	userlimit?: number;
	record?: number;
	muteonstart?: number;
	openingtime?: number;
	closingtime?: number;
};

export type CreateBigBlueButtonParams = {
	courseid: number;
	name: string;
	intro?: string;
	type?: number;
	welcome?: string;
	wait?: number;
	userlimit?: number;
	record?: number;
	muteonstart?: number;
	openingtime?: number;
	closingtime?: number;
};

export type MoodleSection = {
	id: number;
	name: string;
	visible: number;
	summary: string;
	summaryformat: number;
	section: number;
	hiddenbynumsections: number;
	uservisible: boolean;
	modules?: Array<{
		id: number;
		url: string;
		name: string;
		instance: number;
		contextid: number;
		visible: number;
		uservisible: boolean;
		visibleoncoursepage: number;
		modicon: string;
		modname: string;
		modplural: string;
		indent: number;
	}>;
};
