'use client';

import { formatDate, formatPhoneNumber } from '@/lib/utils';
import { getStudent } from '@/server/students/actions';
import {
  ActionIcon,
  Anchor,
  Card,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';
import Link from 'next/link';
import EditStudentUserModal from './EditStudentUserModal';

type Props = {
  student: Awaited<ReturnType<typeof getStudent>>;
};

export default function StudentView({ student }: Props) {
  if (!student) return null;

  return (
    <Stack gap='xl'>
      <Card withBorder>
        <Group wrap='nowrap' gap='xs'>
          <div style={{ flex: 1 }}>
            <Text size='sm' c='dimmed'>
              User
            </Text>
            {student.user ? (
              <Anchor
                component={Link}
                href={`/admin/users/${student.user?.id}`}
                size='sm'
                fw={500}
              >
                {student.user?.email}
              </Anchor>
            ) : (
              <Text size='sm' c='dimmed'>
                No user assigned
              </Text>
            )}
          </div>
          {student.user && (
            <Tooltip label='Copy'>
              <ActionIcon
                variant='subtle'
                color='gray'
                onClick={() => {
                  navigator.clipboard.writeText(String(student.user?.email));
                  notifications.show({
                    message: 'Copied to clipboard',
                    color: 'green',
                  });
                }}
              >
                <IconCopy size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          <EditStudentUserModal
            studentStdNo={student.stdNo}
            currentUser={student.user}
          />
        </Group>
      </Card>
      <div>
        <Paper p='md' radius='md' withBorder>
          <Grid gutter='xl'>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='Student Number' value={student.stdNo} copyable />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='Full Name' value={student.name} copyable />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='National ID' value={student.nationalId} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem
                label='Date of Birth'
                value={formatDate(student.dateOfBirth)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='Gender' value={student.gender} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='Marital Status' value={student.maritalStatus} />
            </Grid.Col>
          </Grid>
        </Paper>
      </div>

      <div>
        <Title order={4} mb='xs' fw={100}>
          Contact Information
        </Title>
        <Paper p='md' radius='md' withBorder>
          {' '}
          <Grid gutter='xl'>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem
                label='Primary Phone'
                value={formatPhoneNumber(student.phone1)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem
                label='Secondary Phone'
                value={formatPhoneNumber(student.phone2)}
              />
            </Grid.Col>
          </Grid>
        </Paper>
      </div>
    </Stack>
  );
}

function InfoItem({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: number | string | null;
  copyable?: boolean;
}) {
  return (
    <Group wrap='nowrap' gap='xs'>
      <div style={{ flex: 1 }}>
        <Text size='sm' c='dimmed'>
          {label}
        </Text>
        <Text size='sm' fw={500}>
          {value ?? 'N/A'}
        </Text>
      </div>
      {copyable && value && (
        <Tooltip label='Copy'>
          <ActionIcon
            variant='subtle'
            color='gray'
            onClick={() => {
              navigator.clipboard.writeText(String(value));
              notifications.show({
                message: 'Copied to clipboard',
                color: 'green',
              });
            }}
          >
            <IconCopy size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
