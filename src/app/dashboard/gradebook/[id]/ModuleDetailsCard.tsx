'use client';

import { useCurrentTerm } from '@/hooks/use-current-term';
import { toClassName } from '@/lib/utils';
import { getAssignedModuleByUserAndModule } from '@/server/assigned-modules/actions';
import {
  Box,
  Flex,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconBook, IconCalendar, IconChevronDown } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo } from 'react';
import ExportButton from './export/ExportButton';

type ModuleDetailsCardProps = {
  modules: NonNullable<
    Awaited<ReturnType<typeof getAssignedModuleByUserAndModule>>
  >;
};

export default function ModuleDetailsCard({ modules }: ModuleDetailsCardProps) {
  const [programId, setProgramId] = useQueryState('programId');
  const { currentTerm } = useCurrentTerm();

  const moduleOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Programs' }];
    const seen = new Set<number>();

    modules.forEach((module) => {
      const program = module.semesterModule?.semester?.structure.program;
      if (program && !seen.has(program.id)) {
        seen.add(program.id);
        options.push({
          value: program.id.toString(),
          label: toClassName(
            module.semesterModule.semester?.structure.program.code || '',
            module.semesterModule.semester?.name || ''
          ),
        });
      }
    });

    return options;
  }, [modules]);

  useEffect(() => {
    if (programId === undefined) {
      setProgramId(null);
    }
  }, [programId, setProgramId]);

  const program = useMemo(() => {
    if (!programId) {
      return null;
    }
    return modules.find(
      (it) =>
        it.semesterModule?.semester?.structure.program.id === Number(programId)
    )?.semesterModule?.semester?.structure.program;
  }, [modules, programId]);

  return (
    <Paper withBorder p='lg' mb='lg'>
      <Flex justify='space-between' wrap='nowrap'>
        <Stack gap={'xs'}>
          <Title order={2} fw={100}>
            {modules.at(0)?.semesterModule?.module?.name}
          </Title>
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
        <Stack gap={'xs'}>
          <Select
            placeholder='Select Program'
            data={moduleOptions}
            value={programId || ''}
            onChange={(value) => setProgramId(value === '' ? null : value)}
            rightSection={<IconChevronDown size={16} />}
            clearable
          />
          <ExportButton />
        </Stack>
      </Flex>
    </Paper>
  );
}
