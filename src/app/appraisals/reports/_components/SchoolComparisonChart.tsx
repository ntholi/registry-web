'use client';

import { BarChart } from '@mantine/charts';
import { Paper, Stack, Text } from '@mantine/core';
import type { SchoolComparisonItem } from '../_lib/types';

type Props = {
	data: SchoolComparisonItem[];
};

export default function SchoolComparisonChart({ data }: Props) {
	if (data.length === 0) return null;

	const chartData = data.map((d) => ({
		school: d.schoolCode,
		'Student Feedback': d.feedbackAvg,
		'Teaching Observation': d.observationAvg,
	}));

	return (
		<Paper withBorder p='lg' h='100%'>
			<Stack gap='md' h='100%'>
				<Text fw={600}>School Comparison</Text>
				<BarChart
					h={300}
					data={chartData}
					dataKey='school'
					series={[
						{
							name: 'Student Feedback',
							color: 'blue.5',
						},
						{
							name: 'Teaching Observation',
							color: 'teal.5',
						},
					]}
					yAxisProps={{ domain: [0, 5] }}
					tickLine='y'
					gridAxis='y'
				/>
			</Stack>
		</Paper>
	);
}
