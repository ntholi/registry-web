'use client';

import { FieldView } from '@/components/adease';
import { formatSemester } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration/requests/actions';
import { getSponsoredStudent } from '@/server/sponsors/actions';
import {
  ActionIcon,
  Anchor,
  Badge,
  Flex,
  Paper,
  SimpleGrid,
  Stack,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';
import Link from 'next/link';

type Props = {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
  sponsorship?: Awaited<ReturnType<typeof getSponsoredStudent>> | null;
};

export default function RequestDetailsView({ value, sponsorship }: Props) {
  return (
    <Stack gap='md'>
      <StudentNameView stdNo={value.stdNo} name={value.student.name} />

      <FieldView label='Term' underline={false}>
        {value.term.name}
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

      {sponsorship && (
        <Paper withBorder p={'md'}>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <FieldView label='Sponsor' underline={false}>
              {sponsorship.sponsor?.name || '—'}
            </FieldView>
            <FieldView label='Borrower No.' underline={false}>
              {sponsorship.borrowerNo || '—'}
            </FieldView>
            <FieldView label='Bank Name' underline={false}>
              {sponsorship.bankName || '—'}
            </FieldView>
            <FieldView label='Account Number' underline={false}>
              {sponsorship.accountNumber || '—'}
            </FieldView>
          </SimpleGrid>
        </Paper>
      )}
    </Stack>
  );
}

function StudentNameView({ stdNo, name }: { stdNo: number; name: string }) {
  return (
    <FieldView label='Student' underline={false}>
      <Flex align='center' gap='xs'>
        <Anchor
          component={Link}
          href={`/dashboard/students/${stdNo}`}
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
