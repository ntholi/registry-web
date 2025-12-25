'use client';

import {
	Badge,
	Card,
	Group,
	Loader,
	Paper,
	Select,
	Stack,
	Tabs,
	Text,
	Title,
} from '@mantine/core';
import { IconCalendarWeek, IconTable } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect } from 'react';
import {
	getAssignedModulesForCurrentUser,
	getWeeksForTerm,
} from '../_server/actions';
import AttendanceForm from './AttendanceForm';
import AttendanceSummary from './AttendanceSummary';

function formatDate(date: Date) {
	return new Date(date).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
}

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

	useEffect(() => {
		if (weeks && currentWeek && selectedModuleId && !selectedWeek) {
			setSelectedWeek(currentWeek.weekNumber);
		}
	}, [weeks, currentWeek, selectedModuleId, selectedWeek, setSelectedWeek]);

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
			<Stack align='center' justify='center' h={300}>
				<Loader />
				<Text c='dimmed'>Loading your modules...</Text>
			</Stack>
		);
	}

	if (!modules || modules.length === 0) {
		return (
			<Card withBorder p='xl'>
				<Stack align='center' gap='md'>
					<IconCalendarWeek size={48} opacity={0.5} />
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
		label: `${m.moduleCode} - ${m.moduleName} (${m.semesterName})`,
	}));

	const weekOptions =
		weeks?.map((w) => ({
			value: w.weekNumber.toString(),
			label: `Week ${w.weekNumber}${w.isCurrent ? ' (Current)' : ''}`,
			description: `${formatDate(w.startDate)} - ${formatDate(w.endDate)}`,
		})) ?? [];

	return (
		<Stack gap='lg'>
			<Paper p='md' withBorder>
				<Group grow>
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
				</Group>
				{currentWeek && selectedModuleId && !selectedWeek && (
					<Text size='xs' c='dimmed' mt='xs'>
						Current week: Week {currentWeek.weekNumber} (
						{formatDate(currentWeek.startDate)} -{' '}
						{formatDate(currentWeek.endDate)})
					</Text>
				)}
			</Paper>

			{selectedModule && (
				<Tabs defaultValue='mark'>
					<Tabs.List>
						<Tabs.Tab value='mark' leftSection={<IconCalendarWeek size={16} />}>
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
									<IconCalendarWeek size={48} opacity={0.5} />
									<Text c='dimmed'>Select a week to mark attendance</Text>
									{weeks && weeks.length > 0 && (
										<Group gap='xs'>
											{weeks.slice(0, 5).map((w) => (
												<Badge
													key={w.weekNumber}
													variant={w.isCurrent ? 'filled' : 'light'}
													color={w.isCurrent ? 'blue' : 'gray'}
													style={{ cursor: 'pointer' }}
													onClick={() => setSelectedWeek(w.weekNumber)}
												>
													Week {w.weekNumber}
												</Badge>
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
			)}

			{!selectedModule && (
				<Paper p='xl' withBorder>
					<Stack align='center' gap='md'>
						<IconCalendarWeek size={48} opacity={0.5} />
						<Text c='dimmed'>Select a module to manage attendance</Text>
					</Stack>
				</Paper>
			)}
		</Stack>
	);
}
