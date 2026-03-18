'use client';

import { BarChart } from '@mantine/charts';
import { Paper, Stack, Text } from '@mantine/core';
import type { RatingDistribution } from '../_lib/types';

type Props = {
	data: RatingDistribution[];
};

export default function RatingHistogram({ data }: Props) {
	if (data.length === 0) return null;

	const chartData = data.map((d) => ({
		rating: `${d.rating} ★`,
		count: d.count,
	}));

	return (
		<Paper withBorder p='lg' h='100%'>
			<Stack gap='md' h='100%'>
				<Text fw={600}>Rating Distribution</Text>
				<BarChart
					h={300}
					data={chartData}
					dataKey='rating'
					series={[{ name: 'count', label: 'Responses', color: 'blue.6' }]}
					withBarValueLabel
					withTooltip
					barProps={{ barSize: 40 }}
					gridAxis='y'
				/>
			</Stack>
		</Paper>
	);
}
