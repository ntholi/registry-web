'use client';

import SemesterStatus from '@/components/SemesterStatus';
import { getStudent } from '@/server/students/actions';
import {
  Accordion,
  Badge,
  Card,
  Divider,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';

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

  const getProgramStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Changed':
        return 'blue';
      case 'Completed':
        return 'cyan';
      case 'Deleted':
        return 'red';
      case 'Inactive':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <Stack gap='md'>
      <Accordion variant='separated' radius='md'>
        {student.programs.map((program) => (
          <Accordion.Item key={program.id} value={program.id?.toString() ?? ''}>
            <Accordion.Control>
              <Stack gap={'xs'}>
                <Text>{program.name}</Text>
                <Group gap={'xs'}>
                  <Badge
                    color={getProgramStatusColor(program.status)}
                    size='xs'
                    variant='light'
                  >
                    {program.status}
                  </Badge>
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
                          <Title order={4} size={'1rem'}>
                            {semester.term}
                          </Title>
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
    <Table verticalSpacing='xs'>
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={90}>Code</Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th w={100}>Status</Table.Th>
          <Table.Th w={62}>Marks</Table.Th>
          <Table.Th w={60}>Grade</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {modules.map((module) => (
          <Table.Tr key={module.id}>
            <Table.Td>
              <Text size='sm'>{module.code}</Text>
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
  );
}
