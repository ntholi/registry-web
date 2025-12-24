'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type {
	FillRubricParams,
	FillRubricResult,
	RubricGradeData,
} from '../../../types';

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
