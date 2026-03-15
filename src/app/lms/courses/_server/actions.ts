'use server';

import { linkCourseToAssignment } from '@academic/assigned-modules';
import { getLmsCredentials } from '@auth/auth-providers/_server/repository';
import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import type { MoodleCourse } from '../types';

export const getUserCourses = createAction(async () => {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const creds = await getLmsCredentials(session.user.id);
	const lmsUserId = creds?.lmsUserId;
	if (!lmsUserId) {
		return [];
	}

	const result = await moodleGet(
		'core_enrol_get_users_courses',
		{
			userid: lmsUserId,
		},
		creds?.lmsToken ?? undefined
	);

	return result as MoodleCourse[];
});

export type CreateMoodleCourseParams = {
	fullname: string;
	shortname: string;
	categoryid: number;
	semesterModuleId: number;
};

export const createMoodleCourse = createAction(
	async (params: CreateMoodleCourseParams) => {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error('Unauthorized');
		}
		const creds = await getLmsCredentials(session.user.id);
		if (!creds?.lmsUserId) {
			throw new Error('Moodle account is not linked');
		}

		const { fullname, shortname, categoryid, semesterModuleId } = params;

		let courseId: string;

		const existingCourse = await moodleGet(
			'core_course_get_courses_by_field',
			{
				field: 'shortname',
				value: shortname,
			},
			creds?.lmsToken ?? undefined
		);

		if (
			existingCourse &&
			Array.isArray(existingCourse.courses) &&
			existingCourse.courses.length > 0
		) {
			courseId = String(existingCourse.courses[0].id);
		} else {
			const result = await moodlePost(
				'core_course_create_courses',
				{
					'courses[0][fullname]': fullname,
					'courses[0][shortname]': shortname,
					'courses[0][categoryid]': categoryid,
				},
				process.env.MOODLE_TOKEN
			);

			if (!result || !Array.isArray(result) || result.length === 0) {
				throw new Error('Failed to create course in Moodle');
			}

			courseId = String(result[0].id);
		}

		await moodlePost(
			'enrol_manual_enrol_users',
			{
				'enrolments[0][roleid]': 3,
				'enrolments[0][userid]': creds.lmsUserId,
				'enrolments[0][courseid]': Number(courseId),
			},
			process.env.MOODLE_TOKEN
		);

		unwrap(
			await linkCourseToAssignment(session.user.id, semesterModuleId, courseId)
		);

		return { courseId, shortname };
	}
);

export const getMoodleCategories = createAction(async () => {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}
	const creds = await getLmsCredentials(session.user.id);

	const result = await moodleGet(
		'core_course_get_categories',
		{},
		creds?.lmsToken ?? undefined
	);

	return result as Array<{
		id: number;
		name: string;
		idnumber: string;
		parent: number;
	}>;
});
