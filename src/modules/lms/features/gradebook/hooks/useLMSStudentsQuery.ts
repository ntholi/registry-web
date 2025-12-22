'use client';

import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { getStudentsByCourseId } from '../server/actions';

export type Student = Awaited<ReturnType<typeof getStudentsByCourseId>>[number];

type UseLMSStudentsQueryParams = {
	courseId: number;
	semesterModuleIds: number[];
	searchQuery: string;
};

export function useLMSStudentsQuery({
	courseId,
	semesterModuleIds,
	searchQuery,
}: UseLMSStudentsQueryParams) {
	const [programId] = useQueryState('programId');
	return useQuery({
		queryKey: ['lms-gradebook-students', courseId, semesterModuleIds],
		queryFn: () => getStudentsByCourseId(courseId, semesterModuleIds),
		enabled: semesterModuleIds.length > 0,
		select(data) {
			let filteredData = data;

			if (programId) {
				filteredData = data.filter(
					(it) => it.programId?.toString() === programId
				);
			}

			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase().trim();
				filteredData = filteredData.filter(
					(student) =>
						student.name.toLowerCase().includes(query) ||
						student.stdNo.toString().toLowerCase().includes(query)
				);
			}

			return filteredData;
		},
	});
}
