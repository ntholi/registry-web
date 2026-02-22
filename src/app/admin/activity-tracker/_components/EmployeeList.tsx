'use client';

import {
	Avatar,
	Center,
	Group,
	Pagination,
	Paper,
	Progress,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconDatabaseOff, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import { isClearanceDepartment } from '../_lib/department-tables';
import type { ClearanceEmployeeStats } from '../_lib/types';
import { getClearanceStats, getEmployeeList } from '../_server/actions';

type Props = {
	start: Date;
	end: Date;
	dept?: string;
};

export default function EmployeeList({ start, end, dept }: Props) {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debounced] = useDebouncedValue(search, 300);

	const startISO = start.toISOString();
	const endISO = end.toISOString();

	const { data, isLoading } = useQuery({
		queryKey: [
			'activity-tracker',
			'employees',
			startISO,
			endISO,
			page,
			debounced,
			dept,
		],
		queryFn: () => getEmployeeList(start, end, page, debounced, dept),
	});

	const showClearance =
		dept !== undefined ? isClearanceDepartment(dept) : false;

	const { data: clearanceData } = useQuery({
		queryKey: ['activity-tracker', 'clearance', startISO, endISO, dept],
		queryFn: () => getClearanceStats(start, end, dept),
		enabled: showClearance,
	});

	const clearanceMap = new Map<string, ClearanceEmployeeStats>();
	if (clearanceData) {
		for (const c of clearanceData) {
			clearanceMap.set(c.userId, c);
		}
	}

	if (isLoading) {
		return (
			<Paper p='md' radius='md' withBorder>
				<Stack>
					<Skeleton h={36} w={300} />
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={`row-skel-${i}`} h={48} />
					))}
				</Stack>
			</Paper>
		);
	}

	return (
		<Paper p='md' radius='md' withBorder>
			<Stack>
				<TextInput
					placeholder='Search employees...'
					leftSection={<IconSearch size={16} />}
					value={search}
					onChange={(e) => {
						setSearch(e.currentTarget.value);
						setPage(1);
					}}
					size='sm'
					maw={300}
				/>

				{!data || data.items.length === 0 ? (
					<Center py='xl'>
						<Stack align='center' gap='xs'>
							<IconDatabaseOff size={24} opacity={0.5} />
							<Text c='dimmed' fz='sm'>
								No employees found
							</Text>
						</Stack>
					</Center>
				) : (
					<>
						<Table.ScrollContainer minWidth={showClearance ? 900 : 700}>
							<Table striped highlightOnHover>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Employee</Table.Th>
										<Table.Th ta='right'>Total Ops</Table.Th>
										<Table.Th ta='right'>Creates</Table.Th>
										<Table.Th ta='right'>Updates</Table.Th>
										<Table.Th ta='right'>Deletes</Table.Th>
										{showClearance && (
											<>
												<Table.Th ta='right'>Approved</Table.Th>
												<Table.Th ta='right'>Rejected</Table.Th>
												<Table.Th>Approval Rate</Table.Th>
											</>
										)}
										<Table.Th>Last Active</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{data.items.map((emp) => {
										const clr = clearanceMap.get(emp.userId);
										return (
											<Table.Tr
												key={emp.userId}
												style={{ cursor: 'pointer' }}
												onClick={() =>
													router.push(`/admin/activity-tracker/${emp.userId}`)
												}
											>
												<Table.Td>
													<Group gap='sm'>
														<Avatar src={emp.image} size='sm' radius='xl'>
															{emp.name
																?.split(' ')
																.map((n) => n[0])
																.join('')
																.slice(0, 2)
																.toUpperCase()}
														</Avatar>
														<div>
															<Text fz='sm' fw={500}>
																{emp.name ?? '—'}
															</Text>
															<Text fz='xs' c='dimmed'>
																{emp.email}
															</Text>
														</div>
													</Group>
												</Table.Td>
												<Table.Td ta='right'>
													<Text fw={600}>{emp.totalOperations}</Text>
												</Table.Td>
												<Table.Td ta='right'>{emp.inserts}</Table.Td>
												<Table.Td ta='right'>{emp.updates}</Table.Td>
												<Table.Td ta='right'>{emp.deletes}</Table.Td>
												{showClearance && (
													<>
														<Table.Td ta='right'>
															{clr?.approved ?? '—'}
														</Table.Td>
														<Table.Td ta='right'>
															{clr?.rejected ?? '—'}
														</Table.Td>
														<Table.Td>
															{clr && clr.total > 0 ? (
																<Group gap='xs'>
																	<Progress
																		value={clr.approvalRate}
																		size='sm'
																		w={80}
																		color={
																			clr.approvalRate >= 80
																				? 'green'
																				: clr.approvalRate >= 50
																					? 'yellow'
																					: 'red'
																		}
																	/>
																	<Text fz='xs'>{clr.approvalRate}%</Text>
																</Group>
															) : (
																'—'
															)}
														</Table.Td>
													</>
												)}
												<Table.Td>
													<Text fz='sm' c='dimmed'>
														{formatRelativeTime(emp.lastActiveAt)}
													</Text>
												</Table.Td>
											</Table.Tr>
										);
									})}
								</Table.Tbody>
							</Table>
						</Table.ScrollContainer>

						{data.totalPages > 1 && (
							<Center>
								<Pagination
									total={data.totalPages}
									value={page}
									onChange={setPage}
									size='sm'
								/>
							</Center>
						)}
					</>
				)}
			</Stack>
		</Paper>
	);
}
