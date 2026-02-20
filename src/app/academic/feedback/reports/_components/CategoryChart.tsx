'use client';

import { BarChart } from '@mantine/charts';
import { Card, Stack, Text } from '@mantine/core';
import type { CategoryAverage } from '../_lib/types';

type Props = {
	data: CategoryAverage[];
};

export default function CategoryChart({ data }: Props) {
	if (data.length === 0) return null;

	const chartData = data.map((d) => ({
		category: d.categoryName,
		'Avg Rating': d.avgRating,
	}));

	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Text fw={600}>Average Rating by Category</Text>
				<BarChart
					h={300}
					data={chartData}
					dataKey='category'
					orientation='vertical'
					series={[{ name: 'Avg Rating', color: 'blue.6' }]}
					gridAxis='y'
					tickLine='y'
					yAxisProps={{ width: 180 }}
					xAxisProps={{ domain: [0, 5] }}
					barProps={{ radius: 4, maxBarSize: 32 }}
				/>
			</Stack>
		</Card>
	);
}
