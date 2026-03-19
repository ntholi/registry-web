'use client';

import { Alert, Grid, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { ReportFilter } from '../_lib/types';
import { getFeedbackReportData } from '../_server/actions';
import FeedbackCategoryChart from './FeedbackCategoryChart';
import FeedbackLecturerTable from './FeedbackLecturerTable';
import QuestionBreakdown from './QuestionBreakdown';
import RatingHistogram from './RatingHistogram';

type Props = {
	filter: ReportFilter;
};

export default function StudentFeedbackTab({ filter }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ['appraisal-feedback-data', filter],
		queryFn: () => getFeedbackReportData(filter),
		enabled: Boolean(filter.termId),
		staleTime: 30_000,
	});

	if (!filter.termId) return null;
	if (isLoading) return null;
	if (!data)
		return (
			<Alert color='yellow' title='No data'>
				No student feedback data found for the selected filters.
			</Alert>
		);

	return (
		<Stack gap='lg'>
			<Grid gutter='lg'>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<FeedbackCategoryChart data={data.categoryAverages} />
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<RatingHistogram data={data.ratingDistribution} />
				</Grid.Col>
			</Grid>
			<QuestionBreakdown data={data.questionBreakdown} />
			<FeedbackLecturerTable
				data={data.lecturerRankings}
				categories={data.categoryAverages}
				filter={filter}
			/>
		</Stack>
	);
}
