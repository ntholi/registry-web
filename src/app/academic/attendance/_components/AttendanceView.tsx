'use client';

import {
	Badge,
	Button,
	Card,
	Group,
	Loader,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Tabs,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconCalendarWeek, IconTable } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, useQueryState } from 'nuqs';
import { formatDate } from '@/shared/lib/utils/dates';
import { toClassName } from '@/shared/lib/utils/utils';
import {
	getAssignedModulesForCurrentUser,
	getWeeksForTerm,
} from '../_server/actions';
import AttendanceForm from './AttendanceForm';
import AttendanceSummary from './AttendanceSummary';

export default function AttendanceView() {
	const [selectedModuleId, setSelectedModuleId] = useQueryState(
		'module',
		parseAsInteger
	);
	const [selectedWeek, setSelectedWeek] = useQueryState('week', parseAsInteger);

	const { data: modules, isLoading: modulesLoading } = useQuery({
		queryKey: ['assigned-modules-attendance'],
		queryFn: getAssignedModulesForCurrentUser,
	});

	const selectedModule = modules?.find(
		(m) => m.semesterModuleId === selectedModuleId
	);

	const { data: weeks, isLoading: weeksLoading } = useQuery({
		queryKey: ['term-weeks', selectedModule?.termId],
		queryFn: () => getWeeksForTerm(selectedModule!.termId),
		enabled: !!selectedModule?.termId,
	});

	const currentWeek = weeks?.find((w) => w.isCurrent);

	const handleModuleChange = (value: string | null) => {
		if (value) {
			setSelectedModuleId(parseInt(value, 10));
		} else {
			setSelectedModuleId(null);
		}
		setSelectedWeek(null);
	};

	const handleWeekChange = (value: string | null) => {
		if (value) {
			setSelectedWeek(parseInt(value, 10));
		} else {
			setSelectedWeek(null);
		}
	};

	if (modulesLoading) {
		return (
			<Paper withBorder p='xl'>
				<Stack align='center' gap='sm'>
					<Loader />
					<Text c='dimmed'>Loading your modules...</Text>
				</Stack>
			</Paper>
		);
	}

	if (!modules || modules.length === 0) {
		return (
			<Card withBorder p='xl'>
				<Stack align='center' gap='md'>
					<ThemeIcon size={56} radius='xl' variant='light'>
						<IconCalendarWeek size={28} />
					</ThemeIcon>
					<Title order={3} c='dimmed'>
						No Assigned Modules
					</Title>
					<Text c='dimmed' ta='center'>
						You don&apos;t have any modules assigned for the current term.
						Contact the administrator if you believe this is an error.
					</Text>
				</Stack>
			</Card>
		);
	}

	const moduleOptions = modules.map((m) => ({
		value: m.semesterModuleId.toString(),
		label: `${toClassName(m.programCode, m.semesterName)} - ${m.moduleName}`,
	}));

	const weekOptions =
		weeks?.map((w) => ({
			value: w.weekNumber.toString(),
			label: `Week ${w.weekNumber}${w.isCurrent ? ' (Current)' : ''}`,
			description: `${formatDate(w.startDate, 'short')} - ${formatDate(w.endDate, 'short')}`,
		})) ?? [];

	return (
		<Stack gap='lg'>
			<Paper p='lg' withBorder>
				<Stack gap='md'>
					<Group justify='space-between' align='flex-start'>
						<Stack gap={2}>
							<Title order={4}>Filters</Title>
							<Text size='sm' c='dimmed'>
								Pick a module and week to start marking attendance.
							</Text>
						</Stack>
						{currentWeek && selectedModuleId && !selectedWeek && (
							<Button
								variant='light'
								size='xs'
								onClick={() => setSelectedWeek(currentWeek.weekNumber)}
							>
								Use current week
							</Button>
						)}
					</Group>
					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
						<Select
							label='Module'
							placeholder='Select a module'
							data={moduleOptions}
							value={selectedModuleId?.toString() ?? null}
							onChange={handleModuleChange}
							searchable
							clearable
						/>
						<Select
							label='Week'
							placeholder={
								selectedModuleId ? 'Select a week' : 'Select a module first'
							}
							data={weekOptions}
							value={selectedWeek?.toString() ?? null}
							onChange={handleWeekChange}
							disabled={!selectedModuleId || weeksLoading}
							searchable
							rightSection={weeksLoading ? <Loader size='xs' /> : null}
							renderOption={({ option }) => (
								<Stack gap={0}>
									<Text size='sm'>{option.label}</Text>
									<Text size='xs' c='dimmed'>
										{(option as { description?: string }).description}
									</Text>
								</Stack>
							)}
						/>
					</SimpleGrid>
					{currentWeek && selectedModuleId && !selectedWeek && (
						<Text size='xs' c='dimmed'>
							Current week: Week {currentWeek.weekNumber} (
							{formatDate(currentWeek.startDate, 'short')} -{' '}
							{formatDate(currentWeek.endDate, 'short')})
						</Text>
					)}
				</Stack>
			</Paper>

			{selectedModule && (
				<Stack gap='lg'>
					<Card withBorder p='lg'>
						<Group justify='space-between' align='center'>
							<Stack gap={4}>
								<Group gap='xs'>
									<Badge variant='light'>{selectedModule.moduleCode}</Badge>
									<Title order={4}>{selectedModule.moduleName}</Title>
								</Group>
								<Text size='sm' c='dimmed'>
									{toClassName(
										selectedModule.programCode,
										selectedModule.semesterName
									)}
								</Text>
							</Stack>
							{currentWeek && (
								<Group gap='xs'>
									<ThemeIcon size={32} radius='xl' variant='light'>
										<IconCalendarWeek size={16} />
									</ThemeIcon>
									<Stack gap={0}>
										<Text size='xs' c='dimmed'>
											Current week
										</Text>
										<Text size='sm'>Week {currentWeek.weekNumber}</Text>
									</Stack>
								</Group>
							)}
						</Group>
					</Card>

					<Tabs defaultValue='mark'>
						<Tabs.List>
							<Tabs.Tab
								value='mark'
								leftSection={<IconCalendarWeek size={16} />}
							>
								Attendance
							</Tabs.Tab>
							<Tabs.Tab value='summary' leftSection={<IconTable size={16} />}>
								Summary
							</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='mark' pt='md'>
							{selectedWeek ? (
								<AttendanceForm
									semesterModuleId={selectedModule.semesterModuleId}
									termId={selectedModule.termId}
									weekNumber={selectedWeek}
									assignedModuleId={selectedModule.assignedModuleId}
								/>
							) : (
								<Paper p='xl' withBorder>
									<Stack align='center' gap='md'>
										<ThemeIcon size={56} radius='xl' variant='light'>
											<IconCalendarWeek size={28} />
										</ThemeIcon>
										<Text c='dimmed'>Select a week to mark attendance</Text>
										{weeks && weeks.length > 0 && (
											<Group gap='xs'>
												{weeks.slice(0, 5).map((w) => (
													<Button
														key={w.weekNumber}
														variant={w.isCurrent ? 'filled' : 'light'}
														color={w.isCurrent ? 'blue' : 'gray'}
														size='xs'
														onClick={() => setSelectedWeek(w.weekNumber)}
													>
														Week {w.weekNumber}
													</Button>
												))}
												{weeks.length > 5 && (
													<Text size='xs' c='dimmed'>
														+{weeks.length - 5} more
													</Text>
												)}
											</Group>
										)}
									</Stack>
								</Paper>
							)}
						</Tabs.Panel>

						<Tabs.Panel value='summary' pt='md'>
							<AttendanceSummary
								semesterModuleId={selectedModule.semesterModuleId}
								termId={selectedModule.termId}
							/>
						</Tabs.Panel>
					</Tabs>
				</Stack>
			)}

			{!selectedModule && (
				<Paper p='xl' withBorder>
					<Stack align='center' gap='md'>
						<ThemeIcon size={56} radius='xl' variant='light'>
							<IconCalendarWeek size={28} />
						</ThemeIcon>
						<Text c='dimmed'>Select a module to manage attendance</Text>
					</Stack>
				</Paper>
			)}
		</Stack>
	);
}
