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
import { IconSearch, IconUserExclamation } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import type { AtRiskStudent } from '../_server/repository';

type Props = {
	data: AtRiskStudent[];
};

const PAGE_SIZE = 15;

function getAttendanceColor(rate: number) {
	if (rate >= 80) return 'green';
	if (rate >= 50) return 'yellow';
	if (rate >= 25) return 'orange';
	return 'red';
}

function getSeverityLabel(rate: number) {
	if (rate < 25) return { label: 'Critical', color: 'red' };
	if (rate < 50) return { label: 'Severe', color: 'orange' };
	if (rate < 80) return { label: 'At Risk', color: 'yellow' };
	return { label: 'Good', color: 'green' };
}

export default function AtRiskStudentsTable({ data }: Props) {
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [page, setPage] = useState(1);

	const filteredData = useMemo(() => {
		if (!debouncedSearch) return data;
		const searchLower = debouncedSearch.toLowerCase();
		return data.filter(
			(student) =>
				student.name.toLowerCase().includes(searchLower) ||
				student.stdNo.toString().includes(searchLower) ||
				student.className.toLowerCase().includes(searchLower) ||
				student.programCode.toLowerCase().includes(searchLower)
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
					<ThemeIcon size='xl' color='green' variant='light'>
						<IconUserExclamation size={24} />
					</ThemeIcon>
					<Text c='dimmed'>No at-risk students found</Text>
					<Text size='sm' c='dimmed'>
						All students have attendance rates above 80%
					</Text>
				</Stack>
			</Card>
		);
	}

	const atRiskCount = data.length;

	return (
		<Stack gap='md'>
			<Group justify='space-between' align='flex-end'>
				<Text size='sm' c='dimmed'>
					{atRiskCount} student{atRiskCount !== 1 ? 's' : ''} at risk
				</Text>
				<TextInput
					placeholder='Search by name, ID, class...'
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
								<Table.Th>Student</Table.Th>
								<Table.Th>Class</Table.Th>
								<Table.Th ta='center'>Attendance Rate</Table.Th>
								<Table.Th ta='center'>Present</Table.Th>
								<Table.Th ta='center'>Absent</Table.Th>
								<Table.Th ta='center'>Late</Table.Th>
								<Table.Th ta='center'>Excused</Table.Th>
								<Table.Th ta='center'>Total Marked</Table.Th>
								<Table.Th ta='center'>Severity</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{paginatedData.map((student) => {
								const severity = getSeverityLabel(student.attendanceRate);
								return (
									<Table.Tr key={`${student.stdNo}-${student.className}`}>
										<Table.Td>
											<Stack gap={0}>
												<Text size='sm' fw={500} lineClamp={1}>
													{student.name}
												</Text>
												<Text size='xs' c='dimmed'>
													{student.stdNo}
												</Text>
											</Stack>
										</Table.Td>
										<Table.Td>
											<Stack gap={0}>
												<Text size='sm' fw={500}>
													{student.className}
												</Text>
												<Text size='xs' c='dimmed' lineClamp={1}>
													{student.programName}
												</Text>
											</Stack>
										</Table.Td>
										<Table.Td ta='center'>
											<Group gap={4} justify='center'>
												<Progress
													value={student.attendanceRate}
													color={getAttendanceColor(student.attendanceRate)}
													size='sm'
													w={60}
												/>
												<Text
													size='sm'
													fw={600}
													c={getAttendanceColor(student.attendanceRate)}
												>
													{student.attendanceRate}%
												</Text>
											</Group>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' c='green' fw={500}>
												{student.presentCount}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' c='red' fw={500}>
												{student.absentCount}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' c='yellow' fw={500}>
												{student.lateCount}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' c='blue' fw={500}>
												{student.excusedCount}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text size='sm' c='dimmed'>
												{student.totalMarkedWeeks}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Badge
												color={severity.color}
												size='sm'
												variant={
													severity.label === 'Critical' ? 'filled' : 'light'
												}
											>
												{severity.label}
											</Badge>
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
						{filteredData.length} students
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
