'use client';

import { DonutChart } from '@mantine/charts';
import { Paper, Stack, Text, Title } from '@mantine/core';
import type { ClassificationDistRow } from '../_server/repository';

type Props = {
	data: ClassificationDistRow[];
};

const CLASS_COLORS: Record<string, string> = {
	Distinction: 'green.7',
	Merit: 'teal.6',
	Credit: 'blue.6',
	Pass: 'yellow.6',
	Fail: 'red.6',
};

export default function ClassificationChart({ data }: Props) {
	const chartData = data.map((r) => ({
		name: r.classification,
		value: r.count,
		color: CLASS_COLORS[r.classification] ?? 'gray.6',
	}));

	return (
		<Paper withBorder p='md'>
			<Stack>
				<Title order={4}>Result Classifications</Title>
				<Text c='dimmed' size='sm'>
					Overall result classification distribution
				</Text>
				{chartData.length > 0 ? (
					<DonutChart
						data={chartData}
						h={350}
						withLabelsLine
						withLabels
						tooltipDataSource='segment'
					/>
				) : (
					<Text c='dimmed' ta='center' py='xl'>
						No data available
					</Text>
				)}
			</Stack>
		</Paper>
	);
}
