'use client';
import {
	Alert,
	Badge,
	Card,
	Group,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Table,
	Text,
	Title,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type {
	BoeStatsClassRow,
	BoeStatsProgramRow,
	BoeStatsSchool,
} from '../_server/repository';

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
			remain: acc.remain + school.totals.remain,
			droppedOut: acc.droppedOut + school.totals.droppedOut,
			withdrawn: acc.withdrawn + school.totals.withdrawn,
			deferred: acc.deferred + school.totals.deferred,
			totalActive: acc.totalActive + school.totals.totalActive,
			totalStudents: acc.totalStudents + school.totals.totalStudents,
		}),
		{
			passed: 0,
			failed: 0,
			remain: 0,
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
				<Paper p={'md'} key={school.schoolId} withBorder>
					<Group justify='space-between' mb='md'>
						<Title order={4}>{school.schoolName}</Title>
						<Badge variant='light'>{school.totals.totalActive} active</Badge>
					</Group>

					<ScrollArea>
						<Table withTableBorder>
							<Table.Thead>
								<Table.Tr>
									<Table.Th style={{ width: 40 }} />
									<Table.Th>Program</Table.Th>
									<Table.Th style={{ textAlign: 'center', width: 80 }}>
										<Text c='green' fw={600} size='sm'>
											Passed
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center', width: 80 }}>
										<Text c='red' fw={600} size='sm'>
											Failed
										</Text>
									</Table.Th>
									<Table.Th
										style={{
											textAlign: 'center',
											width: 80,
											borderLeft:
												'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
											borderRight:
												'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
										}}
									>
										<Text c='grape' fw={600} size='sm'>
											Remain
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center', width: 80 }}>
										<Text fw={600} size='sm'>
											Dropped
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center', width: 80 }}>
										<Text fw={600} size='sm'>
											Withdrawn
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center', width: 80 }}>
										<Text fw={600} size='sm'>
											Deferred
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center', width: 80 }}>
										<Text fw={600} size='sm'>
											Active
										</Text>
									</Table.Th>
									<Table.Th style={{ textAlign: 'center', width: 80 }}>
										<Text fw={600} size='sm'>
											Total
										</Text>
									</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{school.programs.map((program) => (
									<ProgramRow key={program.programId} program={program} />
								))}
								<Table.Tr
									style={{ backgroundColor: 'var(--mantine-color-dark-6)' }}
								>
									<Table.Td />
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
									<Table.Td
										style={{
											textAlign: 'center',
											borderLeft:
												'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
											borderRight:
												'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
										}}
									>
										<Text c='grape' fw={700}>
											{school.totals.remain || '-'}
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
										<Text fw={700}>{school.totals.totalActive}</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='dimmed' fw={700}>
											{school.totals.totalStudents}
										</Text>
									</Table.Td>
								</Table.Tr>
							</Table.Tbody>
						</Table>
					</ScrollArea>
				</Paper>
			))}

			{schools.length > 1 && (
				<Card withBorder>
					<Title order={5} mb='md'>
						Grand Total
					</Title>
					<ScrollArea>
						<Table withTableBorder>
							<Table.Thead>
								<Table.Tr>
									<Table.Th style={{ textAlign: 'center' }}>Passed</Table.Th>
									<Table.Th style={{ textAlign: 'center' }}>Failed</Table.Th>
									<Table.Th
										style={{
											textAlign: 'center',
											borderLeft:
												'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
											borderRight:
												'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
										}}
									>
										Remain
									</Table.Th>
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
										<Text c='green' fw={600}>
											{grandTotals.passed}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='red' fw={600}>
											{grandTotals.failed}
										</Text>
									</Table.Td>
									<Table.Td
										style={{
											textAlign: 'center',
											borderLeft:
												'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
											borderRight:
												'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
										}}
									>
										<Text c='grape' fw={600}>
											{grandTotals.remain || '-'}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='orange' fw={600}>
											{grandTotals.droppedOut}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='yellow' fw={600}>
											{grandTotals.withdrawn}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c='blue' fw={600}>
											{grandTotals.deferred}
										</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text fw={600}>{grandTotals.totalActive}</Text>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<Text c={'dimmed'} fw={600}>
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

interface ProgramRowProps {
	program: BoeStatsProgramRow;
}

function ProgramRow({ program }: ProgramRowProps) {
	const [opened, { toggle }] = useDisclosure(false);

	return (
		<>
			<Table.Tr onClick={toggle} style={{ cursor: 'pointer' }}>
				<Table.Td>
					<UnstyledButton onClick={toggle}>
						{opened ? (
							<IconChevronDown size={16} />
						) : (
							<IconChevronRight size={16} />
						)}
					</UnstyledButton>
				</Table.Td>
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
				<Table.Td
					style={{
						textAlign: 'center',
						borderLeft:
							'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
						borderRight:
							'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
					}}
				>
					<Text c='grape'>{program.remain || '-'}</Text>
				</Table.Td>
				<Table.Td style={{ textAlign: 'center' }}>
					<Text c='orange'>{program.droppedOut || '-'}</Text>
				</Table.Td>
				<Table.Td style={{ textAlign: 'center' }}>
					<Text c='yellow'>{program.withdrawn || '-'}</Text>
				</Table.Td>
				<Table.Td style={{ textAlign: 'center' }}>
					<Text c='blue'>{program.deferred || '-'}</Text>
				</Table.Td>
				<Table.Td style={{ textAlign: 'center' }}>
					<Text fw={600}>{program.totalActive}</Text>
				</Table.Td>
				<Table.Td style={{ textAlign: 'center' }}>
					<Text c='dimmed'>{program.totalStudents}</Text>
				</Table.Td>
			</Table.Tr>
			{opened &&
				program.classes.map((cls) => (
					<ClassRow key={cls.className} cls={cls} />
				))}
		</>
	);
}

interface ClassRowProps {
	cls: BoeStatsClassRow;
}

function ClassRow({ cls }: ClassRowProps) {
	return (
		<Table.Tr
			style={{
				backgroundColor:
					'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))',
			}}
		>
			<Table.Td />
			<Table.Td pl='xl'>
				<Text size='sm' fw={500}>
					{cls.className}
				</Text>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<Text c='green' size='sm'>
					{cls.passed || '-'}
				</Text>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<Text c='red' size='sm'>
					{cls.failed || '-'}
				</Text>
			</Table.Td>
			<Table.Td
				style={{
					textAlign: 'center',
					borderLeft:
						'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
					borderRight:
						'2px dashed light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-4))',
				}}
			>
				<Text c='grape' size='sm'>
					{cls.remain || '-'}
				</Text>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<Text c='orange' size='sm'>
					{cls.droppedOut || '-'}
				</Text>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<Text c='yellow' size='sm'>
					{cls.withdrawn || '-'}
				</Text>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<Text c='blue' size='sm'>
					{cls.deferred || '-'}
				</Text>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<Text size='sm'>{cls.totalActive}</Text>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<Text c='dimmed' size='sm'>
					{cls.totalStudents}
				</Text>
			</Table.Td>
		</Table.Tr>
	);
}
