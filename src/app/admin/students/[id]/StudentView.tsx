'use client';

import { formatDate } from '@/lib/utils';
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
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';
import Link from 'next/link';

type Props = {
  student: Awaited<ReturnType<typeof getStudent>>;
};

export default function StudentView({ student }: Props) {
  if (!student) return null;

  return (
    <Stack gap='xl'>
      {student.user && (
        <Card withBorder>
          <Group wrap='nowrap' gap='xs'>
            <div style={{ flex: 1 }}>
              <Text size='sm' c='dimmed'>
                User
              </Text>
              <Anchor
                component={Link}
                href={`/admin/users/${student.user?.id}`}
                size='sm'
                fw={500}
              >
                {student.user?.email}
              </Anchor>
            </div>
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
          </Group>
        </Card>
      )}
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

      <Paper p='md' radius='md' withBorder>
        <Grid gutter='xl'>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <InfoItem label='Primary Phone' value={student.phone1} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <InfoItem label='Secondary Phone' value={student.phone2} />
          </Grid.Col>
        </Grid>
      </Paper>
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
