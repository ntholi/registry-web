'use client';

import { upsertModuleGrade } from '@/server/module-grades/actions';
import { getLetterGrade } from '@/utils/gradeCalculations';
import { gradeEnum } from '@/db/schema';
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Radio,
  SegmentedControl,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface Props {
  studentId: number;
  studentName: string;
  moduleId: number;
  currentGrade?: string;
  weightedTotal?: number;
}

export default function GradeSymbolModal({
  studentId,
  studentName,
  moduleId,
  currentGrade,
  weightedTotal = 0,
}: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');
  const [selectedGrade, setSelectedGrade] = useState<'PP' | 'Def' | 'ANN'>(
    'PP',
  );
  const queryClient = useQueryClient();
  const gradeUpdateMutation = useMutation({
    mutationFn: async (data: {
      grade: (typeof gradeEnum)[number];
      weightedTotal: number;
    }) => {
      return await upsertModuleGrade({
        moduleId,
        stdNo: studentId,
        grade: data.grade,
        weightedTotal: data.weightedTotal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['moduleGrade', moduleId, studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['moduleGrades', moduleId],
      });
      notifications.show({
        title: 'Success',
        message: 'Grade symbol updated successfully',
        color: 'green',
      });
      close();
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: 'Failed to update grade symbol',
        color: 'red',
      });
      console.error('Error updating grade:', error);
    },
  });
  const handleSubmit = () => {
    if (mode === 'automatic') {
      const automaticGrade = getLetterGrade(weightedTotal);
      gradeUpdateMutation.mutate({
        grade: automaticGrade,
        weightedTotal,
      });
    } else {
      gradeUpdateMutation.mutate({
        grade: selectedGrade as (typeof gradeEnum)[number],
        weightedTotal,
      });
    }
  };

  return (
    <>
      <Tooltip label='Change Grade Symbol'>
        <ActionIcon variant='subtle' color='blue' onClick={open}>
          <IconEdit size={16} />
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap='md' align='center'>
            <Text fw={600} size='lg'>
              Change Grade Symbol
            </Text>
          </Group>
        }
        size='md'
        centered
      >
        <Stack gap='md'>
          <Group gap='md' align='center'>
            <Text size='sm' fw={500}>
              Student:
            </Text>
            <Text size='sm'>
              {studentName} ({studentId})
            </Text>
          </Group>

          <Group gap='md' align='center'>
            <Text size='sm' fw={500}>
              Current Grade:
            </Text>
            <Text size='sm' fw={600}>
              {currentGrade || 'Not set'}
            </Text>
          </Group>

          <Group gap='md' align='center'>
            <Text size='sm' fw={500}>
              Weighted Total:
            </Text>
            <Text size='sm'>{weightedTotal}%</Text>
          </Group>

          <SegmentedControl
            data={[
              { label: 'Automatic', value: 'automatic' },
              { label: 'Manual', value: 'manual' },
            ]}
            value={mode}
            onChange={(value) => setMode(value as 'automatic' | 'manual')}
            fullWidth
          />

          {mode === 'automatic' ? (
            <Stack gap='xs'>
              <Text size='sm' c='dimmed'>
                The grade will be automatically generated based on the weighted
                total.
              </Text>
              <Text size='sm' fw={500}>
                Calculated Grade: {getLetterGrade(weightedTotal)}
              </Text>
            </Stack>
          ) : (
            <Stack gap='xs'>
              <Text size='sm' c='dimmed'>
                Choose a manual grade symbol:
              </Text>
              <Radio.Group
                value={selectedGrade}
                onChange={(value) =>
                  setSelectedGrade(value as 'PP' | 'Def' | 'ANN')
                }
              >
                <Group gap='md'>
                  <Radio value='PP' label='PP' />
                  <Radio value='Def' label='Def' />
                  <Radio value='ANN' label='ANN' />
                </Group>
              </Radio.Group>
            </Stack>
          )}

          <Group justify='flex-end' mt='md'>
            <Button variant='outline' onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={gradeUpdateMutation.isPending}
            >
              Update Grade
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
