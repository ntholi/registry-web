'use server';

import { getCurrentTerm } from '@registry/terms';
import { and, eq, ilike, or, type SQL, sql } from 'drizzle-orm';
import { auth } from '@/core/auth';
import {
	db,
	programs,
	structureSemesters,
	structures,
	studentPrograms,
	studentSemesters,
	students,
	users,
} from '@/core/database';
import { MoodleError, moodleGet, moodlePost } from '@/core/integrations/moodle';
import type { MoodleEnrolledUser, StudentSearchResult } from '../types';

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

export async function getEnrolledStudents(
	courseId: number
): Promise<MoodleEnrolledUser[]> {
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
	return enrolledUsers.filter((user) =>
		user.roles.some((role) => role.shortname === 'student')
	);
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

	const currentTerm = await getCurrentTerm();
	const searchTerm = search.trim();

	let searchCondition: SQL | undefined;
	const digitCount = (searchTerm.match(/\d/g) || []).length;
	if (digitCount >= 5) {
		searchCondition = sql`${students.stdNo}::text ilike ${`%${searchTerm}%`}`;
	} else {
		searchCondition = or(ilike(students.name, `%${searchTerm}%`));
	}

	const results = await db
		.select({
			stdNo: students.stdNo,
			name: students.name,
			programName: programs.name,
			semesterNumber: structureSemesters.semesterNumber,
			userId: students.userId,
			lmsUserId: users.lmsUserId,
		})
		.from(students)
		.innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
		.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
		.innerJoin(programs, eq(structures.programId, programs.id))
		.innerJoin(
			studentSemesters,
			eq(studentSemesters.studentProgramId, studentPrograms.id)
		)
		.innerJoin(
			structureSemesters,
			eq(studentSemesters.structureSemesterId, structureSemesters.id)
		)
		.leftJoin(users, eq(students.userId, users.id))
		.where(
			and(
				searchCondition,
				eq(studentPrograms.status, 'Active'),
				eq(studentSemesters.term, currentTerm.name)
			)
		)
		.limit(10);

	return results;
}

export async function enrollStudentInCourse(
	courseId: number,
	studentStdNo: number
): Promise<{ success: boolean; message: string }> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const student = await db.query.students.findFirst({
		where: eq(students.stdNo, studentStdNo),
		with: {
			user: true,
		},
	});

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
		await db
			.update(users)
			.set({ lmsUserId: moodleUserId })
			.where(eq(users.id, student.user.id));

		return enrollUserInMoodleCourse(moodleUserId, courseId);
	}

	return enrollUserInMoodleCourse(lmsUserId, courseId);
}
