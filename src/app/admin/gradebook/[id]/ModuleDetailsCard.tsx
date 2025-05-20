'use client';

import { toClassName } from '@/lib/utils';
import { getAssignedModuleByUserAndModule } from '@/server/assigned-modules/actions';
import { Group, Paper, Select, Stack, Text, Title } from '@mantine/core';
import { IconCalendar, IconChevronDown } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo } from 'react';

type ModuleDetailsCardProps = {
  modules: NonNullable<
    Awaited<ReturnType<typeof getAssignedModuleByUserAndModule>>
  >;
};

export default function ModuleDetailsCard({ modules }: ModuleDetailsCardProps) {
  const [selectedProgram, setSelectedProgram] = useQueryState('program');

  const programOptions = useMemo(() => {
    if (modules.length <= 1) return [{ value: 'all', label: 'All Programs' }];

    const options = [{ value: 'all', label: 'All Programs' }];

    modules.forEach((module) => {
      if (module.semesterModule?.semester?.structure?.program) {
        options.push({
          value: module.semesterModule.semester.structure.program.id.toString(),
          label: toClassName(
            module.semesterModule.semester.structure.program.code,
            module.semesterModule.semester.name,
          ),
        });
      }
    });

    return options;
  }, [modules]);

  useEffect(() => {
    if (!selectedProgram) {
      setSelectedProgram('all');
    }
  }, [selectedProgram, setSelectedProgram]);

  return (
    <Paper withBorder p='lg' mb='lg'>
      <Group justify='space-between' wrap='nowrap'>
        <Stack gap='xs' style={{ flex: 1 }}>
          <Group gap='xs' align='center' justify='space-between'>
            <Title order={2} fw={100}>
              {modules[0].semesterModule.module!.name}
            </Title>

            <Select
              placeholder='Select Program'
              data={programOptions}
              value={selectedProgram || 'all'}
              onChange={(value) => setSelectedProgram(value || 'all')}
              rightSection={<IconChevronDown size={16} />}
            />
          </Group>

          <Group gap='md'>
            <Group gap='xs'>
              <IconCalendar size={16} stroke={1.5} />
              <Text size='sm' c='dimmed'>
                {modules[0].semesterModule.semesterId
                  ? 'Current Semester'
                  : 'No Semester Assigned'}
              </Text>
            </Group>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}
