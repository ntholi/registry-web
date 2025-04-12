'use client';
import { getAssessmentBySemesterModuleId } from '@/server/assessments/actions';
import {
  Table,
  Group,
  Text,
  Skeleton,
  Paper,
  Box,
  ScrollArea,
  TextInput,
  Tooltip,
  Transition,
  Badge,
  Flex,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getAssessmentName } from '../../assessments/options';
import { getStudentsBySemesterModuleId } from '@/server/students/actions';
import { getAssessmentMarksByModuleId } from '@/server/assessment-marks/actions';
import AssessmentMarksInput from './MarksInput';
import { useState, useEffect } from 'react';
import { IconSearch, IconDownload } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';

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

  // Calculate total scores for each student
  const calculateTotalScore = (studentId: number) => {
    if (!assessments || !assessmentMarks) return null;

    let weightedTotal = 0;
    let totalWeight = 0;

    assessments.forEach((assessment) => {
      const mark = assessmentMarks.find(
        (m) => m.stdNo === studentId && m.assessmentId === assessment.id,
      );

      if (mark?.marks !== undefined && mark?.marks !== null) {
        // Calculate weighted score: (mark/totalMarks) * weight
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

  const handleExportToExcel = () => {
    // This would be implemented with a library like xlsx or exceljs
    console.log('Exporting to Excel...');
    // Implementation would go here
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
        <Table.Td>{student.stdNo}</Table.Td>
        <Table.Td>
          <Text fw={500}>{student.name}</Text>
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
        No students found matching "{searchQuery}"
      </Text>
    ) : students?.length === 0 ? (
      <Text ta='center' py='xl' c='dimmed'>
        No students enrolled in this module
      </Text>
    ) : null;

  return (
    <>
      <Box mb='md'>
        <Flex justify='space-between' align='center' mb='md'>
          <TextInput
            placeholder='Search by student no. or name'
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            w='100%'
            maw={400}
          />
          <Tooltip label='Export to Excel'>
            <Box style={{ cursor: 'pointer' }} onClick={handleExportToExcel}>
              <IconDownload size={20} />
            </Box>
          </Tooltip>
        </Flex>

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
      </Box>
    </>
  );
}
