'use client';
import { getAssessmentBySemesterModuleId } from '@/server/assessments/actions';
import { Table } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getAssessmentName } from '../../assessments/options';
import { getStudentsBySemesterModuleId } from '@/server/students/actions';

type Props = {
  semesterModuleId: number;
};
export default function StudentTable({ semesterModuleId }: Props) {
  const { data: assessments } = useQuery({
    queryKey: ['assessments', semesterModuleId],
    queryFn: () => getAssessmentBySemesterModuleId(semesterModuleId),
  });

  const { data: students } = useQuery({
    queryKey: ['students', semesterModuleId],
    queryFn: () => getStudentsBySemesterModuleId(semesterModuleId),
  });

  const tableHeaders = assessments?.map((it) => (
    <Table.Th key={it.id}>{getAssessmentName(it.assessmentType)}</Table.Th>
  ));

  return (
    <Table withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Student ID</Table.Th>
          <Table.Th>Name</Table.Th>
          {tableHeaders}
        </Table.Tr>
      </Table.Thead>
    </Table>
  );
}
