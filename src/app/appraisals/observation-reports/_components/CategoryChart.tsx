'use client';

import { BarChart } from '@mantine/charts';
import { Paper, Stack, Text } from '@mantine/core';
import type { ObservationCategoryAverage } from '../_lib/types';

type Props = {
	data: ObservationCategoryAverage[];
};

const sectionColors: Record<string, string> = {
	teaching_observation: 'blue.6',
	assessments: 'green.6',
	other: 'orange.5',
};

export default function CategoryChart({ data }: Props) {
	if (data.length === 0) return null;

	const chartData = data.map((d) => ({
		category: d.categoryName,
		avg: d.avgRating,
		color: sectionColors[d.section] ?? 'gray.5',
	}));

	return (
		<Paper withBorder p='lg' h='100%'>
			<Stack gap='md' h='100%'>
				<Text fw={600}>Average Rating by Category</Text>
				<BarChart
					h={300}
					data={chartData}
					dataKey='category'
					orientation='vertical'
					series={[{ name: 'avg', label: 'Avg Rating', color: 'blue.6' }]}
					gridAxis='x'
					withBarValueLabel
					barProps={{ barSize: 24 }}
					xAxisProps={{ domain: [0, 5] }}
					referenceLines={[
						{
							x: 3,
							color: 'red.5',
							label: 'Satisfactory',
						},
					]}
				/>
			</Stack>
		</Paper>
	);
}
