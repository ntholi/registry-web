'use client';

import {
	Badge,
	Group,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ProgressionSummarySchool } from '../_server/repository';

interface Props {
	school?: ProgressionSummarySchool;
	loading?: boolean;
}

export default function ProgressionSummaryTable({ school, loading }: Props) {
	const isMobile = useMediaQuery('(max-width: 768px)');

	if (loading) {
		return (
			<Paper withBorder p='md'>
				<Group justify='space-between' mb='md'>
					<Stack gap={4}>
						<Skeleton height={18} width={180} />
						<Skeleton height={14} width={120} />
					</Stack>
					<Skeleton height={28} width={48} radius='sm' />
				</Group>
				<ScrollArea type={isMobile ? 'scroll' : 'auto'}>
					<Table withTableBorder>
						<Table.Thead>
							<Table.Tr>
								<Table.Th miw={200}>
									<Skeleton height={16} width={100} />
								</Table.Th>
								{Array.from({ length: 8 }, (_, i) => `h-${i}`).map((k) => (
									<Table.Th key={k} ta='center' miw={70}>
										<Skeleton height={16} width={40} />
									</Table.Th>
								))}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{Array.from({ length: 3 }, (_, r) => `r-${r}`).map((k) => (
								<Table.Tr key={k}>
									<Table.Td>
										<Skeleton height={14} width={180} />
									</Table.Td>
									{Array.from({ length: 8 }, (_, c) => `${k}-c-${c}`).map(
										(ck) => (
											<Table.Td key={ck} ta='center'>
												<Skeleton height={14} width={32} />
											</Table.Td>
										)
									)}
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</ScrollArea>
			</Paper>
		);
	}

	if (!school) return null;

	return (
		<Paper withBorder p='md'>
			<Group justify='space-between' mb='md'>
				<Stack gap={4}>
					<Text fw={600}>{school.schoolName}</Text>
					<Text size='sm' c='dimmed'>
						{school.schoolCode}
					</Text>
				</Stack>
				<Group gap='xs'>
					<Badge variant='light' color='green'>
						{school.progressionRate}%
					</Badge>
					<Badge variant='light'>{school.totalPrevious}</Badge>
				</Group>
			</Group>

			<ScrollArea type={isMobile ? 'scroll' : 'auto'}>
				<Table withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th miw={isMobile ? 140 : 250}>Program</Table.Th>
							<Table.Th ta='center' miw={60}>
								Total
							</Table.Th>
							<Table.Th ta='center' miw={80}>
								Progressed
							</Table.Th>
							<Table.Th ta='center' miw={70}>
								Remained
							</Table.Th>
							<Table.Th ta='center' miw={90}>
								Not Enrolled
							</Table.Th>
							<Table.Th ta='center' miw={70}>
								Graduated
							</Table.Th>
							<Table.Th ta='center' miw={80}>
								Dropped Out
							</Table.Th>
							<Table.Th ta='center' miw={70}>
								Deferred
							</Table.Th>
							<Table.Th ta='center' miw={90}>
								Term./Susp.
							</Table.Th>
							<Table.Th ta='center' miw={60}>
								Rate
							</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{school.programs.map((program) => (
							<Table.Tr key={program.programName}>
								<Table.Td>
									<Text size='sm'>{program.programName}</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Badge radius='xs' variant='default' size='sm'>
										{program.totalPrevious}
									</Badge>
								</Table.Td>
								<Table.Td ta='center'>
									<Text
										size='sm'
										c={program.progressed > 0 ? 'green' : 'dimmed'}
									>
										{program.progressed || '-'}
									</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Text
										size='sm'
										c={program.remained > 0 ? 'orange' : 'dimmed'}
									>
										{program.remained || '-'}
									</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Text
										size='sm'
										c={program.notEnrolled > 0 ? 'red' : 'dimmed'}
									>
										{program.notEnrolled || '-'}
									</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Text size='sm' c={program.graduated > 0 ? 'blue' : 'dimmed'}>
										{program.graduated || '-'}
									</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Text
										size='sm'
										c={program.droppedOut > 0 ? 'pink' : 'dimmed'}
									>
										{program.droppedOut || '-'}
									</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Text
										size='sm'
										c={program.deferred > 0 ? 'yellow' : 'dimmed'}
									>
										{program.deferred || '-'}
									</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Text
										size='sm'
										c={program.terminated > 0 ? 'gray' : 'dimmed'}
									>
										{program.terminated || '-'}
									</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Badge
										variant='light'
										size='sm'
										color={
											program.progressionRate >= 70
												? 'green'
												: program.progressionRate >= 40
													? 'yellow'
													: 'red'
										}
									>
										{program.progressionRate}%
									</Badge>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Paper>
	);
}
