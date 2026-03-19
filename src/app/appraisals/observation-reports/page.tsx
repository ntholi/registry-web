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
import TrendChart from './_components/TrendChart';
import type { ObservationReportFilter } from './_lib/types';
import {
	checkObservationReportAccess,
	getObservationReportData,
} from './_server/actions';

export default function ObservationReportsPage() {
	const [filter, setFilter] = useState<ObservationReportFilter>({});

	const { data: hasFullAccess = false } = useQuery({
		queryKey: ['observation-report-access'],
		queryFn: () => checkObservationReportAccess(),
	});

	const isFilterApplied = Boolean(filter.termId);

	const { data: reportData, isLoading } = useQuery({
		queryKey: ['observation-report-data', filter],
		queryFn: () => getObservationReportData(filter),
		enabled: isFilterApplied,
	});

	const handleFilterChange = useCallback(
		(newFilter: ObservationReportFilter) => {
			setFilter(newFilter);
		},
		[]
	);

	const hasData = Boolean(
		reportData && reportData.overview.totalObservations > 0
	);

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Group justify='space-between'>
					<Box>
						<Title order={1} size='h2'>
							{hasFullAccess ? 'Observation Reports' : 'My Observations'}
						</Title>
						<Text c='dimmed' size='sm'>
							{hasFullAccess
								? 'Analyze teaching observation scores across schools and programs'
								: 'View your personal observation results'}
						</Text>
					</Box>
					{hasFullAccess && hasData && reportData && (
						<ExportButton data={reportData} filter={filter} />
					)}
				</Group>

				<Filter
					onFilterChange={handleFilterChange}
					hideAdvanced={!hasFullAccess}
				/>

				{!isFilterApplied && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='blue'
						variant='light'
					>
						Select an academic term to generate the observation report.
					</Alert>
				)}

				{isFilterApplied && isLoading && (
					<Stack align='center' justify='center' py='xl'>
						<Loader size='lg' />
						<Text c='dimmed'>Loading observation data...</Text>
					</Stack>
				)}

				{isFilterApplied && !isLoading && !hasData && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='yellow'
						variant='light'
					>
						{hasFullAccess
							? 'No observation data found for the selected criteria. Try adjusting your filters.'
							: 'No observation data found for you in this term.'}
					</Alert>
				)}

				{isFilterApplied && hasData && reportData && (
					<Stack gap='lg'>
						<Grid gutter='lg'>
							<Grid.Col span={{ base: 12, md: 6 }}>
								<CategoryChart data={reportData.categoryAverages} />
							</Grid.Col>
							<Grid.Col span={{ base: 12, md: 6 }}>
								<TrendChart data={reportData.trendData} />
							</Grid.Col>
						</Grid>

						{hasFullAccess && (
							<LecturerTable
								data={reportData.lecturerRankings}
								categories={reportData.categoryAverages}
							/>
						)}
					</Stack>
				)}
			</Stack>
		</Container>
	);
}
