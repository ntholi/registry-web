'use client';

import {
	Card,
	Group,
	HoverCard,
	Pagination,
	Paper,
	Progress,
	ScrollArea,
	Select,
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
type SortBy = 'class' | 'students' | 'attendance';
type SortDirection = 'asc' | 'desc';
const SORT_OPTIONS = [
	{ value: 'class', label: 'Class' },
	{ value: 'students', label: 'Students' },
	{ value: 'attendance', label: 'Avg. Attendance' },
] satisfies ReadonlyArray<{ value: SortBy; label: string }>;
const DIRECTION_OPTIONS = [
	{ value: 'asc', label: 'Ascending' },
	{ value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<{ value: SortDirection; label: string }>;

function getAttendanceColor(rate: number) {
	if (rate >= 80) return 'green';
	if (rate >= 50) return 'yellow';
	return 'red';
}

export default function ModuleBreakdown({ data }: Props) {
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [page, setPage] = useState(1);
	const [sortBy, setSortBy] = useState<SortBy>('class');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

	const filteredData = useMemo(() => {
		if (!debouncedSearch) return data;
		const searchLower = debouncedSearch.toLowerCase();
		return data.filter(
			(mod) =>
				mod.moduleCode.toLowerCase().includes(searchLower) ||
				mod.moduleName.toLowerCase().includes(searchLower) ||
				mod.schoolCode.toLowerCase().includes(searchLower) ||
				mod.className.toLowerCase().includes(searchLower) ||
				mod.lecturerNames.some((name) =>
					name.toLowerCase().includes(searchLower)
				)
		);
	}, [data, debouncedSearch]);

	const sortedData = useMemo(() => {
		const rows = [...filteredData];
		const factor = sortDirection === 'asc' ? 1 : -1;

		if (sortBy === 'class') {
			return rows.sort((a, b) => {
				const schoolCompare = a.schoolCode.localeCompare(b.schoolCode);
				if (schoolCompare !== 0) {
					return schoolCompare * factor;
				}
				return a.className.localeCompare(b.className) * factor;
			});
		}

		if (sortBy === 'students') {
			return rows.sort((a, b) => (a.totalStudents - b.totalStudents) * factor);
		}

		return rows.sort(
			(a, b) => (a.avgAttendanceRate - b.avgAttendanceRate) * factor
		);
	}, [filteredData, sortBy, sortDirection]);

	const paginatedData = useMemo(() => {
		const total = Math.ceil(sortedData.length / PAGE_SIZE);
		const currentPage = total > 0 ? Math.min(page, total) : 1;
		const start = (currentPage - 1) * PAGE_SIZE;
		return sortedData.slice(start, start + PAGE_SIZE);
	}, [sortedData, page]);

	const totalPages = Math.ceil(sortedData.length / PAGE_SIZE);
	const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;

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
			<Group justify='space-between' align='flex-end'>
				<Group align='flex-end'>
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
				</Group>
				<Group align='flex-end'>
					<Select
						label='Order by'
						value={sortBy}
						data={SORT_OPTIONS}
						onChange={(value) => {
							if (!value) return;
							setSortBy(value as SortBy);
							setPage(1);
						}}
						w={200}
					/>
					<Select
						label='Direction'
						value={sortDirection}
						data={DIRECTION_OPTIONS}
						onChange={(value) => {
							if (!value) return;
							setSortDirection(value as SortDirection);
							setPage(1);
						}}
						w={160}
					/>
				</Group>
			</Group>

			<Paper withBorder>
				<ScrollArea>
					<Table withTableBorder>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Module</Table.Th>
								<Table.Th>School</Table.Th>
								<Table.Th>Class</Table.Th>
								<Table.Th>Lecturer(s)</Table.Th>
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
												{mod.schoolCode}
											</Text>
										</Table.Td>
										<Table.Td>
											<Text size='sm' fw={500}>
												{mod.className}
											</Text>
										</Table.Td>
										<Table.Td>
											{mod.lecturerNames.length > 0 ? (
												mod.lecturerNames.length > 3 ? (
													<HoverCard
														withArrow
														openDelay={120}
														closeDelay={100}
														position='top-start'
													>
														<HoverCard.Target>
															<Text
																size='sm'
																lineClamp={1}
																style={{ cursor: 'pointer' }}
															>
																{mod.lecturerNames.slice(0, 3).join(', ')}
																<Text span size='xs' c='dimmed' ml={4}>
																	+{mod.lecturerNames.length - 3} more
																</Text>
															</Text>
														</HoverCard.Target>
														<HoverCard.Dropdown p='xs'>
															<Stack gap={2}>
																{mod.lecturerNames.map((name) => (
																	<Text key={name} size='xs'>
																		{name}
																	</Text>
																))}
															</Stack>
														</HoverCard.Dropdown>
													</HoverCard>
												) : (
													<Text size='sm' lineClamp={1}>
														{mod.lecturerNames.join(', ')}
													</Text>
												)
											) : (
												<Text size='sm' c='dimmed'>
													—
												</Text>
											)}
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
						Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
						{Math.min(currentPage * PAGE_SIZE, sortedData.length)} of{' '}
						{sortedData.length} modules
					</Text>
					<Pagination
						total={totalPages}
						value={currentPage}
						onChange={setPage}
						size='sm'
					/>
				</Group>
			)}
		</Stack>
	);
}
