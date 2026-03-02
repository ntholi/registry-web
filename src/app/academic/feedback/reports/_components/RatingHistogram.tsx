'use client';

import { DonutChart } from '@mantine/charts';
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

	const total = data.reduce((sum, d) => sum + d.count, 0);

	const chartData = data.map((d) => ({
		name: `${d.rating} ★`,
		value: d.count,
		color: ratingColors[d.rating] ?? 'gray.5',
	}));

	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Text fw={600}>Rating Distribution</Text>
				<DonutChart
					data={chartData}
					withLabelsLine
					withLabels
					labelsType='percent'
					tooltipDataSource='segment'
					chartLabel={total.toLocaleString()}
					paddingAngle={2}
					thickness={20}
				/>
			</Stack>
		</Card>
	);
}
