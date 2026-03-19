'use client';

import { Alert, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { ReportFilter } from '../_lib/types';
import { getOverviewData } from '../_server/actions';
import MatrixHeatmap from './MatrixHeatmap';
import SimpleLecturerTable from './SimpleLecturerTable';

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
			<Stack>
				<MatrixHeatmap
					title='Student Feedback Heatmap'
					data={data.feedbackHeatmap}
				/>
				<MatrixHeatmap
					title='Teaching Observation Heatmap'
					data={data.observationHeatmap}
				/>
			</Stack>
			<SimpleLecturerTable data={data.lecturerRankings} />
		</Stack>
	);
}
