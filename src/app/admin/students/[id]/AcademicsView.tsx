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
      <Accordion variant='contained'>
        {student.programs.map((program) => (
          <Accordion.Item key={program.id} value={program.id?.toString() ?? ''}>
            <Accordion.Control>
              <Group gap='xl'>
                <div>
                  <Text fw={600} size='lg'>
                    {program.name}
                  </Text>
                  <Text size='sm' c='dimmed' mt={4}>
                    {program.code}
                  </Text>
                </div>
              </Group>
            </Accordion.Control>

            <Accordion.Panel>
              <Stack gap='xl'>
                {program.semesters?.length ? (
                  program.semesters.map((semester) => (
                    <Paper key={semester.id} p='md' withBorder>
                      <Stack gap='md'>
                        <Group justify='space-between'>
                          <Title order={4}>{semester.term}</Title>
                          <Badge size='sm'>{semester.status}</Badge>
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
    <Box>
      <Table verticalSpacing='sm'>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Code</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Credits</Table.Th>
            <Table.Th>Marks</Table.Th>
            <Table.Th>Grade</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {modules.map((module) => (
            <Table.Tr key={module.id}>
              <Table.Td>
                <Text fw={500}>{module.code}</Text>
              </Table.Td>
              <Table.Td>{module.name}</Table.Td>
              <Table.Td>
                <Text size='sm'>{module.type}</Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{module.status}</Text>
              </Table.Td>
              <Table.Td>{module.credits}</Table.Td>
              <Table.Td>{module.marks}</Table.Td>
              <Table.Td>
                <Badge
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
