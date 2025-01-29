'use client';

import { getStudent } from '@/server/students/actions';
import {
  Accordion,
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import SemesterStatus from '@/components/SemesterStatus';

type Props = {
  student: Awaited<ReturnType<typeof getStudent>>;
};

export default function AcademicsView({ student }: Props) {
  if (!student?.programs?.length) {
    return (
      <Card shadow='sm' padding='lg' radius='md' withBorder>
        <Text fw={500} c='dimmed'>
          No academic programs found
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap='md'>
      <Accordion variant='separated' radius='md'>
        {student.programs.map((program) => (
          <Accordion.Item key={program.id} value={program.id?.toString() ?? ''}>
            <Accordion.Control>
              <Stack gap='sm'>
                <Text fw={600} size='lg'>
                  {program.name}
                </Text>
                <Group gap={'xs'}>
                  <Text size='sm' c={'dimmed'}>
                    Status:
                  </Text>
                  <Text size='sm'>{program.status}</Text>
                </Group>
              </Stack>
            </Accordion.Control>

            <Accordion.Panel>
              <Stack gap='xl'>
                {program.semesters?.length ? (
                  program.semesters.map((semester) => (
                    <Paper key={semester.id} p='md' withBorder>
                      <Stack gap='md'>
                        <Group justify='space-between'>
                          <Title order={4}>{semester.term}</Title>
                          <SemesterStatus status={semester.status} />
                        </Group>

                        <Divider />

                        {semester.modules?.length ? (
                          <ModuleTable modules={semester.modules} />
                        ) : (
                          <Text c='dimmed'>
                            No modules found for this semester
                          </Text>
                        )}
                      </Stack>
                    </Paper>
                  ))
                ) : (
                  <Text c='dimmed'>
                    No semesters available for this program
                  </Text>
                )}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}

type ModuleTableProps = {
  modules: {
    id: number;
    code: string;
    name: string;
    type: string;
    status: string;
    marks: string;
    grade: string;
    credits: number;
  }[];
};

function ModuleTable({ modules }: ModuleTableProps) {
  return (
    <Box style={{ overflow: 'auto' }}>
      <Table verticalSpacing='xs' striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={100}>Code</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th w={100}>Status</Table.Th>
            <Table.Th w={100}>Marks</Table.Th>
            <Table.Th w={100}>Grade</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {modules.map((module) => (
            <Table.Tr key={module.id}>
              <Table.Td>
                <Text size='sm' fw={500}>
                  {module.code}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{module.name}</Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{module.status}</Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{module.marks}</Text>
              </Table.Td>
              <Table.Td>
                <Badge
                  size='sm'
                  variant='light'
                  color={
                    module.grade === 'F' || module.grade === 'NM'
                      ? 'red'
                      : module.grade === 'D'
                      ? 'orange'
                      : 'green'
                  }
                >
                  {module.grade}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
