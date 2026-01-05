'use client';
import {
	Alert,
	Box,
	Button,
	Card,
	Container,
	Group,
	Stack,
	Tabs,
	Text,
	Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconChartBar,
	IconDownload,
	IconInfoCircle,
	IconUsers,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useEffect, useState } from 'react';
import Filter, { type SponsoredStudentsFilter } from './_components/Filter';
import StudentTable from './_components/StudentTable';
import Summary from './_components/Summary';
import {
	exportSponsoredStudentsToExcel,
	getSponsoredStudentsReport,
	getSponsoredStudentsSummary,
} from './_server/actions';

const PAGE_SIZE = 20;

export default function SponsoredStudentsReportPage() {
	const [urlParams, setUrlParams] = useQueryStates({
		tab: parseAsString.withDefault('summary'),
		termId: parseAsInteger,
		schoolId: parseAsInteger,
		programId: parseAsInteger,
		semesterNumber: parseAsString,
		sponsorId: parseAsInteger,
	});

	const [filter, setFilter] = useState<SponsoredStudentsFilter>({});
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch] = useDebouncedValue(searchQuery, 500);
	const [isExporting, setIsExporting] = useState(false);

	useEffect(() => {
		const newFilter: SponsoredStudentsFilter = {
			termId: urlParams.termId ?? undefined,
			schoolId: urlParams.schoolId ?? undefined,
			programId: urlParams.programId ?? undefined,
			semesterNumber: urlParams.semesterNumber ?? undefined,
			sponsorId: urlParams.sponsorId ?? undefined,
		};
		setFilter(newFilter);
	}, [urlParams]);

	const isFilterApplied = Boolean(filter.termId);

	const {
		data: summaryData,
		isLoading: summaryLoading,
		error: summaryError,
	} = useQuery({
		queryKey: ['sponsored-students-summary', filter],
		queryFn: async () => {
			if (!filter.termId) return null;
			const result = await getSponsoredStudentsSummary({
				termId: filter.termId,
				schoolId: filter.schoolId,
				programId: filter.programId,
				semesterNumber: filter.semesterNumber,
				sponsorId: filter.sponsorId,
			});
			return result.success ? result.data : null;
		},
		enabled: isFilterApplied,
	});

	const { data: studentsData, isLoading: studentsLoading } = useQuery({
		queryKey: [
			'sponsored-students-paginated',
			filter,
			currentPage,
			debouncedSearch,
		],
		queryFn: async () => {
			if (!filter.termId) return null;
			const result = await getSponsoredStudentsReport(
				{
					termId: filter.termId,
					schoolId: filter.schoolId,
					programId: filter.programId,
					semesterNumber: filter.semesterNumber,
					sponsorId: filter.sponsorId,
					searchQuery: debouncedSearch,
				},
				currentPage,
				PAGE_SIZE
			);
			return result.success ? result.data : null;
		},
		enabled: isFilterApplied,
	});

	const hasData = Boolean(summaryData && summaryData.totalStudents > 0);

	function handlePageChange(page: number) {
		setCurrentPage(page);
	}

	const handleFilterChange = useCallback(
		(newFilter: SponsoredStudentsFilter) => {
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

	async function handleExport() {
		if (!filter.termId) return;

		setIsExporting(true);
		try {
			const result = await exportSponsoredStudentsToExcel({
				termId: filter.termId,
				schoolId: filter.schoolId,
				programId: filter.programId,
				semesterNumber: filter.semesterNumber,
				sponsorId: filter.sponsorId,
			});

			if (result.success && result.data) {
				const byteCharacters = atob(result.data);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], {
					type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				});

				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `sponsored-students-${new Date().toISOString().split('T')[0]}.xlsx`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);

				notifications.show({
					title: 'Success',
					message: 'Sponsored students list exported successfully',
					color: 'green',
				});
			} else {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to export list',
					color: 'red',
				});
			}
		} catch (_error) {
			notifications.show({
				title: 'Error',
				message: 'An unexpected error occurred while exporting',
				color: 'red',
			});
		} finally {
			setIsExporting(false);
		}
	}

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Box>
					<Title order={1} size='h2'>
						Sponsored Students Report
					</Title>
					<Text c='dimmed' size='sm'>
						View and export sponsored students data by academic term
					</Text>
				</Box>

				<Filter onFilterChange={handleFilterChange} />

				{!isFilterApplied && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='blue'
						variant='light'
					>
						Select an academic term to generate the report.
					</Alert>
				)}

				{isFilterApplied && !hasData && !summaryLoading && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='yellow'
						variant='light'
					>
						No sponsored students found for the selected criteria. Try adjusting
						your filters or selecting a different academic term.
					</Alert>
				)}

				{isFilterApplied && (
					<Tabs
						value={urlParams.tab}
						onChange={(value) =>
							setUrlParams({ tab: value }, { shallow: true })
						}
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
						</Tabs.List>

						<Tabs.Panel value='summary' pt='xl'>
							<Stack gap='lg'>
								<Card>
									<Group justify='space-between' align='center'>
										<Box>
											<Text fw={600} size='lg'>
												Sponsorship Summary
											</Text>
											<Text size='sm' c='dimmed'>
												{summaryData?.totalStudents || 0} sponsored student
												{summaryData?.totalStudents !== 1 ? 's' : ''} found
											</Text>
										</Box>
									</Group>
								</Card>

								<Summary
									data={summaryData ?? null}
									isLoading={summaryLoading}
								/>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='students' pt='xl'>
							<Stack gap='lg'>
								<Card>
									<Group justify='space-between' align='center'>
										<Box>
											<Text fw={600} size='lg'>
												Sponsored Students
											</Text>
											<Text size='sm' c='dimmed'>
												{studentsData?.totalCount || 0} student
												{studentsData?.totalCount !== 1 ? 's' : ''} found
											</Text>
										</Box>
										{hasData && (
											<Button
												leftSection={<IconDownload size={16} />}
												onClick={handleExport}
												variant='light'
												loading={isExporting}
												disabled={isExporting}
											>
												Export to Excel
											</Button>
										)}
									</Group>
								</Card>

								<StudentTable
									data={studentsData?.students || []}
									isLoading={studentsLoading}
									totalCount={studentsData?.totalCount || 0}
									currentPage={studentsData?.currentPage || 1}
									totalPages={studentsData?.totalPages || 0}
									onPageChange={handlePageChange}
									searchQuery={searchQuery}
									onSearchChange={handleSearchChange}
								/>
							</Stack>
						</Tabs.Panel>
					</Tabs>
				)}

				{summaryError && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						title='Error Loading Report'
						color='red'
						variant='light'
					>
						{summaryError instanceof Error
							? summaryError.message
							: 'An unexpected error occurred'}
					</Alert>
				)}
			</Stack>
		</Container>
	);
}
