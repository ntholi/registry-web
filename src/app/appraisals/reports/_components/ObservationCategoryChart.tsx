'use client';

import { BarChart } from '@mantine/charts';
import { Paper, Stack, Text } from '@mantine/core';
import type { ObservationCategoryAverage } from '../_lib/types';

type Props = {
	data: ObservationCategoryAverage[];
};

export default function ObservationCategoryChart({ data }: Props) {
	if (data.length === 0) return null;

	const chartData = data
		.toSorted(
			(a, b) =>
				a.sortOrder - b.sortOrder ||
				a.categoryName.localeCompare(b.categoryName)
		)
		.map((d) => ({
			category: d.categoryName,
			avg: Number(d.avgRating.toFixed(2)),
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
					xAxisLabel='Score'
					yAxisLabel='Category'
					valueFormatter={(value) => value.toFixed(2)}
					withBarValueLabel
					barProps={{ barSize: 24, radius: [0, 6, 6, 0] }}
					xAxisProps={{ domain: [0, 5], tickCount: 6, type: 'number' }}
					yAxisProps={{ width: 120 }}
					referenceLines={[
						{
							x: 3,
							color: 'red.5',
							label: 'Satisfactory',
							labelPosition: 'insideTopRight',
						},
					]}
				/>
			</Stack>
		</Paper>
	);
}
