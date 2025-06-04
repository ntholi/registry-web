'use client';

import { upsertModuleGrade } from '@/server/module-grades/actions';
import { getLetterGrade } from '@/utils/gradeCalculations';
import { Alert, Badge, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type Props = {
  weightedTotal: number;
  hasPassed: boolean;
  studentId: number;
  moduleId: number;
};

export default function BorderlineMark({
  weightedTotal,
  hasPassed,
  studentId,
  moduleId,
}: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const queryClient = useQueryClient();

  const isBorderlineMark = (score: number): boolean => {
    const borderlineMarks = [44, 49, 54, 59, 64, 69, 74, 79, 84, 89];
    return borderlineMarks.includes(Math.floor(score));
  };

  const getBorderlineOptions = (
    score: number,
  ): { lower: number; higher: number } => {
    const floorScore = Math.floor(score);
    return {
      lower: floorScore - 1,
      higher: floorScore + 1,
    };
  };
  const adjustGradeMutation = useMutation({
    mutationFn: async (newScore: number) => {
      const grade = getLetterGrade(newScore);
      return await upsertModuleGrade({
        moduleId,
        stdNo: studentId,
        grade,
        weightedTotal: newScore,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['moduleGrade', moduleId, studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['moduleGrades', moduleId],
      });
      close();
    },
  });

  const handleAdjustGrade = (newScore: number) => {
    adjustGradeMutation.mutate(newScore);
  };

  const isBorderline = isBorderlineMark(weightedTotal);
  const borderlineOptions = isBorderline
    ? getBorderlineOptions(weightedTotal)
    : null;

  return (
    <>
      <Badge
        variant='light'
        color={hasPassed ? 'green' : 'red'}
        radius={'sm'}
        w={43}
        style={{
          cursor: isBorderline ? 'pointer' : 'default',
          border: isBorderline ? '2px solid orange' : undefined,
          position: 'relative',
        }}
        onClick={isBorderline ? open : undefined}
      >
        {Math.ceil(weightedTotal)}
        {isBorderline && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              fontSize: '8px',
              color: 'orange',
            }}
          >
            ⚠
          </span>
        )}
      </Badge>

      <Modal opened={opened} onClose={close} title='Borderline Mark' centered>
        <Stack>
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title='Adjust Borderline Mark'
            color='orange'
            variant='transparent'
          >
            This student's total mark of{' '}
            <Text c='yellow' component='span' size='sm' fw={'bold'}>
              {Math.ceil(weightedTotal)}
            </Text>{' '}
            is a borderline mark. You can adjust it to either of the following
            options:
          </Alert>

          {borderlineOptions && (
            <Group pl={55} gap='md'>
              <Button
                variant='default'
                color='red'
                size='xs'
                leftSection={<IconChevronLeft size={16} />}
                onClick={() => handleAdjustGrade(borderlineOptions.lower)}
                disabled={adjustGradeMutation.isPending}
              >
                Adjust to {borderlineOptions.lower}
              </Button>
              <Button
                variant='default'
                color='green'
                size='xs'
                rightSection={<IconChevronRight size={16} />}
                onClick={() => handleAdjustGrade(borderlineOptions.higher)}
                disabled={adjustGradeMutation.isPending}
              >
                Adjust to {borderlineOptions.higher}
              </Button>
            </Group>
          )}

          <Group justify='flex-end'>
            <Button variant='subtle' onClick={close}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
