'use client';

import type { BadgeProps } from '@mantine/core';
import { Badge } from '@mantine/core';
import { getAssignmentStatusColor } from '@/shared/lib/utils/colors';
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
	const isOverdue = !!(dueDate && dueDate < now);
	const isUpcoming = !!(availableFrom && availableFrom > now);
	const isDraft = assignment.visible === 0;

	const { label, color } = getAssignmentStatusColor(isOverdue, isUpcoming, isDraft);

	return (
		<Badge color={color} {...badgeProps}>
			{label}
		</Badge>
	);
}
