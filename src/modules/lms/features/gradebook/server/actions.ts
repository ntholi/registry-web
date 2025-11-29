'use server';

import { getAssignedModuleByLmsCourseId } from '@academic/assigned-modules';
import { getEnrolledStudentsFromDB } from '@lms/students';
import { getStudentsByModuleId } from '@registry/students';

export async function getAssignedModuleByCourseId(courseId: number) {
	return getAssignedModuleByLmsCourseId(courseId.toString());
}

export async function getStudentsByCourseId(
	courseId: number,
	moduleId: number
) {
	const [moduleStudents, enrolledStudents] = await Promise.all([
		getStudentsByModuleId(moduleId),
		getEnrolledStudentsFromDB(courseId),
	]);

	const enrolledStdNos = new Set(enrolledStudents.map((s) => s.stdNo));

	return moduleStudents.filter((student) => enrolledStdNos.has(student.stdNo));
}
