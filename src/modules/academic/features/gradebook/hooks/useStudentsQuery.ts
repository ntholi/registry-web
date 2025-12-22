'use client';

import { getStudentsBySemesterModules } from '@registry/students';

export type Student = Awaited<
	ReturnType<typeof getStudentsBySemesterModules>
>[number];

import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';

type UseStudentsQueryParams = {
	semesterModuleIds: number[];
	searchQuery: string;
};

export function useStudentsQuery({
	semesterModuleIds,
	searchQuery,
}: UseStudentsQueryParams) {
	const [programId] = useQueryState('programId');
	return useQuery({
		queryKey: ['students', semesterModuleIds],
		queryFn: () => getStudentsBySemesterModules(semesterModuleIds),
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
