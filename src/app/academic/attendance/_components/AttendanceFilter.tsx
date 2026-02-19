'use client';

import {
	Divider,
	Flex,
	Grid,
	Group,
	Loader,
	Paper,
	Select,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconCalendarDot } from '@tabler/icons-react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { toClassName } from '@/shared/lib/utils/utils';

interface ModuleItem {
	moduleCode: string;
	moduleName: string;
	programCode: string;
	semesterName: string;
}

interface WeekItem {
	weekNumber: number;
	isCurrent: boolean;
}

type Props = {
	modules: ModuleItem[];
	weeks: WeekItem[];
	weeksLoading: boolean;
};

export default function AttendanceFilter({
	modules,
	weeks,
	weeksLoading,
}: Props) {
	const [selectedModuleCode, setSelectedModuleCode] = useQueryState(
		'module',
		parseAsString
	);
	const [selectedClass, setSelectedClass] = useQueryState(
		'studentClass',
		parseAsString
	);
	const [selectedWeek, setSelectedWeek] = useQueryState('week', parseAsInteger);

	const selectedModule = modules.find(
		(m) =>
			m.moduleCode === selectedModuleCode &&
			toClassName(m.programCode, m.semesterName) === selectedClass
	);
	const currentWeek = weeks.find((w) => w.isCurrent);
	const effectiveWeek = selectedWeek ?? currentWeek?.weekNumber ?? null;

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

	const weekOptions = weeks.map((w) => ({
		value: w.weekNumber.toString(),
		label: `Week ${w.weekNumber}${w.isCurrent ? ' (Current)' : ''}`,
	}));

	const handleModuleChange = (value: string | null) => {
		setSelectedModuleCode(value);
		if (!value) {
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
			return;
		}
		setSelectedWeek(null);
	};

	return (
		<Paper p='lg' withBorder>
			<Group mb='md'>
				<IconCalendarDot size={'1.5rem'} />
				<Title order={4} fw={400}>
					Student Attendance
				</Title>
			</Group>
			<Divider mb='lg' />
			<Flex align='flex-end' gap='sm'>
				<Grid gutter='md' flex={1}>
					<Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
						<Select
							label='Module'
							placeholder='Select module'
							data={moduleOptions}
							value={selectedModuleCode}
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
							value={selectedClass}
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
								selectedModule ? 'Auto-filled' : 'Select module and class first'
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
	);
}
