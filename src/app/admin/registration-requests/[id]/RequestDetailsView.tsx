'use client';

import { FieldView } from '@/components/adease';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { Stack } from '@mantine/core';

type Props = {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function RequestDetailsView({ value }: Props) {
  return (
    <Stack>
      <FieldView label='Std No'>{value.stdNo}</FieldView>
      <FieldView label='Term'>{value.term.name}</FieldView>
      <FieldView label='Status'>{value.status}</FieldView>
      <FieldView label='Message'>{value.message}</FieldView>
    </Stack>
  );
}
