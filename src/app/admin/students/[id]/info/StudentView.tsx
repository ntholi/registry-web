'use client';

import { formatDate, formatPhoneNumber } from '@/lib/utils';
import { getStudent } from '@/server/students/actions';
import {
  ActionIcon,
  Anchor,
  Box,
  Card,
  CopyButton,
  Flex,
  Grid,
  Group,
  Paper,
  Badge,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import Link from 'next/link';
import EditStudentUserModal from '../AcademicsView/EditStudentUserModal';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/db/schema';
import { getProgramStatusColor } from '../AcademicsView';
import StructureChange from './StructureChange';

type Props = {
  student: Awaited<ReturnType<typeof getStudent>>;
};

export default function StudentView({ student }: Props) {
  const { data: session } = useSession();
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
          {session?.user?.role &&
            (['admin', 'registry'] as UserRole[]).includes(
              session.user.role,
            ) && (
              <EditStudentUserModal
                studentStdNo={student.stdNo}
                currentUser={student.user}
              />
            )}
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

      {student.programs && student.programs.length > 0 && (
        <div>
          <Flex justify='space-between'>
            <Title order={4} mb='xs' fw={100}>
              Current Program
            </Title>
            <Badge
              radius={'sm'}
              color={getProgramStatusColor(student.programs[0].status)}
              variant='light'
            >
              {student.programs[0].status}
            </Badge>
          </Flex>
          <Paper p='md' radius='md' withBorder>
            <Grid gutter='xl'>
              <Grid.Col span={{ base: 12 }}>
                <Group>
                  <InfoItem
                    label='Name'
                    value={student.programs[0].structure.program.name}
                    displayValue={`${student.programs[0].structure.program.name} (${student.programs[0].structure.program.code})`}
                  />
                </Group>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <InfoItem
                  label='Intake Date'
                  value={student.programs[0].intakeDate}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <InfoItem
                  label='Graduation Date'
                  value={student.programs[0].graduationDate}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <Flex justify='flex-end'>
                  <StructureChange student={student} />
                </Flex>
              </Grid.Col>
            </Grid>
          </Paper>
        </div>
      )}

      <div>
        <Title order={4} mb='xs' fw={100}>
          Contact Information
        </Title>
        <Paper p='md' radius='md' withBorder>
          <Grid gutter='xl'>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem
                label='Primary Phone'
                href={`tel:${formatPhoneNumber(student.phone1)?.replaceAll(' ', '')}`}
                displayValue={formatPhoneNumber(student.phone1)}
                value={formatPhoneNumber(student.phone1)?.replaceAll(' ', '')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem
                label='Secondary Phone'
                href={`tel:${formatPhoneNumber(student.phone2)?.replaceAll(' ', '')}`}
                displayValue={formatPhoneNumber(student.phone2)}
                value={formatPhoneNumber(student.phone2)?.replaceAll(' ', '')}
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
  href,
  displayValue,
  copyable = true,
}: {
  label: string;
  value: number | string | null | undefined;
  href?: string;
  displayValue?: string | null;
  copyable?: boolean;
}) {
  return (
    <Box
      style={{
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        const copyButton = e.currentTarget.querySelector(
          '.copy-button',
        ) as HTMLElement;
        if (copyButton) copyButton.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const copyButton = e.currentTarget.querySelector(
          '.copy-button',
        ) as HTMLElement;
        if (copyButton) copyButton.style.opacity = '0';
      }}
    >
      <Text size='sm' c='dimmed'>
        {label}
      </Text>
      <Group>
        {href ? (
          <Anchor component={Link} href={href} size='sm' fw={500}>
            {displayValue ?? value ?? 'N/A'}
          </Anchor>
        ) : (
          <Text size='sm' fw={500}>
            {displayValue ?? value ?? 'N/A'}
          </Text>
        )}
        {copyable && value && (
          <CopyButton value={String(value)}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied' : 'Copy'}>
                <ActionIcon
                  variant='subtle'
                  color={copied ? 'teal' : 'gray'}
                  onClick={copy}
                  className='copy-button'
                  style={{
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        )}
      </Group>
    </Box>
  );
}
