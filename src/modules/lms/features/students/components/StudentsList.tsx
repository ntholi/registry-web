'use client';

import {
	Anchor,
	Box,
	Group,
	Skeleton,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { toClassName } from '@/shared/lib/utils/utils';
import { getEnrolledStudentsFromDB } from '../server/actions';
import AddStudentModal from './AddStudentModal';

type StudentsListProps = {
	courseId: number;
};

function TableSkeleton() {
	return (
		<Table.Tbody>
			{[1, 2, 3, 4, 5].map((i) => (
				<Table.Tr key={i}>
					<Table.Td>
						<Skeleton height={16} width='80%' />
					</Table.Td>
					<Table.Td>
						<Skeleton height={16} width='70%' />
					</Table.Td>
					<Table.Td>
						<Skeleton height={16} width='60%' />
					</Table.Td>
					<Table.Td>
						<Skeleton height={16} width='65%' />
					</Table.Td>
					<Table.Td>
						<Skeleton height={16} width='50%' />
					</Table.Td>
				</Table.Tr>
			))}
		</Table.Tbody>
	);
}

export default function StudentsList({ courseId }: StudentsListProps) {
	const {
		data: students,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['course-students', courseId],
		queryFn: () => getEnrolledStudentsFromDB(courseId),
	});

	if (isLoading) {
		return (
			<Stack gap='md'>
				<Group justify='flex-end'>
					<AddStudentModal courseId={courseId} onSuccess={() => refetch()} />
				</Group>
				<Table striped highlightOnHover withTableBorder withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Student Number</Table.Th>
							<Table.Th>Name</Table.Th>
							<Table.Th>Class</Table.Th>
							<Table.Th>Email</Table.Th>
							<Table.Th>Phone</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<TableSkeleton />
				</Table>
			</Stack>
		);
	}

	return (
		<Stack gap='md'>
			<Group justify='flex-end'>
				<AddStudentModal courseId={courseId} onSuccess={() => refetch()} />
			</Group>
			{!students || students.length === 0 ? (
				<Box ta='center' py='xl'>
					<Text c='dimmed'>No students enrolled in this course</Text>
				</Box>
			) : (
				<Table striped highlightOnHover withTableBorder withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Student Number</Table.Th>
							<Table.Th>Name</Table.Th>
							<Table.Th>Class</Table.Th>
							<Table.Th>Email</Table.Th>
							<Table.Th>Phone</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{students.map((student) => (
							<Table.Tr key={student.stdNo}>
								<Table.Td>{student.stdNo}</Table.Td>
								<Table.Td>{student.name}</Table.Td>
								<Table.Td>
									{toClassName(student.programCode, student.semesterNumber)}
								</Table.Td>
								<Table.Td>
									{student.email ? (
										<Anchor href={`mailto:${student.email}`} size='sm'>
											{student.email}
										</Anchor>
									) : (
										<Text c='dimmed' size='sm'>
											N/A
										</Text>
									)}
								</Table.Td>
								<Table.Td>
									{student.phone ? (
										<Anchor href={`tel:${student.phone}`} size='sm'>
											{student.phone}
										</Anchor>
									) : (
										<Text c='dimmed' size='sm'>
											N/A
										</Text>
									)}
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
		</Stack>
	);
}
