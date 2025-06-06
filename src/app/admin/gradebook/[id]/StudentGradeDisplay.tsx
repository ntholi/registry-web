'use client';

import { Badge, Text } from '@mantine/core';
import BorderlineMark from './BorderlineMark';

type ModuleGrade = {
  id: number;
  moduleId: number;
  stdNo: number;
  grade: string;
  weightedTotal: number;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type Props = {
  studentId: number;
  displayType: 'total' | 'grade';
  moduleId: number;
  moduleGrade?: ModuleGrade | null;
  isLoading?: boolean;
};

export default function StudentGradeDisplay({
  studentId,
  displayType,
  moduleId,
  moduleGrade,
  isLoading = false,
}: Props) {
  const getGradeColor = (grade: string): string => {
    if (['A', 'B', 'C'].some((letter) => grade.startsWith(letter)))
      return 'green';
    if (['PP', 'Def'].includes(grade)) return 'yellow';
    return 'red';
  };

  if (isLoading) {
    return (
      <Text c='dimmed' size='sm'>
        ...
      </Text>
    );
  }
  if (!moduleGrade) {
    return (
      <Text c='dimmed' size='sm'>
        -
      </Text>
    );
  }
  const { weightedTotal, grade } = moduleGrade;
  const hasPassed = weightedTotal >= 50;

  if (displayType === 'total') {
    return (
      <BorderlineMark
        weightedTotal={weightedTotal}
        hasPassed={hasPassed}
        studentId={studentId}
        moduleId={moduleId}
      />
    );
  }

  const gradeColor = getGradeColor(grade);

  return (
    <Badge variant='light' color={gradeColor} radius={'sm'} w={40}>
      {grade}
    </Badge>
  );
}
