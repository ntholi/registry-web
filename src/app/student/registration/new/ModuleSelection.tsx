import React from 'react';
import {
  Stack,
  Text,
  Checkbox,
  Group,
  Badge,
  LoadingOverlay,
  Alert,
  Title,
  Accordion,
  Tooltip,
} from '@mantine/core';
import { IconInfoCircle, IconLock } from '@tabler/icons-react';
import { StudentModuleStatus } from '@/db/schema';

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

type SelectedModule = {
  moduleId: number;
  moduleStatus: StudentModuleStatus;
};

interface ModuleSelectionProps {
  modules: ModuleWithStatus[];
  selectedModules: SelectedModule[];
  onSelectionChange: (modules: SelectedModule[]) => void;
  loading: boolean;
}

export default function ModuleSelection({
  modules,
  selectedModules,
  onSelectionChange,
  loading,
}: ModuleSelectionProps) {
  // Check if a module has prerequisites - if it does, don't allow selection
  const hasPrerequisites = (module: ModuleWithStatus): boolean => {
    return (
      module.prerequisites !== undefined && module.prerequisites.length > 0
    );
  };

  const handleModuleToggle = (module: ModuleWithStatus, checked: boolean) => {
    // Prevent selection if module has prerequisites
    if (hasPrerequisites(module)) {
      return;
    }

    if (checked) {
      const newModule: SelectedModule = {
        moduleId: module.semesterModuleId,
        moduleStatus:
          module.status === 'Compulsory'
            ? 'Compulsory'
            : module.status === 'Elective'
              ? 'Compulsory'
              : module.status.startsWith('Repeat')
                ? 'Repeat1'
                : 'Compulsory',
      };
      onSelectionChange([...selectedModules, newModule]);
    } else {
      onSelectionChange(
        selectedModules.filter(
          (selected) => selected.moduleId !== module.semesterModuleId
        )
      );
    }
  };

  const isModuleSelected = (moduleId: number) => {
    return selectedModules.some((selected) => selected.moduleId === moduleId);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Compulsory') return 'blue';
    if (status === 'Elective') return 'green';
    if (status.startsWith('Repeat')) return 'orange';
    return 'gray';
  };

  const renderModule = (module: ModuleWithStatus) => {
    const hasPrereqs = hasPrerequisites(module);
    const isDisabled = hasPrereqs;
    const isSelected = isModuleSelected(module.semesterModuleId);

    if (isDisabled) {
      // Render disabled module with lock icon
      return (
        <Tooltip
          key={module.semesterModuleId}
          label='Cannot select: Module has prerequisites'
        >
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
        key={module.semesterModuleId}
        radius='md'
        checked={isSelected}
        onClick={() => handleModuleToggle(module, !isSelected)}
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
  };

  if (loading) {
    return (
      <div style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <Alert
        icon={<IconInfoCircle size='1rem' />}
        title='No Modules Available'
        color='orange'
      >
        No modules are available for registration at this time.
      </Alert>
    );
  }

  const compulsoryModules = modules.filter((m) => m.status === 'Compulsory');
  const electiveModules = modules.filter((m) => m.status === 'Elective');
  const repeatModules = modules.filter((m) => m.status.startsWith('Repeat'));

  return (
    <Stack gap='lg' mt='md'>
      <div>
        <Title order={4} mb='sm'>
          Select Your Modules
        </Title>
        <Text size='sm' c='dimmed'>
          Choose the modules you want to register for this semester. Modules
          with prerequisites cannot be selected.
        </Text>
      </div>

      <Accordion
        multiple
        defaultValue={['compulsory', 'elective', 'repeat']}
        variant='separated'
      >
        {compulsoryModules.length > 0 && (
          <Accordion.Item value='compulsory'>
            <Accordion.Control>
              <Group justify='space-between'>
                <Text fw={500}>Compulsory Modules</Text>
                <Badge color='blue' variant='light'>
                  {compulsoryModules.length} modules
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap='sm'>{compulsoryModules.map(renderModule)}</Stack>
            </Accordion.Panel>
          </Accordion.Item>
        )}

        {electiveModules.length > 0 && (
          <Accordion.Item value='elective'>
            <Accordion.Control>
              <Group justify='space-between'>
                <Text fw={500}>Elective Modules</Text>
                <Badge color='green' variant='light'>
                  {electiveModules.length} modules
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap='sm'>{electiveModules.map(renderModule)}</Stack>
            </Accordion.Panel>
          </Accordion.Item>
        )}

        {repeatModules.length > 0 && (
          <Accordion.Item value='repeat'>
            <Accordion.Control>
              <Group justify='space-between'>
                <Text fw={500}>Repeat Modules</Text>
                <Badge color='orange' variant='light'>
                  {repeatModules.length} modules
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap='sm'>{repeatModules.map(renderModule)}</Stack>
            </Accordion.Panel>
          </Accordion.Item>
        )}
      </Accordion>

      {selectedModules.length > 0 && (
        <Alert icon={<IconInfoCircle size='1rem' />} color='blue'>
          You have selected {selectedModules.length} module
          {selectedModules.length !== 1 ? 's' : ''}
          for registration.
        </Alert>
      )}
    </Stack>
  );
}
