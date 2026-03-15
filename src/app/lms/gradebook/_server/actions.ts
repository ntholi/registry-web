'use server';

import { getAssignedModuleByLmsCourseId } from '@academic/assigned-modules';
import { getEnrolledStudentsFromDB } from '@lms/students';
import { getStudentsBySemesterModules } from '@registry/students';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';

export const getAssignedModuleByCourseId = createAction(
	async (courseId: number) => {
		return unwrap(await getAssignedModuleByLmsCourseId(courseId.toString()));
	}
);

export const getStudentsByCourseId = createAction(
	async (courseId: number, semesterModuleIds: number[]) => {
		const [moduleStudents, enrolledStudents] = await Promise.all([
			getStudentsBySemesterModules(semesterModuleIds).then(unwrap),
			getEnrolledStudentsFromDB(courseId).then(unwrap),
		]);

		const enrolledStdNos = new Set(enrolledStudents.map((s) => s.stdNo));

		return moduleStudents.filter((student) =>
			enrolledStdNos.has(student.stdNo)
		);
	}
);
