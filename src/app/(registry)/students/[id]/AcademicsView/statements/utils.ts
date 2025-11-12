import type { getAcademicHistory } from '@/server/registry/students/actions';

type Student = NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;

export function getCleanedSemesters(program: Student['programs'][number]) {
	if (!program) return [];
	const semesters = program.semesters
		.filter(
			(s) =>
				!['Deleted', 'Deferred', 'DroppedOut', 'Withdrawn'].includes(s.status)
		)
		.map((semester) => ({
			...semester,
			studentModules: semester.studentModules.filter(
				(studentModule) => !['Delete', 'Drop'].includes(studentModule.status)
			),
		}))
		.sort((a, b) => a.id - b.id);

	return semesters;
}
