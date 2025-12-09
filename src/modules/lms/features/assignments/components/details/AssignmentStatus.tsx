'use client';

import type { BadgeProps } from '@mantine/core';
import { Badge } from '@mantine/core';
import type { MoodleAssignment } from '../../types';

type Props = {
	assignment: MoodleAssignment;
} & Omit<BadgeProps, 'children' | 'color'>;

export default function AssignmentStatus({ assignment, ...badgeProps }: Props) {
	const dueDate = assignment.duedate
		? new Date(assignment.duedate * 1000)
		: null;
	const availableFrom = assignment.allowsubmissionsfromdate
		? new Date(assignment.allowsubmissionsfromdate * 1000)
		: null;
	const now = new Date();
	const isOverdue = dueDate && dueDate < now;
	const isUpcoming = availableFrom && availableFrom > now;

	let color: string;
	let text: string;

	if (isOverdue) {
		color = 'red';
		text = 'Overdue';
	} else if (isUpcoming) {
		color = 'teal';
		text = 'Upcoming';
	} else {
		color = 'green';
		text = 'Active';
	}

	return (
		<Badge color={color} {...badgeProps}>
			{text}
		</Badge>
	);
}
