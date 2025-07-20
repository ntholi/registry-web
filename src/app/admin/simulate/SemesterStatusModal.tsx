'use client';

import { formatSemester } from '@/lib/utils';
import {
  Badge,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  Card,
  ScrollArea,
  Paper,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import {
  IconCalendar,
  IconCheck,
  IconRepeat,
  IconSchool,
} from '@tabler/icons-react';

type SemesterStatusResult = {
  semesterNo: number;
  status: 'Active' | 'Repeat';
};

type SelectedModule = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  semesterNo: number;
  prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  result: SemesterStatusResult | null;
  selectedModules: SelectedModule[];
};

export default function SemesterStatusModal({
  opened,
  onClose,
  result,
  selectedModules,
}: Props) {
  if (!result) return null;

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'green' : 'orange';
  };

  const totalCredits = selectedModules.reduce(
    (sum, module) => sum + module.credits,
    0,
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Semester Enrollment Determination'
      size='xl'
      padding='lg'
    >
      <Stack gap='lg'>
        <Card withBorder p='md' radius='md'>
          <Group justify='space-between' align='center'>
            <Group gap='xs' align='center'>
              <ThemeIcon size='sm' radius='sm' variant='light' color='blue'>
                <IconSchool size={14} />
              </ThemeIcon>
              <Text fw={500} size='sm'>
                Enrollment Determination
              </Text>
            </Group>
            <Badge color={getStatusColor(result.status)} variant='light'>
              {result.status}
            </Badge>
          </Group>

          <Divider my='md' />

          <Group grow>
            <Paper withBorder p='sm' radius='sm'>
              <Text size='xs' c='dimmed' mb={4}>
                Enrollment Semester
              </Text>
              <Text fw={500} size='sm'>
                {formatSemester(result.semesterNo)}
              </Text>
            </Paper>
            <Paper withBorder p='sm' radius='sm'>
              <Text size='xs' c='dimmed' mb={4}>
                Selected Modules
              </Text>
              <Text fw={500} size='sm'>
                {selectedModules.length}
              </Text>
            </Paper>
            <Paper withBorder p='sm' radius='sm'>
              <Text size='xs' c='dimmed' mb={4}>
                Total Credits
              </Text>
              <Text fw={500} size='sm'>
                {totalCredits}
              </Text>
            </Paper>
          </Group>
        </Card>

        <Card withBorder p='md' radius='md'>
          <Text fw={500} size='sm' mb='md'>
            Modules for Enrollment
          </Text>

          <ScrollArea.Autosize mah={400}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Module Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Credits</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Semester</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selectedModules.map((module, index) => (
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
                        color={getModuleStatusColor(module.status)}
                        variant='light'
                        size='sm'
                      >
                        {module.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size='sm' fw={500}>
                        {formatSemester(module.semesterNo, 'short')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea.Autosize>
        </Card>
      </Stack>
    </Modal>
  );
}

function getModuleStatusColor(status: string) {
  if (status === 'Compulsory') return 'blue';
  if (status === 'Elective') return 'green';
  if (status.startsWith('Repeat')) return 'orange';
  return 'gray';
}
