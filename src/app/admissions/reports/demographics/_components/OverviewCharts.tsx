'use client';

import { BarChart, DonutChart } from '@mantine/charts';
import { Grid, Paper, Stack, Text, Title } from '@mantine/core';
import type { DemographicsOverview } from '../_server/repository';

type Props = {
	data: DemographicsOverview;
};

export default function OverviewCharts({ data }: Props) {
	return (
		<Grid>
			<Grid.Col span={{ base: 12, md: 4 }}>
				<Paper withBorder p='md' h='100%'>
					<Stack>
						<Title order={4}>Gender</Title>
						<Text size='sm' c='dimmed'>
							{data.total} total applicants
						</Text>
						<DonutChart
							data={data.gender}
							h={250}
							tooltipDataSource='segment'
							withLabelsLine
							withLabels
						/>
					</Stack>
				</Paper>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 4 }}>
				<Paper withBorder p='md' h='100%'>
					<Stack>
						<Title order={4}>Top Nationalities</Title>
						<BarChart
							h={250}
							data={data.nationality.slice(0, 10)}
							dataKey='name'
							series={[{ name: 'value', color: 'blue.6', label: 'Applicants' }]}
							tickLine='y'
						/>
					</Stack>
				</Paper>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 4 }}>
				<Paper withBorder p='md' h='100%'>
					<Stack>
						<Title order={4}>Age Groups</Title>
						<BarChart
							h={250}
							data={data.ageGroup}
							dataKey='name'
							series={[
								{ name: 'value', color: 'violet.6', label: 'Applicants' },
							]}
							tickLine='y'
						/>
					</Stack>
				</Paper>
			</Grid.Col>
		</Grid>
	);
}
