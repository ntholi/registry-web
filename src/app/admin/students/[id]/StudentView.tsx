'use client';

import { students } from '@/db/schema';
import { formatDate } from '@/lib/utils';
import { Grid, Group, Paper, Stack, Text } from '@mantine/core';

type Props = {
  student: typeof students.$inferSelect;
};

export default function StudentView({ student }: Props) {
  return (
    <Stack gap='xl'>
      <div>
        <Paper p='md' radius='md' withBorder>
          <Grid gutter='xl'>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem
                label='Student Number'
                value={student.stdNo.toString()}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='National ID' value={student.nationalId} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='Full Name' value={student.name} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <InfoItem label='Date of Birth' value={student.dateOfBirth} />
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
}: {
  label: string;
  value: string | null | Date;
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
    </Group>
  );
}
