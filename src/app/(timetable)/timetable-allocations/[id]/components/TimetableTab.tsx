'use client';

import { Box, Card, Center, Stack, Table, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getUserTimetableSlots } from '@/server/timetable/slots/actions';
import { formatSemester } from '@/shared/lib/utils/utils';

type Props = {
	userId: string;
	selectedTermId: number | null;
};

type SlotData = Awaited<ReturnType<typeof getUserTimetableSlots>>[number];

const TIME_SLOTS = [
	{ start: '08:30', end: '10:30' },
	{ start: '10:30', end: '12:30' },
	{ start: '12:30', end: '14:30' },
	{ start: '14:30', end: '16:30' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
	monday: 'Monday',
	tuesday: 'Tuesday',
	wednesday: 'Wednesday',
	thursday: 'Thursday',
	friday: 'Friday',
};

function toClassName(
	semesterModule: {
		semester?: {
			semesterNumber: number | string;
			structure?: {
				program: {
					code: string;
				};
			};
		} | null;
	},
	groupName: string | null
) {
	if (!semesterModule.semester || !semesterModule.semester.structure)
		return 'Unknown';
	const code = semesterModule.semester.structure.program.code;
	const num = String(semesterModule.semester.semesterNumber);
	return `${code}${formatSemester(num, 'mini')}${groupName ? `${groupName}` : ''}`;
}

function formatTime(time: string) {
	return time.slice(0, 5);
}

function groupSlotsByDayAndTime(slots: SlotData[]) {
	const grid: Record<string, Record<string, SlotData[]>> = {};

	for (const day of DAYS) {
		grid[day] = {};
		for (const timeSlot of TIME_SLOTS) {
			const key = `${timeSlot.start}-${timeSlot.end}`;
			grid[day][key] = [];
		}
	}

	for (const slot of slots) {
		const day = slot.dayOfWeek;
		const start = formatTime(slot.startTime);
		const end = formatTime(slot.endTime);
		const key = `${start}-${end}`;

		if (grid[day]?.[key]) {
			grid[day][key].push(slot);
		}
	}

	return grid;
}

function groupAllocationsByModule(slot: SlotData) {
	const moduleMap = new Map<
		number,
		{
			moduleCode: string;
			moduleName: string;
			classType: string;
			venueId: number;
			venueName: string;
			classNames: string[];
		}
	>();

	for (const slotAllocation of slot.timetableSlotAllocations) {
		const allocation = slotAllocation.timetableAllocation;
		const moduleId = allocation.semesterModule.moduleId;
		const moduleName = allocation.semesterModule.module.name;
		const moduleCode = allocation.semesterModule.module.code;
		const classType = allocation.classType;
		const className = toClassName(
			allocation.semesterModule,
			allocation.groupName
		);

		if (moduleMap.has(moduleId)) {
			const existing = moduleMap.get(moduleId);
			if (existing && !existing.classNames.includes(className)) {
				existing.classNames.push(className);
			}
		} else {
			moduleMap.set(moduleId, {
				moduleCode,
				moduleName,
				classType,
				venueId: slot.venueId,
				venueName: slot.venue?.name || '',
				classNames: [className],
			});
		}
	}

	return Array.from(moduleMap.values());
}

export default function TimetableTab({ userId, selectedTermId }: Props) {
	const { data: slots = [], isLoading } = useQuery({
		queryKey: ['timetable-slots', userId, selectedTermId],
		queryFn: () => getUserTimetableSlots(userId, selectedTermId!),
		enabled: !!selectedTermId,
	});

	if (!selectedTermId) {
		return (
			<Center h={400}>
				<Text c='dimmed'>Please select a term to view the timetable</Text>
			</Center>
		);
	}

	if (isLoading) {
		return (
			<Center h={400}>
				<Text c='dimmed'>Loading timetable...</Text>
			</Center>
		);
	}

	if (slots.length === 0) {
		return (
			<Center h={400}>
				<Text c='dimmed'>
					No timetable slots found. Create allocations and generate the
					timetable first.
				</Text>
			</Center>
		);
	}

	const grid = groupSlotsByDayAndTime(slots);

	return (
		<Box p='md'>
			<Table
				withTableBorder
				withColumnBorders
				withRowBorders
				verticalSpacing='0'
				horizontalSpacing='0'
				style={{
					tableLayout: 'fixed',
				}}
			>
				<Table.Thead>
					<Table.Tr>
						<Table.Th
							w='120'
							style={{
								backgroundColor: 'var(--mantine-color-dark-6)',
								textAlign: 'center',
								fontWeight: 600,
							}}
						/>
						{TIME_SLOTS.map((timeSlot) => (
							<Table.Th
								key={`${timeSlot.start}-${timeSlot.end}`}
								style={{
									backgroundColor: 'var(--mantine-color-dark-6)',
									textAlign: 'center',
									fontWeight: 600,
									padding: '1rem',
								}}
							>
								<Text size='sm' fw={600}>
									{timeSlot.start} - {timeSlot.end}
								</Text>
							</Table.Th>
						))}
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{DAYS.map((day) => (
						<Table.Tr key={day}>
							<Table.Td
								style={{
									backgroundColor: 'var(--mantine-color-dark-6)',
									textAlign: 'center',
									fontWeight: 600,
									verticalAlign: 'middle',
								}}
							>
								<Text size='sm' fw={600}>
									{DAY_LABELS[day]}
								</Text>
							</Table.Td>
							{TIME_SLOTS.map((timeSlot) => {
								const key = `${timeSlot.start}-${timeSlot.end}`;
								const slotsInCell = grid[day][key];

								if (slotsInCell.length === 0) {
									return (
										<Table.Td
											key={key}
											style={{
												minHeight: '100px',
												backgroundColor: 'var(--mantine-color-dark-7)',
											}}
										/>
									);
								}

								return (
									<Table.Td
										key={key}
										p='xs'
										style={{
											backgroundColor: 'var(--mantine-color-dark-7)',
											verticalAlign: 'top',
										}}
									>
										<Stack gap='xs'>
											{slotsInCell.map((slot) => {
												const modules = groupAllocationsByModule(slot);
												return (
													<Stack key={slot.id} gap='xs'>
														{modules.map((module) => (
															<Card
																withBorder
																key={`${module.moduleCode}-${module.venueId}`}
																p='xs'
																radius='md'
															>
																<Stack gap='4'>
																	<Text
																		size='sm'
																		fw={600}
																		c='blue.2'
																		style={{ lineHeight: 1.3 }}
																	>
																		{module.moduleName}
																	</Text>
																	<Text
																		size='xs'
																		c='gray.4'
																		style={{ lineHeight: 1.2 }}
																	>
																		{module.moduleCode}
																	</Text>
																	<Text
																		size='xs'
																		c='cyan.3'
																		fw={500}
																		style={{
																			lineHeight: 1.2,
																			textTransform: 'capitalize',
																		}}
																	>
																		{module.classType}
																	</Text>
																	<Box
																		style={{
																			display: 'flex',
																			justifyContent: 'space-between',
																			alignItems: 'center',
																			gap: '0.5rem',
																		}}
																	>
																		<Text size='xs' c='gray.5'>
																			{module.venueName}
																		</Text>
																		<Text
																			size='xs'
																			c='gray.5'
																			style={{ textAlign: 'right' }}
																		>
																			{module.classNames.join(', ')}
																		</Text>
																	</Box>
																</Stack>
															</Card>
														))}
													</Stack>
												);
											})}
										</Stack>
									</Table.Td>
								);
							})}
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</Box>
	);
}
