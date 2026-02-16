'use client';

import {
	Accordion,
	Badge,
	Card,
	Group,
	Loader,
	Pagination,
	Progress,
	Stack,
	Table,
	Text,
	TextInput,
	ThemeIcon,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconUsers } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getPaginatedStudentsWithModuleAttendance } from '../_server/actions';
import type {
	AttendanceReportFilter,
	StudentWithModuleAttendance,
} from '../_server/repository';

type Props = {
	filter: AttendanceReportFilter;
};

const PAGE_SIZE = 20;

function getAttendanceColor(rate: number) {
	if (rate >= 80) return 'green';
	if (rate >= 50) return 'yellow';
	if (rate >= 25) return 'orange';
	return 'red';
}

function StudentAccordionItem({
	student,
}: {
	student: StudentWithModuleAttendance;
}) {
	const color = getAttendanceColor(student.overallAttendanceRate);
	const hasModules = student.modules.length > 0;

	return (
		<Accordion.Item value={student.stdNo.toString()}>
			<Accordion.Control>
				<Group justify='space-between' wrap='nowrap' pr='md'>
					<Group gap='md' wrap='nowrap' style={{ flex: 1, minWidth: 0 }}>
						<Text size='sm' fw={600} truncate style={{ minWidth: 80 }}>
							{student.stdNo}
						</Text>
						<Text size='sm' truncate style={{ flex: 1, minWidth: 0 }}>
							{student.name}
						</Text>
						<Badge size='sm' variant='light' color='gray'>
							{student.className}
						</Badge>
					</Group>
					<Group gap='xs' wrap='nowrap'>
						<Text size='xs' c='dimmed'>
							{student.modules.length} module
							{student.modules.length !== 1 ? 's' : ''}
						</Text>
						<Badge
							color={color}
							variant={student.overallAttendanceRate < 50 ? 'filled' : 'light'}
							styles={{ label: { justifyContent: 'center' } }}
						>
							{student.overallAttendanceRate}%
						</Badge>
					</Group>
				</Group>
			</Accordion.Control>
			<Accordion.Panel>
				{hasModules ? (
					<Table
						striped
						highlightOnHover
						withTableBorder
						withColumnBorders
						fz='sm'
					>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Module</Table.Th>
								<Table.Th ta='center' w={100}>
									Rate
								</Table.Th>
								<Table.Th ta='center' w={70}>
									Present
								</Table.Th>
								<Table.Th ta='center' w={70}>
									Absent
								</Table.Th>
								<Table.Th ta='center' w={70}>
									Late
								</Table.Th>
								<Table.Th ta='center' w={70}>
									Excused
								</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{student.modules.map((mod) => {
								const modColor = getAttendanceColor(mod.attendanceRate);
								return (
									<Table.Tr key={mod.moduleCode}>
										<Table.Td>
											<Group gap='xs' wrap='nowrap'>
												<Text fw={500}>{mod.moduleCode}</Text>
												<Text c='dimmed' size='xs' truncate>
													{mod.moduleName}
												</Text>
											</Group>
										</Table.Td>
										<Table.Td>
											<Group gap={6} justify='center' wrap='nowrap'>
												<Progress
													value={mod.attendanceRate}
													color={modColor}
													size='sm'
													w={40}
													radius='xl'
												/>
												<Text fw={600} c={modColor} size='sm'>
													{mod.attendanceRate}%
												</Text>
											</Group>
										</Table.Td>
										<Table.Td ta='center'>
											<Text c='green' fw={500}>
												{mod.present}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text c='red' fw={500}>
												{mod.absent}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text c='yellow' fw={500}>
												{mod.late}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text c='blue' fw={500}>
												{mod.excused}
											</Text>
										</Table.Td>
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
				) : (
					<Text size='sm' c='dimmed' ta='center' py='md'>
						No module enrollments
					</Text>
				)}
			</Accordion.Panel>
		</Accordion.Item>
	);
}

export default function StudentAttendanceTab({ filter }: Props) {
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 400);
	const [page, setPage] = useState(1);

	const { data, isLoading } = useQuery({
		queryKey: ['students-attendance', filter, page, PAGE_SIZE, debouncedSearch],
		queryFn: async () => {
			const result = await getPaginatedStudentsWithModuleAttendance(
				filter,
				page,
				PAGE_SIZE,
				debouncedSearch || undefined
			);
			return result.success ? result.data : null;
		},
		enabled: Boolean(filter.termId),
	});

	if (!filter.termId) {
		return (
			<Card withBorder p='xl' ta='center'>
				<Stack align='center' gap='md'>
					<ThemeIcon size='xl' color='blue' variant='light'>
						<IconUsers size={24} />
					</ThemeIcon>
					<Text c='dimmed'>Select a term to view student attendance</Text>
				</Stack>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Stack align='center' py='xl'>
				<Loader size='lg' />
				<Text c='dimmed'>Loading students...</Text>
			</Stack>
		);
	}

	if (!data || data.total === 0) {
		return (
			<Card withBorder p='xl' ta='center'>
				<Stack align='center' gap='md'>
					<ThemeIcon size='xl' color='gray' variant='light'>
						<IconUsers size={24} />
					</ThemeIcon>
					<Text c='dimmed'>No students found</Text>
					<Text size='sm' c='dimmed'>
						Try adjusting your filters or search query
					</Text>
				</Stack>
			</Card>
		);
	}

	return (
		<Stack gap='md'>
			<Group justify='space-between' align='flex-end'>
				<Group gap='md'>
					<Text size='sm' c='dimmed'>
						{data.total} student{data.total !== 1 ? 's' : ''} total
					</Text>
				</Group>
				<TextInput
					placeholder='Search by name, ID, program...'
					leftSection={<IconSearch size={16} />}
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
					w={280}
				/>
			</Group>

			<Accordion variant='separated' radius='md' multiple>
				{data.students.map((student) => (
					<StudentAccordionItem key={student.stdNo} student={student} />
				))}
			</Accordion>

			{data.totalPages > 1 && (
				<Group justify='space-between'>
					<Text size='sm' c='dimmed'>
						Page {data.page} of {data.totalPages}
					</Text>
					<Pagination
						total={data.totalPages}
						value={page}
						onChange={setPage}
						size='sm'
					/>
				</Group>
			)}
		</Stack>
	);
}
