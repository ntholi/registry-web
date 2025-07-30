'use client';

import { formatDateTime } from '@/lib/utils';
import { getClearanceHistoryByStudentNo } from '@/server/registration-clearance/actions';
import {
  Accordion,
  Anchor,
  Badge,
  Center,
  Group,
  Loader,
  Paper,
  Table,
  Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

type Props = {
  stdNo: number;
};

export default function ClearanceHistory({ stdNo }: Props) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['clearanceHistory', stdNo],
    queryFn: () => getClearanceHistoryByStudentNo(stdNo),
  });

  if (isLoading) {
    return (
      <Center pt='xl'>
        <Loader size='md' variant='dots' />
      </Center>
    );
  }

  if (!history?.length) {
    return (
      <Center pt='xl'>
        <Text c='dimmed' size='sm'>
          No history found
        </Text>
      </Center>
    );
  }

  return (
    <Paper radius='md' p={'lg'}>
      <Accordion variant='separated'>
        {history.map((clearance) => (
          <Accordion.Item key={clearance.id} value={clearance.id.toString()}>
            <Accordion.Control>
              <Group justify='space-between' pe={'md'}>
                <Text fw={500}>
                  Term: {clearance.registrationRequest.term.name}
                </Text>
                <Badge
                  color={clearance.status === 'approved' ? 'green' : 'red'}
                  variant='outline'
                  size='sm'
                >
                  {clearance.status}
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Group gap='xs'>Date</Group>
                    </Table.Th>
                    <Table.Th>
                      <Group gap='xs'>Status</Group>
                    </Table.Th>
                    <Table.Th>
                      <Group gap='xs'>Message</Group>
                    </Table.Th>
                    <Table.Th>
                      <Group gap='xs'>Updated By</Group>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {clearance.audits.map((audit) => (
                    <Table.Tr key={audit.id}>
                      <Table.Td>{formatDateTime(audit.date)}</Table.Td>
                      <Table.Td>{audit.newStatus}</Table.Td>
                      <Table.Td>{audit.message || '-'}</Table.Td>
                      <Table.Td>
                        <Anchor
                          component={Link}
                          size='sm'
                          href={`/dashboard/users/${audit.createdBy}`}
                        >
                          {audit.user.name}
                        </Anchor>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Paper>
  );
}
