export type MoodleAssignment = {
	id: number;
	course: number;
	name: string;
	intro: string;
	introformat: number;
	alwaysshowdescription: number;
	submissiondrafts: number;
	sendnotifications: number;
	sendlatenotifications: number;
	sendstudentnotifications: number;
	duedate: number;
	allowsubmissionsfromdate: number;
	grade: number;
	timemodified: number;
	completionsubmit: number;
	cutoffdate: number;
	teamsubmission: number;
	requireallteammemberssubmit: number;
	teamsubmissiongroupingid: number;
	blindmarking: number;
	hidegrader: number;
	revealidentities: number;
	attemptreopenmethod: string;
	maxattempts: number;
	markingworkflow: number;
	markingallocation: number;
	requiresubmissionstatement: number;
	preventsubmissionnotingroup: number;
	configs?: Array<{
		plugin: string;
		subtype: string;
		name: string;
		value: string;
	}>;
	cmid?: number;
};

export type CreateAssignmentParams = {
	courseid: number;
	name: string;
	intro?: string;
	allowsubmissionsfromdate: number;
	duedate: number;
	activityinstructions?: string;
	attachments?: File[];
	idnumber: string;
	grademax: number;
	moduleId: number;
	weight: number;
};

export type SubmissionFile = {
	filename: string;
	filepath: string;
	filesize: number;
	fileurl: string;
	timemodified: number;
	mimetype: string;
};

export type SubmissionPlugin = {
	type: string;
	name: string;
	fileareas?: Array<{
		area: string;
		files: SubmissionFile[];
	}>;
	editorfields?: Array<{
		name: string;
		description: string;
		text: string;
		format: number;
	}>;
};

export type MoodleSubmission = {
	id: number;
	userid: number;
	attemptnumber: number;
	timecreated: number;
	timemodified: number;
	status: 'new' | 'draft' | 'submitted';
	groupid: number;
	plugins: SubmissionPlugin[];
};

export type DBStudentInfo = {
	stdNo: number;
	name: string;
};

export type SubmissionUser = {
	id: number;
	fullname: string;
	profileimageurl: string;
	submission: MoodleSubmission | null;
	dbStudent: DBStudentInfo | null;
};

export type RubricLevel = {
	id?: number;
	score: number;
	definition: string;
};

export type RubricCriterion = {
	id?: number;
	description: string;
	sortorder?: number;
	levels: RubricLevel[];
};

export type RubricOptions = {
	sortlevelsasc?: number;
	lockzeropoints?: number;
	showdescriptionstudent?: number;
	showdescriptionteacher?: number;
	showscoreteacher?: number;
	showscorestudent?: number;
	enableremarks?: number;
	showremarksstudent?: number;
	alwaysshowdefinition?: number;
};

export type Rubric = {
	definitionid: number;
	name: string;
	description: string;
	status: number;
	criteria: RubricCriterion[];
	options: RubricOptions;
	maxscore: number;
	gradingmethod: 'simple' | 'fivedays' | string;
	success: boolean;
	message: string;
};

export type CreateRubricParams = {
	cmid: number;
	name: string;
	description?: string;
	criteria: RubricCriterion[];
	options?: RubricOptions;
};

export type CopyRubricResult = {
	definitionid: number;
	success: boolean;
	message: string;
};

export type RubricFilling = {
	criterionid: number;
	criteriondescription?: string;
	levelid: number;
	level?: {
		id: number;
		score: number;
		definition: string;
	};
	customscore?: number;
	remark?: string;
};

export type RubricGradeData = {
	instanceid?: number;
	grade: number;
	grader?: string;
	graderid?: number;
	timecreated?: number;
	timemodified?: number;
	fillings: RubricFilling[];
	success: boolean;
	message?: string;
};
