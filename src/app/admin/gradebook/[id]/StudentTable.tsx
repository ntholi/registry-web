'use client';
import {
  Anchor,
  Stack,
  Table,
  TextInput,
  Text,
  Center,
  Skeleton,
  Box,
  Group,
  Badge,
  Paper,
} from '@mantine/core';
import Link from 'next/link';
import { useState } from 'react';
import { useStudentsQuery } from './useStudentsQuery';
import {
  useAssessmentsQuery,
  useAssessmentMarksQuery,
} from './useAssessmentsQuery';
import { useQueryState } from 'nuqs';
import MarksInput from './MarksInput';
import { getAssessmentTypeLabel } from '../../assessments/[id]/assessments';

type Props = {
  moduleId: number;
};

export default function StudentTable({ moduleId }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterModuleId] = useQueryState('semesterModuleId');
  const currentModuleId = semesterModuleId
    ? parseInt(semesterModuleId)
    : moduleId;

  const { data: students, isLoading: studentsLoading } = useStudentsQuery({
    moduleId,
    searchQuery,
  });
  const { data: assessments, isLoading: assessmentsLoading } =
    useAssessmentsQuery(currentModuleId);
  const { data: assessmentMarks, isLoading: marksLoading } =
    useAssessmentMarksQuery(currentModuleId);

  const isLoading = studentsLoading || assessmentsLoading || marksLoading;

  const getStudentMark = (studentId: number, assessmentId: number) => {
    if (!assessmentMarks) return { mark: undefined, markId: undefined };

    const mark = assessmentMarks.find(
      (mark) => mark.stdNo === studentId && mark.assessmentId === assessmentId,
    );

    return {
      mark: mark ? mark.marks : undefined,
      markId: mark ? mark.id : undefined,
    };
  };

  const calculateStudentTotals = (studentId: number) => {
    if (!assessments || !assessmentMarks)
      return { total: 0, percentage: 0, hasMarks: false };

    let totalWeightedPercentage = 0;
    let totalWeight = 0;
    let hasAtLeastOneMark = false;

    assessments.forEach((assessment) => {
      const { mark } = getStudentMark(studentId, assessment.id);
      if (mark !== undefined) {
        const assessmentPercentage = (mark / assessment.totalMarks) * 100;
        totalWeightedPercentage +=
          (assessmentPercentage * assessment.weight) / 100;
        totalWeight += assessment.weight;
        hasAtLeastOneMark = true;
      }
    });

    return {
      total: Math.round(totalWeightedPercentage * 10) / 10,
      hasMarks: hasAtLeastOneMark,
    };
  };
  const renderTableHeaders = () => {
    return (
      <Table.Tr>
        <Table.Th>Student Number</Table.Th>
        <Table.Th>Name</Table.Th>
        {assessments?.map((assessment) => (
          <Table.Th
            key={assessment.id}
            style={{ minWidth: '100px', textAlign: 'center' }}
          >
            <Group gap={5} justify='center'>
              <Text size='sm' fw={'bold'}>
                {getAssessmentTypeLabel(assessment.assessmentType)}
              </Text>
              <Text size='xs' c='dimmed'>
                ({assessment.weight}%)
              </Text>
            </Group>
          </Table.Th>
        ))}
        <Table.Th style={{ textAlign: 'center' }}>
          <Group gap={5} justify='center'>
            <Text size='sm' fw={'bold'}>
              Total
            </Text>
            <Text size='xs' c='dimmed'>
              (
              {assessments?.reduce(
                (acc, assessment) => acc + assessment.weight,
                0,
              )}
              %)
            </Text>
          </Group>
        </Table.Th>
      </Table.Tr>
    );
  };
  const renderTableRows = () => {
    if (isLoading) {
      return Array(5)
        .fill(0)
        .map((_, index) => (
          <Table.Tr key={`skeleton-${index}`}>
            <Table.Td>
              <Skeleton height={24} width={120} />
            </Table.Td>
            <Table.Td>
              <Skeleton height={24} width={200} />
            </Table.Td>
            {assessments?.map((assessment) => (
              <Table.Td key={`skeleton-${index}-${assessment.id}`}>
                <Skeleton height={24} width={80} mx='auto' />
              </Table.Td>
            )) || []}
            <Table.Td>
              <Skeleton height={24} width={80} mx='auto' />
            </Table.Td>
          </Table.Tr>
        ));
    }

    if (!students?.length) {
      return (
        <Table.Tr>
          <Table.Td colSpan={assessments?.length ? assessments.length + 3 : 4}>
            <Center py='md'>
              <Text c='dimmed'>No students found</Text>
            </Center>
          </Table.Td>
        </Table.Tr>
      );
    }
    return students.map((student) => {
      const { total, hasMarks } = calculateStudentTotals(student.stdNo);

      return (
        <Table.Tr key={student.stdNo}>
          <Table.Td>
            <Anchor
              size='sm'
              component={Link}
              href={`/admin/students/${student.stdNo}`}
            >
              {student.stdNo}
            </Anchor>
          </Table.Td>
          <Table.Td>{student.name}</Table.Td>
          {assessments?.map((assessment) => {
            const { mark, markId } = getStudentMark(
              student.stdNo,
              assessment.id,
            );
            return (
              <Table.Td
                key={`${student.stdNo}-${assessment.id}`}
                align='center'
              >
                <MarksInput
                  assessment={{
                    id: assessment.id,
                    maxMarks: assessment.totalMarks,
                    totalMarks: assessment.totalMarks,
                  }}
                  studentId={student.stdNo}
                  existingMark={mark}
                  existingMarkId={markId}
                  semesterModuleId={currentModuleId}
                />
              </Table.Td>
            );
          })}
          <Table.Td align='center'>
            {hasMarks ? (
              <Badge
                variant='light'
                color={total >= 50 ? 'green' : 'red'}
                size='sm'
              >
                {total}%
              </Badge>
            ) : (
              <Text c='dimmed' size='sm'>
                -
              </Text>
            )}
          </Table.Td>
        </Table.Tr>
      );
    });
  };
  return (
    <Stack>
      <TextInput
        placeholder='Search by name or student number'
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.currentTarget.value)}
        mb='sm'
      />
      {!assessments?.length && !isLoading ? (
        <Paper p='xl' withBorder>
          <Center>
            <Text c='dimmed'>
              No assessments found for this module. Add assessments first.
            </Text>
          </Center>
        </Paper>
      ) : (
        <Table
          highlightOnHover
          withTableBorder
          stickyHeader
          stickyHeaderOffset={60}
        >
          <Table.Thead>{renderTableHeaders()}</Table.Thead>
          <Table.Tbody>{renderTableRows()}</Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
