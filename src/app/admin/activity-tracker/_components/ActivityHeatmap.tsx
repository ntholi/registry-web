'use client';

import { Heatmap } from '@mantine/charts';
import {
	Box,
	Center,
	Paper,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { formatDateToISO } from '@/shared/lib/utils/dates';
import { getActivityHeatmap } from '../_server/actions';

type Props = {
	userId: string;
	start: string;
	end: string;
};

export default function ActivityHeatmap({ userId, start, end }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ['activity-tracker', 'heatmap', userId, start, end],
		queryFn: () => getActivityHeatmap(userId, start, end),
	});

	const chartData = useMemo(() => {
		if (!data || data.length === 0) return {};
		return Object.fromEntries(data.map((item) => [item.date, item.count]));
	}, [data]);

	const yearRange = useMemo(() => {
		const today = new Date();
		const yearAgo = new Date(today);
		yearAgo.setFullYear(yearAgo.getFullYear() - 1);
		return {
			start: formatDateToISO(yearAgo),
			end: formatDateToISO(today),
		};
	}, []);

	if (isLoading) {
		return (
			<Paper p='md' radius='md' withBorder>
				<Title order={5} mb='md'>
					Activity Heatmap
				</Title>
				<Skeleton h={140} radius='md' />
			</Paper>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Paper p='md' radius='md' withBorder>
				<Title order={5} mb='md'>
					Activity Heatmap
				</Title>
				<Center py='xl'>
					<Stack align='center' gap='xs'>
						<IconDatabaseOff size={24} opacity={0.5} />
						<Text c='dimmed' fz='sm'>
							No data
						</Text>
					</Stack>
				</Center>
			</Paper>
		);
	}

	return (
		<Paper p='md' radius='md' withBorder>
			<Title order={5} mb='md'>
				Activity Heatmap
			</Title>
			<Box style={{ overflowX: 'auto' }}>
				<Heatmap
					data={chartData}
					startDate={yearRange.start}
					endDate={yearRange.end}
					withMonthLabels
					withWeekdayLabels
					firstDayOfWeek={0}
					weekdayLabels={['', 'Mon', '', 'Wed', '', 'Fri', '']}
					withTooltip
					rectSize={16}
					rectRadius={3}
					gap={4}
					colors={[
						'var(--mantine-color-green-2)',
						'var(--mantine-color-green-4)',
						'var(--mantine-color-green-6)',
						'var(--mantine-color-green-9)',
					]}
					getTooltipLabel={({ date, value }) => {
						const count = value ?? 0;
						const formatted = new Date(date).toLocaleDateString('en-US', {
							weekday: 'long',
							month: 'long',
							day: 'numeric',
							year: 'numeric',
						});
						if (count === 0) return `No activities on ${formatted}`;
						return `${count} activit${count === 1 ? 'y' : 'ies'} on ${formatted}`;
					}}
				/>
			</Box>
		</Paper>
	);
}
