'use client';

import {
	Badge,
	Group,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Table,
	Text,
	Tooltip,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { AttendanceStatus } from '@/core/database';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { getAttendanceSummary, getWeeksForTerm } from '../_server/actions';

type Props = {
	semesterModuleId: number;
	termId: number;
};

function StatusBadge({ status }: { status: AttendanceStatus }) {
	const labelMap: Record<AttendanceStatus, string> = {
		present: 'P',
		absent: 'A',
		late: 'L',
		excused: 'E',
		no_class: 'NC',
		not_marked: '-',
	};

	const tooltipMap: Record<AttendanceStatus, string> = {
		present: 'Present',
		absent: 'Absent',
		late: 'Late',
		excused: 'Excused',
		no_class: 'No Class',
		not_marked: 'Not Marked',
	};

	return (
		<Tooltip label={tooltipMap[status]}>
			<Badge
				size='sm'
				variant={status === 'not_marked' ? 'outline' : 'filled'}
				color={getStatusColor(status)}
				radius='sm'
				w={28}
			>
				{labelMap[status]}
			</Badge>
		</Tooltip>
	);
}

function AttendanceRateBadge({ rate }: { rate: number }) {
	let color = 'green';
	if (rate < 50) color = 'red';
	else if (rate < 75) color = 'orange';
	else if (rate < 90) color = 'yellow';

	return (
		<Badge variant='light' color={color}>
			{rate}%
		</Badge>
	);
}

export default function AttendanceSummary({ semesterModuleId, termId }: Props) {
	const { data: summary, isLoading: summaryLoading } = useQuery({
		queryKey: ['attendance-summary', semesterModuleId, termId],
		queryFn: () => getAttendanceSummary(semesterModuleId, termId),
	});

	const { data: weeks } = useQuery({
		queryKey: ['term-weeks', termId],
		queryFn: () => getWeeksForTerm(termId),
	});

	if (summaryLoading) {
		return (
			<Stack gap='md'>
				<Group gap='lg'>
					{Array.from({ length: 6 }).map((_, i) => (
						<Group key={i} gap='xs'>
							<Skeleton h={20} w={20} radius='sm' />
							<Skeleton h={12} w={60} radius='sm' />
						</Group>
					))}
				</Group>

				<Paper withBorder>
					<Table striped withTableBorder>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Student</Table.Th>
								{Array.from({ length: 14 }).map((_, i) => (
									<Table.Th key={i}>W{i + 1}</Table.Th>
								))}
								<Table.Th>Rate</Table.Th>
								<Table.Th>P</Table.Th>
								<Table.Th>A</Table.Th>
								<Table.Th>L</Table.Th>
								<Table.Th>E</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{Array.from({ length: 10 }).map((_, i) => (
								<Table.Tr key={i}>
									<Table.Td>
										<Stack gap={4}>
											<Skeleton h={14} w={120} />
											<Skeleton h={10} w={80} />
										</Stack>
									</Table.Td>
									{Array.from({ length: 14 }).map((_, j) => (
										<Table.Td key={j}>
											<Skeleton h={20} w={20} radius='sm' m='auto' />
										</Table.Td>
									))}
									<Table.Td>
										<Skeleton h={20} w={40} radius='xl' m='auto' />
									</Table.Td>
									{Array.from({ length: 4 }).map((_, j) => (
										<Table.Td key={j}>
											<Skeleton h={14} w={20} m='auto' />
										</Table.Td>
									))}
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Paper>
			</Stack>
		);
	}

	if (!summary || summary.length === 0) {
		return (
			<Paper p='md' withBorder>
				<Text c='dimmed'>No attendance records found for this module.</Text>
			</Paper>
		);
	}

	const totalWeeks = weeks?.length ?? summary[0]?.totalWeeks ?? 0;

	return (
		<Stack gap='md'>
			<Group gap='lg'>
				<Group gap='xs'>
					<StatusBadge status='present' />
					<Text size='xs'>Present</Text>
				</Group>
				<Group gap='xs'>
					<StatusBadge status='absent' />
					<Text size='xs'>Absent</Text>
				</Group>
				<Group gap='xs'>
					<StatusBadge status='late' />
					<Text size='xs'>Late</Text>
				</Group>
				<Group gap='xs'>
					<StatusBadge status='excused' />
					<Text size='xs'>Excused</Text>
				</Group>
				<Group gap='xs'>
					<StatusBadge status='no_class' />
					<Text size='xs'>No Class</Text>
				</Group>
				<Group gap='xs'>
					<StatusBadge status='not_marked' />
					<Text size='xs'>Not Marked</Text>
				</Group>
			</Group>

			<ScrollArea>
				<Table striped highlightOnHover withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th
								style={{
									position: 'sticky',
									left: 0,
									background: 'var(--mantine-color-body)',
									zIndex: 1,
								}}
							>
								Student
							</Table.Th>
							{Array.from({ length: totalWeeks }, (_, i) => (
								<Table.Th key={i + 1} ta='center' style={{ minWidth: 45 }}>
									W{i + 1}
								</Table.Th>
							))}
							<Table.Th ta='center'>Rate</Table.Th>
							<Table.Th ta='center'>P</Table.Th>
							<Table.Th ta='center'>A</Table.Th>
							<Table.Th ta='center'>L</Table.Th>
							<Table.Th ta='center'>E</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{summary.map((student) => (
							<Table.Tr key={student.stdNo}>
								<Table.Td
									style={{
										position: 'sticky',
										left: 0,
										background: 'var(--mantine-color-body)',
										zIndex: 1,
									}}
								>
									<Stack gap={0}>
										<Text size='sm' fw={500} lineClamp={1}>
											{student.name}
										</Text>
										<Text size='xs' c='dimmed'>
											{student.stdNo}
										</Text>
									</Stack>
								</Table.Td>
								{student.weeklyAttendance.map((wa) => (
									<Table.Td key={wa.weekNumber} ta='center'>
										<StatusBadge status={wa.status as AttendanceStatus} />
									</Table.Td>
								))}
								{Array.from(
									{ length: totalWeeks - student.weeklyAttendance.length },
									(_, i) => (
										<Table.Td key={`empty-${i}`} ta='center'>
											<StatusBadge status='not_marked' />
										</Table.Td>
									)
								)}
								<Table.Td ta='center'>
									<AttendanceRateBadge rate={student.attendanceRate} />
								</Table.Td>
								<Table.Td ta='center'>
									<Text size='sm' c='green'>
										{student.presentCount}
									</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Text size='sm' c='red'>
										{student.absentCount}
									</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Text size='sm' c='yellow'>
										{student.lateCount}
									</Text>
								</Table.Td>
								<Table.Td ta='center'>
									<Text size='sm' c='blue'>
										{student.excusedCount}
									</Text>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Stack>
	);
}
