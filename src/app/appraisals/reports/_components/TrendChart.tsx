'use client';

import { LineChart } from '@mantine/charts';
import { Paper, Stack, Text } from '@mantine/core';
import type { TrendPoint } from '../_lib/types';

type Props = {
	data: TrendPoint[];
	overlaid?: boolean;
};

export default function TrendChart({ data, overlaid }: Props) {
	if (data.length < 2) return null;

	const chartData = data.map((d) => ({
		term: d.termCode,
		feedback: d.feedbackAvg,
		observation: d.observationAvg,
	}));

	const series = overlaid
		? [
				{ name: 'feedback', label: 'Student Feedback', color: 'blue.5' },
				{
					name: 'observation',
					label: 'Teaching Observation',
					color: 'teal.5',
				},
			]
		: [
				{
					name: 'observation',
					label: 'Avg Score',
					color: 'teal.5',
				},
			];

	return (
		<Paper withBorder p='lg' h='100%'>
			<Stack gap='md' h='100%'>
				<Text fw={600}>
					{overlaid ? 'Combined Trend' : 'Score Trend Over Terms'}
				</Text>
				<LineChart
					h={300}
					data={chartData}
					dataKey='term'
					series={series}
					curveType='monotone'
					connectNulls
					yAxisProps={{ domain: [1, 5] }}
					referenceLines={[{ y: 3, color: 'red.5', label: 'Satisfactory' }]}
					withLegend={overlaid}
				/>
			</Stack>
		</Paper>
	);
}
