import React from 'react';
import { Text, Checkbox, Group, Badge, Tooltip } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

type ModuleWithStatus = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  semesterNo: number;
  prerequisites?: Array<{ id: number; code: string; name: string }>;
};

interface ModuleCheckboxProps {
  module: ModuleWithStatus;
  isSelected: boolean;
  onToggle: (checked: boolean) => void;
}

export default function ModuleCheckbox({
  module,
  isSelected,
  onToggle,
}: ModuleCheckboxProps) {
  // Check if a module has prerequisites - if it does, don't allow selection
  const hasPrerequisites = (module: ModuleWithStatus): boolean => {
    return (
      module.prerequisites !== undefined && module.prerequisites.length > 0
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'Compulsory') return 'blue';
    if (status === 'Elective') return 'green';
    if (status.startsWith('Repeat')) return 'orange';
    return 'gray';
  };

  const hasPrereqs = hasPrerequisites(module);
  const isDisabled = hasPrereqs;

  if (isDisabled) {
    // Render disabled module with lock icon
    return (
      <Tooltip label='Cannot select: Module has prerequisites'>
        <Checkbox.Card radius='md' p='md' style={{ opacity: 0.5 }}>
          <Group wrap='nowrap' align='flex-start'>
            <IconLock size={20} />
            <div style={{ flex: 1 }}>
              <Group gap='xs' mb='xs'>
                <Text fw={500} c='dimmed'>
                  {module.code}
                </Text>
                <Badge color='gray' size='sm' variant='light'>
                  {module.status}
                </Badge>
              </Group>
              <Text size='sm' c='dimmed' mb='xs'>
                {module.name}
              </Text>
              <Text size='xs' c='red' mt='xs'>
                Prerequisites:{' '}
                {module.prerequisites?.map((p) => p.code).join(', ')}
              </Text>
            </div>
          </Group>
        </Checkbox.Card>
      </Tooltip>
    );
  }

  // Render selectable module using Checkbox.Card
  return (
    <Checkbox.Card
      radius='md'
      checked={isSelected}
      onClick={() => onToggle(!isSelected)}
      p='md'
      withBorder
    >
      <Group wrap='nowrap' align='flex-start'>
        <Checkbox.Indicator />
        <div style={{ flex: 1 }}>
          <Group gap='xs' mb='xs'>
            <Text fw={500}>{module.code}</Text>
            <Badge color={getStatusColor(module.status)} size='sm'>
              {module.status}
            </Badge>
          </Group>
          <Text size='sm' mb='xs'>
            {module.name}
          </Text>
        </div>
      </Group>
    </Checkbox.Card>
  );
}
