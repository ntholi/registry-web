'use client';

import {
	Accordion,
	Badge,
	Box,
	Card,
	Divider,
	Group,
	Progress,
	RingProgress,
	ScrollArea,
	SimpleGrid,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
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
						{school.programs.length} program
						{school.programs.length !== 1 ? 's' : ''}
					</Text>
				</Box>
				<SimpleGrid cols={3} spacing='xl'>
					<Box ta='center'>
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
					<Box ta='center'>
						<RingProgress
							size={50}
							thickness={5}
							roundCaps
							sections={[
								{
									value: school.avgAttendanceRate,
									color: getAttendanceColor(school.avgAttendanceRate),
								},
							]}
							label={
								<Text size='xs' ta='center' fw={600}>
									{school.avgAttendanceRate}%
								</Text>
							}
						/>
						<Text size='xs' c='dimmed' mt={4}>
							Attendance
						</Text>
					</Box>
					<Box ta='center'>
						<Text
							size='xl'
							fw={700}
							c={school.atRiskCount > 0 ? 'red' : 'green'}
						>
							{school.atRiskCount}
						</Text>
						<Text size='xs' c='dimmed'>
							At Risk
						</Text>
					</Box>
				</SimpleGrid>
			</Group>
		</Box>
	);
}

type ProgramAccordionProps = {
	programs: SchoolAttendanceSummary['programs'];
};

function ProgramAccordion({ programs }: ProgramAccordionProps) {
	return (
		<Accordion variant='contained' radius='md'>
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
								{program.atRiskCount > 0 && (
									<Group gap={4}>
										<IconUserExclamation
											size={14}
											color='var(--mantine-color-red-6)'
										/>
										<Text size='xs' c='red' fw={500}>
											{program.atRiskCount}
										</Text>
									</Group>
								)}
							</Group>
						</Group>
					</Accordion.Control>
					<Accordion.Panel>
						<ScrollArea>
							<Table striped highlightOnHover withTableBorder fz='xs'>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Class</Table.Th>
										<Table.Th ta='center'>Students</Table.Th>
										<Table.Th ta='center'>Attendance</Table.Th>
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
											<Table.Td ta='center'>{cls.totalStudents}</Table.Td>
											<Table.Td ta='center'>
												<Group gap={6} justify='center'>
													<Progress
														value={cls.avgAttendanceRate}
														color={getAttendanceColor(cls.avgAttendanceRate)}
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
											<Table.Td ta='center'>
												{cls.atRiskCount > 0 ? (
													<Badge size='xs' color='red' variant='filled'>
														{cls.atRiskCount}
													</Badge>
												) : (
													<Text size='xs' c='dimmed'>
														—
													</Text>
												)}
											</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						</ScrollArea>
					</Accordion.Panel>
				</Accordion.Item>
			))}
		</Accordion>
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
		<Stack gap='xl'>
			{data.map((school, index) => (
				<Box key={school.schoolCode}>
					<SchoolHeader school={school} />
					<ProgramAccordion programs={school.programs} />
					{index < data.length - 1 && <Divider my='xl' />}
				</Box>
			))}
		</Stack>
	);
}
