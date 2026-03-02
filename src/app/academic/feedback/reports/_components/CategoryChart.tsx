'use client';

import { RadarChart } from '@mantine/charts';
import { Paper, Stack, Text } from '@mantine/core';
import type { CategoryAverage } from '../_lib/types';

type Props = {
	data: CategoryAverage[];
};

export default function CategoryChart({ data }: Props) {
	if (data.length === 0) return null;

	const chartData = data.map((d) => ({
		category: d.categoryName,
		rating: Number(d.avgRating.toFixed(2)),
	}));

	return (
		<Paper withBorder p='lg'>
			<Stack gap='md'>
				<Text fw={600}>Average Rating by Category</Text>
				<RadarChart
					h={300}
					data={chartData}
					dataKey='category'
					withPolarRadiusAxis
					withPolarAngleAxis
					withPolarGrid
					series={[{ name: 'rating', color: 'blue.4', opacity: 0.2 }]}
					polarRadiusAxisProps={{
						domain: [0, 5],
						tickCount: 6,
					}}
				/>
			</Stack>
		</Paper>
	);
}
