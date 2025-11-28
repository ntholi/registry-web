'use client';

import { Anchor, Box, Skeleton, Table, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { formatPhoneNumber, formatSemester } from '@/shared/lib/utils/utils';
import { getEnrolledStudentsFromDB } from '../server/actions';
import StudentPhotoCell from './StudentPhotoCell';

type StudentsListProps = {
	courseId: number;
};

function stripPhoneNumber(phone: string | null | undefined) {
	if (!phone) return '';
	return phone
		.replaceAll(' ', '')
		.replaceAll('-', '')
		.replaceAll('(', '')
		.replaceAll(')', '');
}

function TableSkeleton() {
	return (
		<Table.Tbody>
			{[1, 2, 3, 4, 5].map((i) => (
				<Table.Tr key={i}>
					<Table.Td w={50}>
						<Skeleton height={32} width={32} circle />
					</Table.Td>
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
	const { data: students, isLoading } = useQuery({
		queryKey: ['course-students', courseId],
		queryFn: () => getEnrolledStudentsFromDB(courseId),
	});

	if (isLoading) {
		return (
			<Table striped highlightOnHover withTableBorder withColumnBorders>
				<Table.Thead>
					<Table.Tr>
						<Table.Th w={50}></Table.Th>
						<Table.Th>Student Number</Table.Th>
						<Table.Th>Name</Table.Th>
						<Table.Th>Class</Table.Th>
						<Table.Th>Email</Table.Th>
						<Table.Th>Phone</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<TableSkeleton />
			</Table>
		);
	}

	return (
		<>
			{!students || students.length === 0 ? (
				<Box ta='center' py='xl'>
					<Text c='dimmed'>No students enrolled in this course</Text>
				</Box>
			) : (
				<Table striped highlightOnHover withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th w={50}></Table.Th>
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
								<Table.Td>
									<StudentPhotoCell stdNo={student.stdNo} name={student.name} />
								</Table.Td>
								<Table.Td>
									<Anchor
										href={`/registry/students/${student.stdNo}`}
										size='sm'
									>
										{student.stdNo}
									</Anchor>
								</Table.Td>
								<Table.Td>{student.name}</Table.Td>
								<Table.Td>
									{`${student.programCode}${formatSemester(student.semesterNumber, 'mini')}`}
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
										<Anchor
											href={`tel:${stripPhoneNumber(formatPhoneNumber(student.phone))}`}
											size='sm'
										>
											{formatPhoneNumber(student.phone)}
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
		</>
	);
}
