'use client';

import { upsertModuleGrade } from '@/server/module-grades/actions';
import { getLetterGrade } from '@/utils/gradeCalculations';
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertCircle, // Added IconAlertCircle
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
        pos='relative'
        color={hasPassed ? 'green' : 'red'}
        radius={'sm'}
        style={{
          cursor: isBorderline ? 'pointer' : 'default',
          border: isBorderline
            ? `2px solid var(--mantine-color-orange-6)`
            : undefined,
          zIndex: 2,
        }}
        onClick={isBorderline ? open : undefined}
      >
        {isBorderline && (
          <Box pos='absolute' top={-5} right={-5} style={{ zIndex: 10 }}>
            <IconAlertCircle size={16} />
          </Box>
        )}
        {Math.ceil(weightedTotal)}%
      </Badge>

      <Modal
        opened={opened}
        onClose={close}
        title='Borderline Mark Adjustment'
        centered
      >
        <Stack gap='md'>
          <Alert
            icon={<IconAlertTriangle size={20} />}
            title='Borderline Mark Detected'
            color='orange'
            variant='light'
          >
            The current mark of{' '}
            <Text c='orange.7' span fw='bold'>
              {Math.ceil(weightedTotal)}%
            </Text>{' '}
            is considered borderline. You may adjust it to one of the adjacent
            values.
          </Alert>

          {borderlineOptions && (
            <Stack align='center' gap={0} mt='xs'>
              <Text size='xs' c='dimmed'>
                Choose an adjusted mark:
              </Text>
              <Group justify='center' my='md'>
                <Button
                  variant='outline'
                  color='red.7'
                  size='sm'
                  leftSection={<IconChevronLeft size={16} />}
                  onClick={() => handleAdjustGrade(borderlineOptions.lower)}
                  loading={adjustGradeMutation.isPending}
                >
                  {borderlineOptions.lower}%
                </Button>
                <Button
                  variant='outline'
                  color='green.7'
                  size='sm'
                  rightSection={<IconChevronRight size={16} />}
                  onClick={() => handleAdjustGrade(borderlineOptions.higher)}
                  loading={adjustGradeMutation.isPending}
                >
                  {borderlineOptions.higher}%
                </Button>
              </Group>
            </Stack>
          )}
        </Stack>
      </Modal>
    </>
  );
}
