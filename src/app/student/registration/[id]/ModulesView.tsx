'use client';

import { getRegistrationRequest } from '@/server/registration-requests/actions';
import {
  Alert,
  Badge,
  Card,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

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
    .map(({ semesterModule, status }) => (
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
            <div>
              <Title order={2} size='h3' fw={600}>
                Requested Modules
              </Title>
              <Text size='sm' c='dimmed'>
                {requestedModules.length} modules • {totalCredits} total credits
              </Text>
            </div>
          </Group>
        </Group>

        <ScrollArea>
          <Table highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Module</Table.Th>
                <Table.Th w={90}>Status</Table.Th>
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
              Some modules are still pending approval. Please check back later
            </Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
