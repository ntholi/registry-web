'use server';

import { auth } from '@/core/auth';
import type { AssessmentNumber } from '@/core/database';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import { createAssessment as createAcademicAssessment } from '@/modules/academic/features/assessments/server/actions';
import { getCurrentTerm } from '@/modules/registry/features/terms';
import type {
	CreateAssignmentParams,
	CreateRubricParams,
	MoodleAssignment,
	MoodleSubmission,
	Rubric,
	RubricCriterion,
	SubmissionUser,
} from '../types';

type CourseSection = {
	id: number;
	name: string;
	section: number;
	summaryformat: number;
	summary: string;
	modules: Array<{
		id: number;
		name: string;
		modname: string;
	}>;
};

export async function getCourseAssignments(
	courseId: number
): Promise<MoodleAssignment[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('mod_assign_get_assignments', {
		'courseids[0]': courseId,
	});

	if (!result || !result.courses || result.courses.length === 0) {
		return [];
	}

	return result.courses[0].assignments as MoodleAssignment[];
}

export async function getAssignment(
	courseId: number,
	assignmentId: number
): Promise<MoodleAssignment | null> {
	const assignments = await getCourseAssignments(courseId);
	return assignments.find((a) => a.id === assignmentId) || null;
}

async function getCourseSections(courseId: number): Promise<CourseSection[]> {
	const result = await moodleGet('core_course_get_contents', {
		courseid: courseId,
	});

	return result as CourseSection[];
}

async function getOrCreateAssessmentsSection(
	courseId: number
): Promise<number> {
	const sections = await getCourseSections(courseId);

	const assessmentSection = sections.find(
		(section) =>
			section.name.toLowerCase() === 'assessments' ||
			section.name.toLowerCase() === 'assessment'
	);

	if (assessmentSection) {
		return assessmentSection.section;
	}

	try {
		const result = await moodlePost('local_activity_utils_create_section', {
			courseid: courseId,
			name: 'Assessments',
			summary: 'Course assessments and assignments',
		});

		if (result && result.sectionnum !== undefined) {
			return result.sectionnum;
		}

		const updatedSections = await getCourseSections(courseId);
		const newSection = updatedSections.find(
			(section) => section.name === 'Assessments'
		);
		return newSection?.section || 0;
	} catch (error) {
		console.error('Failed to create Assessments section:', error);
		throw new Error(
			'Unable to create Assessments section. Please ensure the local_activity_utils plugin is installed.'
		);
	}
}

async function fileToBase64(file: File): Promise<string> {
	const bytes = await file.arrayBuffer();
	const buffer = Buffer.from(bytes);
	return buffer.toString('base64');
}

export async function createAssignment(params: CreateAssignmentParams) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}
	const term = await getCurrentTerm();
	if (!term) {
		throw new Error('No active term found');
	}

	if (!params.name?.trim()) {
		throw new Error('Assignment name is required');
	}

	if (!params.duedate) {
		throw new Error('Due date is required');
	}

	if (!params.idnumber?.trim()) {
		throw new Error('Assessment number is required');
	}

	const sectionNumber = await getOrCreateAssessmentsSection(params.courseid);

	const requestParams: Record<string, string | number> = {
		courseid: params.courseid,
		name: params.name,
		duedate: params.duedate,
		allowsubmissionsfromdate: params.allowsubmissionsfromdate,
		section: sectionNumber,
		idnumber: params.idnumber,
		grademax: params.grademax,
	};

	if (params.intro) {
		requestParams.intro = params.intro;
	}

	if (params.activityinstructions) {
		requestParams.activity = params.activityinstructions;
	}

	if (params.attachments && params.attachments.length > 0) {
		const introfiles = await Promise.all(
			params.attachments.map(async (file) => ({
				filename: file.name,
				content: await fileToBase64(file),
				base64: true,
			}))
		);
		requestParams.introfiles = JSON.stringify(introfiles);
	}

	const result = await moodlePost(
		'local_activity_utils_create_assignment',
		requestParams
	);

	try {
		await createAcademicAssessment({
			moduleId: params.moduleId,
			assessmentNumber: params.idnumber as AssessmentNumber,
			assessmentType: params.name,
			totalMarks: params.grademax,
			weight: params.weight,
			termId: term.id,
		});
	} catch (error) {
		await moodlePost('local_activity_utils_delete_assignment', {
			cmid: result.coursemoduleid,
		});
		throw error;
	}

	return result;
}

export async function getAssignmentSubmissions(
	assignmentId: number,
	courseId: number
): Promise<SubmissionUser[]> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const [submissionsResult, enrolledUsersResult] = await Promise.all([
		moodleGet('mod_assign_get_submissions', {
			'assignmentids[0]': assignmentId,
		}),
		moodleGet(
			'core_enrol_get_enrolled_users',
			{
				courseid: courseId,
			},
			process.env.MOODLE_TOKEN
		),
	]);

	const enrolledUsers = (
		enrolledUsersResult as Array<{
			id: number;
			fullname: string;
			profileimageurl: string;
			roles: Array<{ shortname: string }>;
		}>
	).filter((user) => user.roles.some((role) => role.shortname === 'student'));

	const submissions: MoodleSubmission[] =
		submissionsResult?.assignments?.[0]?.submissions || [];

	const submissionMap = new Map<number, MoodleSubmission>();
	for (const submission of submissions) {
		submissionMap.set(submission.userid, submission);
	}

	return enrolledUsers.map((user) => ({
		id: user.id,
		fullname: user.fullname,
		profileimageurl: user.profileimageurl,
		submission: submissionMap.get(user.id) || null,
	}));
}

export async function saveAssignmentGrade(
	assignmentId: number,
	userId: number,
	grade: number
): Promise<void> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	await moodlePost('mod_assign_save_grade', {
		assignmentid: assignmentId,
		userid: userId,
		grade,
		attemptnumber: -1,
		addattempt: 0,
		workflowstate: '',
		applytoall: 0,
	});
}

export async function getAssignmentGrades(
	assignmentId: number
): Promise<Map<number, number>> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('mod_assign_get_grades', {
		'assignmentids[0]': assignmentId,
	});

	const gradeMap = new Map<number, number>();
	const grades = result?.assignments?.[0]?.grades || [];
	for (const gradeEntry of grades) {
		if (gradeEntry.grade !== null && gradeEntry.grade !== '-') {
			gradeMap.set(gradeEntry.userid, Number(gradeEntry.grade));
		}
	}

	return gradeMap;
}

export async function getRubric(cmid: number): Promise<Rubric | null> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	try {
		const result = await moodleGet('local_activity_utils_get_rubric', {
			cmid,
		});

		if (!result?.success) {
			return null;
		}

		return result as Rubric;
	} catch {
		return null;
	}
}

function buildCriteriaParams(
	criteria: RubricCriterion[]
): Record<string, string | number> {
	const params: Record<string, string | number> = {};

	criteria.forEach((criterion, criterionIndex) => {
		params[`criteria[${criterionIndex}][description]`] = criterion.description;
		if (criterion.id) {
			params[`criteria[${criterionIndex}][id]`] = criterion.id;
		}
		if (criterion.sortorder !== undefined) {
			params[`criteria[${criterionIndex}][sortorder]`] = criterion.sortorder;
		}

		criterion.levels.forEach((level, levelIndex) => {
			params[`criteria[${criterionIndex}][levels][${levelIndex}][score]`] =
				level.score;
			params[`criteria[${criterionIndex}][levels][${levelIndex}][definition]`] =
				level.definition;
			if (level.id) {
				params[`criteria[${criterionIndex}][levels][${levelIndex}][id]`] =
					level.id;
			}
		});
	});

	return params;
}

export async function createRubric(params: CreateRubricParams) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const requestParams: Record<string, string | number> = {
		cmid: params.cmid,
		name: params.name,
	};

	if (params.description) {
		requestParams.description = params.description;
	}

	const criteriaParams = buildCriteriaParams(params.criteria);
	Object.assign(requestParams, criteriaParams);

	const result = await moodlePost(
		'local_activity_utils_create_rubric',
		requestParams
	);

	return result;
}

export async function updateRubric(
	cmid: number,
	params: Partial<CreateRubricParams>
) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const requestParams: Record<string, string | number> = { cmid };

	if (params.name) {
		requestParams.name = params.name;
	}

	if (params.description) {
		requestParams.description = params.description;
	}

	if (params.criteria) {
		const criteriaParams = buildCriteriaParams(params.criteria);
		Object.assign(requestParams, criteriaParams);
	}

	const result = await moodlePost(
		'local_activity_utils_update_rubric',
		requestParams
	);

	return result;
}

export async function deleteRubric(cmid: number) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const result = await moodlePost('local_activity_utils_delete_rubric', {
		cmid,
	});

	return result;
}
