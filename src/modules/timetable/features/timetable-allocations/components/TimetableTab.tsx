'use client';

import { Box, Card, Center, Stack, Table, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getUserTimetableSlots } from '@timetable/slots/server/actions';
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

const START_MINUTES = 8 * 60 + 30; // 08:30
const END_MINUTES = 16 * 60 + 30; // 16:30
const GRID_COLUMNS = 96; // 5 minute intervals

function getSlotStyle(slot: SlotData) {
	const [startH, startM] = slot.startTime.split(':').map(Number);
	const [endH, endM] = slot.endTime.split(':').map(Number);
	const start = startH * 60 + startM;
	const end = endH * 60 + endM;

	const startOffset = Math.max(0, start - START_MINUTES);
	const duration = Math.min(end, END_MINUTES) - Math.max(start, START_MINUTES);

	if (duration <= 0) return null;

	const startCol = Math.floor(startOffset / 5) + 1;
	const span = Math.ceil(duration / 5);

	return {
		gridColumn: `${startCol} / span ${span}`,
	};
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
					{DAYS.map((day) => {
						const daySlots = slots.filter((s) => s.dayOfWeek === day);
						return (
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
								<Table.Td
									colSpan={4}
									p={0}
									style={{
										height: '1px',
										backgroundColor: 'var(--mantine-color-dark-7)',
									}}
								>
									<Box pos='relative' h='100%' mih={100}>
										{/* Background Grid */}
										<Box
											pos='absolute'
											style={{
												inset: 0,
												display: 'flex',
												pointerEvents: 'none',
											}}
										>
											{TIME_SLOTS.map((slot, i) => (
												<Box
													key={slot.start}
													style={{
														flex: 1,
														borderRight:
															i < 3
																? '1px solid var(--mantine-color-default-border)'
																: 'none',
													}}
												/>
											))}
										</Box>

										{/* Content Grid */}
										<Box
											display='grid'
											style={{
												gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
												gap: '4px 0',
											}}
											p='xs'
										>
											{daySlots.map((slot) => {
												const style = getSlotStyle(slot);
												if (!style) return null;
												const modules = groupAllocationsByModule(slot);

												return (
													<Box key={slot.id} style={style} pr={4}>
														<Stack gap='xs'>
															{modules.map((module) => (
																<Card
																	withBorder
																	key={`${module.moduleCode}-${module.venueId}`}
																	p='xs'
																	radius='md'
																>
																	<Stack gap='4'>
																		<Text
																			size='xs'
																			fw={600}
																			c='blue.2'
																			ta={'center'}
																			style={{ lineHeight: 1.3 }}
																		>
																			{module.moduleName}
																			<Text
																				component='span'
																				c='gray.4'
																				style={{ lineHeight: 1.2 }}
																			>
																				{` (${module.moduleCode})`}
																			</Text>
																		</Text>

																		<Text
																			size='xs'
																			c='cyan.3'
																			fw={500}
																			ta={'center'}
																			tt={'capitalize'}
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
													</Box>
												);
											})}
										</Box>
									</Box>
								</Table.Td>
							</Table.Tr>
						);
					})}
				</Table.Tbody>
			</Table>
		</Box>
	);
}
