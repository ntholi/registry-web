'use client';

import { useCurrentTerm } from '@/hooks/use-current-term';
import { toClassName } from '@/lib/utils';
import { getAssignedModuleByUserAndModule } from '@/server/assigned-modules/actions';
import { Group, Paper, Select, Stack, Text, Title } from '@mantine/core';
import { IconBook, IconCalendar, IconChevronDown } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo } from 'react';

type ModuleDetailsCardProps = {
  modules: NonNullable<
    Awaited<ReturnType<typeof getAssignedModuleByUserAndModule>>
  >;
};

export default function ModuleDetailsCard({ modules }: ModuleDetailsCardProps) {
  const [semesterModuleId, setSemesterModuleId] =
    useQueryState('semesterModuleId');
  const { currentTerm } = useCurrentTerm();

  const moduleOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Programs' }];

    modules.forEach((module) => {
      if (module.semesterModule) {
        options.push({
          value: module.semesterModule.id.toString(),
          label: toClassName(
            module.semesterModule.semester?.structure.program.code || '',
            module.semesterModule.semester?.name || '',
          ),
        });
      }
    });

    return options;
  }, [modules]);

  useEffect(() => {
    if (semesterModuleId === undefined) {
      setSemesterModuleId(null);
    }
  }, [semesterModuleId, setSemesterModuleId]);

  const program = useMemo(() => {
    if (!semesterModuleId) {
      return null;
    }
    return modules.find(
      (it) => it.semesterModule?.id === Number(semesterModuleId),
    )?.semesterModule?.semester?.structure.program;
  }, [modules, semesterModuleId]);

  return (
    <Paper withBorder p='lg' mb='lg'>
      <Group justify='space-between' wrap='nowrap'>
        <Stack gap='xs' style={{ flex: 1 }}>
          <Group gap='xs' align='center' justify='space-between'>
            <Title order={2} fw={100}>
              {modules.at(0)?.semesterModule?.module?.name}
            </Title>

            <Select
              placeholder='Select Module'
              data={moduleOptions}
              value={semesterModuleId || ''}
              onChange={(value) =>
                setSemesterModuleId(value === '' ? null : value)
              }
              rightSection={<IconChevronDown size={16} />}
              clearable
            />
          </Group>{' '}
          <Group gap='md' align='center'>
            <Paper bg='var(--mantine-color-default)' px='sm' py={3} withBorder>
              <Text ff='monospace' fw={600} size='sm'>
                {modules.at(0)?.semesterModule?.module?.code}
              </Text>
            </Paper>
            <Group gap={5}>
              <IconCalendar size={'1rem'} />
              <Text size='sm' c='dimmed'>
                {currentTerm?.name}
              </Text>
            </Group>

            <Group gap={5} align='center'>
              <IconBook size={'1.1rem'} />
              <Text size='sm' c='dimmed'>
                {program ? `${program.name}` : 'All Programs'}
              </Text>
            </Group>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}
