'use client';

import { Heatmap } from '@mantine/charts';
import { Center, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { formatDateToISO } from '@/shared/lib/utils/dates';
import { getActivityHeatmap } from '../_server/actions';

const WEEKS_IN_YEAR = 53;
const WEEKDAY_LABEL_WIDTH = 28;
const PADDING = 32;
const MIN_RECT = 8;
const MAX_RECT = 16;

type Props = {
	userId: string;
	start: string;
	end: string;
};

export default function ActivityHeatmap({ userId, start, end }: Props) {
	const { ref, width } = useElementSize();

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

	const { rectSize, gap } = useMemo(() => {
		if (width === 0) return { rectSize: MAX_RECT, gap: 4 };
		const available = width - WEEKDAY_LABEL_WIDTH - PADDING;
		const cellWithGap = available / WEEKS_IN_YEAR;
		const g = Math.max(2, Math.min(4, Math.floor(cellWithGap * 0.2)));
		const r = Math.max(
			MIN_RECT,
			Math.min(MAX_RECT, Math.floor(cellWithGap - g))
		);
		return { rectSize: r, gap: g };
	}, [width]);

	if (isLoading) {
		return (
			<Paper p='md' radius='md' withBorder ref={ref}>
				<Title order={5} mb='md'>
					Activity Heatmap
				</Title>
				<Skeleton h={140} radius='md' />
			</Paper>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Paper p='md' radius='md' withBorder ref={ref}>
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
		<Paper p='md' radius='md' withBorder ref={ref}>
			<Title order={5} mb='md'>
				Activity Heatmap
			</Title>
			<Heatmap
				data={chartData}
				startDate={yearRange.start}
				endDate={yearRange.end}
				withMonthLabels
				withWeekdayLabels
				firstDayOfWeek={0}
				weekdayLabels={['', 'Mon', '', 'Wed', '', 'Fri', '']}
				withTooltip
				rectSize={rectSize}
				rectRadius={3}
				gap={gap}
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
		</Paper>
	);
}
