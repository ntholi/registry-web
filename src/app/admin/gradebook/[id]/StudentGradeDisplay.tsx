'use client';

import { Badge, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { findModuleGradeByModuleAndStudent } from '@/server/module-grades/actions';

type Props = {
  studentId: number;
  displayType: 'total' | 'grade';
  moduleId: number;
};

export default function StudentGradeDisplay({
  studentId,
  displayType,
  moduleId,
}: Props) {
  const { data: moduleGrade, isLoading } = useQuery({
    queryKey: ['moduleGrade', moduleId, studentId],
    queryFn: async () => {
      const result = await findModuleGradeByModuleAndStudent(
        moduleId,
        studentId,
      );
      return result || null;
    },
  });

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
      <Badge
        variant='light'
        color={hasPassed ? 'green' : 'red'}
        radius={'sm'}
        w={43}
      >
        {Math.ceil(weightedTotal)}
      </Badge>
    );
  }

  const gradeColor = getGradeColor(grade);

  return (
    <Badge variant='light' color={gradeColor} radius={'sm'} w={40}>
      {grade}
    </Badge>
  );
}
