'use client';

import { BarChart } from '@mantine/charts';
import { Center, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getEmployeeActivityBreakdown } from '../_server/actions';

type Props = {
	userId: string;
	start: string;
	end: string;
};

export default function ActivityBreakdownChart({ userId, start, end }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ['activity-tracker', 'breakdown', userId, start, end],
		queryFn: () => getEmployeeActivityBreakdown(userId, start, end),
	});

	if (isLoading) {
		return (
			<Paper p='md' radius='md' withBorder h='100%'>
				<Title order={5} mb='md'>
					Activity Breakdown
				</Title>
				<Stack gap='xs'>
					<Skeleton h={24} radius='sm' />
					<Skeleton h={24} radius='sm' />
					<Skeleton h={24} radius='sm' />
					<Skeleton h={24} radius='sm' />
					<Skeleton h={24} radius='sm' />
				</Stack>
			</Paper>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Paper p='md' radius='md' withBorder h='100%'>
				<Title order={5} mb='md'>
					Activity Breakdown
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

	const chartData = data.slice(0, 10).map((d) => ({
		activity: d.label,
		count: d.count,
	}));

	return (
		<Paper p='md' radius='md' withBorder h='100%'>
			<Title order={5} mb='md'>
				Activity Breakdown
			</Title>
			<BarChart
				h={340}
				data={chartData}
				dataKey='activity'
				orientation='vertical'
				yAxisProps={{ width: 180 }}
				tickLine='xy'
				gridAxis='x'
				valueFormatter={(value) => new Intl.NumberFormat('en-US').format(value)}
				series={[{ name: 'count', label: 'Activities', color: 'blue.6' }]}
				barProps={{ radius: 6 }}
			/>
		</Paper>
	);
}
