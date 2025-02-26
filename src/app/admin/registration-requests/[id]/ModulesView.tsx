'use client';

import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { Badge, Box, Text, Table, Title, Stack, Flex } from '@mantine/core';

type Props = {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function ModulesView({ value }: Props) {
  const { requestedModules } = value;

  const rows = requestedModules.map(({ module, moduleStatus }) => (
    <Table.Tr key={module.id}>
      <Table.Td fw={500}>{module.code}</Table.Td>
      <Table.Td>{module.name}</Table.Td>
      <Table.Td>{module.credits}</Table.Td>
      <Table.Td>{module.type}</Table.Td>
      <Table.Td>
        <Badge
          variant='light'
          size='sm'
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
    </Table.Tr>
  ));

  return (
    <Stack>
      <Flex justify='space-between' align='center'>
        <Title order={4}>Modules</Title>
        <Text c='dimmed' size='sm'>
          {requestedModules.length}{' '}
          {requestedModules.length === 1 ? 'Module' : 'Modules'}
        </Text>
      </Flex>

      <Table highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Module Code</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Credits</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Stack>
  );
}
