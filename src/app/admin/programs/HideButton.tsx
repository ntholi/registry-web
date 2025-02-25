'use client';

import { updateModuleVisibility } from '@/server/modules/actions';
import { ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type Props = {
  moduleId: number;
  hidden: boolean;
  structureId: number;
};

export default function HideButton({ moduleId, hidden, structureId }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleClick = async () => {
    try {
      setIsUpdating(true);
      await updateModuleVisibility(moduleId, !hidden);
      await queryClient.invalidateQueries({
        queryKey: ['structure', structureId],
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update module visibility',
        color: 'red',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ActionIcon
      variant='subtle'
      onClick={handleClick}
      disabled={isUpdating}
      color={hidden ? 'red' : 'blue'}
    >
      {hidden ? <IconEyeOff size={'1rem'} /> : <IconEye size={'1rem'} />}
    </ActionIcon>
  );
}
