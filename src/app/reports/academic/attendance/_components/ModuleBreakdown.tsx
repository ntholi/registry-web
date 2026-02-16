'use client';

import {
	Card,
	Group,
	Pagination,
	Paper,
	Progress,
	ScrollArea,
	Stack,
	Table,
	Text,
	TextInput,
	ThemeIcon,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconBook2, IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import type { ModuleAttendanceSummary } from '../_server/repository';

type Props = {
	data: ModuleAttendanceSummary[];
};

const PAGE_SIZE = 15;

function getAttendanceColor(rate: number) {
	if (rate >= 80) return 'green';
	if (rate >= 50) return 'yellow';
	return 'red';
}

export default function ModuleBreakdown({ data }: Props) {
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [page, setPage] = useState(1);

	const filteredData = useMemo(() => {
		if (!debouncedSearch) return data;
		const searchLower = debouncedSearch.toLowerCase();
		return data.filter(
			(mod) =>
				mod.moduleCode.toLowerCase().includes(searchLower) ||
				mod.moduleName.toLowerCase().includes(searchLower) ||
				mod.className.toLowerCase().includes(searchLower)
		);
	}, [data, debouncedSearch]);

	const paginatedData = useMemo(() => {
		const start = (page - 1) * PAGE_SIZE;
		return filteredData.slice(start, start + PAGE_SIZE);
	}, [filteredData, page]);

	const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

	if (data.length === 0) {
		return (
			<Card withBorder p='xl' ta='center'>
				<Stack align='center' gap='md'>
					<ThemeIcon size='xl' color='blue' variant='light'>
						<IconBook2 size={24} />
					</ThemeIcon>
					<Text c='dimmed'>No module attendance data available</Text>
					<Text size='sm' c='dimmed'>
						Select a term and filters to view module breakdown
					</Text>
				</Stack>
			</Card>
		);
	}

	return (
		<Stack gap='md'>
			<TextInput
				placeholder='Search modules...'
				leftSection={<IconSearch size={16} />}
				value={search}
				onChange={(e) => {
					setSearch(e.target.value);
					setPage(1);
				}}
				w={350}
			/>

			<Paper withBorder>
				<ScrollArea>
					<Table withTableBorder>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Module</Table.Th>
								<Table.Th>Class</Table.Th>
								<Table.Th ta='center'>Students</Table.Th>
								<Table.Th ta='center'>Avg. Attendance</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{paginatedData.map((mod) => {
								const color = getAttendanceColor(mod.avgAttendanceRate);
								return (
									<Table.Tr key={mod.semesterModuleId}>
										<Table.Td>
											<Stack gap={0}>
												<Text size='sm' fw={500}>
													{mod.moduleCode}
												</Text>
												<Text size='xs' c='dimmed' lineClamp={1}>
													{mod.moduleName}
												</Text>
											</Stack>
										</Table.Td>
										<Table.Td>
											<Text size='sm' fw={500}>
												{mod.className}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm'>{mod.totalStudents}</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Group gap={4} justify='center'>
												<Progress
													value={mod.avgAttendanceRate}
													color={color}
													size='sm'
													w={80}
												/>
												<Text size='sm' fw={600} c={color}>
													{mod.avgAttendanceRate}%
												</Text>
											</Group>
										</Table.Td>
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
				</ScrollArea>
			</Paper>

			{totalPages > 1 && (
				<Group justify='space-between'>
					<Text size='sm' c='dimmed'>
						Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
						{Math.min(page * PAGE_SIZE, filteredData.length)} of{' '}
						{filteredData.length} modules
					</Text>
					<Pagination
						total={totalPages}
						value={page}
						onChange={setPage}
						size='sm'
					/>
				</Group>
			)}
		</Stack>
	);
}
