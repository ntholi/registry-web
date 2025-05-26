'use client';

import { deleteAssignedModule } from '@/server/assigned-modules/actions';
import { useQueryClient } from '@tanstack/react-query';
import { ActionIcon, Text, Tooltip, Loader } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

type Props = {
  assignmentId: number;
  moduleName: string;
  userId: string;
};

export default function DeleteModuleButton({
  assignmentId,
  moduleName,
  userId,
}: Props) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteModule = async () => {
    modals.openConfirmModal({
      title: 'Delete Module Assignment',
      children: (
        <Text size='sm'>
          Are you sure you want to remove the assignment for{' '}
          <Text span fw={500}>
            {moduleName}
          </Text>
          ? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteAssignedModule(assignmentId);
          await queryClient.invalidateQueries({
            queryKey: ['assigned-modules', userId],
          });
          notifications.show({
            title: 'Success',
            message: 'Module assignment removed successfully',
            color: 'green',
          });
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: 'Failed to remove module assignment',
            color: 'red',
          });
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };
  return (
    <Tooltip label='Remove assignment'>
      <ActionIcon
        variant='subtle'
        color='red'
        onClick={handleDeleteModule}
        loading={isDeleting}
        disabled={isDeleting}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Tooltip>
  );
}
