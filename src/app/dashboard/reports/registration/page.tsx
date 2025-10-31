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
import { IconChartBar, IconDownload, IconInfoCircle, IconUsers } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
	generateStudentsListReport,
	generateSummaryRegistrationReport,
	getPaginatedRegistrationStudents,
	getRegistrationDataPreview,
} from '@/server/reports/registration/actions';
import ProgramBreakdownTable from './ProgramBreakdownTable';
import RegistrationFilter, { type ReportFilter } from './RegistrationFilter';
import StudentTable from './StudentTable';

const PAGE_SIZE = 20;

export default function RegistrationReportPage() {
	const [filter, setFilter] = useState<ReportFilter>({});
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch] = useDebouncedValue(searchQuery, 500);
	const [isExportingSummary, setIsExportingSummary] = useState(false);
	const [isExportingStudents, setIsExportingStudents] = useState(false);

	const {
		data: reportData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['registration-data-preview', filter],
		queryFn: async () => {
			if (!filter.termId) return null;
			const result = await getRegistrationDataPreview(filter.termId, filter);
			return result.success ? result.data : null;
		},
		enabled: Boolean(filter.termId),
	});

	const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
		queryKey: ['registration-students-paginated', filter, currentPage, debouncedSearch],
		queryFn: async () => {
			if (!filter.termId) return null;
			const result = await getPaginatedRegistrationStudents(filter.termId, currentPage, PAGE_SIZE, {
				...filter,
				searchQuery: debouncedSearch,
			});
			return result.success ? result.data : null;
		},
		enabled: Boolean(filter.termId),
	});

	const canGenerateReport = Boolean(filter.termId);
	const hasData = Boolean(
		reportData &&
			((reportData.summaryData?.schools && reportData.summaryData.schools.length > 0) ||
				(studentsData?.students && studentsData.students.length > 0))
	);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleFilterChange = (newFilter: ReportFilter) => {
		setFilter(newFilter);
		setCurrentPage(1);
		setSearchQuery('');
	};

	const handleSearchChange = useCallback((query: string) => {
		setSearchQuery(query);
		setCurrentPage(1);
	}, []);

	const handleExportSummary = async () => {
		if (!filter.termId) return;

		setIsExportingSummary(true);
		try {
			const result = await generateSummaryRegistrationReport(filter.termId, filter);

			if (result.success && result.data) {
				const byteCharacters = atob(result.data);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], {
					type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				});

				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `program-enrollment-summary-${new Date().toISOString().split('T')[0]}.docx`;
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
		if (!filter.termId) return;

		setIsExportingStudents(true);
		try {
			const result = await generateStudentsListReport(filter.termId, filter);

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
				link.download = `registered-students-${new Date().toISOString().split('T')[0]}.xlsx`;
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
						Registration Reports
					</Title>
					<Text c='dimmed' size='sm'>
						View and export registration data by academic term
					</Text>
				</Box>

				<RegistrationFilter filter={filter} onFilterChange={handleFilterChange} />

				{canGenerateReport && !hasData && !isLoading && (
					<Alert icon={<IconInfoCircle size={16} />} color='yellow' variant='light'>
						No registration data found for the selected criteria. Try adjusting your filters or
						selecting a different academic term.
					</Alert>
				)}

				{canGenerateReport && (
					<Tabs defaultValue='summary'>
						<Tabs.List>
							<Tabs.Tab value='summary' leftSection={<IconChartBar size={16} />}>
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
												Program Enrollment
											</Text>
											<Text size='sm' c='dimmed'>
												Registration statistics by program
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

								{isLoading ? (
									Array.from({ length: 3 }).map((_, i) => (
										<ProgramBreakdownTable key={`skeleton-${i}`} loading />
									))
								) : reportData?.summaryData?.schools &&
									reportData.summaryData.schools.length > 0 ? (
									reportData.summaryData.schools.map((school, index) => (
										<ProgramBreakdownTable key={index} school={school} />
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
												Registered Students
											</Text>
											<Text size='sm' c='dimmed'>
												{studentsData?.totalCount || 0} student
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
								/>
							</Stack>
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
						{error instanceof Error ? error.message : 'An unexpected error occurred'}
					</Alert>
				)}
			</Stack>
		</Container>
	);
}
