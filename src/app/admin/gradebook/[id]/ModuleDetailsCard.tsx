'use client';

import { getAssignedModuleByUserAndModule } from '@/server/assigned-modules/actions';
import { getStudentsBySemesterModuleId } from '@/server/students/actions';
import { Paper, Group, Stack, Text, Title, Select, Box } from '@mantine/core';
import {
  IconCalendar,
  IconUserCheck,
  IconChevronDown,
} from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

type ModuleDetailsCardProps = {
  module: NonNullable<
    Awaited<ReturnType<typeof getAssignedModuleByUserAndModule>>
  >;
  studentsCount?: number;
};

export default function ModuleDetailsCard({
  module,
  studentsCount,
}: ModuleDetailsCardProps) {
  const [selectedProgram, setSelectedProgram] = useQueryState('program');

  const { data: students } = useQuery({
    queryKey: ['students', module.semesterModuleId],
    queryFn: () => getStudentsBySemesterModuleId(module.semesterModuleId),
  });

  const programOptions = useMemo(() => {
    if (!students) return [{ value: 'all', label: 'All Programs' }];

    // Start with 'All Programs' option
    const options = [{ value: 'all', label: 'All Programs' }];
    
    // Create a map to track unique programs
    const uniquePrograms = new Map();
    
    // Add all unique programs from students
    students.forEach(student => {
      if (student.program && !uniquePrograms.has(student.program.id)) {
        uniquePrograms.set(student.program.id, student.program.name);
        options.push({
          value: student.program.id.toString(),
          label: student.program.name,
        });
      }
    });

    return options;
  }, [students]);

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
              {module.semesterModule.module!.name}
            </Title>

            <Select
              placeholder='Select Program'
              data={programOptions}
              value={selectedProgram || 'all'}
              onChange={(value) => setSelectedProgram(value || 'all')}
              rightSection={<IconChevronDown size={16} />}
              styles={(theme) => ({
                root: {
                  minWidth: '200px',
                },
                input: {
                  fontWeight: 500,
                },
              })}
            />
          </Group>

          <Group gap='md'>
            <Group gap='xs'>
              <IconCalendar size={16} stroke={1.5} />
              <Text size='sm' c='dimmed'>
                {module.semesterModule.semesterId
                  ? 'Current Semester'
                  : 'No Semester Assigned'}
              </Text>
            </Group>

            <Group gap='xs'>
              <IconUserCheck size={16} stroke={1.5} />
              <Text size='sm' c='dimmed'>
                {studentsCount !== undefined
                  ? `${studentsCount} Students Enrolled`
                  : 'Students Enrolled'}
              </Text>
            </Group>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}
