'use client';

import { fetchClearanceStats } from '@/server/reports/clearance/actions';
import { useCallback, useEffect, useState } from 'react';
import {
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  Grid,
  GridCol,
} from '@mantine/core';
import { toTitleCase } from '@/lib/utils';
import { StatsTable } from './StatsTable';
import { DashboardUser } from '@/db/schema';
import { DateRangeFilter } from '@/server/reports/clearance/repository';
import { StatsSummary } from './StatsSummary';
import { ClearanceStatsSummary } from '@/server/reports/clearance/service';
import { IconCalendar, IconSearch } from '@tabler/icons-react';
import { DatePickerInput, DatesRangeValue } from '@mantine/dates';

interface Props {
  params: {
    department: string;
  };
}

export default function ClearanceReportsPage({ params }: Props) {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [stats, setStats] = useState<ClearanceStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateRange([firstDayOfMonth, today]);
  }, []);

  const fetchStats = useCallback(async () => {
    if (!params.department) return;

    try {
      setIsLoading(true);

      const dateRangeFilter: DateRangeFilter | undefined =
        dateRange[0] && dateRange[1]
          ? {
              startDate: dateRange[0],
              endDate: dateRange[1],
            }
          : undefined;

      const data = await fetchClearanceStats(
        params.department as DashboardUser,
        dateRangeFilter,
      );
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch clearance stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [params.department, dateRange]);

  // Load stats initially and when date range changes
  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      fetchStats();
    }
  }, [fetchStats, dateRange]);

  return (
    <Stack p='lg'>
      <Title order={2}>
        Clearance Statistics - {toTitleCase(params.department)}
      </Title>

      <Text size='sm' c='dimmed'>
        Statistics showing clearance requests by department and staff members
      </Text>

      <Card withBorder p='md'>
        <Stack>
          <Group justify='space-between'>
            <Text fw={500}>Filter by date range</Text>

            <Group>
              <DatePickerInput
                type='range'
                placeholder='Pick date range'
                value={dateRange as [Date, Date]}
                onChange={(value: DatesRangeValue) => {
                  // Cast to expected type for useState
                  setDateRange(value as [Date | null, Date | null]);
                }}
                clearable={false}
                leftSection={<IconCalendar size='1rem' />}
              />

              <Button
                leftSection={<IconSearch size='1rem' />}
                onClick={fetchStats}
                loading={isLoading}
              >
                Apply Filter
              </Button>
            </Group>
          </Group>
        </Stack>
      </Card>

      {stats && (
        <>
          <StatsSummary data={stats.overall} />

          <Card withBorder>
            <Title order={4} mb='md'>
              Staff Member Statistics
            </Title>
            <StatsTable data={stats.byStaff} />
          </Card>
        </>
      )}
    </Stack>
  );
}
