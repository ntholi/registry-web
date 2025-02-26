'use client';

import { FieldView } from '@/components/adease';
import { formatSemester } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { Anchor, Badge, Flex, Stack, Text } from '@mantine/core';
import Link from 'next/link';

type Props = {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function RequestDetailsView({ value }: Props) {
  return (
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
      <Flex justify={'space-between'} w='100%'>
        <FieldView label='Semester' underline={false}>
          {formatSemester(value.semesterNumber)}
        </FieldView>
        <Badge
          radius={'sm'}
          color={value.semesterStatus === 'Active' ? 'blue' : 'red'}
        >
          {value.semesterStatus}
        </Badge>
      </Flex>
    </Stack>
  );
}
