'use client';

import {
	Alert,
	Box,
	Container,
	Grid,
	Group,
	Loader,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import CategoryChart from './_components/CategoryChart';
import ExportButton from './_components/ExportButton';
import Filter from './_components/Filter';
import LecturerTable from './_components/LecturerTable';
import OverviewStats from './_components/OverviewStats';
import QuestionBreakdown from './_components/QuestionBreakdown';
import RatingHistogram from './_components/RatingHistogram';
import type { FeedbackReportFilter } from './_lib/types';
import { getFeedbackReportData } from './_server/actions';

export default function FeedbackReportsPage() {
	const [filter, setFilter] = useState<FeedbackReportFilter>({});

	const isFilterApplied = Boolean(filter.termId);

	const { data: reportData, isLoading } = useQuery({
		queryKey: ['feedback-report-data', filter],
		queryFn: () => getFeedbackReportData(filter),
		enabled: isFilterApplied,
	});

	const handleFilterChange = useCallback((newFilter: FeedbackReportFilter) => {
		setFilter(newFilter);
	}, []);

	const hasData = Boolean(reportData && reportData.overview.totalResponses > 0);

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Group justify='space-between'>
					<Box>
						<Title order={1} size='h2'>
							Feedback Report
						</Title>
						<Text c='dimmed' size='sm'>
							Analyze lecturer feedback across schools, programs, and modules
						</Text>
					</Box>
					{hasData && reportData && (
						<ExportButton data={reportData} filter={filter} />
					)}
				</Group>

				<Filter onFilterChange={handleFilterChange} />

				{!isFilterApplied && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='blue'
						variant='light'
					>
						Select an academic term to generate the feedback report.
					</Alert>
				)}

				{isFilterApplied && isLoading && (
					<Stack align='center' justify='center' py='xl'>
						<Loader size='lg' />
						<Text c='dimmed'>Loading feedback data...</Text>
					</Stack>
				)}

				{isFilterApplied && !isLoading && !hasData && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='yellow'
						variant='light'
					>
						No feedback data found for the selected criteria. Try adjusting your
						filters or selecting a different academic term.
					</Alert>
				)}

				{isFilterApplied && hasData && reportData && (
					<Stack gap='lg'>
						<OverviewStats data={reportData.overview} />

						<Grid gutter='lg'>
							<Grid.Col span={{ base: 12, md: 6 }}>
								<CategoryChart data={reportData.categoryAverages} />
							</Grid.Col>
							<Grid.Col span={{ base: 12, md: 6 }}>
								<RatingHistogram data={reportData.ratingDistribution} />
							</Grid.Col>
						</Grid>

						<LecturerTable
							data={reportData.lecturerRankings}
							categories={reportData.categoryAverages}
							filter={filter}
						/>

						<QuestionBreakdown data={reportData.questionBreakdown} />
					</Stack>
				)}
			</Stack>
		</Container>
	);
}
