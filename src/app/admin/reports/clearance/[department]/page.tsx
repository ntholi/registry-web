'use client';

import {
	Button,
	Card,
	Group,
	Paper,
	Select,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates';
import { IconCalendar, IconFilter, IconSearch } from '@tabler/icons-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { DashboardUser } from '@/modules/auth/database';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { StatsSummary } from '../_components/StatsSummary';
import { StatsTable } from '../_components/StatsTable';
import { fetchClearanceStats } from '../_server/actions';
import type { ClearanceFilter, ClearanceType } from '../_server/repository';
import type { ClearanceStatsSummary } from '../_server/service';

export default function ClearanceReportsPage() {
	const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
		null,
		null,
	]);
	const [clearanceType, setClearanceType] = useState<ClearanceType>('all');
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

			const filter: ClearanceFilter = {
				type: clearanceType,
				...(dateRange[0] &&
					dateRange[1] && {
						startDate: dateRange[0],
						endDate: dateRange[1],
					}),
			};

			const data = await fetchClearanceStats(
				department as DashboardUser,
				filter
			);
			setStats(data);
		} catch (error) {
			console.error('Failed to fetch clearance stats:', error);
		} finally {
			setIsLoading(false);
		}
	}, [department, dateRange, clearanceType]);

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
				Statistics showing clearance requests by department and staff members.
				Filter by registration or graduation clearances to get specific reports.
			</Text>

			<Card withBorder p='md'>
				<Stack>
					<Group justify='space-between'>
						<Text fw={500}>Filter Options</Text>

						<Group>
							<Select
								placeholder='Select clearance type'
								value={clearanceType}
								onChange={(value) =>
									setClearanceType((value as ClearanceType) || 'all')
								}
								data={[
									{ value: 'all', label: 'All Clearances' },
									{ value: 'registration', label: 'Registration Only' },
									{ value: 'graduation', label: 'Graduation Only' },
								]}
								leftSection={<IconFilter size='1rem' />}
								w={200}
							/>

							<DatePickerInput
								type='range'
								firstDayOfWeek={0}
								placeholder='Pick date range'
								value={dateRange as [Date, Date]}
								onChange={(value: DatesRangeValue) => {
									setDateRange(value as [Date | null, Date | null]);
								}}
								clearable={false}
								leftSection={<IconCalendar size='1rem' />}
								w={350}
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
					<StatsSummary data={stats.overall} clearanceType={clearanceType} />

					<Paper withBorder p='md' mt='md'>
						<Title order={4} mb='md'>
							Staff Member Statistics
						</Title>
						<StatsTable data={stats.byStaff} clearanceType={clearanceType} />
					</Paper>
				</>
			)}
		</Stack>
	);
}
