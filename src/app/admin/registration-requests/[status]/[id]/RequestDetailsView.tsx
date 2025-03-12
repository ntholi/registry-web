'use client';

import { FieldView } from '@/components/adease';
import { formatSemester } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import {
  Anchor,
  Badge,
  Flex,
  Stack,
  Text,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';
import Link from 'next/link';

type Props = {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function RequestDetailsView({ value }: Props) {
  return (
    <Stack gap='md'>
      <StudentNameView stdNo={value.stdNo} name={value.student.name} />
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

function StudentNameView({ stdNo, name }: { stdNo: number; name: string }) {
  return (
    <FieldView label='Student' underline={false}>
      <Flex align='center' gap='xs'>
        <Anchor
          component={Link}
          href={`/admin/students/${stdNo}`}
          size='sm'
          fw={500}
        >
          {name} ({stdNo})
        </Anchor>
        <Tooltip label='Copy student number'>
          <ActionIcon
            variant='subtle'
            color='gray'
            size='sm'
            onClick={() => {
              navigator.clipboard.writeText(String(stdNo));
              notifications.show({
                message: 'Student number copied to clipboard',
                color: 'green',
              });
            }}
          >
            <IconCopy size={16} />
          </ActionIcon>
        </Tooltip>
      </Flex>
    </FieldView>
  );
}
