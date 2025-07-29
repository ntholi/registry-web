'use client';

import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { getGradeColor, getPointsColor } from './gradeColors';

type GradeResult = {
  grade: string;
  points: number | null;
  description: string;
  marksRange?: { min: number; max: number };
};

interface GradeResultDisplayProps {
  result: GradeResult;
}

export function GradeResultDisplay({ result }: GradeResultDisplayProps) {
  return (
    <Card withBorder shadow='sm' p='lg'>
      <Stack gap='md'>
        <Title order={3}>Grade Information</Title>

        <Group justify='apart'>
          <Text fw={500}>Grade:</Text>
          <Badge size='lg' color={getGradeColor(result.grade)}>
            {result.grade}
          </Badge>
        </Group>

        <Group justify='apart'>
          <Text fw={500}>Points:</Text>
          <Badge size='lg' color={getPointsColor(result.points)}>
            {result.points !== null ? result.points.toFixed(2) : 'N/A'}
          </Badge>
        </Group>

        <Group justify='apart' align='flex-start'>
          <Text fw={500}>Description:</Text>
          <Text ta='right' style={{ maxWidth: '60%' }}>
            {result.description}
          </Text>
        </Group>

        {result.marksRange && (
          <Group justify='apart'>
            <Text fw={500}>Marks Range:</Text>
            <Badge variant='outline' size='lg'>
              {result.marksRange.min} - {result.marksRange.max}
            </Badge>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
