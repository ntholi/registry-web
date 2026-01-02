'use client';
import {
	Alert,
	Box,
	Button,
	Container,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from 'nuqs';
import { useCallback, useEffect, useState } from 'react';
import { ClassReportsList } from './_components/ClassReportTable';
import BoeFilter, { type BoeReportFilter } from './_components/Filter';
import { generateExcel, getClassReports, getPreview } from './_server/actions';
import type { BoeFilter as BoeFilterType } from './_server/repository';

export default function BoeReportPage() {
	const [urlParams] = useQueryStates({
		termId: parseAsInteger,
		schoolIds: parseAsArrayOf(parseAsInteger),
		programId: parseAsInteger,
		semesterNumber: parseAsString,
	});

	const [filter, setFilter] = useState<BoeReportFilter>({});
	const [isExporting, setIsExporting] = useState(false);

	useEffect(() => {
		const newFilter: BoeReportFilter = {
			termId: urlParams.termId ?? undefined,
			schoolIds:
				urlParams.schoolIds && urlParams.schoolIds.length > 0
					? urlParams.schoolIds
					: undefined,
			programId: urlParams.programId ?? undefined,
			semesterNumber: urlParams.semesterNumber ?? undefined,
		};
		setFilter(newFilter);
	}, [urlParams]);

	const isFilterApplied = Boolean(
		filter.termId && filter.schoolIds && filter.schoolIds.length > 0
	);

	const serverFilter: BoeFilterType | null =
		filter.termId && filter.schoolIds && filter.schoolIds.length > 0
			? {
					termId: filter.termId,
					schoolIds: filter.schoolIds,
					programId: filter.programId,
					semesterNumber: filter.semesterNumber,
				}
			: null;

	const {
		data: previewData,
		isLoading: isLoadingPreview,
		error: previewError,
	} = useQuery({
		queryKey: ['boe-preview', serverFilter],
		queryFn: async () => {
			if (!serverFilter) return null;
			const result = await getPreview(serverFilter);
			return result.success ? result.data : null;
		},
		enabled: isFilterApplied,
	});

	const { data: classReports, isLoading: isLoadingClasses } = useQuery({
		queryKey: ['boe-class-reports', serverFilter],
		queryFn: async () => {
			if (!serverFilter) return null;
			const result = await getClassReports(serverFilter);
			return result.success ? result.data : null;
		},
		enabled: isFilterApplied,
	});

	const hasData = Boolean(
		previewData?.summary &&
			previewData.summary.length > 0 &&
			previewData.totalStudents > 0
	);

	const handleFilterChange = useCallback((newFilter: BoeReportFilter) => {
		setFilter(newFilter);
	}, []);

	const handleExport = async () => {
		if (!serverFilter) return;

		setIsExporting(true);
		try {
			const result = await generateExcel(serverFilter);

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
				link.download = `boe-report-${previewData?.termCode || 'report'}-${new Date().toISOString().split('T')[0]}.xlsx`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);

				notifications.show({
					title: 'Success',
					message: 'BOE report exported successfully',
					color: 'green',
				});
			} else {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to export BOE report',
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
	};

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Box>
					<Title order={1} size='h2'>
						Board of Examination Report
					</Title>
					<Text c='dimmed' size='sm'>
						View and export student examination results by academic term
					</Text>
				</Box>

				<BoeFilter onFilterChange={handleFilterChange} />

				{!isFilterApplied && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='blue'
						variant='light'
					>
						Select an academic term and at least one school, then click the play
						button to generate the report.
					</Alert>
				)}

				{isFilterApplied && !hasData && !isLoadingPreview && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='yellow'
						variant='light'
					>
						No examination data found for the selected criteria. Try adjusting
						your filters or selecting a different academic term.
					</Alert>
				)}

				{isFilterApplied && (
					<Stack gap='lg'>
						<Paper withBorder p='md'>
							<Group justify='space-between' align='center'>
								<Box>
									<Text fw={600} size='lg'>
										Class Reports
									</Text>
									<Text size='sm' c='dimmed'>
										{previewData?.totalStudents || 0} student
										{previewData?.totalStudents !== 1 ? 's' : ''} found
										{previewData?.termCode &&
											` • Term: ${previewData.termCode}`}
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
										Export Report
									</Button>
								)}
							</Group>
						</Paper>

						<ClassReportsList
							reports={classReports ?? undefined}
							loading={isLoadingClasses}
						/>
					</Stack>
				)}

				{previewError && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						title='Error Loading Report'
						color='red'
						variant='light'
					>
						{previewError instanceof Error
							? previewError.message
							: 'An unexpected error occurred'}
					</Alert>
				)}
			</Stack>
		</Container>
	);
}
