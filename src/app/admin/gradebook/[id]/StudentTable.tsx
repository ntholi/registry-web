'use client';
import {
  Anchor,
  Badge,
  Center,
  CloseButton,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { getAssessmentTypeLabel } from '../../assessments/[id]/assessments';
import MarksInput from './MarksInput';
import {
  useAssessmentMarksQuery,
  useAssessmentsQuery,
} from './useAssessmentsQuery';
import { useStudentsQuery } from './useStudentsQuery';

type Props = {
  moduleId: number;
};

export default function StudentTable({ moduleId }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: students, isLoading: studentsLoading } = useStudentsQuery({
    moduleId,
    searchQuery,
  });
  const { data: assessments, isLoading: assessmentsLoading } =
    useAssessmentsQuery(moduleId);
  const { data: assessmentMarks, isLoading: marksLoading } =
    useAssessmentMarksQuery(moduleId);

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
      return { total: 0, hasMarks: false, hasPassed: false };

    let weight = 0;
    let marks = 0;
    let maxMarks = 0;
    let hasMarks = false;

    assessments.forEach((assessment) => {
      const { mark } = getStudentMark(studentId, assessment.id);
      if (mark !== undefined) {
        weight += assessment.weight;
        marks += mark;
        maxMarks += assessment.totalMarks;
        hasMarks = true;
      }
    });

    const total = (marks / maxMarks) * weight;

    return {
      total,
      hasMarks,
      hasPassed: total >= weight * 0.5,
    };
  };
  function renderTableHeaders() {
    return (
      <Table.Tr>
        <Table.Th>Student Number</Table.Th>
        <Table.Th>Name</Table.Th>
        {assessmentsLoading
          ? Array(2)
              .fill(0)
              .map((_, idx) => (
                <Table.Th key={`skeleton-header-${idx}`}>
                  {' '}
                  <Skeleton height={16} width={80} mx='auto' />{' '}
                </Table.Th>
              ))
          : assessments?.map((assessment) => (
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
  }
  function renderTableRows() {
    if (studentsLoading) {
      return Array(10)
        .fill(0)
        .map((_, index) => (
          <Table.Tr key={`skeleton-${index}`}>
            <Table.Td>
              <Skeleton height={24} width={120} />
            </Table.Td>
            <Table.Td>
              <Skeleton height={24} width={200} />
            </Table.Td>
            {(assessmentsLoading ? Array(3).fill(0) : assessments || []).map(
              (_, idx) => (
                <Table.Td key={`skeleton-${index}-${idx}`}>
                  <Skeleton height={24} width={80} mx='auto' />
                </Table.Td>
              ),
            )}
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
      const { total, hasMarks, hasPassed } = calculateStudentTotals(
        student.stdNo,
      );

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
          {assessmentsLoading
            ? Array(3)
                .fill(0)
                .map((_, idx) => (
                  <Table.Td key={`skeleton-student-${student.stdNo}-${idx}`}>
                    <Skeleton height={24} width={80} mx='auto' />
                  </Table.Td>
                ))
            : assessments?.map((assessment) => {
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
                      moduleId={moduleId}
                    />
                  </Table.Td>
                );
              })}
          <Table.Td align='center'>
            {hasMarks ? (
              <Badge
                variant='light'
                color={hasPassed ? 'green' : 'red'}
                radius={'sm'}
                w={43}
              >
                {Math.ceil(total)}
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
  }
  return (
    <Stack>
      <Group justify='space-between' align='center' wrap='nowrap'>
        <TextInput
          placeholder='Search by name or student number'
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          style={{ flex: 1 }}
          rightSection={
            searchQuery ? (
              <CloseButton
                onClick={() => setSearchQuery('')}
                variant='subtle'
                size='sm'
              />
            ) : null
          }
          leftSection={<IconSearch size='1.2rem' />}
        />
        {!studentsLoading && students && (
          <Paper withBorder p={8.5}>
            <Text size='xs' c='dimmed' style={{ whiteSpace: 'nowrap' }}>
              {students.length} student{students.length !== 1 ? 's' : ''}
            </Text>
          </Paper>
        )}
      </Group>
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
