'use client';
import { getAssessmentMarksByModuleId } from '@/server/assessment-marks/actions';
import { getAssessmentBySemesterModuleId } from '@/server/assessments/actions';
import { getStudentsBySemesterModuleId } from '@/server/students/actions';
import {
  Anchor,
  Box,
  Flex,
  Group,
  Input,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconDownload, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getAssessmentName } from '../../assessments/options';
import AssessmentMarksInput from './MarksInput';
import Link from 'next/link';

type Props = {
  semesterModuleId: number;
};

export default function StudentTable({ semesterModuleId }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

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
      assessments?.length > 0 &&
      students?.length > 0,
  });

  const [filteredStudents, setFilteredStudents] = useState(students || []);

  useEffect(() => {
    if (!students) return;

    if (!debouncedSearch.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        student.stdNo.toString().includes(debouncedSearch),
    );

    setFilteredStudents(filtered);
  }, [debouncedSearch, students]);

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

  const calculateTotalScore = (studentId: number) => {
    if (!assessments || !assessmentMarks) return null;

    let weightedTotal = 0;
    let totalWeight = 0;

    assessments.forEach((assessment) => {
      const mark = assessmentMarks.find(
        (m) => m.stdNo === studentId && m.assessmentId === assessment.id,
      );

      if (mark?.marks !== undefined && mark?.marks !== null) {
        const percentageScore = Number(mark.marks) / assessment.totalMarks;
        const weightedScore = percentageScore * assessment.weight;
        weightedTotal += weightedScore;
        totalWeight += assessment.weight;
      }
    });

    return {
      weightedTotal,
      totalWeight,
      totalWeightedScore:
        totalWeight > 0 ? (weightedTotal / totalWeight) * 100 : 0,
    };
  };

  if (isLoading) {
    return (
      <Paper p='md' radius='md' withBorder>
        <Skeleton height={40} mb='md' width='30%' />
        <Skeleton height={250} radius='md' />
      </Paper>
    );
  }

  const tableHeaders = assessments?.map((it) => (
    <Table.Th key={it.id} ta='center'>
      <Text fw={500}>{getAssessmentName(it.assessmentType)}</Text>
    </Table.Th>
  ));

  const rows = filteredStudents?.map((student) => {
    const totalScore = calculateTotalScore(student.stdNo);

    return (
      <Table.Tr key={student.stdNo}>
        <Table.Td fw={500}>
          <Anchor
            component={Link}
            size='0.93rem'
            href={`/admin/students/${student.stdNo}`}
          >
            {student.stdNo}
          </Anchor>
        </Table.Td>
        <Table.Td>
          <Text size='0.93rem'>{student.name}</Text>
        </Table.Td>
        {assessments?.map((assessment) => {
          const markData = getMarkForStudentAssessment(
            student.stdNo,
            assessment.id,
          );
          return (
            <Table.Td key={`${student.stdNo}-${assessment.id}`} ta='center'>
              <AssessmentMarksInput
                assessment={{
                  id: assessment.id,
                  totalMarks: assessment.totalMarks,
                  maxMarks: assessment.totalMarks,
                }}
                studentId={student.stdNo}
                existingMark={markData?.marks}
                existingMarkId={markData?.id}
                semesterModuleId={semesterModuleId}
              />
            </Table.Td>
          );
        })}
        <Table.Td ta='center'>
          {totalScore && (
            <Group gap={2} justify='center' align='end'>
              <Text
                fw={600}
                c={totalScore.totalWeightedScore >= 50 ? 'green' : 'red'}
              >
                {totalScore.weightedTotal.toFixed(1)}
              </Text>
              <Text size='sm' c='dimmed'>
                /{totalScore.totalWeight.toFixed(1)}
              </Text>
            </Group>
          )}
        </Table.Td>
      </Table.Tr>
    );
  });

  const noDataMessage =
    searchQuery && filteredStudents.length === 0 ? (
      <Text ta='center' py='xl' c='dimmed'>
        No students found matching &quot;{searchQuery}&quot;
      </Text>
    ) : students?.length === 0 ? (
      <Text ta='center' py='xl' c='dimmed'>
        No students enrolled in this module
      </Text>
    ) : null;

  return (
    <>
      <Stack mb='md'>
        <TextInput
          placeholder='Search by name or student number'
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          size='md'
          rightSection={
            searchQuery !== '' ? (
              <Input.ClearButton onClick={() => setSearchQuery('')} />
            ) : undefined
          }
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          style={{ flex: 1 }}
        />

        <ScrollArea>
          <Box mih={300}>
            <Table
              withTableBorder
              withColumnBorders
              highlightOnHover
              stickyHeader
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={120}>Student ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  {tableHeaders}
                  <Table.Th ta='center'>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows?.length > 0 ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td
                      colSpan={assessments ? assessments.length + 3 : 3}
                    >
                      {noDataMessage}
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>
        </ScrollArea>

        <Text size='xs' c='dimmed' mt='md' ta='right'>
          {filteredStudents?.length || 0} student
          {filteredStudents?.length !== 1 ? 's' : ''}
        </Text>
      </Stack>
    </>
  );
}
