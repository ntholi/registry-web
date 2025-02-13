'use client';

import { FieldView } from '@/components/adease';
import { registrationRequestStatusEnum } from '@/db/schema';
import { formatSemester } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { Anchor, Grid, GridCol, Stack, Text } from '@mantine/core';
import Link from 'next/link';
import RequestStatusSwitch from './RequestStatusSwitch';

type Props = {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
  clearanceStatus: (typeof registrationRequestStatusEnum)[number];
};

export default function RequestDetailsView({ value, clearanceStatus }: Props) {
  return (
    <Grid>
      <GridCol span={{ base: 12, md: 7 }}>
        <Stack gap='md'>
          <FieldView label='Student' underline={false}>
            <Anchor
              component={Link}
              href={`/admin/students/${value.stdNo}`}
              size='sm'
              fw={500}
            >
              {value.student.name} ({value.student.stdNo})
            </Anchor>
          </FieldView>
          <FieldView label='Term' underline={false}>
            <Text fw={500}>{value.term.name}</Text>
          </FieldView>
          <FieldView label='Semester' underline={false}>
            {formatSemester(value.semesterNumber)}
          </FieldView>
        </Stack>
      </GridCol>
      <GridCol span={{ base: 12, md: 5 }}>
        <RequestStatusSwitch
          request={{ id: value.id, status: value.status }}
          disabled={clearanceStatus !== 'approved'}
        />
      </GridCol>
    </Grid>
  );
}
