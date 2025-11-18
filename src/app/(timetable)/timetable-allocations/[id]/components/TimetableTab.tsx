'use client';

import { Box, Center, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getUserTimetableSlots } from '@/server/timetable/slots/actions';
import { formatSemester } from '@/shared/lib/utils/utils';
import classes from './TimetableTab.module.css';

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
			semesterNumber: string;
			structure?: {
				program: {
					code: string;
				};
			};
		};
	},
	groupName: string | null
) {
	if (!semesterModule.semester || !semesterModule.semester.structure)
		return 'Unknown';
	const code = semesterModule.semester.structure.program.code;
	const num = semesterModule.semester.semesterNumber;
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
				venueId: slot.venueId,
				venueName: slot.venue.name,
				classNames: [className],
			});
		}
	}

	return Array.from(moduleMap.values());
}

export default function TimetableTab({ userId, selectedTermId }: Props) {
	const { data: slots = [], isLoading } = useQuery({
		queryKey: ['user-timetable-slots', userId, selectedTermId],
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
		<Box className={classes.timetableContainer}>
			<table className={classes.timetable}>
				<thead>
					<tr>
						<th className={classes.timeHeader} />
						{TIME_SLOTS.map((timeSlot) => (
							<th key={`${timeSlot.start}-${timeSlot.end}`}>
								{timeSlot.start} - {timeSlot.end}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{DAYS.map((day) => (
						<tr key={day}>
							<td className={classes.dayLabel}>{DAY_LABELS[day]}</td>
							{TIME_SLOTS.map((timeSlot) => {
								const key = `${timeSlot.start}-${timeSlot.end}`;
								const slotsInCell = grid[day][key];

								if (slotsInCell.length === 0) {
									return <td key={key} className={classes.emptyCell} />;
								}

								return (
									<td key={key} className={classes.slotCell}>
										{slotsInCell.map((slot, _idx) => {
											const modules = groupAllocationsByModule(slot);
											return (
												<Box key={slot.id} className={classes.slot}>
													{modules.map((module) => (
														<Stack
															key={`${module.moduleCode}-${module.venueId}`}
															gap={4}
															className={classes.moduleBlock}
														>
															<Text
																size='sm'
																fw={600}
																ta='center'
																className={classes.moduleName}
															>
																{module.moduleName}
															</Text>
															<Text
																size='xs'
																ta='center'
																className={classes.moduleCode}
															>
																{module.moduleCode}
															</Text>
															<Box className={classes.slotFooter}>
																<Text size='xs' className={classes.venueName}>
																	{module.venueName}
																</Text>
																<Text
																	size='xs'
																	className={classes.classNames}
																	ta='right'
																>
																	{module.classNames.join(', ')}
																</Text>
															</Box>
														</Stack>
													))}
												</Box>
											);
										})}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</Box>
	);
}
