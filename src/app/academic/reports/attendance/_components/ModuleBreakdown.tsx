'use client';

import {
	Badge,
	Card,
	Group,
	Pagination,
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
	if (rate >= 75) return 'green';
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

	const lowAttendanceModules = data.filter((m) => m.avgAttendanceRate < 75);
	const criticalModules = data.filter((m) => m.avgAttendanceRate < 50);

	return (
		<Stack gap='md'>
			<Group justify='space-between' align='flex-end'>
				<Group gap='md'>
					<Text size='sm' c='dimmed'>
						{data.length} module{data.length !== 1 ? 's' : ''} total
					</Text>
					{lowAttendanceModules.length > 0 && (
						<Badge color='yellow' variant='light'>
							{lowAttendanceModules.length} below 75%
						</Badge>
					)}
					{criticalModules.length > 0 && (
						<Badge color='red' variant='light'>
							{criticalModules.length} below 50%
						</Badge>
					)}
				</Group>
				<TextInput
					placeholder='Search modules...'
					leftSection={<IconSearch size={16} />}
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
					w={250}
				/>
			</Group>

			<Card withBorder p={0}>
				<ScrollArea>
					<Table striped highlightOnHover withTableBorder>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Module</Table.Th>
								<Table.Th>Class</Table.Th>
								<Table.Th ta='center'>Students</Table.Th>
								<Table.Th ta='center'>Avg. Attendance</Table.Th>
								<Table.Th ta='center'>At Risk</Table.Th>
								<Table.Th ta='center'>Status</Table.Th>
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
										<Table.Td ta='center'>
											{mod.atRiskCount > 0 ? (
												<Badge size='sm' color='red' variant='filled'>
													{mod.atRiskCount}
												</Badge>
											) : (
												<Badge size='sm' color='green' variant='light'>
													0
												</Badge>
											)}
										</Table.Td>
										<Table.Td ta='center'>
											{mod.avgAttendanceRate < 50 ? (
												<Badge size='sm' color='red' variant='filled'>
													Critical
												</Badge>
											) : mod.avgAttendanceRate < 75 ? (
												<Badge size='sm' color='yellow' variant='light'>
													Needs Attention
												</Badge>
											) : (
												<Badge size='sm' color='green' variant='light'>
													Good
												</Badge>
											)}
										</Table.Td>
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
				</ScrollArea>
			</Card>

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
