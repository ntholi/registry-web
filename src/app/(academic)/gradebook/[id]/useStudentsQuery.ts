'use client';

import { getStudentsByModuleId } from '@/server/registry/students/actions';

export type Student = Awaited<ReturnType<typeof getStudentsByModuleId>>[number];

import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';

type UseStudentsQueryParams = {
	moduleId: number;
	searchQuery: string;
};

export function useStudentsQuery({
	moduleId,
	searchQuery,
}: UseStudentsQueryParams) {
	const [programId] = useQueryState('programId');
	return useQuery({
		queryKey: ['students', moduleId],
		queryFn: () => getStudentsByModuleId(moduleId),
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
