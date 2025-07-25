'use client';

import { getRegistrationRequest } from '@/server/registration-requests/actions';
import {
  Card,
  Table,
  Stack,
  Text,
  Badge,
  Title,
  Group,
  ThemeIcon,
  Alert,
  ScrollArea,
} from '@mantine/core';
import { IconBooks, IconInfoCircle } from '@tabler/icons-react';

type Props = {
  registration: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function ModulesView({ registration }: Props) {
  const { requestedModules } = registration;

  if (requestedModules.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size='1rem' />} color='blue'>
        No modules have been requested for this registration.
      </Alert>
    );
  }

  const rows = requestedModules
    .sort((a, b) => {
      // Sort by module status - compulsory first, then by module code
      const aIsRepeat = a.moduleStatus.startsWith('Repeat');
      const bIsRepeat = b.moduleStatus.startsWith('Repeat');
      const aIsCompulsory = a.moduleStatus === 'Compulsory';
      const bIsCompulsory = b.moduleStatus === 'Compulsory';

      if (aIsCompulsory && !bIsCompulsory) return -1;
      if (!aIsCompulsory && bIsCompulsory) return 1;
      if (aIsRepeat && !bIsRepeat) return 1;
      if (!aIsRepeat && bIsRepeat) return -1;

      return (a.semesterModule.module?.code || '').localeCompare(
        b.semesterModule.module?.code || ''
      );
    })
    .map(({ semesterModule, moduleStatus, status }) => (
      <Table.Tr key={semesterModule.id}>
        <Table.Td>
          <Stack gap={2}>
            <Text fw={500} ff='monospace' size='sm'>
              {semesterModule.module!.code}
            </Text>
            <Text size='xs' c='dimmed' lineClamp={2}>
              {semesterModule.module!.name}
            </Text>
          </Stack>
        </Table.Td>
        <Table.Td ta='center' w={60}>
          <Text fw={500} size='sm'>
            {semesterModule.credits}
          </Text>
        </Table.Td>
        <Table.Td w={100}>
          <Badge
            variant='light'
            size='xs'
            color={
              moduleStatus === 'Compulsory'
                ? 'green'
                : moduleStatus.startsWith('Repeat')
                  ? 'red'
                  : 'blue'
            }
          >
            {moduleStatus}
          </Badge>
        </Table.Td>
        <Table.Td w={80}>
          <Badge
            variant='light'
            size='xs'
            color={
              status === 'registered'
                ? 'green'
                : status === 'rejected'
                  ? 'red'
                  : 'gray'
            }
          >
            {status}
          </Badge>
        </Table.Td>
      </Table.Tr>
    ));

  const totalCredits = requestedModules.reduce(
    (sum, { semesterModule }) => sum + (semesterModule.credits || 0),
    0
  );

  const approvedCredits = requestedModules
    .filter(({ status }) => status === 'registered')
    .reduce(
      (sum, { semesterModule }) => sum + (semesterModule.credits || 0),
      0
    );

  return (
    <Card withBorder p='md' radius='md'>
      <Stack gap='md'>
        <Group justify='space-between' align='flex-start' wrap='wrap'>
          <Group gap='sm'>
            <ThemeIcon variant='light' size='lg'>
              <IconBooks size='1.2rem' />
            </ThemeIcon>
            <div>
              <Title order={2} size='h3' fw={600}>
                Requested Modules
              </Title>
              <Text size='sm' c='dimmed'>
                {requestedModules.length} modules • {totalCredits} total credits
                {approvedCredits > 0 &&
                  ` • ${approvedCredits} approved credits`}
              </Text>
            </div>
          </Group>
        </Group>

        <ScrollArea>
          <Table highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Module</Table.Th>
                <Table.Th ta='center' w={60}>
                  Credits
                </Table.Th>
                <Table.Th w={100}>Type</Table.Th>
                <Table.Th w={80}>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>

        {totalCredits !== approvedCredits && (
          <Alert
            icon={<IconInfoCircle size='1rem' />}
            color='blue'
            variant='light'
          >
            <Text size='sm'>
              Some modules are still pending approval. You will be notified once
              all clearances are complete.
            </Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
