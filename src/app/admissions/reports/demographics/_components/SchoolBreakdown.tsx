'use client';

import { DonutChart } from '@mantine/charts';
import { Card, Grid, Stack, Text, Title } from '@mantine/core';
import type { SchoolDemographics } from '../_server/repository';

type Props = {
	data: SchoolDemographics[];
};

export default function SchoolBreakdown({ data }: Props) {
	return (
		<Grid>
			{data.map((school) => (
				<Grid.Col key={school.schoolId} span={{ base: 12, sm: 6, md: 4 }}>
					<Card withBorder h='100%'>
						<Stack>
							<Title order={5}>{school.schoolName}</Title>
							<Text size='sm' c='dimmed'>
								{school.total} applicants
							</Text>
							<DonutChart
								data={school.gender}
								h={180}
								tooltipDataSource='segment'
								size={120}
								thickness={20}
							/>
						</Stack>
					</Card>
				</Grid.Col>
			))}
		</Grid>
	);
}
