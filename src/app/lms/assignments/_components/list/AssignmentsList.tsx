'use client';

import {
	Box,
	Card,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getCourseAssignments } from '../../_server/actions';
import AssignmentCard from './AssignmentCard';

type AssignmentsListProps = {
	courseId: number;
};

function AssignmentCardSkeleton() {
	return (
		<Card padding='md' withBorder>
			<Stack gap='sm'>
				<Card.Section withBorder inheritPadding py='xs'>
					<Group justify='space-between' wrap='nowrap'>
						<Skeleton height={20} width='60%' />
						<Skeleton height={22} width={80} radius='sm' />
					</Group>
				</Card.Section>

				<Skeleton height={16} width='100%' />
				<Skeleton height={16} width='85%' />

				<Card.Section withBorder inheritPadding py='xs'>
					<Group gap='xl'>
						<Group gap='xs'>
							<IconClock size={16} style={{ opacity: 0.3 }} />
							<Skeleton height={14} width={180} />
						</Group>
					</Group>
				</Card.Section>
			</Stack>
		</Card>
	);
}

export default function AssignmentsList({ courseId }: AssignmentsListProps) {
	const { data: assignments, isLoading } = useQuery({
		queryKey: ['course-assignments', courseId],
		queryFn: () => getCourseAssignments(courseId),
	});

	if (isLoading) {
		return (
			<SimpleGrid cols={{ base: 1, sm: 3 }}>
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<AssignmentCardSkeleton key={i} />
				))}
			</SimpleGrid>
		);
	}

	if (!assignments || assignments.length === 0) {
		return (
			<Box ta='center' py='xl'>
				<Text c='dimmed'>No assignments found for this course</Text>
			</Box>
		);
	}

	return (
		<SimpleGrid cols={{ base: 1, sm: 3 }}>
			{assignments.map((assignment) => {
				return (
					<AssignmentCard
						key={assignment.id}
						assignment={assignment}
						courseId={courseId}
					/>
				);
			})}
		</SimpleGrid>
	);
}
