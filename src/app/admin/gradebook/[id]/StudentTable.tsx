'use client';
import {
  getAssessmentBySemesterModuleId,
  getAssessments,
} from '@/server/assessments/actions';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Table } from '@mantine/core';

type Props = {
  semesterModuleId: number;
};
export default function StudentTable({ semesterModuleId }: Props) {
  const { data: assessments } = useQuery({
    queryKey: ['assessments', semesterModuleId],
    queryFn: () => getAssessmentBySemesterModuleId(semesterModuleId),
  });

  const tableHeaders = assessments?.map((it) => (
    <Table.Th key={it.id}>{it.assessmentType}</Table.Th>
  ));

  return (
    <Table withTableBorder>
      <Table.Thead>
        <Table.Tr>{tableHeaders}</Table.Tr>
      </Table.Thead>
    </Table>
  );
}
