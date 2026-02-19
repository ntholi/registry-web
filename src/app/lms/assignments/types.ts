export type TextFormat = 0 | 1 | 2 | 4;

export type BooleanNumber = 0 | 1;

export type AttemptReopenMethod = 'none' | 'manual' | 'untilpass';

export type SubmissionPluginType =
	| 'onlinetext'
	| 'file'
	| 'comments'
	| 'locallib';

export type SubmissionPluginSubtype = 'assignsubmission' | 'assignfeedback';

export type SubmissionStatus = 'new' | 'draft' | 'submitted' | 'reopened';

export type GradingMethod = 'simple' | 'rubric' | 'guide';

export type AssignmentFile = {
	filename: string;
	filepath: string;
	filesize: number;
	fileurl: string;
	timemodified: number;
	mimetype: string;
};

export type MoodleAssignment = {
	id: number;
	course: number;
	name: string;
	intro: string;
	introformat: TextFormat;
	alwaysshowdescription: BooleanNumber;
	submissiondrafts: BooleanNumber;
	sendnotifications: BooleanNumber;
	sendlatenotifications: BooleanNumber;
	sendstudentnotifications: BooleanNumber;
	duedate: number;
	allowsubmissionsfromdate: number;
	grade: number;
	timemodified: number;
	completionsubmit: BooleanNumber;
	cutoffdate: number;
	teamsubmission: BooleanNumber;
	requireallteammemberssubmit: BooleanNumber;
	teamsubmissiongroupingid: number;
	blindmarking: BooleanNumber;
	hidegrader: BooleanNumber;
	revealidentities: BooleanNumber;
	attemptreopenmethod: AttemptReopenMethod;
	maxattempts: number;
	markingworkflow: BooleanNumber;
	markingallocation: BooleanNumber;
	requiresubmissionstatement: BooleanNumber;
	preventsubmissionnotingroup: BooleanNumber;
	configs?: Array<{
		plugin: string;
		subtype: SubmissionPluginSubtype;
		name: string;
		value: string;
	}>;
	introattachments?: AssignmentFile[];
	introfiles?: AssignmentFile[];
	cmid?: number;
	visible?: number;
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
	type: SubmissionPluginType;
	name: string;
	fileareas?: Array<{
		area: string;
		files: SubmissionFile[];
	}>;
	editorfields?: Array<{
		name: string;
		description: string;
		text: string;
		format: TextFormat;
	}>;
};

export type MoodleSubmission = {
	id: number;
	userid: number;
	attemptnumber: number;
	timecreated: number;
	timemodified: number;
	status: SubmissionStatus;
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
	sortlevelsasc?: BooleanNumber;
	lockzeropoints?: BooleanNumber;
	showdescriptionstudent?: BooleanNumber;
	showdescriptionteacher?: BooleanNumber;
	showscoreteacher?: BooleanNumber;
	showscorestudent?: BooleanNumber;
	enableremarks?: BooleanNumber;
	showremarksstudent?: BooleanNumber;
	alwaysshowdefinition?: BooleanNumber;
};

export type RubricStatus = 0 | 10 | 20;

export type Rubric = {
	definitionid: number;
	name: string;
	description: string;
	status: RubricStatus;
	criteria: RubricCriterion[];
	options: RubricOptions;
	maxscore: number;
	gradingmethod: GradingMethod;
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

export type FillRubricFilling = {
	criterionid: number;
	levelid?: number;
	score?: number;
	remark?: string;
};

export type FillRubricParams = {
	cmid: number;
	userid: number;
	fillings: FillRubricFilling[];
	overallremark?: string;
};

export type FillRubricResult = {
	instanceid: number;
	grade: number;
	success: boolean;
	message: string;
};
