'use client';

import { formatSemester } from '@/lib/utils';
import { getStudentSemesterModules } from '@/server/registration-requests/actions';
import { getStudent, getStudentByUserId } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';
import {
  Accordion,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  NumberFormatter,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconBookmark,
  IconCheck,
  IconInfoCircle,
  IconRefresh,
  IconRepeat,
  IconUser,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';

type ModuleData = Awaited<ReturnType<typeof getStudentSemesterModules>>;
type Student = {
  name: string;
  stdNo: number;
  semester: number;
  program: {
    structureCode: string;
    name: string;
    code: string;
  };
};

export default function RegistrationSimulator() {
  const [stdNo, setStdNo] = useState<string>('');
  const [student, setStudent] = useState<Student | null>(null);
  const [modules, setModules] = useState<ModuleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!stdNo.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a student number',
        color: 'red',
        icon: <IconX size={16} />,
      });
      return;
    }

    setError(null);
    setStudent(null);
    setModules(null);

    startTransition(async () => {
      try {
        const lookup = await getStudent(Number(stdNo));
        if (!lookup) {
          setError('Student not found');
          notifications.show({
            title: 'Student Not Found',
            message: `No student found with number ${stdNo}`,
            color: 'red',
            icon: <IconX size={16} />,
          });
          return;
        }

        const studentData = await getStudentByUserId(lookup.userId);
        if (!studentData) {
          setError('Student data not available');
          return;
        }

        const remarks = getAcademicRemarks(studentData.programs);
        const moduleData = await getStudentSemesterModules(
          studentData,
          remarks,
        );

        const activeProgram = studentData.programs.find(
          (p) => p.status === 'Active',
        );
        if (activeProgram) {
          setStudent({
            name: lookup.name,
            stdNo: lookup.stdNo,
            semester: lookup.sem,
            program: {
              structureCode: activeProgram.structure.code,
              name: activeProgram.structure.program.name,
              code: activeProgram.structure.code,
            },
          });
        }

        setModules(moduleData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        notifications.show({
          title: 'Simulation Error',
          message: errorMessage,
          color: 'red',
          icon: <IconX size={16} />,
        });
      }
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isPending) {
      handleSubmit();
    }
  };

  const compulsoryModules =
    modules?.filter((m) => m.status === 'Compulsory') || [];
  const electiveModules = modules?.filter((m) => m.status === 'Elective') || [];
  const repeatModules =
    modules?.filter((m) => m.status.startsWith('Repeat')) || [];

  const totalCredits =
    modules?.reduce((sum, module) => sum + module.credits, 0) || 0;

  const getStatusColor = (status: string) => {
    if (status === 'Compulsory') return 'blue';
    if (status === 'Elective') return 'green';
    if (status.startsWith('Repeat')) return 'orange';
    return 'gray';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Compulsory') return <IconBookmark size={14} />;
    if (status === 'Elective') return <IconCheck size={14} />;
    if (status.startsWith('Repeat')) return <IconRepeat size={14} />;
    return <IconInfoCircle size={14} />;
  };

  return (
    <Stack gap='lg'>
      <Paper withBorder p='md' radius='md'>
        <Stack gap='md'>
          <Group gap='md' align='flex-end'>
            <TextInput
              placeholder='Enter student number'
              value={stdNo}
              onChange={(e) => setStdNo(e.target.value)}
              onKeyPress={handleKeyPress}
              leftSection={<IconUsers size={16} />}
              flex={1}
              maxLength={10}
            />
            <Button
              onClick={handleSubmit}
              loading={isPending}
              leftSection={<IconRefresh size={16} />}
              disabled={!stdNo.trim()}
            >
              {isPending ? 'Simulating...' : 'Simulate'}
            </Button>
          </Group>
        </Stack>
      </Paper>

      {isPending && (
        <Card withBorder radius='md' p='xl'>
          <Center>
            <Stack gap='md' align='center'>
              <Loader size='lg' color='blue' />
              <Text size='sm' c='dimmed'>
                Processing student registration simulation...
              </Text>
            </Stack>
          </Center>
        </Card>
      )}

      {error && !isPending && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title='Simulation Error'
          color='red'
          variant='light'
        >
          {error}
        </Alert>
      )}

      {student && !isPending && (
        <Card withBorder radius='md' p='lg'>
          <Stack gap='md'>
            <Group gap='xs' align='center'>
              <ThemeIcon size='sm' radius='sm' variant='light' color='teal'>
                <IconUser size={14} />
              </ThemeIcon>
              <Text fw={500} size='sm'>
                Student Information
              </Text>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing='md'>
              <Paper withBorder p='sm' radius='sm'>
                <Text size='xs' c='dimmed' mb={4}>
                  Name
                </Text>
                <Text fw={500} size='sm'>
                  {student.name}
                </Text>
              </Paper>
              <Paper withBorder p='sm' radius='sm'>
                <Text size='xs' c='dimmed' mb={4}>
                  Student Number
                </Text>
                <Text fw={500} size='sm'>
                  {student.stdNo}
                </Text>
              </Paper>
              <Paper withBorder p='sm' radius='sm'>
                <Text size='xs' c='dimmed' mb={4}>
                  Current Semester
                </Text>
                <Text fw={500} size='sm'>
                  {formatSemester(student.semester)}
                </Text>
              </Paper>
              <Paper withBorder p='sm' radius='sm'>
                <Text size='xs' c='dimmed' mb={4}>
                  {student.program.name}
                </Text>
                <Anchor
                  component={Link}
                  size='sm'
                  c='default'
                  href={`/admin/schools/structures/${student.program.structureCode}`}
                >
                  {student.program.code}
                </Anchor>
              </Paper>
            </SimpleGrid>
          </Stack>
        </Card>
      )}

      {modules && modules.length > 0 && !isPending && (
        <Card withBorder radius='md' p='lg'>
          <Stack gap='lg'>
            <Group justify='space-between' align='center'>
              <Group gap='xs' align='center'>
                <Text fw={500} size='sm'>
                  Results
                </Text>
              </Group>
              <Group gap='md'>
                <Badge color='gray' variant='light' size='sm'>
                  {modules.length} Modules
                </Badge>
                <Badge color='blue' variant='light' size='sm'>
                  <NumberFormatter value={totalCredits} /> Credits
                </Badge>
              </Group>
            </Group>

            <Divider />

            <Accordion
              variant='separated'
              radius='sm'
              multiple
              defaultValue={[
                ...(compulsoryModules.length > 0 ? ['compulsory'] : []),
                ...(electiveModules.length > 0 ? ['elective'] : []),
                ...(repeatModules.length > 0 ? ['repeat'] : []),
              ]}
            >
              {compulsoryModules.length > 0 && (
                <Accordion.Item value='compulsory'>
                  <Accordion.Control
                    icon={
                      <ThemeIcon size='sm' color='blue' variant='light'>
                        <IconBookmark size={14} />
                      </ThemeIcon>
                    }
                  >
                    <Group justify='space-between' pr='md'>
                      <Text fw={500}>Compulsory Modules</Text>
                      <Badge color='blue' variant='light' size='sm'>
                        {compulsoryModules.length}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <ModuleTable modules={compulsoryModules} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {electiveModules.length > 0 && (
                <Accordion.Item value='elective'>
                  <Accordion.Control
                    icon={
                      <ThemeIcon size='sm' color='green' variant='light'>
                        <IconCheck size={14} />
                      </ThemeIcon>
                    }
                  >
                    <Group justify='space-between' pr='md'>
                      <Text fw={500}>Elective Modules</Text>
                      <Badge color='green' variant='light' size='sm'>
                        {electiveModules.length}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <ModuleTable modules={electiveModules} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {repeatModules.length > 0 && (
                <Accordion.Item value='repeat'>
                  <Accordion.Control
                    icon={
                      <ThemeIcon size='sm' color='orange' variant='light'>
                        <IconRepeat size={14} />
                      </ThemeIcon>
                    }
                  >
                    <Group justify='space-between' pr='md'>
                      <Text fw={500}>Repeat Modules</Text>
                      <Badge color='orange' variant='light' size='sm'>
                        {repeatModules.length}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <ModuleTable modules={repeatModules} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}
            </Accordion>
          </Stack>
        </Card>
      )}

      {modules && modules.length === 0 && !isPending && !error && (
        <Alert
          icon={<IconInfoCircle size={16} />}
          title='No Modules Found'
          color='blue'
          variant='light'
        >
          No eligible modules found for this student. This could mean the
          student has completed all required modules or there are no modules
          available for their current semester.
        </Alert>
      )}
    </Stack>
  );
}

function ModuleTable({ modules }: { modules: ModuleData }) {
  if (modules.length === 0) {
    return (
      <Text size='sm' c='dimmed' ta='center' py='md'>
        No modules found
      </Text>
    );
  }

  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Code</Table.Th>
            <Table.Th>Module Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Credits</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Semester</Table.Th>
            <Table.Th>Prerequisites</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {modules.map((module, index) => (
            <Table.Tr key={`${module.semesterModuleId}-${index}`}>
              <Table.Td>
                <Text fw={500} size='sm'>
                  {module.code}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{module.name}</Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{module.type}</Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm' fw={500}>
                  {module.credits}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge
                  color={getStatusColor(module.status)}
                  variant='light'
                  size='sm'
                >
                  {module.status}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge color='gray' variant='outline' size='sm'>
                  {module.semesterNo}
                </Badge>
              </Table.Td>
              <Table.Td>
                {module.prerequisites && module.prerequisites.length > 0 ? (
                  <Tooltip
                    label={module.prerequisites.map((p) => p.name).join(', ')}
                    withArrow
                    multiline
                    maw={300}
                  >
                    <Text size='sm' c='red'>
                      {module.prerequisites.length} Failed
                    </Text>
                  </Tooltip>
                ) : (
                  <Text size='sm'>-</Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

function getStatusColor(status: string) {
  if (status === 'Compulsory') return 'blue';
  if (status === 'Elective') return 'green';
  if (status.startsWith('Repeat')) return 'orange';
  return 'gray';
}
