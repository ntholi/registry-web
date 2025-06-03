'use client';

import { Badge, Modal, Button, Group, Stack, Alert, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconAlertTriangle } from '@tabler/icons-react';

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
      console.log(
        `Adjusting grade to ${newScore} for student ${studentId} in module ${moduleId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['moduleGrade', moduleId, studentId],
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

      <Modal
        opened={opened}
        onClose={close}
        title='Borderline Mark Adjustment'
        centered
      >
        <Stack>
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title='Borderline Mark Detected'
            color='orange'
          >
            This student's total mark of {Math.ceil(weightedTotal)} is a
            borderline mark. You can adjust it to either of the following
            options:
          </Alert>

          <Text size='sm' c='dimmed'>
            Current mark: <strong>{Math.ceil(weightedTotal)}</strong>
          </Text>

          {borderlineOptions && (
            <Group justify='center' gap='md'>
              <Button
                variant='outline'
                color='red'
                onClick={() => handleAdjustGrade(borderlineOptions.lower)}
                loading={adjustGradeMutation.isPending}
              >
                Adjust to {borderlineOptions.lower}
              </Button>
              <Button
                variant='outline'
                color='green'
                onClick={() => handleAdjustGrade(borderlineOptions.higher)}
                loading={adjustGradeMutation.isPending}
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
