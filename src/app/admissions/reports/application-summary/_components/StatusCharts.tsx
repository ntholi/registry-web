'use client';

import { BarChart, DonutChart } from '@mantine/charts';
import { Grid, Paper, Stack, Text, Title } from '@mantine/core';
import type { ChartData } from '../_server/repository';

type Props = {
	data: ChartData;
};

export default function StatusCharts({ data }: Props) {
	const barSeries = [
		{ name: 'draft', color: 'gray.6', label: 'Draft' },
		{ name: 'submitted', color: 'blue.6', label: 'Submitted' },
		{ name: 'under_review', color: 'yellow.6', label: 'Under Review' },
		{ name: 'accepted_first_choice', color: 'green.6', label: '1st Choice' },
		{ name: 'accepted_second_choice', color: 'teal.6', label: '2nd Choice' },
		{ name: 'rejected', color: 'red.6', label: 'Rejected' },
		{ name: 'waitlisted', color: 'orange.6', label: 'Waitlisted' },
	];

	return (
		<Grid>
			<Grid.Col span={{ base: 12, md: 5 }}>
				<Paper withBorder p='md'>
					<Stack>
						<Title order={4}>Status Distribution</Title>
						<Text size='sm' c='dimmed'>
							Overall application status breakdown
						</Text>
						<DonutChart
							data={data.statusDistribution}
							h={300}
							tooltipDataSource='segment'
							withLabelsLine
							withLabels
						/>
					</Stack>
				</Paper>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 7 }}>
				<Paper withBorder p='md'>
					<Stack>
						<Title order={4}>By School</Title>
						<Text size='sm' c='dimmed'>
							Application status breakdown per school
						</Text>
						<BarChart
							h={300}
							data={data.bySchool}
							dataKey='school'
							type='stacked'
							series={barSeries}
							tickLine='y'
						/>
					</Stack>
				</Paper>
			</Grid.Col>
		</Grid>
	);
}
