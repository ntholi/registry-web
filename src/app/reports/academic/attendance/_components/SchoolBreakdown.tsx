'use client';

import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
	Card,
	Collapse,
	Group,
	Progress,
	ScrollArea,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconChevronRight, IconSchool, IconUsers } from '@tabler/icons-react';
import { Fragment, useState } from 'react';
import type {
	ModuleAttendanceSummary,
	SchoolAttendanceSummary,
} from '../_server/repository';

type Props = {
	data: SchoolAttendanceSummary[];
	moduleBreakdown: ModuleAttendanceSummary[];
};

function getAttendanceColor(rate: number) {
	if (rate >= 80) return 'green';
	if (rate >= 50) return 'yellow';
	return 'red';
}

function AttendanceRateBadge({ rate }: { rate: number }) {
	return (
		<Badge size='sm' color={getAttendanceColor(rate)} variant='light'>
			{rate}%
		</Badge>
	);
}

type SchoolHeaderProps = {
	school: SchoolAttendanceSummary;
};

function SchoolHeader({ school }: SchoolHeaderProps) {
	return (
		<Box>
			<Group justify='space-between' align='flex-start' mb='md'>
				<Box>
					<Text size='xl' fw={700} c='white'>
						{school.schoolCode}
					</Text>
					<Text size='sm' c='dimmed'>
						{school.schoolName}
					</Text>
				</Box>
				<Box ta='end'>
					<Group gap={6} justify='center'>
						<IconUsers size={16} style={{ opacity: 0.7 }} />
						<Text size='xl' fw={700}>
							{school.totalStudents}
						</Text>
					</Group>
					<Text size='xs' c='dimmed'>
						Students
					</Text>
				</Box>
			</Group>
		</Box>
	);
}

type ProgramAccordionProps = {
	programs: SchoolAttendanceSummary['programs'];
	moduleBreakdown: ModuleAttendanceSummary[];
};

function getClassModules(
	moduleBreakdown: ModuleAttendanceSummary[],
	className: string,
	programCode: string
) {
	return moduleBreakdown
		.filter(
			(mod) => mod.className === className && mod.programCode === programCode
		)
		.sort((a, b) => a.moduleCode.localeCompare(b.moduleCode));
}

function ProgramAccordion({
	programs,
	moduleBreakdown,
}: ProgramAccordionProps) {
	const [openedRows, setOpenedRows] = useState<Record<string, boolean>>({});

	function toggleClassRow(rowKey: string) {
		setOpenedRows((prev) => ({
			...prev,
			[rowKey]: !prev[rowKey],
		}));
	}

	return (
		<Accordion
			variant='contained'
			radius='md'
			styles={{
				item: {
					'&[data-active]': {
						backgroundColor:
							'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))',
					},
				},
				control: {
					'&[aria-expanded="true"]': {
						backgroundColor:
							'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
					},
					'&[aria-expanded="true"]:hover': {
						backgroundColor:
							'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
					},
				},
				panel: {
					backgroundColor:
						'light-dark(var(--mantine-color-white), var(--mantine-color-dark-8))',
				},
			}}
		>
			{programs.map((program) => (
				<Accordion.Item key={program.programCode} value={program.programCode}>
					<Accordion.Control>
						<Group justify='space-between' wrap='nowrap' pr='md'>
							<Group gap='sm'>
								<ThemeIcon variant='light' size='md' color='violet'>
									<IconSchool size={16} />
								</ThemeIcon>
								<Box>
									<Text fw={600} size='sm'>
										{program.programCode}
									</Text>
									<Text size='xs' c='dimmed' lineClamp={1}>
										{program.programName}
									</Text>
								</Box>
							</Group>
							<Group gap='lg'>
								<Group gap={4}>
									<IconUsers size={14} style={{ opacity: 0.6 }} />
									<Text size='sm' fw={500}>
										{program.totalStudents}
									</Text>
								</Group>
								<AttendanceRateBadge rate={program.avgAttendanceRate} />
							</Group>
						</Group>
					</Accordion.Control>
					<Accordion.Panel>
						<ScrollArea>
							<Table withTableBorder fz='xs'>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Class</Table.Th>
										<Table.Th ta='center'>Students</Table.Th>
										<Table.Th ta='center'>Attendance</Table.Th>
										<Table.Th ta='center'>Present</Table.Th>
										<Table.Th ta='center'>Absent</Table.Th>
										<Table.Th ta='center'>Late</Table.Th>
										<Table.Th ta='center'>Excused</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{program.classes.map((cls) => {
										const rowKey = `${program.programCode}-${cls.className}`;
										const isOpen = openedRows[rowKey] === true;
										const classModules = getClassModules(
											moduleBreakdown,
											cls.className,
											program.programCode
										);

										return (
											<Fragment key={rowKey}>
												<Table.Tr>
													<Table.Td>
														<Group gap='xs' wrap='nowrap'>
															<ActionIcon
																size='sm'
																variant='subtle'
																onClick={() => toggleClassRow(rowKey)}
																aria-label={`Toggle modules for ${cls.className}`}
															>
																<IconChevronRight
																	size={14}
																	style={{
																		transform: isOpen
																			? 'rotate(90deg)'
																			: 'rotate(0deg)',
																		transition: 'transform 150ms ease',
																	}}
																/>
															</ActionIcon>
															<Text fw={500}>{cls.className}</Text>
														</Group>
													</Table.Td>
													<Table.Td ta='center'>{cls.totalStudents}</Table.Td>
													<Table.Td ta='center'>
														<Group gap={6} justify='center'>
															<Progress
																value={cls.avgAttendanceRate}
																color={getAttendanceColor(
																	cls.avgAttendanceRate
																)}
																size='sm'
																w={40}
																radius='xl'
															/>
															<Text size='xs' fw={500}>
																{cls.avgAttendanceRate}%
															</Text>
														</Group>
													</Table.Td>
													<Table.Td ta='center'>
														<Text c='green' fw={500}>
															{cls.totalPresent}
														</Text>
													</Table.Td>
													<Table.Td ta='center'>
														<Text c='red' fw={500}>
															{cls.totalAbsent}
														</Text>
													</Table.Td>
													<Table.Td ta='center'>
														<Text c='yellow' fw={500}>
															{cls.totalLate}
														</Text>
													</Table.Td>
													<Table.Td ta='center'>
														<Text c='blue' fw={500}>
															{cls.totalExcused}
														</Text>
													</Table.Td>
												</Table.Tr>
												<Table.Tr>
													<Table.Td colSpan={7} p={0}>
														<Collapse in={isOpen}>
															<Box p='sm'>
																{classModules.length > 0 ? (
																	<Table withTableBorder fz='xs'>
																		<Table.Thead>
																			<Table.Tr>
																				<Table.Th>Module</Table.Th>
																				<Table.Th>Lecturer(s)</Table.Th>
																				<Table.Th ta='center'>
																					Students
																				</Table.Th>
																				<Table.Th ta='center'>
																					Attendance
																				</Table.Th>
																			</Table.Tr>
																		</Table.Thead>
																		<Table.Tbody>
																			{classModules.map((mod) => (
																				<Table.Tr key={mod.semesterModuleId}>
																					<Table.Td>
																						<Group gap='xs'>
																							<Text fw={500}>
																								{mod.moduleCode}
																							</Text>
																							<Text c='dimmed' size='xs'>
																								{mod.moduleName}
																							</Text>
																						</Group>
																					</Table.Td>
																					<Table.Td>
																						{mod.lecturerNames.length > 0 ? (
																							<Text size='xs'>
																								{mod.lecturerNames.join(', ')}
																							</Text>
																						) : (
																							<Text size='xs' c='dimmed'>
																								—
																							</Text>
																						)}
																					</Table.Td>
																					<Table.Td ta='center'>
																						{mod.totalStudents}
																					</Table.Td>
																					<Table.Td ta='center'>
																						<Text size='xs' fw={600}>
																							{mod.totalPresent + mod.totalLate}
																							/
																							{mod.totalPresent +
																								mod.totalAbsent +
																								mod.totalLate +
																								mod.totalExcused}
																						</Text>
																					</Table.Td>
																				</Table.Tr>
																			))}
																		</Table.Tbody>
																	</Table>
																) : (
																	<Text size='sm' c='dimmed'>
																		No modules found for this class.
																	</Text>
																)}
															</Box>
														</Collapse>
													</Table.Td>
												</Table.Tr>
											</Fragment>
										);
									})}
								</Table.Tbody>
							</Table>
						</ScrollArea>
					</Accordion.Panel>
				</Accordion.Item>
			))}
		</Accordion>
	);
}

export default function SchoolBreakdown({ data, moduleBreakdown }: Props) {
	if (data.length === 0) {
		return (
			<Card withBorder p='xl' ta='center'>
				<Text c='dimmed'>No attendance data available</Text>
			</Card>
		);
	}

	return (
		<Stack gap='xl'>
			{data.map((school) => (
				<Box key={school.schoolCode}>
					<SchoolHeader school={school} />
					<ProgramAccordion
						programs={school.programs}
						moduleBreakdown={moduleBreakdown}
					/>
				</Box>
			))}
		</Stack>
	);
}
