'use client';
import type { ProgramLevel } from '@academic/_database';
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
	IconChartPie,
	IconDownload,
	IconInfoCircle,
	IconUsers,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateToISO } from '@/shared/lib/utils/dates';
import {
	Filter,
	GraduationCharts,
	GrandTotalCard,
	ProgramBreakdownTable,
	type ReportFocusArea,
	ReportFocusModal,
	StudentTable,
} from './_components';
import type {
	GraduationReportFilter,
	GraduationSchoolData,
} from './_lib/types';
import {
	generateGraduatesListReport,
	generateSummaryGraduationReport,
	getGraduationDataPreview,
	getPaginatedGraduationStudents,
} from './_server/actions';

const PAGE_SIZE = 20;

export default function GraduationReportPage() {
	const [urlParams, setUrlParams] = useQueryStates({
		tab: parseAsString.withDefault('summary'),
		graduationMonth: parseAsString,
		schoolIds: parseAsArrayOf(parseAsInteger),
		programId: parseAsInteger,
		programLevels: parseAsArrayOf(parseAsString),
		gender: parseAsString,
		sponsorId: parseAsInteger,
		ageRangeMin: parseAsInteger,
		ageRangeMax: parseAsInteger,
		country: parseAsString,
		visibleColumns: parseAsArrayOf(parseAsString),
	});

	const [filter, setFilter] = useState<GraduationReportFilter>({});
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch] = useDebouncedValue(searchQuery, 500);
	const [isExportingSummary, setIsExportingSummary] = useState(false);
	const [isExportingStudents, setIsExportingStudents] = useState(false);
	const [focusAreas, setFocusAreas] = useState<ReportFocusArea[]>([]);

	useEffect(() => {
		const newFilter: GraduationReportFilter = {
			graduationMonth: urlParams.graduationMonth ?? undefined,
			schoolIds:
				urlParams.schoolIds && urlParams.schoolIds.length > 0
					? urlParams.schoolIds
					: undefined,
			programId: urlParams.programId ?? undefined,
			programLevels:
				urlParams.programLevels && urlParams.programLevels.length > 0
					? (urlParams.programLevels as ProgramLevel[])
					: undefined,
			gender: urlParams.gender ?? undefined,
			sponsorId: urlParams.sponsorId ?? undefined,
			ageRangeMin: urlParams.ageRangeMin ?? undefined,
			ageRangeMax: urlParams.ageRangeMax ?? undefined,
			country: urlParams.country ?? undefined,
			visibleColumns:
				urlParams.visibleColumns && urlParams.visibleColumns.length > 0
					? urlParams.visibleColumns
					: undefined,
		};
		setFilter(newFilter);
	}, [urlParams]);

	const isFilterApplied = Boolean(filter.graduationMonth);

	const {
		data: reportData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['graduation-data-preview', filter],
		queryFn: async () => {
			if (!filter.graduationMonth) return null;
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
			if (!filter.graduationMonth) return null;
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

	const canGenerateReport = Boolean(filter.graduationMonth);
	const hasData = Boolean(
		reportData &&
			((reportData.summaryData?.schools &&
				reportData.summaryData.schools.length > 0) ||
				(studentsData?.students && studentsData.students.length > 0))
	);

	const grandTotals = useMemo(() => {
		if (!reportData?.summaryData?.schools) {
			return {
				totalGraduates: 0,
				maleCount: 0,
				femaleCount: 0,
				averageAge: null as number | null,
				averageTimeToGraduate: null as number | null,
				schoolCount: 0,
				programCount: 0,
			};
		}

		const schools = reportData.summaryData.schools;
		let totalGraduates = 0;
		let maleCount = 0;
		let femaleCount = 0;
		let totalAge = 0;
		let ageCount = 0;
		let totalTime = 0;
		let timeCount = 0;
		let programCount = 0;

		for (const school of schools) {
			totalGraduates += school.totalGraduates;
			maleCount += school.maleCount;
			femaleCount += school.femaleCount;
			programCount += school.programs.length;

			if (school.averageAge != null && school.totalGraduates > 0) {
				totalAge += school.averageAge * school.totalGraduates;
				ageCount += school.totalGraduates;
			}
			if (school.averageTimeToGraduate != null && school.totalGraduates > 0) {
				totalTime += school.averageTimeToGraduate * school.totalGraduates;
				timeCount += school.totalGraduates;
			}
		}

		return {
			totalGraduates,
			maleCount,
			femaleCount,
			averageAge: ageCount > 0 ? totalAge / ageCount : null,
			averageTimeToGraduate: timeCount > 0 ? totalTime / timeCount : null,
			schoolCount: schools.length,
			programCount,
		};
	}, [reportData?.summaryData?.schools]);

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
		if (!filter.graduationMonth) return;

		setIsExportingSummary(true);
		try {
			const result = await generateSummaryGraduationReport(filter);

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
				link.download = `graduation-summary-${filter.graduationMonth}-${formatDateToISO(new Date())}.docx`;
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
		if (!filter.graduationMonth) return;

		setIsExportingStudents(true);
		try {
			const result = await generateGraduatesListReport(filter);

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
				link.download = `graduates-list-${filter.graduationMonth}-${formatDateToISO(new Date())}.xlsx`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);

				notifications.show({
					title: 'Success',
					message: 'Graduates list exported successfully',
					color: 'green',
				});
			} else {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to export graduates list',
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
						View and export graduation data by graduation month
					</Text>
				</Box>

				<Filter onFilterChange={handleFilterChange} />

				{!isFilterApplied && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='blue'
						variant='light'
					>
						Select a graduation month to generate the report.
					</Alert>
				)}

				{isFilterApplied && canGenerateReport && !hasData && !isLoading && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='yellow'
						variant='light'
					>
						No graduation data found for the selected criteria. Try adjusting
						your filters or selecting a different graduation month.
					</Alert>
				)}

				{isFilterApplied && canGenerateReport && (
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
												Program Graduation Summary
											</Text>
											<Text size='sm' c='dimmed'>
												{reportData?.summaryData?.totalGraduates || 0} graduate
												{reportData?.summaryData?.totalGraduates !== 1
													? 's'
													: ''}{' '}
												found
											</Text>
										</Box>
										<Group gap='sm'>
											<ReportFocusModal
												selectedAreas={focusAreas}
												onAreasChange={setFocusAreas}
											/>
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
									</Group>
								</Card>

								{isLoading ? (
									Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map(
										(key) => (
											<ProgramBreakdownTable
												key={key}
												loading
												focusAreas={focusAreas}
											/>
										)
									)
								) : reportData?.summaryData?.schools &&
									reportData.summaryData.schools.length > 0 ? (
									<>
										{reportData.summaryData.schools.map(
											(school: GraduationSchoolData) => (
												<ProgramBreakdownTable
													key={school.schoolName}
													school={school}
													focusAreas={focusAreas}
												/>
											)
										)}
										<GrandTotalCard
											totalGraduates={grandTotals.totalGraduates}
											maleCount={grandTotals.maleCount}
											femaleCount={grandTotals.femaleCount}
											averageAge={grandTotals.averageAge}
											averageTimeToGraduate={grandTotals.averageTimeToGraduate}
											schoolCount={grandTotals.schoolCount}
											programCount={grandTotals.programCount}
											focusAreas={focusAreas}
										/>
									</>
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
												Graduates List
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
