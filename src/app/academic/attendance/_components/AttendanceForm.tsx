'use client';

import {
	ActionIcon,
	Button,
	Group,
	Menu,
	Paper,
	SegmentedControl,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
	IconChevronDown,
	IconCircleCheck,
	IconCircleMinus,
	IconCircleX,
	IconClock,
	IconQuestionMark,
	IconSearch,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { AttendanceStatus } from '@/core/database';
import {
	deleteAttendanceForWeek,
	getAttendanceForWeek,
	markAttendance,
} from '../_server/actions';

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
	{ value: 'na', label: 'N/A', icon: IconCircleMinus },
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

	const { data: students, isLoading } = useQuery({
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

	const deleteMutation = useMutation({
		mutationFn: async () =>
			deleteAttendanceForWeek(semesterModuleId, termId, weekNumber),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['attendance-week', semesterModuleId, termId, weekNumber],
			});
			queryClient.invalidateQueries({
				queryKey: ['attendance-summary', semesterModuleId, termId],
			});
			notifications.show({
				title: 'Deleted',
				message: 'Attendance records have been deleted',
				color: 'green',
			});
		},
		onError: () => {
			notifications.show({
				title: 'Error',
				message: 'Failed to delete attendance records',
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

	const handleDelete = () => {
		modals.openConfirmModal({
			title: 'Delete Attendance',
			children: (
				<Text size='sm'>
					Are you sure you want to delete all attendance records for this week?
					This action cannot be undone.
				</Text>
			),
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: () => deleteMutation.mutate(),
		});
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

	if (isLoading) {
		return (
			<Paper p='md' withBorder>
				<Text c='dimmed'>Loading students...</Text>
			</Paper>
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
				<Group gap='xs'>
					<Menu shadow='md' width={200}>
						<Menu.Target>
							<Button
								variant='default'
								rightSection={<IconChevronDown size={16} />}
								loading={saveMutation.isPending}
							>
								Bulk Action
							</Button>
						</Menu.Target>
						<Menu.Dropdown>
							{statusOptions.map((opt) => (
								<Menu.Item
									key={opt.value}
									leftSection={<opt.icon size={16} />}
									onClick={() => handleBulkSetStatus(opt.value)}
								>
									Mark all as {opt.label}
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>
					<Tooltip label='Delete all attendance for this week'>
						<ActionIcon
							variant='light'
							color='red'
							size='lg'
							onClick={handleDelete}
							loading={deleteMutation.isPending}
						>
							<IconTrash size={18} />
						</ActionIcon>
					</Tooltip>
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
						{filteredStudents.map((student) => (
							<Table.Tr key={student.stdNo}>
								<Table.Td>{student.stdNo}</Table.Td>
								<Table.Td>{student.name}</Table.Td>
								<Table.Td style={{ textAlign: 'right' }}>
									<SegmentedControl
										size='xs'
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
													<opt.icon size={14} />
													<span>{opt.label}</span>
												</Group>
											),
										}))}
										styles={{
											root: {
												backgroundColor: 'transparent',
											},
											indicator: {
												backgroundColor: 'rgba(99, 150, 184, 0.29)',
											},
										}}
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
