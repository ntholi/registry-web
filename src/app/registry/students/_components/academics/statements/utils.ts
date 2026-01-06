import { isActiveSemester } from '@/shared/lib/utils/utils';
import type { getAcademicHistory } from '../../../_server/actions';

type Student = NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;

export function getCleanedSemesters(program: Student['programs'][number]) {
	if (!program) return [];
	const semesters = program.semesters
		.filter((s) => isActiveSemester(s.status))
		.map((semester) => ({
			...semester,
			studentModules: semester.studentModules.filter(
				(studentModule) => !['Delete', 'Drop'].includes(studentModule.status)
			),
		}))
		.sort((a, b) => a.id - b.id);

	return semesters;
}
