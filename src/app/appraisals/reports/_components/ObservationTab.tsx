'use client';

import { Alert, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { ReportFilter } from '../_lib/types';
import { getObservationReportData } from '../_server/actions';
import CriteriaBreakdown from './CriteriaBreakdown';
import ObservationCategoryChart from './ObservationCategoryChart';
import ObservationLecturerTable from './ObservationLecturerTable';

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

	return (
		<Stack gap='lg'>
			<ObservationCategoryChart data={data.categoryAverages} />
			<CriteriaBreakdown data={data.criteriaBreakdown} />
			<ObservationLecturerTable
				data={data.lecturerRankings}
				categories={data.categoryAverages}
				filter={filter}
			/>
		</Stack>
	);
}
