'use client';

import { Badge, Box, Card, Group, Loader, Stack, Text } from '@mantine/core';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getCourseAssignments } from '../server/actions';

type AssessmentsListProps = {
	courseId: number;
};

export default function AssessmentsList({ courseId }: AssessmentsListProps) {
	const { data: assignments, isLoading } = useQuery({
		queryKey: ['course-assignments', courseId],
		queryFn: () => getCourseAssignments(courseId),
	});

	if (isLoading) {
		return (
			<Box ta='center' py='xl'>
				<Loader />
			</Box>
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
		<Stack gap='md'>
			{assignments.map((assignment) => {
				const dueDate = assignment.duedate
					? new Date(assignment.duedate * 1000)
					: null;
				const availableFrom = assignment.allowsubmissionsfromdate
					? new Date(assignment.allowsubmissionsfromdate * 1000)
					: null;
				const now = new Date();
				const isOverdue = dueDate && dueDate < now;
				const isUpcoming = availableFrom && availableFrom > now;

				return (
					<Card key={assignment.id} shadow='xs' padding='md' withBorder>
						<Stack gap='sm'>
							<Group justify='space-between' wrap='nowrap'>
								<Text fw={500} size='md'>
									{assignment.name}
								</Text>
								{isOverdue ? (
									<Badge color='red' size='sm'>
										Overdue
									</Badge>
								) : isUpcoming ? (
									<Badge color='blue' size='sm'>
										Upcoming
									</Badge>
								) : (
									<Badge color='green' size='sm'>
										Active
									</Badge>
								)}
							</Group>

							{assignment.intro && (
								<Text
									size='sm'
									c='dimmed'
									lineClamp={2}
									dangerouslySetInnerHTML={{ __html: assignment.intro }}
								/>
							)}

							<Group gap='xl'>
								{availableFrom && (
									<Group gap='xs'>
										<IconCalendar size={16} />
										<Text size='xs' c='dimmed'>
											Available: {availableFrom.toLocaleDateString()}
										</Text>
									</Group>
								)}
								{dueDate && (
									<Group gap='xs'>
										<IconClock size={16} />
										<Text size='xs' c={isOverdue ? 'red' : 'dimmed'}>
											Due: {dueDate.toLocaleDateString()} at{' '}
											{dueDate.toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit',
											})}
										</Text>
									</Group>
								)}
							</Group>
						</Stack>
					</Card>
				);
			})}
		</Stack>
	);
}
