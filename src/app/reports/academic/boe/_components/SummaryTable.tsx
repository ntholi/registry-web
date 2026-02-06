'use client';
import {
	Alert,
	Badge,
	Card,
	Group,
	ScrollArea,
	Skeleton,
	Table,
	Text,
	Title,
} from '@mantine/core';
import { formatSemester } from '@/shared/lib/utils/utils';
import type { BoeSummarySchool } from '../_server/repository';

interface SummaryTableProps {
	schools?: BoeSummarySchool[];
	loading?: boolean;
}

export function BoeSummaryTable({ schools, loading }: SummaryTableProps) {
	if (loading) {
		return (
			<>
				{Array.from({ length: 2 }, (_, i) => (
					<Card key={`skeleton-${i}`} withBorder>
						<Skeleton height={24} width={200} mb='md' />
						<Skeleton height={200} />
					</Card>
				))}
			</>
		);
	}

	if (!schools || schools.length === 0) {
		return (
			<Alert color='blue' variant='light'>
				No data available for the selected criteria.
			</Alert>
		);
	}

	const allSemesters = new Set<string>();
	for (const school of schools) {
		for (const program of school.programs) {
			for (const sem of Object.keys(program.semesters)) {
				allSemesters.add(sem);
			}
		}
	}
	const sortedSemesters = Array.from(allSemesters).sort();

	return (
		<>
			{schools.map((school) => (
				<Card key={school.schoolId} withBorder>
					<Group justify='space-between' mb='md'>
						<Title order={4}>{school.schoolName}</Title>
						<Badge size='lg' variant='light'>
							{school.totalStudents} student
							{school.totalStudents !== 1 ? 's' : ''}
						</Badge>
					</Group>

					<ScrollArea>
						<Table striped highlightOnHover withTableBorder>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Program</Table.Th>
									{sortedSemesters.map((sem) => (
										<Table.Th key={sem} style={{ textAlign: 'center' }}>
											{formatSemester(sem, 'mini')}
										</Table.Th>
									))}
									<Table.Th style={{ textAlign: 'center' }}>Total</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{school.programs.map((program) => (
									<Table.Tr key={program.programId}>
										<Table.Td>
											<Text size='sm' fw={500}>
												{program.programCode}
											</Text>
											<Text size='xs' c='dimmed'>
												{program.programName}
											</Text>
										</Table.Td>
										{sortedSemesters.map((sem) => (
											<Table.Td key={sem} style={{ textAlign: 'center' }}>
												{program.semesters[sem] || '-'}
											</Table.Td>
										))}
										<Table.Td style={{ textAlign: 'center' }}>
											<Text fw={600}>{program.totalStudents}</Text>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</ScrollArea>
				</Card>
			))}
		</>
	);
}
