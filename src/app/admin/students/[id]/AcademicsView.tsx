'use client';

import { useState } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Box,
  UnstyledButton,
  ActionIcon,
  Table,
  Accordion,
} from '@mantine/core';
import { IconBook, IconChevronLeft, IconSchool } from '@tabler/icons-react';
import { getStudent } from '@/server/students/actions';

type Props = {
  student: Awaited<ReturnType<typeof getStudent>>;
};

export default function AcademicsView({ student }: Props) {
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const currentProgram =
    selectedProgram !== null ? student?.programs[selectedProgram] : null;

  if (selectedProgram !== null && currentProgram) {
    return (
      <Stack>
        <Group>
          <ActionIcon
            variant='subtle'
            size='lg'
            onClick={() => setSelectedProgram(null)}
            aria-label='Back to programs'
          >
            <IconChevronLeft />
          </ActionIcon>
          <Box>
            <Text size='sm' c='dimmed'>
              Program
            </Text>
            <Title order={3}>{currentProgram.name}</Title>
          </Box>
        </Group>

        <Card withBorder shadow='sm'>
          <Group>
            <Badge>{currentProgram.level}</Badge>
            <Text size='sm'>{currentProgram.description}</Text>
          </Group>
        </Card>

        <Accordion variant='contained'>
          {currentProgram.semesters.map((semester) => (
            <Accordion.Item key={semester.id} value={semester.id.toString()}>
              <Accordion.Control>
                <Group>
                  <Text fw={500}>Semester {semester.number}</Text>
                  <Badge size='sm' variant='outline'>
                    {semester.modules.length} Modules
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Code</Table.Th>
                      <Table.Th>Module Name</Table.Th>
                      <Table.Th>Credits</Table.Th>
                      <Table.Th>Grade</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {semester.modules.map((module) => (
                      <Table.Tr key={module.id}>
                        <Table.Td>
                          <Group gap='xs'>
                            <IconBook
                              size={16}
                              style={{ color: 'var(--mantine-color-gray-6)' }}
                            />
                            {module.code}
                          </Group>
                        </Table.Td>
                        <Table.Td>{module.name}</Table.Td>
                        <Table.Td>{module.credits}</Table.Td>
                        <Table.Td>{module.grade || '-'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    );
  }

  return (
    <Stack>
      <Title order={2}>Academic Programs</Title>
      <Group grow>
        {student.programs.map((program, index) => (
          <UnstyledButton
            key={program.id}
            onClick={() => setSelectedProgram(index)}
            style={{ flex: '1 1 300px' }}
          >
            <Card
              withBorder
              shadow='sm'
              padding='lg'
              radius='md'
              style={{
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                ':hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 'var(--mantine-shadow-md)',
                },
              }}
            >
              <Stack gap='xs'>
                <Group>
                  <IconSchool
                    size={24}
                    style={{ color: 'var(--mantine-color-gray-6)' }}
                  />
                  <Box>
                    <Text fw={500} size='lg' lineClamp={1}>
                      {program.name}
                    </Text>
                    <Text size='sm' c='dimmed'>
                      {program.level}
                    </Text>
                  </Box>
                </Group>
                <Text size='sm' lineClamp={2} c='dimmed'>
                  {program.description}
                </Text>
                <Badge variant='outline' w='fit-content'>
                  {program.semesters.length} Semesters
                </Badge>
              </Stack>
            </Card>
          </UnstyledButton>
        ))}
      </Group>
    </Stack>
  );
}
