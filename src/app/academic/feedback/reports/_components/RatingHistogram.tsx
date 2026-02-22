'use client';

import { BarChart } from '@mantine/charts';
import { Card, Stack, Text } from '@mantine/core';
import type { RatingDistribution } from '../_lib/types';

type Props = {
	data: RatingDistribution[];
};

const ratingColors: Record<number, string> = {
	1: 'red.6',
	2: 'orange.5',
	3: 'yellow.5',
	4: 'teal.5',
	5: 'green.6',
};

export default function RatingHistogram({ data }: Props) {
	if (data.length === 0) return null;

	const chartData = data.map((d) => ({
		label: `${d.rating} ★`,
		Responses: d.count,
		color: ratingColors[d.rating],
	}));

	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Text fw={600}>Rating Distribution</Text>
				<BarChart
					h={300}
					data={chartData}
					dataKey='label'
					series={[{ name: 'Responses', color: 'blue.6' }]}
					gridAxis='x'
					tickLine='x'
					barProps={{ radius: 4, maxBarSize: 48 }}
				/>
			</Stack>
		</Card>
	);
}
