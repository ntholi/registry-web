'use client';

import {
	Group,
	Paper,
	SegmentedControl,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconCalendarOff,
	IconCircleCheck,
	IconCircleMinus,
	IconCircleX,
	IconClock,
	IconQuestionMark,
	IconSearch,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { AttendanceStatus } from '@/core/database';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { getAttendanceForWeek, markAttendance } from '../_server/actions';

type Props = {
	semesterModuleId: number;
	termId: number;
	weekNumber: number;
	assignedModuleId: number;
};

const statusOptions: {
	value: AttendanceStatus;
	label: string;
	icon: typeof IconCircleCheck;
}[] = [
	{ value: 'present', label: 'Present', icon: IconCircleCheck },
	{ value: 'absent', label: 'Absent', icon: IconCircleX },
	{ value: 'late', label: 'Late', icon: IconClock },
	{ value: 'excused', label: 'Excused', icon: IconQuestionMark },
	{ value: 'no_class', label: 'No Class', icon: IconCalendarOff },
	{ value: 'not_marked', label: 'Not Marked', icon: IconCircleMinus },
];

export default function AttendanceForm({
	semesterModuleId,
	termId,
	weekNumber,
	assignedModuleId,
}: Props) {
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
	const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('present');

	const {
		data: students,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: ['attendance-week', semesterModuleId, termId, weekNumber],
		queryFn: () => getAttendanceForWeek(semesterModuleId, termId, weekNumber),
	});

	const saveMutation = useMutation({
		mutationFn: async (
			records: { stdNo: number; status: AttendanceStatus }[]
		) =>
			markAttendance(
				semesterModuleId,
				termId,
				weekNumber,
				assignedModuleId,
				records
			),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['attendance-week', semesterModuleId, termId, weekNumber],
			});
			queryClient.invalidateQueries({
				queryKey: ['attendance-summary', semesterModuleId, termId],
			});
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to save attendance',
				color: 'red',
			});
		},
	});

	const handleStatusChange = (stdNo: number, status: AttendanceStatus) => {
		saveMutation.mutate([{ stdNo, status }]);
	};

	const handleBulkSetStatus = (status: AttendanceStatus) => {
		if (!students) return;
		const records = students.map((s) => ({
			stdNo: s.stdNo,
			status,
		}));
		saveMutation.mutate(records);
		notifications.show({
			title: 'Saving',
			message: `Setting all students to ${status}...`,
			color: 'blue',
		});
	};

	const handleBulkChange = (value: string) => {
		const status = value as AttendanceStatus;
		setBulkStatus(status);
		handleBulkSetStatus(status);
	};

	const filteredStudents = useMemo(() => {
		if (!students) return [];
		if (!debouncedSearch.trim()) return students;

		const query = debouncedSearch.toLowerCase();
		return students.filter(
			(student) =>
				student.name.toLowerCase().includes(query) ||
				student.stdNo.toString().includes(query)
		);
	}, [students, debouncedSearch]);

	if (isLoading || isFetching) {
		return (
			<Stack gap='md'>
				<Group justify='space-between'>
					<Skeleton h={36} w={320} radius='md' />
					<Group gap='xs'>
						<Skeleton h={36} w={150} radius='md' />
						<Skeleton h={36} w={36} radius='md' />
					</Group>
				</Group>
				<Paper withBorder>
					<Table striped>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Student No</Table.Th>
								<Table.Th>Name</Table.Th>
								<Table.Th style={{ textAlign: 'right' }}>Status</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{Array.from({ length: 6 }).map((_, index) => (
								<Table.Tr key={`skeleton-${index}`}>
									<Table.Td>
										<Skeleton h={12} w={80} />
									</Table.Td>
									<Table.Td>
										<Skeleton h={12} w='70%' />
									</Table.Td>
									<Table.Td>
										<Group justify='flex-end'>
											<Skeleton h={22} w={220} radius='md' />
										</Group>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Paper>
			</Stack>
		);
	}

	if (!students || students.length === 0) {
		return (
			<Paper p='md' withBorder>
				<Text c='dimmed'>
					No students enrolled in this module for the current term.
				</Text>
			</Paper>
		);
	}

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<TextInput
					placeholder='Search by name or student number...'
					leftSection={<IconSearch size={16} />}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.currentTarget.value)}
					style={{ flex: 1, maxWidth: 400 }}
				/>
				<SegmentedControl
					value={bulkStatus}
					onChange={handleBulkChange}
					data={statusOptions.map((opt) => ({
						value: opt.value,
						label: (
							<Group gap={6} wrap='nowrap'>
								<opt.icon size={16} />
								<span>{opt.label}</span>
							</Group>
						),
					}))}
					disabled={saveMutation.isPending}
					color={getStatusColor(bulkStatus)}
					size='sm'
				/>
			</Group>

			<Paper withBorder>
				<Table striped>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Student No</Table.Th>
							<Table.Th>Name</Table.Th>
							<Table.Th style={{ textAlign: 'right' }}>Status</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{filteredStudents.map((student) => (
							<Table.Tr key={student.stdNo}>
								<Table.Td>{student.stdNo}</Table.Td>
								<Table.Td>{student.name}</Table.Td>
								<Table.Td style={{ textAlign: 'right' }}>
									<SegmentedControl
										value={student.status}
										onChange={(value) =>
											handleStatusChange(
												student.stdNo,
												value as AttendanceStatus
											)
										}
										data={statusOptions.map((opt) => ({
											value: opt.value,
											label: (
												<Group gap={4} wrap='nowrap'>
													<opt.icon size={18} />
												</Group>
											),
										}))}
										color={getStatusColor(student.status)}
										styles={{
											root: {
												backgroundColor: 'transparent',
											},
										}}
										size='sm'
									/>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
				{filteredStudents.length === 0 && debouncedSearch && (
					<Text c='dimmed' ta='center' py='md'>
						No students match your search.
					</Text>
				)}
			</Paper>
		</Stack>
	);
}
