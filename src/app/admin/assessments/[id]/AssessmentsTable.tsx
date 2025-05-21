'use client';

import { Paper, Table, Title, Text } from '@mantine/core';
import React from 'react';
import { getModule } from '@/server/modules/actions';

interface Props {
  module: NonNullable<Awaited<ReturnType<typeof getModule>>>;
}

export default function AssessmentsTable({ module }: Props) {
  return (
    <Paper p='md' radius='md' withBorder shadow='sm'>
      <Title order={4} mb='md' fw={400}>
        Assessments
      </Title>
      {module.assessments && module.assessments.length > 0 ? (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Assessment Number</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Total Marks</Table.Th>
              <Table.Th>Weight</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {module.assessments.map((assessment) => (
              <Table.Tr key={assessment.id}>
                <Table.Td>{assessment.assessmentNumber}</Table.Td>
                <Table.Td>{assessment.assessmentType}</Table.Td>
                <Table.Td>{assessment.totalMarks}</Table.Td>
                <Table.Td>{assessment.weight}%</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c='dimmed' ta='center' py='xl'>
          No assessments found for this module
        </Text>
      )}
    </Paper>
  );
}
