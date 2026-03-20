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
					series={[{ name: 'avg', color: 'blue.6' }]}
					yAxisProps={{ width: 150 }}
				/>
			</Stack>
		</Paper>
	);
}
