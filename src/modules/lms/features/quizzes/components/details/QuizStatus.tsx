'use client';

import { Badge, type BadgeProps } from '@mantine/core';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import type { MoodleQuiz } from '../../types';

type Props = {
	quiz: MoodleQuiz;
} & Omit<BadgeProps, 'children' | 'color'>;

export default function QuizStatus({ quiz, ...badgeProps }: Props) {
	const now = Date.now() / 1000;
	const isNotYetOpen = quiz.timeopen > 0 && now < quiz.timeopen;
	const isClosed = quiz.timeclose > 0 && now > quiz.timeclose;

	let text: AllStatusType;
	let label: string;

	if (isNotYetOpen) {
		text = 'notyetopen';
		label = 'Not yet open';
	} else if (isClosed) {
		text = 'closed';
		label = 'Closed';
	} else {
		text = 'open';
		label = 'Open';
	}

	return (
		<Badge color={getStatusColor(text)} {...badgeProps}>
			{label}
		</Badge>
	);
}
