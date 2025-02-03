'use client';

import { Accordion, Center, Loader, Stack, Table, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { getClearanceHistory } from '@/server/registration-clearance/actions';
import { formatDate } from '@/lib/utils';

type Props = {
  clearanceId: number;
};

export default function ClearanceHistory({ clearanceId }: Props) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['clearanceHistory', clearanceId],
    queryFn: () => getClearanceHistory(clearanceId),
  });

  if (isLoading) {
    return (
      <Center pt={'xl'}>
        <Loader size={'sm'} />
      </Center>
    );
  }

  if (!history?.length) {
    return (
      <Center pt={'xl'}>
        <Text c='dimmed' size='sm'>
          No history found
        </Text>
      </Center>
    );
  }

  return (
    <Accordion>
      {history.map((clearance) => (
        <Accordion.Item key={clearance.id} value={clearance.id.toString()}>
          <Accordion.Control>
            <Stack gap='xs'>
              <Text fw={500}>
                Term: {clearance.registrationRequest.term.name}
              </Text>
              <Text size='sm' c='dimmed'>
                Status: {clearance.status}
              </Text>
            </Stack>
          </Accordion.Control>
          <Accordion.Panel>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Message</Table.Th>
                  <Table.Th>Updated By</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {clearance.audits.map((audit) => (
                  <Table.Tr key={audit.id}>
                    <Table.Td>{formatDate(audit.date)}</Table.Td>
                    <Table.Td>{audit.newStatus}</Table.Td>
                    <Table.Td>{audit.message || '-'}</Table.Td>
                    <Table.Td>{audit.createdBy || '-'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
