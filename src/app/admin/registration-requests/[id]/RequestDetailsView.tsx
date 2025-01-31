'use client';

import { FieldView } from '@/components/adease';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { Anchor, Stack, Badge, Group, Card, Text } from '@mantine/core';
import Link from 'next/link';

type Props = {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function RequestDetailsView({ value }: Props) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Card withBorder shadow='sm' radius='md' p='lg'>
      <Stack gap='md'>
        <Group justify='space-between'>
          <FieldView label='Student'>
            <Anchor
              component={Link}
              href={`/admin/students/${value.stdNo}`}
              size='sm'
              fw={500}
            >
              {value.student.name} ({value.student.stdNo})
            </Anchor>
          </FieldView>
          <Badge color={getStatusColor(value.status)}>{value.status}</Badge>
        </Group>
        <FieldView label='Term'>
          <Text fw={500}>{value.term.name}</Text>
        </FieldView>
        <FieldView label='Message'>
          <Text>{value.message || 'No message provided'}</Text>
        </FieldView>
      </Stack>
    </Card>
  );
}
