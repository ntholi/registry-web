'use client';

import { LineChart } from '@mantine/charts';
import { Center, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getActivityLabel } from '../_lib/activity-catalog';
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

		const typeTotals = new Map<string, number>();
		for (const d of data) {
			typeTotals.set(
				d.activityType,
				(typeTotals.get(d.activityType) ?? 0) + d.count
			);
		}

		const topTypes = [...typeTotals.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([t]) => t);

		const dateMap = new Map<
			string,
			Record<string, number> & { date: string }
		>();
		for (const d of data) {
			const label = new Date(d.date).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
			});
			if (!dateMap.has(d.date)) {
				const row = { date: label } as Record<string, number> & {
					date: string;
				};
				for (const t of topTypes) {
					row[getActivityLabel(t)] = 0;
				}
				dateMap.set(d.date, row);
			}
			const row = dateMap.get(d.date)!;
			const actLabel = getActivityLabel(d.activityType);
			if (topTypes.includes(d.activityType)) {
				row[actLabel] = (row[actLabel] ?? 0) + d.count;
			}
		}

		return {
			chartData: [...dateMap.values()],
			series: topTypes.map((t, i) => ({
				name: getActivityLabel(t),
				color: COLORS[i % COLORS.length],
			})),
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
				withLegend
				legendProps={{ verticalAlign: 'bottom', height: 50 }}
				withDots={false}
			/>
		</Paper>
	);
}
