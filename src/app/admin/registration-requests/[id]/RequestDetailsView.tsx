'use client';

import { FieldView } from '@/components/adease';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import {
  Anchor,
  Badge,
  Grid,
  GridCol,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import Link from 'next/link';
import RequestStatusSwitch from './RequestStatusSwitch';
import { formatSemester } from '@/lib/utils';

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
    <Grid>
      <GridCol span={{ base: 12, md: 7 }}>
        <Paper withBorder p='md'>
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
        </Paper>
      </GridCol>
      <GridCol span={{ base: 12, md: 5 }}>
        <RequestStatusSwitch request={{ id: value.id, status: value.status }} />
      </GridCol>
    </Grid>
  );
}
