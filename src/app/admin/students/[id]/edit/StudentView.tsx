'use client';

import { getProgramByReference } from '@/app/(main)/models/programs';
import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
} from '@/components/adease';
import { students } from '@/db/schema';
import { formatDate } from '@/lib/utils';
import {
  ActionIcon,
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

type Props = {
  student: typeof students.$inferSelect;
};

export default function StudentView({ student }: Props) {
  return (
    <DetailsView>
      <DetailsViewHeader title={student.name} queryKey={['students']} />
      <DetailsViewBody>
        <Stack>
          <Card withBorder>
            <InfoItem
              label='Program'
              value={
                getProgramByReference(student.reference)?.name ||
                'Not Specified'
              }
              copyable
            />
          </Card>
          <div>
            <Title order={4} mb='xs' fw={100}>
              Personal Information
            </Title>
            <Paper p='md' radius='md' withBorder>
              <Grid gutter='xl'>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem
                    label='National ID'
                    value={student.nationalId}
                    copyable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem label='Full Name' value={student.name} copyable />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem
                    label='Email Address'
                    value={student.email}
                    copyable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem label='Date of Birth' value={student.dateOfBirth} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem label='Gender' value={student.gender} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem
                    label='Marital Status'
                    value={student.maritalStatus}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          </div>

          <div>
            <Title order={4} mb='xs' fw={100}>
              Contact Information
            </Title>
            <Paper p='md' radius='md' withBorder>
              <Grid gutter='xl'>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem
                    label='Primary Phone'
                    value={student.phone1}
                    copyable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem
                    label='Secondary Phone'
                    value={student.phone2}
                    copyable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem label='Birth Place' value={student.birthPlace} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem label='Home Town' value={student.homeTown} />
                </Grid.Col>
              </Grid>
            </Paper>
          </div>

          <div>
            <Title order={4} mb='xs' fw={100}>
              Education & Background
            </Title>
            <Paper p='md' radius='md' withBorder>
              <Grid gutter='xl'>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <InfoItem label='High School' value={student.highSchool} />
                </Grid.Col>
              </Grid>
            </Paper>
          </div>
        </Stack>
      </DetailsViewBody>
    </DetailsView>
  );
}

function InfoItem({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string | null | Date;
  copyable?: boolean;
}) {
  const displayValue = value instanceof Date ? formatDate(value) : value;

  return (
    <Group wrap='nowrap' gap='xs'>
      <div style={{ flex: 1 }}>
        <Text size='sm' c='dimmed'>
          {label}
        </Text>
        <Text size='sm' fw={500}>
          {displayValue || 'N/A'}
        </Text>
      </div>
      {copyable && displayValue && (
        <Tooltip label='Copy'>
          <ActionIcon
            variant='subtle'
            color='gray'
            onClick={() => {
              navigator.clipboard.writeText(displayValue);
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
