'use client';

import {
	Avatar,
	Box,
	Button,
	Card,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getEnrolledStudents } from '../server/actions';
import type { MoodleEnrolledUser } from '../types';
import AddStudentModal from './AddStudentModal';

type StudentsListProps = {
	courseId: number;
};

function StudentCardSkeleton() {
	return (
		<Card padding='md' withBorder>
			<Group>
				<Skeleton height={40} circle />
				<Stack gap={4} style={{ flex: 1 }}>
					<Skeleton height={16} width='60%' />
					<Skeleton height={12} width='40%' />
				</Stack>
			</Group>
		</Card>
	);
}

function StudentCard({ student }: { student: MoodleEnrolledUser }) {
	return (
		<Card padding='md' withBorder>
			<Group>
				<Avatar
					src={student.profileimageurl}
					alt={student.fullname}
					radius='xl'
					size='md'
				>
					<IconUser size={20} />
				</Avatar>
				<Stack gap={2} style={{ flex: 1 }}>
					<Text size='sm' fw={500} lineClamp={1}>
						{student.fullname}
					</Text>
					<Text size='xs' c='dimmed' lineClamp={1}>
						{student.email}
					</Text>
				</Stack>
			</Group>
		</Card>
	);
}

export default function StudentsList({ courseId }: StudentsListProps) {
	const {
		data: students,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['course-students', courseId],
		queryFn: () => getEnrolledStudents(courseId),
	});

	if (isLoading) {
		return (
			<Stack gap='md'>
				<Group justify='flex-end'>
					<Button disabled>Add Student</Button>
				</Group>
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<StudentCardSkeleton key={i} />
					))}
				</SimpleGrid>
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
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
					{students.map((student) => (
						<StudentCard key={student.id} student={student} />
					))}
				</SimpleGrid>
			)}
		</Stack>
	);
}
