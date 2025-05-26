'use client';

import { getStudentsByModuleId } from '@/server/students/actions';
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
  const [semesterModuleId] = useQueryState('semesterModuleId');

  return useQuery({
    queryKey: ['students', moduleId],
    queryFn: () => getStudentsByModuleId(moduleId),
    select(data) {
      let filteredData = data;

      if (semesterModuleId) {
        filteredData = data.filter((it) =>
          it.programs.some((it) =>
            it.semesters.some((it) =>
              it.studentModules.some(
                (it) => it.semesterModule?.id?.toString() === semesterModuleId,
              ),
            ),
          ),
        );
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredData = filteredData.filter(
          (student) =>
            student.name.toLowerCase().includes(query) ||
            student.stdNo.toString().toLowerCase().includes(query),
        );
      }

      return filteredData;
    },
  });
}
