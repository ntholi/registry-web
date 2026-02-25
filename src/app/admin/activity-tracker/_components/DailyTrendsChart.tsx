'use client';

import { LineChart } from '@mantine/charts';
import { Center, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { formatDate } from '@/shared/lib/utils/dates';
import { getActivityLabel } from '../_lib/registry';
import { getDailyTrends } from '../_server/actions';

type Props = {
	start: string;
	end: string;
	dept?: string;
};

const COLORS = [
	'blue.6',
	'teal.6',
	'indigo.6',
	'orange.6',
	'grape.6',
	'cyan.6',
	'pink.6',
	'lime.6',
];

export default function DailyTrendsChart({ start, end, dept }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ['activity-tracker', 'trends', start, end, dept],
		queryFn: () => getDailyTrends(start, end, dept),
	});

	const { chartData, series } = useMemo(() => {
		if (!data || data.length === 0) return { chartData: [], series: [] };

		const totalsByType = new Map<string, number>();
		for (const item of data) {
			totalsByType.set(
				item.activityType,
				(totalsByType.get(item.activityType) ?? 0) + item.count
			);
		}

		const topTypes = [...totalsByType.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([type]) => type);

		if (topTypes.length === 0) return { chartData: [], series: [] };

		const topTypeSet = new Set(topTypes);
		const dates = [...new Set(data.map((item) => item.date))].sort((a, b) =>
			a.localeCompare(b)
		);

		const countsByDate = new Map<string, Map<string, number>>();
		for (const date of dates) {
			countsByDate.set(date, new Map<string, number>());
		}

		for (const item of data) {
			if (!topTypeSet.has(item.activityType)) continue;
			const row = countsByDate.get(item.date);
			if (!row) continue;
			row.set(
				item.activityType,
				(row.get(item.activityType) ?? 0) + item.count
			);
		}

		const nextChartData = dates.map((date) => {
			const row: Record<string, number | string> = {
				date: formatDate(date, 'short'),
			};
			const values = countsByDate.get(date);
			for (const type of topTypes) {
				row[type] = values?.get(type) ?? 0;
			}
			return row;
		});

		const nextSeries = topTypes.map((type, index) => ({
			name: type,
			label: getActivityLabel(type),
			color: COLORS[index % COLORS.length],
		}));

		return {
			chartData: nextChartData,
			series: nextSeries,
		};
	}, [data]);

	if (isLoading) {
		return <Skeleton h={300} radius='md' />;
	}

	if (chartData.length === 0) {
		return (
			<Paper p='md' radius='md' withBorder>
				<Center py='xl'>
					<Stack align='center' gap='xs'>
						<IconDatabaseOff size={24} opacity={0.5} />
						<Text c='dimmed' fz='sm'>
							No trend data for this period
						</Text>
					</Stack>
				</Center>
			</Paper>
		);
	}

	return (
		<Paper p='md' radius='md' withBorder>
			<Title order={5} mb='md'>
				Daily Trends
			</Title>
			<LineChart
				h={350}
				data={chartData}
				dataKey='date'
				series={series}
				curveType='monotone'
				connectNulls
				tickLine='xy'
				yAxisProps={{ allowDecimals: false }}
				valueFormatter={(value) => new Intl.NumberFormat('en-US').format(value)}
				tooltipAnimationDuration={200}
				withLegend
				legendProps={{ verticalAlign: 'bottom', height: 50 }}
				withDots={false}
			/>
		</Paper>
	);
}
