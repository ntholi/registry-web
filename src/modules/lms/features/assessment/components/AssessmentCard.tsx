'use client';

import { Card, Group, Stack, Text } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import Link from 'next/link';
import type { MoodleAssignment } from '../types';
import AssessmentStatus from './AssessmentStatus';

type Props = {
	assignment: MoodleAssignment;
	courseId: number;
};
export default function AssessmentCard({ assignment, courseId }: Props) {
	const dueDate = assignment.duedate
		? new Date(assignment.duedate * 1000)
		: null;
	const isOverdue = dueDate && dueDate < new Date();

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
						<AssessmentStatus
							assignment={assignment}
							size='sm'
							variant='light'
						/>
					</Group>
				</Card.Section>

				{assignment.intro ? (
					<Text py={'xs'} size='sm' lineClamp={2}>
						{shorten(assignment.intro)}
					</Text>
				) : (
					<Text py={'xs'} size='sm' c={'dimmed'}>
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

function shorten(html: string): string {
	const text = html.replace(/<[^>]*>/g, '');
	return text.length > 90 ? `${text.substring(0, 90)}...` : text;
}
