'use client';

import {
	Box,
	Button,
	Card,
	Flex,
	Grid,
	Group,
	Loader,
	Paper,
	Select,
	Skeleton,
	Stack,
	Tabs,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconCalendarWeek, IconFilter, IconTable } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { toClassName } from '@/shared/lib/utils/utils';
import {
	getAssignedModulesForCurrentUser,
	getWeeksForTerm,
} from '../_server/actions';
import AttendanceDownload from './AttendanceDownload';
import AttendanceForm from './AttendanceForm';
import AttendanceSummary from './AttendanceSummary';

type WeeksResult = Awaited<ReturnType<typeof getWeeksForTerm>>;
type ModulesResult = Awaited<
	ReturnType<typeof getAssignedModulesForCurrentUser>
>;

export default function AttendanceView() {
	const [selectedModuleCode, setSelectedModuleCode] = useQueryState(
		'module',
		parseAsString
	);
	const [selectedWeek, setSelectedWeek] = useQueryState('week', parseAsInteger);
	const [selectedClass, setSelectedClass] = useQueryState(
		'studentClass',
		parseAsString
	);

	const { data: modules, isLoading: modulesLoading } = useQuery<ModulesResult>({
		queryKey: ['assigned-modules-attendance'],
		queryFn: getAssignedModulesForCurrentUser,
	});

	const selectedModule = modules?.find(
		(m) =>
			m.moduleCode === selectedModuleCode &&
			toClassName(m.programCode, m.semesterName) === selectedClass
	);

	const { data: weeks, isLoading: weeksLoading } = useQuery<WeeksResult>({
		queryKey: ['term-weeks', selectedModule?.termId],
		queryFn: () => getWeeksForTerm(selectedModule!.termId),
		enabled: !!selectedModule?.termId,
	});

	const currentWeek = weeks?.find((w) => w.isCurrent);
	const effectiveWeek = selectedWeek ?? currentWeek?.weekNumber ?? null;
	const selectedClassName = selectedModule
		? (selectedClass ??
			toClassName(selectedModule.programCode, selectedModule.semesterName))
		: null;

	const handleModuleChange = (value: string | null) => {
		setSelectedModuleCode(value);
		if (!value || !modules) {
			setSelectedClass(null);
			setSelectedWeek(null);
			return;
		}
		const moduleClasses = Array.from(
			new Set(
				modules
					.filter((m) => m.moduleCode === value)
					.map((m) => toClassName(m.programCode, m.semesterName))
			)
		);
		setSelectedClass(moduleClasses[0] ?? null);
		setSelectedWeek(null);
	};

	const handleClassChange = (value: string | null) => {
		setSelectedClass(value);
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
			<Stack gap='lg'>
				<Paper p='lg' withBorder>
					<Group mb='md'>
						<Skeleton h={18} w={100} radius='sm' />
					</Group>
					<Grid gutter='md'>
						<Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
							<Stack gap={5}>
								<Skeleton h={14} w={60} radius='sm' />
								<Skeleton h={36} radius='sm' />
							</Stack>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
							<Stack gap={5}>
								<Skeleton h={14} w={100} radius='sm' />
								<Skeleton h={36} radius='sm' />
							</Stack>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
							<Stack gap={5}>
								<Skeleton h={14} w={40} radius='sm' />
								<Skeleton h={36} radius='sm' />
							</Stack>
						</Grid.Col>
					</Grid>
				</Paper>

				<Paper withBorder p='xl'>
					<Stack align='center' gap='md' py='xl'>
						<Skeleton circle h={56} w={56} />
						<Skeleton h={16} w={200} radius='sm' />
						<Skeleton h={12} w={300} radius='sm' />
					</Stack>
				</Paper>
			</Stack>
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

	const moduleOptions = Array.from(
		new Map(
			modules.map((m) => [m.moduleCode, `${m.moduleCode} - ${m.moduleName}`])
		)
	).map(([value, label]) => ({
		value,
		label,
	}));

	const classOptions = Array.from(
		new Set(
			modules
				.filter((m) => m.moduleCode === selectedModuleCode)
				.map((m) => toClassName(m.programCode, m.semesterName))
		)
	).map((name) => ({
		value: name,
		label: name,
	}));

	const weekOptions =
		weeks?.map((w) => ({
			value: w.weekNumber.toString(),
			label: `Week ${w.weekNumber}${w.isCurrent ? ' (Current)' : ''}`,
		})) ?? [];

	return (
		<Stack gap='lg'>
			<Paper p='lg' withBorder>
				<Group mb='md'>
					<IconFilter size={18} />
					<Text fw={600}>Filters</Text>
				</Group>
				<Flex align='flex-end' gap='sm'>
					<Grid gutter='md' flex={1}>
						<Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
							<Select
								label='Module'
								placeholder='Select module'
								data={moduleOptions}
								value={selectedModuleCode ?? null}
								onChange={handleModuleChange}
								searchable
								clearable
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
							<Select
								label='Student Class'
								placeholder={
									selectedModuleCode ? 'Select class' : 'Select a module first'
								}
								data={classOptions}
								value={selectedClass ?? null}
								onChange={handleClassChange}
								searchable
								clearable
								disabled={!selectedModuleCode}
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
							<Select
								label='Week'
								placeholder={
									selectedModule
										? 'Auto-filled'
										: 'Select module and class first'
								}
								data={weekOptions}
								value={effectiveWeek?.toString() ?? null}
								onChange={handleWeekChange}
								disabled={!selectedModule || weeksLoading}
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
						</Grid.Col>
					</Grid>
				</Flex>
			</Paper>

			{selectedModule && (
				<Stack gap='lg'>
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
							<Box ml='auto' mb={5}>
								<AttendanceDownload
									semesterModuleId={selectedModule.semesterModuleId}
									termId={selectedModule.termId}
									moduleCode={selectedModule.moduleCode}
									moduleName={selectedModule.moduleName}
									className={selectedClassName ?? ''}
								/>
							</Box>
						</Tabs.List>

						<Tabs.Panel value='mark' pt='md'>
							{effectiveWeek ? (
								<AttendanceForm
									semesterModuleId={selectedModule.semesterModuleId}
									termId={selectedModule.termId}
									weekNumber={effectiveWeek}
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
