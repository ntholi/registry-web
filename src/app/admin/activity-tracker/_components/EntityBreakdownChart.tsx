'use client';

import { BarChart } from '@mantine/charts';
import { Center, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { formatTableName } from '@/shared/lib/utils/utils';
import { getEntityBreakdown } from '../_server/actions';

type Props = {
	userId: string;
	start: Date;
	end: Date;
};

export default function EntityBreakdownChart({ userId, start, end }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: [
			'activity-tracker',
			'entity-breakdown',
			userId,
			start.toISOString(),
			end.toISOString(),
		],
		queryFn: () => getEntityBreakdown(userId, start, end),
	});

	if (isLoading) {
		return <Skeleton h={300} radius='md' />;
	}

	if (!data || data.length === 0) {
		return (
			<Paper p='md' radius='md' withBorder h='100%'>
				<Title order={5} mb='md'>
					Entity Breakdown
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
		table: formatTableName(d.tableName),
		Inserts: d.inserts,
		Updates: d.updates,
		Deletes: d.deletes,
	}));

	return (
		<Paper p='md' radius='md' withBorder h='100%'>
			<Title order={5} mb='md'>
				Entity Breakdown
			</Title>
			<BarChart
				h={300}
				data={chartData}
				dataKey='table'
				orientation='vertical'
				series={[
					{ name: 'Inserts', color: 'teal.6' },
					{ name: 'Updates', color: 'indigo.6' },
					{ name: 'Deletes', color: 'red.6' },
				]}
				type='stacked'
				withLegend
			/>
		</Paper>
	);
}
