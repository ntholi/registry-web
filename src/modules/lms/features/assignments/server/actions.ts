'use server';

import { auth } from '@/core/auth';
import type { AssessmentNumber } from '@/core/database';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import { createAssessment as createAcademicAssessment } from '@/modules/academic/features/assessments/server/actions';
import { studentRepository } from '@/modules/lms/features/students/server/repository';
import { getOrReuseSection } from '@/modules/lms/shared/utils';
import { getCurrentTerm } from '@/modules/registry/features/terms';
import type {
	CreateAssignmentParams,
	CreateRubricParams,
	FillRubricParams,
	FillRubricResult,
	MoodleAssignment,
	MoodleSubmission,
	Rubric,
	RubricCriterion,
	RubricGradeData,
	SubmissionUser,
} from '../types';

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
		throw new Error('Assignment number is required');
	}

	const sectionNumber = await getOrReuseSection({
		courseId: params.courseid,
		sectionName: 'Assignments',
		summary: 'Course assignments and submissions',
		matchFn: (name) =>
			name.toLowerCase() === 'assignments' ||
			name.toLowerCase() === 'assignment',
	});

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
		await createAcademicAssessment(
			{
				moduleId: params.moduleId,
				assessmentNumber: params.idnumber as AssessmentNumber,
				assessmentType: params.name,
				totalMarks: params.grademax,
				weight: params.weight,
				termId: term.id,
			},
			{
				lmsId: result.id,
				activityType: 'assignment',
			}
		);
	} catch (error) {
		await moodlePost('local_activity_utils_delete_assignment', {
			cmid: result.coursemoduleid,
		});
		throw error;
	}

	return result;
}

async function enrichUsersWithDBStudentInfo(
	users: Array<{
		id: number;
		fullname: string;
		profileimageurl: string;
	}>,
	submissionMap: Map<number, MoodleSubmission>
): Promise<Map<number, { stdNo: number; name: string }>> {
	const submittedUserIds = users
		.filter((user) => {
			const submission = submissionMap.get(user.id);
			return submission && submission.status === 'submitted';
		})
		.map((user) => user.id);

	if (submittedUserIds.length === 0) {
		return new Map();
	}

	const dbStudents =
		await studentRepository.findStudentsByLmsUserIdsForSubmissions(
			submittedUserIds
		);

	return new Map(
		dbStudents.map((s) => [s.lmsUserId!, { stdNo: s.stdNo, name: s.name }])
	);
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

	const dbStudentMap = await enrichUsersWithDBStudentInfo(
		enrolledUsers,
		submissionMap
	);

	return enrolledUsers.map((user) => ({
		id: user.id,
		fullname: user.fullname,
		profileimageurl: user.profileimageurl,
		submission: submissionMap.get(user.id) || null,
		dbStudent: dbStudentMap.get(user.id) || null,
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

export async function getRubricFillings(
	cmid: number,
	userId: number
): Promise<RubricGradeData | null> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	try {
		const result = await moodleGet('local_activity_utils_get_rubric_filling', {
			cmid,
			userid: userId,
		});

		if (!result?.success || !result?.fillings) {
			return null;
		}

		return result as RubricGradeData;
	} catch {
		return null;
	}
}

export async function fillRubric(
	params: FillRubricParams
): Promise<FillRubricResult> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const requestParams: Record<string, string | number> = {
		cmid: params.cmid,
		userid: params.userid,
	};

	if (params.overallremark) {
		requestParams.overallremark = params.overallremark;
	}

	params.fillings.forEach((filling, index) => {
		requestParams[`fillings[${index}][criterionid]`] = filling.criterionid;
		if (filling.levelid !== undefined) {
			requestParams[`fillings[${index}][levelid]`] = filling.levelid;
		}
		if (filling.score !== undefined) {
			requestParams[`fillings[${index}][score]`] = filling.score;
		}
		if (filling.remark) {
			requestParams[`fillings[${index}][remark]`] = filling.remark;
		}
	});

	const result = await moodlePost(
		'local_activity_utils_fill_rubric',
		requestParams
	);

	if (!result?.success) {
		throw new Error(result?.message || 'Failed to save rubric grade');
	}

	return result as FillRubricResult;
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

export async function copyRubric(sourceCmid: number, targetCmid: number) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const result = await moodlePost('local_activity_utils_copy_rubric', {
		sourcecmid: sourceCmid,
		targetcmid: targetCmid,
	});

	return result;
}

export async function deleteAssignment(cmid: number) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	await moodlePost('local_activity_utils_delete_assignment', {
		cmid,
	});
}
