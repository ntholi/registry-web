'use client';

import { deleteSemesterModule } from '@/server/structures/actions';
import { ActionIcon, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrashFilled } from '@tabler/icons-react';
import React, { useTransition } from 'react';

type DeleteButtonProps = {
  semesterModuleId: number;
  moduleName: string;
};

export default function DeleteButton({
  semesterModuleId,
  moduleName,
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteSemesterModule(semesterModuleId);
        notifications.show({
          title: 'Success',
          message: `${moduleName} has been deleted successfully`,
          color: 'green',
        });
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: `Failed to delete the module. ${error}`,
          color: 'red',
        });
      }
    });
  }

  function openModal() {
    modals.openConfirmModal({
      title: 'Confirm Delete',
      children: (
        <Text size='sm'>Are you sure you want to delete '{moduleName}'?</Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      onConfirm: handleDelete,
      confirmProps: {
        color: 'red',
        loading: isPending,
      },
    });
  }

  return (
    <ActionIcon
      variant='light'
      color='red'
      onClick={openModal}
      loading={isPending}
      disabled={isPending}
    >
      <IconTrashFilled size='1rem' />
    </ActionIcon>
  );
}
