'use client';
import {
	Badge,
	Card,
	Grid,
	Group,
	Paper,
	RingProgress,
	SimpleGrid,
	Skeleton,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import { IconCheck, IconSchool, IconUsers, IconX } from '@tabler/icons-react';
import { formatSemester } from '@/shared/lib/utils/utils';

interface SponsorSummary {
	sponsorName: string;
	sponsorCode: string;
	studentCount: number;
	confirmedCount: number;
	unconfirmedCount: number;
}

interface SchoolSummary {
	schoolCode: string;
	schoolName: string;
	studentCount: number;
}

interface ProgramSummary {
	programName: string;
	schoolCode: string;
	studentCount: number;
}

interface SemesterSummary {
	semester: string;
	studentCount: number;
}

interface SummaryData {
	totalStudents: number;
	confirmedCount: number;
	unconfirmedCount: number;
	bySponsor: SponsorSummary[];
	bySchool: SchoolSummary[];
	byProgram: ProgramSummary[];
	bySemester: SemesterSummary[];
}

interface Props {
	data: SummaryData | null;
	isLoading: boolean;
}

export default function Summary({ data, isLoading }: Props) {
	if (isLoading) {
		return (
			<Stack gap='lg'>
				<SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
					{Array.from({ length: 4 }, (_, i) => `stat-skeleton-${i}`).map(
						(key) => (
							<Skeleton key={key} height={120} radius='md' />
						)
					)}
				</SimpleGrid>
				<Skeleton height={300} radius='md' />
				<Skeleton height={200} radius='md' />
			</Stack>
		);
	}

	if (!data) {
		return null;
	}

	const confirmedPercent =
		data.totalStudents > 0
			? Math.round((data.confirmedCount / data.totalStudents) * 100)
			: 0;

	return (
		<Stack gap='lg'>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
				<Card withBorder padding='lg'>
					<Group justify='space-between'>
						<div>
							<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
								Total Students
							</Text>
							<Text fw={700} size='xl'>
								{data.totalStudents.toLocaleString()}
							</Text>
						</div>
						<IconUsers
							size={32}
							stroke={1.5}
							color='var(--mantine-color-blue-6)'
						/>
					</Group>
				</Card>

				<Card withBorder padding='lg'>
					<Group justify='space-between'>
						<div>
							<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
								Confirmed
							</Text>
							<Text fw={700} size='xl' c='green'>
								{data.confirmedCount.toLocaleString()}
							</Text>
						</div>
						<IconCheck
							size={32}
							stroke={1.5}
							color='var(--mantine-color-green-6)'
						/>
					</Group>
				</Card>

				<Card withBorder padding='lg'>
					<Group justify='space-between'>
						<div>
							<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
								Unconfirmed
							</Text>
							<Text fw={700} size='xl' c='yellow'>
								{data.unconfirmedCount.toLocaleString()}
							</Text>
						</div>
						<IconX
							size={32}
							stroke={1.5}
							color='var(--mantine-color-yellow-6)'
						/>
					</Group>
				</Card>

				<Card withBorder padding='lg'>
					<Group justify='space-between'>
						<div>
							<Text size='xs' c='dimmed' tt='uppercase' fw={700}>
								Sponsors
							</Text>
							<Text fw={700} size='xl'>
								{data.bySponsor.length}
							</Text>
						</div>
						<RingProgress
							size={60}
							thickness={6}
							roundCaps
							sections={[{ value: confirmedPercent, color: 'green' }]}
							label={
								<Text size='xs' ta='center' fw={700}>
									{confirmedPercent}%
								</Text>
							}
						/>
					</Group>
				</Card>
			</SimpleGrid>

			<Grid>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<Paper withBorder p='md'>
						<Title order={4} mb='md'>
							By Sponsor
						</Title>
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Sponsor</Table.Th>
									<Table.Th ta='center'>Students</Table.Th>
									<Table.Th ta='center'>Confirmed</Table.Th>
									<Table.Th ta='center'>Unconfirmed</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{data.bySponsor.map((sponsor) => (
									<Table.Tr key={sponsor.sponsorCode}>
										<Table.Td>
											<Text size='sm' fw={500}>
												{sponsor.sponsorName}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Badge variant='light'>{sponsor.studentCount}</Badge>
										</Table.Td>
										<Table.Td ta='center'>
											<Badge variant='light' color='green'>
												{sponsor.confirmedCount}
											</Badge>
										</Table.Td>
										<Table.Td ta='center'>
											<Badge variant='light' color='yellow'>
												{sponsor.unconfirmedCount}
											</Badge>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Paper>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 6 }}>
					<Paper withBorder p='md'>
						<Title order={4} mb='md'>
							By School
						</Title>
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>School</Table.Th>
									<Table.Th ta='center'>Students</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{data.bySchool.map((school) => (
									<Table.Tr key={school.schoolCode}>
										<Table.Td>
											<Group gap='xs'>
												<IconSchool
													size={16}
													color='var(--mantine-color-blue-6)'
												/>
												<Text size='sm' fw={500}>
													{school.schoolCode}
												</Text>
											</Group>
										</Table.Td>
										<Table.Td ta='center'>
											<Badge variant='light'>{school.studentCount}</Badge>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Paper>
				</Grid.Col>
			</Grid>

			<Grid>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Paper withBorder p='md'>
						<Title order={4} mb='md'>
							By Program
						</Title>
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Program</Table.Th>
									<Table.Th>School</Table.Th>
									<Table.Th ta='center'>Students</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{data.byProgram.slice(0, 10).map((program) => (
									<Table.Tr
										key={`${program.programName}-${program.schoolCode}`}
									>
										<Table.Td>
											<Text size='sm'>{program.programName}</Text>
										</Table.Td>
										<Table.Td>
											<Text size='sm' c='dimmed'>
												{program.schoolCode}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Badge variant='light'>{program.studentCount}</Badge>
										</Table.Td>
									</Table.Tr>
								))}
								{data.byProgram.length > 10 && (
									<Table.Tr>
										<Table.Td colSpan={3}>
											<Text size='sm' c='dimmed' ta='center'>
												... and {data.byProgram.length - 10} more programs
											</Text>
										</Table.Td>
									</Table.Tr>
								)}
							</Table.Tbody>
						</Table>
					</Paper>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 4 }}>
					<Paper withBorder p='md'>
						<Title order={4} mb='md'>
							By Semester
						</Title>
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Semester</Table.Th>
									<Table.Th ta='center'>Students</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{data.bySemester.map((semester) => (
									<Table.Tr key={semester.semester}>
										<Table.Td>
											<Badge variant='light' size='sm'>
												{formatSemester(semester.semester, 'mini')}
											</Badge>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' fw={500}>
												{semester.studentCount}
											</Text>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Paper>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
