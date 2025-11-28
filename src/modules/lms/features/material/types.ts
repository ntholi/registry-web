export type MoodlePage = {
	id: number;
	coursemodule: number;
	course: number;
	name: string;
	intro: string;
	introformat: number;
	content: string;
	contentformat: number;
	legacyfiles: number;
	legacyfileslast: number;
	display: number;
	displayoptions: string;
	revision: number;
	timemodified: number;
	section?: number;
	visible?: number;
	groupmode?: number;
	groupingid?: number;
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

export type CreatePageParams = {
	courseid: number;
	name: string;
	content: string;
};
