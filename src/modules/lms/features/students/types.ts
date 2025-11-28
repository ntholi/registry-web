export type MoodleEnrolledUser = {
	id: number;
	username: string;
	firstname: string;
	lastname: string;
	fullname: string;
	email: string;
	department: string;
	firstaccess: number;
	lastaccess: number;
	lastcourseaccess: number;
	description: string;
	descriptionformat: number;
	profileimageurlsmall: string;
	profileimageurl: string;
	roles: Array<{
		roleid: number;
		name: string;
		shortname: string;
		sortorder: number;
	}>;
	enrolledcourses?: Array<{
		id: number;
		fullname: string;
		shortname: string;
	}>;
};

export type StudentSearchResult = {
	stdNo: number;
	name: string;
	programName: string;
	semesterNumber: string;
	userId: string | null;
	lmsUserId: number | null;
};
