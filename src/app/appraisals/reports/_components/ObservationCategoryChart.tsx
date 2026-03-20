'use client';

import { BarChart } from '@mantine/charts';
import { Paper, Stack, Text } from '@mantine/core';
import type { ObservationCategoryAverage } from '../_lib/types';

type Props = {
	data: ObservationCategoryAverage[];
};

function formatScore(value: number) {
	return value.toFixed(2);
}

function formatCategoryLabel(value: string) {
	return value.length > 26 ? `${value.slice(0, 23)}...` : value;
}

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

	const chartHeight = Math.max(320, chartData.length * 42);

	return (
		<Paper withBorder p='lg' h='100%'>
			<Stack gap='md' h='100%'>
				<Text fw={600}>Average Rating by Category</Text>
				<Text c='dimmed' size='sm'>
					Target score: 3.00 out of 5.00
				</Text>
				<BarChart
					h={chartHeight}
					data={chartData}
					dataKey='category'
					orientation='vertical'
					series={[{ name: 'avg', label: 'Avg Rating', color: 'blue.6' }]}
					gridAxis='x'
					tickLine='x'
					strokeDasharray='6 6'
					xAxisLabel='Score'
					valueFormatter={formatScore}
					withBarValueLabel
					maxBarWidth={28}
					barProps={{ radius: [0, 8, 8, 0] }}
					valueLabelProps={{ position: 'insideRight', fill: 'white' }}
					xAxisProps={{
						allowDecimals: false,
						domain: [0, 5],
						tickCount: 6,
						tickMargin: 8,
						type: 'number',
					}}
					yAxisProps={{
						interval: 0,
						tickFormatter: formatCategoryLabel,
						width: 190,
					}}
					referenceLines={[
						{
							x: 3,
							color: 'red.5',
							label: 'Target',
							labelPosition: 'right',
						},
					]}
				/>
			</Stack>
		</Paper>
	);
}
