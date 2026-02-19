'use server';

import { usersRepository } from '@admin/users/_server/repository';
import { ilike, or, type SQL, sql } from 'drizzle-orm';
import {
	getAssignedModuleByLmsCourseId,
	getAssignedModulesByCurrentUser,
} from '@/app/academic/assigned-modules';
import { getStudentsBySemesterModules } from '@/app/registry/students';
import { auth } from '@/core/auth';
import { students } from '@/core/database';
import { MoodleError, moodleGet, moodlePost } from '@/core/integrations/moodle';
import { splitShortName } from '../../courses/_lib/utils';
import type { MoodleEnrolledUser, StudentSearchResult } from '../types';
import { studentRepository } from './repository';

async function enrollUserInMoodleCourse(
	userId: number,
	courseId: number
): Promise<{ success: boolean; message: string }> {
	try {
		await moodlePost(
			'enrol_manual_enrol_users',
			{
				'enrolments[0][roleid]': 5,
				'enrolments[0][userid]': userId,
				'enrolments[0][courseid]': courseId,
			},
			process.env.MOODLE_TOKEN
		);
		return { success: true, message: 'Student enrolled successfully' };
	} catch (error) {
		if (
			error instanceof MoodleError &&
			error.errorcode === 'Message was not sent.'
		) {
			return {
				success: true,
				message: 'Student enrolled successfully (email notification skipped)',
			};
		}
		throw error;
	}
}

export async function getEnrolledStudentsFromDB(courseId: number) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet(
		'core_enrol_get_enrolled_users',
		{
			courseid: courseId,
		},
		process.env.MOODLE_TOKEN
	);

	const enrolledUsers = result as MoodleEnrolledUser[];
	const studentUsers = enrolledUsers.filter((user) =>
		user.roles.some((role) => role.shortname === 'student')
	);

	if (studentUsers.length === 0) {
		return [];
	}

	const lmsUserIds = studentUsers.map((u) => u.id);

	return studentRepository.findEnrolledStudentsByLmsUserIds(lmsUserIds);
}

export async function searchStudentsForEnrollment(
	search: string
): Promise<StudentSearchResult[]> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	if (!search || search.trim().length < 2) {
		return [];
	}

	const searchTerm = search.trim();

	let searchCondition: SQL | undefined;
	const digitCount = (searchTerm.match(/\d/g) || []).length;
	if (digitCount >= 5) {
		searchCondition = sql`${students.stdNo}::text ilike ${`%${searchTerm}%`}`;
	} else {
		searchCondition = or(ilike(students.name, `%${searchTerm}%`));
	}

	return studentRepository.searchStudentsForEnrollment(searchCondition);
}

export async function findStudentsByLmsUserIdsForSubmissions(
	lmsUserIds: number[]
) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	return studentRepository.findStudentsByLmsUserIdsForSubmissions(lmsUserIds);
}

export async function getRegisteredStudentsForSync(courseId: number) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const [assignedModules, courseAssignment] = await Promise.all([
		getAssignedModulesByCurrentUser(),
		getAssignedModuleByLmsCourseId(courseId.toString()),
	]);

	if (!courseAssignment?.semesterModule?.moduleId) {
		return [];
	}

	const moduleId = courseAssignment.semesterModule.moduleId;

	const semesterModuleIds = assignedModules
		.filter((am) => am.semesterModule?.moduleId === moduleId)
		.map((am) => am.semesterModule!.id);

	if (semesterModuleIds.length === 0) {
		return [];
	}

	return getStudentsBySemesterModules(semesterModuleIds);
}

export async function enrollStudentInCourse(
	courseId: number,
	studentStdNo: number,
	courseFullname: string,
	courseShortname: string
): Promise<{ success: boolean; message: string }> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const courseTerm = splitShortName(courseShortname).term;
	if (!courseTerm) {
		return {
			success: false,
			message: 'Course term could not be determined from shortname',
		};
	}

	const isEligible = await studentRepository.checkStudentEligibilityForCourse(
		studentStdNo,
		courseFullname,
		courseTerm
	);

	if (!isEligible) {
		return {
			success: false,
			message: `Student has not enrolled for the module "${courseFullname}" in term ${courseTerm}`,
		};
	}

	const student = await studentRepository.findStudentWithUser(studentStdNo);

	if (!student) {
		return { success: false, message: 'Student not found' };
	}

	if (!student.user) {
		return { success: false, message: 'Student has no linked user account' };
	}

	if (!student.user.email) {
		return { success: false, message: 'Student user has no email address' };
	}

	const lmsUserId = student.user.lmsUserId;
	if (!lmsUserId) {
		const moodleUserResult = await moodleGet(
			'core_user_get_users',
			{
				'criteria[0][key]': 'email',
				'criteria[0][value]': student.user.email,
			},
			process.env.MOODLE_TOKEN
		);

		if (
			!moodleUserResult?.users ||
			!Array.isArray(moodleUserResult.users) ||
			moodleUserResult.users.length === 0
		) {
			return { success: false, message: 'Student not found in Moodle' };
		}

		const moodleUserId = moodleUserResult.users[0].id;
		await usersRepository.updateUserLmsUserId(student.user.id, moodleUserId);

		return enrollUserInMoodleCourse(moodleUserId, courseId);
	}

	return enrollUserInMoodleCourse(lmsUserId, courseId);
}
