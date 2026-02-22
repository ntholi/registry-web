'use client';

import { LineChart } from '@mantine/charts';
import { Center, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getDailyTrends } from '../_server/actions';

type Props = {
	start: Date;
	end: Date;
	dept?: string;
};

export default function DailyTrendsChart({ start, end, dept }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: [
			'activity-tracker',
			'trends',
			start.toISOString(),
			end.toISOString(),
			dept,
		],
		queryFn: () => getDailyTrends(start, end, dept),
	});

	if (isLoading) {
		return <Skeleton h={300} radius='md' />;
	}

	if (!data || data.length === 0) {
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

	const chartData = data.map((d) => ({
		date: new Date(d.date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		}),
		Total: d.total,
		Inserts: d.inserts,
		Updates: d.updates,
		Deletes: d.deletes,
	}));

	return (
		<Paper p='md' radius='md' withBorder>
			<Title order={5} mb='md'>
				Daily Trends
			</Title>
			<LineChart
				h={300}
				data={chartData}
				dataKey='date'
				series={[
					{ name: 'Total', color: 'blue.6' },
					{ name: 'Inserts', color: 'teal.6' },
					{ name: 'Updates', color: 'indigo.6' },
					{ name: 'Deletes', color: 'red.6' },
				]}
				curveType='monotone'
				withLegend
				withDots={false}
			/>
		</Paper>
	);
}
