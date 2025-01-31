'use client';

import { FieldView } from '@/components/adease';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { Anchor, Stack } from '@mantine/core';
import Link from 'next/link';

type Props = {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function RequestDetailsView({ value }: Props) {
  return (
    <Stack>
      <FieldView label='Student'>
        <Anchor
          component={Link}
          href={`/admin/students/${value.stdNo}`}
          size='sm'
          fw={500}
        >
          {value.student.name}
        </Anchor>
      </FieldView>
      <FieldView label='Term'>{value.term.name}</FieldView>
      <FieldView label='Status'>{value.status}</FieldView>
      <FieldView label='Message'>{value.message}</FieldView>
    </Stack>
  );
}
