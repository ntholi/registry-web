'use client';

import React from 'react';
import { Accordion, Table, Text, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

import { getClearanceHistory } from '@/server/registration-clearance/actions';
import { registrationClearances } from '@/db/schema';

type Props = {
  clearanceId: number;
};

type RegistrationClearance = typeof registrationClearances.$inferSelect;
type RegistrationClearanceAudit = typeof registrationClearances.$inferSelect;

type ClearanceWithAudit = RegistrationClearance & {
  registrationRequest: {
    term: {
      name: string;
    };
  };
  audits: RegistrationClearanceAudit[];
};

export default function ClearanceHistory({ clearanceId }: Props) {
  const { data: history, isLoading } = useQuery<ClearanceWithAudit[]>({
    queryKey: ['clearanceHistory', clearanceId],
    queryFn: () => getClearanceHistory(clearanceId),
  });

  if (isLoading) {
    return <Text>Loading history...</Text>;
  }

  if (!history?.length) {
    return <Text>No history found</Text>;
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
                    <Table.Td>
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td>{audit.status}</Table.Td>
                    <Table.Td>{audit.message || '-'}</Table.Td>
                    <Table.Td>{audit.updatedBy || '-'}</Table.Td>
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
