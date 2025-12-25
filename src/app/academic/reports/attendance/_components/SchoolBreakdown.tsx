'use client';

import {
	Accordion,
	Badge,
	Card,
	Group,
	Progress,
	ScrollArea,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconBuilding,
	IconSchool,
	IconUserExclamation,
	IconUsers,
} from '@tabler/icons-react';
import type { SchoolAttendanceSummary } from '../_server/repository';

type Props = {
	data: SchoolAttendanceSummary[];
};

function getAttendanceColor(rate: number) {
	if (rate >= 75) return 'green';
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

export default function SchoolBreakdown({ data }: Props) {
	if (data.length === 0) {
		return (
			<Card withBorder p='xl' ta='center'>
				<Text c='dimmed'>No attendance data available</Text>
			</Card>
		);
	}

	return (
		<Accordion variant='separated' radius='md'>
			{data.map((school) => (
				<Accordion.Item key={school.schoolCode} value={school.schoolCode}>
					<Accordion.Control>
						<Group justify='space-between' wrap='nowrap' pr='md'>
							<Group gap='sm'>
								<ThemeIcon variant='light' size='md' color='blue'>
									<IconBuilding size={16} />
								</ThemeIcon>
								<div>
									<Text fw={600}>{school.schoolCode}</Text>
									<Text size='xs' c='dimmed'>
										{school.programs.length} program
										{school.programs.length !== 1 ? 's' : ''}
									</Text>
								</div>
							</Group>
							<Group gap='lg'>
								<Group gap={4}>
									<IconUsers size={14} />
									<Text size='sm'>{school.totalStudents}</Text>
								</Group>
								<AttendanceRateBadge rate={school.avgAttendanceRate} />
								{school.atRiskCount > 0 && (
									<Badge color='red' size='sm' variant='filled'>
										{school.atRiskCount} at risk
									</Badge>
								)}
							</Group>
						</Group>
					</Accordion.Control>
					<Accordion.Panel>
						<Stack gap='md'>
							{school.programs.map((program) => (
								<Card key={program.programCode} withBorder p='sm'>
									<Stack gap='sm'>
										<Group justify='space-between'>
											<Group gap='sm'>
												<ThemeIcon variant='light' size='sm' color='violet'>
													<IconSchool size={14} />
												</ThemeIcon>
												<div>
													<Text fw={500} size='sm'>
														{program.programCode}
													</Text>
													<Text size='xs' c='dimmed'>
														{program.programName}
													</Text>
												</div>
											</Group>
											<Group gap='md'>
												<Group gap={4}>
													<IconUsers size={12} />
													<Text size='xs'>{program.totalStudents}</Text>
												</Group>
												<AttendanceRateBadge rate={program.avgAttendanceRate} />
												{program.atRiskCount > 0 && (
													<Group gap={4}>
														<IconUserExclamation size={14} color='red' />
														<Text size='xs' c='red'>
															{program.atRiskCount}
														</Text>
													</Group>
												)}
											</Group>
										</Group>

										<ScrollArea>
											<Table
												striped
												highlightOnHover
												withTableBorder
												withColumnBorders
												fz='xs'
											>
												<Table.Thead>
													<Table.Tr>
														<Table.Th>Class</Table.Th>
														<Table.Th ta='center'>Students</Table.Th>
														<Table.Th ta='center'>Attendance Rate</Table.Th>
														<Table.Th ta='center'>Present</Table.Th>
														<Table.Th ta='center'>Absent</Table.Th>
														<Table.Th ta='center'>Late</Table.Th>
														<Table.Th ta='center'>Excused</Table.Th>
														<Table.Th ta='center'>At Risk</Table.Th>
													</Table.Tr>
												</Table.Thead>
												<Table.Tbody>
													{program.classes.map((cls) => (
														<Table.Tr key={cls.className}>
															<Table.Td>
																<Text fw={500}>{cls.className}</Text>
															</Table.Td>
															<Table.Td ta='center'>
																{cls.totalStudents}
															</Table.Td>
															<Table.Td ta='center'>
																<Group gap={4} justify='center'>
																	<Progress
																		value={cls.avgAttendanceRate}
																		color={getAttendanceColor(
																			cls.avgAttendanceRate
																		)}
																		size='sm'
																		w={50}
																	/>
																	<Text size='xs'>
																		{cls.avgAttendanceRate}%
																	</Text>
																</Group>
															</Table.Td>
															<Table.Td ta='center'>
																<Text c='green'>{cls.totalPresent}</Text>
															</Table.Td>
															<Table.Td ta='center'>
																<Text c='red'>{cls.totalAbsent}</Text>
															</Table.Td>
															<Table.Td ta='center'>
																<Text c='yellow'>{cls.totalLate}</Text>
															</Table.Td>
															<Table.Td ta='center'>
																<Text c='blue'>{cls.totalExcused}</Text>
															</Table.Td>
															<Table.Td ta='center'>
																{cls.atRiskCount > 0 ? (
																	<Badge size='xs' color='red' variant='filled'>
																		{cls.atRiskCount}
																	</Badge>
																) : (
																	<Badge
																		size='xs'
																		color='green'
																		variant='light'
																	>
																		0
																	</Badge>
																)}
															</Table.Td>
														</Table.Tr>
													))}
												</Table.Tbody>
											</Table>
										</ScrollArea>
									</Stack>
								</Card>
							))}
						</Stack>
					</Accordion.Panel>
				</Accordion.Item>
			))}
		</Accordion>
	);
}
