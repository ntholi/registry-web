'use client';

import { LineChart } from '@mantine/charts';
import { Paper, Stack, Text } from '@mantine/core';
import type { ObservationTrendPoint } from '../_lib/types';

type Props = {
	data: ObservationTrendPoint[];
};

export default function TrendChart({ data }: Props) {
	if (data.length < 2) return null;

	const chartData = data.map((d) => ({
		term: d.termCode,
		avg: d.avgScore,
	}));

	return (
		<Paper withBorder p='lg' h='100%'>
			<Stack gap='md' h='100%'>
				<Text fw={600}>Score Trend Over Terms</Text>
				<LineChart
					h={300}
					data={chartData}
					dataKey='term'
					series={[{ name: 'avg', label: 'Avg Score', color: 'blue.6' }]}
					curveType='monotone'
					connectNulls
					yAxisProps={{ domain: [1, 5] }}
					referenceLines={[{ y: 3, color: 'red.5', label: 'Satisfactory' }]}
				/>
			</Stack>
		</Paper>
	);
}
