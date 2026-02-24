'use client';

import {
	Avatar,
	Badge,
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
import { getActivityLabel } from '../_lib/activity-catalog';
import { getEmployeeList } from '../_server/actions';

type Props = {
	start: string;
	end: string;
	dept?: string;
};

export default function EmployeeList({ start, end, dept }: Props) {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debounced] = useDebouncedValue(search, 300);

	const { data, isLoading } = useQuery({
		queryKey: [
			'activity-tracker',
			'employees',
			start,
			end,
			page,
			debounced,
			dept,
		],
		queryFn: () => getEmployeeList(start, end, page, debounced, dept),
	});

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

	const totalShownActivities =
		data?.items.reduce((sum, emp) => sum + emp.totalActivities, 0) ?? 0;

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
						<Table.ScrollContainer minWidth={600}>
							<Table striped highlightOnHover>
								<Table.Thead>
									<Table.Tr>
										<Table.Th w={50}>#</Table.Th>
										<Table.Th>Employee</Table.Th>
										<Table.Th ta='right'>Total Activities</Table.Th>
										<Table.Th w={220}>Work Share</Table.Th>
										<Table.Th>Top Activity</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{data.items.map((emp, idx) => {
										const pct =
											totalShownActivities > 0
												? (emp.totalActivities / totalShownActivities) * 100
												: 0;

										return (
											<Table.Tr
												key={emp.userId}
												style={{ cursor: 'pointer' }}
												onClick={() =>
													router.push(`/admin/activity-tracker/${emp.userId}`)
												}
											>
												<Table.Td>
													<Text fz='sm' c='dimmed'>
														{(page - 1) * 20 + idx + 1}
													</Text>
												</Table.Td>
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
														<Text fz='sm' fw={500}>
															{emp.name ?? '—'}
														</Text>
													</Group>
												</Table.Td>
												<Table.Td ta='right'>
													<Text fw={600}>{emp.totalActivities}</Text>
												</Table.Td>
												<Table.Td>
													<Group gap='xs' wrap='nowrap'>
														<Progress
															value={pct}
															size='sm'
															radius='xl'
															style={{ flex: 1 }}
														/>
														<Text fz='xs' fw={600} miw={44} ta='right'>
															{pct.toFixed(1)}%
														</Text>
													</Group>
												</Table.Td>
												<Table.Td>
													{emp.topActivity ? (
														<Badge variant='light' size='sm'>
															{getActivityLabel(emp.topActivity)}
														</Badge>
													) : (
														<Text fz='xs' c='dimmed'>
															—
														</Text>
													)}
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
