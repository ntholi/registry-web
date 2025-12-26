'use client';

import {
	Alert,
	Box,
	Container,
	Loader,
	Stack,
	Tabs,
	Text,
	Title,
} from '@mantine/core';
import {
	IconBook2,
	IconChartBar,
	IconInfoCircle,
	IconUserExclamation,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useState } from 'react';
import AtRiskStudentsTable from './_components/AtRiskStudentsTable';
import AttendanceFilter from './_components/Filter';
import ModuleBreakdown from './_components/ModuleBreakdown';
import SchoolBreakdown from './_components/SchoolBreakdown';
import { getAttendanceReportData } from './_server/actions';
import type { AttendanceReportFilter } from './_server/repository';

export default function AttendanceReportPage() {
	const [urlParams, setUrlParams] = useQueryStates({
		tab: parseAsString.withDefault('attendance'),
	});

	const [filter, setFilter] = useState<AttendanceReportFilter>({});

	const isFilterApplied = Boolean(filter.termId);

	const {
		data: reportData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['attendance-report-data', filter],
		queryFn: async () => {
			if (!filter.termId) return null;
			const result = await getAttendanceReportData(filter);
			return result.success ? result.data : null;
		},
		enabled: isFilterApplied,
	});

	const handleFilterChange = useCallback(
		(newFilter: AttendanceReportFilter) => {
			setFilter(newFilter);
		},
		[]
	);

	const hasData = Boolean(reportData && reportData.overview.totalStudents > 0);

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Box>
					<Title order={1} size='h2'>
						Attendance Report
					</Title>
					<Text c='dimmed' size='sm'>
						Analyze student attendance across schools, programs, and classes
					</Text>
				</Box>

				<AttendanceFilter onFilterChange={handleFilterChange} />

				{!isFilterApplied && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='blue'
						variant='light'
					>
						Select an academic term to generate the attendance report.
						Optionally filter by schools, programs, semesters, and modules.
					</Alert>
				)}

				{isFilterApplied && isLoading && (
					<Stack align='center' justify='center' py='xl'>
						<Loader size='lg' />
						<Text c='dimmed'>Loading attendance data...</Text>
					</Stack>
				)}

				{isFilterApplied && !isLoading && !hasData && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='yellow'
						variant='light'
					>
						No attendance data found for the selected criteria. Try adjusting
						your filters or selecting a different academic term.
					</Alert>
				)}

				{isFilterApplied && hasData && reportData && (
					<Tabs
						value={urlParams.tab}
						onChange={(value) => setUrlParams({ tab: value })}
					>
						<Tabs.List>
							<Tabs.Tab
								value='attendance'
								leftSection={<IconChartBar size={16} />}
							>
								Attendance
							</Tabs.Tab>
							<Tabs.Tab
								value='at-risk'
								leftSection={<IconUserExclamation size={16} />}
							>
								At-Risk Students
								{reportData.atRiskStudents.length > 0 && (
									<Text span c='red' fw={600} ml={4}>
										({reportData.atRiskStudents.length})
									</Text>
								)}
							</Tabs.Tab>
							<Tabs.Tab value='modules' leftSection={<IconBook2 size={16} />}>
								Modules
							</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='attendance' pt='xl'>
							<Stack gap='lg'>
								<Box>
									<Title order={3} size='h4' mb='md'>
										School & Class Breakdown
									</Title>
									<SchoolBreakdown data={reportData.schools} />
								</Box>
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='at-risk' pt='xl'>
							<Stack gap='md'>
								<Box>
									<Title order={3} size='h4'>
										Students with Poor Attendance
									</Title>
									<Text size='sm' c='dimmed'>
										Students with attendance rate below 75%
									</Text>
								</Box>
								<AtRiskStudentsTable data={reportData.atRiskStudents} />
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value='modules' pt='xl'>
							<Stack gap='md'>
								<Box>
									<Title order={3} size='h4'>
										Attendance by Module
									</Title>
									<Text size='sm' c='dimmed'>
										Module-level attendance analysis sorted by lowest attendance
										first
									</Text>
								</Box>
								<ModuleBreakdown data={reportData.moduleBreakdown} />
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
						{error instanceof Error
							? error.message
							: 'An unexpected error occurred'}
					</Alert>
				)}
			</Stack>
		</Container>
	);
}
