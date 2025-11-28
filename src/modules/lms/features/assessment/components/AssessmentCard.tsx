'use client';

import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import type { MoodleAssignment } from '../types';

type Props = {
	assignment: MoodleAssignment;
};
export default function AssessmentCard({ assignment }: Props) {
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
		<Card key={assignment.id} padding='md' withBorder>
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
}
