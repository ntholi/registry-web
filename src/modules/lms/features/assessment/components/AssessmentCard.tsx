'use client';

import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import Link from 'next/link';
import type { MoodleAssignment } from '../types';

type Props = {
	assignment: MoodleAssignment;
	courseId: number;
};
export default function AssessmentCard({ assignment, courseId }: Props) {
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
		<Card
			key={assignment.id}
			padding='md'
			withBorder
			component={Link}
			href={`/lms/courses/${courseId}/assessments/${assignment.id}`}
			style={{ textDecoration: 'none', color: 'inherit' }}
		>
			<Stack gap='sm'>
				<Card.Section withBorder inheritPadding py='xs'>
					<Group justify='space-between' wrap='nowrap'>
						<Text fw={500} size='md'>
							{assignment.name}
						</Text>
						{isOverdue ? (
							<Badge color='red' size='sm' variant='light'>
								Overdue
							</Badge>
						) : isUpcoming ? (
							<Badge color='teal' size='sm' variant='light'>
								Upcoming
							</Badge>
						) : (
							<Badge color='green' size='sm' variant='light'>
								Active
							</Badge>
						)}
					</Group>
				</Card.Section>

				{assignment.intro ? (
					<Text
						size='sm'
						lineClamp={2}
						dangerouslySetInnerHTML={{ __html: assignment.intro }}
					/>
				) : (
					<Text py={'md'} size='sm' c={'dimmed'}>
						No Description
					</Text>
				)}

				<Card.Section withBorder inheritPadding py='xs'>
					<Group gap='xl'>
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
				</Card.Section>
			</Stack>
		</Card>
	);
}
