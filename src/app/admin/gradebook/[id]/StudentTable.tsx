'use client';
import { getAssessmentBySemesterModuleId } from '@/server/assessments/actions';
import { Table } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getAssessmentName } from '../../assessments/options';

type Props = {
  semesterModuleId: number;
};
export default function StudentTable({ semesterModuleId }: Props) {
  const { data: assessments } = useQuery({
    queryKey: ['assessments', semesterModuleId],
    queryFn: () => getAssessmentBySemesterModuleId(semesterModuleId),
  });

  const tableHeaders = assessments?.map((it) => (
    <Table.Th key={it.id}>{getAssessmentName(it.assessmentType)}</Table.Th>
  ));

  return (
    <Table withTableBorder>
      <Table.Thead>
        <Table.Tr>{tableHeaders}</Table.Tr>
      </Table.Thead>
    </Table>
  );
}
