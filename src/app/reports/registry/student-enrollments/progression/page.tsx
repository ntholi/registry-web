'use client';

import {
	Alert,
	Box,
	Card,
	Container,
	Group,
	Stack,
	Tabs,
	Text,
	Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
	IconChartBar,
	IconChartPie,
	IconInfoCircle,
	IconUsers,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useState } from 'react';
import Filter from './_components/Filter';
import ProgressionCharts from './_components/ProgressionCharts';
import ProgressionSummaryTable from './_components/ProgressionSummaryTable';
import StudentTable from './_components/StudentTable';
import {
	getPaginatedProgressionStudents,
	getProgressionSummary,
} from './_server/actions';
import type { ProgressionFilter } from './_server/repository';

const PAGE_SIZE = 20;

export default function ProgressionReportPage() {
	const [urlParams, setUrlParams] = useQueryStates({
		tab: parseAsString.withDefault('summary'),
		prevTermId: parseAsInteger,
		currTermId: parseAsInteger,
	});

	const [filter, setFilter] = useState<
		ProgressionFilter & { prevTermId?: number; currTermId?: number }
	>({});
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch] = useDebouncedValue(searchQuery, 500);

	const prevTermId = filter.prevTermId;
	const currTermId = filter.currTermId;
	const isFilterApplied = Boolean(prevTermId && currTermId);

	const {
		data: summaryData,
		isLoading: summaryLoading,
		error,
	} = useQuery({
		queryKey: ['progression-summary', prevTermId, currTermId, filter],
		queryFn: async () => {
			if (!prevTermId || !currTermId) return null;
			const result = await getProgressionSummary(
				prevTermId,
				currTermId,
				filter
			);
			return result.success ? result.data : null;
		},
		enabled: isFilterApplied,
	});

	const { data: studentsData, isLoading: studentsLoading } = useQuery({
		queryKey: [
			'progression-students',
			prevTermId,
			currTermId,
			filter,
			currentPage,
			debouncedSearch,
		],
		queryFn: async () => {
			if (!prevTermId || !currTermId) return null;
			const result = await getPaginatedProgressionStudents(
				prevTermId,
				currTermId,
				currentPage,
				PAGE_SIZE,
				{ ...filter, searchQuery: debouncedSearch }
			);
			return result.success ? result.data : null;
		},
		enabled: isFilterApplied,
	});

	const totalStudents = summaryData
		? summaryData.reduce((sum, s) => sum + s.totalPrevious, 0)
		: 0;
	const totalProgressed = summaryData
		? summaryData.reduce((sum, s) => sum + s.progressed, 0)
		: 0;
	const hasData = Boolean(summaryData && summaryData.length > 0);

	const handleFilterChange = useCallback(
		(
			newFilter: ProgressionFilter & {
				prevTermId?: number;
				currTermId?: number;
			}
		) => {
			setFilter(newFilter);
			setCurrentPage(1);
			setSearchQuery('');
		},
		[]
	);

	const handleSearchChange = useCallback((query: string) => {
		setSearchQuery(query);
		setCurrentPage(1);
	}, []);

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Box>
					<Title order={1} size='h2'>
						Student Progression Report
					</Title>
					<Text c='dimmed' size='sm'>
						Compare two terms to analyze student progression rates
					</Text>
				</Box>

				<Filter onFilterChange={handleFilterChange} />

				{!isFilterApplied && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='blue'
						variant='light'
					>
						Select both a previous term and a current term to generate the
						progression report.
					</Alert>
				)}

				{isFilterApplied && !hasData && !summaryLoading && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='yellow'
						variant='light'
					>
						No progression data found. Try adjusting your filters or selecting
						different terms.
					</Alert>
				)}

				{isFilterApplied && (
					<Tabs
						value={urlParams.tab}
						onChange={(value) => setUrlParams({ tab: value })}
					>
						<Tabs.List>
							<Tabs.Tab
								value='summary'
								leftSection={<IconChartBar size={16} />}
							>
								Summary
							</Tabs.Tab>
							<Tabs.Tab value='students' leftSection={<IconUsers size={16} />}>
								Students
							</Tabs.Tab>
							<Tabs.Tab value='charts' leftSection={<IconChartPie size={16} />}>
								Charts
							</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='summary' pt='xl'>
							<Stack gap='lg'>
								<Card>
									<Group justify='space-between' align='center'>
										<Box>
											<Text fw={600} size='lg'>
												Progression Summary
											</Text>
											<Text size='sm' c='dimmed'>
												{totalProgressed} of {totalStudents} students progressed
												{totalStudents > 0 &&
													` (${Math.round((totalProgressed / totalStudents) * 100)}%)`}
											</Text>
										</Box>
									</Group>
								</Card>

								{summaryLoading ? (
									Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((key) => (
										<ProgressionSummaryTable key={key} loading />
									))
								) : hasData ? (
									summaryData!.map((school) => (
										<ProgressionSummaryTable
											key={school.schoolName}
											school={school}
										/>
									))
								) : (
									<Alert color='blue' variant='light'>
										No progression data available for the selected criteria.
									</Alert>
								)}
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='students' pt='xl'>
							<Stack gap='lg'>
								<Card>
									<Box>
										<Text fw={600} size='lg'>
											Student List
										</Text>
										<Text size='sm' c='dimmed'>
											{studentsData?.totalCount ?? 0} student
											{studentsData?.totalCount !== 1 ? 's' : ''} found
										</Text>
									</Box>
								</Card>

								<StudentTable
									data={studentsData?.students ?? []}
									isLoading={studentsLoading}
									totalCount={studentsData?.totalCount ?? 0}
									currentPage={studentsData?.currentPage ?? 1}
									totalPages={studentsData?.totalPages ?? 0}
									onPageChange={setCurrentPage}
									searchQuery={searchQuery}
									onSearchChange={handleSearchChange}
								/>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='charts' pt='xl'>
							<ProgressionCharts
								prevTermId={prevTermId}
								currTermId={currTermId}
								filter={filter}
							/>
						</Tabs.Panel>
					</Tabs>
				)}

				{error && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						title='Error Loading Report'
						color='red'
						variant='light'
					>
						{error instanceof Error
							? error.message
							: 'An unexpected error occurred'}
					</Alert>
				)}
			</Stack>
		</Container>
	);
}
