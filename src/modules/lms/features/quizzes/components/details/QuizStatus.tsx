'use client';

import { Badge, type BadgeProps } from '@mantine/core';
import { getStatusColor } from '@student-portal/utils';
import type { MoodleQuiz } from '../../types';

type Props = {
	quiz: MoodleQuiz;
} & Omit<BadgeProps, 'children' | 'color'>;

export default function QuizStatus({ quiz, ...badgeProps }: Props) {
	const now = Date.now() / 1000;
	const isNotYetOpen = quiz.timeopen > 0 && now < quiz.timeopen;
	const isClosed = quiz.timeclose > 0 && now > quiz.timeclose;

	let text: string;

	if (isNotYetOpen) {
		text = 'Not yet open';
	} else if (isClosed) {
		text = 'Closed';
	} else {
		text = 'Open';
	}

	return (
		<Badge color={getStatusColor(text)} {...badgeProps}>
			{text}
		</Badge>
	);
}
