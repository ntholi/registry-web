'use client';

import { Alert, Grid, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { ReportFilter } from '../_lib/types';
import { getOverviewData } from '../_server/actions';
import MatrixHeatmap from './MatrixHeatmap';
import OverviewStats from './OverviewStats';
import SchoolComparisonChart from './SchoolComparisonChart';
import SimpleLecturerTable from './SimpleLecturerTable';
import TrendChart from './TrendChart';

type Props = {
	filter: ReportFilter;
};

export default function OverviewTab({ filter }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ['appraisal-overview-data', filter],
		queryFn: () => getOverviewData(filter),
		enabled: Boolean(filter.termId),
		staleTime: 30_000,
	});

	if (!filter.termId) return null;
	if (isLoading) return null;
	if (!data)
		return (
			<Alert color='yellow' title='No data'>
				No overview data found for the selected filters.
			</Alert>
		);

	return (
		<Stack gap='lg'>
			<OverviewStats data={data} />
			<Grid gutter='lg'>
				<Grid.Col span={{ base: 12, md: 7 }}>
					<SchoolComparisonChart data={data.schoolComparison} />
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 5 }}>
					<TrendChart data={data.trendData} overlaid />
				</Grid.Col>
			</Grid>
			<Grid gutter='lg'>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<MatrixHeatmap
						title='Student Feedback Heatmap'
						data={data.feedbackHeatmap}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<MatrixHeatmap
						title='Teaching Observation Heatmap'
						data={data.observationHeatmap}
					/>
				</Grid.Col>
			</Grid>
			<SimpleLecturerTable data={data.lecturerRankings} />
		</Stack>
	);
}
