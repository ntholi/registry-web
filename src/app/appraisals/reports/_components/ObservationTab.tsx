'use client';

import { Alert, Grid, Group, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { ReportFilter } from '../_lib/types';
import { getObservationReportData } from '../_server/actions';
import CriteriaBreakdown from './CriteriaBreakdown';
import ObservationCategoryChart from './ObservationCategoryChart';
import ObservationLecturerTable from './ObservationLecturerTable';
import ObservationOverviewStats from './ObservationOverviewStats';
import TrendChart from './TrendChart';

type Props = {
	filter: ReportFilter;
};

export default function ObservationTab({ filter }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ['appraisal-observation-data', filter],
		queryFn: () => getObservationReportData(filter),
		enabled: Boolean(filter.termId),
		staleTime: 30_000,
	});

	if (!filter.termId) return null;
	if (isLoading) return null;
	if (!data)
		return (
			<Alert color='yellow' title='No data'>
				No observation data found for the selected filters.
			</Alert>
		);

	const trendData = data.trendData.map((d) => ({
		termId: d.termId,
		termCode: d.termCode,
		feedbackAvg: 0,
		observationAvg: d.avgScore,
	}));

	return (
		<Stack gap='lg'>
			<Group justify='space-between'>
				<ObservationOverviewStats data={data.overview} />
			</Group>
			<Grid gutter='lg'>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<ObservationCategoryChart data={data.categoryAverages} />
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<TrendChart data={trendData} />
				</Grid.Col>
			</Grid>
			<CriteriaBreakdown data={data.criteriaBreakdown} />
			<ObservationLecturerTable
				data={data.lecturerRankings}
				categories={data.categoryAverages}
				filter={filter}
			/>
		</Stack>
	);
}
