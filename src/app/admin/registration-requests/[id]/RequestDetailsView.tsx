'use client';

import { FieldView } from '@/components/adease';
import { registrationRequestStatusEnum } from '@/db/schema';
import { formatSemester } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { Anchor, Flex, Grid, GridCol, Stack, Text } from '@mantine/core';
import Link from 'next/link';

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
          <FieldView label='Structure' underline={false}>
            <Text fw={500}>{value.student.structure?.code}</Text>
          </FieldView>
          <FieldView label='Semester' underline={false}>
            {formatSemester(value.semesterNumber)}
          </FieldView>
        </Stack>
      </GridCol>
    </Grid>
  );
}
