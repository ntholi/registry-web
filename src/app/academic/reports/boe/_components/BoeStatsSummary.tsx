'use client';
import {
	Alert,
	Badge,
	Card,
	Group,
	ScrollArea,
	Skeleton,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import type { BoeStatsSchool } from '../_server/repository';

interface BoeStatsSummaryProps {
	schools?: BoeStatsSchool[];
	loading?: boolean;
}

export function BoeStatsSummary({ schools, loading }: BoeStatsSummaryProps) {
	if (loading) {
		return (
			<Stack>
				{Array.from({ length: 2 }, (_, i) => (
					<Card key={`skeleton-${i}`} withBorder>
						<Skeleton height={24} width={200} mb='md' />
						<Skeleton height={200} />
					</Card>
				))}
			</Stack>
		);
	}

	if (!schools || schools.length === 0) {
		return (
			<Alert color='blue' variant='light'>
				No data available for the selected criteria.
			</Alert>
		);
	}

	const grandTotals = schools.reduce(
		(acc, school) => ({
			passed: acc.passed + school.totals.passed,
			failed: acc.failed + school.totals.failed,
			droppedOut: acc.droppedOut + school.totals.droppedOut,
			withdrawn: acc.withdrawn + school.totals.withdrawn,
			deferred: acc.deferred + school.totals.deferred,
			totalActive: acc.totalActive + school.totals.totalActive,
			totalStudents: acc.totalStudents + school.totals.totalStudents,
		}),
		{
			passed: 0,
			failed: 0,
			droppedOut: 0,
			withdrawn: 0,
			deferred: 0,
			totalActive: 0,
			totalStudents: 0,
		}
	);

	return (
		<Stack gap='lg'>
			{schools.map((school) => (
				<Card key={school.schoolId} withBorder>
					<Group justify='space-between' mb='md'>
						<Title order={4}>{school.schoolName}</Title>
						<Badge size='lg' variant='light'>
							{school.totals.totalActive} active
						</Badge>
					</Group>

					<ScrollArea>
						<Table striped highlightOnHover withTableBorder>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Program</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>
										<Text c='green' fw={600} size='sm'>
											Passed
										</Text>
										<Text size='xs' c='dimmed'>
											GPA ≥ 2.0
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>
										<Text c='red' fw={600} size='sm'>
											Failed
										</Text>
										<Text size='xs' c='dimmed'>
											GPA &lt; 2.0
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>
										<Text c='orange' fw={600} size='sm'>
											Dropped Out
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>
										<Text c='yellow' fw={600} size='sm'>
											Withdrawn
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>
										<Text c='blue' fw={600} size='sm'>
											Deferred
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>
										<Text c='teal' fw={600} size='sm'>
											Active
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>
										<Text fw={600} size='sm'>
											Total
										</Text>
									</Table.Th>
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
										<Table.Td style={{ textAlign: 'center' }}>
											<Text c='green' fw={500}>
												{program.passed || '-'}
											</Text>
										</Table.Td>
										<Table.Td style={{ textAlign: 'center' }}>
											<Text c='red' fw={500}>
												{program.failed || '-'}
											</Text>
										</Table.Td>
										<Table.Td style={{ textAlign: 'center' }}>
											<Text c='orange' fw={500}>
												{program.droppedOut || '-'}
											</Text>
										</Table.Td>
										<Table.Td style={{ textAlign: 'center' }}>
											<Text c='yellow' fw={500}>
												{program.withdrawn || '-'}
											</Text>
										</Table.Td>
										<Table.Td style={{ textAlign: 'center' }}>
											<Text c='blue' fw={500}>
												{program.deferred || '-'}
											</Text>
										</Table.Td>
										<Table.Td style={{ textAlign: 'center' }}>
											<Text c='teal' fw={600}>
												{program.totalActive}
											</Text>
										</Table.Td>
										<Table.Td style={{ textAlign: 'center' }}>
											<Text fw={600}>{program.totalStudents}</Text>
										</Table.Td>
									</Table.Tr>
								))}
								<Table.Tr style={{ fontWeight: 700 }}>
									<Table.Td>
										<Text fw={700}>School Total</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='green' fw={700}>
											{school.totals.passed}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='red' fw={700}>
											{school.totals.failed}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='orange' fw={700}>
											{school.totals.droppedOut}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='yellow' fw={700}>
											{school.totals.withdrawn}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='blue' fw={700}>
											{school.totals.deferred}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='teal' fw={700}>
											{school.totals.totalActive}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text fw={700}>{school.totals.totalStudents}</Text>
									</Table.Td>
								</Table.Tr>
							</Table.Tbody>
						</Table>
					</ScrollArea>
				</Card>
			))}

			{schools.length > 1 && (
				<Card withBorder>
					<Title order={4} mb='md'>
						Grand Total
					</Title>
					<ScrollArea>
						<Table withTableBorder>
							<Table.Thead>
								<Table.Tr>
									<Table.Th style={{ textAlign: 'center' }}>Passed</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>Failed</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>
										Dropped Out
									</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>Withdrawn</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>Deferred</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>Active</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>Total</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								<Table.Tr>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='green' fw={700} size='lg'>
											{grandTotals.passed}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='red' fw={700} size='lg'>
											{grandTotals.failed}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='orange' fw={700} size='lg'>
											{grandTotals.droppedOut}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='yellow' fw={700} size='lg'>
											{grandTotals.withdrawn}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='blue' fw={700} size='lg'>
											{grandTotals.deferred}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='teal' fw={700} size='lg'>
											{grandTotals.totalActive}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text fw={700} size='lg'>
											{grandTotals.totalStudents}
										</Text>
									</Table.Td>
								</Table.Tr>
							</Table.Tbody>
						</Table>
					</ScrollArea>
				</Card>
			)}
		</Stack>
	);
}
