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
import { getAllGraduationDates } from '@registry/dates/graduations/_server/actions';
import {
	IconChartBar,
	IconChartPie,
	IconDownload,
	IconInfoCircle,
	IconUsers,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryState } from 'nuqs';
import { useCallback, useState } from 'react';
import GraduationFilter, {
	type GraduationReportFilter,
} from './_components/Filter';
import GraduationCharts from './_components/GraduationCharts';
import GraduationStats from './_components/GraduationStats';
import ProgramBreakdownTable from './_components/ProgramBreakdownTable';
import StudentTable from './_components/StudentTable';
import {
	generateStudentsListReport,
	generateSummaryGraduationReport,
	getGraduationDataPreview,
	getPaginatedGraduationStudents,
} from './_server/actions';

const PAGE_SIZE = 20;

export default function GraduationReportPage() {
	const [activeTab, setActiveTab] = useQueryState(
		'tab',
		parseAsString.withDefault('summary')
	);

	const [filter, setFilter] = useState<GraduationReportFilter>({});
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch] = useDebouncedValue(searchQuery, 500);
	const [isExportingSummary, setIsExportingSummary] = useState(false);
	const [isExportingStudents, setIsExportingStudents] = useState(false);

	const { data: graduationDates = [], isLoading: datesLoading } = useQuery({
		queryKey: ['graduation-dates'],
		queryFn: getAllGraduationDates,
	});

	const isFilterApplied = Boolean(filter.graduationDate);

	const {
		data: reportData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['graduation-data-preview', filter],
		queryFn: async () => {
			if (!filter.graduationDate) return null;
			const result = await getGraduationDataPreview(filter);
			return result.success ? result.data : null;
		},
		enabled: isFilterApplied,
	});

	const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
		queryKey: [
			'graduation-students-paginated',
			filter,
			currentPage,
			debouncedSearch,
		],
		queryFn: async () => {
			if (!filter.graduationDate) return null;
			const result = await getPaginatedGraduationStudents(
				currentPage,
				PAGE_SIZE,
				{
					...filter,
					searchQuery: debouncedSearch,
				}
			);
			return result.success ? result.data : null;
		},
		enabled: isFilterApplied,
	});

	const canGenerateReport = Boolean(filter.graduationDate);
	const hasData = Boolean(
		reportData &&
			((reportData.summaryData?.schools &&
				reportData.summaryData.schools.length > 0) ||
				(studentsData?.students && studentsData.students.length > 0))
	);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleFilterChange = useCallback(
		(newFilter: GraduationReportFilter) => {
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

	const handleExportSummary = async () => {
		if (!filter.graduationDate) return;

		setIsExportingSummary(true);
		try {
			const result = await generateSummaryGraduationReport(filter);

			if (result.success && result.data) {
				const blob = base64ToBlob(
					result.data,
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
				);

				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `Graduation_Summary_Report_${new Date().toISOString().split('T')[0]}.docx`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);

				notifications.show({
					title: 'Success',
					message: 'Summary report exported successfully',
					color: 'green',
				});
			} else {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to export summary report',
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
			setIsExportingSummary(false);
		}
	};

	const handleExportStudents = async () => {
		if (!filter.graduationDate) return;

		setIsExportingStudents(true);
		try {
			const result = await generateStudentsListReport(filter);

			if (result.success && result.data) {
				const blob = base64ToBlob(
					result.data,
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
				);

				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `Graduation_Students_${new Date().toISOString().split('T')[0]}.xlsx`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);

				notifications.show({
					title: 'Success',
					message: 'Students list exported successfully',
					color: 'green',
				});
			} else {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to export students list',
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
			setIsExportingStudents(false);
		}
	};

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Box>
					<Title order={1} size='h2'>
						Graduation Reports
					</Title>
					<Text c='dimmed' size='sm'>
						View and export graduation data
					</Text>
				</Box>

				<GraduationFilter
					onFilterChange={handleFilterChange}
					availableGraduationDates={graduationDates}
					isLoadingDates={datesLoading}
				/>

				{!isFilterApplied && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='blue'
						variant='light'
					>
						Select a graduation date to generate the report.
					</Alert>
				)}

				{isFilterApplied && canGenerateReport && !hasData && !isLoading && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='yellow'
						variant='light'
					>
						No graduation data found for the selected criteria. Try adjusting
						your filters or selecting a different graduation date.
					</Alert>
				)}

				{isFilterApplied && canGenerateReport && (
					<Tabs
						value={activeTab}
						onChange={(val: string | null) => setActiveTab(val)}
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
												Graduation Summary
											</Text>
											<Text size='sm' c='dimmed'>
												{reportData?.fullData?.totalGraduates || 0} graduate
												{reportData?.fullData?.totalGraduates !== 1 ? 's' : ''}{' '}
												found
											</Text>
										</Box>
										{hasData && (
											<Button
												leftSection={<IconDownload size={16} />}
												onClick={handleExportSummary}
												variant='light'
												loading={isExportingSummary}
												disabled={isExportingSummary}
											>
												Export Summary
											</Button>
										)}
									</Group>
								</Card>

								{reportData?.summaryData?.stats && (
									<GraduationStats {...reportData.summaryData.stats} />
								)}

								{isLoading ? (
									Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map(
										(key) => <ProgramBreakdownTable key={key} loading />
									)
								) : reportData?.summaryData?.schools &&
									reportData.summaryData.schools.length > 0 ? (
									reportData.summaryData.schools.map((school) => (
										<ProgramBreakdownTable
											key={school.schoolName}
											school={school}
										/>
									))
								) : (
									<Alert color='blue' variant='light'>
										No program data available for the selected criteria.
									</Alert>
								)}
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='students' pt='xl'>
							<Stack gap='lg'>
								<Card>
									<Group justify='space-between' align='center'>
										<Box>
											<Text fw={600} size='lg'>
												Graduated Students
											</Text>
											<Text size='sm' c='dimmed'>
												{studentsData?.totalCount || 0} graduate
												{studentsData?.totalCount !== 1 ? 's' : ''} found
											</Text>
										</Box>
										{hasData && (
											<Button
												leftSection={<IconDownload size={16} />}
												onClick={handleExportStudents}
												variant='light'
												loading={isExportingStudents}
												disabled={isExportingStudents}
											>
												Export List
											</Button>
										)}
									</Group>
								</Card>

								<StudentTable
									data={studentsData?.students || []}
									isLoading={isLoadingStudents}
									totalCount={studentsData?.totalCount || 0}
									currentPage={studentsData?.currentPage || 1}
									totalPages={studentsData?.totalPages || 0}
									onPageChange={handlePageChange}
									searchQuery={searchQuery}
									onSearchChange={handleSearchChange}
									filter={filter}
								/>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='charts' pt='xl'>
							<GraduationCharts filter={filter} />
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
