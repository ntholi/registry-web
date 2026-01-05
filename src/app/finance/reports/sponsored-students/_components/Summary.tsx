'use client';
import {
	Grid,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
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

	return (
		<Stack gap='lg'>
			<Grid>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<Paper withBorder p='md'>
						<Title order={4} mb='md'>
							Sponsors
						</Title>
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Sponsor</Table.Th>
									<Table.Th ta='center'>Students</Table.Th>
									<Table.Th ta='center'>%</Table.Th>
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
											<Text size='sm' fw={500}>
												{sponsor.studentCount}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' fw={500}>
												{data.totalStudents > 0
													? (
															(sponsor.studentCount / data.totalStudents) *
															100
														).toFixed(1)
													: 0}
												%
											</Text>
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
							Schools
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
											<Text size='sm' fw={500}>
												{school.studentCount}
											</Text>
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
							Programs
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
											<Text size='sm' fw={500}>
												{program.studentCount}
											</Text>
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
							Semesters
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
											<Text size='sm' fw={500}>
												{formatSemester(semester.semester, 'mini')}
											</Text>
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
