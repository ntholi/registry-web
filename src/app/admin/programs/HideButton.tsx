import { updateModuleVisibility } from '@/server/modules/actions';
import { ActionIcon, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useState } from 'react';

type Props = {
  moduleId: number;
  hidden: boolean;
  onUpdate?: () => void;
};

export default function HideButton({ moduleId, hidden, onUpdate }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await updateModuleVisibility(moduleId, !hidden);
      notifications.show({
        title: hidden ? 'Module Shown' : 'Module Hidden',
        message: `Module has been ${hidden ? 'shown' : 'hidden'} successfully`,
        color: 'green',
      });
      onUpdate?.();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update module visibility',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip label={hidden ? 'Show Module' : 'Hide Module'}>
      <ActionIcon
        variant="light"
        color={hidden ? 'blue' : 'yellow'}
        onClick={handleClick}
        loading={isLoading}
        disabled={isLoading}
      >
        {hidden ? <IconEye size={16} /> : <IconEyeOff size={16} />}
      </ActionIcon>
    </Tooltip>
  );
}