'use client';

import React from 'react';
import { updateBlockedStudent } from '@/server/blocked-students/actions';
import { Switch, Group, Text, Paper, Stack, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLock, IconLockOpen, IconCheck, IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type Props = {
  id: number;
  currentStatus: 'blocked' | 'unblocked';
  stdNo: string | number;
  studentName: string;
};

export default function StudentStatusSwitch({
  id,
  currentStatus,
  stdNo,
  studentName,
}: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newStatus: 'blocked' | 'unblocked') => {
      return updateBlockedStudent(id, { status: newStatus });
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-students'] });
      notifications.show({
        title: 'Status Updated',
        message: `Student ${stdNo} has been ${newStatus}`,
        color: newStatus === 'blocked' ? 'red' : 'green',
        icon: <IconCheck size='1rem' />,
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: 'Failed to update student status. Please try again.',
        color: 'red',
        icon: <IconX size='1rem' />,
      });
      console.error('Failed to update student status:', error);
    },
  });

  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked;
    const newStatus = checked ? 'unblocked' : 'blocked';
    mutation.mutate(newStatus);
  };

  const isBlocked = currentStatus === 'blocked';

  return (
    <Paper withBorder p='md' radius='md'>
      <Stack gap='md'>
        <Group justify='space-between' align='center'>
          <Group gap='sm'>
            {isBlocked ? (
              <IconLock size='1.2rem' color='red' />
            ) : (
              <IconLockOpen size='1.2rem' color='green' />
            )}
            <Stack gap={2}>
              <Title order={6} c={isBlocked ? 'red' : 'green'}>
                Student Status
              </Title>
              <Text size='xs' c='dimmed'>
                {studentName} ({stdNo})
              </Text>
            </Stack>
          </Group>
          <Switch
            checked={!isBlocked}
            onChange={handleStatusChange}
            disabled={mutation.isPending}
            size='lg'
            color='green'
            thumbIcon={
              !isBlocked ? (
                <IconLockOpen size='0.8rem' color='green' stroke={3} />
              ) : (
                <IconLock size='0.8rem' color='red' stroke={3} />
              )
            }
            onLabel={
              <Text size='xs' fw={600} c='green'>
                ACTIVE
              </Text>
            }
            offLabel={
              <Text size='xs' fw={600} c='red'>
                BLOCKED
              </Text>
            }
          />
        </Group>
        <Text size='sm' c='dimmed' ta='center'>
          Toggle to {isBlocked ? 'unblock' : 'block'} this student's access
        </Text>
      </Stack>
    </Paper>
  );
}
