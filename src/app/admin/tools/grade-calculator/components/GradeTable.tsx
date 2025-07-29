'use client';

import { grades } from '@/utils/grades';
import { Badge, Card, Stack, Table, Title } from '@mantine/core';
import { getGradeColor } from './gradeColors';

export function GradeTable() {
  const uniqueGrades = grades.filter(
    (grade, index, array) =>
      array.findIndex((g) => g.grade === grade.grade) === index
  );

  const rows = uniqueGrades.map((grade) => (
    <Table.Tr key={grade.grade}>
      <Table.Td>
        <Badge color={getGradeColor(grade.grade)} size='lg'>
          {grade.grade}
        </Badge>
      </Table.Td>
      <Table.Td>
        {grade.points !== null ? grade.points.toFixed(2) : 'N/A'}
      </Table.Td>
      <Table.Td>
        {grade.marksRange
          ? `${grade.marksRange.min} - ${grade.marksRange.max}`
          : 'N/A'}
      </Table.Td>
      <Table.Td>{grade.description}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Card withBorder shadow='sm' p='lg'>
      <Stack gap='md'>
        <Title order={3}>Grade Reference Table</Title>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Grade</Table.Th>
              <Table.Th>Points</Table.Th>
              <Table.Th>Marks Range</Table.Th>
              <Table.Th>Description</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Stack>
    </Card>
  );
}
