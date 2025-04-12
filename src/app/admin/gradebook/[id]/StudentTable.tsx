'use client';
import { getAssessmentBySemesterModuleId } from '@/server/assessments/actions';
import { Table, Group, Text, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getAssessmentName } from '../../assessments/options';
import { getStudentsBySemesterModuleId } from '@/server/students/actions';
import { getAssessmentMarksByModuleId } from '@/server/assessment-marks/actions';
import AssessmentMarksInput from './AssessmentMarksInput';

type Props = {
  semesterModuleId: number;
};

export default function StudentTable({ semesterModuleId }: Props) {
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['assessments', semesterModuleId],
    queryFn: () => getAssessmentBySemesterModuleId(semesterModuleId),
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', semesterModuleId],
    queryFn: () => getStudentsBySemesterModuleId(semesterModuleId),
  });

  const { data: assessmentMarks, isLoading: isLoadingMarks } = useQuery({
    queryKey: ['assessmentMarks', semesterModuleId],
    queryFn: () => getAssessmentMarksByModuleId(semesterModuleId),
    enabled:
      !!assessments &&
      !!students &&
      assessments.length > 0 &&
      students.length > 0,
  });

  const getMarkForStudentAssessment = (
    studentId: number,
    assessmentId: number,
  ) => {
    const mark = assessmentMarks?.find(
      (m) => m.stdNo === studentId && m.assessmentId === assessmentId,
    );
    return { marks: mark?.marks, id: mark?.id };
  };

  const isLoading = isLoadingAssessments || isLoadingStudents || isLoadingMarks;

  if (isLoading) {
    return (
      <Group justify='center' p='xl'>
        <Loader />
        <Text>Loading gradebook data...</Text>
      </Group>
    );
  }

  const tableHeaders = assessments?.map((it) => (
    <Table.Th key={it.id}>{getAssessmentName(it.assessmentType)}</Table.Th>
  ));

  const rows = students?.map((student) => (
    <Table.Tr key={student.stdNo}>
      <Table.Td>{student.stdNo}</Table.Td>
      <Table.Td>{student.name}</Table.Td>
      {assessments?.map((assessment) => {
        const markData = getMarkForStudentAssessment(
          student.stdNo,
          assessment.id,
        );
        return (
          <Table.Td key={`${student.stdNo}-${assessment.id}`}>
            <AssessmentMarksInput
              assessmentId={assessment.id}
              studentId={student.stdNo}
              existingMark={markData?.marks}
              existingMarkId={markData?.id}
            />
          </Table.Td>
        );
      })}
    </Table.Tr>
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
      <Table.Tbody>{rows || []}</Table.Tbody>
    </Table>
  );
}
