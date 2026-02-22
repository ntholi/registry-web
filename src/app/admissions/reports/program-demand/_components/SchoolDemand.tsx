'use client';

import { DonutChart } from '@mantine/charts';
import { Paper, Stack, Text, Title } from '@mantine/core';
import type { SchoolDemandRow } from '../_server/repository';

type Props = {
	data: SchoolDemandRow[];
};

const COLORS = [
	'blue.6',
	'teal.6',
	'orange.6',
	'grape.6',
	'cyan.6',
	'pink.6',
	'lime.6',
	'indigo.6',
	'yellow.6',
	'red.6',
];

export default function SchoolDemand({ data }: Props) {
	const chartData = data.map((r, i) => ({
		name: r.schoolName,
		value: r.count,
		color: COLORS[i % COLORS.length],
	}));

	return (
		<Paper withBorder p='md'>
			<Stack>
				<Title order={4}>Demand by School</Title>
				<Text c='dimmed' size='sm'>
					Distribution of first-choice applications across schools
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
