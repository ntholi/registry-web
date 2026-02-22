'use client';

import { BarChart } from '@mantine/charts';
import { Paper, Stack, Text, Title } from '@mantine/core';
import type { GradeDistRow } from '../_server/repository';

type Props = {
	data: GradeDistRow[];
};

const GRADE_COLORS: Record<string, string> = {
	'A*': 'green.8',
	A: 'green.6',
	B: 'teal.6',
	C: 'blue.6',
	D: 'yellow.6',
	E: 'orange.6',
	F: 'red.5',
	U: 'red.8',
};

export default function GradeChart({ data }: Props) {
	const chartData = data.map((r) => ({
		grade: r.grade,
		Count: r.count,
		color: GRADE_COLORS[r.grade] ?? 'gray.6',
	}));

	return (
		<Paper withBorder p='md'>
			<Stack>
				<Title order={4}>Grade Distribution</Title>
				<Text c='dimmed' size='sm'>
					Standardized grades from A* to U across all subject entries
				</Text>
				{chartData.length > 0 ? (
					<BarChart
						h={350}
						data={chartData}
						dataKey='grade'
						series={[{ name: 'Count', color: 'blue.6' }]}
						gridAxis='y'
						tickLine='y'
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
