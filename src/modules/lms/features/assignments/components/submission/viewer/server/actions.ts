'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';

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
