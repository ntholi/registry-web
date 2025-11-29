'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import { assignedModulesRepository } from '@/modules/academic/features/assigned-modules/server/repository';
import type { MoodleCourse } from '../types';

export async function getUserCourses(): Promise<MoodleCourse[]> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const lmsUserId = session.user.lmsUserId;
	if (!lmsUserId) {
		return [];
	}

	const result = await moodleGet('core_enrol_get_users_courses', {
		userid: lmsUserId,
	});

	return result as MoodleCourse[];
}

export type CreateMoodleCourseParams = {
	fullname: string;
	shortname: string;
	categoryid: number;
	semesterModuleId: number;
};

export async function createMoodleCourse(params: CreateMoodleCourseParams) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const { fullname, shortname, categoryid, semesterModuleId } = params;

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

	const courseId = String(result[0].id);

	await moodlePost(
		'enrol_manual_enrol_users',
		{
			'enrolments[0][roleid]': 3,
			'enrolments[0][userid]': session.user.lmsUserId,
			'enrolments[0][courseid]': Number(courseId),
		},
		process.env.MOODLE_TOKEN
	);

	await assignedModulesRepository.linkCourseToAssignment(
		session.user.id,
		semesterModuleId,
		courseId
	);

	return { courseId, shortname };
}

export async function getMoodleCategories() {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('core_course_get_categories');

	return result as Array<{
		id: number;
		name: string;
		idnumber: string;
		parent: number;
	}>;
}
