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
	intro: string;
	allowsubmissionsfromdate: number;
	duedate: number;
	activityinstructions?: string;
	attachments?: File[];
};
