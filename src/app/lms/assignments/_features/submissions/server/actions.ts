'use server';

import { findStudentsByLmsUserIdsForSubmissions } from '@lms/students';
import { auth } from '@/core/auth';
import { moodleGet } from '@/core/integrations/moodle';
import type { MoodleSubmission, SubmissionUser } from '../../../types';

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
		await findStudentsByLmsUserIdsForSubmissions(submittedUserIds);

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
