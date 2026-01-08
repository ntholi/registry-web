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

function pct(value: number, total: number): string {
	if (total === 0 || value === 0) return '';
	return `${((value / total) * 100).toFixed(1)}%`;
}

interface StatCellProps {
	value: number;
	total: number;
	color?: string;
	fw?: number;
	size?: 'sm' | 'xs';
}

function StatCell({
	value,
	total,
	color,
	fw = 500,
	size = 'sm',
}: StatCellProps) {
	const percentage = pct(value, total);
	return (
		<Stack gap={0} align='center'>
			<Text c={color} fw={fw} size={size}>
				{value || '-'}
			</Text>
			{percentage && (
				<Text size='xs' c='dimmed' fw={400}>
					{percentage}
				</Text>
			)}
		</Stack>
	);
}

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
										<StatCell
											value={school.totals.passed}
											total={school.totals.totalActive}
											color='green'
											fw={700}
										/>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<StatCell
											value={school.totals.failed}
											total={school.totals.totalActive}
											color='red'
											fw={700}
										/>
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
										<StatCell
											value={school.totals.remain}
											total={school.totals.totalActive}
											color='grape'
											fw={700}
										/>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<StatCell
											value={school.totals.droppedOut}
											total={school.totals.totalStudents}
											color='orange'
											fw={700}
										/>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<StatCell
											value={school.totals.withdrawn}
											total={school.totals.totalStudents}
											color='yellow'
											fw={700}
										/>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<StatCell
											value={school.totals.deferred}
											total={school.totals.totalStudents}
											color='blue'
											fw={700}
										/>
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
										<StatCell
											value={grandTotals.passed}
											total={grandTotals.totalActive}
											color='green'
											fw={600}
										/>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<StatCell
											value={grandTotals.failed}
											total={grandTotals.totalActive}
											color='red'
											fw={600}
										/>
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
										<StatCell
											value={grandTotals.remain}
											total={grandTotals.totalActive}
											color='grape'
											fw={600}
										/>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<StatCell
											value={grandTotals.droppedOut}
											total={grandTotals.totalStudents}
											color='orange'
											fw={600}
										/>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<StatCell
											value={grandTotals.withdrawn}
											total={grandTotals.totalStudents}
											color='yellow'
											fw={600}
										/>
									</Table.Td>
									<Table.Td style={{ textAlign: 'center' }}>
										<StatCell
											value={grandTotals.deferred}
											total={grandTotals.totalStudents}
											color='blue'
											fw={600}
										/>
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
					<StatCell
						value={program.passed}
						total={program.totalActive}
						color='green'
					/>
				</Table.Td>
				<Table.Td style={{ textAlign: 'center' }}>
					<StatCell
						value={program.failed}
						total={program.totalActive}
						color='red'
					/>
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
					<StatCell
						value={program.remain}
						total={program.totalActive}
						color='grape'
					/>
				</Table.Td>
				<Table.Td style={{ textAlign: 'center' }}>
					<StatCell
						value={program.droppedOut}
						total={program.totalStudents}
						color='orange'
					/>
				</Table.Td>
				<Table.Td style={{ textAlign: 'center' }}>
					<StatCell
						value={program.withdrawn}
						total={program.totalStudents}
						color='yellow'
					/>
				</Table.Td>
				<Table.Td style={{ textAlign: 'center' }}>
					<StatCell
						value={program.deferred}
						total={program.totalStudents}
						color='blue'
					/>
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
				<StatCell
					value={cls.passed}
					total={cls.totalActive}
					color='green'
					size='xs'
				/>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<StatCell
					value={cls.failed}
					total={cls.totalActive}
					color='red'
					size='xs'
				/>
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
				<StatCell
					value={cls.remain}
					total={cls.totalActive}
					color='grape'
					size='xs'
				/>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<StatCell
					value={cls.droppedOut}
					total={cls.totalStudents}
					color='orange'
					size='xs'
				/>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<StatCell
					value={cls.withdrawn}
					total={cls.totalStudents}
					color='yellow'
					size='xs'
				/>
			</Table.Td>
			<Table.Td style={{ textAlign: 'center' }}>
				<StatCell
					value={cls.deferred}
					total={cls.totalStudents}
					color='blue'
					size='xs'
				/>
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
