'use client';

import {
	ActionIcon,
	Anchor,
	Avatar,
	CopyButton,
	Flex,
	Group,
	HoverCard,
	Image,
	Paper,
	SegmentedControl,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getStudentPhoto } from '@registry/students';
import {
	IconCalendarOff,
	IconCheck,
	IconCircleCheck,
	IconCircleMinus,
	IconCircleX,
	IconClock,
	IconCopy,
	IconQuestionMark,
	IconSearch,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { AttendanceStatus } from '@/core/database';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { formatPhoneNumber } from '@/shared/lib/utils/utils';
import Link from '@/shared/ui/Link';
import { getAttendanceForWeek, markAttendance } from '../_server/actions';

type Props = {
	semesterModuleId: number;
	termId: number;
	weekNumber: number;
	assignedModuleId: number;
};

type AttendanceStudent = {
	stdNo: number;
	name: string;
	phone: string | null;
	email: string | null;
	attendanceId: number | null;
	status: AttendanceStatus;
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
	const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('not_marked');
	const attendanceWeekKey = [
		'attendance-week',
		semesterModuleId,
		termId,
		weekNumber,
	] as const;
	const attendanceSummaryKey = [
		'attendance-summary',
		semesterModuleId,
		termId,
	] as const;

	const { data: students, isLoading } = useQuery({
		queryKey: attendanceWeekKey,
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
		onMutate: async (records) => {
			await queryClient.cancelQueries({ queryKey: attendanceWeekKey });
			const previous =
				queryClient.getQueryData<AttendanceStudent[]>(attendanceWeekKey);
			if (previous) {
				const statusMap = new Map(
					records.map((record) => [record.stdNo, record.status])
				);
				queryClient.setQueryData<AttendanceStudent[]>(
					attendanceWeekKey,
					previous.map((student) => {
						const nextStatus = statusMap.get(student.stdNo);
						if (!nextStatus) return student;
						return { ...student, status: nextStatus };
					})
				);
			}
			return { previous };
		},
		onError: (_error, _records, context) => {
			if (context?.previous) {
				queryClient.setQueryData(attendanceWeekKey, context.previous);
			}
			notifications.show({
				title: 'Error',
				message: 'Failed to save attendance',
				color: 'red',
			});
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: attendanceWeekKey });
			queryClient.invalidateQueries({ queryKey: attendanceSummaryKey });
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

	if (isLoading) {
		return (
			<Stack gap='md'>
				<Flex justify='space-between' w={'100%'} align='flex-end' mb='sm'>
					<Skeleton h={36} w={400} radius='md' />
					<Stack align='flex-start' gap={5}>
						<Skeleton h={14} w={240} radius='md' />
						<Skeleton h={36} w={560} radius='md' />
					</Stack>
				</Flex>
				<Paper withBorder>
					<Table striped>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Student No</Table.Th>
								<Table.Th>Student</Table.Th>
								<Table.Th style={{ textAlign: 'right' }}>Status</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{Array.from({ length: 10 }).map((_, index) => (
								<Table.Tr key={`skeleton-${index}`}>
									<Table.Td>
										<Group gap='sm'>
											<Skeleton h={32} w={32} circle />
											<Skeleton h={16} w={80} />
										</Group>
									</Table.Td>
									<Table.Td>
										<Skeleton h={16} w='70%' />
									</Table.Td>
									<Table.Td>
										<Group justify='flex-end'>
											<Skeleton h={36} w={220} radius='md' />
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
			<Flex justify='space-between' w={'100%'} align='flex-end' mb='sm'>
				<TextInput
					placeholder='Search by name or student number...'
					leftSection={<IconSearch size={16} />}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.currentTarget.value)}
					style={{ flex: 1, maxWidth: 450 }}
				/>
				<Stack align='flex-start' gap={5}>
					<Text size='xs' c='dimmed' pl={2}>
						Mark all students or edit individually.
					</Text>
					<SegmentedControl
						bg={'dark.7'}
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
				</Stack>
			</Flex>

			<Paper withBorder>
				<Table striped>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Student No</Table.Th>
							<Table.Th>Student</Table.Th>
							<Table.Th style={{ textAlign: 'right' }}>Status</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{filteredStudents.map((student) => (
							<Table.Tr key={student.stdNo}>
								<Table.Td>
									<Group gap='sm' wrap='nowrap'>
										<StudentAvatar
											stdNo={student.stdNo}
											name={student.name}
											email={student.email}
											phone={student.phone}
										/>
										<Anchor
											component={Link}
											href={`/registry/students/${student.stdNo}`}
										>
											{student.stdNo}
										</Anchor>
									</Group>
								</Table.Td>
								<Table.Td>
									<Text>{student.name}</Text>
								</Table.Td>
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

type StudentAvatarProps = {
	stdNo: number;
	name: string;
	email: string | null;
	phone: string | null;
};

function StudentAvatar({ stdNo, name, email, phone }: StudentAvatarProps) {
	const { data: photoUrl } = useQuery({
		queryKey: ['attendance-student-photo', stdNo],
		queryFn: () => getStudentPhoto(stdNo),
		staleTime: 1000 * 60 * 3,
	});

	return (
		<HoverCard withArrow openDelay={150} closeDelay={100} position='right'>
			<HoverCard.Target>
				<Avatar src={photoUrl} size='md' radius='xl'>
					{name
						.split(' ')
						.map((part) => part[0])
						.join('')
						.slice(0, 2)
						.toUpperCase()}
				</Avatar>
			</HoverCard.Target>
			<HoverCard.Dropdown p='xs'>
				<Stack gap='xs' align='center'>
					{photoUrl ? (
						<Image
							src={photoUrl}
							alt={name}
							w={180}
							h={180}
							fit='cover'
							radius='md'
						/>
					) : (
						<Avatar size={180} radius='md'>
							{name
								.split(' ')
								.map((part) => part[0])
								.join('')
								.slice(0, 2)
								.toUpperCase()}
						</Avatar>
					)}
					<Text size='xs' c='dimmed' ta='center'>
						{name}
					</Text>
					<ContactValue
						label='Email'
						value={email}
						copyValue={email}
						href={email ? `mailto:${email}` : undefined}
						showLabel={false}
					/>
					<ContactValue
						label='Phone'
						value={phone ? formatPhoneNumber(phone) : null}
						copyValue={phone}
						href={phone ? `tel:${phone}` : undefined}
						showLabel={false}
					/>
				</Stack>
			</HoverCard.Dropdown>
		</HoverCard>
	);
}

type ContactValueProps = {
	label: string;
	value: string | null;
	copyValue: string | null;
	href?: string;
	showLabel?: boolean;
	copyable?: boolean;
};

function ContactValue({
	label,
	value,
	copyValue,
	href,
	showLabel = true,
	copyable = true,
}: ContactValueProps) {
	if (!value) {
		return (
			<Group gap={4} wrap='nowrap'>
				{showLabel && (
					<Text size='xs' c='dimmed' w={42}>
						{label}
					</Text>
				)}
				<Text size='sm' c='dimmed'>
					N/A
				</Text>
			</Group>
		);
	}

	return (
		<Group gap={4} wrap='nowrap'>
			{showLabel && (
				<Text size='xs' c='dimmed' w={42}>
					{label}
				</Text>
			)}
			{href ? (
				<Anchor component={Link} href={href} size='sm'>
					{value}
				</Anchor>
			) : (
				<Text size='sm'>{value}</Text>
			)}
			{copyable && (
				<CopyButton value={copyValue ?? ''}>
					{({ copied, copy }) => (
						<Tooltip label={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}>
							<ActionIcon
								variant='subtle'
								size='sm'
								color={copied ? 'green' : 'gray'}
								onClick={copy}
							>
								{copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
							</ActionIcon>
						</Tooltip>
					)}
				</CopyButton>
			)}
		</Group>
	);
}
