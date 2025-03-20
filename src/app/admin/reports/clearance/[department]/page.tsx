'use client';

import { DashboardUser } from '@/db/schema';
import { toTitleCase } from '@/lib/utils';
import { fetchClearanceStats } from '@/server/reports/clearance/actions';
import { DateRangeFilter } from '@/server/reports/clearance/repository';
import { ClearanceStatsSummary } from '@/server/reports/clearance/service';
import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { DatePickerInput, DatesRangeValue } from '@mantine/dates';
import { IconCalendar, IconSearch } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { StatsSummary } from './StatsSummary';
import { StatsTable } from './StatsTable';
import { useParams } from 'next/navigation';

export default function ClearanceReportsPage() {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [stats, setStats] = useState<ClearanceStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { department } = useParams();

  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateRange([firstDayOfMonth, today]);
  }, []);

  const fetchStats = useCallback(async () => {
    if (!department) return;

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
        department as DashboardUser,
        dateRangeFilter,
      );
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch clearance stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [department, dateRange]);

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      fetchStats();
    }
  }, [fetchStats, dateRange]);

  return (
    <Stack p='lg'>
      <Title order={2}>
        Clearance Statistics - {toTitleCase(department as DashboardUser)}
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
